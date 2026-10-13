import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Share,
  Platform,
  Linking,
  ScrollView,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import { shareMedia } from "@/lib/download";
import { getFontFamily } from "@/constants/Fonts";
import { trackShareAnimation } from "@/services/tracking";

export interface ShareVideoModalProps {
  visible: boolean;
  onClose: () => void;
  videoUrl?: string | null;
  title?: string | null;
  templateSlug?: string | null;
  thumbnailUrl?: string | null;
}

const WEB_ORIGIN = "https://www.animatememories.com";

export default function ShareVideoModal({
  visible,
  onClose,
  videoUrl,
  title = "My Animated Memory",
  templateSlug = "",
  thumbnailUrl = null,
}: ShareVideoModalProps) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSharingFile, setIsSharingFile] = useState(false);

  useEffect(() => {
    if (!visible) {
      setToastMessage(null);
      setIsSharingFile(false);
    }
  }, [visible]);

  if (!visible) return null;

  const displayTitle = title || "My Animated Memory";
  const shareWebUrl = videoUrl
    ? `${WEB_ORIGIN}/share?video=${encodeURIComponent(videoUrl)}${
        templateSlug ? `&template=${encodeURIComponent(templateSlug)}` : ""
      }${title ? `&title=${encodeURIComponent(displayTitle)}` : ""}`
    : `${WEB_ORIGIN}/share`;

  const shareText = `Check out this AI animated memory created with AnimateMemories! ✨\n${shareWebUrl}`;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // 1. Share native video file
  const handleShareVideoFile = async () => {
    if (!videoUrl || isSharingFile) return;
    setIsSharingFile(true);
    try {
      const success = await shareMedia({
        url: videoUrl,
        fileName: `animatememories-${(templateSlug || "memory").replace(/[^a-zA-Z0-9_-]/g, "_")}`,
        mimeType: "video/mp4",
      });
      if (success) {
        trackShareAnimation({
          animation_id: videoUrl,
          animation_type: templateSlug || "custom",
        });
      }
    } catch (err) {
      console.warn("Share file error:", err);
    } finally {
      setIsSharingFile(false);
    }
  };

  // 2. Share public web link via native dialog
  const handleShareWebLink = async () => {
    try {
      const result = await Share.share({
        title: displayTitle,
        message: shareText,
        url: Platform.OS === "ios" ? shareWebUrl : undefined,
      });
      if (result.action === Share.sharedAction) {
        trackShareAnimation({
          animation_id: videoUrl || shareWebUrl,
          animation_type: templateSlug || "custom",
        });
      }
    } catch (err) {
      console.warn("Share link error:", err);
    }
  };

  // 3. Copy public share link to clipboard
  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(shareWebUrl);
    showToast("Shareable link copied to clipboard! 📋");
    trackShareAnimation({
      animation_id: videoUrl || shareWebUrl,
      animation_type: templateSlug || "custom",
    });
  };

  // 4. Copy direct MP4 link
  const handleCopyDirectLink = async () => {
    if (!videoUrl) return;
    await Clipboard.setStringAsync(videoUrl);
    showToast("Direct MP4 video link copied! 🎬");
  };

  // 5. Quick Share to WhatsApp
  const handleWhatsApp = async () => {
    const encoded = encodeURIComponent(shareText);
    const appUrl = `whatsapp://send?text=${encoded}`;
    const webFallback = `https://api.whatsapp.com/send?text=${encoded}`;
    try {
      const canOpen = await Linking.canOpenURL(appUrl);
      if (canOpen) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(webFallback);
      }
      trackShareAnimation({
        animation_id: videoUrl || shareWebUrl,
        animation_type: templateSlug || "custom",
      });
    } catch (err) {
      console.warn("WhatsApp share error:", err);
    }
  };

  // 6. Quick Share to Telegram
  const handleTelegram = async () => {
    const encodedUrl = encodeURIComponent(shareWebUrl);
    const encodedText = encodeURIComponent(`Check out this AI animated memory created with AnimateMemories! ✨`);
    const appUrl = `tg://msg?url=${encodedUrl}&text=${encodedText}`;
    const webFallback = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
    try {
      const canOpen = await Linking.canOpenURL(appUrl);
      if (canOpen) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(webFallback);
      }
      trackShareAnimation({
        animation_id: videoUrl || shareWebUrl,
        animation_type: templateSlug || "custom",
      });
    } catch (err) {
      console.warn("Telegram share error:", err);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleWrap}>
              <View style={styles.headerIconBadge}>
                <Ionicons name="share-social" size={16} color="#A855F7" />
              </View>
              <Text style={styles.modalTitle}>Share Animation</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Thumbnail Preview Banner */}
            {thumbnailUrl ? (
              <View style={styles.previewBanner}>
                <Image
                  source={{ uri: thumbnailUrl }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={["transparent", "rgba(15, 23, 42, 0.95)"]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.bannerInfo}>
                  <Text style={styles.bannerBadge}>AI VIDEO READY</Text>
                  <Text style={styles.bannerTitle} numberOfLines={1}>
                    {displayTitle}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* Toast Feedback */}
            {toastMessage && (
              <View style={styles.toastWrap}>
                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                <Text style={styles.toastText}>{toastMessage}</Text>
              </View>
            )}

            {/* Primary Action: Share Video File */}
            <TouchableOpacity
              style={styles.primaryShareBtn}
              onPress={handleShareVideoFile}
              disabled={isSharingFile || !videoUrl}
              activeOpacity={0.88}
            >
              <LinearGradient
                colors={["#9333EA", "#6366F1"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryShareGradient}
              >
                {isSharingFile ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="film-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryShareText}>Share Video File (MP4)</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Secondary Action: Share Web Link */}
            <TouchableOpacity
              style={styles.secondaryShareBtn}
              onPress={handleShareWebLink}
              activeOpacity={0.85}
            >
              <Ionicons name="link-outline" size={17} color="#C084FC" />
              <Text style={styles.secondaryShareText}>Share Public Watch Link</Text>
            </TouchableOpacity>

            {/* Quick Social Channels */}
            <Text style={styles.sectionLabel}>QUICK SHARE</Text>
            <View style={styles.channelsRow}>
              <TouchableOpacity
                style={styles.channelBtn}
                onPress={handleWhatsApp}
                activeOpacity={0.8}
              >
                <View style={[styles.channelIconCircle, { backgroundColor: "#25D366" }]}>
                  <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.channelLabel}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.channelBtn}
                onPress={handleTelegram}
                activeOpacity={0.8}
              >
                <View style={[styles.channelIconCircle, { backgroundColor: "#0088CC" }]}>
                  <Ionicons name="paper-plane" size={16} color="#FFFFFF" style={{ marginLeft: -1 }} />
                </View>
                <Text style={styles.channelLabel}>Telegram</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.channelBtn}
                onPress={handleCopyLink}
                activeOpacity={0.8}
              >
                <View style={[styles.channelIconCircle, { backgroundColor: "#6366F1" }]}>
                  <Ionicons name="copy-outline" size={17} color="#FFFFFF" />
                </View>
                <Text style={styles.channelLabel}>Copy Link</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.channelBtn}
                onPress={handleShareWebLink}
                activeOpacity={0.8}
              >
                <View style={[styles.channelIconCircle, { backgroundColor: "#334155" }]}>
                  <Ionicons name="ellipsis-horizontal" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.channelLabel}>More</Text>
              </TouchableOpacity>
            </View>

            {/* Link Copy Row */}
            <View style={styles.copyBox}>
              <Text style={styles.copyUrlText} numberOfLines={1}>
                {shareWebUrl}
              </Text>
              <TouchableOpacity
                style={styles.copyPill}
                onPress={handleCopyLink}
                activeOpacity={0.8}
              >
                <Ionicons name="copy" size={12} color="#FFFFFF" />
                <Text style={styles.copyPillText}>Copy</Text>
              </TouchableOpacity>
            </View>

            {/* Direct MP4 Option */}
            {videoUrl ? (
              <TouchableOpacity
                style={styles.directLinkRow}
                onPress={handleCopyDirectLink}
                activeOpacity={0.75}
              >
                <Ionicons name="download-outline" size={14} color="#94A3B8" />
                <Text style={styles.directLinkText}>Copy direct MP4 file address</Text>
              </TouchableOpacity>
            ) : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  modalCard: {
    width: "100%",
    maxWidth: 520,
    maxHeight: "88%",
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 18,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: "#9333EA",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.08)",
  },
  headerTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(147, 51, 234, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(192, 132, 252, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: getFontFamily("700"),
    color: "#FFFFFF",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingTop: 14,
    gap: 12,
  },
  previewBanner: {
    height: 110,
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 12,
    backgroundColor: "#1E293B",
  },
  bannerInfo: {
    gap: 2,
  },
  bannerBadge: {
    fontSize: 9,
    fontFamily: getFontFamily("800"),
    color: "#C084FC",
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 14,
    fontFamily: getFontFamily("700"),
    color: "#FFFFFF",
  },
  toastWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.4)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  toastText: {
    fontSize: 12,
    fontFamily: getFontFamily("600"),
    color: "#A7F3D0",
  },
  primaryShareBtn: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#9333EA",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryShareGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  primaryShareText: {
    fontSize: 15,
    fontFamily: getFontFamily("700"),
    color: "#FFFFFF",
  },
  secondaryShareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "rgba(147, 51, 234, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(192, 132, 252, 0.35)",
  },
  secondaryShareText: {
    fontSize: 14,
    fontFamily: getFontFamily("600"),
    color: "#E9D5FF",
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: getFontFamily("700"),
    color: "#64748B",
    letterSpacing: 0.6,
    marginTop: 6,
  },
  channelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  channelBtn: {
    flex: 1,
    alignItems: "center",
    gap: 6,
  },
  channelIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  channelLabel: {
    fontSize: 11,
    fontFamily: getFontFamily("500"),
    color: "#CBD5E1",
  },
  copyBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(30, 41, 59, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 6,
    gap: 8,
  },
  copyUrlText: {
    flex: 1,
    fontSize: 12,
    fontFamily: getFontFamily("400"),
    color: "#94A3B8",
  },
  copyPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#9333EA",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  copyPillText: {
    fontSize: 11,
    fontFamily: getFontFamily("700"),
    color: "#FFFFFF",
  },
  directLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
  },
  directLinkText: {
    fontSize: 12,
    fontFamily: getFontFamily("500"),
    color: "#94A3B8",
    textDecorationLine: "underline",
  },
});
