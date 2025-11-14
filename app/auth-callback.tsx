import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";

export default function AuthCallback() {
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (isLoaded) {
      if (isSignedIn) {
        router.replace("/(tabs)");
      } else {
        router.replace("/(auth)");
      }
    }
  }, [isSignedIn, isLoaded]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#03ade2" />
    </View>
  );
}
