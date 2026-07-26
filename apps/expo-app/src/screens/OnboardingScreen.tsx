import { useState } from "react"
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import type { Lang } from "../i18n"
import { PrimaryButton } from "../components/PrimaryButton"
import { useSession } from "../session"
import { colors, space } from "../theme"

const REGIONS = ["BR", "US", "PT", "MX", "ES"]
const LANGS: Lang[] = ["pt-BR", "en-US", "es-ES"]

export function OnboardingScreen() {
  const { strings, completeOnboarding, setLanguage } = useSession()
  const [step, setStep] = useState(0)
  const [name, setName] = useState("")
  const [region, setRegion] = useState("BR")
  const [language, setLang] = useState<Lang>("pt-BR")

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.bars}>
        {[0, 1].map((i) => (
          <View key={i} style={[styles.bar, i <= step && styles.barActive]} />
        ))}
      </View>

      <View style={styles.body}>
        {step === 0 ? (
          <View style={{ alignItems: "center", gap: 16 }}>
            <Text style={styles.brand}>Clakete</Text>
            <Text style={styles.hint}>Seu diário de cinema — feed, listas e onde assistir.</Text>
          </View>
        ) : (
          <View style={{ gap: 16 }}>
            <Text style={styles.title}>{strings.onboardingTitle}</Text>
            <Text style={styles.hint}>{strings.onboardingHint}</Text>
            <TextInput
              placeholder="Nome"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
            <Text style={styles.label}>{strings.watchRegion}</Text>
            <View style={styles.chips}>
              {REGIONS.map((r) => (
                <Pressable
                  key={r}
                  onPress={() => setRegion(r)}
                  style={[styles.chip, region === r && styles.chipActive]}
                >
                  <Text style={[styles.chipText, region === r && styles.chipTextActive]}>{r}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.label}>{strings.language}</Text>
            <View style={styles.chips}>
              {LANGS.map((l) => (
                <Pressable
                  key={l}
                  onPress={async () => {
                    setLang(l)
                    await setLanguage(l)
                  }}
                  style={[styles.chip, language === l && styles.chipActive]}
                >
                  <Text style={[styles.chipText, language === l && styles.chipTextActive]}>{l}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          title={strings.continueLabel}
          onPress={() => {
            if (step === 0) setStep(1)
            else void completeOnboarding({ name, region, language })
          }}
        />
        {step === 0 ? (
          <PrimaryButton
            title={strings.skip}
            variant="ghost"
            onPress={() => completeOnboarding({ name: "cinefilo", region: "BR", language: "pt-BR" })}
          />
        ) : null}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  bars: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: space.screen,
    paddingTop: 8,
  },
  bar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.12)" },
  barActive: { backgroundColor: colors.accent },
  body: { flex: 1, justifyContent: "center", paddingHorizontal: space.screen },
  brand: { color: colors.foreground, fontSize: 44, fontWeight: "700" },
  title: { color: colors.foreground, fontSize: 28, fontWeight: "600" },
  hint: { color: colors.muted, fontSize: 15, textAlign: "center" },
  input: {
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 14,
    color: colors.foreground,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { color: colors.muted, fontSize: 13 },
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
  footer: { padding: space.screen, gap: 10 },
})
