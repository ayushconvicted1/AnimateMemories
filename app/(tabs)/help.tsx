import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Linking,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { GradientText } from "@/components/ui/GradientText";
import ScreenWrapper from "@/components/ui/ScreenWrapper";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTENT_WIDTH = SCREEN_WIDTH - 32;

export default function HelpScreen() {
  const handleContactUs = async () => {
    const email = "support@animatememories.com";
    const subject = "Support Request";
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert(
          "Error",
          "Unable to open email client. Please email us at support@animatememories.com"
        );
      }
    } catch (error) {
      console.error("Error opening email:", error);
      Alert.alert(
        "Error",
        "Unable to open email client. Please email us at support@animatememories.com"
      );
    }
  };

  return (
    <ScreenWrapper addBottomPadding={true}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <GradientText style={styles.title}>Help & Support</GradientText>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Getting Started */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Getting Started</Text>

            <View style={styles.helpItem}>
              <Text style={styles.helpItemTitle}>How to Animate Photos</Text>
              <Text style={styles.helpItemText}>
                1. Upload your photo from the Home or Create tab{"\n"}
                2. Choose an animation template or create a custom animation
                {"\n"}
                3. Enter a description of how you want your photo to move
                (optional){"\n"}
                4. Click Generate and wait for your animated video{"\n"}
                5. Download and share your creation!
              </Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.helpItem}>
              <Text style={styles.helpItemTitle}>How to Restore Photos</Text>
              <Text style={styles.helpItemText}>
                1. Upload your old or damaged photo{"\n"}
                2. Select the "Restore Photo" tool in the Create tab{"\n"}
                3. Click Generate to restore your image{"\n"}
                4. Download the restored photo
              </Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.helpItem}>
              <Text style={styles.helpItemTitle}>Supported File Formats</Text>
              <Text style={styles.helpItemText}>
                • JPEG (.jpg, .jpeg){"\n"}• PNG (.png){"\n"}• Maximum file size:
                10MB{"\n"}• Minimum resolution: 300x300px
              </Text>
            </View>
          </View>

          {/* Credits & Pricing */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Credits & Pricing</Text>

            <View style={styles.helpItem}>
              <Text style={styles.helpItemTitle}>Credit Costs</Text>
              <Text style={styles.helpItemText}>
                • Photo restoration: 1 credit{"\n"}• Photo animation: 3 credits
                {"\n"}• Credits never expire{"\n"}• Unused credits remain in
                your account
              </Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.helpItem}>
              <Text style={styles.helpItemTitle}>Purchasing Credits</Text>
              <Text style={styles.helpItemText}>
                1. Go to the Credits tab{"\n"}
                2. Choose a credit pack that suits your needs{"\n"}
                3. Complete the secure payment{"\n"}
                4. Credits are added instantly to your account
              </Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.helpItem}>
              <Text style={styles.helpItemTitle}>Refund Policy</Text>
              <Text style={styles.helpItemText}>
                Unused credits can be refunded within 30 days of purchase.
                Contact support for assistance with refunds.
              </Text>
            </View>
          </View>

          {/* Troubleshooting */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Troubleshooting</Text>

            <View style={styles.helpItem}>
              <Text style={styles.helpItemTitle}>Video Not Generating</Text>
              <Text style={styles.helpItemText}>
                • Check your internet connection{"\n"}• Ensure you have
                sufficient credits{"\n"}• Try uploading a different image{"\n"}•
                Wait a few minutes and try again
              </Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.helpItem}>
              <Text style={styles.helpItemTitle}>Poor Quality Results</Text>
              <Text style={styles.helpItemText}>
                • Use high-resolution images (minimum 300x300px){"\n"}• Ensure
                good lighting in the original photo{"\n"}• Avoid heavily damaged
                or very low-quality images{"\n"}• Try the restoration tool
                first, then animate
              </Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.helpItem}>
              <Text style={styles.helpItemTitle}>Upload Issues</Text>
              <Text style={styles.helpItemText}>
                • Check file size (max 10MB){"\n"}• Verify file format (JPEG or
                PNG){"\n"}• Ensure stable internet connection{"\n"}• Try a
                different image
              </Text>
            </View>
          </View>

          {/* Tips & Best Practices */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tips & Best Practices</Text>

            <View style={styles.helpItem}>
              <Text style={styles.helpItemTitle}>For Best Results</Text>
              <Text style={styles.helpItemText}>
                • Use clear, well-lit photos{"\n"}• Ensure faces are clearly
                visible{"\n"}• For animation, describe specific movements{"\n"}•
                Restore damaged photos before animating
              </Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.helpItem}>
              <Text style={styles.helpItemTitle}>Animation Tips</Text>
              <Text style={styles.helpItemText}>
                • Be specific in your animation description{"\n"}• Use templates
                for common animations{"\n"}• Try the "Surprise Me" feature for
                inspiration{"\n"}• Experiment with different prompts
              </Text>
            </View>
          </View>

          {/* Contact Support */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Still Need Help?</Text>
            <View style={styles.contactCard}>
              <Text style={styles.contactText}>
                Our support team is here to help! Contact us via email and we'll
                get back to you within 24 hours.
              </Text>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={handleContactUs}
              >
                <LinearGradient
                  colors={["#28D4FA", "#D229FF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.contactButtonGradient}
                >
                  <Text style={styles.contactButtonText}>Contact Support</Text>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={styles.contactEmail}>
                support@animatememories.com
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#000",
    marginBottom: 16,
  },
  helpItem: {
    paddingVertical: 16,
  },
  helpItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  helpItemText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#979797",
    lineHeight: 22,
  },
  divider: {
    height: 0.75,
    backgroundColor: "#e9ecef",
  },
  contactCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  contactText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#979797",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 22,
  },
  contactButton: {
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
    width: "100%",
  },
  contactButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  contactButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  contactEmail: {
    fontSize: 14,
    fontWeight: "500",
    color: "#28D4FA",
  },
});
