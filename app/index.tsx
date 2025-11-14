import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#03ade2" />
      </View>
    );
  }

  if (isSignedIn) {
    // For existing users, go directly to tabs
    // For new users, they'll be redirected to onboarding from signup
    return <Redirect href="/(onboarding)" />;
  }

  return <Redirect href="/(auth)" />;
}
