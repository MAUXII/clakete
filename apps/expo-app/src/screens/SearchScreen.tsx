import { useEffect, useState } from "react"
import { Image } from "expo-image"
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { searchAll, type MediaItem, type PersonHit } from "../data/mock"
import { useSession } from "../session"
import { colors, space } from "../theme"

export function SearchScreen() {
  const navigation = useNavigation<any>()
  const { strings } = useSession()
  const [query, setQuery] = useState("")
  const [movies, setMovies] = useState<MediaItem[]>([])
  const [series, setSeries] = useState<MediaItem[]>([])
  const [people, setPeople] = useState<PersonHit[]>([])

  useEffect(() => {
    const timer = setTimeout(() => {
      const r = searchAll(query)
      setMovies(r.movies)
      setSeries(r.series)
      setPeople(r.people)
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  const empty = !query.trim()
  const noHits = !empty && !movies.length && !series.length && !people.length

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.searchBox}>
        <Text style={{ color: colors.muted }}>⌕</Text>
        <TextInput
          style={styles.input}
          placeholder={strings.searchPlaceholder}
          placeholderTextColor={colors.muted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {empty ? (
          <Text style={styles.hint}>{strings.searchPlaceholder}</Text>
        ) : noHits ? (
          <Text style={styles.hint}>{strings.noResults}</Text>
        ) : (
          <>
            <ResultGroup title={strings.films} items={movies} onPress={(id) => navigation.navigate("FilmDetail", { id })} />
            <ResultGroup title={strings.series} items={series} onPress={(id) => navigation.navigate("FilmDetail", { id })} />
            {people.length > 0 ? (
              <View style={{ gap: 10 }}>
                <Text style={styles.group}>{strings.people}</Text>
                {people.map((p) => (
                  <View key={p.id} style={styles.person}>
                    <View style={styles.pAvatar}>
                      <Text style={{ color: colors.accent, fontWeight: "700" }}>{p.name[0]}</Text>
                    </View>
                    <View>
                      <Text style={styles.itemTitle}>{p.name}</Text>
                      <Text style={styles.itemSub}>{p.knownFor}</Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

function ResultGroup({
  title,
  items,
  onPress,
}: {
  title: string
  items: MediaItem[]
  onPress: (id: number) => void
}) {
  if (!items.length) return null
  return (
    <View style={{ gap: 10, marginBottom: 20 }}>
      <Text style={styles.group}>{title}</Text>
      {items.map((item) => (
        <Pressable key={item.id} onPress={() => onPress(item.id)} style={styles.row}>
          <Image source={{ uri: item.posterURL }} style={styles.thumb} contentFit="cover" />
          <View>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemSub}>{item.year}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  searchBox: {
    marginHorizontal: space.screen,
    marginTop: 8,
    marginBottom: 16,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
  },
  input: { flex: 1, color: colors.foreground, fontSize: 15 },
  content: { paddingHorizontal: space.screen, paddingBottom: 40 },
  hint: { color: colors.muted, textAlign: "center", marginTop: 40 },
  group: { color: colors.muted, fontSize: 13, fontWeight: "600", marginBottom: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  thumb: { width: 44, height: 66, borderRadius: 6, backgroundColor: colors.elevated },
  itemTitle: { color: colors.foreground, fontSize: 15, fontWeight: "500" },
  itemSub: { color: colors.muted, fontSize: 12, marginTop: 2 },
  person: { flexDirection: "row", alignItems: "center", gap: 12 },
  pAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
})
