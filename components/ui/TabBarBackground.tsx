import React, { useEffect, useMemo, useRef, useState } from "react";
import { Platform, StyleProp, StyleSheet, View, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { GlassView, isLiquidGlassAvailable } from "@/lib/glassEffect";

const ACTIVE_OVAL_WIDTH = 52;
const ACTIVE_OVAL_HEIGHT = 34;

export default function GlassTabBackground({
  style,
  visibleIndex = 0,
  tabCount = 5,
  itemInset = 0,
}: {
  style?: StyleProp<ViewStyle>;
  visibleIndex?: number;
  tabCount?: number;
  itemInset?: number;
}) {
  const liquidGlass = useMemo(() => isLiquidGlassAvailable(), []);
  const [barWidth, setBarWidth] = useState(0);
  const ovalX = useSharedValue(0);
  const ovalScale = useSharedValue(visibleIndex === 2 ? 0 : 1);
  const hasMeasured = useRef(false);

  useEffect(() => {
    if (barWidth <= 0 || tabCount <= 0) return;

    // The item row inside BottomTabBar spans the bar minus its horizontal
    // padding (paddingHorizontal: max(insets.left, insets.right)), and each
    // tab is flex:1 within that row. Center the oval over the active tab.
    const itemRowWidth = barWidth - itemInset * 2;
    const tabWidth = itemRowWidth / tabCount;
    // Exactly center the 52px oval over the active tab's icon
    const target =
      itemInset + tabWidth * visibleIndex + (tabWidth - ACTIVE_OVAL_WIDTH) / 2;
    const targetScale = visibleIndex === 2 ? 0 : 1; // Hide on Create tab

    if (!hasMeasured.current) {
      ovalX.value = target;
      ovalScale.value = targetScale;
      hasMeasured.current = true;
    } else {
      ovalX.value = withSpring(target, {
        damping: 20,
        stiffness: 180,
        mass: 0.7,
      });
      ovalScale.value = withSpring(targetScale, {
        damping: 18,
        stiffness: 180,
        mass: 0.7,
      });
    }
  }, [visibleIndex, barWidth, tabCount, itemInset]);

  const ovalStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: ovalX.value },
      { scale: ovalScale.value },
    ],
  }));

  const isIos = Platform.OS === "ios";

  return (
    <View
      pointerEvents="none"
      style={style}
      onLayout={(e) => {
        setBarWidth(e.nativeEvent.layout.width);
      }}
    >
      {liquidGlass ? (
        <GlassView
          style={styles.glassBackground}
          glassEffectStyle="regular"
          tintColor="#FFFFFF"
        />
      ) : isIos ? (
        <BlurView
          intensity={90}
          tint="systemMaterialLight"
          style={styles.blurBackground}
        />
      ) : (
        <View style={styles.solidBackground} />
      )}

      {barWidth > 0 && (
        <Animated.View
          style={[
            styles.activeOval,
            { top: isIos ? 15 : 12 },
            ovalStyle,
          ]}
        >
          {liquidGlass ? (
            <GlassView
              style={styles.activeOvalGlass}
              glassEffectStyle="regular"
              tintColor="rgba(255, 255, 255, 0.65)"
            />
          ) : isIos ? (
            <View style={styles.activeOvalBlur} />
          ) : (
            <View style={styles.activeOvalSolid} />
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  glassBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  blurBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.8)",
    backgroundColor: "rgba(255, 255, 255, 0.72)",
  },
  solidBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#E2E8F0",
  },
  activeOval: {
    position: "absolute",
    left: 0,
    width: ACTIVE_OVAL_WIDTH,
    height: ACTIVE_OVAL_HEIGHT,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  activeOvalGlass: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: ACTIVE_OVAL_HEIGHT / 2,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.9)",
  },
  activeOvalBlur: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: ACTIVE_OVAL_HEIGHT / 2,
    backgroundColor: "rgba(0, 0, 0, 0.045)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.9)",
  },
  activeOvalSolid: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: ACTIVE_OVAL_HEIGHT / 2,
    backgroundColor: "#F1F5F9",
  },
});
