/**
 * Font configuration for the app
 * Uses Outfit font family to match the web app
 */

import { Platform } from "react-native";

export const Fonts = {
  // Outfit font family
  outfit: "Outfit_400Regular",
  outfitThin: "Outfit_100Thin",
  outfitExtraLight: "Outfit_200ExtraLight",
  outfitLight: "Outfit_300Light",
  outfitRegular: "Outfit_400Regular",
  outfitMedium: "Outfit_500Medium",
  outfitSemiBold: "Outfit_600SemiBold",
  outfitBold: "Outfit_700Bold",
  outfitExtraBold: "Outfit_800ExtraBold",
  outfitBlack: "Outfit_900Black",

  // Fallback fonts
  default: Platform.select({
    ios: "Outfit_400Regular",
    android: "Outfit_400Regular",
    default: "Outfit_400Regular",
  }),
} as const;

// Helper function to get font family based on weight
export const getFontFamily = (
  weight:
    | "100"
    | "200"
    | "300"
    | "400"
    | "500"
    | "600"
    | "700"
    | "800"
    | "900" = "400"
) => {
  switch (weight) {
    case "100":
      return Fonts.outfitThin;
    case "200":
      return Fonts.outfitExtraLight;
    case "300":
      return Fonts.outfitLight;
    case "400":
      return Fonts.outfitRegular;
    case "500":
      return Fonts.outfitMedium;
    case "600":
      return Fonts.outfitSemiBold;
    case "700":
      return Fonts.outfitBold;
    case "800":
      return Fonts.outfitExtraBold;
    case "900":
      return Fonts.outfitBlack;
    default:
      return Fonts.outfitRegular;
  }
};
