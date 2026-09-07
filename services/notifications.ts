import { Platform, PermissionsAndroid, Alert } from "react-native";
import messaging, { FirebaseMessagingTypes } from "@react-native-firebase/messaging";
import { router } from "expo-router";

export interface NotificationPayload {
  title?: string;
  body?: string;
  data?: Record<string, string>;
}

/**
 * Request notification permissions from the OS (iOS & Android 13+)
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === "android") {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: "Enable Notifications",
            message: "Stay updated when your AI video animations and photo restorations are ready.",
            buttonPositive: "Allow",
            buttonNegative: "Don't Allow",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true; // Android < 33 has permission granted by default
    }

    if (Platform.OS === "ios") {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;
      return enabled;
    }

    return false;
  } catch (error) {
    console.warn("[Notifications] Error requesting permission:", error);
    return false;
  }
}

/**
 * Check current notification permission status without prompting
 */
export async function checkNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === "android") {
      if (Platform.Version >= 33) {
        return await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
      }
      return true;
    }

    if (Platform.OS === "ios") {
      const authStatus = await messaging().hasPermission();
      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    }

    return false;
  } catch (error) {
    console.warn("[Notifications] Error checking permission:", error);
    return false;
  }
}

/**
 * Retrieve the FCM device registration token
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    if (Platform.OS === "ios") {
      // Ensure APNs token is registered with Firebase first
      await messaging().registerDeviceForRemoteMessages();
    }

    const token = await messaging().getToken();
    console.log("[FCM] Device Push Token:", token);
    return token;
  } catch (error) {
    console.warn("[Notifications] Error retrieving FCM token:", error);
    return null;
  }
}

/**
 * Register FCM device token with the backend database
 */
export async function registerTokenWithBackend(
  token: string,
  userEmail: string
): Promise<boolean> {
  try {
    const API_BASE_URL = "https://www.animatememories.com";
    const res = await fetch(`${API_BASE_URL}/api/notifications/save-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userEmail,
        fcmToken: token,
        platform: Platform.OS,
      }),
    });
    const data = await res.json();
    console.log("[FCM] Registered token with backend:", data);
    return res.ok;
  } catch (err) {
    console.warn("[FCM] Failed to register token with backend:", err);
    return false;
  }
}

/**
 * Handle notification tap and route to appropriate screen
 */
export function handleNotificationNavigation(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage | null
) {
  if (!remoteMessage) return;

  const data = remoteMessage.data;
  const targetRoute = data?.route || data?.screen || data?.url;

  console.log("[FCM] Handling notification tap navigation:", {
    title: remoteMessage.notification?.title,
    targetRoute,
  });

  if (targetRoute && typeof targetRoute === "string") {
    try {
      router.push(targetRoute as any);
    } catch (err) {
      console.warn("[FCM] Navigation error for route:", targetRoute, err);
      router.push("/(tabs)/notifications");
    }
  } else {
    // Default fallback to notifications center
    router.push("/(tabs)/notifications");
  }
}

/**
 * Initialize all Firebase notification listeners:
 * 1. Foreground listener (displays in-app banner/alert)
 * 2. Background tap listener (routes when user taps notification tray)
 * 3. Quit-state tap listener (routes when app opened from killed state)
 * 4. Token refresh listener
 *
 * @returns Cleanup function to unsubscribe listeners
 */
export function setupNotificationListeners(options?: {
  onForegroundNotification?: (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => void;
  onTokenRefresh?: (token: string) => void;
}): () => void {
  const unsubscribers: (() => void)[] = [];

  try {
    // 1. Foreground message handler
    const unsubscribeOnMessage = messaging().onMessage(async (remoteMessage) => {
      console.log("[FCM] Foreground notification received:", remoteMessage);

      if (options?.onForegroundNotification) {
        options.onForegroundNotification(remoteMessage);
        return;
      }

      // Default in-app presentation for foreground notifications
      const title = remoteMessage.notification?.title || "New Notification";
      const body = remoteMessage.notification?.body || "";

      Alert.alert(title, body, [
        { text: "Dismiss", style: "cancel" },
        {
          text: "View",
          onPress: () => handleNotificationNavigation(remoteMessage),
        },
      ]);
    });
    unsubscribers.push(unsubscribeOnMessage);

    // 2. Notification opened from Background state
    const unsubscribeOnNotificationOpenedApp = messaging().onNotificationOpenedApp(
      (remoteMessage) => {
        console.log("[FCM] Notification opened from background:", remoteMessage);
        handleNotificationNavigation(remoteMessage);
      }
    );
    unsubscribers.push(unsubscribeOnNotificationOpenedApp);

    // 3. Notification opened from Quit / Cold state
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log("[FCM] App opened from quit state via notification:", remoteMessage);
          // Allow short delay for router hydration
          setTimeout(() => {
            handleNotificationNavigation(remoteMessage);
          }, 600);
        }
      })
      .catch((err) => {
        console.warn("[FCM] Error checking initial notification:", err);
      });

    // 4. Token refresh listener
    const unsubscribeOnTokenRefresh = messaging().onTokenRefresh((token) => {
      console.log("[FCM] Token refreshed:", token);
      if (options?.onTokenRefresh) {
        options.onTokenRefresh(token);
      }
    });
    unsubscribers.push(unsubscribeOnTokenRefresh);
  } catch (error) {
    console.warn("[Notifications] Failed to setup notification listeners:", error);
  }

  // Return master cleanup function
  return () => {
    unsubscribers.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch {}
    });
  };
}
