import { Image } from "expo-image"
import { Pressable, StyleSheet, Text, View } from "react-native"
import type { FeedPost } from "../data/mock"
import type { Strings } from "../i18n"
import { colors } from "../theme"

type Props = {
  post: FeedPost
  strings: Strings
  onPressMedia: () => void
}

export function FeedPostCard({ post, strings, onPressMedia }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{post.avatarInitials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text style={styles.username}>{post.username}</Text>
            {post.isShining ? <Text style={styles.shine}>✦</Text> : null}
          </View>
          <Text style={styles.time}>{post.timeAgo}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {post.visibility === "friends" ? strings.friends : strings.feedPublic}
          </Text>
        </View>
      </View>

      <Pressable onPress={onPressMedia}>
        <Image
          source={{ uri: post.media.backdropURL || post.media.posterURL }}
          style={styles.media}
          contentFit="cover"
        />
        <Text style={styles.mediaTitle}>{post.media.title}</Text>
      </Pressable>

      <Text style={styles.caption}>{post.caption}</Text>
      <Text style={styles.meta}>
        ♥ {post.likes}   💬 {post.comments}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.elevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  username: { color: colors.foreground, fontWeight: "600", fontSize: 14 },
  shine: { color: colors.accent, fontWeight: "700" },
  time: { color: colors.muted, fontSize: 11, marginTop: 2 },
  badge: {
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  media: {
    height: 180,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mediaTitle: {
    position: "absolute",
    left: 14,
    bottom: 12,
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  caption: { color: colors.foreground, fontSize: 14 },
  meta: { color: colors.muted, fontSize: 13 },
})
