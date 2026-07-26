"use client"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
} from "react"
import { Minus, Plus } from "lucide-react"
import type { ConnectEdge, ConnectNode } from "@/lib/games/connect-the-stars"
import { tmdbPosterUrl } from "@/lib/games/connect-the-stars"
import { cn } from "@/lib/utils"

export type NodePos = { x: number; y: number }
export type { ConnectEdge }

type Props = {
  origin: ConnectNode
  target: ConnectNode
  nodes: ConnectNode[]
  edges: ConnectEdge[]
  positions: Record<string, NodePos>
  onPositionsChange: (next: Record<string, NodePos>) => void
  currentKey: string | null
  onNodeSelect?: (node: ConnectNode) => void
  children?: React.ReactNode
  topBar?: React.ReactNode
  sidePanel?: React.ReactNode
}

function nodeKey(n: ConnectNode) {
  return `${n.kind}-${n.id}`
}

const MIN_ZOOM = 0.35
const MAX_ZOOM = 1.75

export function ConnectPlayground({
  origin,
  target,
  nodes,
  edges,
  positions,
  onPositionsChange,
  currentKey,
  onNodeSelect,
  children,
  topBar,
  sidePanel,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(0.85)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const panDrag = useRef<{
    pointerId: number
    startX: number
    startY: number
    originX: number
    originY: number
  } | null>(null)
  const nodeDrag = useRef<{
    key: string
    pointerId: number
    offsetX: number
    offsetY: number
    startClientX: number
    startClientY: number
    moved: boolean
    node: ConnectNode
  } | null>(null)

  // Center world so origin/target sit nicely on first paint
  useEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const { width, height } = el.getBoundingClientRect()
    const ox = positions[nodeKey(origin)]?.x ?? 200
    const oy = positions[nodeKey(origin)]?.y ?? 300
    const tx = positions[nodeKey(target)]?.x ?? 900
    const ty = positions[nodeKey(target)]?.y ?? 300
    const midX = (ox + tx) / 2
    const midY = (oy + ty) / 2
    setPan({
      x: width / 2 - midX * zoom,
      y: height / 2 - midY * zoom,
    })
    // only on mount / when game starts with these ids
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origin.id, target.id])

  const allNodes: Array<ConnectNode & { role: "origin" | "target" | "path" }> =
    (() => {
      const list: Array<ConnectNode & { role: "origin" | "target" | "path" }> = [
        { ...origin, role: "origin" },
        { ...target, role: "target" },
      ]
      const originKey = nodeKey(origin)
      const targetKey = nodeKey(target)
      for (const n of nodes) {
        const key = nodeKey(n)
        if (key === originKey || key === targetKey) continue
        list.push({ ...n, role: "path" })
      }
      return list
    })()

  const onWheel = (e: ReactWheelEvent) => {
    e.preventDefault()
    const el = viewportRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const delta = e.deltaY > 0 ? 0.92 : 1.08
    const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * delta))
    const worldX = (mx - pan.x) / zoom
    const worldY = (my - pan.y) / zoom
    setZoom(nextZoom)
    setPan({
      x: mx - worldX * nextZoom,
      y: my - worldY * nextZoom,
    })
  }

  const startPan = (e: ReactPointerEvent) => {
    if (nodeDrag.current) return
    if (e.button !== 0 && e.button !== 1) return
    if ((e.target as HTMLElement).closest("[data-playground-node]")) return
    panDrag.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: pan.x,
      originY: pan.y,
    }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: ReactPointerEvent) => {
    if (nodeDrag.current && nodeDrag.current.pointerId === e.pointerId) {
      const drag = nodeDrag.current
      const dx = e.clientX - drag.startClientX
      const dy = e.clientY - drag.startClientY
      if (!drag.moved && dx * dx + dy * dy > 100) {
        drag.moved = true
      }
      if (!drag.moved) return
      const el = viewportRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const worldX = (e.clientX - rect.left - pan.x) / zoom - drag.offsetX
      const worldY = (e.clientY - rect.top - pan.y) / zoom - drag.offsetY
      onPositionsChange({
        ...positions,
        [drag.key]: { x: worldX, y: worldY },
      })
      return
    }
    if (panDrag.current && panDrag.current.pointerId === e.pointerId) {
      setPan({
        x: panDrag.current.originX + (e.clientX - panDrag.current.startX),
        y: panDrag.current.originY + (e.clientY - panDrag.current.startY),
      })
    }
  }

  const endPointer = (e: ReactPointerEvent) => {
    if (nodeDrag.current?.pointerId === e.pointerId) {
      const drag = nodeDrag.current
      nodeDrag.current = null
      if (!drag.moved) {
        onNodeSelect?.(drag.node)
      }
    }
    if (panDrag.current?.pointerId === e.pointerId) panDrag.current = null
  }

  const startNodeDrag = (node: ConnectNode, e: ReactPointerEvent) => {
    e.stopPropagation()
    const key = nodeKey(node)
    const el = viewportRef.current
    const pos = positions[key]
    if (!el || !pos) return
    const rect = el.getBoundingClientRect()
    const worldX = (e.clientX - rect.left - pan.x) / zoom
    const worldY = (e.clientY - rect.top - pan.y) / zoom
    nodeDrag.current = {
      key,
      pointerId: e.pointerId,
      offsetX: worldX - pos.x,
      offsetY: worldY - pos.y,
      startClientX: e.clientX,
      startClientY: e.clientY,
      moved: false,
      node,
    }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }

  const bumpZoom = useCallback((factor: number) => {
    setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * factor)))
  }, [])

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {topBar ? (
        <div className="pointer-events-none absolute inset-x-0 top-[calc(env(safe-area-inset-top,0px)+5.25rem)] z-30 px-3 sm:top-[calc(env(safe-area-inset-top,0px)+5.75rem)] sm:px-4">
          <div className="pointer-events-auto">{topBar}</div>
        </div>
      ) : null}

      <div
        ref={viewportRef}
        className="relative min-h-0 flex-1 cursor-grab touch-none active:cursor-grabbing"
        onWheel={onWheel}
        onPointerDown={startPan}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
      >
        <div
          aria-hidden
          className="absolute inset-0 bg-background"
          style={{
            backgroundImage: `
              radial-gradient(circle, hsl(var(--foreground) / 0.14) 1px, transparent 1.2px)
            `,
            backgroundSize: `${22 * zoom}px ${22 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        />

        <div
          className="absolute left-0 top-0 origin-top-left will-change-transform"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          }}
        >
          <svg
            className="pointer-events-none absolute left-0 top-0 overflow-visible"
            width={1}
            height={1}
            aria-hidden
          >
            {edges.map(({ a, b }, i) => {
              const pa = positions[a]
              const pb = positions[b]
              if (!pa || !pb) return null
              return (
                <line
                  key={i}
                  x1={pa.x}
                  y1={pa.y}
                  x2={pb.x}
                  y2={pb.y}
                  stroke="hsl(var(--brand) / 0.65)"
                  strokeWidth={2.5 / zoom}
                  strokeLinecap="round"
                />
              )
            })}
          </svg>

          {allNodes.map((node) => {
            const key = nodeKey(node)
            const pos = positions[key]
            if (!pos) return null
            const src = tmdbPosterUrl(node.imagePath, "w185")
            const isSelected = key === currentKey

            return (
              <div
                key={`${key}-${node.role}`}
                data-playground-node
                onPointerDown={(e) => startNodeDrag(node, e)}
                className={cn(
                  "absolute z-10 flex w-[88px] -translate-x-1/2 -translate-y-1/2 cursor-grab flex-col items-center gap-1.5 active:cursor-grabbing sm:w-[100px]",
                  isSelected && "z-20",
                )}
                style={{ left: pos.x, top: pos.y }}
              >
                <div
                  className={cn(
                    "relative aspect-[2/3] w-full overflow-hidden rounded-xl border bg-muted shadow-md transition-[border-color,box-shadow]",
                    isSelected
                      ? "border-brand shadow-[0_0_0_1px_hsl(var(--brand)/0.45)]"
                      : "border-border",
                  )}
                >
                  {src ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={src}
                      alt=""
                      className="pointer-events-none absolute inset-0 h-full w-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      ?
                    </div>
                  )}
                  {node.role === "origin" || node.role === "target" ? (
                    <span
                      className={cn(
                        "pointer-events-none absolute left-1.5 top-1.5 flex h-5 min-w-5 items-center justify-center rounded-md px-1",
                        "bg-background/90 text-[10px] font-semibold tracking-wide text-foreground shadow-sm backdrop-blur-sm",
                        "ring-1 ring-black/5 dark:ring-white/10",
                      )}
                      aria-label={node.role === "origin" ? "A" : "B"}
                    >
                      {node.role === "origin" ? "A" : "B"}
                    </span>
                  ) : null}
                </div>
                <p className="line-clamp-2 max-w-[7rem] text-center text-[10px] font-medium leading-tight text-foreground sm:text-[11px]">
                  {node.name}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {sidePanel}

      <div className="absolute bottom-[5.5rem] right-3 z-30 flex flex-col gap-1 sm:bottom-24 sm:right-4">
        <button
          type="button"
          onClick={() => bumpZoom(1.12)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background/90 text-foreground shadow-sm backdrop-blur hover:bg-muted"
          aria-label="Zoom in"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => bumpZoom(1 / 1.12)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-background/90 text-foreground shadow-sm backdrop-blur hover:bg-muted"
          aria-label="Zoom out"
        >
          <Minus className="h-4 w-4" />
        </button>
      </div>

      {children ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-3 sm:p-4">
          <div className="pointer-events-auto mx-auto max-w-xl">{children}</div>
        </div>
      ) : null}
    </div>
  )
}

/** Default spawn positions when a game starts / a node is added. */
export function initialPlaygroundPositions(
  origin: ConnectNode,
  target: ConnectNode,
): Record<string, NodePos> {
  return {
    [nodeKey(origin)]: { x: 280, y: 360 },
    [nodeKey(target)]: { x: 980, y: 360 },
  }
}

export function spawnNear(
  positions: Record<string, NodePos>,
  nearKey: string,
  newKey: string,
  index: number,
): Record<string, NodePos> {
  if (positions[newKey]) return positions
  const base = positions[nearKey] ?? { x: 600, y: 360 }
  const angle = (index % 6) * (Math.PI / 3) - Math.PI / 2
  const dist = 160 + (index % 3) * 24
  return {
    ...positions,
    [newKey]: {
      x: base.x + Math.cos(angle) * dist,
      y: base.y + Math.sin(angle) * dist,
    },
  }
}
