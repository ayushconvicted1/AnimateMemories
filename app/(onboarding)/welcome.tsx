import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Video, ResizeMode, AVPlaybackSource } from "expo-av";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

export default function OnboardingWelcome() {
  const insets = useSafeAreaInsets();
  const videoRef = useRef<Video>(null);
  const [videoStatus, setVideoStatus] = useState({});

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const handleContinue = () => {
    router.push("/(onboarding)/discovery");
  };

  const handleSkip = () => {
    router.replace("/(tabs)");
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Full Screen Background Video */}
      <Video
        ref={videoRef}
        source={require("../../assets/videos/OnboardingHome.mp4")}
        style={styles.backgroundVideo}
        resizeMode={ResizeMode.COVER}
        isLooping
        shouldPlay
        isMuted={false}
        volume={1.0}
        onPlaybackStatusUpdate={(status) => setVideoStatus(() => status)}
        useNativeControls={false}
      />

      {/* Dark Overlay for better text readability */}
      <View style={styles.overlay} />

      {/* Progress Bar */}
      <View style={[styles.progressContainer, { paddingTop: insets.top + 20 }]}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: "20%" }]} />
        </View>

        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Content - Bottom Section */}
      <View style={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
        {/* Download Badge */}
        <View style={styles.downloadBadge}>
          <View style={styles.downloadNumberContainer}>
            <Text style={styles.numberMain}>1M</Text>
            <Text style={styles.numberSuperscript}>+</Text>
          </View>
          <Text style={styles.downloadText}>Download</Text>
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Easily create viral AI videos from your images and text with Animate
          Memories.
        </Text>

        {/* Continue Button */}
        <TouchableOpacity
          style={styles.continueContainer}
          onPress={handleContinue}
        >
          <LinearGradient
            colors={["#28D4FA", "#D229FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.continueButton}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  backgroundVideo: {
    position: "absolute",
    top: 0,
    left: 0,
    width: screenWidth,
    height: screenHeight,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    justifyContent: "space-between",
    zIndex: 10,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    marginRight: 20,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#28D4FA",
    borderRadius: 2,
  },
  skipButton: {
    padding: 10,
    zIndex: 10,
  },
  skipText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  content: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  downloadBadge: {
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  downloadNumberContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  numberMain: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "500",
    lineHeight: 36,
  },
  numberSuperscript: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "500",
    lineHeight: 24,
    marginTop: 2,
  },
  downloadText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  description: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 20,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  continueContainer: {
    width: "100%",
    maxWidth: 300,
  },
  continueButton: {
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});
