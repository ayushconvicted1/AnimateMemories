import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
  PermissionsAndroid,
  Linking,
  Alert,
  AppState,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { GradientText } from "@/components/ui/GradientText";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import { getFontFamily } from "@/constants/Fonts";

const STORAGE_KEY = "@user_notification_preferences";

interface NotificationPrefs {
  pushNotifications: boolean;
  emailNotifications: boolean;
  marketingEmails: boolean;
  videoReady: boolean;
  restorationComplete: boolean;
  creditUpdates: boolean;
  weeklyDigest: boolean;
}

const DEFAULT_PREFS: NotificationPrefs = {
  pushNotifications: true,
  emailNotifications: true,
  marketingEmails: false,
  videoReady: true,
  restorationComplete: true,
  creditUpdates: true,
  weeklyDigest: false,
};

export default function NotificationsScreen() {
  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS);
  const [hasSystemPermission, setHasSystemPermission] = useState<boolean | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Check system notification permission
  const checkSystemPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === "android") {
      if (Platform.Version >= 33) {
        try {
          const granted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
          );
          setHasSystemPermission(granted);
          return granted;
        } catch {
          setHasSystemPermission(false);
          return false;
        }
      }
      setHasSystemPermission(true);
      return true;
    }
    // iOS / Web fallback
    setHasSystemPermission(true);
    return true;
  }, []);

  // Request system notification permission
  const requestSystemPermission = async (): Promise<boolean> => {
    if (Platform.OS === "android" && Platform.Version >= 33) {
      try {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: "Enable Notifications",
            message: "Get notified when your AI video animations and photo restorations are ready.",
            buttonPositive: "Allow",
            buttonNegative: "Don't Allow",
          }
        );
        const isGranted = result === PermissionsAndroid.RESULTS.GRANTED;
        setHasSystemPermission(isGranted);
        return isGranted;
      } catch (err) {
        console.error("Failed to request notification permission:", err);
        return false;
      }
    }
    return true;
  };

  // Load preferences from AsyncStorage and verify OS permissions
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setPrefs((prev) => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        console.error("Failed to load notification preferences:", e);
      }
      await checkSystemPermission();
    };

    loadPreferences();
  }, [checkSystemPermission]);

  // Re-check system permission when app resumes from background (e.g. user toggled in OS Settings)
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        checkSystemPermission();
      }
    });
    return () => sub.remove();
  }, [checkSystemPermission]);

  // Toggle push notifications with OS permission verification
  const handlePushToggle = async (newValue: boolean) => {
    if (newValue) {
      const currentGranted = await checkSystemPermission();
      if (!currentGranted) {
        const granted = await requestSystemPermission();
        if (!granted) {
          Alert.alert(
            "Notifications Disabled",
            "Notifications are disabled in your device settings. Would you like to open Settings to enable them?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Open Settings",
                onPress: () => Linking.openSettings(),
              },
            ]
          );
          setPrefs((p) => ({ ...p, pushNotifications: false }));
          return;
        }
      }
    }

    setPrefs((p) => ({ ...p, pushNotifications: newValue }));
  };

  // Save preferences
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
      Alert.alert("Success", "Notification preferences saved successfully!");
    } catch (e) {
      console.error("Failed to save preferences:", e);
      Alert.alert("Error", "Failed to save preferences. Please try again.");
    } finally {
      setIsSaving(false);
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
            activeOpacity={0.7}
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
          {/* System Permission Notice Banner (if blocked at OS level) */}
          {hasSystemPermission === false && (
            <View style={styles.warningBanner}>
              <View style={{ flex: 1 }}>
                <Text style={styles.warningTitle}>Device Notifications Blocked</Text>
                <Text style={styles.warningText}>
                  Your device has notifications disabled for AnimateMemories.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => Linking.openSettings()}
                style={styles.enableButton}
                activeOpacity={0.8}
              >
                <Text style={styles.enableButtonText}>Enable</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Delivery Channels */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Delivery Channels</Text>

            <View style={styles.notificationItem}>
              <View style={styles.notificationItemLeft}>
                <Text style={styles.notificationLabel}>Push Notifications</Text>
                <Text style={styles.notificationDescription}>
                  Receive real-time alerts on your device
                </Text>
              </View>
              <Switch
                value={prefs.pushNotifications}
                onValueChange={handlePushToggle}
                trackColor={{ false: "#E2E8F0", true: "#D229FF" }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.divider} />

            <View style={styles.notificationItem}>
              <View style={styles.notificationItemLeft}>
                <Text style={styles.notificationLabel}>Email Notifications</Text>
                <Text style={styles.notificationDescription}>
                  Receive email updates about your account
                </Text>
              </View>
              <Switch
                value={prefs.emailNotifications}
                onValueChange={(v) => setPrefs((p) => ({ ...p, emailNotifications: v }))}
                trackColor={{ false: "#E2E8F0", true: "#D229FF" }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.divider} />

            <View style={styles.notificationItem}>
              <View style={styles.notificationItemLeft}>
                <Text style={styles.notificationLabel}>Marketing & Offers</Text>
                <Text style={styles.notificationDescription}>
                  Receive exclusive promo codes and credit bonuses
                </Text>
              </View>
              <Switch
                value={prefs.marketingEmails}
                onValueChange={(v) => setPrefs((p) => ({ ...p, marketingEmails: v }))}
                trackColor={{ false: "#E2E8F0", true: "#D229FF" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Notification Triggers */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity Alerts</Text>

            <View style={styles.notificationItem}>
              <View style={styles.notificationItemLeft}>
                <Text style={styles.notificationLabel}>Video Animation Ready</Text>
                <Text style={styles.notificationDescription}>
                  Alert when AI animation finishes rendering
                </Text>
              </View>
              <Switch
                value={prefs.videoReady}
                onValueChange={(v) => setPrefs((p) => ({ ...p, videoReady: v }))}
                trackColor={{ false: "#E2E8F0", true: "#D229FF" }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.divider} />

            <View style={styles.notificationItem}>
              <View style={styles.notificationItemLeft}>
                <Text style={styles.notificationLabel}>Photo Restoration Complete</Text>
                <Text style={styles.notificationDescription}>
                  Alert when photo restoration & enhancement finishes
                </Text>
              </View>
              <Switch
                value={prefs.restorationComplete}
                onValueChange={(v) => setPrefs((p) => ({ ...p, restorationComplete: v }))}
                trackColor={{ false: "#E2E8F0", true: "#D229FF" }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.divider} />

            <View style={styles.notificationItem}>
              <View style={styles.notificationItemLeft}>
                <Text style={styles.notificationLabel}>Credit & Plan Updates</Text>
                <Text style={styles.notificationDescription}>
                  Alert when credits are recharged or nearing expiration
                </Text>
              </View>
              <Switch
                value={prefs.creditUpdates}
                onValueChange={(v) => setPrefs((p) => ({ ...p, creditUpdates: v }))}
                trackColor={{ false: "#E2E8F0", true: "#D229FF" }}
                thumbColor="#FFFFFF"
              />
            </View>
            <View style={styles.divider} />

            <View style={styles.notificationItem}>
              <View style={styles.notificationItemLeft}>
                <Text style={styles.notificationLabel}>Weekly Highlights</Text>
                <Text style={styles.notificationDescription}>
                  Weekly roundup of popular community animation presets
                </Text>
              </View>
              <Switch
                value={prefs.weeklyDigest}
                onValueChange={(v) => setPrefs((p) => ({ ...p, weeklyDigest: v }))}
                trackColor={{ false: "#E2E8F0", true: "#D229FF" }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Save Button */}
          <View style={styles.saveSection}>
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={["#28D4FA", "#D229FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveButtonGradient}
              >
                <Text style={styles.saveButtonText}>
                  {isSaving ? "Saving..." : "Save Preferences"}
                </Text>
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
    backgroundColor: "#FFFFFF",
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
    fontSize: 16,
    color: "#0F172A",
    fontFamily: getFontFamily("600"),
  },
  title: {
    fontSize: 24,
    fontFamily: getFontFamily("700"),
  },
  placeholder: {
    width: 60,
  },
  scrollView: {
    flex: 1,
  },
  warningBanner: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  warningTitle: {
    fontSize: 14,
    color: "#991B1B",
    fontFamily: getFontFamily("700"),
    marginBottom: 2,
  },
  warningText: {
    fontSize: 12,
    color: "#B91C1C",
    fontFamily: getFontFamily("500"),
    lineHeight: 16,
  },
  enableButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#DC2626",
  },
  enableButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: getFontFamily("600"),
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: "#0F172A",
    marginBottom: 12,
    fontFamily: getFontFamily("700"),
  },
  notificationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  notificationItemLeft: {
    flex: 1,
    marginRight: 16,
  },
  notificationLabel: {
    fontSize: 16,
    color: "#0F172A",
    marginBottom: 4,
    fontFamily: getFontFamily("600"),
  },
  notificationDescription: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
    fontFamily: getFontFamily("400"),
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  saveSection: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    marginTop: 10,
  },
  saveButton: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#D229FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonGradient: {
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontFamily: getFontFamily("700"),
  },
});
