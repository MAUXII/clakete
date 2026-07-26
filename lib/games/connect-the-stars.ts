/** Curated actors for Connect the Stars — solvable, well-known filmographies. */
export type ConnectActorSeed = {
  id: number
  name: string
  profile_path?: string | null
}

export type ConnectNodeKind = "person" | "movie"

export type ConnectNode = {
  id: number
  kind: ConnectNodeKind
  name: string
  imagePath: string | null
  subtitle?: string | null
}

export type ConnectOption = ConnectNode

export type ConnectEdge = { a: string; b: string }

export function connectNodeKey(n: { kind: ConnectNodeKind; id: number }) {
  return `${n.kind}-${n.id}`
}

/** Shortest path between two node keys on an undirected edge list. */
export function findConnectedPath(
  nodes: ConnectNode[],
  edges: ConnectEdge[],
  from: string,
  to: string,
): ConnectNode[] | null {
  const nodeByKey = new Map(nodes.map((node) => [connectNodeKey(node), node]))
  const queue = [from]
  const previous = new Map<string, string | null>([[from, null]])

  while (queue.length > 0) {
    const key = queue.shift()!
    if (key === to) break
    for (const edge of edges) {
      const neighbor = edge.a === key ? edge.b : edge.b === key ? edge.a : null
      if (neighbor && !previous.has(neighbor)) {
        previous.set(neighbor, key)
        queue.push(neighbor)
      }
    }
  }
  if (!previous.has(to)) return null

  const keys: string[] = []
  for (let key: string | null = to; key; key = previous.get(key) ?? null) {
    keys.unshift(key)
  }
  return keys.map((key) => nodeByKey.get(key)).filter(Boolean) as ConnectNode[]
}

/** BFS reachability set from a start key. */
export function reachableKeys(edges: ConnectEdge[], start: string): Set<string> {
  const seen = new Set<string>([start])
  const queue = [start]
  while (queue.length > 0) {
    const key = queue.shift()!
    for (const edge of edges) {
      const neighbor = edge.a === key ? edge.b : edge.b === key ? edge.a : null
      if (neighbor && !seen.has(neighbor)) {
        seen.add(neighbor)
        queue.push(neighbor)
      }
    }
  }
  return seen
}

const RECENT_PAIRS_KEY = "clakete:connect-recent-pairs"
const RECENT_PAIRS_MAX = 8

function pairKey(a: number, b: number) {
  return a < b ? `${a}:${b}` : `${b}:${a}`
}

export function readRecentPairs(): string[] {
  if (typeof window === "undefined") return []
  try {
    const raw = sessionStorage.getItem(RECENT_PAIRS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((x): x is string => typeof x === "string")
      : []
  } catch {
    return []
  }
}

export function rememberPair(a: number, b: number) {
  if (typeof window === "undefined") return
  const key = pairKey(a, b)
  const next = [key, ...readRecentPairs().filter((k) => k !== key)].slice(
    0,
    RECENT_PAIRS_MAX,
  )
  try {
    sessionStorage.setItem(RECENT_PAIRS_KEY, JSON.stringify(next))
  } catch {
    /* ignore quota */
  }
}

/** Prefer a seed that hasn't recently paired with `otherId`. */
export function pickFreshSeed(
  otherId: number | null | undefined,
  pool: ConnectActorSeed[] = CONNECT_ACTOR_POOL,
): ConnectActorSeed {
  if (pool.length === 0) throw new Error("Actor pool empty")
  const recent = new Set(readRecentPairs())
  const candidates = pool.filter((p) => p.id !== otherId)
  const base = candidates.length > 0 ? candidates : pool
  const fresh = base.filter(
    (p) => !otherId || !recent.has(pairKey(p.id, otherId)),
  )
  const list = fresh.length > 0 ? fresh : base
  return list[Math.floor(Math.random() * list.length)]!
}

export const CONNECT_ACTOR_POOL: ConnectActorSeed[] = [
  { id: 1892, name: "Matt Damon" },
  { id: 6193, name: "Leonardo DiCaprio" },
  { id: 287, name: "Brad Pitt" },
  { id: 31, name: "Tom Hanks" },
  { id: 1245, name: "Scarlett Johansson" },
  { id: 3894, name: "Christian Bale" },
  { id: 2888, name: "Will Smith" },
  { id: 8784, name: "Daniel Craig" },
  { id: 1136406, name: "Tom Holland" },
  { id: 73421, name: "Joaquin Phoenix" },
  { id: 5292, name: "Denzel Washington" },
  { id: 5081, name: "Emily Blunt" },
  { id: 1511, name: "Danny Glover" },
  { id: 19274, name: "Ryan Gosling" },
  { id: 30614, name: "Ryan Reynolds" },
  { id: 11701, name: "Angelina Jolie" },
  { id: 1813, name: "Anne Hathaway" },
  { id: 17419, name: "Jennifer Lawrence" },
  { id: 3223, name: "Robert Downey Jr." },
  { id: 16828, name: "Chris Evans" },
  { id: 74568, name: "Chris Hemsworth" },
  { id: 17288, name: "Florence Pugh" },
  { id: 60073, name: "Zendaya" },
  { id: 6161, name: "Keanu Reeves" },
  { id: 1327, name: "Ian McKellen" },
  { id: 10980, name: "Daniel Radcliffe" },
  { id: 234352, name: "Timothée Chalamet" },
  { id: 1190668, name: "Anya Taylor-Joy" },
]

export function pickRandomPair(
  pool: ConnectActorSeed[] = CONNECT_ACTOR_POOL,
): [ConnectActorSeed, ConnectActorSeed] {
  if (pool.length < 2) {
    throw new Error("Actor pool too small")
  }
  const a = pool[Math.floor(Math.random() * pool.length)]!
  let b = pool[Math.floor(Math.random() * pool.length)]!
  let guard = 0
  while (b.id === a.id && guard < 20) {
    b = pool[Math.floor(Math.random() * pool.length)]!
    guard += 1
  }
  return [a, b]
}

/** Unique random seeds from the curated pool (famous faces for hub visuals). */
export function pickRandomSeeds(
  count: number,
  pool: ConnectActorSeed[] = CONNECT_ACTOR_POOL,
): ConnectActorSeed[] {
  const n = Math.min(count, pool.length)
  const shuffled = [...pool]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!]
  }
  return shuffled.slice(0, n)
}

export function tmdbProfileUrl(path: string | null | undefined, size = "w185") {
  if (!path) return null
  const p = path.startsWith("/") ? path : `/${path}`
  return `https://image.tmdb.org/t/p/${size}${p}`
}

export function tmdbPosterUrl(path: string | null | undefined, size = "w185") {
  return tmdbProfileUrl(path, size)
}
