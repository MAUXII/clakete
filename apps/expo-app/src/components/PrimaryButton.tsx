import { Pressable, StyleSheet, Text, ViewStyle } from "react-native"
import { colors } from "../theme"

type Props = {
  title: string
  onPress: () => void
  variant?: "filled" | "outline" | "ghost"
  disabled?: boolean
  style?: ViewStyle
}

export function PrimaryButton({ title, onPress, variant = "filled", disabled, style }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variant === "filled" && styles.filled,
        variant === "outline" && styles.outline,
        variant === "ghost" && styles.ghost,
        pressed && { opacity: 0.85 },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === "filled" ? { color: "#fff" } : { color: colors.foreground },
        ]}
      >
        {title}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  filled: { backgroundColor: colors.accent },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: { backgroundColor: "rgba(255,255,255,0.04)" },
  label: { fontSize: 16, fontWeight: "600" },
})
