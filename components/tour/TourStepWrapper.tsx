import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Animated, Easing } from "react-native";
import { useTour } from "@/contexts/TourContext";
import { getFontFamily } from "@/constants/Fonts";
import { LinearGradient } from "expo-linear-gradient";
import TourArrowDownIcon from "@/components/images/TourArrowDownIcon";
import TourArrowUpIcon from "@/components/images/TourArrowUpIcon";
import PointerIcon from "@/components/images/PointerIcon";
import UploadIcon from "@/components/images/UploadIcon";
import SurpriseMeIcon from "@/components/images/SurpriseMeIcon";
import GenerateIcon from "@/components/images/GenerateIcon";

interface TourStepWrapperProps {
  step: number;
  children: React.ReactNode;
  style?: any;
  tooltipPosition?: "top" | "bottom" | "none";
  overrideTitle?: string;
  overrideDesc?: string;
}

const STEP_DATA: Record<number, { title: string; desc: string; icon?: React.ReactNode }> = {
  1: {
    title: "Start Creating",
    desc: "Action Required: Tap the glowing Create tab below to open the AI generator!",
  },
  2: {
    title: "Upload Your Photo",
    desc: "Action Required: Tap here to upload your photo or pick a sample image to animate!",
    icon: <UploadIcon width={16} height={16} color="#475569" />,
  },
  3: {
    title: "Select Preset or Custom Animation",
    desc: "Action Required: Pick a preset template below or tap 'Custom Prompt' to use AI Surprise Me!",
    icon: <SurpriseMeIcon width={16} height={16} color="#475569" />,
  },
  4: {
    title: "Generate AI Video",
    desc: "Action Required: Tap 'Generate' to bring your photo to life with AI!",
    icon: <GenerateIcon width={16} height={16} color="#475569" />,
  },
};

const TourStepWrapper: React.FC<TourStepWrapperProps> = ({
  step,
  children,
  style,
  tooltipPosition = "bottom",
  overrideTitle,
  overrideDesc,
}) => {
  const { currentStep, isActive, nextStep, endTour } = useTour();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  const isCurrentStep = isActive && currentStep === step;

  useEffect(() => {
    if (isCurrentStep) {
      // Spring entrance
      scaleAnim.setValue(0.85);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }).start();

      // Pulsing border
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.95,
            duration: 700,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0.3,
            duration: 700,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      // Floating bounce loop
      const bounce = Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -5,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 900,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      bounce.start();

      return () => {
        pulse.stop();
        bounce.stop();
      };
    }
  }, [isCurrentStep, pulseAnim, scaleAnim, bounceAnim]);

  if (!isCurrentStep) {
    return style ? <View style={style}>{children}</View> : <>{children}</>;
  }

  const defaultInfo = STEP_DATA[step] || {
    title: `Step ${step}`,
    desc: "",
  };

  const stepTitle = overrideTitle || defaultInfo.title;
  const stepDesc = overrideDesc || defaultInfo.desc;

  const renderTooltip = () => (
    <Animated.View
      style={[
        styles.tooltipCard,
        {
          transform: [{ scale: scaleAnim }, { translateY: bounceAnim }],
        },
      ]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <LinearGradient
          colors={["#28D4FA", "#D229FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.stepBadge}
        >
          <Text style={styles.stepBadgeText}>{`STEP ${step} OF 4`}</Text>
        </LinearGradient>

        {/* Step Progress Dots */}
        <View style={{ flexDirection: "row", gap: 4, alignItems: "center" }}>
          {[1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={{
                width: i === step ? 14 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === step ? "#D229FF" : i < step ? "#38BDF8" : "#CBD5E1",
              }}
            />
          ))}
        </View>
      </View>

      <Text style={styles.tooltipTitle}>{stepTitle}</Text>
      <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 8, paddingRight: 10 }}>
        {defaultInfo.icon && (
          <Animated.View style={{ marginRight: 6, marginTop: 2, transform: [{ translateY: bounceAnim }] }}>
            {defaultInfo.icon}
          </Animated.View>
        )}
        <Text style={[styles.tooltipDesc, { marginBottom: 0 }]}>{stepDesc}</Text>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
        <TouchableOpacity onPress={endTour} style={styles.skipBtn}>
          <Text style={styles.skipBtnText}>Skip Tour</Text>
        </TouchableOpacity>

        {step === 2 && (
          <TouchableOpacity
            onPress={() => nextStep()}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#28D4FA", "#D229FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ paddingVertical: 6, paddingHorizontal: 14, borderRadius: 14 }}
            >
              <Text style={{ fontSize: 12, fontFamily: getFontFamily("700"), color: "#FFFFFF" }}>
                Next: Templates →
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  return (
    <View style={[style, { position: "relative", zIndex: isCurrentStep ? 99 : 1 }]}>
      {children}
      
      {isCurrentStep && (
        <Animated.View
          style={[
            styles.highlightBorder,
            {
              opacity: pulseAnim,
            },
          ]}
          pointerEvents="none"
        />
      )}

      {isCurrentStep && (
        <View style={styles.spotlightBackdrop} pointerEvents="none" />
      )}

      {isCurrentStep && tooltipPosition === "top" && (
        <View style={styles.tooltipContainerTop}>
          {renderTooltip()}
          <View style={{ alignItems: "center", marginTop: -2, zIndex: 1 }}>
            <TourArrowDownIcon color="#FFFFFF" width={24} height={12} />
          </View>
        </View>
      )}

      {isCurrentStep && tooltipPosition === "bottom" && (
        <View style={styles.tooltipContainerBottom}>
          <View style={{ alignItems: "center", marginBottom: -2, zIndex: 1 }}>
            <TourArrowUpIcon color="#FFFFFF" width={24} height={12} />
          </View>
          {renderTooltip()}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  highlightBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: "#D229FF",
    zIndex: 10,
  },
  spotlightBackdrop: {
    position: "absolute",
    top: -1000,
    bottom: -1000,
    left: -1000,
    right: -1000,
    borderWidth: 1000,
    borderColor: "rgba(15, 23, 42, 0.65)",
    borderRadius: 1018,
    zIndex: 5,
  },
  tooltipContainerTop: {
    position: "absolute",
    bottom: "100%",
    left: 0,
    right: 0,
    paddingBottom: 10,
    zIndex: 100,
  },
  tooltipContainerBottom: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    paddingTop: 10,
    zIndex: 100,
  },
  tooltipCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  stepBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  stepBadgeText: {
    fontSize: 10,
    fontFamily: getFontFamily("800"),
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  tooltipTitle: {
    fontSize: 15,
    fontFamily: getFontFamily("700"),
    color: "#0F172A",
    marginBottom: 4,
  },
  tooltipDesc: {
    fontSize: 13,
    fontFamily: getFontFamily("400"),
    color: "#475569",
    lineHeight: 18,
    marginBottom: 8,
  },
  skipRowRight: {
    alignSelf: "flex-end",
  },
  skipBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  skipBtnText: {
    fontSize: 12.5,
    fontFamily: getFontFamily("500"),
    color: "#64748B",
  },
});

export default TourStepWrapper;
