import React, { useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  PanResponder,
  LayoutChangeEvent,
  StyleProp,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

interface CustomSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  allowedValues?: number[];
  onValueChange: (value: number) => void;
  trackHeight?: number;
  activeGradientColors?: [string, string];
  inactiveTrackColor?: string;
  thumbColor?: string;
  thumbSize?: number;
  stopDelayMs?: number;
  style?: StyleProp<ViewStyle>;
}

export default function CustomSlider({
  value,
  min = 0,
  max = 100,
  step = 1,
  allowedValues,
  onValueChange,
  trackHeight = 8,
  activeGradientColors = ["#38BDF8", "#D229FF"],
  inactiveTrackColor = "#CBD5E1",
  thumbColor = "#D229FF",
  thumbSize = 24,
  stopDelayMs = 180,
  style,
}: CustomSliderProps) {
  const trackWidthRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRatioRef = useRef<number>(0);
  const currentRatioRef = useRef<number>(0);
  const lastDispatchedValRef = useRef<number>(value);
  const stopTimerRef = useRef<any>(null);

  // UI-thread driven values: updating these never touches React state or the bridge,
  // so the thumb + active track track the finger at native frame rate.
  const thumbTranslateX = useSharedValue(0);
  const thumbScale = useSharedValue(1);
  const activeTrackWidth = useSharedValue(0);

  const isCustomValues = !!(allowedValues && allowedValues.length > 0);

  const getIndexForValue = (val: number, allowedList?: number[]) => {
    if (!allowedList || allowedList.length === 0) return 0;
    let closestIndex = 0;
    let minDiff = Infinity;
    allowedList.forEach((allowed, index) => {
      const diff = Math.abs(allowed - val);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = index;
      }
    });
    return closestIndex;
  };

  const getRatioForValue = (val: number): number => {
    if (isCustomValues && allowedValues && allowedValues.length > 1) {
      const idx = getIndexForValue(val, allowedValues);
      return Math.max(0, Math.min(1, idx / (allowedValues.length - 1)));
    }
    if (max > min) {
      return Math.max(0, Math.min(1, (val - min) / (max - min)));
    }
    return 0;
  };

  const propsRef = useRef({
    min,
    max,
    step,
    allowedValues,
    isCustomValues,
    onValueChange,
    stopDelayMs,
    value,
  });

  propsRef.current = {
    min,
    max,
    step,
    allowedValues,
    isCustomValues,
    onValueChange,
    stopDelayMs,
    value,
  };

  const applyVisuals = (ratio: number) => {
    const width = trackWidthRef.current;
    if (width <= 0) return;
    const usable = Math.max(0, width - thumbSize);
    thumbTranslateX.value = ratio * usable;
    activeTrackWidth.value = ratio * usable + thumbSize / 2;
  };

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: thumbTranslateX.value },
      { scale: thumbScale.value },
    ],
  }));

  const activeTrackAnimatedStyle = useAnimatedStyle(() => ({
    width: activeTrackWidth.value,
  }));

  // Sync visuals from value prop when not dragging
  useEffect(() => {
    if (!isDraggingRef.current) {
      const ratio = getRatioForValue(value);
      currentRatioRef.current = ratio;
      applyVisuals(ratio);
      lastDispatchedValRef.current = value;
    }
  }, [value, min, max, allowedValues]);

  // Clean up stop timer on unmount
  useEffect(() => {
    return () => {
      if (stopTimerRef.current) clearTimeout(stopTimerRef.current);
    };
  }, []);

  const computeValueFromRatio = (rawRatio: number): number => {
    const { min: curMin, max: curMax, step: curStep, allowedValues: curAllowed, isCustomValues: curIsCustom } = propsRef.current;
    const clamped = Math.max(0, Math.min(1, rawRatio));

    if (curIsCustom && curAllowed && curAllowed.length > 0) {
      const targetIdx = Math.round(clamped * (curAllowed.length - 1));
      const boundedIdx = Math.max(0, Math.min(curAllowed.length - 1, targetIdx));
      return curAllowed[boundedIdx];
    } else {
      const count = Math.round((curMax - curMin) / curStep);
      const stepIdx = Math.round(clamped * count);
      const val = curMin + stepIdx * curStep;
      return Math.max(curMin, Math.min(curMax, val));
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 2;
      },
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        isDraggingRef.current = true;
        thumbScale.value = withSpring(1.15, { damping: 15, stiffness: 300, mass: 0.6 });

        const curRatio = getRatioForValue(propsRef.current.value);
        dragStartRatioRef.current = curRatio;
        currentRatioRef.current = curRatio;
        lastDispatchedValRef.current = propsRef.current.value;
      },
      onPanResponderMove: (_, gestureState) => {
        const width = trackWidthRef.current;
        if (width <= thumbSize) return;

        const effectiveTrack = width - thumbSize;
        const currentRatio = Math.max(0, Math.min(1, dragStartRatioRef.current + gestureState.dx / effectiveTrack));
        currentRatioRef.current = currentRatio;

        // Native-driven visual update: shared-value writes only, zero React overhead.
        applyVisuals(currentRatio);

        // Debounce value dispatch so the expensive parent re-render only happens
        // once the finger rests, not on every move frame.
        if (stopTimerRef.current) {
          clearTimeout(stopTimerRef.current);
        }
        stopTimerRef.current = setTimeout(() => {
          const stoppedVal = computeValueFromRatio(currentRatioRef.current);
          if (stoppedVal !== lastDispatchedValRef.current) {
            lastDispatchedValRef.current = stoppedVal;
            propsRef.current.onValueChange(stoppedVal);
          }
        }, propsRef.current.stopDelayMs);
      },
      onPanResponderRelease: (_, gestureState) => {
        isDraggingRef.current = false;
        if (stopTimerRef.current) {
          clearTimeout(stopTimerRef.current);
        }

        thumbScale.value = withSpring(1, { damping: 15, stiffness: 300, mass: 0.6 });

        const width = trackWidthRef.current;
        const effectiveTrack = width > thumbSize ? width - thumbSize : width;
        const finalRatio = Math.max(0, Math.min(1, dragStartRatioRef.current + gestureState.dx / effectiveTrack));

        const finalVal = computeValueFromRatio(finalRatio);
        lastDispatchedValRef.current = finalVal;
        propsRef.current.onValueChange(finalVal);

        // Snap thumb & progress to exact stepped notch center
        const snappedRatio = getRatioForValue(finalVal);
        currentRatioRef.current = snappedRatio;
        applyVisuals(snappedRatio);
      },
      onPanResponderTerminate: () => {
        isDraggingRef.current = false;
        if (stopTimerRef.current) {
          clearTimeout(stopTimerRef.current);
        }
        thumbScale.value = withSpring(1, { damping: 15, stiffness: 300, mass: 0.6 });
        const snappedRatio = getRatioForValue(propsRef.current.value);
        currentRatioRef.current = snappedRatio;
        applyVisuals(snappedRatio);
      },
    })
  ).current;

  const handleLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    if (width > 0 && width !== trackWidthRef.current) {
      trackWidthRef.current = width;
      const ratio = getRatioForValue(propsRef.current.value);
      currentRatioRef.current = ratio;
      applyVisuals(ratio);
    }
  };

  return (
    <View
      style={[styles.container, style]}
      onLayout={handleLayout}
      {...panResponder.panHandlers}
    >
      {/* Inactive Track Bar */}
      <View
        style={[
          styles.inactiveTrack,
          {
            height: trackHeight,
            borderRadius: trackHeight / 2,
            backgroundColor: inactiveTrackColor,
          },
        ]}
      >
        {/* Active Gradient Track Bar */}
        <Animated.View
          style={[
            styles.activeTrackWrapper,
            {
              height: trackHeight,
              borderRadius: trackHeight / 2,
            },
            activeTrackAnimatedStyle,
          ]}
        >
          <LinearGradient
            colors={activeGradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientFill}
          />
        </Animated.View>
      </View>

      {/* Smooth Continuous Thumb */}
      <Animated.View
        style={[
          styles.thumb,
          {
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            top: (40 - thumbSize) / 2,
            backgroundColor: thumbColor,
          },
          thumbAnimatedStyle,
        ]}
        pointerEvents="none"
      >
        <View style={[styles.thumbInner, { borderRadius: (thumbSize - 8) / 2 }]} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 40,
    justifyContent: "center",
    position: "relative",
  },
  inactiveTrack: {
    width: "100%",
    overflow: "hidden",
    justifyContent: "center",
  },
  activeTrackWrapper: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    overflow: "hidden",
  },
  gradientFill: {
    width: 1000,
    height: "100%",
  },
  thumb: {
    position: "absolute",
    left: 0,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 10,
  },
  thumbInner: {
    width: "50%",
    height: "50%",
    backgroundColor: "#FFFFFF",
  },
});
