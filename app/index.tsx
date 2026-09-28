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

  // Always land on Home tab, matching the web flow.
  // Auth is handled via the login modal triggered by protected actions.
  return <Redirect href="/(tabs)" />;
}
