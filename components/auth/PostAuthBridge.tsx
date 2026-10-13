import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAuthGate, PendingAction } from "@/contexts/AuthGateContext";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PENDING_ACTION_STORAGE_KEY = "@auth_pending_action";

export default function PostAuthBridge() {
  const { isSignedIn, isLoaded } = useAuth();
  const { pendingAction, clearPendingAction, dismissModal } = useAuthGate();
  const prevSignedInRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isLoaded) return;

    // Detect user transition from not-signed-in to signed-in
    const justSignedIn = !prevSignedInRef.current && !!isSignedIn;
    prevSignedInRef.current = !!isSignedIn;

    if (justSignedIn) {
      dismissModal();

      const handlePostAuthAction = async () => {
        let action: PendingAction = pendingAction;

        // Fallback: Check AsyncStorage if context state hasn't loaded or was cleared
        if (!action) {
          try {
            const stored = await AsyncStorage.getItem(PENDING_ACTION_STORAGE_KEY);
            if (stored) {
              action = JSON.parse(stored) as PendingAction;
            }
          } catch (e) {
            console.log("[PostAuthBridge] Error reading stored action:", e);
          }
        }

        if (action) {
          // Clear stored action
          clearPendingAction();
          AsyncStorage.removeItem(PENDING_ACTION_STORAGE_KEY).catch(() => {});

          // Small delay to allow auth state and modal dismissal to settle
          setTimeout(() => {
            switch (action?.type) {
              case "template":
                router.push({
                  pathname: "/(tabs)/animate",
                  params: { templateId: action.templateId },
                });
                break;

              case "create":
                router.push("/(tabs)/animate");
                break;

              case "upload":
                if (action.imageUri) {
                  router.push({
                    pathname: "/(tabs)/animate",
                    params: { imageUri: encodeURIComponent(action.imageUri) },
                  });
                } else {
                  router.push("/(tabs)/animate");
                }
                break;

              case "tab":
                router.push(`/(tabs)/${action.tabName}` as any);
                break;
            }
          }, 150);
        }
      };

      handlePostAuthAction();
    }
  }, [isSignedIn, isLoaded, pendingAction, clearPendingAction, dismissModal]);

  return null;
}
