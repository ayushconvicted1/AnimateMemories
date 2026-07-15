import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/contexts/AuthContext";
import { useAuth as useClerkAuth, useUser } from "@clerk/clerk-expo";
import { router } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import { GradientText } from "@/components/ui/GradientText";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import NotificationsIcon from "@/components/images/NotificationsIcon";
import PaymentsIcon from "@/components/images/PaymentsIcon";
import HelpIcon from "@/components/images/HelpIcon";
import PrivacyIcon from "@/components/images/PrivacyIcon";
import LegalIcon from "@/components/images/LegalIcon";
import EditIcon from "@/components/images/EditIcon";
import SkeletonLoader from "@/components/ui/SkeletonLoader";
import { api } from "@/services/api";
import SearchGradient from "@/components/reusable/SearchGradient";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CONTENT_WIDTH = SCREEN_WIDTH - 32;

interface UserStats {
  credits: number;
  videosCreated: number;
  imagesCreated: number;
  totalCreated: number;
  shared: number;
}

export default function YouScreen() {
  const { user, signOut } = useAuth();
  const { getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const [editNameModal, setEditNameModal] = useState(false);
  const [editEmailModal, setEditEmailModal] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [editingEmail, setEditingEmail] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUpdatingImage, setIsUpdatingImage] = useState(false);

  const fetchUserCredits = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getToken();
      const result = await api.verifyUser(user, token);
      setUserCredits(result.result?.credits || 0);
      // Update userName from database
      if (result.result?.name) {
        setUserName(result.result.name);
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
      setUserCredits(0);
    }
  }, [user]); // Removed getToken from dependencies

  const fetchUserStats = useCallback(async () => {
    if (!user) {
      setLoadingStats(false);
      return;
    }
    try {
      setLoadingStats(true);
      const userEmail =
        user?.primaryEmailAddress?.emailAddress ||
        user?.emailAddresses?.[0]?.emailAddress;
      if (!userEmail) {
        setLoadingStats(false);
        return;
      }
      const token = await getToken();
      const result = await api.getUserStats(userEmail, token);
      setUserStats(result.result || null);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      setUserStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, [user]); // Removed getToken from dependencies

  useEffect(() => {
    if (user) {
      fetchUserCredits();
      fetchUserStats();
    }
  }, [user, fetchUserCredits, fetchUserStats]);

  const handleLogout = async () => {
    try {
      await signOut();
      router.replace("/(auth)");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const openEditNameModal = () => {
    setEditingName(userName || user?.fullName || user?.firstName || "");
    setEditNameModal(true);
  };

  const openEditEmailModal = () => {
    const userEmail =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress ||
      "";
    setEditingEmail(userEmail);
    setEditEmailModal(true);
  };

  const handleUpdateName = async () => {
    if (!editingName.trim()) {
      Alert.alert("Error", "Name cannot be empty");
      return;
    }

    setIsUpdating(true);
    try {
      const userEmail =
        user?.primaryEmailAddress?.emailAddress ||
        user?.emailAddresses?.[0]?.emailAddress;
      if (!userEmail) {
        Alert.alert("Error", "Unable to get user email");
        return;
      }

      const token = await getToken();

      // Update in Clerk using unsafeMetadata (Clerk doesn't support firstName/lastName in React Native)
      if (clerkUser) {
        try {
          await clerkUser.update({
            unsafeMetadata: {
              fullName: editingName,
            },
          });
        } catch (clerkError) {
          console.log(
            "Clerk metadata update failed (non-critical):",
            clerkError
          );
          // Continue with database update even if Clerk update fails
        }
      }

      // Update in database
      await api.updateUser(userEmail, editingName, undefined, token);

      // Update local state immediately
      setUserName(editingName);

      Alert.alert("Success", "Name updated successfully");
      setEditNameModal(false);
      // Refresh user data
      fetchUserCredits();
      fetchUserStats();
    } catch (error: any) {
      console.error("Error updating name:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to update name. Please try again."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!editingEmail.trim()) {
      Alert.alert("Error", "Email cannot be empty");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editingEmail)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setIsUpdating(true);
    try {
      const currentEmail =
        user?.primaryEmailAddress?.emailAddress ||
        user?.emailAddresses?.[0]?.emailAddress;
      if (!currentEmail) {
        Alert.alert("Error", "Unable to get current email");
        return;
      }

      const token = await getToken();

      // Update in Clerk (this will send verification email)
      if (clerkUser) {
        await clerkUser.createEmailAddress({ email: editingEmail });
        Alert.alert(
          "Verification Required",
          "A verification email has been sent to your new email address. Please verify it to complete the update."
        );
      }

      // Update in database
      await api.updateUser(currentEmail, undefined, editingEmail, token);

      setEditEmailModal(false);
      // Refresh user data
      fetchUserCredits();
    } catch (error: any) {
      console.error("Error updating email:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to update email. Please try again."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const requestImagePermission = async () => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant camera roll permissions to upload images."
        );
        return false;
      }
    }
    return true;
  };

  const requestCameraPermission = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission needed",
          "Please grant camera permissions to take photos."
        );
        return false;
      }
    }
    return true;
  };

  const handleEditProfileImage = () => {
    Alert.alert(
      "Change Profile Photo",
      "Choose how you'd like to select your photo",
      [
        {
          text: "Camera",
          onPress: () => openCamera(),
        },
        {
          text: "Gallery",
          onPress: () => openGallery(),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const openCamera = async () => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return;

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await updateProfileImage(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error("Error opening camera:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to open camera. Please try again."
      );
    }
  };

  const openGallery = async () => {
    try {
      const hasPermission = await requestImagePermission();
      if (!hasPermission) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        await updateProfileImage(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error("Error opening gallery:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to open gallery. Please try again."
      );
    }
  };

  const handleContactUs = async () => {
    const email = "support@animatememories.com";
    const subject = "Support Request";
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
      } else {
        Alert.alert(
          "Error",
          "Unable to open email client. Please email us at support@animatememories.com"
        );
      }
    } catch (error) {
      console.error("Error opening email:", error);
      Alert.alert(
        "Error",
        "Unable to open email client. Please email us at support@animatememories.com"
      );
    }
  };

  const updateProfileImage = async (imageUri: string) => {
    if (!clerkUser) {
      Alert.alert("Error", "User not found. Please sign in again.");
      return;
    }

    setIsUpdatingImage(true);
    try {
      // Upload image to Cloudinary first
      const token = await getToken();
      const cloudinaryUrl = await api.uploadImage(imageUri, token);

      if (!cloudinaryUrl) {
        throw new Error("Failed to upload image");
      }

      // Update Clerk profile image
      // For React Native, Clerk's setProfileImage accepts a file object
      // We need to create a proper file object from the local URI
      try {
        if (Platform.OS === "web") {
          // For web, fetch the image and create a File object
          const response = await fetch(cloudinaryUrl);
          const blob = await response.blob();
          const file = new File([blob], "profile.jpg", { type: "image/jpeg" });
          await clerkUser.setProfileImage({ file });
        } else {
          // For React Native, try to use the local URI directly
          // Clerk's React Native SDK should accept the local file URI
          // Create a file-like object with the URI
          const file = {
            uri: imageUri,
            type: "image/jpeg",
            name: "profile.jpg",
          } as any;

          await clerkUser.setProfileImage({ file });
        }
      } catch (clerkError: any) {
        console.log(
          "Clerk setProfileImage error, using metadata fallback:",
          clerkError
        );
        // Fallback: Store the URL in metadata for display
        // This ensures the image is at least stored and can be displayed
        await clerkUser.update({
          unsafeMetadata: {
            profileImageUrl: cloudinaryUrl,
          },
        });
      }

      Alert.alert("Success", "Profile image updated successfully!");
      // Force a refresh by updating the user object
      // The image should update automatically from Clerk
      await clerkUser.reload();
    } catch (error: any) {
      console.error("Error updating profile image:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to update profile image. Please try again."
      );
    } finally {
      setIsUpdatingImage(false);
    }
  };

  return (
    <ScreenWrapper
      addBottomPadding={true}
      creditsText={
        userCredits !== null ? `${userCredits} Credits` : "Loading..."
      }
    >
      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={styles.mainTitle}>Manage Your Account</Text>
      </View>

      {/* Profile Section */}
      <View style={styles.profileSection}>
        {loadingStats || !user ? (
          <>
            <SkeletonLoader width={115} height={115} borderRadius={57.5} />
            <View
              style={{ marginTop: 12, alignItems: "center", width: "100%" }}
            >
              <SkeletonLoader width={150} height={25} borderRadius={4} />
              <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
                <SkeletonLoader width={100} height={36} borderRadius={6} />
                <SkeletonLoader width={100} height={36} borderRadius={6} />
              </View>
            </View>
          </>
        ) : (
          <>
            <View style={styles.profileImageContainer}>
              <Image
                source={{
                  uri:
                    user?.imageUrl ||
                    (clerkUser?.unsafeMetadata?.profileImageUrl as string) ||
                    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
                }}
                style={styles.profileImage}
                resizeMode="cover"
              />
              <TouchableOpacity
                style={styles.editButton}
                onPress={handleEditProfileImage}
                disabled={isUpdatingImage}
              >
                {isUpdatingImage ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <LinearGradient
                    colors={["#28D4FA", "#D229FF"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.editButtonGradient}
                  >
                    <EditIcon color="#fff" />
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </View>
            <Text style={styles.userName}>
              {userName || user?.fullName || user?.firstName || "User"}
            </Text>
            <View style={styles.profileActions}>
              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={openEditNameModal}
              >
                <Text style={styles.editProfileText}>Edit Name</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.editProfileButton}
                onPress={openEditEmailModal}
              >
                <Text style={styles.editProfileText}>Edit Email</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Stats Section */}
      {loadingStats ? (
        <View style={styles.statsSection}>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <SkeletonLoader width={60} height={28} borderRadius={4} />
              <View style={{ marginTop: 8 }}>
                <SkeletonLoader width={100} height={14} borderRadius={4} />
              </View>
            </View>
            <View style={styles.statCard}>
              <SkeletonLoader width={60} height={28} borderRadius={4} />
              <View style={{ marginTop: 8 }}>
                <SkeletonLoader width={100} height={14} borderRadius={4} />
              </View>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <SkeletonLoader width={60} height={28} borderRadius={4} />
              <View style={{ marginTop: 8 }}>
                <SkeletonLoader width={100} height={14} borderRadius={4} />
              </View>
            </View>
            <View style={styles.statCard}>
              <SkeletonLoader width={60} height={28} borderRadius={4} />
              <View style={{ marginTop: 8 }}>
                <SkeletonLoader width={100} height={14} borderRadius={4} />
              </View>
            </View>
          </View>
        </View>
      ) : (
        userStats && (
          <View style={styles.statsSection}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {userStats.videosCreated || 0}
                </Text>
                <Text style={styles.statLabel}>Videos Created</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {userStats.imagesCreated || 0}
                </Text>
                <Text style={styles.statLabel}>Images Created</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {userStats.totalCreated || 0}
                </Text>
                <Text style={styles.statLabel}>Total Created</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{userStats.shared || 0}</Text>
                <Text style={styles.statLabel}>Shared</Text>
              </View>
            </View>
          </View>
        )
      )}

      {/* Account Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/(tabs)/notifications")}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.iconContainer}>
              <NotificationsIcon />
            </View>
            <Text style={styles.menuText}>Notifications</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/(tabs)/payments")}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.iconContainer}>
              <PaymentsIcon />
            </View>
            <Text style={styles.menuText}>Payments</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/(tabs)/help")}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.iconContainer}>
              <HelpIcon />
            </View>
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

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/(tabs)/privacy-legal")}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.iconContainer}>
              <PrivacyIcon />
            </View>
            <Text style={styles.menuText}>Privacy</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.divider} />

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/(tabs)/privacy-legal")}
        >
          <View style={styles.menuItemLeft}>
            <View style={styles.iconContainer}>
              <LegalIcon />
            </View>
            <Text style={styles.menuText}>Legal</Text>
          </View>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Contact Section */}
      <View style={styles.contactSection}>
        <Text style={styles.contactText}>Need custom solutions?</Text>
        <TouchableOpacity onPress={handleContactUs}>
          <GradientText style={styles.contactLink}>Contact Us</GradientText>
        </TouchableOpacity>
      </View>

      {/* Edit Name Modal */}
      <Modal
        visible={editNameModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditNameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Name</Text>
            <SearchGradient
              label="Full Name"
              value={editingName}
              onChangeText={setEditingName}
              autoCapitalize="words"
              marginTop={20}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditNameModal(false)}
                disabled={isUpdating}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateName}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <LinearGradient
                    colors={["#28D4FA", "#D229FF"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveButtonGradient}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Email Modal */}
      <Modal
        visible={editEmailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditEmailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Email</Text>
            <SearchGradient
              label="Email Address"
              value={editingEmail}
              onChangeText={setEditingEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              marginTop={20}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setEditEmailModal(false)}
                disabled={isUpdating}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleUpdateEmail}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <LinearGradient
                    colors={["#28D4FA", "#D229FF"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveButtonGradient}
                  >
                    <Text style={styles.saveButtonText}>Save</Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
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
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 2.5,
    borderColor: "#fff",
    elevation: 5,
  },
  editButtonGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  userName: {
    fontSize: 21,
    fontWeight: "700",
    color: "#000",
    marginBottom: 12,
  },
  viewProfileButton: {
    marginBottom: 8,
  },
  viewProfileText: {
    fontSize: 17,
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
    fontSize: 17,
    fontWeight: "500",
    color: "#fff",
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 24,
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
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.5,
    borderColor: "#e0e0e0",
  },
  menuIcon: {
    fontSize: 17,
  },
  menuText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#000",
  },
  menuItemTextContainer: {
    gap: 4,
  },
  menuSubtext: {
    fontSize: 13,
    fontWeight: "400",
    color: "#979797",
  },
  menuArrow: {
    fontSize: 17,
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
    fontSize: 17,
    fontWeight: "600",
    color: "#fff",
  },
  contactSection: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    alignItems: "center",
  },
  contactText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#000",
    marginBottom: 8,
  },
  contactLink: {
    fontSize: 15,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  statsSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#979797",
    textAlign: "center",
  },
  profileActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  editProfileButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  editProfileText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#000",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000",
    marginBottom: 20,
    textAlign: "center",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 30,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    overflow: "hidden",
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000",
  },
  saveButton: {
    borderRadius: 8,
    overflow: "hidden",
  },
  saveButtonGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
  },
  modalScrollView: {
    flex: 1,
  },
  notificationSection: {
    paddingVertical: 8,
  },
  notificationItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
  },
  notificationItemLeft: {
    flex: 1,
    marginRight: 16,
  },
  notificationLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  notificationDescription: {
    fontSize: 12,
    fontWeight: "400",
    color: "#979797",
    lineHeight: 20,
  },
  paymentSection: {
    paddingVertical: 8,
  },
  paymentCard: {
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  paymentCardTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#979797",
    marginBottom: 8,
  },
  paymentCardValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  paymentButton: {
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 24,
  },
  paymentButtonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  paymentInfo: {
    marginBottom: 20,
  },
  paymentInfoTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 8,
  },
  paymentInfoText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#979797",
    lineHeight: 22,
  },
  helpSection: {
    paddingVertical: 8,
  },
  helpItem: {
    paddingVertical: 16,
  },
  helpItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  helpItemText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#979797",
    lineHeight: 22,
  },
  helpContactButton: {
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 16,
  },
  helpContactButtonGradient: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  helpContactButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  privacySection: {
    paddingVertical: 8,
  },
  privacyItem: {
    paddingVertical: 16,
  },
  privacyItemTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000",
    marginBottom: 12,
  },
  privacyItemText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#979797",
    lineHeight: 22,
  },
});
