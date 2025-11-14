import {
  StyleSheet,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { GradientText } from "@/components/ui/GradientText";
import AnimateMemoriesLogo from "@/components/images/AnimateMemoriesLogo";
import UploadIcon from "@/components/images/UploadIcon";
import NotificationsIcon from "@/components/images/NotificationsIcon";
import TabHeader from "@/components/ui/TabHeader";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/services/api";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTENT_WIDTH = SCREEN_WIDTH - 32;

export default function HomeScreen() {
  const { user } = useAuth();
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserCredits = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const result = await api.verifyUser(user);
        setUserCredits(result.result?.credits || 0);
      } catch (error) {
        console.error("Error fetching user credits:", error);
        setUserCredits(0);
      } finally {
        setLoading(false);
      }
    };

    fetchUserCredits();
  }, [user]);

  const handleTryForFree = () => {
    router.push("/(tabs)/animate");
  };

  const animationTemplates = [
    {
      name: "Warm Hug",
      image: "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46",
    },
    {
      name: "Fighting Pose",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
    },
    {
      name: "Head Lean",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
    },
    {
      name: "High Ten",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c",
    },
    {
      name: "Thumbs Up",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <TabHeader
          creditsText={
            loading
              ? "Loading..."
              : userCredits !== null
              ? `${userCredits} Credits`
              : "0 Credits"
          }
        />

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
          {/* <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)']}
            style={styles.heroGradient}
          /> */}
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
          <View style={styles.uploadContainer}>
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
          </View>
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
              <View key={index} style={styles.templateCard}>
                <View style={styles.templateImageContainer}>
                  <Image
                    source={{ uri: template.image }}
                    style={styles.templateImage}
                    resizeMode="cover"
                  />
                </View>
                <Text style={styles.templateName}>{template.name}</Text>
              </View>
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
              <View style={styles.stepImageContainer}>
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46",
                  }}
                  style={styles.stepImage}
                  resizeMode="cover"
                />
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepNumber}>Step 1</Text>
                <GradientText style={styles.stepTitle}>
                  Upload Your Image
                </GradientText>
                <Text style={styles.stepDescription}>
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
                  Ether Choose the template or choose custom for desired output
                  &{" "}
                  <Text style={styles.stepHighlight}>let AI do the magic</Text>
                </Text>
              </View>
              <View style={styles.stepImageContainer}>
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46",
                  }}
                  style={styles.stepImage}
                  resizeMode="cover"
                />
                <View style={styles.templateBadge}>
                  <Text style={styles.templateBadgeText}>T</Text>
                  <Text style={styles.templateBadgeLabel}>
                    Let the girl sit down
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Step 3 */}
          <View style={styles.stepContainer}>
            <View style={styles.stepContent}>
              <View style={styles.stepImageContainer}>
                <Image
                  source={{
                    uri: "https://images.unsplash.com/photo-1518568814500-bf0f8d125f46",
                  }}
                  style={styles.stepImage}
                  resizeMode="cover"
                />
                <View style={styles.downloadBadge}>
                  <Text style={styles.downloadIcon}>⬇</Text>
                </View>
              </View>
              <View style={styles.stepTextContainer}>
                <Text style={styles.stepNumber}>Step 3</Text>
                <GradientText style={styles.stepTitle}>
                  Export and Download
                </GradientText>
                <Text style={styles.stepDescription}>
                  Preview and download your animated videos instantly.
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Gallery Preview */}
        <View style={styles.gallerySection}>
          <GradientText style={styles.viewMoreText}>View More</GradientText>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    fontSize: 18,
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
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  logoTextBottom: {
    fontSize: 12,
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
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  bellButton: {
    padding: 4,
  },
  bellIcon: {
    fontSize: 20,
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
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 19,
    marginBottom: 10,
  },
  heroDescription: {
    fontSize: 20,
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 17.1,
    elevation: 5,
    marginBottom: 16,
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
    fontSize: 42,
  },
  uploadText: {
    fontSize: 18,
    fontWeight: "400",
    color: "#000",
    marginBottom: 8,
  },
  uploadSubtext: {
    fontSize: 12.781,
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
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },
  orTryText: {
    fontSize: 20,
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
    fontSize: 15,
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
    fontSize: 22,
    fontWeight: "700",
    color: "#000",
    textAlign: "center",
    marginBottom: 30,
  },
  stepContainer: {
    marginBottom: 30,
  },
  stepNumber: {
    fontSize: 24.177,
    fontWeight: "700",
    color: "#000",
    textDecorationLine: "underline",
    marginBottom: 12,
  },
  stepContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    paddingRight: 16,
  },
  stepImageContainer: {
    width: "50%",
    aspectRatio: 79.3 / 118.72,
    borderRadius: 2.185,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 10.924, height: 10.924 },
    shadowOpacity: 0.25,
    shadowRadius: 16.277,
    elevation: 5,
  },
  stepImage: {
    width: "100%",
    height: "100%",
  },
  stepTextContainer: {
    width: "50%",
    flexShrink: 0,
  },
  stepTitle: {
    fontSize: 19.781,
    fontWeight: "700",
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 15,
    fontWeight: "400",
    color: "#000",
    lineHeight: 22,
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
  },
  templateBadgeText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#000",
    borderWidth: 0.5,
    borderColor: "#000",
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  templateBadgeLabel: {
    fontSize: 11,
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
    fontSize: 10.998,
  },
  gallerySection: {
    width: CONTENT_WIDTH,
    marginHorizontal: 16,
    marginBottom: 120,
    alignItems: "center",
  },
  viewMoreText: {
    fontSize: 18,
    fontWeight: "600",
  },
});
