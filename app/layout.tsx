import { Geist } from "next/font/google"
import "./globals.css"
import type { Metadata } from "next"
import { RootLayoutClient } from "./client-layout"


const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Clakete",
  description: "Your movie diary",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <title>Clakete</title>
      </head>
      <body
        className={`min-h-dvh w-full overflow-x-clip bg-background font-sans antialiased ${fontSans.variable}`}
      >
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
      </body>
    </html>
  )
}
