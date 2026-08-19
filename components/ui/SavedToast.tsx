import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { getFontFamily } from "@/constants/Fonts";

interface SavedToastProps {
  /** Non-null shows the toast; set back to null to dismiss it. */
  title: string | null;
  /** Optional save location shown under the title. */
  path?: string | null;
  /** Called after the dismiss animation completes. */
  onHide?: () => void;
}

/**
 * Animated success toast shown after a file is saved to the device.
 * Pops in with a spring (scale + fade + slide), shows a green checkmark with
 * the title and save location, then fades out on its own after ~3 seconds.
 */
export default function SavedToast({ title, path, onHide }: SavedToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.7)).current;
  const translateY = useRef(new Animated.Value(14)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onHideRef = useRef(onHide);
  onHideRef.current = onHide;

  useEffect(() => {
    if (!title) return;

    opacity.setValue(0);
    scale.setValue(0.7);
    translateY.setValue(14);

    // Pop in
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Fade out after a moment
    timerRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.85,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start(() => onHideRef.current?.());
    }, 2800);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [title, opacity, scale, translateY]);

  if (!title) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { opacity, transform: [{ translateY }, { scale }] }]}
    >
      <View style={styles.checkCircle}>
        <Text style={styles.checkMark}>✓</Text>
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.title}>{title}</Text>
        {path ? (
          <Text style={styles.path} numberOfLines={2}>
            {path}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 24,
    right: 24,
    bottom: 104,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.96)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  checkCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkMark: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "600",
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: 17,
    fontFamily: getFontFamily("600"),
  },
  path: {
    color: "#A5B4CF",
    fontSize: 14,
    fontFamily: getFontFamily("400"),
    marginTop: 2,
  },
});
