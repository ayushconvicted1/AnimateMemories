import { Tabs } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Platform, StyleSheet, View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { HapticTab } from "@/components/HapticTab";
import TabBarBackground from "@/components/ui/TabBarBackground";
import AnimateMemoriesTabsLogo from "@/components/images/AnimateMemoriesTabsLogo";
import HomeIcon from "@/components/images/HomeIcon";
import GalleryIcon from "@/components/images/GalleryIcon";
import CreditIcon from "@/components/images/CreditIcon";
import YouIcon from "@/components/images/YouIcon";

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

// Reusable animated icon wrapper that bounces when focused
const AnimatedIconWrapper = ({
  children,
  focused,
}: {
  children: React.ReactNode;
  focused: boolean;
}) => {
  const scale = useSharedValue(1);
  const prevFocusedRef = useRef<boolean | null>(null);

  useEffect(() => {
    // Animate when tab becomes focused (skip initial mount)
    if (prevFocusedRef.current !== null) {
      if (focused && !prevFocusedRef.current) {
        scale.value = withSequence(
          withSpring(1.2, {
            damping: 6,
            stiffness: 200,
            mass: 0.8,
          }),
          withSpring(1, {
            damping: 8,
            stiffness: 300,
            mass: 0.5,
          })
        );
      } else if (!focused) {
        // Reset when unfocused
        scale.value = withTiming(1, { duration: 200 });
      }
    }
    prevFocusedRef.current = focused;
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
};

const CreateButton = ({ focused }: { focused: boolean }) => {
  const scale = useSharedValue(1);
  const gradientProgress = useSharedValue(focused ? 1 : 0);
  const prevFocusedRef = useRef<boolean | null>(null);

  // Bouncy animation when tab becomes focused
  useEffect(() => {
    // Animate when tab becomes focused (skip initial mount)
    if (prevFocusedRef.current !== null) {
      if (focused && !prevFocusedRef.current) {
        // Bounce animation when becoming focused
        scale.value = withSequence(
          withSpring(1.2, {
            damping: 6,
            stiffness: 200,
            mass: 0.8,
          }),
          withSpring(1, {
            damping: 8,
            stiffness: 300,
            mass: 0.5,
          })
        );
      } else if (!focused) {
        // Reset when unfocused
        scale.value = withTiming(1, { duration: 200 });
      }
    }
    prevFocusedRef.current = focused;
  }, [focused]);

  // Animate gradient when focused state changes
  useEffect(() => {
    gradientProgress.value = withTiming(focused ? 1 : 0, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  // Animate gradient colors using opacity overlay approach
  const inactiveGradientOpacity = useAnimatedStyle(() => {
    return {
      opacity: 1 - gradientProgress.value,
    };
  });

  const activeGradientOpacity = useAnimatedStyle(() => {
    return {
      opacity: gradientProgress.value,
    };
  });

  return (
    <View style={styles.centerButtonContainer}>
      <Animated.View style={[styles.centerButtonWrapper, animatedStyle]}>
        <View style={styles.centerButton}>
          {/* Inactive gradient (gray) */}
          <AnimatedLinearGradient
            colors={["#979797", "#979797"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, inactiveGradientOpacity]}
          />
          {/* Active gradient (colorful) */}
          <AnimatedLinearGradient
            colors={["#28D4FA", "#D229FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[StyleSheet.absoluteFill, activeGradientOpacity]}
          />
          <View style={styles.centerButtonIcon}>
            <AnimateMemoriesTabsLogo height={16} width={16} />
            <View style={styles.centerButtonDot} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

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
          borderTopLeftRadius: 10,
          borderTopRightRadius: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
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
            <AnimatedIconWrapper focused={focused}>
              <View style={styles.iconContainer}>
                {focused ? <HomeIcon /> : <HomeIcon color={color} />}
              </View>
            </AnimatedIconWrapper>
          ),
        }}
      />
      <Tabs.Screen
        name="gallery"
        options={{
          title: "Gallery",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIconWrapper focused={focused}>
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
            </AnimatedIconWrapper>
          ),
        }}
      />
      <Tabs.Screen
        name="animate"
        options={{
          title: "Create",
          tabBarIcon: ({ focused }) => <CreateButton focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="credit"
        options={{
          title: "Credit",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIconWrapper focused={focused}>
              <View style={styles.iconContainer}>
                {focused ? <CreditIcon /> : <CreditIcon color={color} />}
              </View>
            </AnimatedIconWrapper>
          ),
        }}
      />
      <Tabs.Screen
        name="you"
        options={{
          title: "You",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedIconWrapper focused={focused}>
              <View style={styles.iconContainer}>
                {focused ? <YouIcon /> : <YouIcon color={color} />}
              </View>
            </AnimatedIconWrapper>
          ),
        }}
      />
      {/* Hide these screens from tab bar */}
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="help"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="privacy-legal"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  centerButtonWrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
  },
  centerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
    elevation: 4,
  },
  centerButtonIcon: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  centerButtonIconText: {
    fontSize: 17,
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
