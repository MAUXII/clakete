import type { Metadata } from "next"
import { CinemasNearby } from "@/components/cinemas/cinemas-nearby"

export const metadata: Metadata = {
  title: "Cinemas · Clakete",
  description:
    "Filmes em cartaz perto de você. Escolha o filme e veja as sessões.",
}

export default function CinemasPage() {
  return <CinemasNearby />
}
