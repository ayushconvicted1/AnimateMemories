import React, { createContext, useContext } from "react";

export interface TourStepMeasurements {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type TourEntryMode = "create" | "template" | "tab-redirect" | null;

interface TourContextType {
  isActive: boolean;
  currentStep: number;
  tourEntryMode: TourEntryMode;
  showCreateHint: boolean;
  startTour: (mode?: "create" | "template" | "tab-redirect") => void;
  startTourFromStep: (step: number, mode?: "create" | "template" | "tab-redirect") => void;
  setShowCreateHint: (show: boolean) => void;
  setTourEntryMode: (mode: TourEntryMode) => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
  registerStep: (index: number, measurements: TourStepMeasurements) => void;
  getStepMeasurements: (index: number) => TourStepMeasurements | null;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

// Onboarding tour is disabled for now as requested.
// Stubs are preserved so any components reading useTour() continue to compile without errors.
export const TourProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <TourContext.Provider
      value={{
        isActive: false,
        currentStep: 0,
        tourEntryMode: null,
        showCreateHint: false,
        startTour: () => {},
        startTourFromStep: () => {},
        setShowCreateHint: () => {},
        setTourEntryMode: () => {},
        nextStep: () => {},
        prevStep: () => {},
        endTour: () => {},
        registerStep: () => {},
        getStepMeasurements: () => null,
      }}
    >
      {children}
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
