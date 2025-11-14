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
import { useState, useEffect } from "react";
import * as ImagePicker from "expo-image-picker";
import { Video, ResizeMode } from "expo-av";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import { GradientText } from "@/components/ui/GradientText";
import UploadIcon from "@/components/images/UploadIcon";
import SurpriseMeIcon from "@/components/images/SurpriseMeIcon";
import GenerateIcon from "@/components/images/GenerateIcon";
import GenerateCreditIcon from "@/components/images/GenerateCreditIcon";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";
import { uploadImageToCloudinary } from "@/services/cloudinary";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTENT_WIDTH = SCREEN_WIDTH - 32;

const promptExamples = [
  "slowly turns head left and right, blinks softly, gentle smile",
  "natural breathing motion, subtle eye movement, peaceful expression",
  "gentle swaying dance movement, rhythmic head bob, joyful expression",
  "two people hugging warmly, slight rocking motion, emotional embrace",
  "playful dancing with shoulder movements, happy facial expressions",
];

export default function AnimateScreen() {
  const { user } = useAuth();
  const [selectedTool, setSelectedTool] = useState<"restore" | "animate" | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [restoredImage, setRestoredImage] = useState<string | null>(null);
  const [animatedVideo, setAnimatedVideo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [userCredits, setUserCredits] = useState<number>(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const animationTemplates = [
    {
      id: "warm-hug",
      name: "Warm Hug",
      prompt: "Two people see each other, smile warmly, and share a gentle, affectionate hug.",
      image: "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46",
    },
    {
      id: "fighting-pose",
      name: "Fighting Pose",
      prompt: "start fighting",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
    },
    {
      id: "head-lean",
      name: "Head Lean",
      prompt: "Two friends stand side by side, smiling, and gently lean their heads together.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
    },
    {
      id: "high-ten",
      name: "High Ten",
      prompt: "Two people face each other with excitement, raise their hands, and give each other a joyful high ten.",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c",
    },
    {
      id: "thumbs-up",
      name: "Thumbs Up",
      prompt: "A person looks at the camera, smiles confidently, and gives a cheerful thumbs up gesture.",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
    },
  ];

  useEffect(() => {
    fetchUserCredits();
  }, [user]);

  const fetchUserCredits = async () => {
    if (!user) return;
    try {
      const result = await api.verifyUser(user);
      setUserCredits(result.result?.credits || 0);
    } catch (error) {
      console.error("Error fetching credits:", error);
    }
  };

  const requestImagePermission = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission needed", "Please grant camera roll permissions to upload images.");
        return false;
      }
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestImagePermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setUploading(true);
        const imageUri = result.assets[0].uri;
        
        // Upload to Cloudinary
        const cloudinaryUrl = await uploadImageToCloudinary(imageUri, "image");
        setUploadedImage(cloudinaryUrl);
        setRestoredImage(null);
        setAnimatedVideo(null);
        setUploading(false);
      }
    } catch (error: any) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image. Please try again.");
      setUploading(false);
    }
  };

  const handleSurpriseMe = () => {
    const randomPrompt = promptExamples[Math.floor(Math.random() * promptExamples.length)];
    setCustomPrompt(randomPrompt);
    setSelectedTemplate(null);
  };

  const handleTemplateSelect = (template: typeof animationTemplates[0]) => {
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

    const userEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress;
    if (!userEmail) {
      Alert.alert("Error", "Unable to get user email.");
      return;
    }

    if (userCredits < 1) {
      Alert.alert("Insufficient Credits", "You need at least 1 credit to restore images.");
      return;
    }

    setLoading(true);
    try {
      const result = await api.restoreImage(uploadedImage, userEmail);
      setRestoredImage(result.result);
      await fetchUserCredits();
      Alert.alert("Success", "Image restored successfully!");
    } catch (error: any) {
      console.error("Error restoring image:", error);
      Alert.alert("Error", error.message || "Failed to restore image. Please try again.");
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

    const userEmail = user?.primaryEmailAddress?.emailAddress || user?.emailAddresses?.[0]?.emailAddress;
    if (!userEmail) {
      Alert.alert("Error", "Unable to get user email.");
      return;
    }

    if (userCredits < 2) {
      Alert.alert("Insufficient Credits", "You need at least 2 credits to animate images.");
      return;
    }

    setLoading(true);
    try {
      const imageToAnimate = restoredImage || uploadedImage;
      const prompt = customPrompt || "looks around and smiles";
      const result = await api.animatePhoto(imageToAnimate, userEmail, prompt, 6);
      setAnimatedVideo(result.result);
      await fetchUserCredits();
      Alert.alert("Success", "Video generated successfully!");
    } catch (error: any) {
      console.error("Error animating image:", error);
      Alert.alert("Error", error.message || "Failed to animate image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setUploadedImage(null);
    setRestoredImage(null);
    setAnimatedVideo(null);
    setCustomPrompt("");
    setSelectedTemplate(null);
  };

  const getCreditCost = () => {
    if (selectedTool === "restore") return 1;
    if (selectedTool === "animate") return 2;
    return 0;
  };

  return (
    <ScreenWrapper addBottomPadding={true}>
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
        </View>

        {/* Upload Section */}
        <View style={styles.uploadSection}>
          <LinearGradient
            colors={["rgba(40, 212, 250, 0.15)", "rgba(210, 41, 255, 0.15)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.uploadContainer}
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
                      Supported formats: jpg, jpeg, png{"\n"}Max file size: 10MB.
                      Min resolution 300x300px.
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

        {/* Result Display */}
        {(restoredImage || animatedVideo) && (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>
              {animatedVideo ? "Your Video is Ready!" : "Your Restored Photo is Ready!"}
            </Text>
            <View style={styles.resultContainer}>
              {animatedVideo ? (
                <Video
                  source={{ uri: animatedVideo }}
                  style={styles.resultVideo}
                  useNativeControls
                  resizeMode={ResizeMode.CONTAIN}
                  isLooping
                />
              ) : (
                <Image
                  source={{ uri: restoredImage! }}
                  style={styles.resultImage}
                  resizeMode="contain"
                />
              )}
            </View>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Text style={styles.resetButtonText}>Start Over</Text>
            </TouchableOpacity>
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
              <TouchableOpacity style={styles.surpriseButton} onPress={handleSurpriseMe}>
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

        {/* Generate Button */}
        {!animatedVideo && !restoredImage && (
          <View style={styles.generateSection}>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={selectedTool === "restore" ? handleRestore : handleAnimate}
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
                <View style={[styles.templateImageContainer, styles.customTemplateContainer]}>
                  <Text style={styles.customTemplateText}>+</Text>
                </View>
                <Text style={styles.templateName}>Custom</Text>
              </TouchableOpacity>
              {animationTemplates.map((template) => (
                <TouchableOpacity
                  key={template.id}
                  style={[
                    styles.templateCard,
                    selectedTemplate === template.id && styles.templateCardSelected,
                  ]}
                  onPress={() => handleTemplateSelect(template)}
                >
                  <View style={styles.templateImageContainer}>
                    <Image
                      source={{ uri: template.image }}
                      style={styles.templateImage}
                      resizeMode="cover"
                    />
                  </View>
                  <Text style={styles.templateName}>{template.name}</Text>
                </TouchableOpacity>
              ))}
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
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
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
    fontSize: 17.343,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 17.1,
    elevation: 5,
    margin: 9,
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
    fontSize: 18,
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
    fontSize: 12.781,
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
    fontSize: 24,
    fontWeight: "bold",
  },
  resultSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 20,
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
  },
  resultImage: {
    width: "100%",
    height: "100%",
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
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
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
    fontSize: 20,
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
    fontSize: 14.556,
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
    fontSize: 18,
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
    fontSize: 17.076,
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
    fontSize: 20,
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
    fontSize: 12,
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
    fontSize: 17.747,
    fontWeight: "500",
  },
  templatesSection: {
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  templatesTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginBottom: 12,
  },
  templatesSubtitle: {
    fontSize: 20,
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
    fontSize: 32,
    color: "#979797",
  },
  templateImage: {
    width: "100%",
    height: "100%",
  },
  templateName: {
    fontSize: 15,
    fontWeight: "400",
    color: "#000",
    textAlign: "center",
  },
});
