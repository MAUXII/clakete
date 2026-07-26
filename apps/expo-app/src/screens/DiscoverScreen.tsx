import { useState } from "react"
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { PosterCard } from "../components/PosterCard"
import { MOCK_MOVIES, MOCK_SERIES } from "../data/mock"
import { useSession } from "../session"
import { colors, space } from "../theme"

export function DiscoverScreen() {
  const navigation = useNavigation<any>()
  const { strings } = useSession()
  const [segment, setSegment] = useState(0)
  const items = segment === 0 ? MOCK_MOVIES : MOCK_SERIES
  const width = (Dimensions.get("window").width - space.screen * 2 - 24) / 3

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{strings.navDiscover}</Text>
        <View style={styles.seg}>
          {[strings.films, strings.series].map((label, i) => (
            <Pressable key={label} onPress={() => setSegment(i)} style={[styles.segItem, segment === i && styles.segActive]}>
              <Text style={[styles.segText, segment === i && styles.segTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.grid}>
          {items.map((item) => (
            <PosterCard
              key={item.id}
              item={item}
              width={width}
              onPress={() => navigation.navigate("FilmDetail", { id: item.id })}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: space.screen, paddingBottom: 40, paddingTop: 8 },
  title: { color: colors.foreground, fontSize: 28, fontWeight: "700", marginBottom: 16 },
  seg: {
    flexDirection: "row",
    backgroundColor: colors.elevated,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  segItem: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  segActive: { backgroundColor: colors.accentSoft },
  segText: { color: colors.muted, fontWeight: "600" },
  segTextActive: { color: colors.accent },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
})
