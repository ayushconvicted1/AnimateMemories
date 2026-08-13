import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, router } from "expo-router";
import { Image } from "expo-image";
import { WebView } from "react-native-webview";
import { GradientText } from "@/components/ui/GradientText";
import ScreenWrapper from "@/components/ui/ScreenWrapper";
import BlogCard from "@/components/ui/BlogCard";
import { api } from "@/services/api";
import { formatBlogDate } from "@/components/ui/BlogCard";
import { getFontFamily } from "@/constants/Fonts";

const buildArticleHtml = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
  <style>
    body {
      margin: 0;
      padding: 4px 2px 40px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #334155;
      font-size: 16px;
      line-height: 1.75;
      word-wrap: break-word;
    }
    h1, h2, h3, h4 {
      color: #04001f;
      font-weight: 800;
      line-height: 1.3;
      margin: 28px 0 12px;
    }
    h1 { font-size: 24px; }
    h2 { font-size: 21px; }
    h3 { font-size: 18px; }
    p { margin: 0 0 16px; }
    a { color: #a855f7; }
    strong { color: #04001f; }
    img {
      max-width: 100%;
      height: auto;
      border-radius: 14px;
      margin: 10px 0 18px;
    }
    blockquote {
      margin: 22px 0;
      padding: 14px 18px;
      border-left: 4px solid #a855f7;
      background: #faf5ff;
      border-radius: 0 12px 12px 0;
      color: #6b21a8;
      font-style: italic;
    }
    ul, ol { padding-left: 22px; margin: 0 0 16px; }
    li { margin-bottom: 8px; }
    hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
    iframe { max-width: 100%; border-radius: 12px; }
  </style>
</head>
<body>
  ${content}
</body>
</html>
`;

const MEASURE_SCRIPT = `
(function () {
  function send() {
    window.ReactNativeWebView.postMessage(String(document.body.scrollHeight));
  }
  window.addEventListener('load', send);
  document.querySelectorAll('img').forEach(function (img) {
    if (img.complete) send();
    img.addEventListener('load', send);
  });
  setTimeout(send, 100);
  setTimeout(send, 500);
})();
`;

export default function BlogArticleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const [blog, setBlog] = useState<any>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);

  const loadBlog = async () => {
    if (!slug) return;
    setLoading(true);
    setError(false);
    setContentHeight(0);
    setRelatedBlogs([]);
    try {
      const found = await api.getBlogBySlug(slug);
      setBlog(found);
      if (!found) {
        setError(true);
        return;
      }
      // Load "Keep reading" suggestions — same category first, then others
      try {
        const response = await api.getBlogs(50);
        const all = response?.blogs || [];
        const others = all.filter((b: any) => b.slug !== slug);
        const sameCategory = others.filter(
          (b: any) => b.category && found.category && b.category === found.category
        );
        const rest = others.filter((b: any) => !sameCategory.includes(b));
        setRelatedBlogs([...sameCategory, ...rest].slice(0, 3));
      } catch (e) {
        // Suggestions are optional — don't fail the article over them
        console.error("Failed to load related blogs", e);
      }
    } catch (e) {
      console.error("Failed to load blog article", e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBlog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  return (
    <ScreenWrapper addBottomPadding={true}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>← Blogs</Text>
          </TouchableOpacity>
          <GradientText style={styles.title}>Article</GradientText>
          <View style={styles.placeholder} />
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#A855F7" />
          </View>
        ) : error || !blog ? (
          <View style={styles.centerState}>
            <Text style={styles.stateTitle}>Article not found</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadBlog}
              activeOpacity={0.85}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.articleContent}
          >
            {/* Cover image */}
            <View style={styles.coverContainer}>
              {blog.coverImage ? (
                <Image
                  source={{ uri: blog.coverImage }}
                  style={styles.coverImage}
                  contentFit="cover"
                  transition={200}
                />
              ) : (
                <View style={styles.coverPlaceholder} />
              )}
              {blog.category ? (
                <View style={styles.categoryPill}>
                  <Text style={styles.categoryText}>{blog.category}</Text>
                </View>
              ) : null}
            </View>

            {/* Title + meta */}
            <Text style={styles.articleTitle}>{blog.title}</Text>
            <View style={styles.articleMetaRow}>
              <Text style={styles.articleDate}>
                {formatBlogDate(blog.createdAt)}
              </Text>
              {blog.author ? (
                <View style={styles.authorBadge}>
                  <View style={styles.authorAvatar}>
                    <Text style={styles.authorAvatarText}>AM</Text>
                  </View>
                  <Text style={styles.articleAuthor}>
                    Published by {blog.author}
                  </Text>
                </View>
              ) : null}
            </View>
            {blog.excerpt ? (
              <Text style={styles.articleExcerpt}>{blog.excerpt}</Text>
            ) : null}

            {/* Tags */}
            {Array.isArray(blog.tags) && blog.tags.length > 0 ? (
              <View style={styles.tagsRow}>
                {blog.tags.map((tag: string) => {
                  const sentenceTag = tag
                    ? tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()
                    : tag;
                  return (
                    <View key={tag} style={styles.tagPill}>
                      <Text style={styles.tagText}>#{sentenceTag}</Text>
                    </View>
                  );
                })}
              </View>
            ) : null}

            {/* Article body */}
            <WebView
              source={{ html: buildArticleHtml(blog.content || "") }}
              style={[styles.webView, { height: contentHeight || 400 }]}
              originWhitelist={["*"]}
              javaScriptEnabled
              domStorageEnabled
              scrollEnabled={false}
              onMessage={(event) => {
                const h = Number(event.nativeEvent.data);
                if (!isNaN(h) && h > 0) setContentHeight(h);
              }}
              injectedJavaScript={MEASURE_SCRIPT}
              setSupportMultipleWindows={false}
            />

            {/* Published by — below the article body */}
            {blog.author ? (
              <View style={styles.bylineFooter}>
                <View style={styles.bylineDivider} />
                <View style={styles.bylineRow}>
                  <View style={styles.bylineAvatar}>
                    <Text style={styles.bylineAvatarText}>AM</Text>
                  </View>
                  <View style={styles.bylineInfo}>
                    <Text style={styles.bylineLabel}>Published by</Text>
                    <Text style={styles.bylineName}>{blog.author}</Text>
                    <Text style={styles.bylineDate}>
                      {formatBlogDate(blog.createdAt)}
                    </Text>
                  </View>
                </View>
              </View>
            ) : null}

            {/* Keep reading — more articles */}
            {relatedBlogs.length > 0 && (
              <View style={styles.keepReadingSection}>
                <View style={styles.keepReadingDivider} />
                <Text style={styles.keepReadingTitle}>Keep reading</Text>
                <View style={styles.keepReadingList}>
                  {relatedBlogs.map((b: any) => (
                    <BlogCard key={b.id} blog={b} compact />
                  ))}
                </View>
              </View>
            )}
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
    paddingBottom: 12,
  },
  backButton: {
    width: 72,
  },
  backButtonText: {
    fontSize: 15,
    fontFamily: getFontFamily("600"),
    color: "#A855F7",
  },
  title: {
    fontSize: 20,
    fontFamily: getFontFamily("800"),
  },
  placeholder: {
    width: 72,
  },
  scrollView: {
    flex: 1,
  },
  articleContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  coverContainer: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#F1F5F9",
    position: "relative",
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  coverPlaceholder: {
    flex: 1,
    backgroundColor: "#EDE9FE",
  },
  categoryPill: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: getFontFamily("600"),
    color: "#7C3AED",
  },
  articleTitle: {
    fontSize: 24,
    fontFamily: getFontFamily("800"),
    color: "#04001F",
    lineHeight: 31,
    marginTop: 18,
    marginBottom: 8,
  },
  articleMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  articleDate: {
    fontSize: 13,
    fontFamily: getFontFamily("500"),
    color: "#94A3B8",
  },
  authorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F5F3FF",
    borderRadius: 999,
    paddingLeft: 4,
    paddingRight: 10,
    paddingVertical: 3,
  },
  authorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
  },
  authorAvatarText: {
    fontSize: 8,
    fontFamily: getFontFamily("700"),
    color: "#FFFFFF",
  },
  articleAuthor: {
    fontSize: 12,
    fontFamily: getFontFamily("600"),
    color: "#7C3AED",
  },
  articleExcerpt: {
    fontSize: 15,
    fontFamily: getFontFamily("400"),
    color: "#64748B",
    lineHeight: 22,
    marginBottom: 18,
  },
  webView: {
    width: "100%",
    backgroundColor: "transparent",
  },
  bylineFooter: {
    marginTop: 24,
  },
  bylineDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginBottom: 16,
  },
  bylineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bylineAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
  },
  bylineAvatarText: {
    fontSize: 15,
    fontFamily: getFontFamily("700"),
    color: "#FFFFFF",
  },
  bylineInfo: {
    flex: 1,
  },
  bylineLabel: {
    fontSize: 11,
    fontFamily: getFontFamily("500"),
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  bylineName: {
    fontSize: 16,
    fontFamily: getFontFamily("700"),
    color: "#04001F",
    marginTop: 1,
  },
  bylineDate: {
    fontSize: 12,
    fontFamily: getFontFamily("400"),
    color: "#64748B",
    marginTop: 2,
  },
  keepReadingSection: {
    marginTop: 28,
  },
  keepReadingDivider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginBottom: 18,
  },
  keepReadingTitle: {
    fontSize: 18,
    fontFamily: getFontFamily("800"),
    color: "#04001F",
    marginBottom: 12,
  },
  keepReadingList: {
    gap: 14,
  },
  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 60,
  },
  stateTitle: {
    fontSize: 16,
    fontFamily: getFontFamily("700"),
    color: "#04001F",
    marginBottom: 8,
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: "#F3E8FF",
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  retryText: {
    fontSize: 14,
    fontFamily: getFontFamily("600"),
    color: "#7C3AED",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },
  tagPill: {
    backgroundColor: "#F3E8FF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagText: {
    fontSize: 12,
    fontFamily: getFontFamily("500"),
    color: "#7C3AED",
  },
});
