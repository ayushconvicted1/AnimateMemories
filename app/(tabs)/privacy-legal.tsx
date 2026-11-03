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
import { getFontFamily } from "@/constants/Fonts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTENT_WIDTH = SCREEN_WIDTH - 32;

export default function PrivacyLegalScreen() {
  const handleContactUs = async () => {
    const email = "support@animatememories.com";
    const subject = "Privacy/Legal Inquiry";
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

    try {
      await Linking.openURL(mailtoUrl);
    } catch (error) {
      console.error("Error opening email:", error);
      Alert.alert(
        "Error",
        "Unable to open email client. Please email us at support@animatememories.com"
      );
    }
  };

  const handleReportContent = async () => {
    const email = "support@animatememories.com";
    const subject = "[Report] Objectionable Content Notice - Guideline 1.1";
    const body =
      "Please describe the objectionable content, template, or issue you wish to report:\n\n- Template/Prompt:\n- Date & Time:\n- Details:\n\nOur safety team investigates all reports within 24 hours.";
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    try {
      await Linking.openURL(mailtoUrl);
    } catch (error) {
      console.error("Error opening email:", error);
      Alert.alert(
        "Report Objectionable Content",
        "Please email our safety moderation team directly at support@animatememories.com with subject '[Report] Objectionable Content Notice'."
      );
    }
  };

  const handleOpenPrivacyPolicy = async () => {
    try {
      await Linking.openURL("https://www.animatememories.com/privacy-policy");
    } catch (e) {
      Alert.alert("Link", "Visit https://www.animatememories.com/privacy-policy in your browser.");
    }
  };

  const handleOpenTermsOfService = async () => {
    try {
      await Linking.openURL("https://www.animatememories.com/terms-of-service");
    } catch (e) {
      Alert.alert("Link", "Visit https://www.animatememories.com/terms-of-service in your browser.");
    }
  };

  return (
    <ScreenWrapper addBottomPadding={true}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/you")}
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
          {/* Quick Action Links */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.reportActionButton}
              onPress={handleReportContent}
            >
              <Text style={styles.reportActionText}>
                ⚠️ Report Objectionable Content
              </Text>
            </TouchableOpacity>

            <View style={styles.webLinksRow}>
              <TouchableOpacity
                style={styles.webLinkButton}
                onPress={handleOpenPrivacyPolicy}
              >
                <Text style={styles.webLinkText}>Web Privacy Policy ↗</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.webLinkButton}
                onPress={handleOpenTermsOfService}
              >
                <Text style={styles.webLinkText}>Terms of Service ↗</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Safety & Content Moderation Policy */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Content Safety & Moderation (Guideline 1.1)
            </Text>

            <View style={styles.contentItem}>
              <Text style={styles.contentSubtitle}>
                Zero-Tolerance for Objectionable Content
              </Text>
              <Text style={styles.contentText}>
                Animate Memories maintains a strict zero-tolerance policy against
                objectionable, intimate, or harmful content. Users are strictly
                prohibited from generating, uploading, or requesting content that
                depicts non-consensual physical intimacy, intimate contact (such
                as kissing, hugging, or romantic/sexual embraces), sexually
                suggestive material, nudity, hate speech, violence, or harassment.
              </Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.contentItem}>
              <Text style={styles.contentSubtitle}>
                Automated AI Pre-Generation Moderation
              </Text>
              <Text style={styles.contentText}>
                All photo uploads and user-crafted prompt texts are automatically
                scanned by real-time safety moderation filters prior to processing.
                Any prompt or request containing intimate physical contact or
                objectionable terms is rejected immediately.
              </Text>
            </View>
            <View style={styles.divider} />

            <View style={styles.contentItem}>
              <Text style={styles.contentSubtitle}>
                Reporting & 24-Hour Moderation Action
              </Text>
              <Text style={styles.contentText}>
                Users can report any objectionable content directly by tapping
                the &quot;Report Objectionable Content&quot; button above or emailing
                support@animatememories.com. Our safety team investigates every
                report within 24 hours. Offending content will be deleted
                immediately, and the responsible user account will be permanently
                terminated without refund.
              </Text>
            </View>
          </View>

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
                refunded within 7 days of purchase{"\n"}• Credits used for
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
            <Text style={styles.sectionTitle}>Contact & Safety Support</Text>
            <View style={styles.contactCard}>
              <Text style={styles.contactText}>
                For questions about privacy, content safety, report investigations,
                or data protection, please contact our team:
              </Text>
              <TouchableOpacity onPress={handleContactUs}>
                <Text style={styles.contactEmail}>
                  support@animatememories.com
                </Text>
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
    fontSize: 17,
    color: "#000",
    fontFamily: getFontFamily("600"),
  },
  title: {
    fontSize: 26,
    fontFamily: getFontFamily("600"),
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  actionButtonsContainer: {
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 10,
  },
  reportActionButton: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  reportActionText: {
    color: "#DC2626",
    fontSize: 15,
    fontFamily: getFontFamily("600"),
  },
  webLinksRow: {
    flexDirection: "row",
    gap: 10,
  },
  webLinkButton: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  webLinkText: {
    color: "#475569",
    fontSize: 13,
    fontFamily: getFontFamily("500"),
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 19,
    color: "#000",
    marginBottom: 16,
    fontFamily: getFontFamily("600"),
  },
  contentItem: {
    paddingVertical: 12,
  },
  contentSubtitle: {
    fontSize: 17,
    color: "#000",
    marginBottom: 8,
    fontFamily: getFontFamily("600"),
  },
  contentText: {
    fontSize: 15,
    color: "#64748b",
    lineHeight: 22,
    fontFamily: getFontFamily("400"),
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
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 22,
    fontFamily: getFontFamily("400"),
  },
  contactEmail: {
    fontSize: 18,
    color: "#28D4FA",
    textDecorationLine: "underline",
    fontFamily: getFontFamily("600"),
  },
});
