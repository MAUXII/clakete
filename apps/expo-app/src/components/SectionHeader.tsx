import { StyleSheet, Text, View } from "react-native"
import { colors } from "../theme"

type Props = {
  eyebrow?: string
  title: string
  action?: string
}

export function SectionHeader({ eyebrow, title, action }: Props) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow.toUpperCase()}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>
      {action ? <Text style={styles.action}>{action}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", marginBottom: 14 },
  eyebrow: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 1.4,
    marginBottom: 4,
  },
  title: { color: colors.foreground, fontSize: 22, fontWeight: "600" },
  action: { color: colors.muted, fontSize: 13, fontWeight: "500" },
})
