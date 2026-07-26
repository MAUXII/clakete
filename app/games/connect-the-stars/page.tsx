import type { Metadata } from "next"
import { ConnectTheStarsGame } from "@/components/games/connect-the-stars-game"

export const metadata: Metadata = {
  title: "Connect the Stars · Clakete",
  description:
    "Conecte dois atores pelo elenco em comum no menor número de passos.",
}

export default function ConnectTheStarsPage() {
  return <ConnectTheStarsGame />
}
