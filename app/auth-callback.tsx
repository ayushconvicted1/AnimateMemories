import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import { getFontFamily } from "@/constants/Fonts";

export default function AuthCallback() {
  const { isSignedIn, isLoaded } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!isLoaded || hasRedirected) return;
    
    if (isSignedIn) {
      setHasRedirected(true);
      router.replace("/(tabs)");
      return;
    }

    // If not signed in immediately, wait for OAuth session exchange
    const fallbackTimer = setTimeout(() => {
      if (!hasRedirected) {
        setHasRedirected(true);
        router.replace("/(auth)");
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
