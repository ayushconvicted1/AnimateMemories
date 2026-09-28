import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type PendingAction =
  | { type: "template"; templateId: string }
  | { type: "create" }
  | { type: "upload"; imageUri?: string }
  | { type: "tab"; tabName: "gallery" | "credit" | "you" }
  | null;

const PENDING_ACTION_STORAGE_KEY = "@auth_pending_action";

interface AuthGateContextType {
  showLoginModal: boolean;
  pendingAction: PendingAction;
  initialView: "signin" | "signup";
  requireAuth: (action: PendingAction, view?: "signin" | "signup") => void;
  dismissModal: () => void;
  completedAuth: () => void;
  clearPendingAction: () => void;
}

const AuthGateContext = createContext<AuthGateContextType | undefined>(undefined);

export const AuthGateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingAction, setPendingActionState] = useState<PendingAction>(null);
  const [initialView, setInitialView] = useState<"signin" | "signup">("signin");

  // Restore any persisted pending action on mount (e.g. from OAuth redirect)
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(PENDING_ACTION_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as PendingAction;
          setPendingActionState(parsed);
        }
      } catch (e) {
        console.log("[AuthGateContext] Failed to read stored pending action:", e);
      }
    })();
  }, []);

  const setPendingAction = useCallback((action: PendingAction) => {
    setPendingActionState(action);
    if (action) {
      AsyncStorage.setItem(PENDING_ACTION_STORAGE_KEY, JSON.stringify(action)).catch(() => {});
    } else {
      AsyncStorage.removeItem(PENDING_ACTION_STORAGE_KEY).catch(() => {});
    }
  }, []);

  const requireAuth = useCallback(
    (action: PendingAction, view: "signin" | "signup" = "signin") => {
      setPendingAction(action);
      setInitialView(view);
      setShowLoginModal(true);
    },
    [setPendingAction]
  );

  const dismissModal = useCallback(() => {
    setShowLoginModal(false);
    setPendingAction(null);
  }, [setPendingAction]);

  const completedAuth = useCallback(() => {
    setShowLoginModal(false);
    // Note: pendingAction is preserved so PostAuthBridge can read it immediately,
    // and then clearPendingAction() will be called once handled.
  }, []);

  const clearPendingAction = useCallback(() => {
    setPendingAction(null);
  }, [setPendingAction]);

  return (
    <AuthGateContext.Provider
      value={{
        showLoginModal,
        pendingAction,
        initialView,
        requireAuth,
        dismissModal,
        completedAuth,
        clearPendingAction,
      }}
    >
      {children}
    </AuthGateContext.Provider>
  );
};

export const useAuthGate = () => {
  const ctx = useContext(AuthGateContext);
  if (!ctx) {
    throw new Error("useAuthGate must be used within an AuthGateProvider");
  }
  return ctx;
};
