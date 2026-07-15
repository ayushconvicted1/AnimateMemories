import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { GradientText } from "@/components/ui/GradientText";
import AnimateMemoriesLogo from "@/components/images/AnimateMemoriesLogo";
import UploadIcon from "@/components/images/UploadIcon";
import HomeArrow from "@/components/images/HomeArrow";
import NotificationsIcon from "@/components/images/NotificationsIcon";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import { useAuth as useAuthContext } from "@/contexts/AuthContext";
import { useAuth } from "@clerk/clerk-expo";
import { api } from "@/services/api";
import { BlurView } from "expo-blur";
import { getFontFamily } from "@/constants/Fonts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTENT_WIDTH = SCREEN_WIDTH - 32;

// API base URL for template images
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:3000";

export default function HomeScreen() {
  const { user } = useAuthContext();
  const { getToken } = useAuth();
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [animationTemplates, setAnimationTemplates] = useState<any[]>([]);

  useEffect(() => {
    const fetchUserCredits = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Get Clerk session token
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
        if (response && response.presets) {
          setAnimationTemplates(response.presets);
        }
      } catch (error) {
        console.error("Failed to fetch templates", error);
      }
    };

    fetchTemplates();

    if (user) {
      fetchUserCredits();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleTryForFree = () => {
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

      // Navigate to create tab with image URI as param
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

  const handleTemplateSelect = (templateId: string) => {
    router.push({
      pathname: "/(tabs)/animate",
      params: {
        templateId: templateId,
      },
    });
  };

  return (
    <ScreenWrapper
      addBottomPadding={true}
      creditsText={
        loading
          ? "Loading..."
          : userCredits !== null
          ? `${userCredits} Credits`
          : "0 Credits"
      }
    >
      {/* Hero Image Section */}
      <View style={styles.heroSection}>
        <View style={styles.heroImageContainer}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46",
            }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>
        <GradientText style={styles.heroTitle}>
          Animate Old Photos with AI
        </GradientText>
        <Text style={styles.heroDescription}>
          Easily create viral AI videos from your images and text with Animate
          Memories. Start making trendy{" "}
          <Text style={styles.highlightText}>
            AI Kiss, Hug, or Dance videos
          </Text>{" "}
          — all with just one click!
        </Text>
      </View>

      {/* Upload Section */}
      <View style={styles.uploadSection}>
        <TouchableOpacity
          style={styles.uploadContainer}
          onPress={handleUploadImage}
          activeOpacity={0.7}
        >
          <View style={styles.uploadArea}>
            <View style={styles.uploadIconContainer}>
              <Text style={styles.uploadIcon}>
                <UploadIcon />
              </Text>
            </View>
            <Text style={styles.uploadText}>Upload a file here</Text>
            <Text style={styles.uploadSubtext}>
              Supported formats: jpg, jpeg, png{"\n"}Max file size: 10MB. Min
              resolution 300x300px.
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tryForFreeButton}
          onPress={handleTryForFree}
        >
          <LinearGradient
            colors={["#28D4FA", "#D229FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.tryForFreeGradient}
          >
            <Text style={styles.tryForFreeText}>Try For Free</Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.orTryText}>Or try animating an example</Text>
      </View>

      {/* Animation Templates */}
      <View style={styles.templatesSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.templatesScroll}
        >
          {animationTemplates.map((template, index) => (
            <TouchableOpacity
              key={template.slug || template.id}
              style={[
                styles.templateCard,
                index === 0 && { marginLeft: 16 },
                index === animationTemplates.length - 1 && { marginRight: 16 },
              ]}
              onPress={() => handleTemplateSelect(template.slug || template.id)}
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
          ))}
        </ScrollView>
      </View>

      {/* How to Section */}
      <View style={styles.howToSection}>
        <Text style={styles.howToTitle}>
          How to Animate Old Pictures with AI?
        </Text>

        {/* Step 1 */}
        <View style={styles.stepContainer}>
          <View style={styles.stepContent}>
            <View style={styles.stepImageWrapper}>
              {/* Tilted gradient background */}
              <View
                style={[styles.gradientBackground, styles.gradientTiltLeft]}
              >
                <LinearGradient
                  colors={[
                    "rgba(147, 51, 234, 0.4)",
                    "rgba(59, 130, 246, 0.4)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientFill}
                />
              </View>
              <View style={styles.stepImageContainer}>
                <Image
                  source={require("@/assets/images/Home1.webp")}
                  style={styles.stepImage}
                  resizeMode="cover"
                />
              </View>
              {/* Arrow pointing to frame */}
              <View style={styles.arrowContainer}>
                <HomeArrow width={25} height={12} />
                <View style={styles.uploadIconFrame}>
                  <BlurView
                    intensity={20}
                    tint="light"
                    style={styles.uploadIconBlur}
                  >
                    <UploadIcon color="#4A4A4A" width={20} height={22} />
                  </BlurView>
                </View>
              </View>
            </View>
            <View style={[styles.stepTextContainer, styles.stepTextRight]}>
              <Text style={[styles.stepNumber, styles.textRight]}>Step 1</Text>
              <GradientText style={[styles.stepTitle, styles.textRight]}>
                Upload Your Image
              </GradientText>
              <Text style={[styles.stepDescription, styles.textRight]}>
                Click "<Text style={styles.stepHighlight}>Try for Free</Text>"
                and import your old photos effortlessly.
              </Text>
            </View>
          </View>
        </View>

        {/* Step 2 */}
        <View style={styles.stepContainer}>
          <View style={styles.stepContent}>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepNumber}>Step 2</Text>
              <GradientText style={styles.stepTitle}>
                Animate Your Photo
              </GradientText>
              <Text style={styles.stepDescription}>
                Ether Choose the template or choose custom for desired output &{" "}
                <Text style={styles.stepHighlight}>let AI do the magic</Text>
              </Text>
            </View>
            <View style={styles.stepImageWrapper}>
              {/* Tilted gradient background - opposite direction */}
              <View
                style={[styles.gradientBackground, styles.gradientTiltRight]}
              >
                <LinearGradient
                  colors={[
                    "rgba(59, 130, 246, 0.4)",
                    "rgba(147, 51, 234, 0.4)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientFill}
                />
              </View>
              <View style={styles.stepImageContainer}>
                <Image
                  source={require("@/assets/images/Home2.webp")}
                  style={styles.stepImage}
                  resizeMode="cover"
                />
              </View>
              {/* <View style={styles.templateBadge}>
                <Text style={styles.templateBadgeText}>T</Text>
                <Text style={styles.templateBadgeLabel}>
                  Let the girl sit down
                </Text>
              </View> */}
            </View>
          </View>
        </View>

        {/* Step 3 */}
        <View style={styles.stepContainer}>
          <View style={styles.stepContent}>
            <View style={styles.stepImageWrapper}>
              {/* Tilted gradient background */}
              <View
                style={[styles.gradientBackground, styles.gradientTiltLeft]}
              >
                <LinearGradient
                  colors={[
                    "rgba(147, 51, 234, 0.4)",
                    "rgba(59, 130, 246, 0.4)",
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.gradientFill}
                />
              </View>
              <View style={styles.stepImageContainer}>
                <Image
                  source={require("@/assets/images/Home3.webp")}
                  style={styles.stepImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.downloadBadge}>
                <Text style={styles.downloadIcon}>⬇</Text>
              </View>
            </View>
            <View style={[styles.stepTextContainer, styles.stepTextRight]}>
              <Text style={[styles.stepNumber, styles.textRight]}>Step 3</Text>
              <GradientText style={[styles.stepTitle, styles.textRight]}>
                Export and Download
              </GradientText>
              <Text style={[styles.stepDescription, styles.textRight]}>
                Preview and download your animated videos instantly.
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Gallery Preview */}
      <View style={styles.gallerySection}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/animate")}>
          <GradientText style={styles.viewMoreText}>View More</GradientText>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  logoIconText: {
    fontSize: 15,
    fontFamily: getFontFamily("700"),
    fontWeight: "700",
    color: "#fff",
  },
  logoDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#fff",
    marginTop: 2,
  },
  logoTextContainer: {
    marginLeft: 4,
  },
  logoTextTop: {
    fontSize: 14,
    fontFamily: getFontFamily("700"),
    fontWeight: "700",
    color: "#000",
  },
  logoTextBottom: {
    fontSize: 10,
    fontFamily: getFontFamily("400"),
    fontWeight: "400",
    color: "#000",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  creditsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  creditsButtonText: {
    fontSize: 10,
    fontFamily: getFontFamily("600"),
    fontWeight: "600",
    color: "#fff",
  },
  bellButton: {
    padding: 4,
  },
  bellIcon: {
    fontSize: 17,
  },
  heroSection: {
    width: CONTENT_WIDTH,
    marginHorizontal: 16,
    marginTop: 16,
    overflow: "hidden",
    marginBottom: 20,
  },
  heroImageContainer: {
    width: "100%",
    height: 265,
    position: "relative",
  },
  heroImage: {
    width: "100%",
    borderRadius: 10,
    height: "100%",
  },
  heroGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: getFontFamily("700"),
    fontWeight: "700",
    textAlign: "center",
    marginTop: 19,
    marginBottom: 10,
  },
  heroDescription: {
    fontSize: 17,
    fontFamily: getFontFamily("400"),
    fontWeight: "400",
    color: "#000",
    textAlign: "center",
    lineHeight: 30,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  highlightText: {
    fontWeight: "700",
  },
  uploadSection: {
    width: CONTENT_WIDTH,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  uploadContainer: {
    backgroundColor: "#fff",
    borderRadius: 7,
    elevation: 5,
    marginBottom: 16,
    overflow: "hidden",
  },
  uploadArea: {
    borderWidth: 0.75,
    borderColor: "#979797",
    borderStyle: "dashed",
    borderRadius: 7,
    padding: 20,
    alignItems: "center",
    margin: 9,
    minHeight: 168,
    justifyContent: "center",
  },
  uploadIconContainer: {
    marginBottom: 8,
  },
  uploadIcon: {
    fontSize: 34,
  },
  uploadText: {
    fontSize: 15,
    fontFamily: getFontFamily("400"),
    fontWeight: "400",
    color: "#000",
    marginBottom: 8,
  },
  uploadSubtext: {
    fontSize: 11,
    fontFamily: getFontFamily("400"),
    fontWeight: "400",
    color: "#979797",
    textAlign: "center",
  },
  tryForFreeButton: {
    borderRadius: 7,
    overflow: "hidden",
    marginBottom: 12,
    alignSelf: "center",
  },
  tryForFreeGradient: {
    paddingVertical: 10,
    paddingHorizontal: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  tryForFreeText: {
    fontSize: 17,
    fontFamily: getFontFamily("600"),
    fontWeight: "600",
    color: "#fff",
  },
  orTryText: {
    fontSize: 17,
    fontFamily: getFontFamily("400"),
    fontWeight: "400",
    color: "#000",
    textAlign: "center",
  },
  templatesSection: {
    marginBottom: 20,
  },
  templatesScroll: {
    paddingLeft: 16,
  },
  templateCard: {
    width: 93,
    marginRight: 24,
    alignItems: "center",
  },
  templateImageContainer: {
    width: 93,
    height: 93,
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 5,
  },
  templateImage: {
    width: "100%",
    height: "100%",
  },
  templateName: {
    fontSize: 13,
    fontFamily: getFontFamily("400"),
    fontWeight: "400",
    color: "#000",
    textAlign: "center",
  },
  howToSection: {
    width: CONTENT_WIDTH,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  howToTitle: {
    fontSize: 17,
    fontFamily: getFontFamily("700"),
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginBottom: 24,
  },
  stepContainer: {
    marginBottom: 20,
    backgroundColor: "transparent",
  },
  stepNumber: {
    fontSize: 17,
    fontFamily: getFontFamily("700"),
    fontWeight: "700",
    color: "#000",
    textDecorationLine: "underline",
    marginBottom: 10,
  },
  stepContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingRight: 4,
  },
  stepImageWrapper: {
    width: "50%",
    position: "relative",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 6,
    overflow: "visible",
  },
  gradientBackground: {
    position: "absolute",
    width: "100%",
    height: "85%",
    borderRadius: 10,
    overflow: "hidden",
    opacity: 0.8,
    zIndex: 0,
    top: "10%",
  },
  gradientTiltLeft: {
    transform: [{ rotate: "-12deg" }],
  },
  gradientTiltRight: {
    transform: [{ rotate: "12deg" }],
  },
  gradientFill: {
    width: "100%",
    height: "100%",
  },
  stepImageContainer: {
    width: "75%",
    aspectRatio: 79.3 / 118.72,
    borderRadius: 2.185,
    overflow: "hidden",
    elevation: 4,
    backgroundColor: "transparent",
    zIndex: 2,
    alignSelf: "flex-start",
    marginLeft: 8,
  },
  stepImage: {
    width: "100%",
    height: "100%",
  },
  arrowContainer: {
    position: "absolute",
    right: -30,
    top: "35%",
    zIndex: 3,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  uploadIconFrame: {
    width: 32,
    height: 32,
    borderRadius: 6,
    overflow: "hidden",
  },
  uploadIconBlur: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(74, 74, 74, 0.4)",
  },
  stepTextContainer: {
    width: "50%",
    flexShrink: 0,
  },
  stepTextRight: {
    alignItems: "flex-end",
  },
  textRight: {
    textAlign: "right",
  },
  stepTitle: {
    fontSize: 14,
    fontFamily: getFontFamily("700"),
    fontWeight: "700",
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 11,
    fontFamily: getFontFamily("400"),
    fontWeight: "400",
    color: "#000",
    lineHeight: 18,
  },
  stepHighlight: {
    color: "#D229FF",
    fontWeight: "600",
  },
  templateBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 4,
    padding: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backdropFilter: "blur(1.8px)",
    zIndex: 10,
  },
  templateBadgeText: {
    fontSize: 9,
    fontFamily: getFontFamily("500"),
    fontWeight: "500",
    color: "#000",
    borderWidth: 0.5,
    borderColor: "#000",
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  templateBadgeLabel: {
    fontSize: 9,
    fontFamily: getFontFamily("400"),
    fontWeight: "400",
    color: "#000",
  },
  downloadBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 1.5,
    padding: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backdropFilter: "blur(1.8px)",
  },
  downloadIcon: {
    fontSize: 9,
  },
  gallerySection: {
    width: CONTENT_WIDTH,
    marginHorizontal: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  viewMoreText: {
    fontSize: 15,
    fontFamily: getFontFamily("600"),
    fontWeight: "600",
  },
});
