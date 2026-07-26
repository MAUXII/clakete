import type { Metadata } from "next"
import { GamesHub } from "@/components/games/games-hub"

export const metadata: Metadata = {
  title: "Games · Clakete",
  description:
    "Desafios rápidos de cinema: Connect the Stars, Frame Guesser e mais.",
}

export default function GamesPage() {
  return <GamesHub />
}
