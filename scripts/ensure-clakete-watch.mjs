import fs from "node:fs"
import path from "node:path"
import { execSync } from "node:child_process"

/** Optional private module for deploy/local builds. */
const root = process.cwd()
const dest = path.join(root, "private", "clakete-watch")
const marker = path.join(dest, "package.json")
const stub = path.join(root, "lib", "clakete-watch-stub")
/** Must NOT be a dotfolder — Tailwind/fast-glob skips `.*` dirs, which purged player CSS. */
const linkDir = path.join(root, "lib", "watch-runtime", "active")
const legacyDotLink = path.join(root, "lib", "watch-runtime", ".link")

function linkModule(fromPrivate) {
  fs.rmSync(linkDir, { recursive: true, force: true })
  fs.rmSync(legacyDotLink, { recursive: true, force: true })
  fs.mkdirSync(linkDir, { recursive: true })

  if (fromPrivate) {
    fs.cpSync(path.join(dest, "src"), linkDir, { recursive: true })
    console.log("[optional-module] linked private sources")
  } else {
    fs.copyFileSync(path.join(stub, "index.ts"), path.join(linkDir, "index.ts"))
    fs.copyFileSync(path.join(stub, "server.ts"), path.join(linkDir, "server.ts"))
    console.log("[optional-module] linked stub")
  }
}

if (!fs.existsSync(marker)) {
  const token = (
    process.env.CLAKETE_WATCH_CLONE_TOKEN ||
    process.env.GITHUB_TOKEN ||
    process.env.GH_TOKEN ||
    ""
  ).trim()

  const repo =
    process.env.CLAKETE_WATCH_REPO ||
    "https://github.com/MAUXII/clakete-watch.git"

  if (!token) {
    console.warn("[optional-module] no clone token — stub active")
    linkModule(false)
    process.exit(0)
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true })
  const authedUrls = [
    repo.replace(
      "https://github.com/",
      `https://x-access-token:${encodeURIComponent(token)}@github.com/`,
    ),
    repo.replace(
      "https://github.com/",
      `https://${encodeURIComponent(token)}@github.com/`,
    ),
  ]

  console.log("[optional-module] cloning…")
  let ok = false
  let lastErr = null
  for (const url of authedUrls) {
    try {
      fs.rmSync(dest, { recursive: true, force: true })
      execSync(`git clone --depth 1 "${url}" "${dest}"`, { stdio: "inherit" })
      if (fs.existsSync(marker)) {
        ok = true
        console.log("[optional-module] ready")
        break
      }
    } catch (err) {
      lastErr = err
      fs.rmSync(dest, { recursive: true, force: true })
    }
  }

  if (!ok) {
    console.error("[optional-module] clone failed")
    if (lastErr) console.error(lastErr)
    process.exit(1)
  }
} else {
  console.log("[optional-module] using local copy")
}

linkModule(fs.existsSync(marker))
process.exit(0)
