"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "motion/react";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";

/**
 * Magnetic Tabs — Rauno Freiberg craft.
 *
 * Pill indicator magnetically attracted to hovered tab.
 * Soft spring on hover, snappier overshoot on selection.
 * SND select on change.
 */

/* ── Types ── */

export interface MagneticTabItem {
  value: string;
  label: string;
  /** Contagem estilo notificação ao lado do label. */
  badge?: number | string;
  content?: React.ReactNode;
}

interface MagneticTabsProps {
  items?: MagneticTabItem[];
  defaultValue?: string;
  onChange?: (value: string) => void;
  /** Controlled active tab (Next.js routes). */
  value?: string;
  sound?: boolean;
  className?: string;
  /** Tabs mais altas / padding generoso. */
  size?: "md" | "lg";
  /** Se false, o conteúdo fica solto (sem painel com borda/fundo). */
  contentBoxed?: boolean;
  /** Barra translúcida com blur forte (atmosfera por baixo). */
  glass?: boolean;
}

/* ── CSS ── */

const CSS = `.mt{--mt-bg:rgba(30,30,32,.82);--mt-border:rgba(255,255,255,.06);--mt-shadow:0 0 0 .5px rgba(255,255,255,.04),0 2px 4px rgba(0,0,0,.2),0 8px 24px rgba(0,0,0,.3);--mt-pill:rgba(255,255,255,.08);--mt-text:rgba(255,255,255,.45);--mt-text-active:rgba(255,255,255,.9);--mt-content-bg:rgba(255,255,255,.03);--mt-content-border:rgba(255,255,255,.06)}html.light[data-lt-chrome="flat"] .mt{--mt-bg:rgba(255,255,255,.72);--mt-border:rgba(0,0,0,.06);--mt-shadow:0 0 0 .5px rgba(0,0,0,.04),0 2px 4px rgba(0,0,0,.04),0 8px 24px rgba(0,0,0,.06);--mt-pill:rgba(0,0,0,.06);--mt-text:rgba(0,0,0,.5);--mt-text-active:rgba(0,0,0,.9);--mt-content-bg:rgba(0,0,0,.02);--mt-content-border:rgba(0,0,0,.06)}.mt.mt-glass{--mt-bg:rgba(255,255,255,.07);--mt-border:rgba(255,255,255,.14);--mt-shadow:0 0 0 .5px rgba(255,255,255,.06),0 8px 32px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.12);--mt-pill:rgba(255,255,255,.14);--mt-text:rgba(255,255,255,.48);--mt-text-active:rgba(255,255,255,.95);--mt-blur:40px;--mt-sat:1.45}html.light[data-lt-chrome="flat"] .mt.mt-glass{--mt-bg:rgba(255,255,255,.78);--mt-border:rgba(0,0,0,.08);--mt-shadow:0 0 0 .5px rgba(0,0,0,.04),0 8px 24px rgba(0,0,0,.08);--mt-pill:rgba(0,0,0,.07);--mt-text:rgba(0,0,0,.48);--mt-text-active:rgba(0,0,0,.92);--mt-blur:28px;--mt-sat:1.1}.mt.mt-glass .mt-bar{isolation:isolate}.mt.mt-glass .mt-pill{box-shadow:inset 0 1px 0 rgba(255,255,255,.18),0 1px 8px rgba(0,0,0,.15);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}html.light[data-lt-chrome="flat"] .mt.mt-glass .mt-pill{box-shadow:inset 0 1px 0 rgba(255,255,255,.6),0 1px 6px rgba(0,0,0,.06)}.mt-scroll-track::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}.mt-scroll-track{-ms-overflow-style:none!important;scrollbar-width:none!important}`;

/* ── Constants ── */

const HOVER_SPRING = { type: "spring" as const, stiffness: 300, damping: 25 };
const SELECT_SPRING = { type: "spring" as const, stiffness: 500, damping: 22 };
const CONTENT_SPRING = {
  type: "spring" as const,
  stiffness: 250,
  damping: 25,
};

/* ── Component ── */

export function MagneticTabs({
  items = [
    {
      value: "overview",
      label: "Overview",
      content: "Overview content here.",
    },
    {
      value: "activity",
      label: "Activity",
      content: "Activity content here.",
    },
    {
      value: "settings",
      label: "Settings",
      content: "Settings content here.",
    },
    { value: "faq", label: "FAQ", content: "FAQ content here." },
  ],
  defaultValue,
  value: valueProp,
  onChange,
  sound = false,
  className,
  size = "md",
  contentBoxed = true,
  glass = false,
}: MagneticTabsProps) {
  const [uncontrolled, setUncontrolled] = useState(
    defaultValue || items[0]?.value || "",
  );
  const active = valueProp ?? uncontrolled;
  const [hovered, setHovered] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const barRef = useRef<HTMLDivElement | null>(null);
  const measured = useRef(false);
  const selectTimer = useRef<ReturnType<typeof setTimeout>>();

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isPointerDown = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const hasDragged = useRef(false);
  const [isDraggingState, setIsDraggingState] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(maxScroll > 4 && el.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);
    return () => {
      el.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState, items]);

  const pillX = useMotionValue(0);
  const pillW = useMotionValue(0);
  const springConfig = selectMode ? SELECT_SPRING : HOVER_SPRING;
  const springX = useSpring(pillX, springConfig);
  const springW = useSpring(pillW, springConfig);

  // md: slightly taller for catalog subnav (discover/popular) — Y only
  const tabPad = size === "lg" ? "12px 20px" : "10px 18px";
  const tabFs = size === "lg" ? 15 : 14;
  const barPad = size === "lg" ? 5 : 4;
  const barRadius = size === "lg" ? 16 : 14;
  const pillRadius = size === "lg" ? 12 : 10;

  const movePill = useCallback(
    (value: string) => {
      const bar = barRef.current;
      if (!bar) return;
      const idx = items.findIndex((t) => t.value === value);
      const btn = tabRefs.current[idx];
      if (!btn) return;
      // Use offsetLeft/offsetWidth — immune to ancestor CSS transforms (e.g. scale)
      const x = btn.offsetLeft;
      const w = btn.offsetWidth;
      if (!measured.current) {
        pillX.jump(x);
        pillW.jump(w);
        measured.current = true;
      } else {
        pillX.set(x);
        pillW.set(w);
      }
    },
    [items, pillX, pillW],
  );

  useEffect(() => {
    movePill(hovered || active);
    const ro = new ResizeObserver(() => movePill(hovered || active));
    if (barRef.current) ro.observe(barRef.current);
    return () => ro.disconnect();
  }, [active, hovered, movePill]);

  const go = useCallback(
    (value: string) => {
      if (value === active) return;
      setSelectMode(true);
      if (valueProp == null) setUncontrolled(value);
      onChange?.(value);
      clearTimeout(selectTimer.current);
      selectTimer.current = setTimeout(() => setSelectMode(false), 300);
    },
    [active, onChange, valueProp],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    if (e.button !== 0) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    isPointerDown.current = true;
    startX.current = e.clientX;
    startScrollLeft.current = container.scrollLeft;
    hasDragged.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !isPointerDown.current) return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const deltaX = e.clientX - startX.current;
    if (!hasDragged.current && Math.abs(deltaX) > 4) {
      hasDragged.current = true;
      setIsDraggingState(true);
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {}
    }

    if (hasDragged.current) {
      container.scrollLeft = startScrollLeft.current - deltaX;
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || !isPointerDown.current) return;
    isPointerDown.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    if (hasDragged.current) {
      setTimeout(() => {
        hasDragged.current = false;
        setIsDraggingState(false);
      }, 50);
    } else {
      setIsDraggingState(false);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    isPointerDown.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    hasDragged.current = false;
    setIsDraggingState(false);
  };

  useEffect(() => {
    const idx = items.findIndex((t) => t.value === active);
    const btn = tabRefs.current[idx];
    const container = scrollContainerRef.current;
    if (btn && container) {
      const btnLeft = btn.offsetLeft;
      const btnRight = btnLeft + btn.offsetWidth;
      if (btnLeft < container.scrollLeft) {
        container.scrollTo({ left: Math.max(0, btnLeft - 16), behavior: "smooth" });
      } else if (btnRight > container.scrollLeft + container.clientWidth) {
        container.scrollTo({
          left: btnRight - container.clientWidth + 16,
          behavior: "smooth",
        });
      }
    }
    updateScrollState();
  }, [active, items, updateScrollState]);

  const activeItem = items.find((t) => t.value === active);

  const tabBar = (
    <div
      ref={barRef}
      className="mt-bar"
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        padding: barPad,
        background: glass ? "transparent" : "var(--mt-bg)",
        border: glass ? "none" : "1px solid var(--mt-border)",
        boxShadow: glass ? "none" : "var(--mt-shadow)",
        borderRadius: barRadius,
        backdropFilter: glass ? undefined : "blur(16px)",
        WebkitBackdropFilter: glass ? undefined : "blur(16px)",
      }}
      onMouseLeave={() => setHovered(null)}
    >
      <motion.div
        className="mt-pill"
        style={{
          position: "absolute",
          top: barPad,
          left: 0,
          height: `calc(100% - ${barPad * 2}px)`,
          x: springX,
          width: springW,
          background: glass ? "rgba(255,255,255,.16)" : "var(--mt-pill)",
          borderRadius: pillRadius,
          pointerEvents: "none",
          zIndex: 0,
          boxShadow: glass
            ? "inset 0 1px 0 rgba(255,255,255,.22)"
            : undefined,
        }}
      />

      {items.map((item, i) => (
        <button
          key={item.value}
          type="button"
          ref={(el) => {
            tabRefs.current[i] = el;
          }}
          onClick={() => {
            if (hasDragged.current) return;
            go(item.value);
          }}
          onMouseEnter={() => {
            if (hasDragged.current) return;
            setSelectMode(false);
            clearTimeout(selectTimer.current);
            setHovered(item.value);
          }}
          style={{
            position: "relative",
            zIndex: 1,
            border: "none",
            background: "none",
            padding: tabPad,
            fontSize: tabFs,
            fontWeight: 500,
            fontFamily: "inherit",
            color: glass
              ? active === item.value
                ? "rgba(255,255,255,.95)"
                : "rgba(255,255,255,.48)"
              : active === item.value
                ? "var(--mt-text-active)"
                : "var(--mt-text)",
            cursor: "pointer",
            whiteSpace: "nowrap",
            lineHeight: 1,
            transition: "color .15s ease",
            borderRadius: pillRadius,
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            boxSizing: "border-box",
            minHeight: size === "lg" ? 44 : undefined,
          }}
        >
          {item.label}
          {item.badge != null && item.badge !== "" ? (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 20,
                height: 20,
                padding: "0 6px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                background:
                  active === item.value
                    ? "rgba(255,255,255,.16)"
                    : "rgba(255,255,255,.08)",
                color:
                  active === item.value
                    ? "rgba(255,255,255,.92)"
                    : "rgba(255,255,255,.5)",
              }}
            >
              {item.badge}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );

  return (
    <div className={`mt${glass ? " mt-glass" : ""}${className ? ` ${className}` : ""}`}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="relative w-full max-w-full">
        <div
          ref={scrollContainerRef}
          className="mt-scroll-track w-full max-w-full overflow-x-auto select-none"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
            touchAction: "pan-x",
            cursor: isDraggingState ? "grabbing" : undefined,
            paddingBottom: 2,
            maskImage:
              canScrollLeft && canScrollRight
                ? "linear-gradient(to right, transparent 0%, black 28px, black calc(100% - 36px), transparent 100%)"
                : canScrollRight
                ? "linear-gradient(to right, black 0%, black calc(100% - 36px), transparent 100%)"
                : canScrollLeft
                ? "linear-gradient(to right, transparent 0%, black 28px, black 100%)"
                : undefined,
            WebkitMaskImage:
              canScrollLeft && canScrollRight
                ? "linear-gradient(to right, transparent 0%, black 28px, black calc(100% - 36px), transparent 100%)"
                : canScrollRight
                ? "linear-gradient(to right, black 0%, black calc(100% - 36px), transparent 100%)"
                : canScrollLeft
                ? "linear-gradient(to right, transparent 0%, black 28px, black 100%)"
                : undefined,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
        >
          <div className="inline-flex min-w-max">
            {glass ? (
              <LiquidGlass
                className="inline-flex !rounded-[16px] bg-white/[0.06]"
                style={{ borderRadius: barRadius }}
                blur={3}
                refraction={18}
                bezel={0.38}
                saturation={1.35}
              >
                {tabBar}
              </LiquidGlass>
            ) : (
              tabBar
            )}
          </div>
        </div>

        {/* Blur sutil na borda direita quando há mais tabs */}
        <div
          aria-hidden
          className={`pointer-events-none absolute right-0 top-0 bottom-0 z-10 w-10 transition-opacity duration-300 backdrop-blur-[2px] ${
            canScrollRight ? "opacity-100" : "opacity-0"
          }`}
          style={{
            maskImage: "linear-gradient(to left, black 20%, transparent)",
            WebkitMaskImage: "linear-gradient(to left, black 20%, transparent)",
          }}
        />

        {/* Blur sutil na borda esquerda quando scrollado */}
        <div
          aria-hidden
          className={`pointer-events-none absolute left-0 top-0 bottom-0 z-10 w-10 transition-opacity duration-300 backdrop-blur-[2px] ${
            canScrollLeft ? "opacity-100" : "opacity-0"
          }`}
          style={{
            maskImage: "linear-gradient(to right, black 20%, transparent)",
            WebkitMaskImage: "linear-gradient(to right, black 20%, transparent)",
          }}
        />
      </div>

      {activeItem?.content != null && (
        <div style={{ position: "relative", marginTop: 20, minHeight: 60 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={CONTENT_SPRING}
              style={
                contentBoxed
                  ? {
                      padding: 20,
                      background: "var(--mt-content-bg)",
                      border: "1px solid var(--mt-content-border)",
                      borderRadius: 12,
                      color: "var(--mt-text-active)",
                      fontSize: 14,
                      lineHeight: 1.6,
                    }
                  : {
                      color: "var(--mt-text-active)",
                      fontSize: 14,
                      lineHeight: 1.6,
                    }
              }
            >
              {activeItem.content}
            </motion.div>
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

export default MagneticTabs;
