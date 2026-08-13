import React from "react";
import { View, Text, StyleSheet, Platform, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Slider from "@react-native-community/slider";
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
  
  const isCustomValues = allowedValues && allowedValues.length > 0;
  const sliderMin = isCustomValues ? 0 : min;
  const sliderMax = isCustomValues ? allowedValues.length - 1 : max;
  const sliderStep = isCustomValues ? 1 : step;
  
  const getIndexForValue = (val: number) => {
    if (!allowedValues) return 0;
    let closestIndex = 0;
    let minDiff = Infinity;
    allowedValues.forEach((allowed, index) => {
      const diff = Math.abs(allowed - val);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = index;
      }
    });
    return closestIndex;
  };
  
  const sliderValue = isCustomValues ? getIndexForValue(value) : value;

  const handleValueChange = (val: number) => {
    if (isCustomValues) {
      onValueChange(allowedValues![val]);
    } else {
      onValueChange(val);
    }
  };

  const displayValue = isCustomValues ? allowedValues![sliderValue] : value;

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

      {/* Slider Track Container */}
      <View style={styles.sliderWrapper}>
        <Slider
          style={styles.slider}
          minimumValue={sliderMin}
          maximumValue={sliderMax}
          step={sliderStep}
          value={sliderValue}
          onValueChange={handleValueChange}
          minimumTrackTintColor="#D229FF"
          maximumTrackTintColor="#E5E7EB"
          thumbTintColor="#D229FF"
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
              onPress={() => onValueChange(tickVal)}
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
    marginVertical: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
    fontFamily: getFontFamily("700"),
  },
  valueBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  valueBadgeText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    fontFamily: getFontFamily("600"),
  },
  sliderWrapper: {
    width: "100%",
    height: 40,
    justifyContent: "center",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  tickContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },
  tickButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    minWidth: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  tickButtonActive: {
    backgroundColor: "#D229FF",
  },
  tickText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    fontFamily: getFontFamily("600"),
  },
  tickTextActive: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontFamily: getFontFamily("700"),
  },
});

