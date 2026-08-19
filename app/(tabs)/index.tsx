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
import { router } from "expo-router";
import { useEffect, useState, useCallback, useRef, memo, useMemo } from "react";
import * as ImagePicker from "expo-image-picker";
import { GradientText } from "@/components/ui/GradientText";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import { useAuth as useAuthContext } from "@/contexts/AuthContext";
import { useAuth } from "@clerk/clerk-expo";
import { api } from "@/services/api";
import { getFontFamily } from "@/constants/Fonts";
import { useTour } from "@/contexts/TourContext";
import { Video, ResizeMode } from "expo-av";
import TransformationGrid from "@/components/ui/TransformationGrid";
import HomeArrow from "@/components/images/HomeArrow";
import StarIcon from "@/components/images/StarIcon";
import TemplateExplorerModal from "@/components/ui/TemplateExplorerModal";
import AnimatedTemplateThumb from "@/components/ui/AnimatedTemplateThumb";
import BlogCard from "@/components/ui/BlogCard";
import ChevronLeftIcon from "@/components/images/ChevronLeftIcon";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTENT_WIDTH = SCREEN_WIDTH - 32;

// API base URL for template images
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "https://www.animatememories.com";

const formatImageUrl = (url?: string) => {
  if (!url) return "";
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:")
  ) {
    return url;
  }
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

const CATEGORIES = [
  "Trending",
  "Family",
  "Funny",
  "Birthday",
  "Wedding",
  "Hug",
  "Dance",
  "Kiss",
];

const DEFAULT_TEMPLATES = [
  { id: "warm-hug", name: "Warm Hug", image: require("@/assets/images/Home1.webp"), isStar: false, category: "Couples" },
  { id: "fighting-pose", name: "Fighting Pose", image: require("@/assets/images/Home2.webp"), isStar: true, category: "Funny" },
  { id: "head-lean", name: "Head Lean", image: require("@/assets/images/Home3.webp"), isStar: true, category: "Couples" },
  { id: "classic-wedding", name: "Classic Wedding", image: require("@/assets/images/ClassicWedding.jpg"), isStar: true, category: "Wedding" },
  { id: "family-memories", name: "Family Memories", image: require("@/assets/images/FamilyPhoto.jpg"), isStar: false, category: "Family" },
  { id: "vintage-portrait", name: "Vintage Portrait", image: require("@/assets/images/VintagePortrait.jpg"), isStar: true, category: "Trending" },
];

const TemplateCard = memo(
  ({
    item,
    onSelect,
    autoPlay,
  }: {
    item: any;
    onSelect: (id: string) => void;
    autoPlay?: boolean;
  }) => {
    const id = item.slug || item.id;
    const uri = item.image
      ? typeof item.image === "number" || typeof item.image === "object"
        ? item.image
        : { uri: formatImageUrl(item.thumbnailUrl || item.image) }
      : item.thumbnailUrl
      ? { uri: formatImageUrl(item.thumbnailUrl) }
      : undefined;

    return (
      <TouchableOpacity
        style={styles.templateCard}
        onPress={() => onSelect(id)}
        activeOpacity={0.85}
      >
        <View style={styles.templateImageContainer}>
          <AnimatedTemplateThumb
            thumbnail={uri}
            videoUrl={item.videoUrl ? formatImageUrl(item.videoUrl) : null}
            autoPlay={autoPlay}
            style={styles.templateImage}
          />
          {(item.isStar || item.isFeatured || item.is_featured) && (
            <View style={styles.starBadgeContainer}>
              <StarIcon width={11} height={11} color="#F59E0B" />
            </View>
          )}
        </View>
        <Text style={styles.templateName} numberOfLines={1} ellipsizeMode="tail">
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  }
);
TemplateCard.displayName = "TemplateCard";

// Step demo videos are always mounted with a poster frame (never an empty
// tile) and play only while their section is on screen. Playback is driven
// both by the shouldPlay prop and an explicit playAsync()/pauseAsync() call,
// because expo-av's shouldPlay alone is unreliable on Android when the
// visibility changes mid-scroll.
const StepVideo = memo(
  ({ source, poster, isVisible }: { source: any; poster: any; isVisible: boolean }) => {
    const videoRef = useRef<Video>(null);

    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      if (isVisible) {
        video.playAsync().catch(() => {});
      } else {
        video.pauseAsync().catch(() => {});
      }
    }, [isVisible]);

    return (
      <Video
        ref={videoRef}
        source={source}
        style={styles.stepVideo}
        resizeMode={ResizeMode.COVER}
        shouldPlay={isVisible}
        isLooping
        isMuted
        useNativeControls={false}
        usePoster
        posterSource={poster}
        posterStyle={{ resizeMode: "cover" }}
        onError={(error) => console.log("Step video failed to load:", error)}
      />
    );
  }
);
StepVideo.displayName = "StepVideo";

export default function HomeScreen() {
  const { user } = useAuthContext();
  const { getToken } = useAuth();
  const { startTour, endTour, isActive, currentStep } = useTour();
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [latestBlogs, setLatestBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [animationTemplates, setAnimationTemplates] = useState<any[]>(DEFAULT_TEMPLATES);
  const [selectedCategory, setSelectedCategory] = useState("Trending");
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isTemplateModalVisible, setTemplateModalVisible] = useState(false);
  // Horizontal position of the template carousel (drives navigation arrows).
  const [templateScrollX, setTemplateScrollX] = useState(0);
  // Track active scrolling to pause template video decoders mid-scroll for maximum 60fps smoothness.
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleScrollBegin = useCallback(() => {
    if (scrollEndTimeoutRef.current) {
      clearTimeout(scrollEndTimeoutRef.current);
    }
    setIsScrolling(true);
  }, []);

  const handleScrollEnd = useCallback(() => {
    if (scrollEndTimeoutRef.current) {
      clearTimeout(scrollEndTimeoutRef.current);
    }
    scrollEndTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 120);
  }, []);

  useEffect(() => {
    return () => {
      if (scrollEndTimeoutRef.current) {
        clearTimeout(scrollEndTimeoutRef.current);
      }
    };
  }, []);

  // Template cards currently inside the viewport — only these autoplay their
  // preview video, so off-screen cards never hold a native player.
  const [visibleTemplateIds, setVisibleTemplateIds] = useState<Set<string>>(
    () => new Set()
  );
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: any[] }) => {
      setVisibleTemplateIds(
        new Set(
          viewableItems.map((v: any) =>
            String(v.item?.slug || v.item?.id)
          )
        )
      );
    }
  ).current;

  const filteredTemplates = useMemo(() => {
    if (selectedCategory === "Trending") {
      return animationTemplates.slice(0, 8);
    }
    const filtered = animationTemplates.filter((t) => {
      const catStr = (t.category || t.categoryId || "").toLowerCase();
      return catStr === selectedCategory.toLowerCase();
    });
    // Fallback to all if category has no templates, capped to 8
    return (filtered.length > 0 ? filtered : animationTemplates).slice(0, 8);
  }, [animationTemplates, selectedCategory]);

  const handleScroll = useCallback((event: any) => {
    const y = event.nativeEvent?.contentOffset?.y || 0;
    setScrollOffset(y);
  }, []);

  const isHeroVisible = scrollOffset < 600;
  const isTransformationsVisible = scrollOffset > 300 && scrollOffset < 2400;
  // Play the step demo videos only while the user is in this section of the
  // page, so they don't stack on top of the hero/transformation videos that
  // are already decoding (the 256MB Android heap OOMs otherwise).
  const isStepsVisible = scrollOffset > 200 && scrollOffset < 2600;

  useEffect(() => {
    const fetchUserCredits = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const token = await getToken();
        const result = await api.verifyUser(user, token);
        setUserCredits(result.result?.credits || 0);
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
          setAnimationTemplates(presets);
        }
      } catch (error) {
        console.error("Failed to fetch templates", error);
      }
    };

    const fetchBlogs = async () => {
      try {
        const response = await api.getBlogs(3);
        const blogs = response?.blogs || [];
        if (blogs.length > 0) setLatestBlogs(blogs);
      } catch (error) {
        console.error("Failed to fetch blogs", error);
      }
    };

    fetchBlogs();
    fetchTemplates();

    if (user) {
      fetchUserCredits();
    } else {
      setLoading(false);
    }

    startTour();
  }, [user]);

  const handleTryForFree = () => {
    endTour();
    router.push("/(tabs)/animate");
  };

  const requestImagePermission = async () => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant camera roll permissions to upload images."
        );
        return false;
      }
    }
    return true;
  };

  const handleUploadImage = async () => {
    try {
      const hasPermission = await requestImagePermission();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled || !result.assets || !result.assets[0]) {
        return;
      }

      const imageUri = result.assets[0].uri;
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
      Alert.alert(
        "Error",
        error.message || "Failed to pick image. Please try again."
      );
    }
  };

  const handleTemplateSelect = useCallback((templateId: string) => {
    router.push({
      pathname: "/(tabs)/animate",
      params: {
        templateId: templateId,
      },
    });
  }, []);

  const renderTemplateItem = useCallback(
    ({ item }: { item: any }) => (
      <TemplateCard
        item={item}
        onSelect={handleTemplateSelect}
        autoPlay={visibleTemplateIds.has(String(item.slug || item.id))}
      />
    ),
    [handleTemplateSelect, visibleTemplateIds]
  );

  const templateKeyExtractor = useCallback(
    (item: any, index: number) => item.slug || item.id || `tpl-${index}`,
    []
  );

  // Geometry calculations for template horizontal carousel navigation arrows
  const TEMPLATE_ITEM_PITCH = 128; // 116 card + 12 right margin
  const templateContentWidth =
    filteredTemplates.length * TEMPLATE_ITEM_PITCH + 32; // + 16px padding each side
  const templateViewportWidth = SCREEN_WIDTH;
  const templateHasOverflow = templateContentWidth > templateViewportWidth;
  const templateProgress = templateHasOverflow
    ? Math.min(
        1,
        Math.max(
          0,
          templateScrollX / (templateContentWidth - templateViewportWidth)
        )
      )
    : 0;

  const templateListRef = useRef<FlatList>(null);

  const handleScrollLeft = useCallback(() => {
    if (templateListRef.current) {
      templateListRef.current.scrollToOffset({
        offset: Math.max(0, templateScrollX - TEMPLATE_ITEM_PITCH * 2),
        animated: true,
      });
    }
  }, [templateScrollX, TEMPLATE_ITEM_PITCH]);

  const handleScrollRight = useCallback(() => {
    if (templateListRef.current) {
      templateListRef.current.scrollToOffset({
        offset: templateScrollX + TEMPLATE_ITEM_PITCH * 2,
        animated: true,
      });
    }
  }, [templateScrollX, TEMPLATE_ITEM_PITCH]);

  // Background Image Height based on 1080x1920 ratio scaled to screen width
  const bgHeight = (SCREEN_WIDTH * 1920) / 1080;

  return (
    <View style={styles.outerContainer} pointerEvents={isActive && currentStep === 1 ? "none" : "auto"}>
      <ScreenWrapper
        backgroundColor="transparent"
        addBottomPadding={true}
        onScroll={handleScroll}
        onScrollBeginDrag={handleScrollBegin}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollBegin={handleScrollBegin}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={32}
        scrollEnabled={!(isActive && currentStep === 1) && !isTemplateModalVisible}
        creditsText={
          userCredits !== null
            ? `${userCredits} Credits`
            : "Loading..."
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
                source={require("@/assets/images/HomePhoto.jpeg")}
                style={styles.smallPhotoImage}
                contentFit="cover"
              />
            </View>

            {/* Arrow pointing to main photo */}
            <View style={styles.arrowContainer}>
              <HomeArrow width={34} height={32} />
            </View>

            {/* Main Hero Video from web */}
            <View style={styles.mainHeroPhotoCard}>
              <Video
                source={require("@/assets/videos/HomeVideo.mp4")}
                style={styles.mainHeroImage}
                resizeMode={ResizeMode.COVER}
                isLooping
                shouldPlay={isHeroVisible}
                isMuted
                useNativeControls={false}
                usePoster={true}
                posterSource={require("@/assets/images/HomePhoto.jpeg")}
                posterStyle={{ resizeMode: "cover" }}
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
            {CATEGORIES.map((cat) => {
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
          <View style={styles.templateListWrapper}>
            <FlatList
              ref={templateListRef}
              horizontal
              data={filteredTemplates}
              renderItem={renderTemplateItem}
              keyExtractor={templateKeyExtractor}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingLeft: 16, paddingRight: 16 }}
              initialNumToRender={4}
              maxToRenderPerBatch={4}
              windowSize={3}
              removeClippedSubviews={Platform.OS === "android"}
              viewabilityConfig={viewabilityConfig}
              onViewableItemsChanged={onViewableItemsChanged}
              onScrollBeginDrag={handleScrollBegin}
              onScrollEndDrag={handleScrollEnd}
              onMomentumScrollBegin={handleScrollBegin}
              onMomentumScrollEnd={handleScrollEnd}
              onScroll={(e) => setTemplateScrollX(e.nativeEvent.contentOffset.x)}
              scrollEventThrottle={32}
            />

            {/* Left Arrow Button */}
            {templateHasOverflow && templateScrollX > 10 && (
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
            {templateHasOverflow && templateProgress < 0.98 && (
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

        {/* Latest Blogs feed */}
        {latestBlogs.length > 0 && (
          <View style={styles.blogsSection}>
            <GradientText style={styles.sectionHeadingTitle}>
              Latest Blogs
            </GradientText>
            <Text style={styles.sectionSubtitle}>
              Tips, stories & updates on AI photo animation.
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.blogsContainer}
            >
              {latestBlogs.map((blog) => (
                <BlogCard key={blog.id} blog={blog} width={280} />
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.blogsViewAllButton}
              onPress={() => router.push("/blogs")}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#38BDF8", "#A855F7", "#D229FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.blogsViewAllGradient}
              >
                <Text style={styles.blogsViewAllText}>View All Blogs</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

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
  blogsSection: {
    width: CONTENT_WIDTH,
    alignSelf: "center",
    marginBottom: 32,
  },
  blogsContainer: {
    paddingRight: 16,
    gap: 14,
  },
  blogsViewAllButton: {
    alignSelf: "center",
    marginTop: 20,
    borderRadius: 999,
    overflow: "hidden",
  },
  blogsViewAllGradient: {
    paddingHorizontal: 28,
    paddingVertical: 13,
  },
  blogsViewAllText: {
    fontSize: 16,
    fontFamily: getFontFamily("600"),
    color: "#FFFFFF",
  },
});
