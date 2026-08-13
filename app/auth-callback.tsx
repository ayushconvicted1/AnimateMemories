import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";

export default function AuthCallback() {
  const { isSignedIn, isLoaded } = useAuth();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    
    // Small delay to ensure session is fully established
    const timer = setTimeout(() => {
      if (hasRedirected) return;
      
      setHasRedirected(true);
      
      if (isSignedIn) {
        // The quick tour decides for itself whether to show (only once per
        // account, right after registration/first login) — see TourContext.
        router.replace("/(tabs)");
      } else {
        router.replace("/(auth)");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isSignedIn, isLoaded, hasRedirected]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
      <ActivityIndicator size="large" color="#03ade2" />
      <Text style={{ color: "#fff", marginTop: 20, fontSize: 16 }}>
        Completing sign in...
      </Text>
    </View>
  );
}
