import React from "react";
import { Platform, View, ViewProps } from "react-native";
import {
  requireOptionalNativeModule,
  requireNativeViewManager,
} from "expo-modules-core";

export type GlassStyle = "regular" | "clear" | "none";
export type GlassColorScheme = "light" | "dark" | "auto";

export interface GlassViewProps extends ViewProps {
  glassEffectStyle?: GlassStyle | { style?: GlassStyle; animate?: boolean };
  tintColor?: string;
  colorScheme?: GlassColorScheme;
  children?: React.ReactNode;
}

let cachedAvailability: boolean | null = null;
let NativeGlassViewComponent: React.ComponentType<any> | null = null;

/**
 * Safely checks whether the native Liquid Glass module (ExpoGlassEffect)
 * is linked and available at runtime. Returns false on platforms/builds
 * where the native module is absent without throwing an unhandled exception.
 */
export function isLiquidGlassAvailable(): boolean {
  if (Platform.OS !== "ios") {
    return false;
  }
  if (cachedAvailability !== null) {
    return cachedAvailability;
  }
  try {
    const mod = requireOptionalNativeModule("ExpoGlassEffect");
    if (mod) {
      if (typeof mod.isLiquidGlassAvailable === "boolean") {
        cachedAvailability = mod.isLiquidGlassAvailable;
      } else if (typeof mod.isLiquidGlassAvailable === "function") {
        cachedAvailability = Boolean(mod.isLiquidGlassAvailable());
      } else {
        cachedAvailability = false;
      }
    } else {
      cachedAvailability = false;
    }
  } catch {
    cachedAvailability = false;
  }
  return Boolean(cachedAvailability);
}

export function isGlassEffectAPIAvailable(): boolean {
  return isLiquidGlassAvailable();
}

function getNativeGlassView(): React.ComponentType<any> | null {
  if (NativeGlassViewComponent) {
    return NativeGlassViewComponent;
  }
  if (!isLiquidGlassAvailable()) {
    return null;
  }
  try {
    NativeGlassViewComponent = requireNativeViewManager(
      "ExpoGlassEffect",
      "GlassView"
    );
    return NativeGlassViewComponent;
  } catch {
    return null;
  }
}

/**
 * Safe GlassView wrapper that renders the native iOS Liquid Glass view when available,
 * or gracefully falls back to a standard View if the native module is not present.
 */
export const GlassView = React.forwardRef<View, GlassViewProps>(
  (props, ref) => {
    const {
      glassEffectStyle,
      tintColor,
      colorScheme,
      style,
      children,
      ...rest
    } = props;
    const NativeComponent = getNativeGlassView();

    if (NativeComponent) {
      return (
        <NativeComponent
          ref={ref}
          style={style}
          glassEffectStyle={glassEffectStyle}
          tintColor={tintColor}
          colorScheme={colorScheme}
          {...rest}
        >
          {children}
        </NativeComponent>
      );
    }

    return (
      <View ref={ref} style={style} {...rest}>
        {children}
      </View>
    );
  }
);

export const GlassContainer = View;

export default GlassView;
