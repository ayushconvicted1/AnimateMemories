import React, { useRef, useEffect, useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Platform,
  Dimensions,
  AppState,
  ActivityIndicator,
} from "react-native";
import SavedToast from "./SavedToast";
import { SafeAreaView } from "react-native-safe-area-context";
import { Video, ResizeMode, AVPlaybackStatus, Audio } from "expo-av";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface FullScreenVideoViewerProps {
  visible: boolean;
  videoUri: string | null;
  posterUri?: string | null;
  onClose: () => void;
  onDownload: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  isDownloading?: boolean;
  showDelete?: boolean;
  onPreviewVideoPause?: () => void;
  toastTitle?: string | null;
  toastPath?: string | null;
  onToastHide?: () => void;
}

export default function FullScreenVideoViewer({
  visible,
  videoUri,
  posterUri,
  onClose,
  onDownload,
  onDelete,
  isDeleting = false,
  isDownloading = false,
  showDelete = false,
  onPreviewVideoPause,
  toastTitle,
  toastPath,
  onToastHide,
}: FullScreenVideoViewerProps) {
  const videoRef = useRef<Video>(null);
  const insets = useSafeAreaInsets();
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  const bufferTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Configure Audio mode for video playback
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      staysActiveInBackground: false,
    }).catch(() => {});
  }, []);

  // Reset loading state when video changes or opens
  useEffect(() => {
    if (visible) {
      setIsVideoLoading(true);
      setIsBuffering(false);
      setVideoError(null);
      if (onPreviewVideoPause) {
        onPreviewVideoPause();
      }

      // Safety timeout: ensure loading overlay doesn't get stuck if onReadyForDisplay is skipped by Android
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
      loadTimeoutRef.current = setTimeout(() => {
        setIsVideoLoading(false);
      }, 3000);
    } else {
      if (bufferTimerRef.current) {
        clearTimeout(bufferTimerRef.current);
      }
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
      if (videoRef.current) {
        videoRef.current.pauseAsync().catch(() => {});
        videoRef.current.unloadAsync().catch(() => {});
      }
    }

    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current);
    };
  }, [visible, videoUri, onPreviewVideoPause]);

  // Handle app state changes to prevent video glitches
  useEffect(() => {
    if (!visible) return;

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        videoRef.current?.pauseAsync().catch(() => {});
      } else if (nextAppState === "active") {
        if (visible && videoRef.current) {
          videoRef.current.playAsync().catch(() => {});
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [visible]);

  const handleStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    if (
      status.isPlaying ||
      (status.positionMillis !== undefined && status.positionMillis > 0) ||
      !status.isBuffering
    ) {
      setIsVideoLoading(false);
    }

    if (status.isBuffering) {
      // Debounce buffering indicator by 600ms to ignore micro-buffers
      if (!bufferTimerRef.current && !isBuffering) {
        bufferTimerRef.current = setTimeout(() => {
          setIsBuffering(true);
        }, 600);
      }
    } else {
      if (bufferTimerRef.current) {
        clearTimeout(bufferTimerRef.current);
        bufferTimerRef.current = null;
      }
      if (isBuffering) {
        setIsBuffering(false);
      }
    }
  };

  const handleRetry = () => {
    setVideoError(null);
    setIsVideoLoading(true);
    setIsBuffering(false);
    if (videoRef.current && videoUri) {
      videoRef.current
        .unloadAsync()
        .then(() =>
          videoRef.current?.loadAsync(
            { uri: videoUri },
            { shouldPlay: true, isLooping: true },
            false
          )
        )
        .catch((err) => {
          console.error("Retry load error:", err);
          setVideoError("Unable to play video. Tap below to retry.");
          setIsVideoLoading(false);
        });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent={Platform.OS === "android"}
    >
      <StatusBar style="light" />
      <SafeAreaView style={styles.modalContainer} edges={["top", "bottom"]}>
        {/* Close Button */}
        <TouchableOpacity
          style={[styles.closeButton, { top: insets.top + 10 }]}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Video Player */}
        {videoUri && (
          <View style={styles.videoModalContent}>
            <View style={styles.videoWrapper}>
              {/* Poster Image Underneath Video: Prevents black frame while loading */}
              {posterUri ? (
                <ExpoImage
                  source={{ uri: posterUri }}
                  style={styles.fullScreenVideo}
                  contentFit="contain"
                  cachePolicy="memory-disk"
                />
              ) : null}

              <Video
                ref={videoRef}
                source={{ uri: videoUri }}
                style={[
                  styles.fullScreenVideo,
                  StyleSheet.absoluteFill,
                  { opacity: isVideoLoading && !posterUri ? 0 : 1 },
                ]}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay={visible}
                isLooping
                useNativeControls
                onLoad={() => {
                  setIsVideoLoading(false);
                  setIsBuffering(false);
                }}
                onReadyForDisplay={() => {
                  setIsVideoLoading(false);
                  setIsBuffering(false);
                }}
                onPlaybackStatusUpdate={handleStatusUpdate}
                onError={(error) => {
                  console.error("Video error:", error);
                  setIsVideoLoading(false);
                  setIsBuffering(false);
                  setVideoError("Unable to play video. Tap below to retry.");
                }}
                onLoadStart={() => {
                  setIsVideoLoading(true);
                  setVideoError(null);
                }}
                progressUpdateIntervalMillis={250}
              />

              {/* Centered Video Loader or Error */}
              {videoError ? (
                <View style={styles.videoCenterLoader}>
                  <View style={styles.videoLoaderBox}>
                    <Ionicons name="alert-circle-outline" size={32} color="#F59E0B" />
                    <Text style={[styles.videoLoaderText, { textAlign: "center", maxWidth: 220 }]}>
                      {videoError}
                    </Text>
                    <TouchableOpacity
                      style={styles.retryButton}
                      onPress={handleRetry}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="reload" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                (isVideoLoading || isBuffering) && (
                  <View style={styles.videoCenterLoader} pointerEvents="none">
                    <View style={styles.videoLoaderBox}>
                      <ActivityIndicator size="large" color="#38BDF8" />
                      <Text style={styles.videoLoaderText}>
                        {isBuffering ? "Buffering..." : "Loading video..."}
                      </Text>
                    </View>
                  </View>
                )
              )}
            </View>

            {/* Action Buttons */}
            <View style={[styles.modalActions, { paddingBottom: Math.max(insets.bottom, 20) }]}>
              <TouchableOpacity
                style={[styles.modalButton, styles.downloadModalButton]}
                onPress={onDownload}
                disabled={isDownloading}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={["#28D4FA", "#D229FF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalButtonGradient}
                >
                  <View style={styles.modalButtonContent}>
                    {isDownloading ? (
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 8,
                        }}
                      >
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.modalButtonText}>Saving...</Text>
                      </View>
                    ) : (
                      <View style={styles.buttonInnerRow}>
                        <Ionicons name="download-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.modalButtonText}>Download</Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {showDelete && onDelete ? (
                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteModalButton]}
                  onPress={onDelete}
                  disabled={isDeleting}
                  activeOpacity={0.85}
                >
                  <View style={styles.modalButtonContent}>
                    {isDeleting ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <ActivityIndicator size="small" color="#fff" />
                        <Text style={styles.modalButtonText}>Deleting...</Text>
                      </View>
                    ) : (
                      <View style={styles.buttonInnerRow}>
                        <Ionicons name="trash-outline" size={19} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.modalButtonText}>Delete</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.modalButton, styles.closeModalButton]}
                  onPress={onClose}
                  activeOpacity={0.85}
                >
                  <View style={styles.modalButtonContent}>
                    <View style={styles.buttonInnerRow}>
                      <Ionicons name="close-circle-outline" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.modalButtonText}>Close</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Saved confirmation */}
        <SavedToast
          title={toastTitle ?? null}
          path={toastPath ?? null}
          onHide={onToastHide}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  closeButton: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  videoModalContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 130,
  },
  videoWrapper: {
    width: SCREEN_WIDTH,
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenVideo: {
    width: "100%",
    height: "100%",
  },
  modalActions: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    gap: 12,
  },
  modalButton: {
    borderRadius: 12,
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
  },
  modalButtonGradient: {
    width: "100%",
    height: "100%",
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  downloadModalButton: {},
  closeModalButton: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteModalButton: {
    backgroundColor: "#DC2626",
    paddingVertical: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonInnerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonContent: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  videoCenterLoader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    zIndex: 5,
  },
  videoLoaderBox: {
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "rgba(15, 23, 42, 0.88)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  videoLoaderText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#D229FF",
    flexDirection: "row",
    alignItems: "center",
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
