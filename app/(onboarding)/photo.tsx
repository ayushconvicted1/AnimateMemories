import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Image,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

const { width: screenWidth } = Dimensions.get("window");

const sampleImages = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
];

export default function OnboardingPhoto() {
  const insets = useSafeAreaInsets();
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleSelectPhoto = () => {
    Alert.alert(
      "Select Media",
      "Choose how you'd like to select your photo or video",
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
          text: "Sample Images",
          onPress: () => setShowBottomSheet(true),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "We need camera permissions to take photos."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow both images and videos
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setSelectedImage(imageUri);
      // Navigate to create tab with image pre-uploaded
      router.replace({
        pathname: "/(tabs)/animate",
        params: {
          imageUri: encodeURIComponent(imageUri),
        },
      });
    }
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "We need gallery permissions to select media."
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All, // Allow both images and videos
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const imageUri = result.assets[0].uri;
      setSelectedImage(imageUri);
      // Navigate to create tab with image pre-uploaded
      router.replace({
        pathname: "/(tabs)/animate",
        params: {
          imageUri: encodeURIComponent(imageUri),
        },
      });
    }
  };

  const handleUseSample = () => {
    // Auto-select first sample image and proceed
    const imageUrl = sampleImages[0];
    setSelectedImage(imageUrl);
    // Navigate to create tab with image pre-uploaded
    router.replace({
      pathname: "/(tabs)/animate",
      params: {
        imageUri: encodeURIComponent(imageUrl),
      },
    });
  };

  const handleImageSelect = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowBottomSheet(false);
    // Navigate to create tab with image pre-uploaded
    router.replace({
      pathname: "/(tabs)/animate",
      params: {
        imageUri: encodeURIComponent(imageUrl),
      },
    });
  };

  const handleSkip = () => {
    router.replace("/(tabs)");
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Progress Bar */}
      <View style={[styles.progressContainer, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: "80%" }]} />
        </View>

        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Title */}
        <Text style={styles.title}>
          <Text style={styles.titleBlue}>Let's Start</Text>
          {"\n"}
          <Text style={styles.titlePurple}>With A Photo</Text>
        </Text>

        {/* Photo Stack */}
        <View style={styles.photoStack}>
          {/* Background Photos */}
          <View style={[styles.photoCard, styles.photoCard3]}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=250&fit=crop&crop=face",
              }}
              style={styles.photo}
            />
          </View>

          <View style={[styles.photoCard, styles.photoCard2]}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=250&fit=crop&crop=face",
              }}
              style={styles.photo}
            />
          </View>

          {/* Main Photo */}
          <View style={[styles.photoCard, styles.photoCard1]}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=250&fit=crop&crop=face",
              }}
              style={styles.photo}
            />
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleSelectPhoto}>
            <LinearGradient
              colors={["#28D4FA", "#D229FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButton}
            >
              <Text style={styles.primaryButtonText}>Select Photo</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleUseSample}
          >
            <Text style={styles.secondaryButtonText}>Use a Sample Image</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Sheet Modal */}
      <Modal
        visible={showBottomSheet}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBottomSheet(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.bottomSheetHeader}>
              <Text style={styles.bottomSheetTitle}>Choose any one image</Text>
              <TouchableOpacity
                onPress={() => setShowBottomSheet(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.imageGrid}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.imageRow}>
                {sampleImages.map((imageUrl, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.imageContainer}
                    onPress={() => handleImageSelect(imageUrl)}
                  >
                    <Image
                      source={{ uri: imageUrl }}
                      style={styles.gridImage}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    justifyContent: "flex-start",
  },
  backButton: {
    padding: 10,
    marginRight: 10,
  },
  backText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "500",
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#333",
    borderRadius: 2,
    marginRight: 20,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#28D4FA",
    borderRadius: 2,
  },
  skipButton: {
    padding: 10,
  },
  skipText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 80,
    lineHeight: 50,
  },
  titleBlue: {
    color: "#28D4FA",
  },
  titlePurple: {
    color: "#D229FF",
  },
  photoStack: {
    position: "relative",
    width: 200,
    height: 250,
    marginBottom: 100,
  },
  photoCard: {
    position: "absolute",
    width: 160,
    height: 200,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#D229FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  photoCard1: {
    top: 0,
    left: 20,
    zIndex: 3,
    transform: [{ rotate: "5deg" }],
  },
  photoCard2: {
    top: 10,
    left: 10,
    zIndex: 2,
    transform: [{ rotate: "-3deg" }],
    opacity: 0.8,
  },
  photoCard3: {
    top: 20,
    left: 0,
    zIndex: 1,
    transform: [{ rotate: "2deg" }],
    opacity: 0.6,
  },
  photo: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 300,
    gap: 16,
  },
  primaryButton: {
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  secondaryButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "500",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  bottomSheet: {
    backgroundColor: "#2a2a2a",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: "60%",
  },
  bottomSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  bottomSheetTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#444",
    justifyContent: "center",
    alignItems: "center",
  },
  closeText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  imageGrid: {
    flex: 1,
  },
  imageRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  imageContainer: {
    width: (screenWidth - 80) / 2 - 10,
    height: (screenWidth - 80) / 2 - 10,
    marginBottom: 15,
    borderRadius: 12,
    overflow: "hidden",
  },
  gridImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
});
