import { useState } from "react"
import { Image } from "expo-image"
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { useNavigation } from "@react-navigation/native"
import { PrimaryButton } from "../components/PrimaryButton"
import { MOCK_MOVIES } from "../data/mock"
import type { Lang } from "../i18n"
import { useSession } from "../session"
import { colors, space } from "../theme"

export function ProfileScreen() {
  const navigation = useNavigation<any>()
  const session = useSession()
  const { strings } = session
  const [segment, setSegment] = useState(0)
  const [paywall, setPaywall] = useState(false)

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{session.displayName.slice(0, 2).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <Text style={styles.name}>{session.displayName}</Text>
              {session.isShining ? <Text style={styles.shineBadge}>✦ The Shining</Text> : null}
            </View>
            <Text style={styles.handle}>@{session.username}</Text>
            {session.isGuest ? <Text style={styles.guest}>{strings.guestMode}</Text> : null}
          </View>
        </View>

        <View style={styles.stats}>
          {[
            ["128", strings.watched],
            ["34", strings.watchlist],
            ["12", strings.lists],
          ].map(([v, l]) => (
            <View key={l} style={styles.stat}>
              <Text style={styles.statV}>{v}</Text>
              <Text style={styles.statL}>{l}</Text>
            </View>
          ))}
        </View>

        {!session.isShining ? (
          <Pressable onPress={() => setPaywall(true)} style={styles.paywallCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.payTitle}>{strings.shining}</Text>
              <Text style={styles.paySub}>Temas, listas privadas ∞, badge</Text>
            </View>
            <Text style={{ color: colors.muted }}>›</Text>
          </Pressable>
        ) : null}

        <View style={styles.seg}>
          {[strings.watched, strings.watchlist].map((label, i) => (
            <Pressable key={label} onPress={() => setSegment(i)} style={[styles.segItem, segment === i && styles.segActive]}>
              <Text style={[styles.segText, segment === i && styles.segTextActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.grid}>
          {MOCK_MOVIES.slice(0, 6).map((item) => (
            <Pressable key={item.id} onPress={() => navigation.navigate("FilmDetail", { id: item.id })} style={styles.gridItem}>
              <Image source={{ uri: item.posterURL }} style={styles.poster} contentFit="cover" />
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>{strings.language}</Text>
        <View style={styles.chips}>
          {(["pt-BR", "en-US", "es-ES"] as Lang[]).map((l) => (
            <Pressable
              key={l}
              onPress={() => session.setLanguage(l)}
              style={[styles.chip, session.language === l && styles.chipActive]}
            >
              <Text style={[styles.chipText, session.language === l && styles.chipTextActive]}>{l}</Text>
            </Pressable>
          ))}
        </View>

        <PrimaryButton
          title={session.isAuthenticated ? strings.signOut : strings.signIn}
          variant="outline"
          onPress={() => {
            if (session.isAuthenticated) void session.signOut()
            else void session.clearGuestToLogin()
          }}
          style={{ marginTop: 20 }}
        />
      </ScrollView>

      <Modal visible={paywall} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.payTitle}>{strings.shining}</Text>
            <Text style={styles.paySub}>Desbloqueie a experiência completa do Clakete.</Text>
            {["Listas privadas ∞", "Temas de perfil", "Badge nos posts", "Early access"].map((p) => (
              <Text key={p} style={{ color: colors.foreground, marginTop: 10 }}>
                ✓ {p}
              </Text>
            ))}
            <PrimaryButton
              title="Ativar Shining (mock)"
              onPress={async () => {
                await session.setShining(true)
                setPaywall(false)
              }}
              style={{ marginTop: 24 }}
            />
            <PrimaryButton title="Agora não" variant="ghost" onPress={() => setPaywall(false)} style={{ marginTop: 8 }} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: space.screen, paddingBottom: 40, paddingTop: 8 },
  header: { flexDirection: "row", gap: 14, marginBottom: 24 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 22 },
  name: { color: colors.foreground, fontSize: 22, fontWeight: "600" },
  shineBadge: {
    color: colors.accent,
    fontSize: 10,
    fontWeight: "700",
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: "hidden",
  },
  handle: { color: colors.muted, marginTop: 4 },
  guest: { color: colors.accent, marginTop: 4, fontSize: 12, fontWeight: "600" },
  stats: { flexDirection: "row", marginBottom: 20 },
  stat: { flex: 1, alignItems: "center" },
  statV: { color: colors.foreground, fontSize: 18, fontWeight: "600" },
  statL: { color: colors.muted, fontSize: 12, marginTop: 4 },
  paywallCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: "rgba(255,0,72,0.35)",
    marginBottom: 20,
  },
  payTitle: { color: colors.foreground, fontSize: 16, fontWeight: "600" },
  paySub: { color: colors.muted, fontSize: 12, marginTop: 4 },
  seg: {
    flexDirection: "row",
    backgroundColor: colors.elevated,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  segItem: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  segActive: { backgroundColor: colors.accentSoft },
  segText: { color: colors.muted, fontWeight: "600" },
  segTextActive: { color: colors.accent },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  gridItem: { width: "31%" },
  poster: { width: "100%", aspectRatio: 2 / 3, borderRadius: 8, backgroundColor: colors.elevated },
  label: { color: colors.muted, marginTop: 24, marginBottom: 8, fontSize: 13 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  chipText: { color: colors.muted, fontWeight: "600" },
  chipTextActive: { color: colors.accent },
  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: colors.elevated,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
})
