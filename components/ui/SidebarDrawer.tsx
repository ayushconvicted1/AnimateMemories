import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
  Platform,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AnimateMemoriesLogo from "@/components/images/AnimateMemoriesLogo";
import HomeIcon from "@/components/images/HomeIcon";
import GalleryIcon from "@/components/images/GalleryIcon";
import CreditIcon from "@/components/images/CreditIcon";
import NotificationsIcon from "@/components/images/NotificationsIcon";
import PaymentsIcon from "@/components/images/PaymentsIcon";
import HelpIcon from "@/components/images/HelpIcon";
import PrivacyIcon from "@/components/images/PrivacyIcon";
import AnimateMemoriesTabsLogo from "@/components/images/AnimateMemoriesTabsLogo";
import YouIcon from "@/components/images/YouIcon";
import { useAuth } from "@/contexts/AuthContext";
import { useAuth as useClerkAuth } from "@clerk/clerk-expo";
import { api } from "@/services/api";
import { getFontFamily } from "@/constants/Fonts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SIDEBAR_WIDTH = Math.min(SCREEN_WIDTH * 0.8, 320);

interface SidebarDrawerProps {
  visible: boolean;
  onClose: () => void;
}

export default function SidebarDrawer({ visible, onClose }: SidebarDrawerProps) {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { getToken } = useClerkAuth();
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    if (visible && user) {
      async function loadCredits() {
        try {
          const token = await getToken();
          const res = await api.verifyUser(user, token);
          if (res?.result?.credits !== undefined) {
            setCredits(res.result.credits);
          }
        } catch (e) {
          setCredits(0);
        }
      }
      loadCredits();
    }
  }, [visible, user, getToken]);

  const handleNavigate = (path: string) => {
    onClose();
    setTimeout(() => {
      router.push(path as any);
    }, 150);
  };

  const handleLogout = async () => {
    onClose();
    try {
      await signOut();
      router.replace("/(auth)" as any);
    } catch (e) {
      console.error("Sign out error", e);
    }
  };

  const userName =
    user?.fullName ||
    user?.firstName ||
    user?.primaryEmailAddress?.emailAddress?.split("@")[0] ||
    "Guest User";
  const userEmail =
    user?.primaryEmailAddress?.emailAddress ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "";
  const userInitials = userName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const menuItems = [
    {
      id: "home",
      label: "Home",
      icon: <HomeIcon width={20} height={20} color="#0F172A" />,
      path: "/(tabs)",
    },
    {
      id: "animate",
      label: "Animate Photos",
      icon: <AnimateMemoriesTabsLogo width={20} height={20} color="#0F172A" />,
      path: "/(tabs)/animate",
      badge: "AI Magic",
    },
    {
      id: "gallery",
      label: "My Gallery",
      icon: <GalleryIcon width={20} height={20} color="#0F172A" />,
      path: "/(tabs)/gallery",
    },
    {
      id: "credit",
      label: "Buy Credits",
      icon: <CreditIcon width={20} height={20} color="#D229FF" />,
      path: "/(tabs)/credit",
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: <NotificationsIcon width={20} height={20} color="#0F172A" />,
      path: "/(tabs)/notifications",
    },
    {
      id: "payments",
      label: "Payments & Billing",
      icon: <PaymentsIcon width={20} height={20} color="#0F172A" />,
      path: "/(tabs)/payments",
    },
    {
      id: "help",
      label: "Help & Support",
      icon: <HelpIcon width={20} height={20} color="#0F172A" />,
      path: "/(tabs)/help",
    },
    {
      id: "privacy",
      label: "Privacy & Legal",
      icon: <PrivacyIcon width={20} height={20} color="#0F172A" />,
      path: "/(tabs)/privacy-legal",
    },
    {
      id: "you",
      label: "Account Settings",
      icon: <YouIcon width={20} height={20} color="#0F172A" />,
      path: "/(tabs)/you",
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop overlay */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Sidebar Drawer Panel */}
        <View
          style={[
            styles.drawerContainer,
            {
              paddingTop: Math.max(insets.top + 10, Platform.OS === "ios" ? 52 : 36),
              paddingBottom: Math.max(insets.bottom + 12, 24),
            },
          ]}
        >
          {/* Sidebar Top Header */}
          <View style={styles.drawerHeader}>
            <AnimateMemoriesLogo width={118} height={28} />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* User Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileRow}>
              {user?.imageUrl ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  style={styles.avatarImage}
                />
              ) : (
                <LinearGradient
                  colors={["#38BDF8", "#D229FF"]}
                  style={styles.avatarGradient}
                >
                  <Text style={styles.avatarText}>{userInitials}</Text>
                </LinearGradient>
              )}
              <View style={styles.profileTextContainer}>
                <Text style={styles.userNameText} numberOfLines={1}>
                  {userName}
                </Text>
                {userEmail ? (
                  <Text style={styles.userEmailText} numberOfLines={1}>
                    {userEmail}
                  </Text>
                ) : null}
              </View>
            </View>

            {/* Credits Info */}
            <View style={styles.creditsRow}>
              <View style={styles.creditsPill}>
                <Text style={styles.creditsPillText}>
                  ⚡ {credits !== null ? `${credits} Credits` : "Loading..."}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => handleNavigate("/(tabs)/credit")}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#38BDF8", "#00A3FF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.getCreditsBtn}
                >
                  <Text style={styles.getCreditsText}>+ Get Credits</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          {/* Menu Items List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.menuList}
          >
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.menuItemTouchable}
                onPress={() => handleNavigate(item.path)}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconBox}>{item.icon}</View>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                </View>
                {item.badge && (
                  <View style={styles.badgeBox}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Sidebar Footer */}
          <View style={styles.drawerFooter}>
            {user ? (
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={handleLogout}
                activeOpacity={0.7}
              >
                <Text style={styles.logoutText}>Sign Out</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.loginButton}
                onPress={() => handleNavigate("/(auth)")}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#38BDF8", "#D229FF"]}
                  style={styles.loginGradient}
                >
                  <Text style={styles.loginText}>Sign In / Register</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    flexDirection: "row",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  drawerContainer: {
    width: SIDEBAR_WIDTH,
    height: "100%",
    backgroundColor: "#FFFFFF",
    paddingTop: Platform.OS === "ios" ? 52 : 36,
    paddingBottom: 24,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    justifyContent: "space-between",
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 18,
    color: "#64748B",
    fontFamily: getFontFamily("600"),
  },
  profileCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 20,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontFamily: getFontFamily("600"),
    color: "#FFFFFF",
  },
  profileTextContainer: {
    flex: 1,
  },
  userNameText: {
    fontSize: 17,
    fontFamily: getFontFamily("600"),
    color: "#0F172A",
  },
  userEmailText: {
    fontSize: 14,
    fontFamily: getFontFamily("400"),
    color: "#64748B",
    marginTop: 2,
  },
  creditsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  creditsPill: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  creditsPillText: {
    fontSize: 14,
    fontFamily: getFontFamily("600"),
    color: "#0284C7",
  },
  getCreditsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  getCreditsText: {
    fontSize: 13,
    fontFamily: getFontFamily("600"),
    color: "#FFFFFF",
  },
  menuList: {
    paddingVertical: 4,
    gap: 4,
  },
  menuItemTouchable: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  menuIconBox: {
    width: 28,
    alignItems: "center",
  },
  menuItemLabel: {
    fontSize: 17,
    fontFamily: getFontFamily("500"),
    color: "#1E293B",
  },
  badgeBox: {
    backgroundColor: "#F0F9FF",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  badgeText: {
    fontSize: 12,
    fontFamily: getFontFamily("600"),
    color: "#0284C7",
  },
  drawerFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 12,
  },
  logoutButton: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FEE2E2",
  },
  logoutText: {
    fontSize: 16,
    fontFamily: getFontFamily("600"),
    color: "#EF4444",
  },
  loginButton: {
    borderRadius: 12,
    overflow: "hidden",
  },
  loginGradient: {
    paddingVertical: 12,
    alignItems: "center",
  },
  loginText: {
    fontSize: 16,
    fontFamily: getFontFamily("600"),
    color: "#FFFFFF",
  },
});
