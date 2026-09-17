import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"

/** Optional private module for deploy/local builds. */
const dest = path.join(process.cwd(), "private", "clakete-watch")
const marker = path.join(dest, "package.json")

if (fs.existsSync(marker)) {
  console.log("[optional-module] using local copy")
  process.exit(0)
}

const token = (
  process.env.CLAKETE_WATCH_CLONE_TOKEN ||
  process.env.GITHUB_TOKEN ||
  process.env.GH_TOKEN ||
  ""
).trim()

const repo =
  process.env.CLAKETE_WATCH_REPO || "https://github.com/MAUXII/clakete-watch.git"

if (!token) {
  console.warn("[optional-module] no clone token — stub active")
  process.exit(0)
}

fs.mkdirSync(path.dirname(dest), { recursive: true })

const authedUrls = [
  repo.replace(
    "https://github.com/",
    `https://x-access-token:${encodeURIComponent(token)}@github.com/`,
  ),
  repo.replace("https://github.com/", `https://${encodeURIComponent(token)}@github.com/`),
]

console.log("[optional-module] cloning…")

let lastErr = null
for (const url of authedUrls) {
  try {
    execSync(`git clone --depth 1 "${url}" "${dest}"`, { stdio: "inherit" })
    if (fs.existsSync(marker)) {
      console.log("[optional-module] ready")
      process.exit(0)
    }
  } catch (err) {
    lastErr = err
    fs.rmSync(dest, { recursive: true, force: true })
  }
}

console.error("[optional-module] clone failed")
if (lastErr) console.error(lastErr)
process.exit(1)
