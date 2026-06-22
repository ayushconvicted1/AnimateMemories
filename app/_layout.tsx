import { AuthProvider } from "@/contexts/AuthContext";
import { Stack } from "expo-router";
import { useEffect } from "react";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import * as SystemUI from "expo-system-ui";
import {
  useFonts,
  Outfit_100Thin,
  Outfit_200ExtraLight,
  Outfit_300Light,
  Outfit_400Regular,
  Outfit_500Medium,
  Outfit_600SemiBold,
  Outfit_700Bold,
  Outfit_800ExtraBold,
  Outfit_900Black,
} from "@expo-google-fonts/outfit";
import * as SplashScreen from "expo-splash-screen";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Outfit_100Thin,
    Outfit_200ExtraLight,
    Outfit_300Light,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
    Outfit_800ExtraBold,
    Outfit_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide the splash screen once fonts are loaded
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    // Set status bar background color for Android
    if (Platform.OS === "android") {
      SystemUI.setBackgroundColorAsync("#ffffff").catch(console.error);
    }

    // Handle deep links when app is already open
    const subscription = Linking.addEventListener("url", (event) => {
      const { url } = event;
      handleDeepLink(url);
    });

    // Handle deep link if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = (url: string) => {
    console.log("Deep link received:", url);

    try {
      // Parse the URL
      const parsed = Linking.parse(url);
      console.log("Parsed deep link:", parsed);

      // Handle OAuth callbacks
      const isAuthCallback =
        parsed.path === "auth-callback" ||
        url.includes("auth-callback") ||
        parsed.hostname === "auth-callback";

      if (isAuthCallback) {
        console.log("Navigating to auth callback");

        // Close browser if open
        WebBrowser.dismissBrowser().catch(() => {
          // Browser might already be closed, ignore error
        });

        // Navigate to auth callback screen
        requestAnimationFrame(() => {
          setTimeout(() => {
            router.replace("/auth-callback");
          }, 50);
        });
        return;
      }

      // Handle payment callbacks - check both path and full URL
      const isSuccess =
        parsed.path === "payment-success" ||
        url.includes("payment-success") ||
        parsed.hostname === "payment-success";
      const isCancelled =
        parsed.path === "payment-cancelled" ||
        url.includes("payment-cancelled") ||
        parsed.hostname === "payment-cancelled";

      if (isSuccess) {
        const sessionId =
          (parsed.queryParams?.session_id as string) ||
          (parsed.queryParams?.["session_id"] as string) ||
          "";
        console.log(
          "Navigating to payment success callback with session:",
          sessionId
        );

        // Close browser immediately
        WebBrowser.dismissBrowser().catch(() => {
          // Browser might already be closed, ignore error
        });

        // Navigate - use both requestAnimationFrame and setTimeout as fallback
        requestAnimationFrame(() => {
          setTimeout(() => {
            router.replace({
              pathname: "/payment-callback",
              params: {
                url: "payment-success",
                session_id: sessionId,
              },
            });
          }, 50);
        });
      } else if (isCancelled) {
        console.log("Navigating to payment cancelled callback");

        // Close browser immediately
        WebBrowser.dismissBrowser().catch(() => {
          // Browser might already be closed, ignore error
        });

        // Navigate - use both requestAnimationFrame and setTimeout as fallback
        requestAnimationFrame(() => {
          setTimeout(() => {
            router.replace({
              pathname: "/payment-callback",
              params: {
                url: "payment-cancelled",
              },
            });
          }, 50);
        });
      }
    } catch (error) {
      console.error("Error handling deep link:", error);
    }
  };

  // Don't render until fonts are loaded
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <AuthProvider>
      <StatusBar
        style={Platform.OS === "android" ? "dark" : "auto"}
        backgroundColor={Platform.OS === "android" ? "#ffffff" : undefined}
      />
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </AuthProvider>
  );
}
