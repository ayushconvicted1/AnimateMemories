import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Image,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { getFontFamily } from "@/constants/Fonts";

const BRAND_GRADIENT = ["#38BDF8", "#A855F7", "#D229FF"] as const;
const PHOTO_SIZE = 128;
const BEAM_HEIGHT = 40;

const TIPS = [
  "Tip: Faces that are large, sharp and well-lit animate best — crop tight on the subject.",
  "Tip: Custom prompts unlock unique results. Try “smiling softly, hair blowing in the wind”.",
  "Tip: HD (720p) is the sweet spot for most videos — 1080p costs extra credits.",
  "Tip: Some AI models are faster, others more expressive — try a couple to find your style.",
  "Fun fact: Our engines can bring a single photo to life with up to 10 seconds of motion.",
];

type PhaseIcon = React.ComponentProps<typeof MaterialIcons>["name"];

const PHASES: { at: number; icon: PhaseIcon; title: string; sub: string }[] = [
  { at: 0, icon: "cloud-upload", title: "Uploading your photo", sub: "Securely sending your image to the AI studio" },
  { at: 18, icon: "memory", title: "Waking up the AI", sub: "Loading the generation engine" },
  { at: 38, icon: "face", title: "Analyzing your photo", sub: "Studying faces, motion and composition" },
  { at: 60, icon: "auto-awesome", title: "Working its magic", sub: "Applying the AI transformation frame by frame" },
  { at: 82, icon: "movie", title: "Polishing the result", sub: "Final quality pass before delivery" },
];

const TITLES: Record<string, { title: string; sub: string }> = {
  animate: { title: "Generating Video", sub: "Your photo is coming to life" },
  restore: { title: "Restoring Photo", sub: "Healing scratches, tears and fading" },
  enhance: { title: "Enhancing Photo", sub: "Boosting sharpness, color and detail" },
};

function formatElapsed(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function GeneratingModal({
  visible,
  tool,
  photo,
  progress,
}: {
  visible: boolean;
  tool: "restore" | "animate" | "enhance" | null;
  photo?: string | null;
  /**
   * Real progress (0-100) reported by the backend while a job runs.
   * When null/undefined the modal falls back to its smooth estimate so
   * tools without a progress endpoint (restore/enhance) still animate.
   */
  progress?: number | null;
}) {
  const scanAnim = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  const [simulatedProgress, setSimulatedProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  const hasRealProgress = typeof progress === "number";

  useEffect(() => {
    if (!visible) {
      scanAnim.stopAnimation();
      ringAnim.stopAnimation();
      shimmerAnim.stopAnimation();
      return;
    }

    setSimulatedProgress(0);
    setElapsed(0);
    setTipIndex(0);
    scanAnim.setValue(0);
    ringAnim.setValue(0);
    shimmerAnim.setValue(0);

    Animated.loop(
      Animated.timing(scanAnim, { toValue: 1, duration: 2400, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.timing(ringAnim, { toValue: 1, duration: 5000, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.timing(shimmerAnim, { toValue: 1, duration: 1600, useNativeDriver: false })
    ).start();

    // Only run the fake progress timer when no real progress is available.
    let progressTimer: ReturnType<typeof setInterval> | null = null;
    if (!hasRealProgress) {
      progressTimer = setInterval(() => {
        setSimulatedProgress((prev) => {
          if (prev >= 97) return prev;
          const remaining = 97 - prev;
          return prev + Math.max(0.4, remaining * 0.08);
        });
      }, 1200);
    }
    const elapsedTimer = setInterval(() => setElapsed((e) => e + 1), 1000);
    const tipTimer = setInterval(() => setTipIndex((i) => (i + 1) % TIPS.length), 4500);

    return () => {
      if (progressTimer) clearInterval(progressTimer);
      clearInterval(elapsedTimer);
      clearInterval(tipTimer);
    };
  }, [visible, hasRealProgress, scanAnim, ringAnim, shimmerAnim]);

  const pct = Math.min(
    100,
    Math.max(0, Math.round(hasRealProgress ? progress : simulatedProgress))
  );
  let activePhase = PHASES[0];
  for (const phase of PHASES) {
    if (pct >= phase.at) activePhase = phase;
  }
  const t = TITLES[tool ?? "animate"] ?? TITLES.animate;

  const scanTranslateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-BEAM_HEIGHT * 1.5, BEAM_HEIGHT * 4.5],
  });
  const ringRotate = ringAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const shimmerLeft = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-60%", "100%"],
  });

  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <LinearGradient
            colors={BRAND_GRADIENT as unknown as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topBar}
          />

          <View style={styles.cardBody}>
            {/* Photo with scanning beam + spinning ring */}
            <View style={styles.photoWrap}>
              <Animated.View
                style={[styles.ring, { transform: [{ rotate: ringRotate }] }]}
              />
              <View style={styles.photoBox}>
                {photo ? (
                  <Image source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
                ) : (
                  <LinearGradient
                    colors={["#EDE9FF", "#FCE7F3"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.photoPlaceholder}
                  >
                    <MaterialIcons name="photo" size={36} color="#A78BFA" />
                  </LinearGradient>
                )}
                <Animated.View
                  style={[styles.scanBeam, { transform: [{ translateY: scanTranslateY }] }]}
                >
                  <LinearGradient
                    colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.65)", "rgba(255,255,255,0)"]}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              </View>
            </View>

            {/* Title */}
            <Text style={styles.title}>{t.title}…</Text>
            <Text style={styles.subtitle}>{t.sub}</Text>

            {/* Progress */}
            <View style={styles.progressSection}>
              <View style={styles.phaseRow}>
                <View style={styles.phaseLeft}>
                  <MaterialIcons name={activePhase.icon} size={14} color="#8B5CF6" />
                  <Text style={styles.phaseText}>{activePhase.title}</Text>
                </View>
                <Text style={styles.percent}>{pct}%</Text>
              </View>

              <View style={styles.track}>
                <LinearGradient
                  colors={BRAND_GRADIENT as unknown as [string, string, ...string[]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.fill, { width: `${pct}%` }]}
                />
                <Animated.View style={[styles.shimmer, { left: shimmerLeft }]}>
                  <LinearGradient
                    colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.5)", "rgba(255,255,255,0)"]}
                    style={StyleSheet.absoluteFill}
                  />
                </Animated.View>
              </View>

              <Text style={styles.phaseSub}>{activePhase.sub}</Text>
            </View>

            {/* Elapsed time */}
            <View style={styles.elapsedRow}>
              <MaterialIcons name="timer" size={12} color="#8B5CF6" />
              <Text style={styles.elapsedText}>
                {formatElapsed(elapsed)} elapsed ·{" "}
                {tool === "animate"
                  ? "video generation can take a minute or two"
                  : "AI processing usually takes under a minute"}
              </Text>
            </View>

            {/* Rotating tip */}
            <View style={styles.tipBox}>
              <MaterialIcons name="lightbulb" size={15} color="#F59E0B" />
              <Text style={styles.tipText}>{TIPS[tipIndex]}</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(7, 3, 31, 0.88)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.25,
    shadowRadius: 28,
    elevation: 16,
  },
  topBar: {
    height: 5,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
  },
  cardBody: {
    padding: 24,
    alignItems: "center",
  },
  photoWrap: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
  },
  ring: {
    position: "absolute",
    width: PHOTO_SIZE + 16,
    height: PHOTO_SIZE + 16,
    top: -8,
    left: -8,
    borderRadius: (PHOTO_SIZE + 16) / 2,
    borderWidth: 3,
    borderColor: "transparent",
    borderTopColor: "#38BDF8",
    borderRightColor: "#D229FF",
  },
  photoBox: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#F3F0FF",
    borderWidth: 3,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scanBeam: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    height: BEAM_HEIGHT,
  },
  title: {
    marginTop: 22,
    fontSize: 21,
    fontFamily: getFontFamily("700"),
    color: "#0F172A",
    textAlign: "center",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 15,
    fontFamily: getFontFamily("400"),
    color: "#64748B",
    textAlign: "center",
  },
  progressSection: {
    width: "100%",
    marginTop: 22,
  },
  phaseRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  phaseLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 1,
  },
  phaseText: {
    fontSize: 13.5,
    fontFamily: getFontFamily("600"),
    color: "#7C3AED",
  },
  percent: {
    fontSize: 14,
    fontFamily: getFontFamily("700"),
    color: "#1E293B",
  },
  track: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 4,
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: "60%",
  },
  phaseSub: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: getFontFamily("400"),
    color: "#94A3B8",
  },
  elapsedRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  elapsedText: {
    fontSize: 12.5,
    fontFamily: getFontFamily("600"),
    color: "#94A3B8",
  },
  tipBox: {
    marginTop: 16,
    width: "100%",
    backgroundColor: "#FAF7FF",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.18)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: getFontFamily("500"),
    color: "#475569",
  },
});
