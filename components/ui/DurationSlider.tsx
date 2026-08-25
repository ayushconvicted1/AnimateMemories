import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import CustomSlider from "./CustomSlider";
import { getFontFamily } from "@/constants/Fonts";

interface DurationSliderProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  allowedValues?: number[];
  onValueChange: (value: number) => void;
}

export default function DurationSlider({
  value,
  min = 4,
  max = 10,
  step = 1,
  allowedValues,
  onValueChange,
}: DurationSliderProps) {
  const [displayValue, setDisplayValue] = useState<number>(value);

  useEffect(() => {
    setDisplayValue(value);
  }, [value]);

  const handleChange = (newVal: number) => {
    setDisplayValue(newVal);
    onValueChange(newVal);
  };

  const isCustomValues = allowedValues && allowedValues.length > 0;

  // When only 2 options exist (e.g. [5, 10] for Kling v2.1), render a space-saving radio button
  if (isCustomValues && allowedValues?.length === 2) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Duration</Text>
          <LinearGradient
            colors={["#28D4FA", "#D229FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.valueBadge}
          >
            <Text style={styles.valueBadgeText}>{displayValue} Seconds</Text>
          </LinearGradient>
        </View>

        {/* Radio Type Button for 2 Entries */}
        <View style={styles.radioContainer}>
          {allowedValues.map((val) => {
            const isSelected = displayValue === val;
            return (
              <TouchableOpacity
                key={val}
                style={[styles.radioOption, isSelected && styles.radioOptionSelected]}
                onPress={() => handleChange(val)}
                activeOpacity={0.8}
              >
                {isSelected ? (
                  <LinearGradient
                    colors={["#38BDF8", "#A855F7", "#D229FF"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.radioActiveGradient}
                  >
                    <View style={styles.radioDotOuterActive}>
                      <View style={styles.radioDotInnerActive} />
                    </View>
                    <Text style={styles.radioTextActive}>{val} Seconds</Text>
                  </LinearGradient>
                ) : (
                  <View style={styles.radioInactiveInner}>
                    <View style={styles.radioDotOuterInactive} />
                    <Text style={styles.radioTextInactive}>{val} Seconds</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }

  const ticks: number[] = isCustomValues
    ? allowedValues!
    : (() => {
        const arr = [];
        for (let i = min; i <= max; i += step) {
          arr.push(i);
        }
        return arr;
      })();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Duration</Text>
        <LinearGradient
          colors={["#28D4FA", "#D229FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.valueBadge}
        >
          <Text style={styles.valueBadgeText}>{displayValue} Seconds</Text>
        </LinearGradient>
      </View>

      {/* Broad Smooth Slider Track Container */}
      <View style={styles.sliderWrapper}>
        <CustomSlider
          key={`${min}_${max}_${allowedValues ? allowedValues.join(",") : "cont"}`}
          min={min}
          max={max}
          step={step}
          allowedValues={allowedValues}
          value={displayValue}
          onValueChange={handleChange}
          stopDelayMs={180}
          trackHeight={8}
          activeGradientColors={["#38BDF8", "#D229FF"]}
          inactiveTrackColor="#CBD5E1"
          thumbColor="#D229FF"
          thumbSize={24}
        />
      </View>

      {/* Interactive Step Buttons */}
      <View style={styles.tickContainer}>
        {ticks.map((tickVal) => {
          const isSelected = displayValue === tickVal;
          return (
            <TouchableOpacity
              key={tickVal}
              style={[styles.tickButton, isSelected && styles.tickButtonActive]}
              onPress={() => handleChange(tickVal)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tickText, isSelected && styles.tickTextActive]}>
                {tickVal}s
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontFamily: getFontFamily("600"),
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  valueBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  valueBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: getFontFamily("600"),
  },
  radioContainer: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 3,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  radioOption: {
    flex: 1,
    borderRadius: 9,
    overflow: "hidden",
  },
  radioOptionSelected: {
    shadowColor: "#D229FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  radioActiveGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 9,
    gap: 8,
  },
  radioInactiveInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 9,
    backgroundColor: "#FFFFFF",
    gap: 8,
  },
  radioDotOuterActive: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  radioDotInnerActive: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#FFFFFF",
  },
  radioDotOuterInactive: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#94A3B8",
    backgroundColor: "transparent",
  },
  radioTextActive: {
    fontSize: 14,
    fontFamily: getFontFamily("700"),
    color: "#FFFFFF",
  },
  radioTextInactive: {
    fontSize: 14,
    fontFamily: getFontFamily("600"),
    color: "#334155",
  },
  sliderWrapper: {
    width: "100%",
    height: 36,
    justifyContent: "center",
  },
  tickContainer: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
  },
  tickButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  tickButtonActive: {
    backgroundColor: "#FAF5FF",
    borderColor: "#D229FF",
  },
  tickText: {
    fontSize: 12,
    fontFamily: getFontFamily("600"),
    color: "#64748B",
  },
  tickTextActive: {
    color: "#D229FF",
    fontFamily: getFontFamily("700"),
  },
});
