import React, { useRef, useEffect } from "react";
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
import { Video, ResizeMode, AVPlaybackStatus } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface FullScreenVideoViewerProps {
  visible: boolean;
  videoUri: string | null;
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

  // Pause preview video when fullscreen opens and ensure only one video plays
  useEffect(() => {
    if (visible) {
      // Call the pause callback immediately
      if (onPreviewVideoPause) {
        onPreviewVideoPause();
      }
      // Small delay to ensure preview is paused before starting fullscreen
      const timer = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.playAsync().catch(console.error);
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // Pause fullscreen video when closing
      if (videoRef.current) {
        videoRef.current.pauseAsync().catch(console.error);
      }
    }
  }, [visible, onPreviewVideoPause]);

  // Handle app state changes to prevent video glitches
  useEffect(() => {
    if (!visible) return;

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        // Pause video when app goes to background
        videoRef.current?.pauseAsync().catch(console.error);
      } else if (nextAppState === "active") {
        // Resume video when app comes to foreground (if modal is still visible)
        if (visible && videoRef.current) {
          videoRef.current.playAsync().catch(console.error);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [visible]);

  // Clean up video when modal closes
  useEffect(() => {
    if (!visible && videoRef.current) {
      videoRef.current.pauseAsync().catch(console.error);
      videoRef.current.unloadAsync().catch(console.error);
    }
  }, [visible]);

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
          style={[
            styles.closeButton,
            { top: insets.top + 10 }
          ]} 
          onPress={onClose}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        {/* Video Player */}
        {videoUri && (
          <View style={styles.videoModalContent}>
            <View style={styles.videoWrapper}>
              <Video
                ref={videoRef}
                source={{ uri: videoUri }}
                style={styles.fullScreenVideo}
                resizeMode={ResizeMode.COVER}
                shouldPlay={visible}
                isLooping
                useNativeControls
                onError={(error) => {
                  console.error("Video error:", error);
                }}
                onLoadStart={() => {
                  // Ensure video doesn't auto-play until modal is fully visible
                  if (!visible && videoRef.current) {
                    videoRef.current.pauseAsync().catch(console.error);
                  }
                }}
              />
            </View>

            {/* Action Buttons */}
            <View style={[styles.modalActions, { paddingBottom: Math.max(insets.bottom, 20) }]}>
              <TouchableOpacity
                style={[styles.modalButton, styles.downloadModalButton]}
                onPress={onDownload}
                disabled={isDownloading}
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
                          flexShrink: 1,
                        }}
                      >
                        <ActivityIndicator size="small" color="#fff" />
                        <Text
                          style={styles.modalButtonText}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                          minimumFontScale={0.75}
                        >
                          Saving...
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={styles.modalButtonText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                      >
                        Download
                      </Text>
                    )}
                  </View>
                </LinearGradient>
              </TouchableOpacity>
              {showDelete && onDelete ? (
                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteModalButton]}
                  onPress={onDelete}
                  disabled={isDeleting}
                >
                  <View style={styles.modalButtonContent}>
                    {isDeleting ? (
                      <Text
                        style={styles.modalButtonText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                      >
                        Deleting...
                      </Text>
                    ) : (
                      <Text
                        style={styles.modalButtonText}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.75}
                      >
                        Delete
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.modalButton, styles.closeModalButton]}
                  onPress={onClose}
                >
                  <View style={styles.modalButtonContent}>
                    <Text style={styles.modalButtonText}>Close</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Saved confirmation — rendered inside the modal so it is never
            hidden behind it (Modals sit in a separate native layer). */}
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
  closeButtonText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
  },
  videoModalContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 130, // Extra space for video controls and action buttons
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
    borderRadius: 8,
    flex: 1,
    minWidth: 0,
    overflow: "hidden", // For gradient button
  },
  modalButtonGradient: {
    width: "100%",
    height: "100%",
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  downloadModalButton: {
    // Uses base modalButton styles
  },
  closeModalButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteModalButton: {
    backgroundColor: "#DC3545",
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonContent: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
});

