import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
import { Image } from "expo-image";
import { Video, ResizeMode } from "expo-av";

interface AnimatedTemplateThumbProps {
  /** Fallback poster image source: URL string, {uri}, or a require()'d asset.
   *  Only shown when there is no video (or no Cloudinary-derived last-frame poster). */
  thumbnail?: string | number | { uri: string } | null;
  /** Optional preview video (Cloudinary URL). Its LAST frame is the placeholder. */
  videoUrl?: string | null;
  /** Explicit play (e.g. the selected template). */
  active?: boolean;
  /** Autoplay the preview. Parents gate this with viewport visibility so only
   *  on-screen cards ever hold a native player — off-screen cards unmount and
   *  free their decoder instantly (keeps scrolling smooth and the heap small). */
  autoPlay?: boolean;
  /** Style applied to the container (should fill the card image area). */
  style?: StyleProp<ViewStyle>;
  /** Content fit for the fallback image. */
  imageContentFit?: "cover" | "contain";
}

const CLOUDINARY_VIDEO_SEGMENT = "/video/upload/";

/**
 * Shared sync clock: every mounted template preview seeks to the same global
 * position so visible cards play the same moment of their videos at the same
 * time (best effort — clips with equal duration stay in sync; others re-align
 * after each loop via the drift correction in onPlaybackStatusUpdate).
 */
const SYNC_START = Date.now();
const DRIFT_TOLERANCE_MS = 600;

function syncPositionMillis(durationMillis: number): number {
  if (!Number.isFinite(durationMillis) || durationMillis <= 0) return 0;
  return (Date.now() - SYNC_START) % durationMillis;
}

/**
 * Insert a transformation into a Cloudinary video URL, optionally stripping the
 * file extension (needed when converting a video to an image, e.g. f_jpg).
 */
function transformCloudinaryUrl(
  videoUrl?: string | null,
  transforms = "",
  stripExtension = false
): string | null {
  if (!videoUrl || !videoUrl.includes(CLOUDINARY_VIDEO_SEGMENT)) return null;
  try {
    let base = videoUrl;
    if (stripExtension) {
      base = videoUrl.replace(/\.(mp4|mov|webm|m4v|m3u8)(\?.*)?$/i, "");
    }
    return base.replace(
      CLOUDINARY_VIDEO_SEGMENT,
      `${CLOUDINARY_VIDEO_SEGMENT}${transforms}/`
    );
  } catch {
    return null;
  }
}

/** Static JPEG of the video's FIRST FRAME (so_0 ≈ start of the clip). */
const buildVideoPosterUrl = (videoUrl?: string | null) =>
  transformCloudinaryUrl(videoUrl, "so_0,f_jpg,q_auto:best,w_720", true);

/**
 * Playback stream at optimal 720px quality with high-bitrate H.264 profile
 * to completely eliminate on-the-fly macroblocking and pixelation artifacts.
 */
const buildVideoPlayUrl = (videoUrl?: string | null) =>
  transformCloudinaryUrl(videoUrl, "q_auto:best,vc_h264,w_720", false) || videoUrl;

export default function AnimatedTemplateThumb({
  thumbnail,
  videoUrl,
  active = false,
  autoPlay = false,
  style,
  imageContentFit = "cover",
}: AnimatedTemplateThumbProps) {
  // First-frame poster derived from the Cloudinary URL (static image).
  const posterUrl = useMemo(() => buildVideoPosterUrl(videoUrl), [videoUrl]);
  // High quality stream used for actual playback.
  const playUrl = useMemo(() => buildVideoPlayUrl(videoUrl), [videoUrl]);
  // Ref to the mounted player.
  const videoRef = useRef<Video>(null);
  const [isReady, setIsReady] = useState(false);

  const playing = active || autoPlay;

  // Handle play/pause smoothly without native player recreation
  useEffect(() => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.playAsync().catch(() => {});
    } else {
      videoRef.current.pauseAsync().catch(() => {});
    }
  }, [playing]);

  return (
    <View style={style}>
      {posterUrl ? (
        <Image
          source={{ uri: posterUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={100}
        />
      ) : thumbnail ? (
        <Image
          source={thumbnail as any}
          style={StyleSheet.absoluteFill}
          contentFit={imageContentFit}
          transition={100}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.placeholder]} />
      )}

      {/* Keep the player mounted so ExoPlayer prebuffers in memory,
          playing instantly at full crystal-clear quality without pixelation */}
      {playUrl ? (
        <Video
          ref={videoRef}
          source={{ uri: playUrl }}
          style={[StyleSheet.absoluteFill, { opacity: isReady ? 1 : 0 }]}
          resizeMode={ResizeMode.COVER}
          shouldPlay={playing}
          isLooping={true}
          isMuted={true}
          useNativeControls={false}
          onReadyForDisplay={() => setIsReady(true)}
          onError={(error) =>
            console.log("Template preview video failed to load:", error)
          }
        />
      ) : null}

      {/* Play badge on every template not set to autoplay */}
      {!!videoUrl && !autoPlay && !active && (
        <View style={styles.playBadge} pointerEvents="none">
          <Text style={styles.playIcon}>▶</Text>
        </View>
      )}
    </View>
  );
}

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
  playIcon: {
    color: "#FFFFFF",
    fontSize: 9,
    marginLeft: 1,
  },
});
