import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { FeedPostCard } from "../components/FeedPostCard"
import { PosterCard } from "../components/PosterCard"
import { SectionHeader } from "../components/SectionHeader"
import { MOCK_FEED, MOCK_MOVIES } from "../data/mock"
import { useSession } from "../session"
import { colors, space } from "../theme"

export function HomeScreen() {
  const navigation = useNavigation<any>()
  const { strings } = useSession()
  const nowShowing = MOCK_MOVIES.slice(0, 4)
  const upcoming = MOCK_MOVIES.slice(3)

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.brand}>Clakete</Text>
          <Pressable
            onPress={() => navigation.getParent()?.navigate("Search")}
            style={styles.searchBtn}
          >
            <Text style={{ color: colors.foreground }}>⌕</Text>
          </Pressable>
        </View>

        <SectionHeader eyebrow={strings.following} title={strings.activity} />
        <View style={{ gap: 16, marginBottom: space.section }}>
          {MOCK_FEED.map((post) => (
            <FeedPostCard
              key={post.id}
              post={post}
              strings={strings}
              onPressMedia={() => navigation.navigate("FilmDetail", { id: post.media.id })}
            />
          ))}
        </View>

        <SectionHeader eyebrow={strings.inTheaters} title={strings.nowShowing} action={strings.catalogLink} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, marginBottom: space.section }}>
          {nowShowing.map((item) => (
            <PosterCard
              key={item.id}
              item={item}
              width={96}
              onPress={() => navigation.navigate("FilmDetail", { id: item.id })}
            />
          ))}
        </ScrollView>

        <SectionHeader eyebrow={strings.comingSoon} title={strings.upcoming} action={strings.seeAll} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
          {upcoming.map((item) => (
            <PosterCard
              key={item.id}
              item={item}
              width={96}
              onPress={() => navigation.navigate("FilmDetail", { id: item.id })}
            />
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: space.screen, paddingBottom: 40, paddingTop: 8 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  brand: { flex: 1, color: colors.foreground, fontSize: 28, fontWeight: "700" },
  searchBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
})
