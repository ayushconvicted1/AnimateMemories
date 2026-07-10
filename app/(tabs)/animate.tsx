import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useState, useEffect, useCallback, useRef } from "react";
import * as ImagePicker from "expo-image-picker";
import { Video, ResizeMode } from "expo-av";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import { GradientText } from "@/components/ui/GradientText";
import FullScreenVideoViewer from "@/components/ui/FullScreenVideoViewer";
import UploadIcon from "@/components/images/UploadIcon";
import SurpriseMeIcon from "@/components/images/SurpriseMeIcon";
import GenerateIcon from "@/components/images/GenerateIcon";
import GenerateCreditIcon from "@/components/images/GenerateCreditIcon";
import { useAuth as useAuthContext } from "@/contexts/AuthContext";
import { useAuth } from "@clerk/clerk-expo";
import { api } from "@/services/api";
import { Linking } from "react-native";
import { useLocalSearchParams } from "expo-router";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CONTENT_WIDTH = SCREEN_WIDTH - 32;

// API base URL for template images
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000";

const promptExamples = [
  "slowly turns head left and right, blinks softly, gentle smile",
  "natural breathing motion, subtle eye movement, peaceful expression",
  "gentle swaying dance movement, rhythmic head bob, joyful expression",
  "two people hugging warmly, slight rocking motion, emotional embrace",
  "playful dancing with shoulder movements, happy facial expressions",
];

export default function AnimateScreen() {
  const { user } = useAuthContext();
  const { getToken } = useAuth();
  const params = useLocalSearchParams();
  // Default to animate tool and jump scare template
  const [selectedTool, setSelectedTool] = useState<
    "restore" | "animate" | "enhance" | null
  >("animate");
  const [customPrompt, setCustomPrompt] = useState(
    "A person in costume suddenly lunges forward with a spooky expression, arms extended as if to grab the viewer."
  );
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [restoredImage, setRestoredImage] = useState<string | null>(null);
  const [animatedVideo, setAnimatedVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(
    "jump-scare"
  );
  const [enhanceOptions, setEnhanceOptions] = useState({
    upscale: true,
    faceEnhance: false,
    colorize: false,
  });
  const [showFullScreenVideo, setShowFullScreenVideo] = useState(false);
  const [hasProcessedInitialImage, setHasProcessedInitialImage] = useState(false);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewVideoRef = useRef<Video>(null);
  const [featureCosts, setFeatureCosts] = useState<any>(null);
  const [selectedQuality, setSelectedQuality] = useState<"480p" | "720p" | "1080p">("480p");

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
        if (response && response.presets) {
          setAnimationTemplates(response.presets);
          
          // Select the first template if none is selected
          if (!selectedTemplate && response.presets.length > 0) {
            setSelectedTemplate(response.presets[0].slug || response.presets[0].id);
            setCustomPrompt(response.presets[0].prompt || "");
          }
        }
      } catch (error) {
        console.error("Failed to fetch templates", error);
      }
    };
    fetchTemplates();
  }, []);

  const [animationTemplates, setAnimationTemplates] = useState<any[]>([]);


  const fetchUserCredits = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getToken();
      const result = await api.verifyUser(user, token);
      setUserCredits(result.result?.credits || 0);
    } catch (error) {
      console.error("Error fetching credits:", error);
    }
  }, [user]); // Removed getToken from dependencies

  useEffect(() => {
    if (user) {
      fetchUserCredits();
    }
  }, [user, fetchUserCredits]);

  // Ensure preview video is paused when fullscreen opens
  useEffect(() => {
    if (showFullScreenVideo && previewVideoRef.current) {
      previewVideoRef.current.pauseAsync().then(() => {
        setIsPreviewPlaying(false);
      }).catch(console.error);
    }
  }, [showFullScreenVideo]);

  // Ensure preview video stays paused when it's not supposed to play
  useEffect(() => {
    if (!showFullScreenVideo && previewVideoRef.current && isPreviewPlaying) {
      previewVideoRef.current.pauseAsync().then(() => {
        setIsPreviewPlaying(false);
      }).catch(console.error);
    }
  }, [showFullScreenVideo, isPreviewPlaying]);

  // Handle incoming image from route params (from home screen or onboarding)
  useEffect(() => {
    const imageUri = params.imageUri as string | undefined;
    
    if (imageUri && !hasProcessedInitialImage && user) {
      setHasProcessedInitialImage(true);
      // Decode the URI if it's encoded
      const decodedUri = decodeURIComponent(imageUri);
      uploadImageFromUri(decodedUri);
    }
  }, [params.imageUri, hasProcessedInitialImage, user, uploadImageFromUri]);

  // Handle incoming template ID from route params (from home screen)
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
      
      // Auto-select first template if available
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
  }, [getToken]);

  const pickImage = async () => {
    try {
      const hasPermission = await requestImagePermission();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      if (!result.assets || !result.assets[0]) {
        Alert.alert("Error", "No image selected.");
        return;
      }

      setUploading(true);
      const imageUri = result.assets[0].uri;

      if (!imageUri) {
        throw new Error("Image URI is missing");
      }

      // Use the helper function to upload
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

  const handleSurpriseMe = () => {
    const randomPrompt =
      promptExamples[Math.floor(Math.random() * promptExamples.length)];
    setCustomPrompt(randomPrompt);
    setSelectedTemplate(null);
  };

  const handleTemplateSelect = (template: (typeof animationTemplates)[0]) => {
    setSelectedTemplate(template.id);
    setCustomPrompt(template.prompt);
  };

  const handleRestore = async () => {
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

    const requiredCredits = featureCosts?.restore_image || 1;

    if (userCredits < requiredCredits) {
      Alert.alert(
        "Insufficient Credits",
        `You need at least ${requiredCredits} credits to restore images. Please purchase more credits to continue.`
      );
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const result = await api.restoreImage(uploadedImage, userEmail, token);
      setRestoredImage(result.result);
      await fetchUserCredits();
      Alert.alert("Success", "Image restored successfully!");
    } catch (error: any) {
      console.error("Error restoring image:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to restore image. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEnhance = async () => {
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

    if (userCredits < totalCost) {
      Alert.alert(
        "Insufficient Credits",
        `You need at least ${totalCost} credits to perform this enhancement. Please purchase more credits to continue.`
      );
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const result = await api.enhanceImage(uploadedImage, userEmail, enhanceOptions, token);
      setRestoredImage(result.result); // Using restoredImage state to show image output
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
    }
  };

  const handleAnimate = async () => {
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

    // Check credits - cost depends on selected quality tier
    const qualityCostKeys: Record<string, string> = { "480p": "animate_photo", "720p": "animate_photo_hd", "1080p": "animate_photo_uhd" };
    const qualityDefaults: Record<string, number> = { "480p": 3, "720p": 5, "1080p": 8 };
    const requiredCredits = featureCosts?.[qualityCostKeys[selectedQuality]] || qualityDefaults[selectedQuality];
    if (userCredits < requiredCredits) {
      Alert.alert(
        "Insufficient Credits",
        `You need at least ${requiredCredits} credits to animate images at ${selectedQuality}. Please purchase more credits to continue.`
      );
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const imageToAnimate = restoredImage || uploadedImage;
      const prompt =
        customPrompt ||
        "Two people see each other, smile warmly, and share a gentle, affectionate hug.";
      const result = await api.animatePhoto(
        imageToAnimate,
        userEmail,
        prompt,
        10,
        token,
        selectedQuality
      );
      setAnimatedVideo(result.result);
      await fetchUserCredits();
      // Don't auto-open fullscreen - let user tap to open
    } catch (error: any) {
      console.error("Error animating image:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to animate image. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setUploadedImage(null);
    setRestoredImage(null);
    setAnimatedVideo(null);
    setShowFullScreenVideo(false);
    // Reset to defaults: animate tool and warm hug template
    setSelectedTool("animate");
    setCustomPrompt(
      "Two people see each other, smile warmly, and share a gentle, affectionate hug."
    );
    setSelectedTemplate("warm-hug");
    setEnhanceOptions({ upscale: true, faceEnhance: false, colorize: false });
    setSelectedQuality("480p");
  };

  const getCreditCost = () => {
    if (selectedTool === "restore") return featureCosts?.restore_image || 1;
    if (selectedTool === "enhance") {
      let cost = 0;
      if (enhanceOptions.upscale) cost += featureCosts?.enhance_upscale || 1;
      if (enhanceOptions.faceEnhance) cost += featureCosts?.enhance_face || 1;
      if (enhanceOptions.colorize) cost += featureCosts?.enhance_colorize || 1;
      return cost;
    }
    if (selectedTool === "animate") {
      const qKeys: Record<string, string> = { "480p": "animate_photo", "720p": "animate_photo_hd", "1080p": "animate_photo_uhd" };
      const qDefaults: Record<string, number> = { "480p": 3, "720p": 5, "1080p": 8 };
      return featureCosts?.[qKeys[selectedQuality]] || qDefaults[selectedQuality];
    }
    return 0;
  };

  const handleDownload = async (url: string, type: "image" | "video") => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Unable to open download link.");
      }
    } catch (error: any) {
      console.error("Error downloading:", error);
      Alert.alert("Error", "Failed to download file. Please try again.");
    }
  };

  return (
    <ScreenWrapper 
      addBottomPadding={true}
      creditsText={userCredits !== null ? `${userCredits} Credits` : "Loading..."}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <GradientText style={styles.mainTitle}>
            Choose Your AI Tool
          </GradientText>
          <Text style={styles.subtitle}>
            Restore old photos or bring them to life with animation
          </Text>
        </View>

        {/* AI Tool Selection */}
        <View style={styles.toolSelection}>
          <TouchableOpacity
            style={[
              styles.toolCard,
              selectedTool === "restore" && styles.toolCardSelected,
            ]}
            onPress={() => {
              setSelectedTool("restore");
              setAnimatedVideo(null);
            }}
          >
            <View style={styles.toolImageContainer}>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46",
                }}
                style={styles.toolImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.toolLabel}>Restore Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toolCard,
              selectedTool === "animate" && styles.toolCardSelected,
            ]}
            onPress={() => setSelectedTool("animate")}
          >
            <View style={styles.toolImageContainer}>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46",
                }}
                style={styles.toolImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.toolLabel}>Animate Photo</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toolCard,
              selectedTool === "enhance" && styles.toolCardSelected,
            ]}
            onPress={() => setSelectedTool("enhance")}
          >
            <View style={styles.toolImageContainer}>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46",
                }}
                style={styles.toolImage}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.toolLabel}>Enhance Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Upload Section */}
        <View style={styles.uploadSection}>
          <View style={styles.uploadContainer}>
            <LinearGradient
              colors={["rgba(40, 212, 250, 0.15)", "rgba(210, 41, 255, 0.15)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.uploadGradient}
            >
              <TouchableOpacity
                style={styles.uploadArea}
                onPress={pickImage}
                disabled={uploading}
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
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                  >
                    <Text style={styles.removeButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.uploadContent}>
                  <View style={styles.uploadLeftSection}>
                    <Text style={styles.uploadTitle}>Upload a file here</Text>
                    <View style={styles.uploadSeparator} />
                    <Text style={styles.uploadSubtext}>
                      Supported formats: jpg, jpeg, png{"\n"}Max file size:
                      10MB. Min resolution 300x300px.
                    </Text>
                  </View>
                  <View style={styles.uploadRightSection}>
                    <View style={styles.uploadIconContainer}>
                      <UploadIcon color={"#fff"} />
                    </View>
                  </View>
                </View>
              )}
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </View>

        {/* Result Display */}
        {(restoredImage || animatedVideo) && (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>
              {animatedVideo
                ? "Your Video is Ready!"
                : "Your Restored Photo is Ready!"}
            </Text>
            <View style={styles.resultContainer}>
              {animatedVideo ? (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => {
                    // Pause preview video before opening fullscreen
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
                    shouldPlay={false}
                    onPlaybackStatusUpdate={(status) => {
                      setIsPreviewPlaying(status.isPlaying);
                    }}
                  />
                </TouchableOpacity>
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
                  <Text style={styles.downloadButtonText}>Download</Text>
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

        {/* Custom Animation Section - Only show for animate */}
        {selectedTool === "animate" && !animatedVideo && (
          <View style={styles.customSection}>
            <View style={styles.customHeader}>
              <Text style={styles.customTitle}>Custom Animation</Text>
              <View style={styles.optionalTagWrapper}>
                <LinearGradient
                  colors={["#28D4FA", "#D229FF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.optionalTagGradient}
                >
                  <View style={styles.optionalTag}>
                    <GradientText style={styles.optionalText}>
                      Optional
                    </GradientText>
                  </View>
                </LinearGradient>
              </View>
            </View>
            <View style={styles.customInputContainer}>
              <TextInput
                style={styles.customInput}
                placeholder="Describe how you want your photo to move...(e.g gentle smile, slow blink, head turn)"
                placeholderTextColor="#9d9d9d"
                multiline
                numberOfLines={4}
                value={customPrompt}
                onChangeText={(text) => {
                  setCustomPrompt(text);
                  setSelectedTemplate(null);
                }}
              />
              <TouchableOpacity
                style={styles.surpriseButton}
                onPress={handleSurpriseMe}
              >
                <LinearGradient
                  colors={["#28D4FA", "#D229FF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.surpriseButtonGradient}
                >
                  <SurpriseMeIcon />
                  <Text style={styles.surpriseText}>Surprise Me</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Enhance Options Section - Only show for enhance */}
        {selectedTool === "enhance" && !restoredImage && (
          <View style={styles.customSection}>
             <View style={styles.customHeader}>
               <Text style={styles.customTitle}>Enhancement Options</Text>
             </View>
             <View style={[styles.customInputContainer, { minHeight: "auto", paddingVertical: 12 }]}>
               <TouchableOpacity 
                 style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}
                 onPress={() => setEnhanceOptions(prev => ({...prev, upscale: !prev.upscale}))}
               >
                 <View style={{ width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: enhanceOptions.upscale ? "#28D4FA" : "#9d9d9d", backgroundColor: enhanceOptions.upscale ? "#28D4FA" : "transparent", marginRight: 12, alignItems: "center", justifyContent: "center" }}>
                   {enhanceOptions.upscale && <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>✓</Text>}
                 </View>
                 <Text style={{ fontSize: 16, color: "#000" }}>4K Upscale ({featureCosts?.enhance_upscale || 1} credit{(featureCosts?.enhance_upscale || 1) !== 1 ? 's' : ''})</Text>
               </TouchableOpacity>

               <TouchableOpacity 
                 style={{ flexDirection: "row", alignItems: "center", marginBottom: 12 }}
                 onPress={() => setEnhanceOptions(prev => ({...prev, faceEnhance: !prev.faceEnhance}))}
               >
                 <View style={{ width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: enhanceOptions.faceEnhance ? "#28D4FA" : "#9d9d9d", backgroundColor: enhanceOptions.faceEnhance ? "#28D4FA" : "transparent", marginRight: 12, alignItems: "center", justifyContent: "center" }}>
                   {enhanceOptions.faceEnhance && <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>✓</Text>}
                 </View>
                 <Text style={{ fontSize: 16, color: "#000" }}>Face Enhancement ({featureCosts?.enhance_face || 1} credit{(featureCosts?.enhance_face || 1) !== 1 ? 's' : ''})</Text>
               </TouchableOpacity>

               <TouchableOpacity 
                 style={{ flexDirection: "row", alignItems: "center" }}
                 onPress={() => setEnhanceOptions(prev => ({...prev, colorize: !prev.colorize}))}
               >
                 <View style={{ width: 24, height: 24, borderRadius: 4, borderWidth: 2, borderColor: enhanceOptions.colorize ? "#28D4FA" : "#9d9d9d", backgroundColor: enhanceOptions.colorize ? "#28D4FA" : "transparent", marginRight: 12, alignItems: "center", justifyContent: "center" }}>
                   {enhanceOptions.colorize && <Text style={{ color: "#fff", fontSize: 16, fontWeight: "bold" }}>✓</Text>}
                 </View>
                 <Text style={{ fontSize: 16, color: "#000" }}>Colorize B&W ({featureCosts?.enhance_colorize || 1} credit{(featureCosts?.enhance_colorize || 1) !== 1 ? 's' : ''})</Text>
               </TouchableOpacity>
             </View>
          </View>
        )}

        {/* Quality Selection - Only show for animate */}
        {selectedTool === "animate" && !animatedVideo && (
          <View style={styles.qualitySection}>
            <Text style={styles.qualitySectionTitle}>Output Quality</Text>
            <View style={styles.qualityRow}>
              {/* Standard 480p */}
              <TouchableOpacity
                style={[
                  styles.qualityCard,
                  selectedQuality === "480p" && styles.qualityCardSelected,
                ]}
                onPress={() => setSelectedQuality("480p")}
              >
                {selectedQuality === "480p" ? (
                  <LinearGradient
                    colors={["#28A4F0", "#38BDF8"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.qualityCardGradient}
                  >
                    <Text style={[styles.qualityLabel, { color: "#fff" }]}>Standard</Text>
                    <Text style={[styles.qualityRes, { color: "rgba(255,255,255,0.8)" }]}>480p</Text>
                    <Text style={[styles.qualityCredits, { color: "rgba(255,255,255,0.9)" }]}>
                      {featureCosts?.animate_photo || 3} credits
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.qualityCardInner}>
                    <Text style={styles.qualityLabel}>Standard</Text>
                    <Text style={styles.qualityRes}>480p</Text>
                    <Text style={styles.qualityCredits}>
                      {featureCosts?.animate_photo || 3} credits
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {/* HD 720p */}
              <TouchableOpacity
                style={[
                  styles.qualityCard,
                  selectedQuality === "720p" && styles.qualityCardSelected,
                ]}
                onPress={() => setSelectedQuality("720p")}
              >
                {selectedQuality === "720p" ? (
                  <LinearGradient
                    colors={["#A855F7", "#EC4899"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.qualityCardGradient}
                  >
                    <Text style={[styles.qualityLabel, { color: "#fff" }]}>HD</Text>
                    <Text style={[styles.qualityRes, { color: "rgba(255,255,255,0.8)" }]}>720p</Text>
                    <Text style={[styles.qualityCredits, { color: "rgba(255,255,255,0.9)" }]}>
                      {featureCosts?.animate_photo_hd || 5} credits
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.qualityCardInner}>
                    <Text style={styles.qualityLabel}>HD</Text>
                    <Text style={styles.qualityRes}>720p</Text>
                    <Text style={styles.qualityCredits}>
                      {featureCosts?.animate_photo_hd || 5} credits
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              {/* Ultra HD 1080p */}
              <TouchableOpacity
                style={[
                  styles.qualityCard,
                  selectedQuality === "1080p" && styles.qualityCardSelected,
                ]}
                onPress={() => setSelectedQuality("1080p")}
              >
                {selectedQuality === "1080p" ? (
                  <LinearGradient
                    colors={["#F59E0B", "#F97316"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.qualityCardGradient}
                  >
                    <Text style={[styles.qualityLabel, { color: "#fff" }]}>Ultra HD</Text>
                    <Text style={[styles.qualityRes, { color: "rgba(255,255,255,0.8)" }]}>1080p</Text>
                    <Text style={[styles.qualityCredits, { color: "rgba(255,255,255,0.9)" }]}>
                      {featureCosts?.animate_photo_uhd || 8} credits
                    </Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.qualityCardInner}>
                    <Text style={styles.qualityLabel}>Ultra HD</Text>
                    <Text style={styles.qualityRes}>1080p</Text>
                    <Text style={styles.qualityCredits}>
                      {featureCosts?.animate_photo_uhd || 8} credits
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Generate Button */}
        {!animatedVideo && !restoredImage && (
          <View style={styles.generateSection}>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={
                selectedTool === "restore" 
                  ? handleRestore 
                  : selectedTool === "enhance"
                    ? handleEnhance
                    : handleAnimate
              }
              disabled={loading || !uploadedImage || !selectedTool}
            >
              <LinearGradient
                colors={["#28D4FA", "#D229FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.generateButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <GenerateIcon />
                    <Text style={styles.generateText}>Generate</Text>
                    <View style={styles.creditsBadge}>
                      <GenerateCreditIcon />
                      <Text style={styles.creditsBadgeText}>
                        {getCreditCost()} Credits
                      </Text>
                    </View>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Current Credits */}
        <View style={styles.creditsDisplay}>
          <GenerateCreditIcon color={"#28D4FA"} height={12} width={12} />
          <GradientText style={styles.creditsText}>
            Current Credits: {userCredits}
          </GradientText>
        </View>

        {/* Full Screen Video Modal */}
        <FullScreenVideoViewer
          visible={showFullScreenVideo}
          videoUri={animatedVideo}
          onClose={() => {
            setShowFullScreenVideo(false);
            // Ensure preview video is paused when closing fullscreen
            previewVideoRef.current?.pauseAsync().then(() => {
              setIsPreviewPlaying(false);
            }).catch(console.error);
          }}
          onDownload={() => {
            if (animatedVideo) {
              handleDownload(animatedVideo, "video");
            }
          }}
          onPreviewVideoPause={() => {
            // Pause preview video when fullscreen opens
            previewVideoRef.current?.pauseAsync().then(() => {
              setIsPreviewPlaying(false);
            }).catch(console.error);
          }}
        />

        {/* Animation Templates - Only show for animate */}
        {selectedTool === "animate" && !animatedVideo && (
          <View style={styles.templatesSection}>
            <Text style={styles.templatesTitle}>Animation Templates</Text>
            <Text style={styles.templatesSubtitle}>
              Choose a template or create custom animation
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.templatesScroll}
            >
              <TouchableOpacity
                style={[
                  styles.templateCard,
                  selectedTemplate === null && styles.templateCardSelected,
                ]}
                onPress={() => {
                  setSelectedTemplate(null);
                  setCustomPrompt("");
                }}
              >
                <View
                  style={[
                    styles.templateImageContainer,
                    styles.customTemplateContainer,
                  ]}
                >
                  <Text style={styles.customTemplateText}>+</Text>
                </View>
                <Text style={styles.templateName}>Custom</Text>
              </TouchableOpacity>
              {animationTemplates.map((template) => {
                const templateId = template.slug || template.id;
                return (
                <TouchableOpacity
                  key={templateId}
                  style={[
                    styles.templateCard,
                    selectedTemplate === templateId &&
                      styles.templateCardSelected,
                  ]}
                  onPress={() => handleTemplateSelect(template)}
                >
                  <View style={styles.templateImageContainer}>
                    <Image
                      source={{ uri: template.thumbnailUrl || template.image }}
                      style={styles.templateImage}
                      resizeMode="cover"
                    />
                  </View>
                  <Text style={styles.templateName}>{template.name}</Text>
                </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  titleSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    alignItems: "center",
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: "400",
    color: "#000",
    textAlign: "center",
    lineHeight: 28,
  },
  subtitleHighlight: {
    fontWeight: "500",
    color: "#D229FF",
  },
  toolSelection: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  toolCard: {
    flex: 1,
    borderRadius: 4,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  toolCardSelected: {
    borderColor: "#D229FF",
  },
  toolImageContainer: {
    width: "100%",
    height: 155,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  toolImage: {
    width: "100%",
    height: "100%",
  },
  toolLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    paddingTop: 12,
  },
  uploadSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  uploadContainer: {
    borderRadius: 7,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 17.1,
    elevation: 5,
    margin: 9,
    overflow: "hidden",
  },
  uploadGradient: {
    borderRadius: 7,
    flex: 1,
  },
  uploadArea: {
    borderWidth: 0.75,
    borderColor: "#979797",
    borderStyle: "dashed",
    borderRadius: 7,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    minHeight: 168,
    justifyContent: "center",
    margin: 9,
  },
  uploadContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  uploadRightSection: {
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  uploadIconContainer: {
    marginLeft: 16,
  },
  uploadLeftSection: {
    flex: 1,
    alignItems: "flex-start",
  },
  uploadTitle: {
    fontSize: 15,
    fontWeight: "400",
    color: "#000",
    marginBottom: 8,
  },
  uploadSeparator: {
    height: 1,
    backgroundColor: "#979797",
    marginBottom: 6,
    width: "85%",
  },
  uploadSubtext: {
    fontSize: 11,
    fontWeight: "400",
    color: "#979797",
    lineHeight: 18,
    marginBottom: 18,
  },
  uploadedImageContainer: {
    width: "100%",
    height: 200,
    position: "relative",
  },
  uploadedImage: {
    width: "100%",
    height: "100%",
  },
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 20,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  resultSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginBottom: 16,
  },
  resultContainer: {
    width: "100%",
    height: 300,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#000",
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  resultImage: {
    width: "100%",
    height: "100%",
  },
  resultVideoContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  resultVideo: {
    width: "100%",
    height: "100%",
  },
  resetButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#979797",
    borderRadius: 7,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: "center",
  },
  resetButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  resultActions: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  resultActionButton: {
    flex: 1,
    maxWidth: 150,
  },
  downloadButton: {
    borderRadius: 7,
    overflow: "hidden",
  },
  downloadButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  downloadButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  customSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  customHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  customTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
  },
  optionalTagWrapper: {
    borderRadius: 4.526,
  },
  optionalTagGradient: {
    borderRadius: 4.526,
    padding: 1,
  },
  optionalTag: {
    backgroundColor: "#fff",
    borderRadius: 4.526 - 1,
    paddingHorizontal: 11.314,
    paddingVertical: 3,
  },
  optionalText: {
    fontSize: 12,
    fontWeight: "600",
  },
  customInputContainer: {
    backgroundColor: "#fff",
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: "#9d9d9d",
    borderStyle: "dashed",
    minHeight: 157,
    padding: 16,
    position: "relative",
  },
  customInput: {
    fontSize: 15,
    fontWeight: "400",
    color: "#000",
    textAlignVertical: "top",
    minHeight: 120,
  },
  surpriseButton: {
    position: "absolute",
    bottom: 12,
    right: 12,
    borderRadius: 4,
    overflow: "hidden",
  },
  surpriseButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  surpriseText: {
    fontSize: 14,
    fontWeight: "300",
    color: "#fff",
  },
  generateSection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  generateButton: {
    borderRadius: 7,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    width: "70%",
    alignSelf: "center",
  },
  generateButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 10,
  },
  generateText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#fff",
  },
  creditsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.38)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
    marginLeft: 8,
  },
  creditsBadgeText: {
    fontSize: 10,
    fontWeight: "500",
    color: "#fff",
  },
  creditsDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 8,
  },
  creditsText: {
    fontSize: 14,
    fontWeight: "500",
  },
  templatesSection: {
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  templatesTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginBottom: 12,
  },
  templatesSubtitle: {
    fontSize: 17,
    fontWeight: "400",
    color: "#000",
    textAlign: "center",
    marginBottom: 20,
  },
  templatesScroll: {
    marginHorizontal: -16,
    paddingLeft: 16,
  },
  templateCard: {
    width: 93,
    marginRight: 24,
    alignItems: "center",
  },
  templateCardSelected: {
    opacity: 0.7,
  },
  templateImageContainer: {
    width: 93,
    height: 93,
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 5,
    borderWidth: 2,
    borderColor: "transparent",
  },
  customTemplateContainer: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  customTemplateText: {
    fontSize: 28,
    color: "#979797",
  },
  templateImage: {
    width: "100%",
    height: "100%",
  },
  templateName: {
    fontSize: 13,
    fontWeight: "400",
    color: "#000",
    textAlign: "center",
  },
  qualitySection: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  qualitySectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  qualityRow: {
    flexDirection: "row" as const,
    gap: 10,
  },
  qualityCard: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden" as const,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
  },
  qualityCardSelected: {
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  qualityCardGradient: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center" as const,
  },
  qualityCardInner: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center" as const,
    backgroundColor: "#fff",
  },
  qualityLabel: {
    fontSize: 14,
    fontWeight: "700" as const,
    color: "#1f2937",
    marginBottom: 2,
  },
  qualityRes: {
    fontSize: 11,
    fontWeight: "500" as const,
    color: "#9ca3af",
    marginBottom: 4,
  },
  qualityCredits: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: "#6b7280",
  },
});
