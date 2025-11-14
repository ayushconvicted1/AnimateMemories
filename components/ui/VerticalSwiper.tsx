import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';

interface VerticalSwiperProps {
  beforeImage: string;
  afterImage: string;
  width: number;
  height: number;
  autoSlideInterval?: number;
  transitionDuration?: number;
}

export default function VerticalSwiper({
  beforeImage,
  afterImage,
  width,
  height,
  autoSlideInterval = 3000,
  transitionDuration = 2000,
}: VerticalSwiperProps) {
  // Progress from 0 (top, showing all before) to 1 (bottom, showing all after)
  const progress = useSharedValue(0);
  const hasStarted = useRef(false);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    // Start animation immediately and loop continuously
    // Animate from top (0) to bottom (1) and back to top (0) in a loop
    progress.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: transitionDuration,
          easing: Easing.inOut(Easing.ease),
        }),
        withTiming(0, {
          duration: transitionDuration,
          easing: Easing.inOut(Easing.ease),
        })
      ),
      -1, // Infinite repeat
      false // Don't reverse, just loop
    );

    return () => {
      // Cleanup handled by reanimated
    };
  }, [transitionDuration]);

  // Before image container clips from bottom, revealing after image from top to bottom
  const beforeContainerStyle = useAnimatedStyle(() => {
    // When progress = 0: show all before (height = 100%)
    // When progress = 1: show all after (height = 0%, before fully hidden)
    const containerHeight = (1 - progress.value) * height;
    return {
      height: containerHeight,
    };
  });

  // Slider handle position follows the reveal boundary (bottom of before container)
  const handleStyle = useAnimatedStyle(() => {
    // Handle is at the bottom edge of the before container
    // When progress = 0: handle at bottom (showing all before)
    // When progress = 1: handle at top (showing all after)
    const handleTop = (1 - progress.value) * height - 2; // -2 to center the 4px handle
    return {
      top: handleTop,
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

      {/* Before Image Container - Clips from bottom to reveal after */}
      <Animated.View style={[styles.beforeContainer, { width }, beforeContainerStyle]}>
        <Image
          source={{ uri: beforeImage }}
          style={[styles.image, { width, height }]}
          resizeMode="cover"
        />
      </Animated.View>

      {/* Slider Handle - Moves with the reveal */}
      <Animated.View style={[styles.handle, { width }, handleStyle]}>
        <LinearGradient
          colors={['#28D4FA', '#D229FF']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.handleGradient}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  beforeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  handle: {
    position: 'absolute',
    left: 0,
    height: 4,
    zIndex: 10,
  },
  handleGradient: {
    height: 4,
    width: '100%',
  },
});
