import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { router } from "expo-router";
import { GradientText } from "@/components/ui/GradientText";
import ScreenWrapper from "@/components/ui/ScreenWrapper";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTENT_WIDTH = SCREEN_WIDTH - 32;

export default function NotificationsScreen() {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [videoReady, setVideoReady] = useState(true);
  const [restorationComplete, setRestorationComplete] = useState(true);
  const [creditUpdates, setCreditUpdates] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

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
          <GradientText style={styles.title}>Notifications</GradientText>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          {/* Notification Preferences */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Preferences</Text>

            <View style={styles.notificationItem}>
              <View style={styles.notificationItemLeft}>
                <Text style={styles.notificationLabel}>Push Notifications</Text>
                <Text style={styles.notificationDescription}>
                  Receive push notifications on your device
                </Text>
              </View>
              <Switch
                value={pushNotifications}
                onValueChange={setPushNotifications}
                trackColor={{ false: "#e0e0e0", true: "#D229FF" }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.divider} />

            <View style={styles.notificationItem}>
              <View style={styles.notificationItemLeft}>
                <Text style={styles.notificationLabel}>
                  Email Notifications
                </Text>
                <Text style={styles.notificationDescription}>
                  Receive email updates about your account
                </Text>
              </View>
              <Switch
                value={emailNotifications}
                onValueChange={setEmailNotifications}
                trackColor={{ false: "#e0e0e0", true: "#D229FF" }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.divider} />

            <View style={styles.notificationItem}>
              <View style={styles.notificationItemLeft}>
                <Text style={styles.notificationLabel}>Marketing Emails</Text>
                <Text style={styles.notificationDescription}>
                  Receive promotional emails and updates
                </Text>
              </View>
              <Switch
                value={marketingEmails}
                onValueChange={setMarketingEmails}
                trackColor={{ false: "#e0e0e0", true: "#D229FF" }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Notification Types */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Types</Text>

            <View style={styles.notificationItem}>
              <View style={styles.notificationItemLeft}>
                <Text style={styles.notificationLabel}>Video Ready</Text>
                <Text style={styles.notificationDescription}>
                  Get notified when your animated video is ready
                </Text>
              </View>
              <Switch
                value={videoReady}
                onValueChange={setVideoReady}
                trackColor={{ false: "#e0e0e0", true: "#D229FF" }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.divider} />

            <View style={styles.notificationItem}>
              <View style={styles.notificationItemLeft}>
                <Text style={styles.notificationLabel}>
                  Restoration Complete
                </Text>
                <Text style={styles.notificationDescription}>
                  Get notified when photo restoration is complete
                </Text>
              </View>
              <Switch
                value={restorationComplete}
                onValueChange={setRestorationComplete}
                trackColor={{ false: "#e0e0e0", true: "#D229FF" }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.divider} />

            <View style={styles.notificationItem}>
              <View style={styles.notificationItemLeft}>
                <Text style={styles.notificationLabel}>Credit Updates</Text>
                <Text style={styles.notificationDescription}>
                  Get notified about credit purchases and usage
                </Text>
              </View>
              <Switch
                value={creditUpdates}
                onValueChange={setCreditUpdates}
                trackColor={{ false: "#e0e0e0", true: "#D229FF" }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.divider} />

            <View style={styles.notificationItem}>
              <View style={styles.notificationItemLeft}>
                <Text style={styles.notificationLabel}>Weekly Digest</Text>
                <Text style={styles.notificationDescription}>
                  Receive a weekly summary of your activity
                </Text>
              </View>
              <Switch
                value={weeklyDigest}
                onValueChange={setWeeklyDigest}
                trackColor={{ false: "#e0e0e0", true: "#D229FF" }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Save Button */}
          <View style={styles.saveSection}>
            <TouchableOpacity style={styles.saveButton}>
              <LinearGradient
                colors={["#28D4FA", "#D229FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButtonGradient}
              >
                <Text style={styles.saveButtonText}>Save Preferences</Text>
              </LinearGradient>
            </TouchableOpacity>
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
  notificationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  notificationItemLeft: {
    flex: 1,
    marginRight: 16,
  },
  notificationLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 12,
    fontWeight: "400",
    color: "#979797",
    lineHeight: 20,
  },
  divider: {
    height: 0.75,
    backgroundColor: "#e9ecef",
  },
  saveSection: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    marginTop: 20,
  },
  saveButton: {
    borderRadius: 8,
    overflow: "hidden",
  },
  saveButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
});
