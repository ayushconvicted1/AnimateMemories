import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import AnimateMemoriesLogo from "@/components/images/AnimateMemoriesLogo";
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

// Module-level cache so switching screens instantly retains the known balance with 0 loading flicker
let globalLastKnownCredits: number | null = null;

export default function TabHeader({ creditsText }: TabHeaderProps) {
  const { user } = useAuth();
  const { getToken } = useClerkAuth();
  const { openSidebar } = useSidebar();
  const { isActive } = require("@/contexts/TourContext").useTour();
  const [fetchedCredits, setFetchedCredits] = useState<number | null>(
    globalLastKnownCredits
  );

  useEffect(() => {
    if (user) {
      let isMounted = true;
      async function loadCredits() {
        try {
          const token = await getToken();
          const res = await api.verifyUser(user, token);
          if (isMounted && res?.result?.credits !== undefined) {
            const count = res.result.credits;
            globalLastKnownCredits = count;
            setFetchedCredits(count);
          }
        } catch {
          // Keep last known balance on error
        }
      }
      loadCredits();
      return () => {
        isMounted = false;
      };
    }
  }, [user, getToken]);

  const parseCreditNumber = (val?: string | null): number | null => {
    if (!val || typeof val !== "string" || val.toLowerCase().includes("loading")) {
      return null;
    }
    const match = val.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  };

  const parsedPropCredits = parseCreditNumber(creditsText);
  if (parsedPropCredits !== null) {
    globalLastKnownCredits = parsedPropCredits;
  }

  const currentCreditCount =
    parsedPropCredits !== null
      ? parsedPropCredits
      : fetchedCredits !== null
      ? fetchedCredits
      : globalLastKnownCredits;

  const isLoading = currentCreditCount === null;
  const isLowCredits =
    !isLoading && currentCreditCount !== null && currentCreditCount <= 3;

  // Signature brand gradient for credit view in the header
  const pillGradientColors: readonly [string, string] = ["#38BDF8", "#D229FF"];

  return (
    <View style={styles.header} pointerEvents={isActive ? "none" : "auto"}>
      {/* Brand Logo */}
      <TouchableOpacity
        onPress={() => router.push("/(tabs)")}
        activeOpacity={0.8}
      >
        <View style={styles.logoContainer}>
          <AnimateMemoriesLogo width={128} height={32} />
        </View>
      </TouchableOpacity>

      <View style={styles.headerRight}>
        {/* Unified Smart Credit & Upgrade Pill */}
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/credit")}
          activeOpacity={0.8}
          style={styles.creditPillTouchable}
        >
          <LinearGradient
            colors={pillGradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.smartCreditPill}
          >
            {isLoading ? (
              <Text style={styles.creditCountText}>Loading...</Text>
            ) : isLowCredits ? (
              <View style={styles.lowCreditContent}>
                <Text style={styles.creditCountText}>
                  {currentCreditCount}{" "}
                  {currentCreditCount === 1 ? "Credit" : "Credits"}
                </Text>
                <View style={styles.pillDivider} />
                <Text style={styles.upgradeActionText}>+ Upgrade</Text>
              </View>
            ) : (
              <Text style={styles.creditCountText}>
                {currentCreditCount} Credits
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Menu Drawer Toggle */}
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
    gap: 10,
  },
  creditPillTouchable: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#D229FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  smartCreditPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  lowCreditContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pillDivider: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    borderRadius: 1,
  },
  creditCountText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontFamily: getFontFamily("600"),
  },
  upgradeActionText: {
    fontSize: 12,
    color: "#FFFFFF",
    fontFamily: getFontFamily("700"),
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  headerIconButton: {
    padding: 6,
  },
});
