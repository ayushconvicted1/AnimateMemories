import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import { getFontFamily } from "@/constants/Fonts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PendingAction } from "@/contexts/AuthGateContext";

const PENDING_ACTION_STORAGE_KEY = "@auth_pending_action";

export default function AuthCallback() {
  const { isSignedIn, isLoaded } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!isLoaded || hasRedirected) return;

    if (isSignedIn) {
      setHasRedirected(true);

      (async () => {
        try {
          const stored = await AsyncStorage.getItem(PENDING_ACTION_STORAGE_KEY);
          if (stored) {
            await AsyncStorage.removeItem(PENDING_ACTION_STORAGE_KEY);
            const action = JSON.parse(stored) as PendingAction;

            if (action?.type === "template") {
              router.replace({
                pathname: "/(tabs)/animate",
                params: { templateId: action.templateId },
              });
              return;
            } else if (action?.type === "create") {
              router.replace("/(tabs)/animate");
              return;
            } else if (action?.type === "upload") {
              if (action.imageUri) {
                router.replace({
                  pathname: "/(tabs)/animate",
                  params: { imageUri: encodeURIComponent(action.imageUri) },
                });
              } else {
                router.replace("/(tabs)/animate");
              }
              return;
            } else if (action?.type === "tab") {
              router.replace(`/(tabs)/${action.tabName}` as any);
              return;
            }
          }
        } catch (e) {
          console.log("[AuthCallback] Error restoring pending action:", e);
        }

        router.replace("/(tabs)");
      })();
      return;
    }

    // If not signed in immediately, wait for OAuth session exchange
    const fallbackTimer = setTimeout(() => {
      if (!hasRedirected) {
        setHasRedirected(true);
        router.replace("/(tabs)");
      }
    }, 4000);

    return () => clearTimeout(fallbackTimer);
  }, [isSignedIn, isLoaded, hasRedirected]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0B0F19" }}>
      <ActivityIndicator size="large" color="#28D4FA" />
      <Text style={{ color: "#fff", marginTop: 20, fontSize: 17, fontFamily: getFontFamily("500") }}>
        Completing sign in...
      </Text>
    </View>
  );
}
