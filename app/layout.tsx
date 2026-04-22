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
      <body className={`bg-background font-sans antialiased flex flex-col items-center justify-center overflow-x-hidden ${fontSans.variable}`}>
        <RootLayoutClient>
          {children}
        </RootLayoutClient>
      </body>
    </html>
  )
}
