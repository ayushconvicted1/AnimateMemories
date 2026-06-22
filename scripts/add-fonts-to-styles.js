/**
 * Helper script to add Outfit font family to all StyleSheet definitions
 * This script can be run to automatically add fontFamily based on fontWeight
 *
 * Usage: This is a reference script. You can use it to understand the pattern
 * for adding fonts to styles.
 */

// Example pattern for adding fonts:
// Before:
//   textStyle: {
//     fontSize: 16,
//     fontWeight: "600",
//   }
//
// After:
//   textStyle: {
//     fontSize: 16,
//     fontFamily: getFontFamily("600"),
//     fontWeight: "600",
//   }

const fontWeightToFontFamily = {
  100: "getFontFamily('100')",
  200: "getFontFamily('200')",
  300: "getFontFamily('300')",
  400: "getFontFamily('400')",
  500: "getFontFamily('500')",
  600: "getFontFamily('600')",
  700: "getFontFamily('700')",
  800: "getFontFamily('800')",
  900: "getFontFamily('900')",
};

// Pattern to follow:
// 1. Import: import { getFontFamily } from "@/constants/Fonts";
// 2. For each style with fontWeight, add: fontFamily: getFontFamily("weight"),
// 3. Place fontFamily right before fontWeight

module.exports = { fontWeightToFontFamily };
