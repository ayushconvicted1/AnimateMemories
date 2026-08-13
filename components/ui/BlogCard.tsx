import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { getFontFamily } from "@/constants/Fonts";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export const formatBlogDate = (dateString?: string | null) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "";
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
};

// Cards render covers at ~280px wide, but the API serves 1600px-wide Unsplash
// URLs. Decoding those full-size images (6MB+ each) at mount, alongside the
// hero video and template images, pushes the Dalvik heap past its 256MB limit
// and crashes the app. Downscale to what the card actually needs (2x retina).
export const cardCoverUrl = (url?: string | null) => {
  if (!url) return undefined;
  if (url.includes("images.unsplash.com")) {
    return url.replace(/w=\d+/, "w=640").replace(/q=\d+/, "q=70");
  }
  return url;
};

interface BlogCardProps {
  blog: any;
  width?: number;
  compact?: boolean;
}

export default function BlogCard({ blog, width, compact }: BlogCardProps) {
  const tags = Array.isArray(blog.tags) ? blog.tags : [];

  return (
    <TouchableOpacity
      style={[styles.card, width ? { width } : undefined]}
      activeOpacity={0.85}
      onPress={() => router.push(`/blogs/${blog.slug}`)}
    >
      <View
        style={[
          styles.imageContainer,
          compact ? styles.imageContainerCompact : undefined,
        ]}
      >
        {blog.coverImage ? (
          <Image
            source={{ uri: cardCoverUrl(blog.coverImage) }}
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

      <View style={styles.content}>
        <View style={styles.metaRow}>
          <Text style={styles.date}>{formatBlogDate(blog.createdAt)}</Text>
          {blog.author ? (
            <Text style={styles.author} numberOfLines={1}>
              By {blog.author}
            </Text>
          ) : null}
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {blog.title}
        </Text>
        {blog.excerpt ? (
          <Text style={styles.excerpt} numberOfLines={compact ? 2 : 3}>
            {blog.excerpt}
          </Text>
        ) : null}

        {/* Tags */}
        {tags.length > 0 && (
          <View style={styles.tagsRow}>
            {tags.slice(0, 3).map((tag: string) => {
              const sentenceTag = tag
                ? tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()
                : tag;
              return (
                <View key={tag} style={styles.tagPill}>
                  <Text style={styles.tagText}>{sentenceTag}</Text>
                </View>
              );
            })}
            {tags.length > 3 && (
              <Text style={styles.tagMore}>+{tags.length - 3}</Text>
            )}
          </View>
        )}

        <View style={styles.readRow}>
          <Text style={styles.readText}>Keep Reading</Text>
          <Text style={styles.readArrow}>→</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  imageContainer: {
    width: "100%",
    aspectRatio: 16 / 10,
    backgroundColor: "#F1F5F9",
    position: "relative",
  },
  imageContainerCompact: {
    aspectRatio: 16 / 7,
    maxHeight: 160,
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
    top: 10,
    left: 10,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: getFontFamily("600"),
    color: "#7C3AED",
  },
  content: {
    padding: 14,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 6,
  },
  date: {
    fontSize: 11,
    fontFamily: getFontFamily("500"),
    color: "#94A3B8",
    flexShrink: 1,
  },
  author: {
    fontSize: 11,
    fontFamily: getFontFamily("600"),
    color: "#7C3AED",
    flexShrink: 1,
  },
  title: {
    fontSize: 16,
    fontFamily: getFontFamily("700"),
    color: "#04001F",
    lineHeight: 22,
    marginBottom: 6,
  },
  excerpt: {
    fontSize: 12.5,
    fontFamily: getFontFamily("400"),
    color: "#64748B",
    lineHeight: 18,
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  tagPill: {
    backgroundColor: "#F1F5F9",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  tagText: {
    fontSize: 10,
    fontFamily: getFontFamily("500"),
    color: "#64748B",
  },
  tagMore: {
    fontSize: 10,
    fontFamily: getFontFamily("500"),
    color: "#94A3B8",
    alignSelf: "center",
  },
  readRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  readText: {
    fontSize: 13,
    fontFamily: getFontFamily("600"),
    color: "#A855F7",
  },
  readArrow: {
    fontSize: 14,
    fontFamily: getFontFamily("600"),
    color: "#A855F7",
    marginLeft: 4,
  },
});
