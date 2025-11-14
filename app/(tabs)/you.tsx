import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Switch,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import { useState } from "react";
import { GradientText } from "@/components/ui/GradientText";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import NotificationsIcon from "@/components/images/NotificationsIcon";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTENT_WIDTH = SCREEN_WIDTH - 32;

export default function YouScreen() {
  const { user, signOut } = useAuth();
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/(auth)");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <ScreenWrapper addBottomPadding={true}>
      {/* Title Section */}
      <View style={styles.titleSection}>
        <GradientText style={styles.mainTitle}>
          Manage Your Account
        </GradientText>
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileImageContainer}>
          <Image
            source={{
              uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
            }}
            style={styles.profileImage}
            resizeMode="cover"
          />
          <TouchableOpacity style={styles.editButton}>
            <Text style={styles.editIcon}>✏️</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{user?.firstName || "Smith"}</Text>
        <TouchableOpacity style={styles.viewProfileButton}>
          <GradientText style={styles.viewProfileText}>
            View Profile
          </GradientText>
        </TouchableOpacity>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <NotificationsIcon />
            <Text style={styles.menuText}>Notifications</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Text style={styles.menuIcon}>💳</Text>
            <Text style={styles.menuText}>Payments</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Text style={styles.menuIcon}>❓</Text>
            <Text style={styles.menuText}>Help</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <View style={styles.logoutSection}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LinearGradient
            colors={["#28D4FA", "#D229FF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.logoutButtonGradient}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Text style={styles.menuIcon}>🏠</Text>
            <View style={styles.menuItemTextContainer}>
              <Text style={styles.menuText}>Home</Text>
              <Text style={styles.menuSubtext}>300 E 40th St, New York</Text>
            </View>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Text style={styles.menuIcon}>👁</Text>
            <Text style={styles.menuText}>Privacy</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Text style={styles.menuIcon}>⚖</Text>
            <Text style={styles.menuText}>Legal</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Dark Mode Section */}
      <View style={styles.darkModeSection}>
        <Text style={styles.darkModeText}>Dark Mode</Text>
        <Switch
          value={darkMode}
          onValueChange={setDarkMode}
          trackColor={{ false: "#e2e2e2", true: "#28D4FA" }}
          thumbColor={darkMode ? "#fff" : "#fff"}
        />
      </View>

      {/* Contact Section */}
      <View style={styles.contactSection}>
        <Text style={styles.contactText}>Need custom solutions?</Text>
        <TouchableOpacity>
          <GradientText style={styles.contactLink}>Contact Us</GradientText>
        </TouchableOpacity>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  titleSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    alignItems: "center",
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "700",
  },
  profileSection: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  profileImageContainer: {
    position: "relative",
    marginBottom: 12,
  },
  profileImage: {
    width: 115,
    height: 115,
    borderRadius: 57.5,
  },
  editButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#28D4FA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  editIcon: {
    fontSize: 12,
  },
  userName: {
    fontSize: 25,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },
  viewProfileButton: {
    marginBottom: 8,
  },
  viewProfileText: {
    fontSize: 20,
    fontWeight: "700",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  newButton: {
    backgroundColor: "#D229FF",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  newButtonText: {
    fontSize: 20,
    fontWeight: "500",
    color: "#fff",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
  },
  menuIcon: {
    fontSize: 20,
  },
  menuText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  menuItemTextContainer: {
    gap: 4,
  },
  menuSubtext: {
    fontSize: 15,
    fontWeight: "400",
    color: "#979797",
  },
  menuArrow: {
    fontSize: 20,
    color: "#000",
  },
  divider: {
    height: 0.75,
    backgroundColor: "#e9ecef",
  },
  logoutSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  logoutButton: {
    borderRadius: 4,
    overflow: "hidden",
    width: 156,
  },
  logoutButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  logoutButtonText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },
  darkModeSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
  },
  darkModeText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000",
  },
  contactSection: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    alignItems: "center",
  },
  contactText: {
    fontSize: 15,
    fontWeight: "400",
    color: "#000",
    marginBottom: 8,
  },
  contactLink: {
    fontSize: 18,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});
