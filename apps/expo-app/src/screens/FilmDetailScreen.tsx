import { useRoute } from "@react-navigation/native"
import { useState } from "react"
import { Image } from "expo-image"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { findMedia } from "../data/mock"
import { useSession } from "../session"
import { colors, space } from "../theme"

export function FilmDetailScreen() {
  const route = useRoute<any>()
  const { strings, watchRegion } = useSession()
  const item = findMedia(route.params?.id)
  const [logged, setLogged] = useState(false)
  const [liked, setLiked] = useState(false)
  const [watchlist, setWatchlist] = useState(false)

  if (!item) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ color: colors.muted, padding: 24 }}>Not found</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Image source={{ uri: item.backdropURL || item.posterURL }} style={styles.hero} contentFit="cover" />
        <View style={styles.body}>
          <View style={styles.posterRow}>
            <Image source={{ uri: item.posterURL }} style={styles.poster} contentFit="cover" />
            <Pressable style={styles.trailer}>
              <Text style={styles.trailerText}>▶ {strings.trailer}</Text>
            </Pressable>
          </View>

          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>
            {item.year}
            {item.director ? ` · ${item.director}` : ""}
          </Text>
          <Text style={styles.rating}>★ {item.rating.toFixed(1)}</Text>

          <View style={styles.actions}>
            <Chip label={strings.logWatch} active={logged} onPress={() => setLogged((v) => !v)} />
            <Chip label={liked ? "♥" : "♡"} active={liked} onPress={() => setLiked((v) => !v)} />
            <Chip label={watchlist ? "🔖" : "📑"} active={watchlist} onPress={() => setWatchlist((v) => !v)} />
          </View>

          <Text style={styles.section}>{strings.overview.toUpperCase()}</Text>
          <Text style={styles.overview}>{item.overview}</Text>

          <View style={styles.genres}>
            {item.genres.map((g) => (
              <View key={g} style={styles.genre}>
                <Text style={styles.genreText}>{g}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.section, { marginTop: 20 }]}>{strings.whereToWatch.toUpperCase()}</Text>
          <View style={styles.providers}>
            {["Netflix", "Prime", "Max"].map((p) => (
              <View key={p} style={styles.provider}>
                <Text style={{ color: colors.foreground }}>{p}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.region}>Região: {watchRegion} · mock UI</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && { backgroundColor: colors.accentSoft, borderColor: colors.accent }]}
    >
      <Text style={{ color: active ? colors.accent : colors.foreground, fontWeight: "600", fontSize: 13 }}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  hero: { height: 220, width: "100%", backgroundColor: colors.elevated },
  body: { paddingHorizontal: space.screen, paddingBottom: 40, marginTop: -40 },
  posterRow: { flexDirection: "row", alignItems: "flex-end", gap: 14 },
  poster: {
    width: 100,
    height: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.elevated,
  },
  trailer: {
    marginBottom: 12,
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
  },
  trailerText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  title: { color: colors.foreground, fontSize: 28, fontWeight: "600", marginTop: 16 },
  meta: { color: colors.muted, marginTop: 6 },
  rating: { color: colors.star, marginTop: 8, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 10, marginTop: 16 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  section: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginTop: 24,
    marginBottom: 8,
  },
  overview: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  genres: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  genre: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  genreText: { color: colors.accent, fontSize: 12, fontWeight: "500" },
  providers: { flexDirection: "row", gap: 10 },
  provider: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  region: { color: colors.muted, fontSize: 11, marginTop: 10 },
})
