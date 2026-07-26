import { useState } from "react"
import { Image } from "expo-image"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { MOCK_LISTS } from "../data/mock"
import { useSession } from "../session"
import { colors, space } from "../theme"

export function ListsScreen() {
  const { strings } = useSession()
  const [segment, setSegment] = useState(0)
  const lists = segment === 0 ? MOCK_LISTS : MOCK_LISTS.filter((l) => !l.isPrivate)

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>{strings.navLists}</Text>
          <View style={styles.plus}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>+</Text>
          </View>
        </View>

        <View style={styles.seg}>
          {[strings.yourLists, strings.publicLists].map((label, i) => (
            <Pressable key={label} onPress={() => setSegment(i)} style={[styles.segItem, segment === i && styles.segActive]}>
              <Text style={[styles.segText, segment === i && styles.segTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        {lists.map((list) => (
          <View key={list.id} style={styles.row}>
            <Image source={{ uri: list.coverURL }} style={styles.cover} contentFit="cover" />
            <View style={{ flex: 1 }}>
              <Text style={styles.listTitle}>
                {list.title}
                {list.isPrivate ? "  🔒" : ""}
              </Text>
              <Text style={styles.sub}>{list.subtitle}</Text>
              <Text style={styles.sub}>{list.itemCount} títulos</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: space.screen, paddingBottom: 40, paddingTop: 8, gap: 12 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  title: { flex: 1, color: colors.foreground, fontSize: 28, fontWeight: "700" },
  plus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  seg: {
    flexDirection: "row",
    backgroundColor: colors.elevated,
    borderRadius: 12,
    padding: 4,
    marginBottom: 8,
  },
  segItem: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  segActive: { backgroundColor: colors.accentSoft },
  segText: { color: colors.muted, fontWeight: "600" },
  segTextActive: { color: colors.accent },
  row: {
    flexDirection: "row",
    gap: 14,
    padding: 12,
    backgroundColor: colors.elevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cover: { width: 72, height: 72, borderRadius: 8, backgroundColor: colors.background },
  listTitle: { color: colors.foreground, fontSize: 16, fontWeight: "600" },
  sub: { color: colors.muted, fontSize: 13, marginTop: 2 },
})
