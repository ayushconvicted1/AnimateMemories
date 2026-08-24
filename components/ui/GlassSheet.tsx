import React, { useMemo } from "react";
import {
  DimensionValue,
  Modal,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  GlassView,
  GlassColorScheme,
  GlassStyle,
  isLiquidGlassAvailable,
} from "@/lib/glassEffect";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getFontFamily } from "@/constants/Fonts";

/**
 * A bottom sheet that renders Apple's native Liquid Glass material on iOS 26+
 * (via expo-glass-effect) and falls back to a classic solid sheet on Android /
 * older iOS versions.
 *
 * Every visual knob is exposed as a prop so the sheet can be tweaked per screen:
 * glass effect style, tint, corner radius, height, backdrop strength, handle and
 * header visibility, plus style overrides.
 *
 * Notes:
 * - The glass effect only exists on iOS 26+. `isLiquidGlassAvailable()` decides
 *   at runtime, so the same component is safe everywhere.
 * - Never set `opacity < 1` on GlassView or its parents — the effect stops
 *   rendering. Fade with `glassEffectStyle={{ style, animate: true }}` instead.
 * - The backdrop is a top-to-bottom gradient (lighter at the top, darker at the
 *   bottom) so content behind the sheet stays visible enough to blur nicely
 *   while the tab bar / center create button stays quiet and dimmed.
 */
export interface GlassSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;

  // Header (all optional — omit everything for a bare sheet)
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  showHeader?: boolean;
  showCloseButton?: boolean;

  // ---- UI tweak knobs ----
  /** Explicit height for the sheet. Default "85%". */
  height?: DimensionValue;
  /** Height cap for the sheet. Default "90%". */
  maxHeight?: DimensionValue;
  /** Top corner radius of the sheet. Default 28. */
  cornerRadius?: number;
  /** Liquid glass style: "regular" (frosted), "clear" (more transparent) or "none". Default "regular". */
  glassEffectStyle?: GlassStyle;
  /** Tint of the glass material. Default "#FFFFFF" (bright frost). */
  tintColor?: string;
  /** Glass color scheme. Default "auto". */
  colorScheme?: GlassColorScheme;
  /** Show the drag-handle pill. Default true. */
  showHandle?: boolean;
  /** Backdrop gradient colors — darkens toward the bottom (tab bar / create button). */
  backdropStartColor?: string;
  backdropEndColor?: string;
  /** Sheet background used on platforms without Liquid Glass (Android / iOS < 26). Default "#FFFFFF". */
  fallbackBackgroundColor?: string;
  contentStyle?: StyleProp<ViewStyle>;
  sheetStyle?: StyleProp<ViewStyle>;
}

export default function GlassSheet({
  visible,
  onClose,
  children,
  eyebrow,
  title,
  subtitle,
  showHeader = true,
  showCloseButton = true,
  height = "85%",
  maxHeight = "90%",
  cornerRadius = 28,
  glassEffectStyle = "regular",
  tintColor = "#FFFFFF",
  colorScheme = "auto",
  showHandle = true,
  backdropStartColor = "rgba(15, 23, 42, 0.28)",
  backdropEndColor = "rgba(15, 23, 42, 0.58)",
  fallbackBackgroundColor = "#FFFFFF",
  contentStyle,
  sheetStyle,
}: GlassSheetProps) {
  const insets = useSafeAreaInsets();
  const liquidGlass = useMemo(() => isLiquidGlassAvailable(), []);

  const inner = (
    <>
      {showHandle && <View style={styles.handle} />}
      {showHeader && (
        <View style={styles.header}>
          <View style={styles.headerText}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {showCloseButton && (
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                liquidGlass ? styles.closeButtonGlass : styles.closeButtonSolid,
              ]}
              accessibilityLabel="Close sheet"
              activeOpacity={0.7}
            >
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </>
  );

  const sheetBase: ViewStyle = {
    height,
    maxHeight,
    borderTopLeftRadius: cornerRadius,
    borderTopRightRadius: cornerRadius,
    paddingBottom: Math.max(insets.bottom, 16),
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop — gradient so the top stays see-through (pretty blur for the
            glass) while the bottom (tab bar / create button) gets properly dimmed. */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
          accessibilityLabel="Dismiss sheet"
        >
          <LinearGradient
            colors={[backdropStartColor, backdropEndColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </TouchableOpacity>

        {liquidGlass ? (
          <GlassView
            style={[styles.sheet, styles.glassSheet, sheetBase, sheetStyle]}
            glassEffectStyle={glassEffectStyle}
            tintColor={tintColor}
            colorScheme={colorScheme}
          >
            {inner}
          </GlassView>
        ) : (
          <View
            style={[
              styles.sheet,
              styles.fallbackSheet,
              sheetBase,
              { backgroundColor: fallbackBackgroundColor },
              sheetStyle,
            ]}
          >
            {inner}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "transparent",
  },
  sheet: {
    width: "100%",
    paddingTop: 12,
    overflow: "hidden",
  },
  glassSheet: {
    // Hairline glass rim — follows the rounded top corners natively.
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  fallbackSheet: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(0, 0, 0, 0.14)",
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  eyebrow: {
    color: "#8B5CF6",
    fontSize: 12,
    letterSpacing: 1.4,
    fontFamily: getFontFamily("700"),
    marginBottom: 3,
  },
  title: {
    color: "#111827",
    fontSize: 24,
    fontFamily: getFontFamily("700"),
  },
  subtitle: {
    color: "#64748B",
    fontSize: 15,
    marginTop: 2,
    fontFamily: getFontFamily("500"),
  },
  closeButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
  },
  closeButtonGlass: {
    backgroundColor: "rgba(255, 255, 255, 0.55)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.95)",
  },
  closeButtonSolid: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  closeText: {
    color: "#475569",
    fontSize: 26,
    lineHeight: 26,
    fontFamily: getFontFamily("400"),
  },
  content: {
    flex: 1,
  },
});
