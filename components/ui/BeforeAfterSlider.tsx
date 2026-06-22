import React, { useEffect, useRef } from "react";
import { View, Image, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
} from "react-native-reanimated";

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  width: number;
  height: number;
  autoSlide?: boolean;
  autoSlideInterval?: number;
}

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  width,
  height,
  autoSlide = true,
  autoSlideInterval = 4000,
}: BeforeAfterSliderProps) {
  // Use a progress value from 0 to 1 (0 = top, 1 = bottom, 0.5 = center)
  const progress = useSharedValue(0.5);
  const intervalRef = useRef<NodeJS.Timeout>();
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (!autoSlide || hasStartedRef.current) return;
    hasStartedRef.current = true;

    // Start animation after the interval delay
    const startTimeout = setTimeout(() => {
      const animate = () => {
        progress.value = withSequence(
          withTiming(1, { duration: 1500 }), // Move to bottom
          withTiming(0, { duration: 1500 }), // Move to top
          withTiming(0.5, { duration: 1000 }) // Return to center
        );
      };

      animate();

      // Continue with interval
      intervalRef.current = setInterval(() => {
        animate();
      }, autoSlideInterval);
    }, autoSlideInterval);

    return () => {
      clearTimeout(startTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoSlide, autoSlideInterval]);

  // Animate the before image position using translateY
  // When progress = 0: image at top (translateY = 0, showing top part)
  // When progress = 0.5: image at center (translateY = -height/2, showing center)
  // When progress = 1: image at bottom (translateY = -height, showing bottom part)
  const beforeImageStyle = useAnimatedStyle(() => {
    // Calculate translateY: at progress 0, we want to show top (translateY = 0)
    // At progress 1, we want to show bottom (translateY = -height)
    const translateY = -progress.value * height;

    return {
      transform: [{ translateY }],
    };
  });

  // Handle position follows the progress
  const handleStyle = useAnimatedStyle(() => {
    return {
      top: progress.value * height - 2,
    };
  });

  return (
    <View style={[styles.container, { width, height }]}>
      {/* After Image - Always visible as background */}
      <Image
        source={{ uri: afterImage }}
        style={[styles.image, { width, height }]}
        resizeMode="cover"
      />

      {/* Before Image Container - Fixed size with overflow hidden */}
      <View style={[styles.beforeContainer, { width, height }]}>
        <Animated.View style={beforeImageStyle}>
          <Image
            source={{ uri: beforeImage }}
            style={[styles.image, { width, height }]}
            resizeMode="cover"
          />
        </Animated.View>
      </View>

      {/* Slider Handle */}
      <Animated.View style={[styles.handle, { width }, handleStyle]}>
        <LinearGradient
          colors={["#28D4FA", "#D229FF"]}
          style={styles.handleGradient}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  beforeContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    overflow: "hidden",
  },
  handle: {
    position: "absolute",
    left: 0,
    height: 4,
    zIndex: 10,
  },
  handleGradient: {
    height: 4,
    width: "100%",
  },
});
