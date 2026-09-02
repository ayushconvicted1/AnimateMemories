import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  ScrollView,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
  PanResponder,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { Video, ResizeMode } from "expo-av";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import AnimatedTemplateThumb from "@/components/ui/AnimatedTemplateThumb";
import { GradientText } from "@/components/ui/GradientText";
import FullScreenVideoViewer from "@/components/ui/FullScreenVideoViewer";
import GeneratingModal from "@/components/ui/GeneratingModal";
import SavedToast from "@/components/ui/SavedToast";
import DurationSlider from "@/components/ui/DurationSlider";
import UploadIcon from "@/components/images/UploadIcon";
import SurpriseMeIcon from "@/components/images/SurpriseMeIcon";
import GenerateIcon from "@/components/images/GenerateIcon";
import GenerateCreditIcon from "@/components/images/GenerateCreditIcon";
import SearchIcon from "@/components/images/SearchIcon";
import EditIcon from "@/components/images/EditIcon";
import CreditIcon from "@/components/images/CreditIcon";
import BeforeAfterSlider from "@/components/ui/BeforeAfterSlider";
import { useAuth as useAuthContext } from "@/contexts/AuthContext";
import { useAuth } from "@clerk/clerk-expo";
import { api } from "@/services/api";
import { downloadToDevice } from "@/lib/download";
import { useLocalSearchParams, router } from "expo-router";
import { useTour } from "@/contexts/TourContext";
import TourStepWrapper from "@/components/tour/TourStepWrapper";
import { getFontFamily } from "@/constants/Fonts";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CONTENT_WIDTH = SCREEN_WIDTH - 32;

// API base URL for template images
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "https://www.animatememories.com";

const formatImageUrl = (url?: string) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

const promptExamples = [
  "slowly turns head left and right, blinks softly, gentle smile",
  "natural breathing motion, subtle eye movement, peaceful expression",
  "gentle swaying dance movement, rhythmic head bob, joyful expression",
  "family smiling warmly together, gentle head nods, cheerful expressions",
  "playful dancing with shoulder movements, happy facial expressions",
];

const VIDEO_MODELS = [
  {
    id: "kling-v2-1",
    name: "⚡ Kling v2.1",
    badge: "Default",
    desc: "Fast, realistic motion & face preservation",
    minDuration: 4,
    maxDuration: 10,
    allowedDurations: [5, 10],
    supportedResolutions: ["720p", "1080p"],
    costPerSecond: 0.05,
    creditsPerSecond: { "720p": 0.8, "1080p": 1.6 },
  },
  {
    id: "seedance-2-fast",
    name: "🚀 Seedance 2.0 Fast",
    badge: "Quick",
    desc: "High detail & smooth motion",
    minDuration: 4,
    maxDuration: 10,
    supportedResolutions: ["720p"],
    costPerSecond: 0.08,
    creditsPerSecond: { "720p": 1.0 },
  },
  {
    id: "seedance-2",
    name: "✨ Seedance 2.0 Premium",
    badge: "Pro",
    desc: "Ultra-cinematic motion quality",
    minDuration: 4,
    maxDuration: 10,
    supportedResolutions: ["720p", "1080p"],
    costPerSecond: 0.15,
    creditsPerSecond: { "720p": 1.6, "1080p": 2.6 },
  },
];

function calculateCreditCost(modelId: string, quality: string, duration: number, featureCosts?: any) {
  const model = VIDEO_MODELS.find((m) => m.id === modelId);
  const dur = Number(duration) || 5;

  if (featureCosts) {
    const key = `model_${modelId.replace(/-/g, "_")}_${quality}`;
    if (featureCosts[key] !== undefined && featureCosts[key] !== null) {
      const val = Number(featureCosts[key]);
      return Math.ceil(val * dur);
    }
    const directModelKey = `model_${modelId.replace(/-/g, "_")}`;
    if (featureCosts[directModelKey] !== undefined && featureCosts[directModelKey] !== null) {
      const val = Number(featureCosts[directModelKey]);
      return Math.ceil(val * (dur / 5));
    }
    const featureKey = quality === "1080p" ? "animate_photo_uhd" : quality === "720p" ? "animate_photo_hd" : "animate_photo";
    if (featureCosts[featureKey] !== undefined && featureCosts[featureKey] !== null) {
      return Number(featureCosts[featureKey]);
    }
    if (featureCosts.animate_photo !== undefined && featureCosts.animate_photo !== null) {
      return Number(featureCosts.animate_photo);
    }
  }

  if (model?.creditsPerSecond) {
    const perSec = (model.creditsPerSecond as any)[quality] || Object.values(model.creditsPerSecond)[0];
    if (perSec) return Math.ceil(perSec * dur);
  }

  return 4;
}

export default function AnimateScreen() {
  const { user } = useAuthContext();
  const { getToken } = useAuth();
  const { currentStep, isActive, nextStep, endTour } = useTour();
  const params = useLocalSearchParams();
  const mainScrollViewRef = useRef<ScrollView>(null);
  const [templatesLayoutY, setTemplatesLayoutY] = useState(0);

  // Default to animate tool and jump scare template
  const [selectedTool, setSelectedTool] = useState<
    "restore" | "animate" | "enhance" | null
  >("animate");
  const [customPrompt, setCustomPrompt] = useState(
    "A person in costume suddenly lunges forward with a spooky expression, arms extended as if to grab the viewer."
  );
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  const hasAutoScrolledRef = useRef(false);
  const isActiveRef = useRef(isActive);
  const currentStepRef = useRef(currentStep);
  const uploadedImageRef = useRef(uploadedImage);
  const templatesLayoutYRef = useRef(templatesLayoutY);

  useEffect(() => {
    isActiveRef.current = isActive;
    currentStepRef.current = currentStep;
    uploadedImageRef.current = uploadedImage;
    templatesLayoutYRef.current = templatesLayoutY;
  }, [isActive, currentStep, uploadedImage, templatesLayoutY]);

  useEffect(() => {
    if (currentStep !== 2) {
      hasAutoScrolledRef.current = false;
    }
  }, [currentStep]);

  const triggerAutoScrollToTemplates = useCallback(() => {
    if (
      isActiveRef.current &&
      currentStepRef.current === 2 &&
      uploadedImageRef.current &&
      !hasAutoScrolledRef.current
    ) {
      hasAutoScrolledRef.current = true;
      mainScrollViewRef.current?.scrollTo({
        y: Math.max(0, (templatesLayoutYRef.current || 680) - 40),
        animated: true,
      });
      setTimeout(() => {
        nextStep();
      }, 400); // Wait for scroll animation to complete
    }
  }, [nextStep]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        const isSwipe = Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
        return (
          isActiveRef.current &&
          currentStepRef.current === 2 &&
          !!uploadedImageRef.current &&
          isSwipe
        );
      },
      onPanResponderGrant: () => {
        triggerAutoScrollToTemplates();
      },
      onPanResponderMove: () => {
        triggerAutoScrollToTemplates();
      },
    })
  ).current;
  const [restoredImage, setRestoredImage] = useState<string | null>(null);
  const [animatedVideo, setAnimatedVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isSubmittingRef = useRef(false);
  const [uploading, setUploading] = useState(false);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [isSurpriseLoading, setIsSurpriseLoading] = useState<boolean>(false);
  const [uploadHighlighted, setUploadHighlighted] = useState<boolean>(false);
  const [surpriseSubject, setSurpriseSubject] = useState<string>("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(
    "jump-scare"
  );
  const [activeTabMode, setActiveTabMode] = useState<"template" | "custom">("template");
  const [enhanceOptions, setEnhanceOptions] = useState({
    upscale: true,
    faceEnhance: false,
    colorize: false,
  });
  const [showFullScreenVideo, setShowFullScreenVideo] = useState(false);
  // Real progress (0-100) reported by the backend for the animate tool
  const [genProgress, setGenProgress] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [savedToast, setSavedToast] = useState<{
    title: string;
    path: string | null;
  } | null>(null);
  const [hasProcessedInitialImage, setHasProcessedInitialImage] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [isResultVideoLoading, setIsResultVideoLoading] = useState(true);
  const previewVideoRef = useRef<Video>(null);
  const [featureCosts, setFeatureCosts] = useState<any>(null);
  const [selectedQuality, setSelectedQuality] = useState<"480p" | "720p" | "1080p">("720p");
  const [selectedModel, setSelectedModel] = useState<string>("kling-v2-1");
  const [selectedDuration, setSelectedDuration] = useState<number>(5);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState<"vertical" | "horizontal" | "square">("vertical");

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [animationTemplates, setAnimationTemplates] = useState<any[]>([]);
  const [isPagerScrolling, setIsPagerScrolling] = useState(false);
  // Autoplay the current page's template previews only while the grid is on
  // screen — as soon as it scrolls out of view the videos unmount, so hidden
  // cards never hold a native player.
  const [gridOnScreen, setGridOnScreen] = useState(true);
  const scrollYRef = useRef(0);
  const templatesGridYRef = useRef(0);
  const templatesGridHRef = useRef(0);

  const updateGridVisibility = useCallback(() => {
    if (!templatesLayoutYRef.current) {
      setGridOnScreen(true);
      return;
    }
    const top = templatesLayoutYRef.current + templatesGridYRef.current;
    const bottom = top + (templatesGridHRef.current || 400);
    const visible =
      scrollYRef.current + SCREEN_HEIGHT > top - 150 &&
      scrollYRef.current < bottom + 150;
    setGridOnScreen((prev) => (prev === visible ? prev : visible));
  }, []);

  // Re-evaluate grid visibility whenever the templates section moves/resizes.
  useEffect(() => {
    updateGridVisibility();
  }, [templatesLayoutY, updateGridVisibility]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 6;

  const isCategoryMatch = useCallback((template: any, targetCategoryVal: string) => {
    if (!targetCategoryVal || targetCategoryVal.toLowerCase() === "all") return true;
    const selLower = targetCategoryVal.toLowerCase();

    const tCat = (template.category || "").toString().toLowerCase();
    const tCatId = (template.categoryId || "").toString().toLowerCase();

    if (tCat === selLower || tCatId === selLower) return true;

    const catObj = categories.find(
      (c) => (c.slug || c.name || c.id || "").toString().toLowerCase() === selLower
    );

    if (catObj) {
      const slug = (catObj.slug || "").toString().toLowerCase();
      const name = (catObj.name || "").toString().toLowerCase();
      const id = (catObj.id || "").toString().toLowerCase();
      return tCat === slug || tCat === name || tCatId === id || tCatId === slug;
    }

    return false;
  }, [categories]);

  const categoryPillsScrollRef = useRef<ScrollView>(null);
  const templatePagerRef = useRef<ScrollView>(null);

  const allCatList = useMemo(() => {
    const list = [{ id: "all", name: "All", slug: "all" }];
    const seen = new Set(["all"]);
    categories.forEach((cat: any) => {
      const slug = (cat.slug || cat.name || cat.id || "").toLowerCase();
      if (slug && !seen.has(slug)) {
        seen.add(slug);
        list.push(cat);
      }
    });
    return list;
  }, [categories]);

  const handleCategoryPillPress = useCallback((catValue: string) => {
    setSelectedCategory(catValue);
    setCurrentPage(1);
    templatePagerRef.current?.scrollTo({ x: 0, animated: false });
  }, []);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    setCurrentPage(1);
    templatePagerRef.current?.scrollTo({ x: 0, animated: false });
  }, []);

  const filteredTemplates = useMemo(() => {
    let result = animationTemplates.filter((t) => isCategoryMatch(t, selectedCategory));
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name?.toLowerCase().includes(q) ||
          t.prompt?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [animationTemplates, selectedCategory, searchQuery, isCategoryMatch]);

  const templatePages = useMemo(() => {
    const chunks: any[][] = [];
    for (let i = 0; i < filteredTemplates.length; i += ITEMS_PER_PAGE) {
      chunks.push(filteredTemplates.slice(i, i + ITEMS_PER_PAGE));
    }
    return chunks.length > 0 ? chunks : [[]];
  }, [filteredTemplates]);

  const totalPages = Math.max(1, templatePages.length);

  const currentModel = VIDEO_MODELS.find((m) => m.id === selectedModel) || VIDEO_MODELS[0];

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    const model = VIDEO_MODELS.find((m) => m.id === modelId);
    if (model) {
      if (model.allowedDurations && model.allowedDurations.length > 0) {
        if (!model.allowedDurations.includes(selectedDuration)) {
          setSelectedDuration(model.allowedDurations[0]);
        }
      } else {
        if (selectedDuration === 5 && model.minDuration === 4) {
          setSelectedDuration(4);
        } else if (selectedDuration < model.minDuration) {
          setSelectedDuration(model.minDuration);
        } else if (selectedDuration > model.maxDuration) {
          setSelectedDuration(model.maxDuration);
        }
      }
    }
  };

  // Auto-advance from Step 1 to Step 2 upon entering Animate screen during tour
  useEffect(() => {
    if (isActive && currentStep === 1) {
      nextStep();
    }
  }, [isActive, currentStep, nextStep]);

  // Auto-scroll to templates section when onboarding tour reaches Step 3 or 4
  useEffect(() => {
    if (isActive && currentStep === 3) {
      const targetY = Math.max(0, (templatesLayoutYRef.current || templatesLayoutY || 680) - 40);
      mainScrollViewRef.current?.scrollTo({ y: targetY, animated: true });
      const t1 = setTimeout(() => {
        mainScrollViewRef.current?.scrollTo({ y: targetY, animated: true });
      }, 50);
      const t2 = setTimeout(() => {
        mainScrollViewRef.current?.scrollTo({ y: targetY, animated: true });
      }, 250);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else if (isActive && currentStep === 4) {
      mainScrollViewRef.current?.scrollToEnd({ animated: true });
      const t1 = setTimeout(() => {
        mainScrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(t1);
    }
  }, [isActive, currentStep, templatesLayoutY]);

  // Auto-clamp duration and adjust quality when model changes
  useEffect(() => {
    if (currentModel) {
      if (currentModel.allowedDurations && !currentModel.allowedDurations.includes(selectedDuration)) {
        setSelectedDuration(currentModel.allowedDurations[0]);
      } else if (selectedDuration < currentModel.minDuration) {
        setSelectedDuration(currentModel.minDuration);
      } else if (selectedDuration > currentModel.maxDuration) {
        setSelectedDuration(currentModel.maxDuration);
      }

      if (!currentModel.supportedResolutions.includes(selectedQuality as any)) {
        setSelectedQuality(currentModel.supportedResolutions[0] as any);
      }
    }
  }, [selectedModel]);

  useEffect(() => {
    const fetchCosts = async () => {
      try {
        const response = await api.getFeatureCosts();
        setFeatureCosts(response?.result);
      } catch (error) {
        console.error("Failed to fetch feature costs", error);
      }
    };
    fetchCosts();

    const fetchTemplates = async () => {
      try {
        const response = await api.getVideoPresets();
        const presetsList = response?.result || response?.presets || (Array.isArray(response) ? response : []);
        if (presetsList.length > 0) {
          setAnimationTemplates(presetsList);

          if (!selectedTemplate) {
            setSelectedTemplate(presetsList[0].slug || presetsList[0].id);
            setCustomPrompt(presetsList[0].prompt || "");
          }
        }
      } catch (error) {
        console.error("Failed to fetch templates", error);
      }
    };
    fetchTemplates();

    const fetchCategories = async () => {
      try {
        const response = await api.getTemplateCategories();
        if (response && response.result) {
          setCategories(response.result);
        }
      } catch (error) {
        console.error("Failed to fetch categories", error);
      }
    };
    fetchCategories();
  }, []);

  const fetchUserCredits = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getToken();
      const result = await api.verifyUser(user, token);
      setUserCredits(result.result?.credits || 0);
    } catch (error) {
      console.error("Error fetching credits:", error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserCredits();
    }
  }, [user, fetchUserCredits]);

  // Handle incoming image from route params
  useEffect(() => {
    const imageUri = params.imageUri as string | undefined;

    if (imageUri && !hasProcessedInitialImage && user) {
      setHasProcessedInitialImage(true);
      const decodedUri = decodeURIComponent(imageUri);
      uploadImageFromUri(decodedUri);
    }
  }, [params.imageUri, hasProcessedInitialImage, user]);

  // Handle incoming template ID from route params
  useEffect(() => {
    const templateId = params.templateId as string | undefined;

    if (templateId && animationTemplates.length > 0) {
      const template = animationTemplates.find((t) => (t.slug || t.id) === templateId);
      if (template) {
        setSelectedTemplate(template.slug || template.id);
        setCustomPrompt(template.prompt);
      }
    }
  }, [params.templateId, animationTemplates]);

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

  // Helper function to upload image from URI
  const uploadImageFromUri = useCallback(async (imageUri: string) => {
    if (!imageUri) return;

    setUploading(true);
    try {
      const token = await getToken();
      const cloudinaryUrl = await api.uploadImage(imageUri, token);
      if (!cloudinaryUrl) {
        throw new Error("Upload failed - no URL returned");
      }
      setUploadedImage(cloudinaryUrl);
      setRestoredImage(null);
      setAnimatedVideo(null);

      if (animationTemplates && animationTemplates.length > 0) {
        setSelectedTemplate(animationTemplates[0].slug || animationTemplates[0].id);
        setCustomPrompt(animationTemplates[0].prompt || "");
      }
    } catch (uploadError: any) {
      console.error("Upload error:", uploadError);
      Alert.alert(
        "Upload Error",
        uploadError.message ||
        "Failed to upload image. Please check your internet connection and try again."
      );
    } finally {
      setUploading(false);
    }
  }, [getToken, animationTemplates, currentStep, nextStep]);

  const getAspectForMode = (
    mode: "vertical" | "horizontal" | "square"
  ): [number, number] => {
    if (mode === "horizontal") return [16, 9];
    if (mode === "square") return [1, 1];
    return [9, 16]; // vertical
  };

  const pickImage = async (overrideAspect?: "vertical" | "horizontal" | "square") => {
    try {
      const hasPermission = await requestImagePermission();
      if (!hasPermission) return;

      const targetRatio = overrideAspect || selectedAspectRatio;
      const aspect =
        selectedTool === "animate"
          ? getAspectForMode(targetRatio)
          : undefined;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: aspect,
        quality: 0.9,
      });

      if (result.canceled || !result.assets || !result.assets[0]) {
        return;
      }

      const asset = result.assets[0];
      if (asset.fileSize && asset.fileSize > 20 * 1024 * 1024) {
        Alert.alert(
          "File Too Large",
          "The selected image exceeds the maximum allowed size of 20MB. Please choose a smaller image."
        );
        return;
      }

      setUploading(true);
      const imageUri = asset.uri;

      if (!imageUri) {
        throw new Error("Image URI is missing");
      }

      await uploadImageFromUri(imageUri);
    } catch (error: any) {
      console.error("Error picking image:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to pick image. Please try again."
      );
      setUploading(false);
    }
  };

  const handleSurpriseMe = async () => {
    if (!uploadedImage) {
      setUploadHighlighted(true);
      mainScrollViewRef.current?.scrollTo({ y: 0, animated: true });
      Alert.alert(
        "Upload Required",
        "Please upload a photo first so AI can detect the subject and generate a custom prompt for you!",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Upload Photo", onPress: () => pickImage() },
        ]
      );
      setTimeout(() => {
        pickImage();
      }, 350);
      setTimeout(() => setUploadHighlighted(false), 4500);
      return;
    }

    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to use Surprise Me.");
      return;
    }

    const userEmail =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress;

    if (!userEmail) {
      Alert.alert("Error", "Unable to get user email.");
      return;
    }

    if ((userCredits ?? 0) < 1) {
      Alert.alert(
        "Insufficient Credits",
        `You need at least 1 credit to use Surprise Me. You currently have ${userCredits ?? 0} credit(s).`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Buy Credits", onPress: () => router.push("/(tabs)/credit") },
        ]
      );
      return;
    }

    setIsSurpriseLoading(true);
    setSurpriseSubject("");

    try {
      const token = await getToken();
      const res = await api.generateSurprisePrompt(uploadedImage, userEmail, token);

      if (res?.success && res?.prompt) {
        setCustomPrompt(res.prompt);
        setActiveTabMode("custom");
        setSelectedTemplate(null);

        if (res.subject) {
          setSurpriseSubject(res.subject);
        }

        if (typeof res.remainingCredits === "number") {
          setUserCredits(res.remainingCredits);
        } else {
          setUserCredits((prev) => Math.max(0, (prev ?? 1) - 1));
        }
      } else {
        throw new Error(res?.error || "Failed to generate AI prompt");
      }
    } catch (error: any) {
      console.error("Error generating surprise prompt:", error);
      Alert.alert(
        "Surprise Me Error",
        error.message || "Failed to generate AI prompt. Please try again."
      );
    } finally {
      setIsSurpriseLoading(false);
    }
  };

  const handleReset = () => {
    setUploadedImage(null);
    setRestoredImage(null);
    setAnimatedVideo(null);
  };

  const handleRestore = async () => {
    if (loading || isSubmittingRef.current) return;
    if (!uploadedImage) {
      Alert.alert("No Image", "Please upload an image first.");
      return;
    }

    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to restore images.");
      return;
    }

    const userEmail =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress;
    if (!userEmail) {
      Alert.alert("Error", "Unable to get user email.");
      return;
    }

    const cost = featureCosts?.restore_photo || 1;
    if ((userCredits ?? 0) < cost) {
      Alert.alert(
        "Insufficient Credits",
        `You need at least ${cost} credit(s) to restore images. You currently have ${userCredits ?? 0} credit(s).`
      );
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    try {
      const token = await getToken();
      const result = await api.restoreImage(uploadedImage, userEmail, token);
      setRestoredImage(result.result);
      await fetchUserCredits();
      Alert.alert("Success", "Photo restored successfully!");
    } catch (error: any) {
      console.error("Error restoring image:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to restore image. Please try again."
      );
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleEnhance = async () => {
    if (loading || isSubmittingRef.current) return;
    if (!uploadedImage) {
      Alert.alert("No Image", "Please upload an image first.");
      return;
    }

    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to enhance images.");
      return;
    }

    const userEmail =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress;
    if (!userEmail) {
      Alert.alert("Error", "Unable to get user email.");
      return;
    }

    let totalCost = 0;
    if (enhanceOptions.upscale) totalCost += featureCosts?.enhance_upscale || 1;
    if (enhanceOptions.faceEnhance) totalCost += featureCosts?.enhance_face || 1;
    if (enhanceOptions.colorize) totalCost += featureCosts?.enhance_colorize || 1;

    if (totalCost === 0) {
      Alert.alert("Error", "Please select at least one enhancement option.");
      return;
    }

    if ((userCredits ?? 0) < totalCost) {
      Alert.alert(
        "Insufficient Credits",
        `You need at least ${totalCost} credits to perform this enhancement. Please purchase more credits to continue.`
      );
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    try {
      const token = await getToken();
      const result = await api.enhanceImage(uploadedImage, userEmail, enhanceOptions, token);
      setRestoredImage(result.result);
      await fetchUserCredits();
      Alert.alert("Success", "Image enhanced successfully!");
    } catch (error: any) {
      console.error("Error enhancing image:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to enhance image. Please try again."
      );
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
    }
  };

  const handleAnimate = async () => {
    if (loading || isSubmittingRef.current) return;
    if (isActive && currentStep === 4) {
      endTour();
    }
    if (!uploadedImage) {
      Alert.alert("No Image", "Please upload an image first.");
      return;
    }

    if (!user) {
      Alert.alert("Sign In Required", "Please sign in to animate images.");
      return;
    }

    const userEmail =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress;
    if (!userEmail) {
      Alert.alert("Error", "Unable to get user email.");
      return;
    }

    let prompt = customPrompt;
    if (selectedTemplate) {
      const template = animationTemplates.find(
        (t) => (t.slug || t.id) === selectedTemplate
      );
      if (template) {
        prompt = template.prompt;
      }
    }

    const requiredCredits = calculateCreditCost(selectedModel, selectedQuality, selectedDuration, featureCosts);
    if ((userCredits ?? 0) < requiredCredits) {
      Alert.alert(
        "Insufficient Credits",
        `You need at least ${requiredCredits} credit(s) to animate images. You currently have ${userCredits ?? 0} credit(s).`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Buy Credits", onPress: () => router.push("/(tabs)/credit") },
        ]
      );
      return;
    }

    isSubmittingRef.current = true;
    setLoading(true);
    setGenProgress(null);
    try {
      const token = await getToken();
      const imageToAnimate = restoredImage || uploadedImage;

      // Start the async prediction and poll its real progress
      const startResult = await api.startAnimatePhoto(
        imageToAnimate,
        userEmail,
        prompt,
        selectedDuration,
        token,
        selectedQuality,
        selectedModel,
        selectedAspectRatio
      );
      const predictionId = startResult?.predictionId;
      if (!predictionId) {
        throw new Error(
          startResult?.error || "Failed to start video generation."
        );
      }

      const result = await pollAnimationStatus(
        predictionId,
        userEmail,
        startResult?.creditCost || 0
      );
      setGenProgress(100);
      setAnimatedVideo(result);
      await fetchUserCredits();
    } catch (error: any) {
      console.error("Error animating image:", error);
      await fetchUserCredits(); // Credits may have been refunded on failure
      Alert.alert(
        "Error",
        error.message || "Failed to animate image. Please try again."
      );
    } finally {
      setLoading(false);
      isSubmittingRef.current = false;
      setGenProgress(null);
    }
  };

  const totalEnhanceCost = useMemo(() => {
    let cost = 0;
    if (enhanceOptions.upscale) cost += featureCosts?.enhance_upscale || 1;
    if (enhanceOptions.faceEnhance) cost += featureCosts?.enhance_face || 1;
    if (enhanceOptions.colorize) cost += featureCosts?.enhance_colorize || 1;
    return cost;
  }, [enhanceOptions, featureCosts]);

  const getCreditCost = () => {
    if (selectedTool === "restore") {
      return featureCosts?.restore_photo || 1;
    }
    if (selectedTool === "enhance") {
      return totalEnhanceCost;
    }
    if (selectedTool === "animate") {
      return calculateCreditCost(selectedModel, selectedQuality, selectedDuration, featureCosts);
    }
    return 0;
  };

  const handleAction = () => {
    if (isActive && currentStep === 4) {
      endTour();
    }
    const cost = getCreditCost();
    if (userCredits !== null && userCredits < cost) {
      router.push("/(tabs)/credit");
      return;
    }
    if (!uploadedImage) {
      setUploadHighlighted(true);
      mainScrollViewRef.current?.scrollTo({ y: 0, animated: true });
      Alert.alert(
        "Upload Required",
        "Please upload a photo first to generate your animation!",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Upload Photo", onPress: () => pickImage() },
        ]
      );
      return;
    }
    if (selectedTool === "restore") {
      handleRestore();
    } else if (selectedTool === "enhance") {
      handleEnhance();
    } else if (selectedTool === "animate") {
      handleAnimate();
    }
  };

  const requiredCredits = getCreditCost();
  const hasInsufficientCredits = userCredits !== null && userCredits < requiredCredits;
  const isActionDisabled =
    loading ||
    uploading ||
    isSubmittingRef.current ||
    (selectedTool === "enhance" && requiredCredits === 0);

  const handleDownload = async (url: string, type: "image" | "video") => {
    setDownloading(true);
    try {
      // Download and save straight to the device (no share sheet).
      const result = await downloadToDevice({
        url,
        fileName:
          type === "video" ? "animatememories-video" : "animatememories-image",
        mimeType: type === "video" ? "video/mp4" : "image/jpeg",
      });
      if (result.saved) {
        setSavedToast({
          title: type === "video" ? "Video saved!" : "Image saved!",
          path: result.path,
        });
      } else if (!result.fallbackUsed) {
        Alert.alert(
          "Download failed",
          "Couldn't save the file to your device. Please try again."
        );
      }
    } catch (error: any) {
      console.error("Error downloading:", error);
      Alert.alert("Error", "Failed to download file. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  // Poll the backend until the video prediction finishes, feeding real
  // progress back into the generating modal.
  const pollAnimationStatus = useCallback(
    async (predictionId: string, userEmail: string, creditCost: number) => {
      const POLL_INTERVAL = 3000;
      const MAX_DURATION = 10 * 60 * 1000; // 10 minutes
      const startedAt = Date.now();

      while (Date.now() - startedAt < MAX_DURATION) {
        let data: any;
        try {
          data = await api.getAnimationStatus(
            predictionId,
            userEmail,
            creditCost
          );
        } catch (err: any) {
          // Transient network error — keep polling
          await new Promise((r) => setTimeout(r, POLL_INTERVAL));
          continue;
        }

        const status = data?.status;
        if (status === "succeeded") {
          return data.result;
        }
        if (status === "failed" || status === "error") {
          throw new Error(
            data?.error || "Video generation failed. Please try again."
          );
        }

        // Real progress from Replicate (null → modal uses its estimate)
        if (typeof data?.progress === "number") {
          setGenProgress(data.progress);
        }
        await new Promise((r) => setTimeout(r, POLL_INTERVAL));
      }

      throw new Error("Video generation timed out. Please try again.");
    },
    []
  );

  return (
    <View style={{ flex: 1 }} {...(isActive && currentStep === 2 ? panResponder.panHandlers : {})}>
      <ScreenWrapper
        addBottomPadding={true}
        creditsText={userCredits !== null ? `${userCredits} Credits` : undefined}
        useCustomScroll={true}
      >
        <ScrollView
          ref={mainScrollViewRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 30 }}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isPagerScrolling}
          nestedScrollEnabled={true}
          directionalLockEnabled={true}
          scrollEventThrottle={16}
          onScroll={(e) => {
            scrollYRef.current = e.nativeEvent.contentOffset.y;
            updateGridVisibility();
          }}
        >
        {/* Title Section */}
        <View style={styles.titleSection}>
          <GradientText style={styles.mainTitle}>
            Choose Your AI Tool
          </GradientText>
          <Text style={styles.mainSubtitle}>
            View and manage all your{" "}
            <Text style={styles.mainSubtitleHighlight}>
              AI-generated masterpieces
            </Text>{" "}
            in one place
          </Text>
        </View>

        {/* AI Tool Selection - Clean Text Buttons */}
        <View style={styles.toolSelection} pointerEvents={isActive ? "none" : "auto"}>
          {[
            { id: "restore" as const, label: "Restore", onPress: () => { setSelectedTool("restore"); setAnimatedVideo(null); } },
            { id: "animate" as const, label: "Animate", onPress: () => setSelectedTool("animate") },
            { id: "enhance" as const, label: "Enhance", onPress: () => setSelectedTool("enhance") },
          ].map((tool) => {
            const isSelected = selectedTool === tool.id;
            return (
              <TouchableOpacity
                key={tool.id}
                style={[styles.toolTextCard, isSelected && styles.toolTextCardSelected]}
                onPress={tool.onPress}
                activeOpacity={0.75}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={["#38BDF8", "#A855F7", "#D229FF"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.toolTextGradient}
                  >
                    <Text style={styles.toolTextLabelSelected}>{tool.label}</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.toolTextInner}>
                    <Text style={styles.toolTextLabel}>{tool.label}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Main Card Container (Elevated Region) matching UI Screenshot */}
        <View style={styles.mainCardContainer}>
          {/* Upload Section */}
          <TourStepWrapper
            step={2}
            overrideTitle={uploadedImage ? "Image Uploaded! 🎉" : undefined}
            overrideDesc={
              uploadedImage
                ? "Awesome! Now swipe down to explore AI animation templates."
                : undefined
            }
          >
            <View
              style={[
                styles.uploadSectionCard,
                uploadHighlighted && { borderWidth: 2, borderColor: "#D229FF", borderRadius: 20 },
              ]}
              pointerEvents={isActive && currentStep !== 2 ? "none" : "auto"}
            >
              {uploadHighlighted && (
                <View style={{ backgroundColor: "#F59E0B", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12, marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                  <Text style={{ color: "#FFFFFF", fontSize: 14, fontFamily: getFontFamily("600") }}>⚠️ Please Upload an Image First!</Text>
                  <Text style={{ color: "#FFFFFF", fontSize: 12, fontFamily: getFontFamily("600"), textTransform: "uppercase" }}>Required</Text>
                </View>
              )}
              <LinearGradient
                colors={["#E0F2FE", "#EFF6FF", "#F3E8FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.uploadCardGradient}
              >
                <TouchableOpacity
                  style={styles.uploadTouchArea}
                  onPress={() => pickImage()}
                  disabled={uploading}
                  activeOpacity={0.75}
                >
                  {uploading ? (
                    <ActivityIndicator size="large" color="#28D4FA" />
                  ) : uploadedImage ? (
                    <View style={styles.uploadedImageContainer}>
                      <Image
                        source={{ uri: uploadedImage }}
                        style={styles.uploadedImage}
                        resizeMode="contain"
                      />
                      <View style={styles.uploadedActionButtons}>
                        {selectedTool === "animate" && (
                          <TouchableOpacity
                            style={styles.recropButton}
                            onPress={(e) => {
                              e.stopPropagation();
                              pickImage();
                            }}
                            activeOpacity={0.75}
                          >
                            <Ionicons name="crop" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                            <Text style={styles.recropButtonText}>Re-Crop</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={styles.removeButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleReset();
                          }}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="close" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.uploadCardContent}>
                      <View style={styles.uploadCardLeft}>
                        <Text style={styles.uploadCardTitle}>Upload a file here</Text>
                        <View style={styles.uploadTitleUnderline} />
                        <Text style={styles.uploadCardSubtext}>
                          Supported formats: jpg, jpeg, png{"\n"}
                          Max file size: 20MB. Min resolution 300x300px.
                        </Text>
                      </View>
                      <View style={styles.uploadCardRight}>
                        <View style={styles.uploadIconShadowWrapper}>
                          <UploadIcon color="#FFFFFF" width={44} height={48} />
                        </View>
                      </View>
                    </View>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </TourStepWrapper>

          {/* AI Model, Duration, Quality, and Aspect Ratio inside Elevated Region */}
          {selectedTool === "animate" && !animatedVideo && (
            <View style={styles.elevatedControlsSection} pointerEvents={isActive ? "none" : "auto"}>
              {/* AI Generation Model */}
              <View style={styles.qualitySectionCard}>
                <Text style={styles.qualitySectionTitleCard}>AI Model</Text>
                <View style={styles.modelChipsRow}>
                  {VIDEO_MODELS.map((model) => {
                    const isSelected = selectedModel === model.id;
                    const creditCost = calculateCreditCost(model.id, selectedQuality, selectedDuration, featureCosts);
                    return (
                      <TouchableOpacity
                        key={model.id}
                        style={[styles.modelChip, isSelected && styles.modelChipSelected]}
                        onPress={() => handleSelectModel(model.id)}
                        activeOpacity={0.75}
                      >
                        {isSelected ? (
                          <LinearGradient
                            colors={["#38BDF8", "#A855F7", "#D229FF"]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.modelChipGradient}
                          >
                            <Text style={styles.modelChipNameSelected}>{model.name}</Text>
                            <Text style={styles.modelChipCostSelected}>{creditCost}cr</Text>
                          </LinearGradient>
                        ) : (
                          <View style={styles.modelChipInner}>
                            <Text style={styles.modelChipName}>{model.name}</Text>
                            <Text style={styles.modelChipCost}>{creditCost}cr</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Duration Slider */}
              <View style={styles.qualitySectionCard}>
                <DurationSlider
                  key={selectedModel}
                  value={selectedDuration}
                  min={currentModel?.minDuration || 4}
                  max={currentModel?.maxDuration || 10}
                  step={1}
                  allowedValues={currentModel?.allowedDurations}
                  onValueChange={(val) => setSelectedDuration(val)}
                />
              </View>

              {/* Output Quality */}
              <View style={styles.qualitySectionCard}>
                <Text style={styles.qualitySectionTitleCard}>Output Quality</Text>
                <View style={styles.qualityRow}>
                  {(["480p", "720p", "1080p"] as const).map((res) => {
                    if (!currentModel?.supportedResolutions.includes(res)) return null;
                    const cost = calculateCreditCost(selectedModel, res, selectedDuration, featureCosts);
                    const label = res === "480p" ? "SD" : res === "720p" ? "HD" : "FHD";
                    const isSelected = selectedQuality === res;
                    const gradientColors: [string, string] =
                      res === "480p"
                        ? ["#38BDF8", "#2563EB"]
                        : res === "720p"
                        ? ["#38BDF8", "#D229FF"]
                        : ["#F59E0B", "#EF4444"];
                    return (
                      <TouchableOpacity
                        key={res}
                        style={[styles.qualityCard, isSelected && styles.qualityCardSelected]}
                        onPress={() => setSelectedQuality(res)}
                        activeOpacity={0.75}
                      >
                        {isSelected ? (
                          <LinearGradient
                            colors={gradientColors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.qualityCardGradient}
                          >
                            <Text style={styles.qualityLabelSelected}>
                              {label} <Text style={styles.qualityResSelected}>({res})</Text>
                            </Text>
                            <Text style={styles.qualityCreditsSelected}>{cost}cr</Text>
                          </LinearGradient>
                        ) : (
                          <View style={styles.qualityCardInner}>
                            <Text style={styles.qualityLabel}>
                              {label} <Text style={styles.qualityRes}>({res})</Text>
                            </Text>
                            <Text style={styles.qualityCredits}>{cost}cr</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Output Aspect Ratio */}
              <View style={styles.qualitySectionCard}>
                <Text style={styles.qualitySectionTitleCard}>Output Aspect Ratio</Text>
                <View style={styles.aspectRatioRow}>
                  {[
                    { id: "vertical" as const, label: "Vertical", ratio: "9:16", iconWidth: 12, iconHeight: 18 },
                    { id: "horizontal" as const, label: "Horizontal", ratio: "16:9", iconWidth: 18, iconHeight: 12 },
                    { id: "square" as const, label: "Square", ratio: "1:1", iconWidth: 14, iconHeight: 14 },
                  ].map((item) => {
                    const isSelected = selectedAspectRatio === item.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.aspectRatioCard, isSelected && styles.aspectRatioCardSelected]}
                        onPress={() => setSelectedAspectRatio(item.id)}
                        activeOpacity={0.75}
                      >
                        <View style={styles.aspectRatioCardInner}>
                          <View
                            style={[
                              styles.aspectRatioIcon,
                              { width: item.iconWidth, height: item.iconHeight, borderColor: isSelected ? "#D229FF" : "#64748B" },
                            ]}
                          />
                          <Text style={[styles.aspectRatioLabel, isSelected && styles.aspectRatioLabelSelected]}>
                            {item.label}
                          </Text>
                          <Text style={[styles.aspectRatioSub, isSelected && styles.aspectRatioSubSelected]}>
                            ({item.ratio})
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          )}

          {/* 1. RESTORE DETAILS (When Restore tool is selected) */}
          {selectedTool === "restore" && !restoredImage && (
            <View style={styles.restoreDetailsCard}>
              <View style={styles.restoreHeaderRow}>
                <View style={styles.restoreIconCircle}>
                  <Text style={{ fontSize: 22 }}>✨</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.restoreTitle}>AI Photo Restoration</Text>
                  <Text style={styles.restoreSubtitle}>
                    Automatically repairs scratches, tears, creases, and fading
                  </Text>
                </View>
              </View>

              <View style={styles.restoreFeaturesGrid}>
                <View style={styles.restoreFeaturePill}>
                  <Text style={styles.restoreFeatureEmoji}>🩹</Text>
                  <Text style={styles.restoreFeatureText}>Scratch & Tear Repair</Text>
                </View>
                <View style={styles.restoreFeaturePill}>
                  <Text style={styles.restoreFeatureEmoji}>👤</Text>
                  <Text style={styles.restoreFeatureText}>Face Clarity Recovery</Text>
                </View>
                <View style={styles.restoreFeaturePill}>
                  <Text style={styles.restoreFeatureEmoji}>🎨</Text>
                  <Text style={styles.restoreFeatureText}>Color & Tone Revival</Text>
                </View>
              </View>
            </View>
          )}

          {/* 2. ENHANCEMENT OPTIONS (When Enhance tool is selected) */}
          {selectedTool === "enhance" && !restoredImage && (
            <View style={styles.enhanceSection}>
              <View style={styles.enhanceHeaderRow}>
                <Text style={styles.enhanceSectionTitle}>Enhancement Options</Text>
                <View style={styles.enhanceCostTag}>
                  <Text style={styles.enhanceCostTagText}>
                    {totalEnhanceCost} {totalEnhanceCost === 1 ? "credit" : "credits"}
                  </Text>
                </View>
              </View>

              <View style={styles.enhanceOptionsList}>
                {/* 4K Upscale */}
                <TouchableOpacity
                  style={[
                    styles.enhanceOptionCard,
                    enhanceOptions.upscale && styles.enhanceOptionCardSelected,
                  ]}
                  onPress={() =>
                    setEnhanceOptions((prev) => ({ ...prev, upscale: !prev.upscale }))
                  }
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.enhanceCheckbox,
                      enhanceOptions.upscale && styles.enhanceCheckboxSelected,
                    ]}
                  >
                    {enhanceOptions.upscale && (
                      <Text style={styles.enhanceCheckboxCheck}>✓</Text>
                    )}
                  </View>
                  <View style={styles.enhanceOptionInfo}>
                    <Text style={styles.enhanceOptionTitle}>
                      4K Upscale{" "}
                      <Text style={styles.enhanceOptionPrice}>
                        ({featureCosts?.enhance_upscale || 1} credit)
                      </Text>
                    </Text>
                    <Text style={styles.enhanceOptionDesc}>
                      Ultra-sharp AI resolution upscaling for high-definition clarity
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Face Enhancement */}
                <TouchableOpacity
                  style={[
                    styles.enhanceOptionCard,
                    enhanceOptions.faceEnhance && styles.enhanceOptionCardSelected,
                  ]}
                  onPress={() =>
                    setEnhanceOptions((prev) => ({
                      ...prev,
                      faceEnhance: !prev.faceEnhance,
                    }))
                  }
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.enhanceCheckbox,
                      enhanceOptions.faceEnhance && styles.enhanceCheckboxSelected,
                    ]}
                  >
                    {enhanceOptions.faceEnhance && (
                      <Text style={styles.enhanceCheckboxCheck}>✓</Text>
                    )}
                  </View>
                  <View style={styles.enhanceOptionInfo}>
                    <Text style={styles.enhanceOptionTitle}>
                      Face Enhancement{" "}
                      <Text style={styles.enhanceOptionPrice}>
                        ({featureCosts?.enhance_face || 1} credit)
                      </Text>
                    </Text>
                    <Text style={styles.enhanceOptionDesc}>
                      Deep facial reconstruction to restore clear expressions & details
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* Colorize B&W */}
                <TouchableOpacity
                  style={[
                    styles.enhanceOptionCard,
                    enhanceOptions.colorize && styles.enhanceOptionCardSelected,
                  ]}
                  onPress={() =>
                    setEnhanceOptions((prev) => ({
                      ...prev,
                      colorize: !prev.colorize,
                    }))
                  }
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.enhanceCheckbox,
                      enhanceOptions.colorize && styles.enhanceCheckboxSelected,
                    ]}
                  >
                    {enhanceOptions.colorize && (
                      <Text style={styles.enhanceCheckboxCheck}>✓</Text>
                    )}
                  </View>
                  <View style={styles.enhanceOptionInfo}>
                    <Text style={styles.enhanceOptionTitle}>
                      Colorize B&W{" "}
                      <Text style={styles.enhanceOptionPrice}>
                        ({featureCosts?.enhance_colorize || 1} credit)
                      </Text>
                    </Text>
                    <Text style={styles.enhanceOptionDesc}>
                      Transform black and white vintage photos into vivid, natural colors
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Action Button for Restore & Enhance */}
        {(selectedTool === "restore" || selectedTool === "enhance") && !restoredImage && (
          <View style={styles.generateSection}>
            <TouchableOpacity
              style={[
                styles.generateButton,
                isActionDisabled && !hasInsufficientCredits && { opacity: 0.6 }
              ]}
              onPress={handleAction}
              disabled={isActionDisabled && !hasInsufficientCredits}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={
                  hasInsufficientCredits
                    ? ["#F59E0B", "#EF4444"]
                    : ["#38BDF8", "#A855F7", "#D229FF"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.generateButtonGradient}
              >
                {loading ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.generateText}>
                      {selectedTool === "restore" ? "Restoring Photo..." : "Enhancing Photo..."}
                    </Text>
                  </>
                ) : hasInsufficientCredits ? (
                  <>
                    <CreditIcon width={20} height={20} color="#FFFFFF" />
                    <Text style={styles.generateText}>
                      Get Credits to {selectedTool === "restore" ? "Restore" : "Enhance"}
                    </Text>
                  </>
                ) : (
                  <>
                    <GenerateIcon width={20} height={20} color="#FFFFFF" />
                    <Text style={styles.generateText}>
                      {selectedTool === "restore" ? "Restore Photo" : "Enhance Photo"}
                    </Text>
                    <View style={styles.creditsBadge}>
                      <GenerateCreditIcon color="#FFFFFF" width={12} height={12} />
                      <Text style={styles.creditsBadgeText}>
                        {requiredCredits} {requiredCredits === 1 ? "Credit" : "Credits"}
                      </Text>
                    </View>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.creditsDisplay}>
              <GenerateCreditIcon color="#38BDF8" height={14} width={14} />
              <GradientText style={styles.creditsText}>
                {`Current Credits: ${userCredits ?? 0}`}
              </GradientText>
            </View>
          </View>
        )}

        {/* Result Display */}
        {(restoredImage || animatedVideo) && (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>
              {animatedVideo
                ? "Your Video is Ready!"
                : selectedTool === "enhance"
                ? "Your Enhanced Photo is Ready!"
                : "Your Restored Photo is Ready!"}
            </Text>
            <View style={styles.resultContainer}>
              {animatedVideo ? (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    previewVideoRef.current?.pauseAsync().then(() => {
                      setIsPreviewPlaying(false);
                      setShowFullScreenVideo(true);
                    }).catch(console.error);
                  }}
                  style={styles.resultVideoContainer}
                >
                  <Video
                    ref={previewVideoRef}
                    source={{ uri: animatedVideo }}
                    style={styles.resultVideo}
                    useNativeControls={false}
                    resizeMode={ResizeMode.CONTAIN}
                    isLooping
                    shouldPlay={true}
                    onReadyForDisplay={() => setIsResultVideoLoading(false)}
                    onPlaybackStatusUpdate={(status: any) => {
                      if (status && "isPlaying" in status) {
                        setIsPreviewPlaying(status.isPlaying);
                        if (status.isPlaying) {
                          setIsResultVideoLoading(false);
                        }
                      }
                    }}
                    onError={() => setIsResultVideoLoading(false)}
                  />
                  {isResultVideoLoading && (
                    <View style={styles.resultVideoLoader} pointerEvents="none">
                      <ActivityIndicator size="large" color="#38BDF8" />
                      <Text style={styles.resultVideoLoaderText}>Loading video...</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ) : restoredImage && uploadedImage ? (
                <BeforeAfterSlider
                  beforeImage={uploadedImage}
                  afterImage={restoredImage}
                  width={CONTENT_WIDTH}
                  height={350}
                />
              ) : (
                <Image
                  source={{ uri: restoredImage! }}
                  style={styles.resultImage}
                  resizeMode="contain"
                />
              )}
            </View>
            <View style={styles.resultActions}>
              <TouchableOpacity
                style={[styles.downloadButton, styles.resultActionButton]}
                onPress={() =>
                  handleDownload(
                    animatedVideo || restoredImage!,
                    animatedVideo ? "video" : "image"
                  )
                }
              >
                <LinearGradient
                  colors={["#28D4FA", "#D229FF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.downloadButtonGradient}
                >
                  {downloading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.downloadButtonText}>Download</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.resetButton, styles.resultActionButton]}
                onPress={handleReset}
              >
                <Text style={styles.resetButtonText}>Start Over</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Full Screen Video Modal */}
        <FullScreenVideoViewer
          visible={showFullScreenVideo}
          videoUri={animatedVideo}
          posterUri={uploadedImage}
          onClose={() => {
            setShowFullScreenVideo(false);
            previewVideoRef.current?.playAsync().then(() => {
              setIsPreviewPlaying(true);
            }).catch(console.error);
          }}
          onDownload={() => {
            if (animatedVideo) {
              handleDownload(animatedVideo, "video");
            }
          }}
          isDownloading={downloading}
          toastTitle={savedToast?.title ?? null}
          toastPath={savedToast?.path ?? null}
          onToastHide={() => setSavedToast(null)}
          onPreviewVideoPause={() => {
            previewVideoRef.current?.pauseAsync().then(() => {
              setIsPreviewPlaying(false);
            }).catch(console.error);
          }}
        />

        {/* Generating Modal */}
        <GeneratingModal
          visible={loading}
          tool={selectedTool}
          photo={uploadedImage}
          progress={selectedTool === "animate" ? genProgress : null}
        />

        {/* Animation Templates - Only show for animate */}
        {selectedTool === "animate" && !animatedVideo && (
          <TourStepWrapper step={3} tooltipPosition="none">
            <View
              style={styles.templatesSection}
              onLayout={(e) => setTemplatesLayoutY(e.nativeEvent.layout.y)}
            >
              {/* Header */}
              <View style={styles.templatesHeaderStack}>
                <Text style={styles.templatesTitle}>Animation Templates</Text>
                <Text style={styles.templatesSubtitle}>
                  Choose a template or create custom animation
                </Text>
              </View>

              {/* 2-Tab Segmented Switcher Bar */}
              <View style={styles.templatesTabSwitcher}>
                <TouchableOpacity
                  style={styles.templateTabBtn}
                  onPress={() => {
                    setActiveTabMode("template");
                    if (selectedTemplate === null && animationTemplates.length > 0) {
                      setSelectedTemplate(animationTemplates[0].slug || animationTemplates[0].id);
                      setCustomPrompt(animationTemplates[0].prompt || "");
                    }
                  }}
                  activeOpacity={0.8}
                >
                  {activeTabMode === "template" ? (
                    <LinearGradient
                      colors={["#38BDF8", "#A855F7", "#D229FF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.templateTabBtnGradient}
                    >
                      <Text style={styles.templateTabBtnTextActive}>
                        PICK A TEMPLATE
                      </Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.templateTabBtnTextInactive}>
                      PICK A TEMPLATE
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.templateTabBtn}
                  onPress={() => {
                    setActiveTabMode("custom");
                    setSelectedTemplate(null);
                  }}
                  activeOpacity={0.8}
                >
                  {activeTabMode === "custom" ? (
                    <LinearGradient
                      colors={["#38BDF8", "#A855F7", "#D229FF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.templateTabBtnGradient}
                    >
                      <Text style={styles.templateTabBtnTextActive}>
                        CUSTOM PROMPT ✨
                      </Text>
                    </LinearGradient>
                  ) : (
                    <Text style={styles.templateTabBtnTextInactive}>
                      CUSTOM PROMPT ✨
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* TAB 1: PICK A TEMPLATE CONTENT */}
              {activeTabMode === "template" && (
                <>
                  {/* Search */}
                  <View style={styles.templateSearchWrapper} pointerEvents={isActive && currentStep !== 3 ? "none" : "auto"}>
                    <SearchIcon color="#a78bfa" width={18} height={18} strokeWidth={2} />
                    <TextInput
                      style={styles.templateSearchInputFull}
                      placeholder="Search templates..."
                      placeholderTextColor="#b0b0c0"
                      value={searchQuery}
                      onChangeText={handleSearchChange}
                    />
                  </View>

                  {/* Category Pills */}
                  <ScrollView
                    ref={categoryPillsScrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoryPillsScroll}
                    contentContainerStyle={styles.categoryPillsContainer}
                    pointerEvents={isActive && currentStep !== 3 ? "none" : "auto"}
                  >
                    {allCatList.map((cat) => {
                      const catValue = cat.slug || cat.name || cat.id;
                      const isSelected = selectedCategory.toLowerCase() === catValue.toLowerCase();
                      return (
                        <TouchableOpacity
                          key={cat.id || catValue}
                          style={[styles.categoryPill, isSelected && styles.categoryPillSelected]}
                          onPress={() => handleCategoryPillPress(catValue)}
                          activeOpacity={0.75}
                        >
                          {isSelected ? (
                            <LinearGradient
                              colors={["#28D4FA", "#D229FF"]}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 0 }}
                              style={styles.categoryPillGradient}
                            >
                              <Text style={styles.categoryPillTextSelected}>
                                {cat.name}
                              </Text>
                            </LinearGradient>
                          ) : (
                            <Text style={styles.categoryPillText}>
                              {cat.name}
                            </Text>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* 3-column Grid Paged Horizontally (Swipeable Left & Right with snap) */}
                  <View
                    style={styles.templatesHorizontalContainer}
                    pointerEvents={isActive && currentStep !== 3 ? "none" : "auto"}
                    onLayout={(e) => {
                      templatesGridYRef.current = e.nativeEvent.layout.y;
                      templatesGridHRef.current = e.nativeEvent.layout.height;
                      updateGridVisibility();
                    }}
                  >
                    <ScrollView
                      ref={templatePagerRef}
                      horizontal
                      pagingEnabled={true}
                      disableIntervalMomentum={true}
                      nestedScrollEnabled={true}
                      directionalLockEnabled={true}
                      overScrollMode="never"
                      showsHorizontalScrollIndicator={false}
                      decelerationRate="fast"
                      snapToInterval={CONTENT_WIDTH}
                      snapToAlignment="start"
                      onMomentumScrollEnd={(e) => {
                        const pageIndex = Math.round(e.nativeEvent.contentOffset.x / CONTENT_WIDTH);
                        const newPage = Math.min(totalPages, Math.max(1, pageIndex + 1));
                        if (newPage !== currentPage) {
                          setCurrentPage(newPage);
                        }
                      }}
                      style={{ width: CONTENT_WIDTH }}
                    >
                      {templatePages.map((pageItems: any[], pageIdx: number) => {
                        const isCurrentPage = pageIdx === currentPage - 1;
                        const shouldAutoplay = isCurrentPage;
                        const row1 = pageItems.slice(0, 3);
                        const row2 = pageItems.slice(3, 6);
                        return (
                          <View key={pageIdx} style={{ width: CONTENT_WIDTH }}>
                            <View style={styles.templatesGrid}>
                              {/* Row 1 */}
                              <View style={styles.templateRow}>
                                {row1.map((item: any, idx: number) => {
                                  const templateId = item.slug || item.id;
                                  const isSelected = selectedTemplate === templateId;
                                  return (
                                    <View key={templateId || idx} style={styles.templateGridItem}>
                                      <TouchableOpacity
                                        style={[
                                          styles.templateCardGrid,
                                          isSelected && styles.templateCardSelectedGrid,
                                        ]}
                                        onPress={() => {
                                          setSelectedTemplate(templateId);
                                          if (item.prompt) {
                                            setCustomPrompt(item.prompt);
                                          }
                                          if (isActive && currentStep === 3) {
                                            mainScrollViewRef.current?.scrollToEnd({ animated: true });
                                            setTimeout(() => {
                                              if (currentStep === 3) {
                                                nextStep();
                                              }
                                            }, 400);
                                          }
                                        }}
                                        activeOpacity={0.8}
                                      >
                                        <View style={styles.templateImageContainerGrid}>
                                          <AnimatedTemplateThumb
                                            thumbnail={{ uri: formatImageUrl(item.thumbnailUrl || item.image) }}
                                            videoUrl={item.videoUrl ? formatImageUrl(item.videoUrl) : null}
                                            autoPlay={shouldAutoplay}
                                            active={isSelected}
                                            index={idx}
                                            style={styles.templateImageGrid}
                                          />
                                        </View>
                                        {isSelected && (
                                          <View style={styles.selectedCheckBadge}>
                                            <Text style={styles.selectedCheckText}>✓</Text>
                                          </View>
                                        )}
                                      </TouchableOpacity>
                                      <Text style={styles.templateNameGrid} numberOfLines={1}>
                                        {item.name}
                                      </Text>
                                    </View>
                                  );
                                })}
                                {row1.length < 3 &&
                                  Array.from({ length: 3 - row1.length }).map((_, i) => (
                                    <View key={`empty-r1-${i}`} style={styles.templateGridItemPlaceholder} />
                                  ))}
                              </View>

                              {/* Row 2 */}
                              {row2.length > 0 && (
                                <View style={styles.templateRow}>
                                  {row2.map((item: any, idx: number) => {
                                    const templateId = item.slug || item.id;
                                    const isSelected = selectedTemplate === templateId;
                                    return (
                                      <View key={templateId || (idx + 3)} style={styles.templateGridItem}>
                                        <TouchableOpacity
                                          style={[
                                            styles.templateCardGrid,
                                            isSelected && styles.templateCardSelectedGrid,
                                          ]}
                                          onPress={() => {
                                            setSelectedTemplate(templateId);
                                            if (item.prompt) {
                                              setCustomPrompt(item.prompt);
                                            }
                                            if (isActive && currentStep === 3) {
                                              mainScrollViewRef.current?.scrollToEnd({ animated: true });
                                              setTimeout(() => {
                                                if (currentStep === 3) {
                                                  nextStep();
                                                }
                                              }, 400);
                                            }
                                          }}
                                          activeOpacity={0.8}
                                        >
                                          <View style={styles.templateImageContainerGrid}>
                                            <AnimatedTemplateThumb
                                              thumbnail={{ uri: formatImageUrl(item.thumbnailUrl || item.image) }}
                                              videoUrl={item.videoUrl ? formatImageUrl(item.videoUrl) : null}
                                              autoPlay={shouldAutoplay}
                                              active={isSelected}
                                              index={idx + 3}
                                              style={styles.templateImageGrid}
                                            />
                                          </View>
                                          {isSelected && (
                                            <View style={styles.selectedCheckBadge}>
                                              <Text style={styles.selectedCheckText}>✓</Text>
                                            </View>
                                          )}
                                        </TouchableOpacity>
                                        <Text style={styles.templateNameGrid} numberOfLines={1}>
                                          {item.name}
                                        </Text>
                                      </View>
                                    );
                                  })}
                                  {row2.length < 3 &&
                                    Array.from({ length: 3 - row2.length }).map((_, i) => (
                                      <View key={`empty-r2-${i}`} style={styles.templateGridItemPlaceholder} />
                                    ))}
                                </View>
                              )}
                            </View>
                          </View>
                        );
                      })}

                      {filteredTemplates.length === 0 && (
                        <View style={{ width: CONTENT_WIDTH, paddingVertical: 28, alignItems: "center" }}>
                          <Text style={{ color: "#94a3b8", fontSize: 16 }}>No templates found</Text>
                        </View>
                      )}
                    </ScrollView>
                  </View>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <View style={styles.paginationBar} pointerEvents={isActive && currentStep !== 3 ? "none" : "auto"}>
                      <TouchableOpacity
                        style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
                        onPress={() => {
                          const prevPage = Math.max(1, currentPage - 1);
                          setCurrentPage(prevPage);
                          templatePagerRef.current?.scrollTo({ x: (prevPage - 1) * CONTENT_WIDTH, animated: true });
                        }}
                        disabled={currentPage === 1}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.pageButtonText, currentPage === 1 && styles.pageButtonTextDisabled]}>
                          ‹ Previous
                        </Text>
                      </TouchableOpacity>

                      <Text style={styles.pageIndicatorText}>
                        Page {currentPage} of {totalPages}
                      </Text>

                      <TouchableOpacity
                        style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
                        onPress={() => {
                          const nextPage = Math.min(totalPages, currentPage + 1);
                          setCurrentPage(nextPage);
                          templatePagerRef.current?.scrollTo({ x: (nextPage - 1) * CONTENT_WIDTH, animated: true });
                        }}
                        disabled={currentPage === totalPages}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.pageButtonText, currentPage === totalPages && styles.pageButtonTextDisabled]}>
                          Next ›
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Confirmation Banner */}
                  <View style={styles.confirmationBanner} pointerEvents={isActive && currentStep !== 3 ? "none" : "auto"}>
                    <View style={styles.confirmationLeft}>
                      <View style={styles.confirmationCheckBg}>
                        <Text style={styles.confirmationCheck}>✓</Text>
                      </View>
                      <View style={styles.confirmationTextContainer}>
                        <Text style={styles.confirmationLabel}>Template Selected</Text>
                        <Text style={styles.confirmationValue} numberOfLines={1}>
                          {selectedTemplate === null
                            ? "Custom Animation Prompt"
                            : (animationTemplates.find(t => (t.slug || t.id) === selectedTemplate)?.name || "Selected Preset")}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.confirmedPill}>
                      <Text style={styles.confirmedPillText}>✓ Active</Text>
                    </View>
                  </View>
                </>
              )}

              {/* TAB 2: CUSTOM PROMPT CONTENT */}
              {activeTabMode === "custom" && (
                <View style={styles.customSectionInline} pointerEvents={isActive && currentStep !== 3 ? "none" : "auto"}>
                  <View style={styles.customHeaderInline}>
                    <Text style={styles.customTitleInline}>Custom Animation Prompt</Text>
                  </View>

                  {surpriseSubject !== "" && (
                    <View style={{ backgroundColor: "#F3E8FF", borderColor: "#D8B4FE", borderWidth: 1, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, marginBottom: 10, alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Text style={{ fontSize: 14, fontFamily: getFontFamily("600"), color: "#6B21A8" }}>
                        ✨ Detected Subject: <Text style={{ fontFamily: getFontFamily("600"), color: "#581C87" }}>{surpriseSubject}</Text>
                      </Text>
                    </View>
                  )}

                  {/* Suggestion Chips */}
                  <View style={{ marginBottom: 10 }}>
                    <Text style={{ fontSize: 13, fontFamily: getFontFamily("600"), color: "#64748B", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>Prompt Ideas</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {promptExamples.map((ex, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={{ backgroundColor: "#F1F5F9", borderColor: "#CBD5E1", borderWidth: 1, paddingVertical: 5, paddingHorizontal: 10, borderRadius: 14 }}
                          onPress={() => setCustomPrompt(ex)}
                          activeOpacity={0.75}
                        >
                          <Text style={{ fontSize: 13, fontFamily: getFontFamily("500"), color: "#334155" }} numberOfLines={1}>
                            "{ex}"
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.customInputContainerInline}>
                    <TextInput
                      style={styles.customInputInline}
                      placeholder="Describe how you want your photo to move...(e.g. gentle smile, slow blink)"
                      placeholderTextColor="#9d9d9d"
                      multiline
                      numberOfLines={4}
                      value={customPrompt}
                      onChangeText={setCustomPrompt}
                    />
                    <TouchableOpacity
                      style={[
                        styles.surpriseButtonInline,
                        (isSurpriseLoading || (userCredits !== null && userCredits < 1)) && { opacity: 0.5 },
                      ]}
                      onPress={handleSurpriseMe}
                      disabled={isSurpriseLoading || (userCredits !== null && userCredits < 1)}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={
                          userCredits !== null && userCredits < 1
                            ? ["#94A3B8", "#64748B"]
                            : ["#28D4FA", "#D229FF"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.surpriseButtonGradientInline}
                      >
                        {isSurpriseLoading ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <SurpriseMeIcon />
                            <Text style={styles.surpriseTextInline}>
                              {userCredits !== null && userCredits < 1
                                ? "Surprise Me (0 Cr)"
                                : "Surprise Me (1 Cr)"}
                            </Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Generate Button for Animate */}
              {!animatedVideo && !restoredImage && (
                <TourStepWrapper
                  step={4}
                  tooltipPosition="top"
                  userCredits={userCredits}
                  requiredCredits={4}
                  overrideTitle={hasInsufficientCredits ? "Get Credits to Animate" : "Ready to Generate!"}
                  overrideDesc={
                    hasInsufficientCredits
                      ? "👇 You need at least 4 credits to generate a video. Tap below to get credits or skip the tour."
                      : "👇 Click 'Generate' below to bring your photo to life with AI!"
                  }
                >
                  <View style={[styles.generateSection, { marginTop: 16 }]} pointerEvents={isActive && currentStep !== 4 ? "none" : "auto"}>
                    <TouchableOpacity
                      style={[
                        styles.generateButton,
                        isActionDisabled && !hasInsufficientCredits && { opacity: 0.6 }
                      ]}
                      onPress={handleAction}
                      disabled={isActionDisabled && !hasInsufficientCredits}
                      activeOpacity={0.85}
                    >
                      <LinearGradient
                        colors={
                          hasInsufficientCredits
                            ? ["#F59E0B", "#EF4444"]
                            : ["#28D4FA", "#D229FF"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.generateButtonGradient}
                      >
                        {loading ? (
                          <>
                            <ActivityIndicator color="#fff" size="small" />
                            <Text style={styles.generateText}>Generating Animation...</Text>
                          </>
                        ) : hasInsufficientCredits ? (
                          <>
                            <CreditIcon width={20} height={20} color="#FFFFFF" />
                            <Text style={styles.generateText}>Get Credits to Animate</Text>
                          </>
                        ) : (
                          <>
                            <GenerateIcon width={20} height={20} color="#FFFFFF" />
                            <Text style={styles.generateText}>Generate</Text>
                            <View style={styles.creditsBadge}>
                              <GenerateCreditIcon color="#FFFFFF" width={12} height={12} />
                              <Text style={styles.creditsBadgeText}>
                                {requiredCredits} Credits
                              </Text>
                            </View>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    <View style={styles.creditsDisplay}>
                      <GenerateCreditIcon color={"#38BDF8"} height={14} width={14} />
                      <GradientText style={styles.creditsText}>
                        {`Current Credits: ${userCredits ?? 0}`}
                      </GradientText>
                    </View>
                  </View>
                </TourStepWrapper>
              )}
            </View>
          </TourStepWrapper>
        )}
      </ScrollView>
    </ScreenWrapper>

    <SavedToast
      title={savedToast?.title ?? null}
      path={savedToast?.path ?? null}
      onHide={() => setSavedToast(null)}
    />
  </View>
);
}

const styles = StyleSheet.create({
  titleSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    alignItems: "center",
  },
  mainTitle: {
    fontSize: 26,
    fontFamily: getFontFamily("700"),
    color: "#0F172A",
    marginBottom: 6,
    textAlign: "center",
  },
  mainSubtitle: {
    fontSize: 16,
    fontFamily: getFontFamily("400"),
    color: "#334155",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
  },
  mainSubtitleHighlight: {
    fontFamily: getFontFamily("600"),
    color: "#D229FF",
  },
  toolSelection: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  toolTextCard: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  toolTextCardSelected: {
    borderColor: "transparent",
    shadowColor: "#D229FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  toolTextGradient: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  toolTextInner: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  toolTextLabel: {
    fontSize: 16,
    fontFamily: getFontFamily("600"),
    color: "#475569",
    textAlign: "center",
  },
  toolTextLabelSelected: {
    fontSize: 16,
    fontFamily: getFontFamily("600"),
    color: "#FFFFFF",
    textAlign: "center",
  },
  mainCardContainer: {
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  uploadSectionCard: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 0,
  },
  elevatedControlsSection: {
    marginTop: 14,
    gap: 12,
  },
  qualitySectionCard: {
    marginBottom: 4,
  },
  qualitySectionTitleCard: {
    fontSize: 14,
    fontFamily: getFontFamily("600"),
    color: "#64748B",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modelChipsRow: {
    flexDirection: "row",
    gap: 8,
  },
  modelChip: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  modelChipSelected: {
    borderColor: "#D229FF",
    backgroundColor: "#FFFFFF",
    shadowColor: "#D229FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3,
  },
  modelChipGradient: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  modelChipInner: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  modelChipName: {
    fontSize: 12,
    fontFamily: getFontFamily("600"),
    color: "#334155",
    textAlign: "center",
  },
  modelChipNameSelected: {
    fontSize: 12,
    fontFamily: getFontFamily("700"),
    color: "#FFFFFF",
    textAlign: "center",
  },
  modelChipCost: {
    fontSize: 11,
    fontFamily: getFontFamily("500"),
    color: "#94A3B8",
    marginTop: 2,
  },
  modelChipCostSelected: {
    fontSize: 11,
    fontFamily: getFontFamily("700"),
    color: "#FFFFFF",
    marginTop: 2,
  },
  aspectRatioRow: {
    flexDirection: "row",
    gap: 8,
  },
  aspectRatioCard: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  aspectRatioCardSelected: {
    borderColor: "#D229FF",
    backgroundColor: "#FFFFFF",
    shadowColor: "#D229FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3,
  },
  aspectRatioCardInner: {
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  aspectRatioIcon: {
    borderWidth: 2,
    borderRadius: 3,
    marginBottom: 4,
  },
  aspectRatioLabel: {
    fontSize: 13,
    fontFamily: getFontFamily("600"),
    color: "#334155",
    textAlign: "center",
  },
  aspectRatioLabelSelected: {
    fontSize: 13,
    fontFamily: getFontFamily("700"),
    color: "#D229FF",
    textAlign: "center",
  },
  aspectRatioSub: {
    fontSize: 11,
    fontFamily: getFontFamily("500"),
    color: "#94A3B8",
    marginTop: 1,
  },
  aspectRatioSubSelected: {
    fontSize: 11,
    fontFamily: getFontFamily("600"),
    color: "#C084FC",
    marginTop: 1,
  },
  uploadCardGradient: {
    borderRadius: 14,
    padding: 16,
  },
  uploadTouchArea: {
    width: "100%",
  },
  uploadCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  uploadCardLeft: {
    flex: 1,
    paddingRight: 12,
  },
  uploadCardTitle: {
    fontSize: 19,
    fontFamily: getFontFamily("600"),
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  uploadTitleUnderline: {
    width: 140,
    height: 1,
    backgroundColor: "#1E293B",
    opacity: 0.25,
    marginTop: 3,
    marginBottom: 4,
    borderRadius: 0.5,
  },
  uploadCardSubtext: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 19,
    fontFamily: getFontFamily("400"),
  },
  uploadCardRight: {
    alignItems: "center",
    justifyContent: "center",
  },
  uploadIconShadowWrapper: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadIconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  customAnimationSection: {
    marginTop: 4,
  },
  customAnimationHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  customAnimationTitle: {
    fontSize: 18,
    fontFamily: getFontFamily("600"),
    color: "#0F172A",
  },
  optionalBadge: {
    borderWidth: 1,
    borderColor: "#C084FC",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: "#FAF5FF",
  },
  optionalBadgeText: {
    fontSize: 13,
    fontFamily: getFontFamily("600"),
    color: "#C084FC",
  },
  customDashedBox: {
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 12,
    minHeight: 115,
    position: "relative",
  },
  customDashedInput: {
    fontSize: 15,
    color: "#334155",
    textAlignVertical: "top",
    minHeight: 65,
    padding: 0,
    marginBottom: 28,
    fontFamily: getFontFamily("400"),
  },
  surpriseButtonBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    borderRadius: 8,
    overflow: "hidden",
  },
  surpriseButtonGradientBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  surpriseTextBadge: {
    fontSize: 14,
    fontFamily: getFontFamily("600"),
    color: "#FFFFFF",
  },
  uploadedImageContainer: {
    width: "100%",
    height: 200,
    position: "relative",
    backgroundColor: "rgba(15, 23, 42, 0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(168, 85, 247, 0.25)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  uploadedActionButtons: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 10,
  },
  recropButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(210, 41, 255, 0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  recropButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: getFontFamily("600"),
  },
  removeButton: {
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  customSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  customHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  customTitle: {
    fontSize: 18,
    fontFamily: getFontFamily("600"),
    color: "#000",
  },
  customInputContainer: {
    position: "relative",
  },
  customInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    padding: 12,
    paddingBottom: 50,
    fontSize: 16,
    color: "#000",
    textAlignVertical: "top",
    minHeight: 100,
    fontFamily: getFontFamily("400"),
  },
  surpriseButton: {
    position: "absolute",
    bottom: 12,
    left: 12,
    borderRadius: 6,
    overflow: "hidden",
  },
  surpriseButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  surpriseText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: getFontFamily("600"),
  },
  generateSection: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  generateButton: {
    borderRadius: 7,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  generateButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  generateText: {
    fontSize: 18,
    fontFamily: getFontFamily("600"),
    color: "#fff",
  },
  creditsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  creditsBadgeText: {
    fontSize: 14,
    fontFamily: getFontFamily("600"),
    color: "#fff",
  },
  creditsDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 14,
    marginBottom: 12,
    gap: 6,
  },
  creditsText: {
    fontSize: 16,
    fontFamily: getFontFamily("600"),
    color: "#1E293B",
  },
  resultSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 22,
    fontFamily: getFontFamily("600"),
    color: "#000",
    marginBottom: 16,
    textAlign: "center",
  },
  resultContainer: {
    width: "100%",
    height: 350,
    backgroundColor: "#000",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 16,
  },
  resultVideoContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  resultVideoLoader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  resultVideoLoaderText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: getFontFamily("500"),
  },
  resultVideo: {
    width: "100%",
    height: "100%",
  },
  resultImage: {
    width: "100%",
    height: "100%",
  },
  resultActions: {
    flexDirection: "row",
    gap: 12,
  },
  resultActionButton: {
    flex: 1,
  },
  downloadButton: {
    borderRadius: 8,
    overflow: "hidden",
  },
  downloadButtonGradient: {
    paddingVertical: 14,
    alignItems: "center",
  },
  downloadButtonText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: getFontFamily("600"),
  },
  resetButton: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  resetButtonText: {
    color: "#374151",
    fontSize: 18,
    fontFamily: getFontFamily("600"),
  },
  templatesSection: {
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  templatesTitle: {
    fontSize: 24,
    fontFamily: getFontFamily("700"),
    color: "#0a0a0a",
    textAlign: "center",
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  templatesSubtitle: {
    fontSize: 15,
    fontFamily: getFontFamily("500"),
    color: "#9ca3af",
    textAlign: "center",
    marginBottom: 16,
  },
  templatesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  qualitySection: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  qualitySectionTitle: {
    fontSize: 15,
    fontFamily: getFontFamily("600"),
    color: "#6b7280",
    marginBottom: 8,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  qualityRow: {
    flexDirection: "row" as const,
    gap: 8,
  },
  qualityCard: {
    flex: 1,
    borderRadius: 10,
    overflow: "hidden" as const,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
  },
  qualityCardSelected: {
    borderColor: "transparent",
    shadowColor: "#D229FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3,
  },
  qualityCardGradient: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  qualityCardInner: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: "#fafafa",
  },
  qualityLabel: {
    fontSize: 13,
    fontFamily: getFontFamily("600"),
    color: "#374151",
    textAlign: "center" as const,
  },
  qualityLabelSelected: {
    fontSize: 13,
    fontFamily: getFontFamily("600"),
    color: "#fff",
    textAlign: "center" as const,
  },
  qualityRes: {
    fontSize: 11,
    fontFamily: getFontFamily("500"),
    color: "#9ca3af",
  },
  qualityResSelected: {
    fontSize: 11,
    fontFamily: getFontFamily("500"),
    color: "rgba(255,255,255,0.85)",
  },
  qualityCredits: {
    fontSize: 12,
    fontFamily: getFontFamily("600"),
    color: "#9ca3af",
    marginTop: 2,
  },
  qualityCreditsSelected: {
    fontSize: 12,
    fontFamily: getFontFamily("600"),
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },
  restoreDetailsCard: {
    marginTop: 14,
    padding: 14,
    backgroundColor: "#FAF5FF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E9D5FF",
  },
  restoreHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  restoreIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F3E8FF",
    borderWidth: 1,
    borderColor: "#D8B4FE",
    alignItems: "center",
    justifyContent: "center",
  },
  restoreTitle: {
    fontSize: 16,
    fontFamily: getFontFamily("700"),
    color: "#1E293B",
    marginBottom: 2,
  },
  restoreSubtitle: {
    fontSize: 13,
    fontFamily: getFontFamily("400"),
    color: "#64748B",
    lineHeight: 18,
  },
  restoreFeaturesGrid: {
    gap: 8,
  },
  restoreFeaturePill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    gap: 8,
  },
  restoreFeatureEmoji: {
    fontSize: 16,
  },
  restoreFeatureText: {
    fontSize: 13,
    fontFamily: getFontFamily("500"),
    color: "#334155",
  },
  enhanceSection: {
    marginTop: 14,
  },
  enhanceHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  enhanceSectionTitle: {
    fontSize: 14,
    fontFamily: getFontFamily("600"),
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  enhanceCostTag: {
    backgroundColor: "#F3E8FF",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8B4FE",
  },
  enhanceCostTagText: {
    fontSize: 12,
    fontFamily: getFontFamily("600"),
    color: "#6B21A8",
  },
  enhanceOptionsList: {
    gap: 10,
  },
  enhanceOptionCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8FAFC",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  enhanceOptionCardSelected: {
    backgroundColor: "#FAF5FF",
    borderColor: "#D229FF",
    shadowColor: "#D229FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  enhanceCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  enhanceCheckboxSelected: {
    borderColor: "#D229FF",
    backgroundColor: "#D229FF",
  },
  enhanceCheckboxCheck: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: getFontFamily("700"),
  },
  enhanceOptionInfo: {
    flex: 1,
  },
  enhanceOptionTitle: {
    fontSize: 15,
    fontFamily: getFontFamily("600"),
    color: "#0F172A",
    marginBottom: 2,
  },
  enhanceOptionPrice: {
    fontSize: 13,
    fontFamily: getFontFamily("600"),
    color: "#9333EA",
  },
  enhanceOptionDesc: {
    fontSize: 12,
    fontFamily: getFontFamily("400"),
    color: "#64748B",
    lineHeight: 17,
  },
  templatesTabSwitcher: {
    flexDirection: "row",
    backgroundColor: "#E2E8F0",
    borderRadius: 14,
    padding: 3,
    marginBottom: 16,
  },
  templateTabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
    overflow: "hidden",
  },
  templateTabBtnGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  templateTabBtnTextActive: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: getFontFamily("600"),
    textTransform: "uppercase",
  },
  templateTabBtnTextInactive: {
    color: "#475569",
    fontSize: 14,
    fontFamily: getFontFamily("600"),
    textTransform: "uppercase",
  },
  templatesHorizontalContainer: {
    marginBottom: 4,
  },
  templatesGrid: {
    marginTop: 8,
    gap: 12,
  },
  templateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  templateGridItem: {
    width: "31%",
    alignItems: "center",
  },
  templateGridItemPlaceholder: {
    width: "31%",
  },
  templateCardGrid: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    overflow: "hidden",
    marginBottom: 6,
    position: "relative",
  },
  templateCardSelectedGrid: {
    borderColor: "#D229FF",
  },
  templateImageContainerGrid: {
    width: "100%",
    height: "100%",
  },
  templateImageGrid: {
    width: "100%",
    height: "100%",
  },
  templateNameGrid: {
    fontSize: 13,
    fontFamily: getFontFamily("600"),
    color: "#374151",
    textAlign: "center",
    width: "100%",
  },
  paginationBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  pageButton: {
    backgroundColor: "#FAF5FF",
    borderWidth: 1,
    borderColor: "#E9D5FF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  pageButtonDisabled: {
    backgroundColor: "#F3F4F6",
    borderColor: "#E5E7EB",
  },
  pageButtonText: {
    fontSize: 15,
    fontFamily: getFontFamily("600"),
    color: "#D229FF",
  },
  pageButtonTextDisabled: {
    color: "#9CA3AF",
    fontFamily: getFontFamily("400"),
  },
  pageIndicatorText: {
    fontSize: 15,
    fontFamily: getFontFamily("600"),
    color: "#4B5563",
  },
  actionButtonContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  actionButton: {
    borderRadius: 14,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#D229FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  actionButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  actionLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  actionButtonText: {
    fontSize: 17,
    fontFamily: getFontFamily("600"),
    color: "#FFFFFF",
  },
  actionCreditsBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255,255,255,0.22)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  actionCreditsBadgeText: {
    fontSize: 13,
    fontFamily: getFontFamily("600"),
    color: "#FFFFFF",
  },
  selectedCheckBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#D229FF",
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedCheckText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: getFontFamily("600"),
  },
  confirmationBanner: {
    flexDirection: "row",
    backgroundColor: "#FAF5FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E9D5FF",
    padding: 10,
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  confirmationLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  confirmationCheckBg: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#D229FF",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmationCheck: {
    color: "#fff",
    fontSize: 14,
    fontFamily: getFontFamily("600"),
  },
  confirmationTextContainer: {
    flex: 1,
  },
  confirmationLabel: {
    fontSize: 11,
    fontFamily: getFontFamily("700"),
    textTransform: "uppercase",
    color: "#D229FF",
  },
  confirmationValue: {
    fontSize: 15,
    fontFamily: getFontFamily("600"),
    color: "#111827",
    marginTop: 2,
  },
  confirmedPill: {
    backgroundColor: "#F3E8FF",
    borderWidth: 1,
    borderColor: "#E9D5FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confirmedPillText: {
    fontSize: 12,
    fontFamily: getFontFamily("600"),
    color: "#D229FF",
  },
  customSectionInline: {
    marginTop: 12,
    backgroundColor: "#FAF5FF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E9D5FF",
    padding: 12,
  },
  customHeaderInline: {
    marginBottom: 8,
  },
  customTitleInline: {
    fontSize: 16,
    fontFamily: getFontFamily("600"),
    color: "#1f2937",
  },
  customInputContainerInline: {
    position: "relative",
  },
  customInputInline: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#E9D5FF",
    borderRadius: 8,
    padding: 12,
    paddingBottom: 40,
    fontSize: 15,
    color: "#111827",
    textAlignVertical: "top",
    minHeight: 90,
    fontFamily: getFontFamily("400"),
  },
  surpriseButtonInline: {
    position: "absolute",
    bottom: 8,
    left: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  surpriseButtonGradientInline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  surpriseTextInline: {
    fontSize: 12,
    fontFamily: getFontFamily("600"),
    color: "#fff",
  },
  templatesHeaderStack: {
    marginBottom: 6,
  },
  templateSearchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#ede9fe",
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 14,
    shadowColor: "#D229FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  templateSearchInputFull: {
    flex: 1,
    fontSize: 16,
    fontFamily: getFontFamily("500"),
    color: "#1f2937",
    padding: 0,
    margin: 0,
  },
  categoryPillsScroll: {
    marginBottom: 14,
    marginHorizontal: -2,
  },
  categoryPillsContainer: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 2,
    paddingRight: 16,
  },
  categoryPill: {
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  categoryPillGradient: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryPillSelected: {
    borderColor: "transparent",
    shadowColor: "#D229FF",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  categoryPillText: {
    fontSize: 15,
    fontFamily: getFontFamily("600"),
    color: "#4b5563",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#f9fafb",
  },
  categoryPillTextSelected: {
    fontSize: 15,
    color: "#fff",
    fontFamily: getFontFamily("600"),
  },
});
