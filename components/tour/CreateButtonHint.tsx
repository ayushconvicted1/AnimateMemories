import React from "react";
import { View, StyleSheet, Text, TouchableOpacity, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTour } from "@/contexts/TourContext";
import { getFontFamily } from "@/constants/Fonts";
import TourArrowDownIcon from "@/components/images/TourArrowDownIcon";

export default function CreateButtonHint() {
  const { showCreateHint, setShowCreateHint } = useTour();

  if (!showCreateHint) return null;

  return (
    <View style={styles.floatingWrapper} pointerEvents="box-none">
      <View style={styles.hintCard}>
        <LinearGradient
          colors={["#28D4FA", "#D229FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.headerBadge}
        >
          <Text style={styles.headerBadgeText}>GET STARTED</Text>
        </LinearGradient>

        <Text style={styles.title}>Create Your First Animation! 🎬</Text>

        <View style={styles.textRow}>
          <Text style={styles.text}>
            👇 Tap the glowing Create button below to bring your photos to life
          </Text>
        </View>

        <View style={styles.dismissRow}>
          <TouchableOpacity
            onPress={() => setShowCreateHint(false)}
            style={styles.dismissButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.dismissButtonText}>Got it</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.arrowContainer}>
        <TourArrowDownIcon color="#FFFFFF" width={24} height={12} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingWrapper: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 115 : 100,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  hintCard: {
    width: 290,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 12,
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
    marginBottom: 8,
  },
  headerBadgeText: {
    fontSize: 11,
    fontFamily: getFontFamily("700"),
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 17,
    fontFamily: getFontFamily("600"),
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 6,
  },
  textRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  text: {
    fontSize: 14,
    fontFamily: getFontFamily("400"),
    color: "#475569",
    textAlign: "center",
    lineHeight: 20,
  },
  dismissRow: {
    alignSelf: "flex-end",
    marginTop: 2,
  },
  dismissButton: {
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  dismissButtonText: {
    fontSize: 14,
    fontFamily: getFontFamily("600"),
    color: "#A855F7",
  },
  arrowContainer: {
    alignItems: "center",
    marginTop: -2,
    zIndex: 1,
  },
});
