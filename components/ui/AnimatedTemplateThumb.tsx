import React, { useEffect, useMemo, useState } from "react";
import {
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import { Video, ResizeMode } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

interface AnimatedTemplateThumbProps {
  /** Fallback poster image source: URL string, {uri}, or a require()'d asset. */
  thumbnail?: string | number | { uri: string } | null;
  /** Optional preview video (Cloudinary or direct video URL). */
  videoUrl?: string | null;
  /** Explicit play (e.g. the selected template). */
  active?: boolean;
  /** Autoplay the preview (active for cards on the visible page). */
  autoPlay?: boolean;
  /** Style applied to the container. */
  style?: StyleProp<ViewStyle>;
  /** Content fit for the fallback image. */
  imageContentFit?: "cover" | "contain";
  /** Item index in grid (0-5) to stagger hardware decoder initialization and maintain 60fps */
  index?: number;
}

const CLOUDINARY_VIDEO_SEGMENT = "/video/upload/";

function transformCloudinaryUrl(
  videoUrl?: string | null,
  transforms = "",
  targetExtension?: string
): string | null {
  if (!videoUrl) return null;
  if (!videoUrl.includes(CLOUDINARY_VIDEO_SEGMENT)) return videoUrl;
  try {
    let base = videoUrl;
    if (targetExtension) {
      base = videoUrl.replace(/\.(mp4|mov|webm|m4v|m3u8)(\?.*)?$/i, `.${targetExtension}`);
    }
    return base.replace(
      CLOUDINARY_VIDEO_SEGMENT,
      `${CLOUDINARY_VIDEO_SEGMENT}${transforms}/`
    );
  } catch {
    return videoUrl;
  }
}

/** Static JPEG of the video's FIRST FRAME for instant, seamless placeholder display. */
const buildVideoPosterUrl = (videoUrl?: string | null) => {
  if (!videoUrl || !videoUrl.includes(CLOUDINARY_VIDEO_SEGMENT)) return null;
  return transformCloudinaryUrl(videoUrl, "so_0,f_jpg,q_auto:good,w_360", "jpg");
};

/**
 * Mobile-optimized video stream: 240px pre-cached stream for ultra-lightweight multi-video grids.
 */
const buildVideoPlayUrl = (videoUrl?: string | null) => {
  if (!videoUrl) return null;
  if (!videoUrl.includes(CLOUDINARY_VIDEO_SEGMENT)) return videoUrl;
  return (
    transformCloudinaryUrl(videoUrl, "w_240,q_auto:good", "mp4") ||
    videoUrl
  );
};

function AnimatedTemplateThumb({
  thumbnail,
  videoUrl,
  active = false,
  autoPlay = false,
  style,
  imageContentFit = "cover",
  index = 0,
}: AnimatedTemplateThumbProps) {
  const posterUrl = useMemo(() => buildVideoPosterUrl(videoUrl), [videoUrl]);
  const playUrl = useMemo(() => buildVideoPlayUrl(videoUrl), [videoUrl]);

  // Stagger hardware decoder allocation across frames to prevent UI thread spikes
  const [mounted, setMounted] = useState(!autoPlay || active);

  useEffect(() => {
    if (active) {
      setMounted(true);
      return;
    }
    if (autoPlay) {
      const timer = setTimeout(() => {
        setMounted(true);
      }, Math.min((index || 0) * 20, 80));
      return () => clearTimeout(timer);
    } else {
      setMounted(false);
    }
  }, [autoPlay, active, index]);

  const shouldPlay = (active || (autoPlay && mounted)) && !!playUrl;
  const imageSource = posterUrl ? { uri: posterUrl } : thumbnail;

  const [isReady, setIsReady] = useState(false);

  // Reset isReady when playback stops or unmounts
  useEffect(() => {
    if (!shouldPlay) {
      setIsReady(false);
    }
  }, [shouldPlay]);

  return (
    <View style={style}>
      {/* 1. Instant Cached Image: Always rendered underneath to eliminate black frames */}
      {imageSource ? (
        <Image
          source={imageSource as any}
          style={StyleSheet.absoluteFill}
          contentFit={imageContentFit}
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]} />
      )}

      {/* 2. Direct Video Player: Seamless transition on onReadyForDisplay to eliminate blip */}
      {shouldPlay && playUrl ? (
        <Video
          source={{ uri: playUrl }}
          style={[StyleSheet.absoluteFill, { opacity: isReady ? 1 : 0 }]}
          resizeMode={ResizeMode.COVER}
          shouldPlay={true}
          isLooping={true}
          isMuted={true}
          useNativeControls={false}
          onReadyForDisplay={() => setIsReady(true)}
          progressUpdateIntervalMillis={10000}
        />
      ) : null}

      {/* 3. Play indicator badge: Perfectly synchronized to disappear the exact moment video playback starts */}
      {!!videoUrl && (!shouldPlay || !isReady) && (
        <View style={styles.playBadge} pointerEvents="none">
          <Ionicons name="play" size={10} color="#FFFFFF" style={{ marginLeft: 1 }} />
        </View>
      )}
    </View>
  );
}

export default React.memo(AnimatedTemplateThumb);

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: "#E2E8F0",
  },
  playBadge: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
});
