import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AnimateMemoriesLogo from "@/components/images/AnimateMemoriesLogo";
import NotificationsIcon from "../images/NotificationsIcon";
import MenuIcon from "../images/MenuIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useAuth as useClerkAuth } from "@clerk/clerk-expo";
import { api } from "@/services/api";
import { router } from "expo-router";
import { getFontFamily } from "@/constants/Fonts";
import { useSidebar } from "@/contexts/SidebarContext";

interface TabHeaderProps {
  creditsText?: string;
}

export default function TabHeader({ creditsText }: TabHeaderProps) {
  const { user } = useAuth();
  const { getToken } = useClerkAuth();
  const { openSidebar } = useSidebar();
  const { isActive } = require("@/contexts/TourContext").useTour();
  const [fetchedCredits, setFetchedCredits] = useState<number | null>(null);

  useEffect(() => {
    if (!creditsText && user) {
      let isMounted = true;
      async function loadCredits() {
        try {
          const token = await getToken();
          const res = await api.verifyUser(user, token);
          if (isMounted && res?.result?.credits !== undefined) {
            setFetchedCredits(res.result.credits);
          }
        } catch (e) {
          if (isMounted) setFetchedCredits(0);
        }
      }
      loadCredits();
      return () => {
        isMounted = false;
      };
    }
  }, [user, creditsText, getToken]);

  const displayCredits =
    creditsText ||
    (fetchedCredits !== null ? `${fetchedCredits} Credits` : "Loading...");

  return (
    <View style={styles.header} pointerEvents={isActive ? "none" : "auto"}>
      <TouchableOpacity onPress={() => router.push("/(tabs)")} activeOpacity={0.8}>
        <View style={styles.logoContainer}>
          <AnimateMemoriesLogo width={128} height={32} />
        </View>
      </TouchableOpacity>
      <View style={styles.headerRight}>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/credit")}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#38BDF8", "#00A3FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.creditsButton}
          >
            <Text style={styles.creditsButtonText}>{displayCredits}</Text>
          </LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={() => router.push("/(tabs)/notifications")}
          activeOpacity={0.7}
        >
          <NotificationsIcon width={20} height={20} color="#0F172A" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerIconButton}
          onPress={openSidebar}
          activeOpacity={0.7}
        >
          <MenuIcon width={22} height={22} color="#0F172A" />
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
    zIndex: 10,
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
    borderRadius: 20,
  },
  creditsButtonText: {
    fontSize: 12,
    color: "#fff",
    fontFamily: getFontFamily("600"),
  },
  headerIconButton: {
    padding: 4,
  },
});

