import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState, useMemo } from "react";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { GradientText } from "@/components/ui/GradientText";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import BlogCard from "@/components/ui/BlogCard";
import { api } from "@/services/api";
import { getFontFamily } from "@/constants/Fonts";

export default function BlogsScreen() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(false);
    try {
      const [blogsResponse, catsResponse] = await Promise.all([
        api.getBlogs(),
        api.getBlogCategories(),
      ]);
      const fetchedBlogs = blogsResponse?.blogs || [];
      const fetchedCats = catsResponse?.categories || [];
      setBlogs(fetchedBlogs);
      setCategories(fetchedCats);
      if (fetchedCats.length > 0) {
        setSelectedCategory(fetchedCats[0].name);
      } else if (fetchedBlogs.length > 0 && fetchedBlogs[0].category) {
        setSelectedCategory(fetchedBlogs[0].category);
      }
    } catch (e) {
      console.error("Failed to load blogs", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredBlogs = useMemo(() => {
    if (selectedCategory === "All") return blogs;
    return blogs.filter((b: any) => b.category === selectedCategory);
  }, [blogs, selectedCategory]);

  // Get unique categories from blogs that actually exist
  const availableCategories = useMemo(() => {
    const blogCats = [...new Set(blogs.map((b: any) => b.category).filter(Boolean))];
    // Merge with admin categories for proper ordering
    const ordered: string[] = [];
    categories.forEach((cat: any) => {
      if (blogCats.includes(cat.name)) {
        ordered.push(cat.name);
      }
    });
    // Add any blog categories not in the admin list
    blogCats.forEach((cat) => {
      if (!ordered.includes(cat)) {
        ordered.push(cat);
      }
    });
    return ordered;
  }, [blogs, categories]);

  return (
    <ScreenWrapper addBottomPadding={true}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <GradientText style={styles.title}>Blogs</GradientText>
          <View style={styles.placeholder} />
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Tips, stories & updates on AI photo animation.
        </Text>

        {/* Category Filter Pills (No All section) */}
        {availableCategories.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryContainer}
          >
            {availableCategories.map((cat) => {
              const isSelected = selectedCategory === cat || (!selectedCategory && cat === availableCategories[0]);
              return (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}
                  style={styles.categoryPillTouchable}
                >
                  {isSelected ? (
                    <LinearGradient
                      colors={["#38BDF8", "#D229FF"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.activePillGradient}
                    >
                      <Text style={styles.activePillText}>{cat}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={styles.inactivePill}>
                      <Text style={styles.inactivePillText}>{cat}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#A855F7" />
            <Text style={styles.stateText}>Loading articles…</Text>
          </View>
        ) : error ? (
          <View style={styles.centerState}>
            <Text style={styles.stateTitle}>{"Couldn't load articles"}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadData}
              activeOpacity={0.85}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredBlogs.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={styles.stateTitle}>
              {selectedCategory === "All"
                ? "No articles yet"
                : `No articles in "${selectedCategory}"`}
            </Text>
            <Text style={styles.stateText}>
              {selectedCategory === "All"
                ? "Check back soon for new articles."
                : "Try selecting a different category."}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          >
            {filteredBlogs.map((blog: any) => (
              <BlogCard key={blog.id} blog={blog} compact />
            ))}
          </ScrollView>
        )}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backButton: {
    width: 72,
  },
  backButtonText: {
    fontSize: 17,
    fontFamily: getFontFamily("600"),
    color: "#A855F7",
  },
  title: {
    fontSize: 22,
    fontFamily: getFontFamily("700"),
  },
  placeholder: {
    width: 72,
  },
  description: {
    fontSize: 15,
    fontFamily: getFontFamily("400"),
    color: "#64748B",
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 32,
    marginBottom: 12,
    marginTop: 4,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 12,
  },
  categoryPillTouchable: {
    borderRadius: 999,
  },
  activePillGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  activePillText: {
    fontSize: 15,
    fontFamily: getFontFamily("600"),
    color: "#FFFFFF",
  },
  inactivePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inactivePillText: {
    fontSize: 15,
    fontFamily: getFontFamily("500"),
    color: "#64748B",
  },
  scrollView: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 14,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  stateTitle: {
    fontSize: 18,
    fontFamily: getFontFamily("600"),
    color: "#04001F",
    marginBottom: 8,
  },
  stateText: {
    fontSize: 15,
    fontFamily: getFontFamily("400"),
    color: "#64748B",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 21,
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#F3E8FF",
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: {
    fontSize: 16,
    fontFamily: getFontFamily("600"),
    color: "#7C3AED",
  },
});
