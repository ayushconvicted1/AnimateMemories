import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getFontFamily } from "@/constants/Fonts";
import AnimatedTemplateThumb from "@/components/ui/AnimatedTemplateThumb";
import {
  templateAudioCoordinator,
  isAudioTemplate as checkIsAudioTemplate,
} from "@/services/templateAudioCoordinator";
import { trackSearch, trackViewContent } from "@/services/tracking";

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "https://www.animatememories.com";

const formatImageUrl = (url?: string | null) => {
  if (!url) return "";
  let formatted = String(url).trim();
  if (
    formatted.startsWith("http://") ||
    formatted.startsWith("https://") ||
    formatted.startsWith("data:")
  ) {
    try {
      return encodeURI(formatted);
    } catch {
      return formatted;
    }
  }
  const full = `${API_BASE_URL}${formatted.startsWith("/") ? "" : "/"}${formatted}`;
  try {
    return encodeURI(full);
  } catch {
    return full;
  }
};

interface TemplateExplorerModalProps {
  visible: boolean;
  onClose: () => void;
  templates: any[];
  onSelect: (id: string) => void;
  initialCategory?: string;
}

export default function TemplateExplorerModal({
  visible,
  onClose,
  templates,
  onSelect,
  initialCategory = "all",
}: TemplateExplorerModalProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState(initialCategory || "all");
  const visibleItemIdsRef = useRef<string[]>([]);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const isDraggingRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cardWidth = Math.floor((width - 48) / 2);

  // Sync initial category when modal opens
  useEffect(() => {
    if (visible) {
      setActiveCategory(initialCategory || "all");
      setQuery("");
    }
  }, [visible, initialCategory]);

  const categories = useMemo(() => {
    const unique = new Map<string, string>();
    templates.forEach((template) => {
      const raw = String(template.category || template.categoryId || "").trim();
      // Split comma-separated categories into individual entries
      raw.split(/[\s,]+/).filter(Boolean).forEach((cat) => {
        const lower = cat.toLowerCase();
        if (!unique.has(lower)) unique.set(lower, cat.charAt(0).toUpperCase() + cat.slice(1));
      });
    });
    return [{ id: "all", label: "All" }, ...Array.from(unique, ([id, label]) => ({ id, label }))];
  }, [templates]);

  const visibleTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return templates.filter((template) => {
      const category = String(template.category || template.categoryId || "").toLowerCase();
      // Split comma-separated categories (e.g., "Viral, Birthday")
      const cats = category.split(/[\s,]+/).filter(Boolean);
      const matchesCategory = activeCategory === "all" || cats.includes(activeCategory) ||
        ((activeCategory === "viral" || activeCategory === "trending") &&
         (cats.includes("viral") || cats.includes("trending")));
      const content = `${template.name || ""} ${template.prompt || ""}`.toLowerCase();
      return matchesCategory && (!normalizedQuery || content.includes(normalizedQuery));
    });
  }, [activeCategory, query, templates]);

  const visibleTemplateIds = useMemo(() => {
    return visibleTemplates.map((t) => String(t.slug || t.id)).filter(Boolean);
  }, [visibleTemplates]);

  // Synchronize activeVideoId and visibleItemIdsRef whenever modal opens or filtered items change
  useEffect(() => {
    if (visible && visibleTemplateIds.length > 0) {
      setActiveVideoId((prev) => {
        if (prev && visibleTemplateIds.includes(prev)) return prev;
        return visibleTemplateIds[0];
      });
      if (
        visibleItemIdsRef.current.length === 0 ||
        !visibleItemIdsRef.current.some((id) => visibleTemplateIds.includes(id))
      ) {
        visibleItemIdsRef.current = visibleTemplateIds.slice(0, 4);
      }
    }
  }, [visible, visibleTemplateIds]);

  // Advance to the next visible card in continuous round-robin loop
  const advanceToNextVideo = useCallback(() => {
    const visible =
      visibleItemIdsRef.current.length > 0
        ? visibleItemIdsRef.current
        : visibleTemplateIds.slice(0, 4);
    if (!visible || visible.length === 0) return;

    // Stop audio on the card that just finished playing before advancing
    const currentAudioId = templateAudioCoordinator.getActiveId();
    if (currentAudioId) {
      templateAudioCoordinator.stopAudio(currentAudioId);
    }

    if (visible.length === 1) {
      // Only 1 item visible: toggle to trigger replay of this single card
      setActiveVideoId(null);
      setTimeout(() => {
        setActiveVideoId(visible[0]);
      }, 50);
      return;
    }
    setActiveVideoId((prevId) => {
      const currentIndex = visible.indexOf(prevId || "");
      if (currentIndex === -1) {
        return visible[0];
      }
      const nextIndex = (currentIndex + 1) % visible.length;
      return visible[nextIndex];
    });
  }, [visibleTemplateIds]);

  // Video plays in full and advances naturally via onPlaybackFinished.
  // 15s safety watchdog: only intervenes if a video stream hangs or disconnects.
  useEffect(() => {
    const available =
      visibleItemIdsRef.current.length > 0
        ? visibleItemIdsRef.current
        : visibleTemplateIds.slice(0, 4);
    if (!visible || available.length <= 1) return;
    const watchdog = setTimeout(() => {
      advanceToNextVideo();
    }, 15000);
    return () => clearTimeout(watchdog);
  }, [activeVideoId, visible, visibleTemplateIds, advanceToNextVideo]);

  // Clear active decoders and stop audio when modal is hidden
  useEffect(() => {
    if (!visible) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      visibleItemIdsRef.current = [];
      setActiveVideoId(null);
      templateAudioCoordinator.stopAudio();
    }
  }, [visible]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 30,
    waitForInteraction: false,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (viewableItems && viewableItems.length > 0) {
        const ids = viewableItems
          .map((v: any) => String(v.item?.slug || v.item?.id))
          .filter(Boolean);
        if (ids.length > 0) {
          visibleItemIdsRef.current = ids;
        }

        // Stop template audio immediately if the playing card is scrolled out of view
        const activeAudioId = templateAudioCoordinator.getActiveId();
        if (activeAudioId && !ids.includes(activeAudioId)) {
          templateAudioCoordinator.stopAudio(activeAudioId);
        }
      }

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      // Debounce video activation during rapid continuous scrolling to prevent decoder thrashing
      debounceTimerRef.current = setTimeout(() => {
        const ids = visibleItemIdsRef.current;
        if (ids.length > 0) {
          const activeAudioId = templateAudioCoordinator.getActiveId();
          setActiveVideoId((prevId) => {
            if (activeAudioId && ids.includes(activeAudioId)) return activeAudioId;
            if (prevId && ids.includes(prevId)) return prevId;
            return ids[0];
          });
        }
      }, 120);
    }
  ).current;

  useEffect(() => {
    if (!query.trim()) return;
    const timer = setTimeout(() => {
      trackSearch({
        search_term: query.trim(),
        search_type: "templates",
        results_count: visibleTemplates.length,
      });
    }, 600);
    return () => clearTimeout(timer);
  }, [query, visibleTemplates.length]);

  const selectTemplate = (template: any) => {
    trackViewContent({
      template_name: template.name || template.slug || template.id,
      category: template.category || activeCategory || "All",
    });
    templateAudioCoordinator.stopAudio();
    onClose();
    onSelect(template.slug || template.id);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheetContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>ANIMATE MEMORIES</Text>
              <Text style={styles.title}>Explore AI Templates</Text>
              <Text style={styles.subtitle}>Pick a motion for your photo</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityLabel="Close template viewer">
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>⌕</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search templates..."
              placeholderTextColor="#94A3B8"
              style={styles.searchInput}
              returnKeyType="search"
            />
          </View>

          {/* Categories Horizontal Filter Pills */}
          <View style={styles.categoriesWrapper}>
            <FlatList
              horizontal
              data={categories}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
              renderItem={({ item }) => {
                const active = activeCategory === item.id;
                return (
                  <TouchableOpacity
                    onPress={() => setActiveCategory(item.id)}
                    activeOpacity={0.8}
                    style={[styles.pill, active && styles.pillActive]}
                  >
                    <Text style={[styles.pillText, active && styles.pillTextActive]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {/* Templates Grid */}
          <FlatList
            key={`templates-${cardWidth}`}
            data={visibleTemplates}
            keyExtractor={(item, index) => String(item.slug || item.id || index)}
            numColumns={2}
            columnWrapperStyle={visibleTemplates.length > 1 ? styles.row : undefined}
            contentContainerStyle={[styles.grid, { paddingBottom: Math.max(insets.bottom + 85, 100) }]}
            showsVerticalScrollIndicator={false}
            initialNumToRender={6}
            maxToRenderPerBatch={4}
            windowSize={5}
            removeClippedSubviews={false}
            viewabilityConfig={viewabilityConfig}
            onViewableItemsChanged={onViewableItemsChanged}
            onScrollBeginDrag={() => {
              isDraggingRef.current = true;
            }}
            onScrollEndDrag={() => {
              isDraggingRef.current = false;
              const ids = visibleItemIdsRef.current;
              if (ids.length > 0) {
                setActiveVideoId((prev) => (prev && ids.includes(prev) ? prev : ids[0]));
              }
            }}
            onMomentumScrollEnd={() => {
              isDraggingRef.current = false;
              const ids = visibleItemIdsRef.current;
              if (ids.length > 0) {
                setActiveVideoId((prev) => (prev && ids.includes(prev) ? prev : ids[0]));
              }
            }}
            renderItem={({ item }) => {
              const itemId = String(item.slug || item.id);
              const videoUrl = item.videoUrl || item.videourl || item.video_url || null;
              const thumbnailUrl = item.thumbnailUrl || item.thumbnailurl || item.thumbnail_url || null;
              return (
                <View style={[styles.card, { width: cardWidth }]}>
                  <View style={[styles.imageWrap, { height: cardWidth * 1.25 }]}>
                    <AnimatedTemplateThumb
                      id={itemId}
                      hasAudio={Boolean(item.hasAudio || item.hasaudio || checkIsAudioTemplate(item) || itemId === "mic-drop-rap" || itemId === "groove-duo")}
                      videoUrl={videoUrl ? formatImageUrl(videoUrl) : null}
                      thumbnailUrl={thumbnailUrl ? formatImageUrl(thumbnailUrl) : null}
                      image={item.image || null}
                      autoPlay={activeVideoId === itemId}
                      onPlaybackFinished={activeVideoId === itemId ? advanceToNextVideo : undefined}
                      onPressCard={() => selectTemplate(item)}
                      style={styles.image}
                    />
                    {!!item.category && (() => {
                      // For multi-category templates, show the primary non-Viral category
                      const cats = String(item.category).split(/[\s,]+/).filter(Boolean);
                      const displayCat = cats.length > 1
                        ? (cats.find(c => c.toLowerCase() !== "viral" && c.toLowerCase() !== "trending") || cats[0])
                        : cats[0];
                      return displayCat ? (
                        <View style={styles.categoryBadgeWrap} pointerEvents="none">
                          <Text style={styles.categoryBadgeText}>{displayCat}</Text>
                        </View>
                      ) : null;
                    })()}
                  </View>
                  <TouchableOpacity
                    style={styles.cardFooter}
                    onPress={() => selectTemplate(item)}
                    activeOpacity={0.8}
                  >
                    <Text numberOfLines={1} style={styles.cardTitle}>
                      {item.name || "AI Template"}
                    </Text>
                    <Text style={styles.arrow}>›</Text>
                  </TouchableOpacity>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No templates found</Text>
                <Text style={styles.emptyCopy}>Try another search or category.</Text>
              </View>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  sheetContainer: {
    maxHeight: "80%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    paddingTop: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  eyebrow: {
    color: "#8B5CF6",
    fontSize: 12,
    letterSpacing: 1.4,
    fontFamily: getFontFamily("600"),
    marginBottom: 3,
  },
  title: {
    color: "#111827",
    fontSize: 24,
    fontFamily: getFontFamily("600"),
  },
  subtitle: {
    color: "#64748B",
    fontSize: 15,
    marginTop: 2,
    fontFamily: getFontFamily("500"),
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
  },
  closeText: {
    color: "#475569",
    fontSize: 26,
    lineHeight: 26,
    fontFamily: getFontFamily("400"),
  },
  searchWrap: {
    height: 44,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
  },
  searchIcon: {
    color: "#94A3B8",
    fontSize: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    color: "#0F172A",
    fontSize: 16,
    fontFamily: getFontFamily("500"),
  },
  categoriesWrapper: {
    marginBottom: 12,
    paddingVertical: 4,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 10,
  },
  pill: {
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 18,
    paddingVertical: 10,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 38,
  },
  pillActive: {
    backgroundColor: "#8B5CF6",
  },
  pillText: {
    color: "#64748B",
    fontSize: 16,
    fontFamily: getFontFamily("600"),
    includeFontPadding: false,
    textAlign: "center",
  },
  pillTextActive: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: getFontFamily("600"),
    includeFontPadding: false,
    textAlign: "center",
  },
  grid: {
    paddingHorizontal: 20,
    paddingTop: 2,
  },
  row: {
    justifyContent: "space-between",
  },
  card: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    shadowColor: "#0F172A",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  imageWrap: {
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholder: {
    flex: 1,
    backgroundColor: "#E2E8F0",
  },
  categoryBadgeWrap: {
    position: "absolute",
    top: 8,
    left: 8,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  categoryBadgeText: {
    color: "#7C3AED",
    fontFamily: getFontFamily("600"),
    fontSize: 11,
    textTransform: "uppercase",
    includeFontPadding: false,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    paddingHorizontal: 11,
    paddingVertical: 10,
  },
  cardTitle: {
    flex: 1,
    color: "#1E293B",
    fontSize: 15,
    fontFamily: getFontFamily("600"),
  },
  arrow: {
    color: "#8B5CF6",
    fontSize: 24,
    lineHeight: 18,
    fontFamily: getFontFamily("500"),
  },
  empty: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: "#334155",
    fontSize: 19,
    fontFamily: getFontFamily("600"),
  },
  emptyCopy: {
    color: "#64748B",
    fontSize: 15,
    marginTop: 4,
    fontFamily: getFontFamily("400"),
  },
});
