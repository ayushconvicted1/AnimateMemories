import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useAuth as useClerkAuth } from "@clerk/clerk-expo";
import { useAuth } from "@/contexts/AuthContext";
import { iapService } from "@/services/iap-service";

/**
 * Processes unfinished iOS in-app purchases when the app starts.
 *
 * If a purchase completed in the App Store but receipt verification was
 * interrupted (app killed, network failure), the user paid but never
 * received their credits. This component re-verifies any available
 * transactions and finishes them so credits are delivered exactly once.
 *
 * Renders nothing — it's a side-effect only.
 */
export default function PendingPurchaseHandler() {
  const { user } = useAuth();
  const { getToken } = useClerkAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    if (Platform.OS !== "ios") return;
    if (!user) return;

    const userEmail =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress;
    if (!userEmail) return;

    ran.current = true;

    const run = async () => {
      try {
        const token = await getToken();
        await iapService.initialize();
        await iapService.handlePendingPurchases(userEmail, token);
      } catch (error) {
        console.warn(
          "PendingPurchaseHandler: Failed to process pending purchases:",
          error
        );
      }
    };
    run();
  }, [user, getToken]);

  return null;
}
