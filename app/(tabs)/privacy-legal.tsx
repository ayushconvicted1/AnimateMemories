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
import { router } from "expo-router";
import { GradientText } from "@/components/ui/GradientText";
import ScreenWrapper from "@/components/ui/ScreenWrapper";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTENT_WIDTH = SCREEN_WIDTH - 32;

export default function PrivacyLegalScreen() {
  const handleContactUs = async () => {
    const email = "support@animatememories.com";
    const subject = "Privacy/Legal Inquiry";
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
          <GradientText style={styles.title}>Privacy & Legal</GradientText>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Privacy Policy */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Privacy Policy</Text>

            <View style={styles.contentItem}>
              <Text style={styles.contentText}>
                We respect your privacy and are committed to protecting your
                personal data. This policy explains how we collect, use, and
                safeguard your information when you use Animate Memories.
              </Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.contentItem}>
              <Text style={styles.contentSubtitle}>Data Collection</Text>
              <Text style={styles.contentText}>
                We collect the following information:{"\n\n"}• Account
                information (name, email address){"\n"}• Photos and videos you
                upload for processing{"\n"}• Usage data to improve our services
                {"\n"}• Device information for technical support
              </Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.contentItem}>
              <Text style={styles.contentSubtitle}>How We Use Your Data</Text>
              <Text style={styles.contentText}>
                • Process your photos and videos{"\n"}• Provide customer support
                {"\n"}• Improve our AI models and services{"\n"}• Send important
                account updates{"\n"}• Analyze usage patterns to enhance user
                experience
              </Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.contentItem}>
              <Text style={styles.contentSubtitle}>Data Security</Text>
              <Text style={styles.contentText}>
                Your photos and videos are processed securely using
                industry-standard encryption. We do not share your personal data
                or content with third parties without your explicit consent,
                except as required by law.
              </Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.contentItem}>
              <Text style={styles.contentSubtitle}>Data Retention</Text>
              <Text style={styles.contentText}>
                We retain your processed content for a limited time to allow you
                to download your results. You can request deletion of your data
                at any time by contacting support.
              </Text>
            </View>
          </View>

          {/* Terms of Service */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terms of Service</Text>

            <View style={styles.contentItem}>
              <Text style={styles.contentText}>
                By using Animate Memories, you agree to the following terms and
                conditions:
              </Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.contentItem}>
              <Text style={styles.contentSubtitle}>Acceptable Use</Text>
              <Text style={styles.contentText}>
                • Use the service for lawful purposes only{"\n"}• Do not upload
                offensive, illegal, or inappropriate content{"\n"}• Respect
                intellectual property rights{"\n"}• Do not attempt to reverse
                engineer or hack the service
              </Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.contentItem}>
              <Text style={styles.contentSubtitle}>Credits & Refunds</Text>
              <Text style={styles.contentText}>
                • Credits are non-transferable{"\n"}• Unused credits can be
                refunded within 30 days of purchase{"\n"}• Credits used for
                processing are non-refundable{"\n"}• Credits do not expire
              </Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.contentItem}>
              <Text style={styles.contentSubtitle}>Service Availability</Text>
              <Text style={styles.contentText}>
                We strive to maintain service availability but do not guarantee
                uninterrupted access. We reserve the right to modify or
                discontinue the service with reasonable notice.
              </Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.contentItem}>
              <Text style={styles.contentSubtitle}>Intellectual Property</Text>
              <Text style={styles.contentText}>
                You retain ownership of your uploaded content. By using our
                service, you grant us a license to process your content solely
                for providing the service. The AI-generated results are yours to
                use as you wish.
              </Text>
            </View>
          </View>

          {/* Cookie Policy */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cookie Policy</Text>

            <View style={styles.contentItem}>
              <Text style={styles.contentText}>
                We use cookies and similar technologies to enhance your
                experience, analyze usage patterns, and provide personalized
                content.
              </Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.contentItem}>
              <Text style={styles.contentSubtitle}>Types of Cookies</Text>
              <Text style={styles.contentText}>
                • Essential cookies: Required for the service to function{"\n"}•
                Analytics cookies: Help us understand how you use the service
                {"\n"}• Preference cookies: Remember your settings and
                preferences
              </Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.contentItem}>
              <Text style={styles.contentSubtitle}>Managing Cookies</Text>
              <Text style={styles.contentText}>
                You can manage cookie preferences in your device or browser
                settings. Note that disabling certain cookies may affect service
                functionality.
              </Text>
            </View>
          </View>

          {/* Contact */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact Us</Text>
            <View style={styles.contactCard}>
              <Text style={styles.contactText}>
                For questions about privacy, legal matters, or data protection,
                please contact us:
              </Text>
              <Text style={styles.contactEmail}>
                support@animatememories.com
              </Text>
              <TouchableOpacity
                style={styles.contactButton}
                onPress={handleContactUs}
              >
                <Text style={styles.contactButtonText}>Send Email</Text>
              </TouchableOpacity>
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
  contentItem: {
    paddingVertical: 12,
  },
  contentSubtitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  contentText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#979797",
    lineHeight: 22,
  },
  divider: {
    height: 0.75,
    backgroundColor: "#e9ecef",
    marginVertical: 8,
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
    marginBottom: 16,
    lineHeight: 22,
  },
  contactEmail: {
    fontSize: 14,
    fontWeight: "600",
    color: "#28D4FA",
    marginBottom: 16,
  },
  contactButton: {
    backgroundColor: "#28D4FA",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minWidth: 120,
    alignItems: "center",
  },
  contactButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
