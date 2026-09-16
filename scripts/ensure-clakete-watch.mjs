import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"

/**
 * Garante `private/clakete-watch` no build/dev.
 * - Local: se a pasta já existe, usa.
 * - CI/Vercel: clona o repo privado com CLAKETE_WATCH_CLONE_TOKEN (ou GITHUB_TOKEN).
 */
const dest = path.join(process.cwd(), "private", "clakete-watch")
const marker = path.join(dest, "package.json")

if (fs.existsSync(marker)) {
  console.log("[clakete-watch] using local private/clakete-watch")
  process.exit(0)
}

const token =
  process.env.CLAKETE_WATCH_CLONE_TOKEN ||
  process.env.GITHUB_TOKEN ||
  process.env.GH_TOKEN ||
  ""

const repo =
  process.env.CLAKETE_WATCH_REPO || "https://github.com/MAUXII/clakete-watch.git"

if (!token) {
  console.warn(
    "[clakete-watch] missing clone token — showcase stub will be used (no Clakete playback)",
  )
  process.exit(0)
}

fs.mkdirSync(path.dirname(dest), { recursive: true })
const url = repo.replace(
  "https://github.com/",
  `https://x-access-token:${token}@github.com/`,
)

console.log("[clakete-watch] cloning private package…")
execSync(`git clone --depth 1 "${url}" "${dest}"`, { stdio: "inherit" })
