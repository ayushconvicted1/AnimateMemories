import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Video, ResizeMode } from "expo-av";
import { GradientText } from "@/components/ui/GradientText";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import FullScreenVideoViewer from "@/components/ui/FullScreenVideoViewer";
import SearchIcon from "@/components/images/SearchIcon";
import FilterIcon from "@/components/images/FilterIcon";
import { useAuth as useAuthContext } from "@/contexts/AuthContext";
import { useAuth } from "@clerk/clerk-expo";
import { api } from "@/services/api";
import { Linking } from "react-native";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const CONTENT_WIDTH = SCREEN_WIDTH - 32;
const ITEM_WIDTH = (CONTENT_WIDTH - 12) / 2;

interface GalleryItem {
  id: number;
  roomType: string;
  designType?: string;
  orgImage: string;
  aiImage: string;
  userEmail: string;
  createdAt: string;
}

export default function GalleryScreen() {
  const { user } = useAuthContext();
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<"Image" | "Videos">("Videos");
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<GalleryItem | null>(null);
  const [userCredits, setUserCredits] = useState<number | null>(null);

  const fetchGallery = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    const userEmail =
      user?.primaryEmailAddress?.emailAddress ||
      user?.emailAddresses?.[0]?.emailAddress;
    if (!userEmail) {
      setLoading(false);
      return;
    }

    try {
      const token = await getToken();
      const result = await api.getGallery(userEmail, token);
      setGalleryItems(result.result || []);
    } catch (error) {
      console.error("Error fetching gallery:", error);
      Alert.alert("Error", "Failed to load gallery. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]); // Removed getToken from dependencies

  const fetchUserCredits = useCallback(async () => {
    if (!user) return;
    try {
      const token = await getToken();
      const result = await api.verifyUser(user, token);
      setUserCredits(result.result?.credits || 0);
    } catch (error) {
      console.error("Error fetching credits:", error);
      setUserCredits(0);
    }
  }, [user]); // Removed getToken from dependencies

  useEffect(() => {
    if (user) {
      fetchGallery();
      fetchUserCredits();
    }
  }, [user, fetchGallery, fetchUserCredits]);

  // Use useMemo to prevent flickering - only recalculate when dependencies change
  const filteredItems = useMemo(() => {
    let filtered = [...galleryItems];

    // Filter by type - Videos are "Old Photo Animation", Images are everything else
    if (activeTab === "Videos") {
      filtered = filtered.filter(
        (item) => item.roomType === "Old Photo Animation"
      );
    } else if (activeTab === "Image") {
      filtered = filtered.filter(
        (item) => item.roomType !== "Old Photo Animation"
      );
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (item) =>
          item.roomType.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.designType?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [activeTab, searchTerm, galleryItems]);

  const handleDelete = async (item: GalleryItem) => {
    Alert.alert(
      "Delete Item",
      `Are you sure you want to delete this ${
        item.roomType === "Old Photo Animation" ? "video" : "image"
      }?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const userEmail =
              user?.primaryEmailAddress?.emailAddress ||
              user?.emailAddresses?.[0]?.emailAddress;
            if (!userEmail) return;

            setDeletingId(item.id);
            try {
              const token = await getToken();
              await api.deleteImage(userEmail, item.id, token);
              setGalleryItems((prev) => prev.filter((i) => i.id !== item.id));
              Alert.alert("Success", "Item deleted successfully");
            } catch (error: any) {
              console.error("Error deleting item:", error);
              Alert.alert(
                "Error",
                error.message || "Failed to delete item. Please try again."
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const handleDownload = async (item: GalleryItem) => {
    try {
      // Open the URL in browser for download
      const canOpen = await Linking.canOpenURL(item.aiImage);
      if (canOpen) {
        await Linking.openURL(item.aiImage);
      } else {
        Alert.alert("Error", "Unable to open download link.");
      }
    } catch (error: any) {
      console.error("Error downloading:", error);
      Alert.alert("Error", "Failed to download file. Please try again.");
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchGallery();
  }, [fetchGallery]);

  const isVideo = (item: GalleryItem) =>
    item.roomType === "Old Photo Animation";

  const imageCount = galleryItems.filter((item) => !isVideo(item)).length;
  const videoCount = galleryItems.filter((item) => isVideo(item)).length;
  const totalCount = galleryItems.length;

  const handleVideoPress = (item: GalleryItem) => {
    if (isVideo(item)) {
      setSelectedVideo(item);
    }
  };

  const closeVideoModal = () => {
    setSelectedVideo(null);
  };

  const handleDeleteFromModal = async () => {
    if (!selectedVideo) return;

    Alert.alert("Delete Video", "Are you sure you want to delete this video?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const userEmail =
            user?.primaryEmailAddress?.emailAddress ||
            user?.emailAddresses?.[0]?.emailAddress;
          if (!userEmail) return;

          setDeletingId(selectedVideo.id);
          try {
            const token = await getToken();
            await api.deleteImage(userEmail, selectedVideo.id, token);
            setGalleryItems((prev) =>
              prev.filter((i) => i.id !== selectedVideo.id)
            );
            Alert.alert("Success", "Video deleted successfully");
            closeVideoModal();
          } catch (error: any) {
            console.error("Error deleting video:", error);
            Alert.alert(
              "Error",
              error.message || "Failed to delete video. Please try again."
            );
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  };

  const handleDownloadFromModal = async () => {
    if (!selectedVideo) return;
    await handleDownload(selectedVideo);
  };

  const renderItem = ({ item }: { item: GalleryItem }) => (
    <TouchableOpacity
      style={styles.galleryItem}
      onPress={() => isVideo(item) && handleVideoPress(item)}
      activeOpacity={isVideo(item) ? 0.8 : 1}
    >
      {isVideo(item) ? (
        <Video
          source={{ uri: item.aiImage }}
          style={styles.galleryImage}
          resizeMode={ResizeMode.COVER}
          shouldPlay={false}
          useNativeControls={false}
        />
      ) : (
        <Image
          source={{ uri: item.aiImage }}
          style={styles.galleryImage}
          resizeMode="cover"
        />
      )}
      <View style={styles.itemOverlay}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDownload(item);
          }}
        >
          <Text style={styles.actionButtonText}>⬇</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={(e) => {
            e.stopPropagation();
            handleDelete(item);
          }}
          disabled={deletingId === item.id}
        >
          {deletingId === item.id ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.actionButtonText}>🗑</Text>
          )}
        </TouchableOpacity>
      </View>
      {isVideo(item) && (
        <View style={styles.videoBadge}>
          <Text style={styles.videoBadgeText}>VIDEO</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderHeader = useCallback(
    () => (
      <>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <GradientText style={styles.mainTitle}>My Gallery</GradientText>
          <Text style={styles.subtitle}>
            View and manage all your AI-generated masterpieces in one place
          </Text>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <LinearGradient
              colors={["rgba(40, 212, 250, 0.15)", "rgba(210, 41, 255, 0.15)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardOuter}
            >
              <BlurView
                intensity={40}
                tint="light"
                style={styles.statCardInner}
              >
                <GradientText style={styles.statNumber}>
                  {imageCount}
                </GradientText>
              </BlurView>
            </LinearGradient>
            <Text style={styles.statLabel}>Images</Text>
          </View>
          <View style={styles.statCard}>
            <LinearGradient
              colors={["rgba(40, 212, 250, 0.15)", "rgba(210, 41, 255, 0.15)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardOuter}
            >
              <BlurView
                intensity={40}
                tint="light"
                style={styles.statCardInner}
              >
                <GradientText style={styles.statNumber}>
                  {videoCount}
                </GradientText>
              </BlurView>
            </LinearGradient>
            <Text style={styles.statLabel}>Videos</Text>
          </View>
          <View style={styles.statCard}>
            <LinearGradient
              colors={["rgba(40, 212, 250, 0.15)", "rgba(210, 41, 255, 0.15)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardOuter}
            >
              <BlurView
                intensity={40}
                tint="light"
                style={styles.statCardInner}
              >
                <GradientText style={styles.statNumber}>
                  {totalCount}
                </GradientText>
              </BlurView>
            </LinearGradient>
            <View style={[styles.statLabelContainer, { alignSelf: "center" }]}>
              <Text style={styles.statLabel}>Total Creations</Text>
            </View>
          </View>
        </View>

        {/* Search and Filter */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <SearchIcon />
            <TextInput
              style={styles.searchInput}
              placeholder="Search"
              placeholderTextColor="#979797"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <LinearGradient
              colors={["#28D4FA", "#D229FF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.filterButtonGradient}
            >
              <FilterIcon />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Content Type Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "Image" && styles.tabActive]}
            onPress={() => {
              console.log("Setting tab to Image, current:", activeTab);
              setActiveTab("Image");
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "Image" && styles.tabTextActive,
              ]}
            >
              Image
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "Videos" && styles.tabActive]}
            onPress={() => {
              console.log("Setting tab to Videos, current:", activeTab);
              setActiveTab("Videos");
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === "Videos" && styles.tabTextActive,
              ]}
            >
              Videos
            </Text>
          </TouchableOpacity>
        </View>
      </>
    ),
    [activeTab, imageCount, videoCount, totalCount, searchTerm]
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {searchTerm
          ? "No items found matching your search"
          : "Your gallery is empty. Start creating!"}
      </Text>
    </View>
  );

  return (
    <ScreenWrapper
      addBottomPadding={true}
      creditsText={
        userCredits !== null ? `${userCredits} Credits` : "Loading..."
      }
      useCustomScroll={true}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#28D4FA" />
          <Text style={styles.loadingText}>Loading gallery...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          columnWrapperStyle={styles.galleryRow}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          extraData={activeTab}
          contentContainerStyle={[
            styles.galleryContent,
            filteredItems.length === 0 && styles.emptyContentContainer,
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          scrollEventThrottle={16}
          removeClippedSubviews={false}
          nestedScrollEnabled={true}
        />
      )}

      {/* Full Screen Video Modal */}
      <FullScreenVideoViewer
        visible={selectedVideo !== null}
        videoUri={selectedVideo?.aiImage || null}
        onClose={closeVideoModal}
        onDownload={handleDownloadFromModal}
        onDelete={handleDeleteFromModal}
        isDeleting={deletingId === selectedVideo?.id}
        showDelete={true}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  titleSection: {
    paddingTop: 20,
    paddingBottom: 12,
    alignItems: "center",
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: "400",
    color: "#000",
    textAlign: "center",
    lineHeight: 28,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
  },
  statCardOuter: {
    width: 110,
    height: 110,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    padding: 22,
  },
  statCardInner: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    elevation: 5,
    overflow: "hidden",
  },
  statNumber: {
    fontSize: 26,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 15,
    fontWeight: "400",
    color: "#303030",
    textAlign: "center",
  },
  statLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  searchSection: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0.95,
    borderColor: "#979797",
    borderRadius: 3.801,
    paddingHorizontal: 12.671,
    paddingVertical: 12.671,
    gap: 12.671,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "300",
    color: "#000",
  },
  filterButton: {
    width: 55.752,
    height: 55.752,
    borderRadius: 3.801,
    overflow: "hidden",
  },
  filterButtonGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 0,
    borderWidth: 0.354,
    borderColor: "#979797",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    backgroundColor: "#fff",
  },
  tabActive: {
    backgroundColor: "#D229FF",
    elevation: 3,
    borderWidth: 0,
  },
  tabText: {
    fontSize: 17,
    fontWeight: "500",
    color: "#979797",
  },
  tabTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  galleryContent: {
    paddingBottom: Platform.OS === "ios" ? 105 : 90,
    paddingHorizontal: 16,
  },
  emptyContentContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
  galleryRow: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  galleryItem: {
    width: ITEM_WIDTH,
    height: 350,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
  },
  galleryImage: {
    width: "100%",
    height: "100%",
  },
  itemOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "rgba(220, 53, 69, 0.8)",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 15,
  },
  videoBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(210, 41, 255, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  videoBadgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#979797",
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 15,
    color: "#979797",
    textAlign: "center",
  },
});
