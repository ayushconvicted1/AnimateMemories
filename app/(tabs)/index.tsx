import {
  StyleSheet,
  ScrollView,
  FlatList,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Alert,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useEffect, useState, useCallback, useRef, memo, useMemo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { GradientText } from "@/components/ui/GradientText";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import { useAuth as useAuthContext } from "@/contexts/AuthContext";
import { useAuthGate } from "@/contexts/AuthGateContext";
import { useAuth } from "@clerk/clerk-expo";
import { api } from "@/services/api";
import { getFontFamily } from "@/constants/Fonts";
import { promptNotificationPermissionOnHome } from "@/services/notifications";
import { Video, ResizeMode } from "expo-av";
import TransformationGrid from "@/components/ui/TransformationGrid";
import HomeArrow from "@/components/images/HomeArrow";
import StarIcon from "@/components/images/StarIcon";
import TemplateExplorerModal from "@/components/ui/TemplateExplorerModal";
import AnimatedTemplateThumb from "@/components/ui/AnimatedTemplateThumb";
import ChevronLeftIcon from "@/components/images/ChevronLeftIcon";
import {
  templateAudioCoordinator,
  isAudioTemplate as checkIsAudioTemplate,
} from "@/services/templateAudioCoordinator";
import {
  trackFreeCreditsGranted,
  trackUploadFailed,
  trackViewContent,
} from "@/services/tracking";
import {
  FALLBACK_TEMPLATES,
  FALLBACK_CATEGORIES,
} from "@/constants/defaultPresets";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTENT_WIDTH = SCREEN_WIDTH - 32;

// API base URL for template images
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "https://www.animatememories.com";

const formatImageUrl = (url?: string | null) => {
  if (!url) return "";
  let formatted = String(url).trim();
  if (
    formatted.startsWith("http://") ||
    formatted.startsWith("https://") ||
    formatted.startsWith("data:")
  ) {
    try {
      return encodeURI(decodeURI(formatted));
    } catch {
      return formatted;
    }
  }
  const full = `${API_BASE_URL}${formatted.startsWith("/") ? "" : "/"}${formatted}`;
  try {
    return encodeURI(decodeURI(full));
  } catch {
    return full;
  }
};

const DEFAULT_CATEGORIES = [
  "Viral",
  "Family",
  "Funny",
  "Birthday",
  "Wedding",
  "Tribute",
  "Kids",
  "Pets",
  "Holiday",
  "Graduation",
];

const DEFAULT_TEMPLATES = [
  {
    id: "groove-duo",
    slug: "groove-duo",
    name: "Groove Duo",
    image: { uri: "https://pub-b01a35ccbe054425bacd868be6412477.r2.dev/templates/groove-duo.webp" },
    thumbnailUrl: "https://pub-b01a35ccbe054425bacd868be6412477.r2.dev/templates/groove-duo.webp",
    videoUrl: "https://pub-b01a35ccbe054425bacd868be6412477.r2.dev/templates/groove-duo.mp4",
    isStar: true,
    category: "Viral, Funny",
    hasAudio: true,
  },
  {
    id: "mic-drop-rap",
    slug: "mic-drop-rap",
    name: "Mic Drop Rap",
    image: { uri: "https://pub-b01a35ccbe054425bacd868be6412477.r2.dev/templates/mic-drop-rap.webp" },
    thumbnailUrl: "/templates/mic-drop-rap.webp",
    videoUrl: "https://pub-b01a35ccbe054425bacd868be6412477.r2.dev/templates/mic-drop-rap.mp4",
    isStar: true,
    category: "Viral",
    hasAudio: true,
  },
  {
    id: "baby-dance",
    slug: "baby-dance",
    name: "Baby Dance",
    image: { uri: "https://pub-b01a35ccbe054425bacd868be6412477.r2.dev/templates/baby-dance.webp" },
    thumbnailUrl: "https://pub-b01a35ccbe054425bacd868be6412477.r2.dev/templates/baby-dance.webp",
    videoUrl: "https://pub-b01a35ccbe054425bacd868be6412477.r2.dev/templates/baby-dance.mp4",
    isStar: false,
    category: "Kids, Viral",
    hasAudio: false,
  },
  {
    id: "family-photo-pose",
    slug: "family-photo-pose",
    name: "Family Smile",
    image: require("@/assets/images/Home1.webp"),
    thumbnailUrl: "/templates/FamilyPhoto.jpeg",
    videoUrl: "https://pub-b01a35ccbe054425bacd868be6412477.r2.dev/templates/family-photo-pose.mp4",
    isStar: false,
    category: "Family"
  },
  {
    id: "fighting-pose",
    slug: "fighting-pose",
    name: "Fighting Pose",
    image: require("@/assets/images/Home2.webp"),
    thumbnailUrl: "/templates/Fighting POse.webp",
    videoUrl: "https://pub-b01a35ccbe054425bacd868be6412477.r2.dev/templates/fighting-pose.mp4",
    isStar: true,
    category: "Funny"
  },
  {
    id: "head-lean",
    slug: "head-lean",
    name: "Head Lean",
    image: require("@/assets/images/Home3.webp"),
    thumbnailUrl: "/templates/Head Lean.webp",
    videoUrl: "https://pub-b01a35ccbe054425bacd868be6412477.r2.dev/templates/head-lean.mp4",
    isStar: true,
    category: "Tribute"
  },
  {
    id: "classic-wedding",
    slug: "classic-wedding",
    name: "Classic Wedding",
    image: require("@/assets/images/ClassicWedding.jpg"),
    thumbnailUrl: "/templates/first-dance.webp",
    videoUrl: "https://pub-b01a35ccbe054425bacd868be6412477.r2.dev/templates/first-dance.mp4",
    isStar: true,
    category: "Wedding"
  },
  {
    id: "family-memories",
    slug: "family-memories",
    name: "Family Memories",
    image: require("@/assets/images/FamilyPhoto.jpg"),
    thumbnailUrl: "/templates/FamilyPhoto.jpeg",
    videoUrl: "https://pub-b01a35ccbe054425bacd868be6412477.r2.dev/templates/family-photo-pose.mp4",
    isStar: false,
    category: "Family"
  },
  {
    id: "vintage-portrait",
    slug: "vintage-portrait",
    name: "Vintage Portrait",
    image: require("@/assets/images/VintagePortrait.jpg"),
    thumbnailUrl: "/templates/Salute.jpeg",
    videoUrl: "https://pub-b01a35ccbe054425bacd868be6412477.r2.dev/templates/salute.mp4",
    isStar: true,
    category: "Viral"
  },
];

const TemplateCard = memo(
  ({
    item,
    onSelect,
    isActive,
    isPaused,
    onPlaybackFinished,
  }: {
    item: any;
    onSelect: (id: string) => void;
    isActive?: boolean;
    isPaused?: boolean;
    onPlaybackFinished?: () => void;
  }) => {
    const id = String(item.slug || item.id);
    const videoUrl = item.videoUrl || item.videourl || item.video_url || null;
    const thumbnailUrl = item.thumbnailUrl || item.thumbnailurl || item.thumbnail_url || null;

    return (
      <View style={styles.templateCard}>
        <View style={styles.templateImageContainer}>
          <AnimatedTemplateThumb
            id={id}
            hasAudio={Boolean(item.hasAudio || item.hasaudio || checkIsAudioTemplate(item) || id === "mic-drop-rap" || id === "groove-duo")}
            videoUrl={videoUrl ? formatImageUrl(videoUrl) : null}
            thumbnailUrl={thumbnailUrl ? formatImageUrl(thumbnailUrl) : null}
            image={item.image || null}
            autoPlay={isActive}
            isPaused={isPaused}
            onPlaybackFinished={onPlaybackFinished}
            onPressCard={() => onSelect(id)}
            style={styles.templateImage}
          />
          {(item.isStar || item.isFeatured || item.is_featured) && (
            <View style={styles.starBadgeContainer} pointerEvents="none">
              <StarIcon width={11} height={11} color="#F59E0B" />
            </View>
          )}
        </View>
        <TouchableOpacity onPress={() => onSelect(id)} activeOpacity={0.8}>
          <Text style={styles.templateName} numberOfLines={1} ellipsizeMode="tail">
            {item.name}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
);
TemplateCard.displayName = "TemplateCard";

interface HomeTemplatesCarouselProps {
  templates: any[];
  onSelect: (id: string) => void;
  isSectionVisible?: boolean;
}

const TEMPLATE_CARD_WIDTH = 116;
const TEMPLATE_CARD_MARGIN = 12;
const TEMPLATE_ITEM_PITCH = 128; // 116 card width + 12 right margin
const TEMPLATE_LIST_PADDING = 16;

const hasPlayableVideo = (item: any) => {
  if (!item) return false;
  const url = item.videoUrl || item.videourl || item.video_url;
  return Boolean(url && typeof url === "string" && url.trim().length > 0);
};

const getVisibleIndicesInViewport = (offsetX: number, total: number) => {
  if (total === 0) return [];
  const vpLeft = Math.max(0, offsetX);
  const vpRight = vpLeft + SCREEN_WIDTH;
  const visible: number[] = [];

  for (let i = 0; i < total; i++) {
    const cardLeft = TEMPLATE_LIST_PADDING + i * TEMPLATE_ITEM_PITCH;
    const cardRight = cardLeft + TEMPLATE_CARD_WIDTH;

    // Calculate overlap with viewport [vpLeft, vpRight]
    const overlapLeft = Math.max(cardLeft, vpLeft);
    const overlapRight = Math.min(cardRight, vpRight);
    const overlapWidth = Math.max(0, overlapRight - overlapLeft);

    // Consider card visible if at least 45px (out of 116px, ~40%) is visible on screen
    if (overlapWidth >= 45) {
      visible.push(i);
    }
  }

  // Fallback if no card met the threshold (e.g. extreme scroll boundary)
  if (visible.length === 0) {
    const fallbackIdx = Math.min(
      total - 1,
      Math.max(0, Math.round((vpLeft - TEMPLATE_LIST_PADDING) / TEMPLATE_ITEM_PITCH))
    );
    return [fallbackIdx];
  }

  return visible;
};

const getVisibleVideoIndices = (offsetX: number, items: any[]): number[] => {
  if (!items || items.length === 0) return [];
  const visibleAll = getVisibleIndicesInViewport(offsetX, items.length);
  const withVideo = visibleAll.filter((i) => hasPlayableVideo(items[i]));
  return withVideo.length > 0 ? withVideo : visibleAll;
};

const HomeTemplatesCarousel = memo(
  ({ templates, onSelect, isSectionVisible = true }: HomeTemplatesCarouselProps) => {
    const listRef = useRef<FlatList>(null);
    const scrollXRef = useRef(0);
    const isScrollingRef = useRef(false);
    const isUserDraggingRef = useRef(false);
    const isMomentumRef = useRef(false);
    const settleTimerRef = useRef<any>(null);
    const prevTemplateIdsRef = useRef<string>("");

    const [isPaused, setIsPaused] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const updateArrows = useCallback(
      (offsetX: number) => {
        setCanScrollLeft(offsetX > 10);
        const maxScroll = Math.max(
          0,
          templates.length * TEMPLATE_ITEM_PITCH - (SCREEN_WIDTH - 32)
        );
        setCanScrollRight(offsetX < maxScroll - 10);
      },
      [templates.length]
    );

    // Initial mount and when templates genuinely change (e.g. category filter switched):
    // Only reset active index & scroll position if the templates collection actually changes!
    useEffect(() => {
      const currentIds = (templates || []).map((t: any) => t.slug || t.id).join(",");
      if (prevTemplateIdsRef.current === currentIds) {
        return;
      }
      prevTemplateIdsRef.current = currentIds;

      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
      scrollXRef.current = 0;
      isScrollingRef.current = false;
      isUserDraggingRef.current = false;
      isMomentumRef.current = false;

      const initialVideos = getVisibleVideoIndices(0, templates);
      const firstIdx = initialVideos[0] ?? 0;
      setActiveIndex(firstIdx);
      setIsPaused(false);
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
      updateArrows(0);
    }, [templates, updateArrows]);

    // Cleanup settle timer on unmount
    useEffect(() => {
      return () => {
        if (settleTimerRef.current) {
          clearTimeout(settleTimerRef.current);
        }
      };
    }, []);

    // Advance to next video in current viewport in a continuous loop:
    // Leftmost video plays until fully complete -> then 2nd -> then 3rd -> loops back to 1st!
    const advanceToNext = useCallback(() => {
      if (
        isScrollingRef.current ||
        isUserDraggingRef.current ||
        isMomentumRef.current ||
        !templates ||
        templates.length === 0
      ) {
        return;
      }

      const currentAudioId = templateAudioCoordinator.getActiveId();
      if (currentAudioId) {
        templateAudioCoordinator.stopAudio(currentAudioId);
      }

      const currentOffset = scrollXRef.current;
      const visibleVideos = getVisibleVideoIndices(currentOffset, templates);
      if (visibleVideos.length === 0) return;

      if (visibleVideos.length <= 1) {
        // Only 1 video in viewport: momentarily toggle activeIndex to replay it smoothly
        const soleIndex = visibleVideos[0] ?? 0;
        setActiveIndex(-1);
        setTimeout(() => {
          if (!isScrollingRef.current && !isUserDraggingRef.current && !isMomentumRef.current) {
            setActiveIndex(soleIndex);
          }
        }, 60);
        return;
      }

      setActiveIndex((prev) => {
        const currentPos = visibleVideos.indexOf(prev);
        if (currentPos === -1 || currentPos >= visibleVideos.length - 1) {
          // Loop back to the first (leftmost) video in the current viewport!
          return visibleVideos[0];
        }
        // Advance to the next video in the viewport
        return visibleVideos[currentPos + 1];
      });
    }, [templates]);

    // Safety watchdog: auto-advance if video is stuck buffering
    useEffect(() => {
      if (
        isPaused ||
        !templates ||
        templates.length === 0 ||
        !isSectionVisible ||
        isScrollingRef.current ||
        isUserDraggingRef.current ||
        isMomentumRef.current
      ) {
        return;
      }
      const currentItem = templates[activeIndex];
      const hasVid = hasPlayableVideo(currentItem);
      const timeoutMs = hasVid ? 14000 : 2500;
      const watchdog = setTimeout(() => {
        if (
          !isPaused &&
          !isScrollingRef.current &&
          !isUserDraggingRef.current &&
          !isMomentumRef.current
        ) {
          advanceToNext();
        }
      }, timeoutMs);
      return () => clearTimeout(watchdog);
    }, [activeIndex, isPaused, templates, advanceToNext, isSectionVisible]);

    // 1-second settle timer: when horizontal scrolling stops, wait 1 second,
    // determine newly visible viewport videos, and start playing the 1st video in that viewport.
    const scheduleSettleTimer = useCallback(
      (offsetX: number) => {
        if (settleTimerRef.current) {
          clearTimeout(settleTimerRef.current);
        }
        settleTimerRef.current = setTimeout(() => {
          isScrollingRef.current = false;
          isUserDraggingRef.current = false;
          isMomentumRef.current = false;

          const currentOffset = scrollXRef.current;
          const newVisible = getVisibleVideoIndices(currentOffset, templates);
          const firstVideoIdx = newVisible[0] ?? 0;

          // Start playing the 1st video in the newly settled viewport
          setActiveIndex(firstVideoIdx);
          setIsPaused(false);
        }, 1000);
      },
      [templates]
    );

    const handleScrollStart = useCallback(() => {
      isScrollingRef.current = true;
      setIsPaused(true);
      templateAudioCoordinator.stopAudio();
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
    }, []);

    // Passive scroll handler: updates offset and arrows, does NOT pause on passive layout passes
    const handleScroll = useCallback(
      (e: any) => {
        const offsetX = Math.max(0, e.nativeEvent.contentOffset.x);
        scrollXRef.current = offsetX;
        updateArrows(offsetX);

        // If user is actively dragging, keep resetting the settle timer until dragging stops
        if (isUserDraggingRef.current || isMomentumRef.current) {
          if (settleTimerRef.current) {
            clearTimeout(settleTimerRef.current);
            settleTimerRef.current = null;
          }
        }
      },
      [updateArrows]
    );

    const handleScrollBeginDrag = useCallback(() => {
      isUserDraggingRef.current = true;
      handleScrollStart();
    }, [handleScrollStart]);

    const handleScrollEndDrag = useCallback(
      (e: any) => {
        isUserDraggingRef.current = false;
        const offsetX = Math.max(0, e.nativeEvent.contentOffset.x);
        scrollXRef.current = offsetX;
        updateArrows(offsetX);

        // If momentum is not taking over (low velocity finger lift), start 1s settle timer
        const velocityX = Math.abs(e.nativeEvent.velocity?.x || 0);
        if (velocityX < 0.1) {
          scheduleSettleTimer(offsetX);
        }
      },
      [updateArrows, scheduleSettleTimer]
    );

    const handleMomentumScrollBegin = useCallback(() => {
      isMomentumRef.current = true;
      handleScrollStart();
    }, [handleScrollStart]);

    const handleMomentumScrollEnd = useCallback(
      (e: any) => {
        isMomentumRef.current = false;
        const offsetX = Math.max(0, e.nativeEvent.contentOffset.x);
        scrollXRef.current = offsetX;
        updateArrows(offsetX);
        scheduleSettleTimer(offsetX);
      },
      [updateArrows, scheduleSettleTimer]
    );

    const handleScrollLeft = useCallback(() => {
      handleScrollStart();
      const nextOffset = Math.max(0, scrollXRef.current - TEMPLATE_ITEM_PITCH * 2);
      listRef.current?.scrollToOffset({ offset: nextOffset, animated: true });
      scrollXRef.current = nextOffset;
      updateArrows(nextOffset);
      scheduleSettleTimer(nextOffset);
    }, [handleScrollStart, updateArrows, scheduleSettleTimer]);

    const handleScrollRight = useCallback(() => {
      handleScrollStart();
      const maxScroll = Math.max(
        0,
        templates.length * TEMPLATE_ITEM_PITCH - (SCREEN_WIDTH - 32)
      );
      const nextOffset = Math.min(maxScroll, scrollXRef.current + TEMPLATE_ITEM_PITCH * 2);
      listRef.current?.scrollToOffset({ offset: nextOffset, animated: true });
      scrollXRef.current = nextOffset;
      updateArrows(nextOffset);
      scheduleSettleTimer(nextOffset);
    }, [templates.length, handleScrollStart, updateArrows, scheduleSettleTimer]);

    const effectivePaused = isPaused || !isSectionVisible;

    const renderItem = useCallback(
      ({ item, index }: { item: any; index: number }) => {
        const isCurrentActive = activeIndex === index;
        return (
          <TemplateCard
            item={item}
            onSelect={onSelect}
            isActive={isCurrentActive}
            isPaused={effectivePaused}
            onPlaybackFinished={isCurrentActive ? advanceToNext : undefined}
          />
        );
      },
      [activeIndex, effectivePaused, onSelect, advanceToNext]
    );

    const getItemLayout = useCallback(
      (_: any, index: number) => ({
        length: TEMPLATE_ITEM_PITCH,
        offset: TEMPLATE_LIST_PADDING + TEMPLATE_ITEM_PITCH * index,
        index,
      }),
      []
    );

    return (
      <View style={styles.templateListWrapper}>
        <FlatList
          ref={listRef}
          horizontal
          data={templates}
          renderItem={renderItem}
          extraData={`${activeIndex}-${effectivePaused}-${templates.length}`}
          keyExtractor={(item, index) =>
            item.slug || item.id ? `${item.slug || item.id}-${index}` : `tpl-${index}`
          }
          getItemLayout={getItemLayout}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingLeft: 16, paddingRight: 16 }}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          windowSize={7}
          nestedScrollEnabled={true}
          overScrollMode="never"
          removeClippedSubviews={false}
          scrollEventThrottle={16}
          onScroll={handleScroll}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollEndDrag={handleScrollEndDrag}
          onMomentumScrollBegin={handleMomentumScrollBegin}
          onMomentumScrollEnd={handleMomentumScrollEnd}
        />

        {/* Left Arrow Button */}
        {canScrollLeft && (
          <TouchableOpacity
            style={[styles.templateArrowButton, styles.templateArrowLeft]}
            onPress={handleScrollLeft}
            activeOpacity={0.85}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Scroll templates left"
          >
            <ChevronLeftIcon size={18} color="#0F172A" />
          </TouchableOpacity>
        )}

        {/* Right Arrow Button */}
        {canScrollRight && templates.length > 2 && (
          <TouchableOpacity
            style={[styles.templateArrowButton, styles.templateArrowRight]}
            onPress={handleScrollRight}
            activeOpacity={0.85}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Scroll templates right"
          >
            <View style={{ transform: [{ rotate: "180deg" }] }}>
              <ChevronLeftIcon size={18} color="#0F172A" />
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  }
);
HomeTemplatesCarousel.displayName = "HomeTemplatesCarousel";

// Step demo videos are mounted only when in viewport to conserve Android hardware decoders
const StepVideo = memo(
  ({ source, poster, isVisible }: { source: any; poster: any; isVisible: boolean }) => {
    return isVisible ? (
      <Video
        source={source}
        style={styles.stepVideo}
        resizeMode={ResizeMode.COVER}
        shouldPlay={true}
        isLooping
        isMuted
        useNativeControls={false}
        onError={(error) => console.log("Step video failed to load:", error)}
      />
    ) : (
      <Image
        source={poster}
        style={styles.stepVideo}
        contentFit="cover"
      />
    );
  }
);
StepVideo.displayName = "StepVideo";

export default function HomeScreen() {
  const { user, isSignedIn } = useAuthContext();
  const { getToken } = useAuth();
  const { requireAuth } = useAuthGate();
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [animationTemplates, setAnimationTemplates] = useState<any[]>(FALLBACK_TEMPLATES);
  const [categoriesList, setCategoriesList] = useState<string[]>(FALLBACK_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState("Viral");
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isTemplateModalVisible, setTemplateModalVisible] = useState(false);
  const [isHeroVideoReady, setIsHeroVideoReady] = useState(false);
  const heroVideoRef = useRef<Video>(null);

  const filteredTemplates = useMemo(() => {
    const activeLower = (selectedCategory || "Viral").toLowerCase();
    if (activeLower === "viral" || activeLower === "trending") {
      // Show templates that have "Viral" or "Trending" in their categories
      const viral = animationTemplates.filter((t) => {
        const catStr = (t.category || t.categoryId || "").toLowerCase();
        const cats = catStr.split(/[\s,]+/).filter(Boolean);
        return cats.includes("viral") || cats.includes("trending");
      });
      return (viral.length > 0 ? viral : animationTemplates).slice(0, 8);
    }
    const filtered = animationTemplates.filter((t) => {
      const catStr = (t.category || t.categoryId || "").toLowerCase();
      // Split comma-separated categories (e.g., "Viral, Birthday")
      const cats = catStr.split(/[\s,]+/).filter(Boolean);
      return cats.includes(activeLower);
    });
    // Fallback to all if category has no templates, capped to 8
    return (filtered.length > 0 ? filtered : animationTemplates).slice(0, 8);
  }, [animationTemplates, selectedCategory]);

  const handleScroll = useCallback((event: any) => {
    const y = event.nativeEvent?.contentOffset?.y || 0;
    setScrollOffset(y);
  }, []);

  // Hero video only plays while in view at the top of the screen
  const isHeroVisible = scrollOffset < 450;
  // Step demo videos play only when scrolled to the "How to" section
  const isStepsVisible = scrollOffset > 600 && scrollOffset < 2000;
  // Transformation grid video plays when scrolled to that section
  const isTransformationsVisible = scrollOffset > 1000 && scrollOffset < 2800;

  useEffect(() => {
    if (isHeroVisible && heroVideoRef.current) {
      heroVideoRef.current.playAsync().catch(() => {});
    } else if (!isHeroVisible && heroVideoRef.current) {
      heroVideoRef.current.pauseAsync().catch(() => {});
    }
  }, [isHeroVisible]);

  useFocusEffect(
    useCallback(() => {
      return () => {
        templateAudioCoordinator.stopAudio();
      };
    }, [])
  );

  useEffect(() => {
    const fetchUserCredits = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const token = await getToken();
        const result = await api.verifyUser(user, token);
        const credits = result.result?.credits || 0;
        setUserCredits(credits);

        const email =
          user.primaryEmailAddress?.emailAddress ||
          user.emailAddresses?.[0]?.emailAddress;
        if (email && credits >= 4 && !result?.result?.hasPaidTransaction) {
          const flagKey = `@free_credits_granted_${email}`;
          const alreadyTracked = await AsyncStorage.getItem(flagKey);
          if (!alreadyTracked) {
            await AsyncStorage.setItem(flagKey, "true");
            trackFreeCreditsGranted({
              credits_granted: credits,
              remaining_credits: credits,
            });
          }
        }
      } catch (error) {
        console.error("Error fetching credits:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchTemplates = async () => {
      try {
        const response = await api.getVideoPresets();
        const presets =
          response?.result ||
          response?.presets ||
          (Array.isArray(response) ? response : []);
        if (presets && presets.length > 0) {
          const normalized = presets.map((item: any) => ({
            ...item,
            isStar: Boolean(item.sortOrder && item.sortOrder < 10) || item.views?.includes("M") || item.isStar,
            hasAudio: Boolean(item.hasAudio || item.slug === "mic-drop-rap" || item.slug === "groove-duo"),
          }));
          setAnimationTemplates(normalized);
        }
      } catch (error: any) {
        console.warn("Could not fetch remote templates, using defaults:", error?.message || error);
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await api.getTemplateCategories();
        if (res?.result && Array.isArray(res.result) && res.result.length > 0) {
          const names: string[] = res.result
            .map((c: any) => c.name)
            .filter((name: string) => name && name.toLowerCase() !== "trending");
          if (names.length > 0) {
            setCategoriesList(names);
            if (!names.includes(selectedCategory)) {
              setSelectedCategory(names.includes("Viral") ? "Viral" : names[0]);
            }
          }
        }
      } catch (e: any) {
        console.warn("Could not fetch template categories:", e?.message || e);
      }
    };

    fetchTemplates();
    fetchCategories();

    if (user) {
      fetchUserCredits();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Prompt notification permission on Home screen after login/signup
  useEffect(() => {
    if (!user) return;

    const timer = setTimeout(() => {
      const email =
        user.primaryEmailAddress?.emailAddress ||
        user.emailAddresses?.[0]?.emailAddress ||
        null;
      promptNotificationPermissionOnHome(email).catch((err) => {
        console.warn("[HomeScreen] Notification prompt error:", err);
      });
    }, 1200);

    return () => clearTimeout(timer);
  }, [user?.id]);

  const handleTryForFree = () => {
    if (!isSignedIn) {
      requireAuth({ type: "create" });
      return;
    }
    router.push("/(tabs)/animate");
  };

  const handleUploadImage = async () => {
    if (!isSignedIn) {
      requireAuth({ type: "upload" });
      return;
    }

    try {

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.9,
      });

      if (result.canceled || !result.assets || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 20 * 1024 * 1024) {
        trackUploadFailed({
          error_type: "FILE_TOO_LARGE",
          error_message: "Image size exceeds 20MB limit",
          file_size_mb: asset.fileSize / (1024 * 1024),
          mode: "animate",
        });
        Alert.alert(
          "File Too Large",
          "The selected image exceeds the maximum allowed size of 20MB. Please choose a smaller image."
        );
        return;
      }

      const imageUri = asset.uri;
      if (!imageUri) {
        Alert.alert("Error", "No image selected.");
        return;
      }

      router.push({
        pathname: "/(tabs)/animate",
        params: {
          imageUri: encodeURIComponent(imageUri),
        },
      });
    } catch (error: any) {
      console.error("Error picking image:", error);
      trackUploadFailed({
        error_type: "UPLOAD_PICK_ERROR",
        error_message: error?.message || "Failed to pick image",
        mode: "animate",
      });
      Alert.alert(
        "Error",
        error.message || "Failed to pick image. Please try again."
      );
    }
  };

  const handleTemplateSelect = useCallback((templateId: string) => {
    templateAudioCoordinator.stopAudio();
    const matched = animationTemplates.find((t: any) => (t.slug || t.id) === templateId);
    trackViewContent({
      template_name: matched?.name || templateId,
      category: matched?.category || "All",
    });
    if (!isSignedIn) {
      setTemplateModalVisible(false);
      requireAuth({ type: "template", templateId });
      return;
    }

    router.push({
      pathname: "/(tabs)/animate",
      params: {
        templateId: templateId,
      },
    });
  }, [isSignedIn, requireAuth]);

  // Background Image Height based on 1080x1920 ratio scaled to screen width
  const bgHeight = (SCREEN_WIDTH * 1920) / 1080;

  return (
    <View style={styles.outerContainer}>
      <ScreenWrapper
        backgroundColor="transparent"
        addBottomPadding={true}
        onScroll={handleScroll}
        scrollEventThrottle={32}
        scrollEnabled={!isTemplateModalVisible}
        removeClippedSubviews={false}
        creditsText={
          user
            ? (userCredits !== null ? `${userCredits} Credits` : "Loading...")
            : undefined
        }
      >
        {/* Background Image inside ScrollView so it scrolls with the screen */}
        <Image
          source={require("@/assets/images/HomeBG.jpeg")}
          style={[styles.backgroundImage, { height: bgHeight }]}
          contentFit="cover"
          priority="high"
        />

        {/* Hero Section */}
        <View style={styles.heroSection}>
          {/* Photos Composition Box */}
          <View style={styles.photoCompositionContainer}>
            {/* Top Left Small Old Vintage Photo */}
            <View style={styles.smallPhotoCard}>
              <Image
                source={require("@/assets/images/herophoto.jpeg")}
                style={styles.smallPhotoImage}
                contentFit="cover"
              />
            </View>

            {/* Arrow pointing to main photo */}
            <View style={styles.arrowContainer}>
              <HomeArrow width={34} height={32} />
            </View>

            {/* Main Hero Video */}
            <View style={styles.mainHeroPhotoCard}>
              <Image
                source={require("@/assets/images/herovideo-first-frame.jpg")}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                priority="high"
                cachePolicy="memory-disk"
              />
              <Video
                ref={heroVideoRef}
                source={require("@/assets/videos/HomeVideo.mp4")}
                style={[styles.mainHeroImage, { opacity: isHeroVideoReady ? 1 : 0 }]}
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay={isHeroVisible}
                isMuted
                useNativeControls={false}
                onReadyForDisplay={() => setIsHeroVideoReady(true)}
                onPlaybackStatusUpdate={(status: any) => {
                  if (status?.isLoaded && (status.isPlaying || (status.positionMillis ?? 0) > 0)) {
                    setIsHeroVideoReady(true);
                  }
                }}
                onError={(err) => console.log("Hero video playback error:", err)}
              />
            </View>
          </View>

          {/* Main Hero Headline */}
          <GradientText style={styles.heroTitle}>
            {"Turn your Old Pictures\ninto Live Moments"}
          </GradientText>

          {/* Hero Subtitle */}
          <Text style={styles.heroDescription}>
            Upload your photo, and let AI bring{"\n"}
            your memories to life in seconds.
          </Text>

          {/* Upload Your Photo Button */}
          <TouchableOpacity
            style={styles.uploadButtonContainer}
            onPress={handleUploadImage}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#38BDF8", "#A855F7", "#D229FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.uploadGradientButton}
            >
              <Text style={styles.uploadButtonText}>Upload Your Photo</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Explore 100+ Viral AI Templates */}
        <View style={styles.templatesSection}>
          <GradientText style={styles.templatesSectionTitle}>
            {"Explore 100+\nViral AI Templates"}
          </GradientText>

          {/* Category Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryContainer}
          >
            {categoriesList.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}
                  style={styles.categoryPillTouchable}
                >
                  {isSelected ? (
                    <LinearGradient
                      colors={["#38BDF8", "#D229FF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.activePillGradient}
                    >
                      <Text style={styles.activePillText}>{cat}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.inactivePill}>
                      <Text style={styles.inactivePillText}>{cat}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Template Cards Horizontal Scroll with Left/Right Navigation Arrows */}
          <HomeTemplatesCarousel
            templates={filteredTemplates}
            onSelect={handleTemplateSelect}
            isSectionVisible={scrollOffset < 1800}
          />

          {/* View All Link */}
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => setTemplateModalVisible(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.viewAllText}>View All {"\u203A"}</Text>
          </TouchableOpacity>
        </View>

        {/* How to Animate Section */}
        <View style={styles.howToSection}>
          <Text style={styles.howToTitle}>
            How to Animate Old Pictures with AI?
          </Text>

          {/* Step 1 */}
          <View style={styles.stepRow}>
            <View style={styles.stepImageWrapper}>
              <Image
                source={require("@/assets/images/1.png")}
                style={styles.stepPngImage}
                contentFit="contain"
              />
            </View>
            <View style={styles.stepTextWrapper}>
              <Text style={styles.stepNumber}>Step 1</Text>
              <GradientText style={styles.stepHeaderTitle}>
                Upload Your Image
              </GradientText>
              <Text style={styles.stepDescription}>
                Click "<Text style={styles.highlightPink}>Try for Free</Text>"
                and import your old photos effortlessly.
              </Text>
            </View>
          </View>

          {/* Step 2 */}
          <View style={styles.stepRow}>
            <View style={styles.stepTextWrapper}>
              <Text style={styles.stepNumber}>Step 2</Text>
              <GradientText style={styles.stepHeaderTitle}>
                Animate Your Photo
              </GradientText>
              <Text style={styles.stepDescription}>
                Either Choose the template or choose custom for desired output &{" "}
                <Text style={styles.highlightPink}>let AI do the magic</Text>
              </Text>
            </View>
            <View style={styles.stepImageWrapper}>
              <StepVideo
                source={require("@/assets/videos/2.mp4")}
                poster={require("@/assets/images/2.png")}
                isVisible={isStepsVisible}
              />
            </View>
          </View>

          {/* Step 3 */}
          <View style={styles.stepRow}>
            <View style={styles.stepImageWrapper}>
              <StepVideo
                source={require("@/assets/videos/GirlVideo.mp4")}
                poster={require("@/assets/images/3.png")}
                isVisible={isStepsVisible}
              />
            </View>
            <View style={styles.stepTextWrapper}>
              <Text style={styles.stepNumber}>Step 3</Text>
              <GradientText style={styles.stepHeaderTitle}>
                Export and Download
              </GradientText>
              <Text style={styles.stepDescription}>
                Preview and download your animated videos instantly.
              </Text>
            </View>
          </View>

          {/* Big Try For Free Button */}
          <TouchableOpacity
            style={styles.bigTryButtonContainer}
            onPress={handleTryForFree}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#38BDF8", "#A855F7", "#D229FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.bigTryGradient}
            >
              <Text style={styles.bigTryButtonText}>Try For Free</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Incredible Transformations */}
        <View style={styles.transformationsSection}>
          <GradientText style={styles.sectionHeadingTitle}>
            Incredible Transformations
          </GradientText>
          <Text style={styles.sectionSubtitle}>
            See what our AI can do. Discover stunning results from real photos.
          </Text>

          {/* 2x2 Transformation Grid with Scroll-Optimized Video Playback */}
          <TransformationGrid isVisible={isTransformationsVisible} />
        </View>

        {/* Trusted by Professionals */}
        <View style={styles.trustedSection}>
          <GradientText style={styles.sectionHeadingTitle}>
            Trusted by Professionals
          </GradientText>
          <Text style={styles.sectionSubtitle}>
            How businesses and creators use Animate Memories to scale their content.
          </Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.proCardsContainer, { paddingBottom: 24, paddingTop: 12 }]}
          >
            {/* Card 1: Entertainment */}
            <View style={styles.proCard}>
              <View style={styles.proCardInner}>
                <Image
                  source={require("@/assets/images/EntertainmentIndustry.jpeg")}
                  style={styles.proCardImage}
                  contentFit="cover"
                />
                <View style={styles.proCardContent}>
                  <Text style={styles.proCardTitle}>
                    Entertainment Industry
                  </Text>
                  <Text style={styles.proCardDesc}>
                    Major film studios and creators use AnimateMemories for image colorization and historical video enhancement
                  </Text>
                  <View style={styles.proCardStats}>
                    <Text style={styles.proCardStatsText}>500+ projects completed</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Card 2: Gifts & Events */}
            <View style={styles.proCard}>
              <View style={styles.proCardInner}>
                <Image
                  source={require("@/assets/images/GiftsAndEvents.jpeg")}
                  style={styles.proCardImage}
                  contentFit="cover"
                />
                <View style={styles.proCardContent}>
                  <Text style={styles.proCardTitle}>
                    Gifts & Event Business
                  </Text>
                  <Text style={styles.proCardDesc}>
                    Event planners and gift businesses turn cherished photos into animated keepsakes and shareable content
                  </Text>
                  <View style={styles.proCardStats}>
                    <Text style={styles.proCardStatsText}>95% engagement rate</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Card 3: Social Media */}
            <View style={styles.proCard}>
              <View style={styles.proCardInner}>
                <Image
                  source={require("@/assets/images/SocialMediaCampaigns.jpeg")}
                  style={styles.proCardImage}
                  contentFit="cover"
                />
                <View style={styles.proCardContent}>
                  <Text style={styles.proCardTitle}>
                    Social Media & Creators
                  </Text>
                  <Text style={styles.proCardDesc}>
                    Creators bring viral AI trends, photo motion, and engaging interactive content to millions of followers
                  </Text>
                  <View style={styles.proCardStats}>
                    <Text style={styles.proCardStatsText}>10M+ views generated</Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>
        </View>

        <TemplateExplorerModal 
          visible={isTemplateModalVisible} 
          onClose={() => setTemplateModalVisible(false)} 
          templates={animationTemplates} 
          onSelect={handleTemplateSelect} 
        />
      </ScreenWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  backgroundImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    width: SCREEN_WIDTH,
    zIndex: 0,
  },
  heroSection: {
    width: CONTENT_WIDTH,
    alignSelf: "center",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 36,
  },
  photoCompositionContainer: {
    width: "100%",
    height: 250,
    position: "relative",
    marginBottom: 16,
  },
  smallPhotoCard: {
    position: "absolute",
    top: 0,
    left: 4,
    width: 104,
    height: 76,
    borderRadius: 14,
    overflow: "hidden",
    zIndex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  smallPhotoImage: {
    width: "100%",
    height: "100%",
  },
  arrowContainer: {
    position: "absolute",
    top: 10,
    left: 114,
    zIndex: 10,
  },
  mainHeroPhotoCard: {
    position: "absolute",
    top: 42,
    right: 0,
    width: CONTENT_WIDTH * 0.80,
    height: 198,
    borderRadius: 20,
    overflow: "hidden",
    zIndex: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  mainHeroImage: {
    width: "100%",
    height: "100%",
  },
  heroTitle: {
    fontSize: SCREEN_WIDTH < 380 ? 24 : 28,
    fontFamily: getFontFamily("700"),
    textAlign: "center",
    lineHeight: 36,
    marginBottom: 10,
  },
  heroDescription: {
    fontSize: 15,
    fontFamily: getFontFamily("400"),
    color: "#475569",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  uploadButtonContainer: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#D229FF",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  uploadGradientButton: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButtonText: {
    fontSize: 17,
    fontFamily: getFontFamily("600"),
    color: "#FFFFFF",
  },
  templatesSection: {
    marginBottom: 44,
  },
  templatesSectionTitle: {
    fontSize: 24,
    fontFamily: getFontFamily("700"),
    textAlign: "center",
    lineHeight: 32,
    marginBottom: 18,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  categoryPillTouchable: {
    borderRadius: 20,
    overflow: "hidden",
  },
  activePillGradient: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  activePillText: {
    fontSize: 15,
    fontFamily: getFontFamily("600"),
    color: "#FFFFFF",
  },
  inactivePill: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  inactivePillText: {
    fontSize: 15,
    fontFamily: getFontFamily("500"),
    color: "#475569",
  },
  templateCard: {
    width: 116,
    marginRight: 12,
    alignItems: "center",
  },
  templateImageContainer: {
    width: 116,
    height: 152,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  templateImage: {
    width: "100%",
    height: "100%",
  },
  templatePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E2E8F0",
  },
  starBadgeContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  templateName: {
    fontSize: 14,
    fontFamily: getFontFamily("600"),
    color: "#0F172A",
    textAlign: "center",
    marginTop: 8,
    width: 116,
  },
  templateListWrapper: {
    position: "relative",
    width: "100%",
  },
  templateArrowButton: {
    position: "absolute",
    top: 58,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
    zIndex: 10,
  },
  templateArrowLeft: {
    left: 8,
  },
  templateArrowRight: {
    right: 8,
  },
  viewAllButton: {
    alignSelf: "center",
    marginTop: 14,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  viewAllText: {
    fontSize: 15,
    fontFamily: getFontFamily("600"),
    color: "#475569",
  },
  howToSection: {
    width: CONTENT_WIDTH,
    alignSelf: "center",
    marginBottom: 44,
  },
  howToTitle: {
    fontSize: 22,
    fontFamily: getFontFamily("700"),
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 26,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  stepImageWrapper: {
    width: "52%",
    height: 180,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  stepPngImage: {
    width: "100%",
    height: "100%",
  },
  stepVideo: {
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
  },
  stepTextWrapper: {
    width: "44%",
  },
  stepNumber: {
    fontSize: 19,
    fontFamily: getFontFamily("700"),
    color: "#0F172A",
    textDecorationLine: "underline",
    marginBottom: 4,
  },
  stepHeaderTitle: {
    fontSize: 20,
    fontFamily: getFontFamily("600"),
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 14,
    fontFamily: getFontFamily("400"),
    color: "#475569",
    lineHeight: 20,
  },
  highlightPink: {
    fontFamily: getFontFamily("600"),
    color: "#D229FF",
  },
  bigTryButtonContainer: {
    alignSelf: "center",
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 8,
    shadowColor: "#D229FF",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  bigTryGradient: {
    paddingVertical: 12,
    paddingHorizontal: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  bigTryButtonText: {
    fontSize: 18,
    fontFamily: getFontFamily("600"),
    color: "#FFFFFF",
  },
  transformationsSection: {
    width: CONTENT_WIDTH,
    alignSelf: "center",
    marginBottom: 44,
  },
  sectionHeadingTitle: {
    fontSize: 26,
    fontFamily: getFontFamily("700"),
    textAlign: "center",
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontFamily: getFontFamily("400"),
    color: "#475569",
    textAlign: "center",
    lineHeight: 23,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  gridContainer: {
    gap: 12,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  gridCard: {
    width: (CONTENT_WIDTH - 12) / 2,
    height: 170,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  trustedSection: {
    width: CONTENT_WIDTH,
    alignSelf: "center",
    marginBottom: 24,
  },
  proCardsContainer: {
    paddingRight: 16,
    gap: 16,
  },
  proCard: {
    width: 280,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
  },
  proCardInner: {
    width: "100%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  proCardImage: {
    width: "100%",
    height: 140,
  },
  proCardContent: {
    padding: 16,
  },
  proCardTitle: {
    fontSize: 18,
    fontFamily: getFontFamily("600"),
    color: "#04001F",
    marginBottom: 6,
  },
  proCardDesc: {
    fontSize: 14,
    fontFamily: getFontFamily("400"),
    color: "#64748B",
    lineHeight: 20,
    marginBottom: 12,
  },
  proCardStats: {
    alignSelf: "flex-start",
    backgroundColor: "#F3E8FF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  proCardStatsText: {
    fontSize: 13,
    fontFamily: getFontFamily("600"),
    color: "#7C3AED",
  },
});
