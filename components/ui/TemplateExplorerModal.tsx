import React, { useEffect, useMemo, useRef, useState } from "react";
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

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || "https://www.animatememories.com";

const formatImageUrl = (url?: string) => {
  if (!url || url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url || "";
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

interface TemplateExplorerModalProps {
  visible: boolean;
  onClose: () => void;
  templates: any[];
  onSelect: (id: string) => void;
}

export default function TemplateExplorerModal({ visible, onClose, templates, onSelect }: TemplateExplorerModalProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  // Template cards currently inside the viewport — capped to top 4 cards so Android hardware MediaCodec decoders never starve
  const [visibleIds, setVisibleIds] = useState<Set<string>>(() => new Set());
  const isDraggingRef = useRef(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cardWidth = Math.floor((width - 48) / 2);

  // Clear active decoders when modal is hidden
  useEffect(() => {
    if (!visible) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      setVisibleIds(new Set());
    }
  }, [visible]);

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
    minimumViewTime: 150,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      // Debounce video activation so fast scrolling displays instant static posters without churning decoders
      debounceTimerRef.current = setTimeout(() => {
        if (!isDraggingRef.current) {
          // Strictly cap active playing decoders to top 4 cards
          const top4 = viewableItems.slice(0, 4);
          setVisibleIds(
            new Set(top4.map((v: any) => String(v.item?.slug || v.item?.id)))
          );
        }
      }, 150);
    }
  ).current;

  const categories = useMemo(() => {
    const unique = new Map<string, string>();
    templates.forEach((template) => {
      const category = String(template.category || template.categoryId || "").trim();
      if (category) unique.set(category.toLowerCase(), category);
    });
    return [{ id: "all", label: "All" }, ...Array.from(unique, ([id, label]) => ({ id, label }))];
  }, [templates]);

  const visibleTemplates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return templates.filter((template) => {
      const category = String(template.category || template.categoryId || "").toLowerCase();
      const matchesCategory = activeCategory === "all" || category === activeCategory;
      const content = `${template.name || ""} ${template.prompt || ""}`.toLowerCase();
      return matchesCategory && (!normalizedQuery || content.includes(normalizedQuery));
    });
  }, [activeCategory, query, templates]);

  const selectTemplate = (template: any) => {
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
            removeClippedSubviews={Platform.OS === "android"}
            viewabilityConfig={viewabilityConfig}
            onViewableItemsChanged={onViewableItemsChanged}
            onScrollBeginDrag={() => {
              isDraggingRef.current = true;
            }}
            onScrollEndDrag={() => {
              isDraggingRef.current = false;
            }}
            onMomentumScrollEnd={() => {
              isDraggingRef.current = false;
            }}
            renderItem={({ item }) => {
              const rawImage = item.thumbnailUrl || item.image;
              const image =
                rawImage && (typeof rawImage === "number" || typeof rawImage === "object")
                  ? rawImage
                  : rawImage
                  ? { uri: formatImageUrl(rawImage) }
                  : undefined;
              const itemId = String(item.slug || item.id);
              return (
                <TouchableOpacity
                  activeOpacity={0.86}
                  onPress={() => selectTemplate(item)}
                  style={[styles.card, { width: cardWidth }]}
                >
                  <View style={[styles.imageWrap, { height: cardWidth * 1.25 }]}>
                    <AnimatedTemplateThumb
                      thumbnail={image as any}
                      videoUrl={item.videoUrl ? formatImageUrl(item.videoUrl) : null}
                      autoPlay={visibleIds.has(itemId)}
                      style={styles.image}
                    />
                    {!!item.category && (
                      <View style={styles.categoryBadgeWrap}>
                        <Text style={styles.categoryBadgeText}>{item.category}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.cardFooter}>
                    <Text numberOfLines={1} style={styles.cardTitle}>
                      {item.name || "AI Template"}
                    </Text>
                    <Text style={styles.arrow}>›</Text>
                  </View>
                </TouchableOpacity>
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
