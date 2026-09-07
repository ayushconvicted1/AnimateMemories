import messaging from "@react-native-firebase/messaging";
import "expo-router/entry";

// Register background message handler for FCM
// This handler runs as a headless JS task when the app is in the background or killed
messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  console.log("[FCM] Background message received:", remoteMessage?.messageId);
  // Custom background payload processing can be performed here
});
