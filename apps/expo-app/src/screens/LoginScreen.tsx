import { useState } from "react"
import { StyleSheet, Text, TextInput, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { PrimaryButton } from "../components/PrimaryButton"
import { useSession } from "../session"
import { colors, space } from "../theme"

export function LoginScreen({ onSignUp }: { onSignUp: () => void }) {
  const { strings, signInMock, continueAsGuest } = useSession()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>
        <View style={{ flex: 1, justifyContent: "center", gap: 28 }}>
          <View style={{ alignItems: "center", gap: 8 }}>
            <Text style={styles.brand}>Clakete</Text>
            <Text style={styles.tag}>{strings.diaryTagline}</Text>
          </View>

          <View style={{ gap: 12 }}>
            <TextInput
              placeholder={strings.email}
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
            <TextInput
              placeholder={strings.password}
              placeholderTextColor={colors.muted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />
          </View>

          <PrimaryButton
            title={strings.signIn}
            disabled={loading}
            onPress={async () => {
              setLoading(true)
              await signInMock(email || "demo@clakete.app")
              setLoading(false)
            }}
          />
          <PrimaryButton title={strings.signUp} variant="outline" onPress={onSignUp} />
          <PrimaryButton title={strings.continueAsGuest} variant="ghost" onPress={() => continueAsGuest()} />
        </View>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  wrap: { flex: 1, paddingHorizontal: space.screen },
  brand: { color: colors.foreground, fontSize: 40, fontWeight: "700" },
  tag: { color: colors.muted, fontSize: 15 },
  input: {
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 14,
    color: colors.foreground,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
})
