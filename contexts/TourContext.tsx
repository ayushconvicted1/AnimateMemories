import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser } from "@clerk/clerk-expo";
import TourOverlay from "@/components/tour/TourOverlay";
import { markOnboardingComplete } from "@/lib/onboarding";

export interface TourStepMeasurements {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TourContextType {
  isActive: boolean;
  currentStep: number;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
  registerStep: (index: number, measurements: TourStepMeasurements) => void;
  getStepMeasurements: (index: number) => TourStepMeasurements | null;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

const TOUR_COMPLETED_KEY = "@tour_completed";

export const TourProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useUser();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [measurementsMap, setMeasurementsMap] = useState<
    Record<number, TourStepMeasurements>
  >({});

  // Reset tour state if user is unauthenticated or logs out
  useEffect(() => {
    if (!user) {
      setIsActive(false);
      setCurrentStep(0);
    }
  }, [user]);

  const startTour = async () => {
    // The tour guide only shows once per account — on the first registration
    // or first login. It must never run when unauthenticated.
    if (!user) return;
    if (user?.unsafeMetadata?.onboardingCompleted) return;
    try {
      const userKey = `@tour_completed_${user.id}`;
      const completed = await AsyncStorage.getItem(userKey);
      if (completed === "true") return;
    } catch (error) {
      console.log("Failed to read tour completion (non-critical):", error);
    }
    setIsActive(true);
    setCurrentStep(0);
  };

  const nextStep = () => {
    // 4 active steps: 1 (Create Button), 2 (Select Image), 3 (Select Template), 4 (Generate Video)
    if (currentStep >= 4) {
      endTour();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const endTour = () => {
    setIsActive(false);
    // Persist immediately (per-account via Clerk metadata, per-device via
    // user-scoped AsyncStorage) so the tour doesn't reappear on the next open.
    if (user) {
      void markOnboardingComplete(user);
      const userKey = `@tour_completed_${user.id}`;
      void AsyncStorage.setItem(userKey, "true").catch((error) =>
        console.log("Failed to save tour completion (non-critical):", error)
      );
    }
  };

  const registerStep = React.useCallback((index: number, measurements: TourStepMeasurements) => {
    setMeasurementsMap((prev) => {
      const existing = prev[index];
      if (
        existing &&
        Math.abs(existing.x - measurements.x) <= 2 &&
        Math.abs(existing.y - measurements.y) <= 2 &&
        Math.abs(existing.width - measurements.width) <= 2 &&
        Math.abs(existing.height - measurements.height) <= 2
      ) {
        return prev;
      }
      return {
        ...prev,
        [index]: measurements,
      };
    });
  }, []);

  const getStepMeasurements = React.useCallback((index: number) => {
    return measurementsMap[index] || null;
  }, [measurementsMap]);

  return (
    <TourContext.Provider
      value={{
        isActive,
        currentStep,
        startTour,
        nextStep,
        prevStep,
        endTour,
        registerStep,
        getStepMeasurements,
      }}
    >
      {children}
      {isActive && <TourOverlay />}
    </TourContext.Provider>
  );
};

export const useTour = () => {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
};
