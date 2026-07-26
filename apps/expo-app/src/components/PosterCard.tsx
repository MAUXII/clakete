import { Image } from "expo-image"
import { Pressable, StyleSheet, Text, View } from "react-native"
import type { MediaItem } from "../data/mock"
import { colors } from "../theme"

type Props = {
  item: MediaItem
  width?: number
  onPress?: () => void
}

export function PosterCard({ item, width = 120, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={{ width }}>
      <Image source={{ uri: item.posterURL }} style={[styles.poster, { width, height: width * 1.5 }]} contentFit="cover" />
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.year}>{item.year}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  poster: {
    borderRadius: 16,
    backgroundColor: colors.elevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    marginTop: 8,
    color: colors.foreground,
    fontSize: 13,
    fontWeight: "500",
  },
  year: { marginTop: 2, color: colors.muted, fontSize: 11 },
})
