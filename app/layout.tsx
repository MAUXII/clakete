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
  verification: {
    google: "bhTwZ6ddu8orCriSFj21WvyQkLvFJ6b7_zQ8ffhNIz0",
  },
}

/** Apply stored accent before paint to avoid a red flash. */
const brandAccentBootScript = `
(function(){
  try {
    var hex = localStorage.getItem("clakete.brand-accent");
    if (!hex || !/^#([0-9a-f]{6})$/i.test(hex)) return;
    function mix(h, toward, amount) {
      var r = parseInt(h.slice(1,3),16), g = parseInt(h.slice(3,5),16), b = parseInt(h.slice(5,7),16);
      var t = toward === "white" ? 255 : 0;
      function m(c){ return Math.round(c + (t - c) * amount); }
      function to(n){ return n.toString(16).padStart(2,"0"); }
      return "#" + to(m(r)) + to(m(g)) + to(m(b));
    }
    function hsl(h) {
      var r = parseInt(h.slice(1,3),16)/255, g = parseInt(h.slice(3,5),16)/255, b = parseInt(h.slice(5,7),16)/255;
      var max = Math.max(r,g,b), min = Math.min(r,g,b), l = (max+min)/2, s = 0, hv = 0;
      if (max !== min) {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r: hv = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
          case g: hv = ((b - r) / d + 2) / 6; break;
          default: hv = ((r - g) / d + 4) / 6; break;
        }
      }
      return Math.round(hv*360) + " " + Math.round(s*100) + "% " + Math.round(l*100) + "%";
    }
    var hover = mix(hex,"black",0.12), muted = mix(hex,"white",0.28), light = mix(hex,"white",0.45);
    var root = document.documentElement;
    root.style.setProperty("--brand", hsl(hex));
    root.style.setProperty("--brand-hover", hsl(hover));
    root.style.setProperty("--brand-muted", hsl(muted));
    root.style.setProperty("--brand-light", hsl(light));
    root.style.setProperty("--brand-hex", hex.toUpperCase());
    root.style.setProperty("--ring", hsl(hex));
  } catch (e) {}
})();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <title>Clakete</title>
        <script dangerouslySetInnerHTML={{ __html: brandAccentBootScript }} />
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
