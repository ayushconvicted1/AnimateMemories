import React from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTour } from "@/contexts/TourContext";
import { getFontFamily } from "@/constants/Fonts";
import TourArrowDownIcon from "@/components/images/TourArrowDownIcon";
import PointerIcon from "@/components/images/PointerIcon";
import SurpriseMeIcon from "@/components/images/SurpriseMeIcon";

const TourOverlay = () => {
  const { currentStep, isActive, nextStep, endTour } = useTour();

  if (!isActive) {
    return null;
  }

  // Step 0: Welcome Modal
  if (currentStep === 0) {
    return (
      <Modal
        transparent
        animationType="fade"
        visible={isActive && currentStep === 0}
        onRequestClose={endTour}
      >
        <View style={styles.backdrop}>
          <View style={styles.welcomeCard}>
            <LinearGradient
              colors={["#28D4FA", "#D229FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.headerBadge}
            >
              <Text style={styles.headerBadgeText}>QUICK TOUR</Text>
            </LinearGradient>

            <Text style={styles.title}>Welcome to Animate Memories! 👋</Text>
            <Text style={styles.text}>
              Let's show you how to generate your first AI video memory in a few quick steps.
            </Text>

            <View style={styles.buttonRowCenter}>
              <TouchableOpacity onPress={endTour} style={styles.skipButton}>
                <Text style={styles.skipButtonText}>Skip Tour</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={nextStep} activeOpacity={0.8}>
                <LinearGradient
                  colors={["#28D4FA", "#D229FF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startButtonGradient}
                >
                  <Text style={styles.startButtonText}>Start Tour →</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  // Step 1: Floating Tooltip Card above Create button in Bottom Tab Bar
  if (currentStep === 1) {
    return (
      <View style={styles.floatingStep1Wrapper} pointerEvents="box-none">
        <View style={styles.step1Card}>
          <LinearGradient
            colors={["#28D4FA", "#D229FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.headerBadge}
          >
            <Text style={styles.headerBadgeText}>STEP 1 OF 4</Text>
          </LinearGradient>
          <Text style={styles.title}>Start Creating</Text>
          <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 12, paddingRight: 10 }}>
            <Text style={[styles.text, { marginBottom: 0 }]}>
              Action Required: Tap the glowing Create tab below to open the AI generator!
            </Text>
          </View>
          <View style={styles.skipRowRight}>
            <TouchableOpacity onPress={endTour} style={styles.skipButton}>
              <Text style={styles.skipButtonText}>Skip Tour</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ alignItems: "center", marginTop: -2, zIndex: 1 }}>
          <TourArrowDownIcon color="#FFFFFF" width={24} height={12} />
        </View>
      </View>
    );
  }

  // Steps 2, 3, 4: Render Tooltip (if step 3)
  if (currentStep > 1) {
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {currentStep === 3 && (
          <View style={[styles.floatingStep1Wrapper, { bottom: undefined, top: 120 }]} pointerEvents="box-none">
            <View style={styles.step1Card}>
              <LinearGradient
                colors={["#28D4FA", "#D229FF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerBadge}
              >
                <Text style={styles.headerBadgeText}>STEP 3 OF 4</Text>
              </LinearGradient>
              <Text style={styles.title}>Select a template to continue</Text>
              <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 12, paddingRight: 10 }}>
                <View style={{ marginRight: 6, marginTop: 2 }}>
                  <SurpriseMeIcon width={16} height={16} color="#475569" />
                </View>
                <Text style={[styles.text, { marginBottom: 0 }]}>
                  Action Required: Choose a preset template or tap 'Custom Prompt' to use AI Surprise Me!
                </Text>
              </View>
              <View style={styles.skipRowRight}>
                <TouchableOpacity onPress={endTour} style={styles.skipButton}>
                  <Text style={styles.skipButtonText}>Skip Tour</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={{ alignItems: "center", marginTop: -2, zIndex: 1 }}>
              <TourArrowDownIcon color="#FFFFFF" width={24} height={12} />
            </View>
          </View>
        )}
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  welcomeCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    alignItems: "center",
  },
  floatingStep1Wrapper: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 115 : 100,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  step1Card: {
    width: 280,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 10,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  headerBadge: {
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  headerBadgeText: {
    fontSize: 10,
    fontFamily: getFontFamily("800"),
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 16,
    fontFamily: getFontFamily("700"),
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 6,
  },
  text: {
    fontSize: 13,
    fontFamily: getFontFamily("400"),
    color: "#475569",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 12,
  },
  buttonRowCenter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  skipRowRight: {
    alignSelf: "flex-end",
    marginTop: 4,
  },
  skipButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  skipButtonText: {
    fontSize: 13,
    fontFamily: getFontFamily("500"),
    color: "#64748B",
  },
  startButtonGradient: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  startButtonText: {
    fontSize: 13,
    fontFamily: getFontFamily("700"),
    color: "#FFFFFF",
  },
  tabBarBlocker: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === "ios" ? 105 : 90,
    backgroundColor: "#636874", // Precise blend of rgba(15,23,42,0.65) over white
    zIndex: 10,
  },
});

export default TourOverlay;
