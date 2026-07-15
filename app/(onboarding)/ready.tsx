import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import VerticalSwiper from "@/components/ui/VerticalSwiper";

const { width: screenWidth } = Dimensions.get("window");

export default function OnboardingReady() {
  const insets = useSafeAreaInsets();

  // Before and after images for the vertical swiper
  const beforeImage = "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&crop=face";
  const afterImage = "https://img.freepik.com/free-photo/designer-working-3d-model_23-2149371896.jpg?semt=ais_hybrid&w=740&q=80";

  const handleStartCreating = () => {
    router.replace("/(tabs)");
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Progress Bar */}
      <View
        style={[styles.progressContainer, { top: insets.top, paddingTop: 20 }]}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: "100%" }]} />
        </View>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: (insets.bottom || 0) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Title */}
        <Text style={styles.title}>
          <Text style={styles.titleBlue}>Your Video Is</Text>
          {"\n"}
          <Text style={styles.titlePurple}>Ready!</Text>
        </Text>

        {/* Vertical Swiper */}
        <View style={styles.sliderContainer}>
          <VerticalSwiper
            beforeImage={beforeImage}
            afterImage={afterImage}
            width={280}
            height={350}
            autoSlideInterval={2000}
            transitionDuration={2000}
          />
        </View>

        {/* Start Creating Button */}
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={handleStartCreating}
        >
          <LinearGradient
            colors={["#28D4FA", "#D229FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            <Text style={styles.buttonText}>Start creating</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  progressContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    justifyContent: "flex-start",
    zIndex: 100,
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  backText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "500",
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#28D4FA",
    borderRadius: 2,
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
    paddingTop: 140,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 56,
    width: "100%",
  },
  titleBlue: {
    color: "#28D4FA",
  },
  titlePurple: {
    color: "#D229FF",
  },
  sliderContainer: {
    marginBottom: 30,
    elevation: 10,
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 300,
    alignSelf: "center",
  },
  button: {
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
});

