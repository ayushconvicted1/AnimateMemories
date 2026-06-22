import { BlurView } from "expo-blur";
import { StyleSheet, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export default function TabBarBackground() {
  return (
    <BlurView
      tint="light"
      intensity={Platform.OS === "ios" ? 92 : 100}
      style={styles.blurView}
    >
      <LinearGradient
        colors={["rgba(255,255,255,0)", "rgba(255,255,255,1)"]}
        locations={[0.539, 1.0977]}
        style={styles.gradient}
      />
    </BlurView>
  );
}

const styles = StyleSheet.create({
  blurView: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.48)",
    borderRadius: 10,
    overflow: "hidden",
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});
      {/* Frosted blur overlay */}
      <BlurView
        tint="light"
        intensity={Platform.OS === "ios" ? 80 : 100}
        style={StyleSheet.absoluteFill}
      />
      {/* Subtle white overlay for frosted look */}
      <View style={styles.whiteOverlay} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  whiteOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
});
