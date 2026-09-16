import { chromium } from "playwright"
import path from "node:path"
import { pathToFileURL } from "node:url"
import { fileURLToPath } from "node:url"
import fs from "node:fs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const htmlPath = path.join(__dirname, "index.html")
const outDir = path.join(__dirname, "..", "..", "public", "brand", "sections")

fs.mkdirSync(outDir, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: 1400, height: 3200 },
  deviceScaleFactor: 2,
})

await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" })
await page.waitForTimeout(1200)
await page.evaluate(async () => {
  await document.fonts.ready
})

const banners = page.locator(".banner")
const count = await banners.count()

for (let i = 0; i < count; i++) {
  const el = banners.nth(i)
  const name = await el.getAttribute("data-name")
  const out = path.join(outDir, `${name}.png`)
  await el.screenshot({ path: out, type: "png" })
  console.log("wrote", out)
}

await browser.close()
