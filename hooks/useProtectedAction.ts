import { useAuth } from "@/contexts/AuthContext";
import { useAuthGate, PendingAction } from "@/contexts/AuthGateContext";
import { useCallback } from "react";

export function useProtectedAction() {
  const { isSignedIn } = useAuth();
  const { requireAuth, pendingAction, dismissModal, showLoginModal } = useAuthGate();

  /**
   * Checks if user is authenticated.
   * Returns `true` if signed in (caller proceeds with action).
   * Returns `false` if not signed in (opens login modal with pending action intent).
   */
  const guard = useCallback(
    (action: PendingAction, view: "signin" | "signup" = "signin"): boolean => {
      if (isSignedIn) {
        return true;
      }
      requireAuth(action, view);
      return false;
    },
    [isSignedIn, requireAuth]
  );

  return {
    guard,
    isSignedIn,
    requireAuth,
    pendingAction,
    dismissModal,
    showLoginModal,
  };
}
