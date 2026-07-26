import type { Metadata } from "next"
import { NotFoundScreen } from "@/components/not-found-screen"

export const metadata: Metadata = {
  title: "Perfil não encontrado · Clakete",
}

export default function ProfileNotFound() {
  return (
    <NotFoundScreen message="Desculpa, não encontramos o perfil que você pediu." />
  )
}
