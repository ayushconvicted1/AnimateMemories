import { useEffect, useState } from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@clerk/clerk-expo";
import { router, useLocalSearchParams } from "expo-router";

export default function AuthCallback() {
  const { isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const params = useLocalSearchParams();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    
    // Small delay to ensure session is fully established
    const timer = setTimeout(() => {
      if (hasRedirected) return;
      
      setHasRedirected(true);
      
      if (isSignedIn && user) {
        // Check if user is new (no onboarding completed)
        // For now, redirect new users to onboarding, existing to tabs
        // You can add logic here to check if user has completed onboarding
        const isNewUser = !user.publicMetadata?.onboardingCompleted;
        
        if (isNewUser) {
          router.replace("/(onboarding)");
        } else {
          router.replace("/(tabs)");
        }
      } else {
        router.replace("/(auth)");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [isSignedIn, isLoaded, user, hasRedirected]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
      <ActivityIndicator size="large" color="#03ade2" />
      <Text style={{ color: "#fff", marginTop: 20, fontSize: 16 }}>
        Completing sign in...
      </Text>
    </View>
  );
}
