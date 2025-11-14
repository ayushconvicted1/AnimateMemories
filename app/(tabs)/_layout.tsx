import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";

import { HapticTab } from "@/components/HapticTab";
import { IconSymbol } from "@/components/ui/IconSymbol";
import TabBarBackground from "@/components/ui/TabBarBackground";
import AnimateMemoriesTabsLogo from "@/components/images/AnimateMemoriesTabsLogo";
import HomeIcon from "@/components/images/HomeIcon";
import GalleryIcon from "@/components/images/GalleryIcon";
import CreditIcon from "@/components/images/CreditIcon";
import YouIcon from "@/components/images/YouIcon";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#282828",
        tabBarInactiveTintColor: "#979797",
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          position: "absolute",
          borderTopWidth: 0,
          backgroundColor: "transparent",
          height: Platform.OS === "ios" ? 105 : 90,
          paddingBottom: Platform.OS === "ios" ? 30 : 20,
          paddingTop: 10,
          borderRadius: 10,
          marginHorizontal: 0,
          marginBottom: 0,
          elevation: 0,
          shadowOpacity: 0,
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12.865,
          fontFamily: Platform.OS === "ios" ? "System" : "Roboto",
          fontWeight: "400",
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused ? <HomeIcon /> : <HomeIcon color={color} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: "Gallery",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused ? (
                <MaskedView
                  style={styles.maskedView}
                  maskElement={<GalleryIcon />}
                  androidRenderingMode="software"
                >
                  <LinearGradient
                    colors={["#28D4FA", "#D229FF"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.iconGradient}
                  />
                </MaskedView>
              ) : (
                <GalleryIcon color={color} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="animate"
        options={{
          title: "Animate",
          tabBarIcon: ({ focused }) => (
            <View style={styles.centerButtonContainer}>
              <View style={styles.centerButtonWrapper}>
                <LinearGradient
                  colors={
                    focused ? ["#28D4FA", "#D229FF"] : ["#28D4FA", "#D229FF"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.centerButton}
                >
                  <View style={styles.centerButtonIcon}>
                    <AnimateMemoriesTabsLogo />
                    <View style={styles.centerButtonDot} />
                  </View>
                </LinearGradient>
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="credit"
        options={{
          title: "Credit",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused ? <CreditIcon /> : <CreditIcon color={color} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: "You",
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              {focused ? <YouIcon /> : <YouIcon color={color} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerButtonContainer: {
    width: 61,
    height: 75,
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: -28,
    marginBottom: 0,
  },
  centerButtonWrapper: {
    width: 61,
    height: 61,
    alignItems: "center",
    justifyContent: "center",
  },
  centerButton: {
    width: 61,
    height: 61,
    borderRadius: 30.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  centerButtonIcon: {
    alignItems: "center",
    justifyContent: "center",
  },
  centerButtonIconText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  centerButtonDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#fff",
    marginTop: 2,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  maskedView: {
    width: 28,
    height: 28,
    backgroundColor: "transparent",
  },
  iconMaskContainer: {
    flex: 1,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  iconGradient: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "transparent",
  },
});
