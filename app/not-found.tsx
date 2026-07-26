import type { Metadata } from "next"
import { NotFoundScreen } from "@/components/not-found-screen"

export const metadata: Metadata = {
  title: "404 · Clakete",
}

export default function NotFound() {
  return <NotFoundScreen />
}
