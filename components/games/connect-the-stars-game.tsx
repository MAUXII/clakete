"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Lightbulb, RotateCcw, Search } from "lucide-react"
import { toast } from "sonner"
import { ActorStarCard } from "@/components/games/actor-star-card"
import {
  ConnectPlayground,
  initialPlaygroundPositions,
  spawnNear,
  type NodePos,
} from "@/components/games/connect-playground"
import { ConnectWinDialog } from "@/components/games/connect-win-dialog"
import { ConnectInspectPanel } from "@/components/games/connect-inspect-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { useT } from "@/components/providers/i18n-provider"
import { useLocalePrefs } from "@/hooks/use-locale-prefs"
import {
  type ConnectEdge,
  type ConnectNode,
  connectNodeKey,
  findConnectedPath,
  pickFreshSeed,
  rememberPair,
  tmdbPosterUrl,
} from "@/lib/games/connect-the-stars"
import { playListFinishConfetti } from "@/lib/list-finish-confetti"
import { pageContainerClass } from "@/lib/page-container"
import { cn } from "@/lib/utils"

type Phase = "setup" | "playing"

type SearchHit = ConnectNode & { playable?: boolean }

async function fetchPerson(id: number, language: string): Promise<ConnectNode> {
  const res = await fetch(
    `/api/games/person/${id}?language=${encodeURIComponent(language)}`,
  )
  if (!res.ok) throw new Error("person")
  return res.json()
}

export function ConnectTheStarsGame() {
  const { t } = useT()
  const { tmdbLanguage } = useLocalePrefs()
  const [phase, setPhase] = useState<Phase>("setup")
  const [pickA, setPickA] = useState<ConnectNode | null>(null)
  const [pickB, setPickB] = useState<ConnectNode | null>(null)
  const [choosingSlot, setChoosingSlot] = useState<1 | 2 | null>(null)
  const [easyPair, setEasyPair] = useState(false)

  const [origin, setOrigin] = useState<ConnectNode | null>(null)
  const [target, setTarget] = useState<ConnectNode | null>(null)
  const [nodes, setNodes] = useState<ConnectNode[]>([])
  const [edges, setEdges] = useState<ConnectEdge[]>([])
  const [winPath, setWinPath] = useState<ConnectNode[]>([])
  const [positions, setPositions] = useState<Record<string, NodePos>>({})
  const [won, setWon] = useState(false)
  const [winDialogOpen, setWinDialogOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchHit[]>([])
  const [searching, setSearching] = useState(false)
  const [hintLoading, setHintLoading] = useState(false)
  const [hint, setHint] = useState<ConnectNode | null>(null)
  const [inspect, setInspect] = useState<ConnectNode | null>(null)

  const winTimeoutRef = useRef<number | null>(null)

  const boardNodes = useMemo(() => {
    const unique = new Map<string, ConnectNode>()
    for (const node of nodes) unique.set(connectNodeKey(node), node)
    return [...unique.values()]
  }, [nodes])

  const connectionPath = useMemo(() => {
    if (!origin || !target) return null
    return findConnectedPath(
      boardNodes,
      edges,
      connectNodeKey(origin),
      connectNodeKey(target),
    )
  }, [boardNodes, edges, origin, target])

  // Shortest A→B when connected; otherwise number of intermediate guesses.
  const steps = connectionPath
    ? Math.max(0, connectionPath.length - 1)
    : Math.max(0, boardNodes.length - 2)

  const usedKeys = useMemo(
    () => new Set(boardNodes.map((n) => connectNodeKey(n))),
    [boardNodes],
  )

  useEffect(() => {
    return () => {
      if (winTimeoutRef.current != null) {
        window.clearTimeout(winTimeoutRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (!pickA || !pickB || pickA.id === pickB.id) {
      setEasyPair(false)
      return
    }
    let cancelled = false
    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          const res = await fetch(
            `/api/games/shared-films?a=${pickA.id}&b=${pickB.id}&language=${encodeURIComponent(tmdbLanguage)}`,
          )
          const data = (await res.json()) as { easy?: boolean }
          if (!cancelled) setEasyPair(Boolean(data.easy))
        } catch {
          if (!cancelled) setEasyPair(false)
        }
      })()
    }, 350)
    return () => {
      cancelled = true
      window.clearTimeout(handle)
    }
  }, [pickA, pickB, tmdbLanguage])

  const chooseForMe = async (slot: 1 | 2) => {
    setChoosingSlot(slot)
    try {
      const other = slot === 1 ? pickB : pickA
      const seed = pickFreshSeed(other?.id)
      const node = await fetchPerson(seed.id, tmdbLanguage)
      if (slot === 1) setPickA(node)
      else setPickB(node)
    } catch {
      toast.error(t("games.loadError"))
    } finally {
      setChoosingSlot(null)
    }
  }

  const startGame = () => {
    if (!pickA || !pickB || pickA.id === pickB.id) return
    rememberPair(pickA.id, pickB.id)
    setOrigin(pickA)
    setTarget(pickB)
    setNodes([pickA, pickB])
    setEdges([])
    setWinPath([])
    setPositions(initialPlaygroundPositions(pickA, pickB))
    setWon(false)
    setWinDialogOpen(false)
    setQuery("")
    setResults([])
    setHint(null)
    setInspect(null)
    setError(null)
    setPhase("playing")
  }

  const resetToSetup = () => {
    if (winTimeoutRef.current != null) {
      window.clearTimeout(winTimeoutRef.current)
      winTimeoutRef.current = null
    }
    setPhase("setup")
    setNodes([])
    setEdges([])
    setWinPath([])
    setPositions({})
    setWon(false)
    setWinDialogOpen(false)
    setOrigin(null)
    setTarget(null)
    setQuery("")
    setResults([])
    setHint(null)
    setInspect(null)
    setError(null)
  }

  useEffect(() => {
    if (phase !== "playing" || won) return
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      return
    }
    const hasFilmOnBoard = boardNodes.some((n) => n.kind === "movie")
    const boardPayload = boardNodes.map((item) => ({
      id: item.id,
      kind: item.kind,
      key: connectNodeKey(item),
    }))
    const handle = window.setTimeout(() => {
      void (async () => {
        setSearching(true)
        try {
          const url = `/api/games/search?q=${encodeURIComponent(q)}&language=${encodeURIComponent(tmdbLanguage)}`
          const res = await fetch(url)
          const data = (await res.json()) as { results?: ConnectNode[] }
          const filtered = (data.results ?? []).filter(
            (result) =>
              !usedKeys.has(connectNodeKey(result)) &&
              (hasFilmOnBoard || result.kind === "movie"),
          )

          const marked = await Promise.all(
            filtered.slice(0, 10).map(async (result) => {
              try {
                const check = await fetch("/api/games/validate", {
                  method: "POST",
                  headers: { "content-type": "application/json" },
                  body: JSON.stringify({
                    candidate: {
                      id: result.id,
                      kind: result.kind,
                      key: connectNodeKey(result),
                    },
                    board: boardPayload,
                    language: tmdbLanguage,
                  }),
                })
                const verdict = (await check.json()) as { ok?: boolean }
                return { ...result, playable: Boolean(verdict.ok) } as SearchHit
              } catch {
                return { ...result, playable: undefined } as SearchHit
              }
            }),
          )

          marked.sort(
            (a, b) => Number(Boolean(b.playable)) - Number(Boolean(a.playable)),
          )
          setResults(marked)
        } catch {
          setResults([])
        } finally {
          setSearching(false)
        }
      })()
    }, 300)
    return () => window.clearTimeout(handle)
  }, [query, phase, won, usedKeys, boardNodes, tmdbLanguage])

  const applyNode = useCallback(
    async (node: ConnectNode) => {
      if (!origin || !target || busy || won || usedKeys.has(connectNodeKey(node)))
        return
      setBusy(true)
      setError(null)
      try {
        const res = await fetch("/api/games/validate", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            candidate: {
              id: node.id,
              kind: node.kind,
              key: connectNodeKey(node),
            },
            board: boardNodes.map((item) => ({
              id: item.id,
              kind: item.kind,
              key: connectNodeKey(item),
            })),
            language: tmdbLanguage,
          }),
        })
        const data = (await res.json()) as {
          ok?: boolean
          connectedKeys?: string[]
        }
        const connectedKeys = data.connectedKeys ?? []
        if (!data.ok || connectedKeys.length === 0) {
          setError(t("games.invalidMove"))
          return
        }

        const nodeKey = connectNodeKey(node)
        const newEdges = connectedKeys.map((key) => ({ a: key, b: nodeKey }))
        const nextEdges = [...edges, ...newEdges]
        const nextNodes = [...boardNodes, node]
        setNodes(nextNodes)
        setEdges(nextEdges)
        setPositions((prev) =>
          spawnNear(prev, connectedKeys[0]!, nodeKey, nextNodes.length),
        )
        setQuery("")
        setResults([])
        setHint(null)
        setInspect(node)

        const solvedPath = findConnectedPath(
          nextNodes,
          nextEdges,
          connectNodeKey(origin),
          connectNodeKey(target),
        )
        if (solvedPath) {
          setWinPath(solvedPath)
          setWon(true)
          playListFinishConfetti()
          if (winTimeoutRef.current != null) {
            window.clearTimeout(winTimeoutRef.current)
          }
          winTimeoutRef.current = window.setTimeout(() => {
            setWinDialogOpen(true)
            winTimeoutRef.current = null
          }, 650)
        }
      } catch {
        setError(t("games.loadError"))
      } finally {
        setBusy(false)
      }
    },
    [boardNodes, busy, edges, origin, t, target, tmdbLanguage, usedKeys, won],
  )

  const requestHint = async () => {
    const source = inspect ?? origin
    if (!source || !target || !origin || hintLoading) return
    setHintLoading(true)
    try {
      const res = await fetch("/api/games/hint", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: source.kind,
          id: source.id,
          originKey: connectNodeKey(origin),
          targetKey: connectNodeKey(target),
          targetId: target.id,
          board: boardNodes.map((item) => ({
            id: item.id,
            kind: item.kind,
            key: connectNodeKey(item),
          })),
          edges,
          exclude: [...usedKeys],
          language: tmdbLanguage,
        }),
      })
      const data = (await res.json()) as { hint?: ConnectNode | null }
      if (!data.hint) {
        toast.message(t("games.noHint"))
        return
      }
      setHint(data.hint)
    } catch {
      toast.error(t("games.loadError"))
    } finally {
      setHintLoading(false)
    }
  }

  if (phase === "setup") {
    return (
      <div className={cn(pageContainerClass, "pb-8 pt-24 sm:pb-10 sm:pt-28")}>
        <header className="mb-6 text-center sm:mb-8">
          <h1 className="font-sketch text-4xl leading-none tracking-tight text-foreground sm:text-5xl">
            {t("games.setupTitle")}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {t("games.setupSubtitle")}
          </p>
        </header>

        <div className="mx-auto flex w-full flex-col items-center justify-center gap-5 sm:flex-row sm:items-stretch sm:gap-6">
          <ActorStarCard
            index={1}
            placeholder={t("games.enterStarName")}
            chooseForMeLabel={t("games.chooseForMe")}
            value={pickA}
            onChange={setPickA}
            onChooseForMe={() => void chooseForMe(1)}
            choosing={choosingSlot === 1}
            excludeId={pickB?.id}
            language={tmdbLanguage}
          />

          <ActorStarCard
            index={2}
            placeholder={t("games.enterStarName")}
            chooseForMeLabel={t("games.chooseForMe")}
            value={pickB}
            onChange={setPickB}
            onChooseForMe={() => void chooseForMe(2)}
            choosing={choosingSlot === 2}
            excludeId={pickA?.id}
            language={tmdbLanguage}
          />
        </div>

        {easyPair ? (
          <p className="mx-auto mt-4 max-w-md text-center text-xs text-muted-foreground">
            {t("games.easyPairWarning")}
          </p>
        ) : null}

        <div className="mx-auto mt-6 flex justify-center sm:mt-8">
          <Button
            type="button"
            className="h-11 rounded-full bg-brand px-10 text-sm text-white shadow-lg shadow-brand/25 transition hover:bg-brand-hover disabled:opacity-40 disabled:shadow-none sm:h-12 sm:text-base"
            disabled={!pickA || !pickB || pickA.id === pickB.id}
            onClick={startGame}
          >
            {t("games.startGame")}
          </Button>
        </div>
      </div>
    )
  }

  if (!origin || !target) return null

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <ConnectPlayground
        origin={origin}
        target={target}
        nodes={boardNodes}
        edges={edges}
        positions={positions}
        onPositionsChange={setPositions}
        currentKey={inspect ? connectNodeKey(inspect) : null}
        onNodeSelect={setInspect}
        sidePanel={
          inspect ? (
            <ConnectInspectPanel
              node={inspect}
              found={boardNodes.filter((node) => {
                if (connectNodeKey(node) === connectNodeKey(inspect)) return false
                const inspectKey = connectNodeKey(inspect)
                const otherKey = connectNodeKey(node)
                return edges.some(
                  (edge) =>
                    (edge.a === inspectKey && edge.b === otherKey) ||
                    (edge.b === inspectKey && edge.a === otherKey),
                )
              })}
              onClose={() => setInspect(null)}
              onHint={() => void requestHint()}
              hintLoading={hintLoading}
              hintDisabled={won}
            />
          ) : null
        }
        topBar={
          <div className="relative flex min-h-10 items-start justify-end gap-2">
            <p className="pointer-events-none absolute inset-x-0 top-0 mx-auto max-w-[min(100%,36rem)] truncate px-14 text-center font-sketch text-lg leading-snug text-foreground sm:text-xl">
              {t("games.connectVerb")}{" "}
              <span className="text-brand">{origin.name}</span>{" "}
              <span className="text-foreground">{t("games.connectJoin")}</span>{" "}
              <span className="text-brand">{target.name}</span>
            </p>
            <div className="relative z-10 flex shrink-0 items-center gap-1.5">
              <span className="mr-1 hidden text-xs text-muted-foreground sm:inline">
                {t("games.steps", { count: String(steps) })}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-background/90 backdrop-blur"
                disabled={hintLoading || won}
                onClick={() => void requestHint()}
              >
                <Lightbulb className="mr-1 h-3.5 w-3.5" />
                {t("games.needHint")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="bg-background/90 backdrop-blur"
                onClick={resetToSetup}
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </Button>
              <Link
                href="/games"
                className="inline-flex h-8 items-center rounded-md border border-border bg-background/90 px-2 text-xs text-muted-foreground backdrop-blur hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        }
      >
        {hint ? (
          <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-brand/30 bg-background/95 px-3 py-2 shadow-sm">
            <p className="text-xs text-muted-foreground sm:text-sm">
              {t("games.hintLabel")}:{" "}
              <span className="font-medium text-foreground">{hint.name}</span>
            </p>
            <Button
              type="button"
              size="sm"
              className="bg-brand text-white hover:bg-brand-hover"
              disabled={busy}
              onClick={() => void applyNode(hint)}
            >
              {t("games.useHint")}
            </Button>
          </div>
        ) : null}

        {error ? (
          <p className="mb-2 text-center text-xs text-destructive">{error}</p>
        ) : null}

        <div className="relative rounded-xl border border-border bg-background/95 shadow-lg backdrop-blur">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => {
              setError(null)
              setQuery(e.target.value)
            }}
            disabled={won || busy}
            placeholder={
              boardNodes.some((n) => n.kind === "movie")
                ? t("games.searchMovieOrActorPlaceholder")
                : t("games.searchFilmPlaceholder")
            }
            className="h-12 border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
          />
          {(searching || results.length > 0) && query.trim().length >= 2 ? (
            <div className="absolute bottom-[calc(100%+0.5rem)] left-0 right-0 max-h-56 overflow-y-auto rounded-xl border border-border bg-popover shadow-xl">
              {searching ? (
                <div className="space-y-2 p-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <ul>
                  {results.map((r) => {
                    const src = tmdbPosterUrl(r.imagePath, "w92")
                    const muted = r.playable === false
                    return (
                      <li key={connectNodeKey(r)}>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void applyNode(r)}
                          className={cn(
                            "flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-muted/70",
                            muted && "opacity-45",
                          )}
                        >
                          <div className="relative h-11 w-8 shrink-0 overflow-hidden rounded-md bg-muted">
                            {src ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={src}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : null}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {r.name}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {muted
                                ? t("games.notPlayableYet")
                                : r.subtitle ||
                                  (r.playable
                                    ? t("games.playableNow")
                                    : null)}
                            </p>
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          ) : null}
        </div>
      </ConnectPlayground>

      <ConnectWinDialog
        open={winDialogOpen}
        onOpenChange={setWinDialogOpen}
        path={winPath}
        steps={steps}
        originName={origin.name}
        targetName={target.name}
        onPlayAgain={resetToSetup}
      />
    </div>
  )
}
