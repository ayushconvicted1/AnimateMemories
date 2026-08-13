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
    // The quick tour decides for itself whether to show on first open.
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)" />;
}
