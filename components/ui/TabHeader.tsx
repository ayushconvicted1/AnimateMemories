import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AnimateMemoriesLogo from "@/components/images/AnimateMemoriesLogo";
import NotificationsIcon from "../images/NotificationsIcon";

interface TabHeaderProps {
  creditsText?: string;
}

export default function TabHeader({
  creditsText = "3 Free Credits",
}: TabHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.logoContainer}>
        <AnimateMemoriesLogo width={132} height={36} />
      </View>
      <View style={styles.headerRight}>
        <LinearGradient
          colors={["#28D4FA", "#D229FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.creditsButton}
        >
          <Text style={styles.creditsButtonText}>{creditsText}</Text>
        </LinearGradient>
        <TouchableOpacity style={styles.bellButton}>
          <NotificationsIcon width={20} height={20} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  creditsButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  creditsButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#fff",
  },
  bellButton: {
    padding: 4,
  },
  bellIcon: {
    fontSize: 20,
  },
});
