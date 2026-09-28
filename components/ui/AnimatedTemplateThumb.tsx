import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Animated,
  Easing,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

export interface AnimatedTemplateThumbProps {
  /** Optional preview video (Cloudinary, Cloudflare R2, direct URL, or relative path). */
  videoUrl?: string | null;
  /** Thumbnail image URL (e.g. from backend item.thumbnailUrl). */
  thumbnailUrl?: string | null;
  /** Poster image URL or local asset require(...). */
  posterUrl?: any;
  /** Legacy thumbnail prop (supports URI string, require number, or { uri }). */
  thumbnail?: any;
  /** Static image prop (e.g. from default templates). */
  image?: any;
  /** Explicit play (e.g. the selected template). */
  active?: boolean;
  /** Autoplay the preview (active for cards visible in current viewport). */
  autoPlay?: boolean;
  /** Style applied to the container. */
  style?: StyleProp<ViewStyle>;
  /** Content fit for the fallback image. */
  imageContentFit?: "cover" | "contain";
  /** Resize mode for the video. Defaults to ResizeMode.COVER. */
  resizeMode?: ResizeMode;
  /** Item index in grid/carousel to stagger hardware decoder initialization */
  index?: number;
  /** Callback fired when the video completes one loop (for sequential viewport cycling) */
  onPlaybackFinished?: () => void;
}

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "https://www.animatememories.com";

/**
 * Normalizes relative URLs and encodes spaces/special characters so Android ExoPlayer
 * and expo-image never fail on unencoded URIs.
 */
export function formatImageUrl(url?: string | null): string {
  if (!url) return "";
  let formatted = String(url).trim();
  if (formatted.startsWith("//")) {
    formatted = `https:${formatted}`;
  } else if (
    !formatted.startsWith("http://") &&
    !formatted.startsWith("https://") &&
    !formatted.startsWith("data:")
  ) {
    const base = API_BASE_URL.endsWith("/")
      ? API_BASE_URL.slice(0, -1)
      : API_BASE_URL;
    formatted = `${base}${formatted.startsWith("/") ? "" : "/"}${formatted}`;
  }
  try {
    return encodeURI(formatted);
  } catch {
    return formatted;
  }
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

/** Static JPEG of the video's MID FRAME (1.5s) for instant, matching placeholder display. */
const buildVideoPosterUrl = (videoUrl?: string | null) => {
  if (!videoUrl || !videoUrl.includes(CLOUDINARY_VIDEO_SEGMENT)) return null;
  return transformCloudinaryUrl(videoUrl, "so_1.5,f_jpg,q_auto:good,w_360", "jpg");
};

/**
 * Mobile-optimized video stream: 240px pre-cached stream for ultra-lightweight multi-video grids.
 */
const buildVideoPlayUrl = (videoUrl?: string | null) => {
  if (!videoUrl) return null;
  if (videoUrl.includes(CLOUDINARY_VIDEO_SEGMENT)) {
    return (
      transformCloudinaryUrl(videoUrl, "w_240,q_auto:good", "mp4") ||
      videoUrl
    );
  }
  return formatImageUrl(videoUrl);
};

/** Generic animated loader shown ONLY when no static poster or frame exists */
const GenericLoader = React.memo(() => {
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.8,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.35,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <View style={[StyleSheet.absoluteFill, styles.loaderContainer]}>
      <Animated.View style={[styles.shimmerLayer, { opacity: pulseAnim }]} />
      <View style={styles.centerIconBadge}>
        <Ionicons name="play" size={14} color="#A855F7" style={{ marginLeft: 2 }} />
      </View>
    </View>
  );
});
GenericLoader.displayName = "GenericLoader";

function AnimatedTemplateThumb({
  videoUrl,
  thumbnailUrl,
  posterUrl,
  thumbnail,
  image,
  active = false,
  autoPlay = false,
  style,
  imageContentFit = "cover",
  resizeMode = ResizeMode.COVER,
  index = 0,
  onPlaybackFinished,
}: AnimatedTemplateThumbProps) {
  const videoRef = useRef<Video>(null);
  const [isReady, setIsReady] = useState(false);
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const hasFinishedRef = useRef(false);

  // Resolve best available poster source: explicit poster > thumbnailUrl > image > legacy thumbnail > Cloudinary frame
  const resolvedPosterSource = useMemo(() => {
    if (posterUrl) {
      return typeof posterUrl === "string" ? { uri: formatImageUrl(posterUrl) } : posterUrl;
    }
    if (thumbnailUrl) {
      return typeof thumbnailUrl === "string" ? { uri: formatImageUrl(thumbnailUrl) } : thumbnailUrl;
    }
    if (image) {
      return typeof image === "string" ? { uri: formatImageUrl(image) } : image;
    }
    if (thumbnail) {
      return typeof thumbnail === "string" ? { uri: formatImageUrl(thumbnail) } : thumbnail;
    }
    const cloudPoster = buildVideoPosterUrl(videoUrl);
    if (cloudPoster) {
      return { uri: cloudPoster };
    }
    return null;
  }, [posterUrl, thumbnailUrl, image, thumbnail, videoUrl]);

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
      }, Math.min((index || 0) * 30, 90));
      return () => clearTimeout(timer);
    } else {
      setMounted(false);
      setIsReady(false);
    }
  }, [autoPlay, active, index]);

  const shouldPlay = (active || (autoPlay && mounted)) && !!playUrl && !hasError;

  useEffect(() => {
    hasFinishedRef.current = false;
  }, [shouldPlay, playUrl]);

  // Active playback control via replayAsync / pauseAsync
  useEffect(() => {
    if (!shouldPlay) {
      if (videoRef.current) {
        videoRef.current.pauseAsync().catch(() => {});
        videoRef.current.setPositionAsync(0).catch(() => {});
      }
      setIsReady(false);
    } else {
      setHasError(false);
      hasFinishedRef.current = false;
      if (videoRef.current) {
        videoRef.current.replayAsync().catch(() => {
          videoRef.current?.setPositionAsync(0).then(() => {
            videoRef.current?.playAsync().catch(() => {});
          }).catch(() => {});
        });
      }
    }
  }, [shouldPlay]);

  // Clean unmount to release Android hardware decoders immediately
  useEffect(() => {
    return () => {
      if (videoRef.current) {
        videoRef.current.unloadAsync().catch(() => {});
      }
    };
  }, []);

  const handlePlaybackStatusUpdate = useCallback((status: AVPlaybackStatus) => {
    if (!status.isLoaded) {
      if (status.error) {
        setHasError(true);
        setIsReady(false);
      }
      return;
    }

    if (
      status.isPlaying ||
      (status.positionMillis !== undefined && status.positionMillis > 0)
    ) {
      setIsReady(true);
    }

    // When position resets near 0, allow didJustFinish to fire again on next completion
    if (status.positionMillis !== undefined && status.positionMillis < 300) {
      hasFinishedRef.current = false;
    }

    // Advance only when the full video has played to 100% completion
    if (status.didJustFinish && !hasFinishedRef.current) {
      hasFinishedRef.current = true;
      onPlaybackFinished?.();
    }
  }, [onPlaybackFinished]);

  // Safety fallback: if video is mounted with shouldPlay for > 1200ms without error, reveal surface
  useEffect(() => {
    if (!shouldPlay) return;
    const safetyTimer = setTimeout(() => {
      if (!hasError) {
        setIsReady(true);
      }
    }, 1200);
    return () => clearTimeout(safetyTimer);
  }, [shouldPlay, hasError]);

  const showLoader = !isReady && !posterLoaded && !resolvedPosterSource;

  return (
    <View style={[styles.container, style]}>
      {/* 1. Generic Skeleton Loader: Shown only when no poster image or frame is available */}
      {showLoader && <GenericLoader />}

      {/* 2. Poster Image: High-res static image or frame rendered immediately with zero delay */}
      {resolvedPosterSource ? (
        <Image
          source={resolvedPosterSource}
          style={StyleSheet.absoluteFill}
          contentFit={imageContentFit}
          contentPosition="top"
          cachePolicy="memory-disk"
          priority={active ? "high" : "normal"}
          onLoad={() => setPosterLoaded(true)}
        />
      ) : null}

      {/* 3. Direct Video Player: Seamless hardware-accelerated playback */}
      {shouldPlay && playUrl && !hasError ? (
        <Video
          ref={videoRef}
          source={{ uri: playUrl }}
          style={[StyleSheet.absoluteFill, { opacity: isReady ? 1 : 0 }]}
          resizeMode={resizeMode}
          shouldPlay={true}
          isLooping={!onPlaybackFinished}
          isMuted={true}
          useNativeControls={false}
          onLoad={() => {
            if (shouldPlay && videoRef.current) {
              videoRef.current.replayAsync().catch(() => {
                videoRef.current?.playAsync().catch(() => {});
              });
            }
          }}
          onReadyForDisplay={() => setIsReady(true)}
          onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
          onError={(error) => {
            console.warn("Template preview playback error:", error);
            setHasError(true);
            setIsReady(false);
            onPlaybackFinished?.();
          }}
          progressUpdateIntervalMillis={500}
        />
      ) : null}

      {/* 4. Play indicator badge: Shown when video exists but is idle */}
      {!!playUrl && (!shouldPlay || !isReady || hasError) && (
        <View style={styles.playBadge} pointerEvents="none">
          <Ionicons name="play" size={10} color="#FFFFFF" style={{ marginLeft: 1 }} />
        </View>
      )}
    </View>
  );
}

export default React.memo(AnimatedTemplateThumb);

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  loaderContainer: {
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  shimmerLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#E2E8F0",
  },
  centerIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#9333EA",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
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
