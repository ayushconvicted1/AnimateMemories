import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { Stack, usePathname } from "expo-router";
import { TourProvider } from "@/contexts/TourContext";
import { useEffect, useRef } from "react";
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
import {
  initTracking,
  requestTrackingPermissionAndInit,
  setUser,
  clearUser,
  trackScreen,
} from "@/services/tracking";

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
      SystemUI.setBackgroundColorAsync("#ffffff").catch(() => {});
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

  const safeDismissBrowser = () => {
    try {
      const res = WebBrowser.dismissBrowser();
      if (res && typeof (res as any).catch === "function") {
        (res as any).catch(() => {});
      }
    } catch (e) {
      // Browser might already be closed, ignore
    }
  };

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

        // Close browser safely if open
        safeDismissBrowser();

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
        safeDismissBrowser();

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
        safeDismissBrowser();

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
      <TrackingBridge />
      <ScreenTracker />
      <SidebarProvider>
        <TourProvider>
          <StatusBar
            style={Platform.OS === "android" ? "dark" : "auto"}
            backgroundColor={Platform.OS === "android" ? "#ffffff" : undefined}
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

/**
 * Initializes Firebase + Meta once, requests App Tracking Transparency on iOS,
 * and keeps the user identity in sync with Clerk (fires on sign-in/out).
 * Rendered inside <AuthProvider> so it can read useAuth().
 */
function TrackingBridge() {
  const { user, isSignedIn } = useAuth();

  // One-time SDK init + tracking-permission request.
  useEffect(() => {
    (async () => {
      await initTracking();
      await requestTrackingPermissionAndInit();
    })();
  }, []);

  // Sync the pseudonymous Clerk user id to GA4 + Meta on auth changes.
  useEffect(() => {
    if (!isSignedIn || !user) {
      clearUser();
      return;
    }
    const email =
      user.primaryEmailAddress?.emailAddress ||
      user.emailAddresses?.[0]?.emailAddress ||
      null;
    setUser({ id: user.id, email, signedIn: true });
  }, [isSignedIn, user?.id]);

  return null;
}

/**
 * Sends a GA4 screen_view whenever the active expo-router route changes.
 * Rendered inside <Stack> is not required; usePathname() works anywhere under the
 * RouterProvider.
 */
function ScreenTracker() {
  const pathname = usePathname();
  const prevRef = useRef<string | null>(null);
  const firstRef = useRef(true);

  useEffect(() => {
    if (firstRef.current || prevRef.current !== pathname) {
      trackScreen(pathname || "root");
      prevRef.current = pathname;
      firstRef.current = false;
    }
  }, [pathname]);

  return null;
}
