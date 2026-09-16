"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { ChevronRight } from "lucide-react"
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass"
import { cn } from "@/lib/utils"

type GlassMenuProps = {
  open: boolean
  x: number
  y: number
  onClose: () => void
  children: React.ReactNode
  className?: string
  width?: number | string
  zIndex?: number
}

/**
 * Frosted menu (LiquidGlass) — ported from Rorscharch.
 * Flips upward when it would overflow the viewport bottom.
 */
export function GlassMenu({
  open,
  x,
  y,
  onClose,
  children,
  className,
  width = 220,
  zIndex = 500,
}: GlassMenuProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ left: x, top: y })

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target
      const el =
        t instanceof Element ? t : t instanceof Node ? t.parentElement : null
      if (el?.closest("[data-ck-glass-menu]")) return
      onClose()
    }
    window.addEventListener("pointerdown", onPointerDown, true)
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("pointerdown", onPointerDown, true)
      window.removeEventListener("keydown", onKey)
    }
  }, [open, onClose])

  useLayoutEffect(() => {
    if (!open || !ref.current) return
    const el = ref.current
    const pad = 8
    const gap = 6
    const w = typeof width === "number" ? width : el.offsetWidth || 220
    const h = el.getBoundingClientRect().height
    const vw = window.innerWidth
    const vh = window.innerHeight

    let left = Math.min(x, vw - pad - w)
    left = Math.max(pad, left)

    let top = y
    if (y + h > vh - pad) {
      top = y - h - gap
    }
    top = Math.max(pad, Math.min(top, vh - pad - h))

    setPos((prev) =>
      prev.left === left && prev.top === top ? prev : { left, top },
    )
  }, [open, x, y, width, children])

  if (!open) return null
  if (typeof document === "undefined") return null

  return createPortal(
    <div
      ref={ref}
      className="fixed"
      data-ck-glass-menu=""
      style={{
        left: pos.left,
        top: pos.top,
        zIndex,
        width: typeof width === "number" ? width : width,
      }}
    >
      <LiquidGlass
        className={cn(
          "w-full !rounded-2xl !bg-[rgba(18,18,20,0.88)] !p-0 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.55)]",
          className,
        )}
        blur={14}
        saturation={1.1}
      >
        <div
          role="menu"
          className="py-0"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          {children}
        </div>
      </LiquidGlass>
    </div>,
    document.body,
  )
}

export function GlassMenuItem({
  children,
  onClick,
  danger,
  muted,
  hint,
}: {
  children: React.ReactNode
  onClick?: () => void
  danger?: boolean
  muted?: boolean
  hint?: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] transition",
        danger
          ? "text-red-300/90 hover:bg-red-500/10"
          : muted
            ? "text-white/40"
            : "text-white/85 hover:bg-white/[0.08]",
      )}
      onMouseDown={(e) => {
        e.preventDefault()
        e.stopPropagation()
      }}
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
    >
      <span className="flex min-w-0 items-center gap-2.5 truncate">{children}</span>
      {hint != null && hint !== false ? (
        <span className="flex shrink-0 items-center text-[11px] text-white/35">
          {hint}
        </span>
      ) : null}
    </button>
  )
}

/** Submenu on hover — LiquidGlass flyout beside the parent item. */
export function GlassMenuSub({
  label,
  children,
  width = 200,
}: {
  label: React.ReactNode
  children: React.ReactNode
  width?: number
}) {
  const itemRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ left: 0, top: 0 })
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const openSub = () => {
    cancelClose()
    setOpen(true)
  }

  const closeSubSoon = () => {
    cancelClose()
    closeTimer.current = setTimeout(() => setOpen(false), 140)
  }

  useEffect(() => () => cancelClose(), [])

  useLayoutEffect(() => {
    if (!open || !itemRef.current) return
    const r = itemRef.current.getBoundingClientRect()
    const pad = 8
    const gap = 4
    const vh = window.innerHeight
    const vw = window.innerWidth
    let left = r.right + gap
    if (left + width > vw - pad) left = r.left - width - gap
    left = Math.max(pad, left)

    let top = r.top
    const estH = 280
    if (top + estH > vh - pad) top = Math.max(pad, vh - pad - estH)
    setPos({ left, top })
  }, [open, width, children])

  const flyout =
    open && typeof document !== "undefined"
      ? createPortal(
          <div
            className="fixed"
            data-ck-glass-menu=""
            style={{ left: pos.left, top: pos.top, zIndex: 520, width }}
            onMouseEnter={openSub}
            onMouseLeave={closeSubSoon}
          >
            <LiquidGlass
              className="w-full !rounded-2xl !bg-[rgba(18,18,20,0.88)] !p-0 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.55)]"
              blur={14}
              saturation={1.1}
            >
              <div
                role="menu"
                className="max-h-[min(50dvh,320px)] overflow-y-auto py-0"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
              >
                {children}
              </div>
            </LiquidGlass>
          </div>,
          document.body,
        )
      : null

  return (
    <div
      ref={itemRef}
      className="relative"
      onMouseEnter={openSub}
      onMouseLeave={closeSubSoon}
    >
      <button
        type="button"
        role="menuitem"
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-[13px] text-white/85 transition",
          open ? "bg-white/[0.08]" : "hover:bg-white/[0.08]",
        )}
        onMouseDown={(e) => {
          e.preventDefault()
          e.stopPropagation()
        }}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
      >
        <span className="flex min-w-0 items-center gap-2.5 truncate">{label}</span>
        <ChevronRight
          className="h-3.5 w-3.5 shrink-0 text-white/35"
          strokeWidth={1.75}
          aria-hidden
        />
      </button>
      {flyout}
    </div>
  )
}

export function GlassMenuSep() {
  return <div className="h-px w-full bg-white/[0.06]" />
}
