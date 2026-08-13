import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Image } from "expo-image";
import { Video, ResizeMode } from "expo-av";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTENT_WIDTH = SCREEN_WIDTH - 32;

// Match the exact proportions of TransformationGridMaster.mp4
// Generated with card_w=480, card_h=640, gap=24, grid_w=984, grid_h=1304
const CARD_WIDTH = CONTENT_WIDTH * (480 / 984);
const GAP = CONTENT_WIDTH * (24 / 984);
const CARD_HEIGHT = CONTENT_WIDTH * (640 / 984);
const GRID_HEIGHT = CONTENT_WIDTH * (1304 / 984);

interface TransformationGridProps {
  isVisible?: boolean;
}

export default function TransformationGrid({ isVisible = true }: TransformationGridProps) {
  const videoRef = useRef<Video>(null);

  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  return (
    <View style={styles.gridContainer}>
      <View style={[styles.gridRowContainer, StyleSheet.absoluteFillObject, { zIndex: 0 }]}>
        <View style={styles.gridRow}>
          <View style={styles.cardContainer}>
            <Image source={require("@/assets/images/ClassicWedding.jpg")} style={styles.cardImage} contentFit="cover" />
          </View>
          <View style={styles.cardContainer}>
            <Image source={require("@/assets/images/FamilyPhoto.jpg")} style={styles.cardImage} contentFit="cover" />
          </View>
        </View>
        <View style={styles.gridRow}>
          <View style={styles.cardContainer}>
            <Image source={require("@/assets/images/OldMemory.jpg")} style={styles.cardImage} contentFit="cover" />
          </View>
          <View style={styles.cardContainer}>
            <Image source={require("@/assets/images/VintagePortrait.jpg")} style={styles.cardImage} contentFit="cover" />
          </View>
        </View>
      </View>
      <View style={[styles.videoWrapper, { backgroundColor: "transparent", zIndex: 1 }]}>
        <Video
          ref={videoRef}
          source={require("@/assets/videos/TransformationGridMaster.mp4")}
          style={styles.masterVideo}
          resizeMode={ResizeMode.CONTAIN}
          isLooping={true}
          shouldPlay={isVisible}
          isMuted={true}
          useNativeControls={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  gridContainer: {
    width: CONTENT_WIDTH,
    height: GRID_HEIGHT,
  },
  videoWrapper: {
    width: CONTENT_WIDTH,
    height: GRID_HEIGHT,
    borderRadius: 16,
    overflow: "hidden",
  },
  masterVideo: {
    width: "100%",
    height: "100%",
  },
  gridRowContainer: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    gap: GAP,
  },
  gridRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: "#F1F5F9",
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
});
