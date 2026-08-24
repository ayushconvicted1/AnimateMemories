import { AuthProvider } from "@/contexts/AuthContext";
import PendingPurchaseHandler from "@/components/ui/PendingPurchaseHandler";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { Stack } from "expo-router";
import { TourProvider } from "@/contexts/TourContext";
import { useEffect } from "react";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { StatusBar } from "expo-status-bar";
import { Platform, Text as RNText, TextInput as RNTextInput } from "react-native";
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

    // Aliases for seamless cross-platform resolution
    Outfit: Outfit_400Regular,
    "Outfit-Bold": Outfit_700Bold,
    "Outfit-ExtraBold": Outfit_800ExtraBold,
    "Outfit-Black": Outfit_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Set global default Outfit font for all Text and TextInput components
      try {
        if ((RNText as any).defaultProps) {
          (RNText as any).defaultProps.style = [
            { fontFamily: "Outfit_400Regular" },
            (RNText as any).defaultProps.style,
          ];
        } else {
          (RNText as any).defaultProps = {
            style: { fontFamily: "Outfit_400Regular" },
          };
        }

        if ((RNTextInput as any).defaultProps) {
          (RNTextInput as any).defaultProps.style = [
            { fontFamily: "Outfit_400Regular" },
            (RNTextInput as any).defaultProps.style,
          ];
        } else {
          (RNTextInput as any).defaultProps = {
            style: { fontFamily: "Outfit_400Regular" },
          };
        }
      } catch (e) {
        console.warn("Global font setup error:", e);
      }

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
      <PendingPurchaseHandler />
      <SidebarProvider>
        <TourProvider>
          <StatusBar
            style="dark"
            backgroundColor="#ffffff"
          />
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </TourProvider>
      </SidebarProvider>
    </AuthProvider>
  );
}
