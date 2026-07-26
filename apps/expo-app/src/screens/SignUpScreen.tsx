import { useState } from "react"
import { StyleSheet, Text, TextInput, View } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { PrimaryButton } from "../components/PrimaryButton"
import { useSession } from "../session"
import { colors, space } from "../theme"

export function SignUpScreen({ onBack }: { onBack: () => void }) {
  const { strings, signUpMock } = useSession()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.wrap}>
        <Text style={styles.title}>{strings.signUp}</Text>
        <TextInput placeholder="Nome" placeholderTextColor={colors.muted} value={name} onChangeText={setName} style={styles.input} />
        <TextInput
          placeholder={strings.email}
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
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
        <PrimaryButton title={strings.continueLabel} onPress={() => signUpMock(name)} />
        <PrimaryButton title="Voltar" variant="ghost" onPress={onBack} />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  wrap: { flex: 1, paddingHorizontal: space.screen, paddingTop: 16, gap: 12 },
  title: { color: colors.foreground, fontSize: 28, fontWeight: "700", marginBottom: 8 },
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
