import { Tabs } from "expo-router";
import { PlatformPressable } from '@react-navigation/elements';
import { BottomTabBar } from "@react-navigation/bottom-tabs";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import React, { useEffect, useMemo, useRef } from "react";
import { Platform, StyleSheet, View, Text, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GlassView, isLiquidGlassAvailable } from "@/lib/glassEffect";
import MaskedView from "@react-native-masked-view/masked-view";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
} from "react-native-reanimated";

import { HapticTab } from "@/components/HapticTab";
import GlassTabBackground from "@/components/ui/TabBarBackground";
import AnimateMemoriesTabsLogo from "@/components/images/AnimateMemoriesTabsLogo";
import HomeIcon from "@/components/images/HomeIcon";
import GalleryIcon from "@/components/images/GalleryIcon";
import CreditIcon from "@/components/images/CreditIcon";
import YouIcon from "@/components/images/YouIcon";
import { getFontFamily } from "@/constants/Fonts";
import TourStepWrapper from "@/components/tour/TourStepWrapper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTour } from "@/contexts/TourContext";

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

// Custom tab bar: keeps the default bar (labels, haptics, create button, tour
// blocking) and renders the Liquid Glass background + sliding active-tab oval
// behind it.
function GlassTabBar(props: BottomTabBarProps) {
  "use no memo";

  const focusedKey = props.state.routes[props.state.index].key;
  const focusedOptions = props.descriptors[focusedKey].options;

  // Only tabs that actually render take space.
  const VISIBLE_TABS = ["index", "gallery", "animate", "credit", "you"];
  const visibleRoutes = props.state.routes.filter((route) => {
    return VISIBLE_TABS.includes(route.name);
  });
  const visibleIndex = Math.max(
    0,
    visibleRoutes.findIndex((route) => route.key === focusedKey)
  );

  // Align the glass background to the same rect as the bar by reusing the
  // shared tabBarStyle, minus shadow/zIndex so we don't double-render them.
  const barStyle = focusedOptions.tabBarStyle;
  const bgStyle: ViewStyle | undefined = barStyle
    ? ({
        ...StyleSheet.flatten(barStyle),
        shadowColor: undefined,
        shadowOffset: undefined,
        shadowOpacity: undefined,
        shadowRadius: undefined,
        elevation: undefined,
        zIndex: undefined,
        paddingTop: 0,
        paddingBottom: 0,
        paddingLeft: 0,
        paddingRight: 0,
        paddingHorizontal: 0,
      } as ViewStyle)
    : undefined;

  const filteredProps = {
    ...props,
    state: {
      ...props.state,
      routes: visibleRoutes,
    },
  };

  // BottomTabBar insets its item row by paddingHorizontal: max(insets.left,
  // insets.right). Pass the same value so the pill centers on the real tabs.
  const itemInset = Math.max(props.insets.left, props.insets.right);

  return (
    <>
      <GlassTabBackground
        style={bgStyle}
        visibleIndex={visibleIndex}
        tabCount={visibleRoutes.length}
        itemInset={itemInset}
      />
      <BottomTabBar {...filteredProps} />
    </>
  );
}

// Wrapper for tab icons. The active sliding liquid glass pill is rendered by GlassTabBackground.
const AnimatedIconWrapper = ({
  children,
}: {
  children: React.ReactNode;
  focused?: boolean;
}) => {
  return <View style={styles.tabItemContainer}>{children}</View>;
};

const CreateButton = ({ focused }: { focused: boolean }) => {
  const { isActive, currentStep } = useTour();
  const isTourStep1 = isActive && currentStep === 1;
  const liquidGlass = useMemo(() => isLiquidGlassAvailable(), []);
  const scale = useSharedValue(1);
  const glow = useSharedValue(1);
  const gradientProgress = useSharedValue(focused || isTourStep1 ? 1 : 0);
  const prevFocusedRef = useRef<boolean | null>(null);

  // Pulse animation for tour
  useEffect(() => {
    if (isTourStep1) {
      glow.value = withRepeat(withTiming(1.2, { duration: 1000 }), -1, true);
    } else {
      glow.value = 1;
    }
  }, [isTourStep1]);

  // Bouncy animation when tab becomes focused
  useEffect(() => {
    if (prevFocusedRef.current !== null) {
      if (focused && !prevFocusedRef.current) {
        scale.value = withSequence(
          withSpring(1.3, {
            damping: 5,
            stiffness: 240,
            mass: 0.6,
          }),
          withSpring(1, {
            damping: 8,
            stiffness: 300,
            mass: 0.5,
          })
        );
      } else if (!focused) {
        scale.value = withTiming(1, { duration: 200 });
      }
    }
    prevFocusedRef.current = focused;
  }, [focused]);

  // Animate gradient when focused state changes
  useEffect(() => {
    gradientProgress.value = withTiming(focused || isTourStep1 ? 1 : 0, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
  }, [focused, isTourStep1]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glow.value }],
    opacity: isTourStep1 ? 0.5 : 0,
  }));

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
      <Animated.View
        style={[
          styles.centerButtonWrapper,
          animatedStyle,
        ]}
      >
        {isTourStep1 && (
          <>
            <View style={styles.spotlightBackdrop} pointerEvents="none" />
            <Animated.View style={[styles.centerButtonGlow, glowStyle]} />
          </>
        )}
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
            <AnimateMemoriesTabsLogo height={22} width={22} />
            <View style={styles.centerButtonDot} />
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

export default function TabLayout() {
  const createTourBlockerListener = () => ({
    tabPress: (e: any) => {
      try {
        const { isActive } = require("@/contexts/TourContext").useTour();
        if (isActive) {
          e.preventDefault();
        }
      } catch (err) {}
    },
  });

  const { isActive, currentStep } = useTour();
  const insets = useSafeAreaInsets();
  const liquidGlass = useMemo(() => isLiquidGlassAvailable(), []);

  const isIos = Platform.OS === "ios";

  // iOS floating glass pill / Android clean bottom bar
  const tabBarStyle: any = isIos
    ? {
        position: "absolute",
        bottom: 14,
        left: 12,
        right: 12,
        borderTopWidth: 0,
        backgroundColor: "transparent",
        zIndex: 1000,
        elevation: 1000,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        height: 68 + (insets.bottom > 24 ? Math.max(insets.bottom - 26, 8) : 16),
        paddingBottom: insets.bottom > 24 ? 10 : 16,
        paddingTop: 8,
        paddingHorizontal: 12,
        borderRadius: 28,
      }
    : {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        borderTopWidth: 0,
        backgroundColor: "#FFFFFF",
        zIndex: 1000,
        elevation: 1000,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
        height: 65 + Math.max(insets.bottom, 16),
        paddingBottom: Math.max(insets.bottom, 16),
        paddingTop: 10,
        borderRadius: 10,
        marginHorizontal: 0,
        marginBottom: 0,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
      };

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={GlassTabBar}
        screenOptions={{
          tabBarActiveTintColor: "#282828",
          tabBarInactiveTintColor: "#979797",
          headerShown: false,
          tabBarStyle,
          tabBarLabelStyle: {
            fontSize: 13,
            fontFamily: getFontFamily("500"),
            marginTop: 4,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
        }}
      >
      <Tabs.Screen
        name="index"
        listeners={createTourBlockerListener}
        options={{
          title: "Home",
          tabBarButton: HapticTab,
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
        listeners={createTourBlockerListener}
        options={{
          title: "Gallery",
          tabBarButton: HapticTab,
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
        listeners={() => ({
          tabPress: (e: any) => {
            try {
              const { isActive, currentStep, nextStep } = require("@/contexts/TourContext").useTour();
              if (isActive && currentStep === 1) {
                nextStep();
              } else if (isActive) {
                e.preventDefault();
              }
            } catch (err) {}
          },
        })}
        options={{
          title: "Create",
          tabBarIcon: ({ focused }) => <CreateButton focused={focused} />,
          tabBarButton: (props) => (
             <PlatformPressable
               {...props}
               disabled={isActive && currentStep > 1}
               onPressIn={(ev) => {
                 if (process.env.EXPO_OS === 'ios') {
                   require('expo-haptics').impactAsync(
                     require('expo-haptics').ImpactFeedbackStyle.Light
                   );
                 }
                 props.onPressIn?.(ev);
               }}
             />
          ),
        }}
      />
      <Tabs.Screen
        name="credit"
        listeners={createTourBlockerListener}
        options={{
          title: "Credit",
          tabBarButton: HapticTab,
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
        listeners={createTourBlockerListener}
        options={{
          title: "You",
          tabBarButton: HapticTab,
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
    </View>
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
    width: 52,
    height: 52,
    marginTop: -26,
    zIndex: 2000,
    elevation: 2000,
  },
  centerButtonGlow: {
    position: "absolute",
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#28D4FA",
    shadowColor: "#D229FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },
  spotlightBackdrop: {
    position: "absolute",
    top: -1000,
    bottom: -1000,
    left: -1000,
    right: -1000,
    borderWidth: 1000,
    borderColor: "rgba(15, 23, 42, 0.65)",
    borderRadius: 1026, // 26 is half of 52 (button size)
    zIndex: -1,
  },
  centerButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    position: "relative",
    elevation: 0,
    shadowOpacity: 0,
  },
  centerButtonIcon: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  centerButtonIconText: {
    fontSize: 19,
    fontFamily: getFontFamily("600"),
    color: "#fff",
  },
  centerButtonDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#fff",
    marginTop: 3,
  },
  iconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  tabItemContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 48,
    height: 40,
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
