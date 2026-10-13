import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  Animated,
  Easing,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import { Video, ResizeMode, AVPlaybackStatus, Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";
import {
  useTemplateAudio,
  isAudioTemplate,
} from "@/services/templateAudioCoordinator";

export interface AnimatedTemplateThumbProps {
  /** Identifier (slug or ID) for template audio coordination. */
  id?: string | null;
  /** Whether this template has audio track. */
  hasAudio?: boolean;
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
  /** Whether playback is temporarily paused (e.g. during scrolling). Keeps player mounted. */
  isPaused?: boolean;
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
  /** Optional click handler for tapping the thumbnail, isolating touches from the sound toggle button */
  onPressCard?: () => void;
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
    return encodeURI(decodeURI(formatted));
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
  id,
  hasAudio: explicitHasAudio,
  videoUrl,
  thumbnailUrl,
  posterUrl,
  thumbnail,
  image,
  active = false,
  autoPlay = false,
  isPaused = false,
  style,
  imageContentFit = "cover",
  resizeMode = ResizeMode.COVER,
  index = 0,
  onPlaybackFinished,
  onPressCard,
}: AnimatedTemplateThumbProps) {
  const videoRef = useRef<Video>(null);
  const [isReady, setIsReady] = useState(false);
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const hasFinishedRef = useRef(false);

  // Check audio template status: explicit prop OR known audio slug
  const templateId = id || null;
  const isAudio = Boolean(explicitHasAudio ?? isAudioTemplate(templateId));
  const { isPlayingAudio, toggleSound, stopSound } = useTemplateAudio(templateId, isAudio);

  // Configure Audio mode when playing sound to respect user expectation & silent switch
  useEffect(() => {
    if (isPlayingAudio) {
      Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: false,
      }).catch(() => {});
    }
  }, [isPlayingAudio]);

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

  const isTargetCard = Boolean(active || autoPlay || isPlayingAudio);
  const shouldPlay = isTargetCard && !isPaused && !!playUrl && !hasError;
  const isVideoMounted = isTargetCard && !!playUrl && !hasError;
  // Keep a ref copy so the status-update callback can read the latest value synchronously
  const shouldPlayRef = useRef(shouldPlay);
  shouldPlayRef.current = shouldPlay;

  // When card is deselected, silence audio immediately
  const prevActiveRef = useRef(active);
  useEffect(() => {
    if (prevActiveRef.current && !active && isPlayingAudio) {
      stopSound();
    }
    prevActiveRef.current = active;
  }, [active, isPlayingAudio, stopSound]);

  // Reset error state and finished ref whenever card becomes active or autoPlay
  useEffect(() => {
    if ((autoPlay || active) && !isPaused) {
      setHasError(false);
      hasFinishedRef.current = false;
    }
  }, [id, playUrl, autoPlay, active, isPaused]);

  useEffect(() => {
    hasFinishedRef.current = false;
  }, [shouldPlay, playUrl]);

  // Active playback control via playAsync / pauseAsync
  useEffect(() => {
    if (!shouldPlay) {
      if (videoRef.current) {
        videoRef.current.pauseAsync().catch(() => {});
      }
      // Auto-stop audio if this card was playing audio and is no longer active
      if (!isTargetCard && isPlayingAudio) {
        stopSound();
      }
    } else {
      setHasError(false);
      hasFinishedRef.current = false;
      if (videoRef.current) {
        // Rewind to frame 0 so re-selected or looped videos always start from beginning
        videoRef.current
          .setPositionAsync(0)
          .then(() => {
            videoRef.current?.playAsync().catch(() => {});
          })
          .catch(() => {
            videoRef.current?.playAsync().catch(() => {});
          });
      }
    }
  }, [shouldPlay, isTargetCard, isPlayingAudio, stopSound]);

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

    // Only fire onPlaybackFinished when we are in an active-playback state.
    // This prevents false positives when the video is being paused/deactivated.
    if (!shouldPlayRef.current) return;

    // Video completion: didJustFinish is the primary signal; position-at-end is the fallback.
    // Ensure durationMillis is valid and substantial (> 500ms) before evaluating position-at-end
    const isFinished = Boolean(
      status.didJustFinish ||
      (status.durationMillis &&
        status.durationMillis > 500 &&
        status.positionMillis !== undefined &&
        status.positionMillis >= status.durationMillis - 100 &&
        !status.isPlaying)
    );

    if (isFinished && !hasFinishedRef.current) {
      hasFinishedRef.current = true;
      // Small delay to let React commit current frame before triggering next-card transition
      setTimeout(() => {
        onPlaybackFinished?.();
      }, 50);
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
      {isVideoMounted ? (
        <Video
          ref={videoRef}
          source={{ uri: playUrl }}
          style={StyleSheet.absoluteFill}
          resizeMode={resizeMode}
          shouldPlay={shouldPlay}
          isLooping={!onPlaybackFinished}
          isMuted={!isPlayingAudio}
          useNativeControls={false}
          onLoad={() => {
            setIsReady(true);
            hasFinishedRef.current = false;
            if (shouldPlay && videoRef.current) {
              videoRef.current
                .setPositionAsync(0)
                .then(() => {
                  videoRef.current?.playAsync().catch(() => {});
                })
                .catch(() => {
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
          progressUpdateIntervalMillis={250}
        />
      ) : null}

      {/* 4. Optional card-level tap surface (leaves sound toggle touchable without parent conflict) */}
      {onPressCard ? (
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onPressCard}
          style={StyleSheet.absoluteFill}
        />
      ) : null}

      {/* 5. Audio Capability Badge: Shows top-left "Sound" indicator */}
      {isAudio && (
        <View style={styles.soundBadge} pointerEvents="none">
          <Ionicons name="volume-medium" size={10} color="#FFFFFF" />
          <Text style={styles.soundBadgeText}>Sound</Text>
        </View>
      )}

      {/* 5. Interactive Sound Control for Audio-capable templates */}
      {isAudio && (
        <TouchableOpacity
          style={[
            styles.soundToggleButton,
            isPlayingAudio ? styles.soundToggleButtonActive : styles.soundToggleButtonMuted,
          ]}
          onPress={toggleSound}
          activeOpacity={0.82}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel={isPlayingAudio ? "Mute audio" : "Play audio with sound"}
        >
          <Ionicons
            name={isPlayingAudio ? "volume-high" : "volume-mute"}
            size={11}
            color="#FFFFFF"
          />
          <Text style={styles.soundToggleText}>
            {isPlayingAudio ? "Sound On" : "Sound Off"}
          </Text>
        </TouchableOpacity>
      )}

      {/* 6. Play indicator badge: Shown when video exists but is idle and not playing sound */}
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
  soundBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 99,
    backgroundColor: "rgba(107, 33, 168, 0.88)", // purple-800
    borderWidth: 0.5,
    borderColor: "rgba(192, 132, 252, 0.5)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 2,
    elevation: 3,
    zIndex: 10,
  },
  soundBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  soundToggleButton: {
    position: "absolute",
    bottom: 6,
    right: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
    borderRadius: 99,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
    zIndex: 20,
  },
  soundToggleButtonActive: {
    backgroundColor: "rgba(147, 51, 234, 0.95)", // purple-600
    borderWidth: 1,
    borderColor: "rgba(216, 180, 254, 0.8)",
  },
  soundToggleButtonMuted: {
    backgroundColor: "rgba(15, 23, 42, 0.82)", // slate-900
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  soundToggleText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
});
