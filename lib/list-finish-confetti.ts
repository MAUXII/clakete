import confetti from "canvas-confetti"

/** Só tons de vermelho (marca + variando luminosidade / saturação). */
const COLORS = [
  "#FF0048",
  "#e60042",
  "#dc2626",
  "#b91c1c",
  "#991b1b",
  "#7f1d1d",
  "#f87171",
  "#fca5a5",
  "#fecdd3",
]

/**
 * Burst-style confetti tuned for finishing the new-list wizard (palette matches app accent).
 */
export function playListFinishConfetti() {
  const count = 220
  const defaults: confetti.Options = {
    origin: { y: 0.72 },
    colors: COLORS,
    zIndex: 10000,
    disableForReducedMotion: true,
  }

  const fire = (particleRatio: number, opts: Partial<confetti.Options>) => {
    void confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    })
  }

  fire(0.25, { spread: 26, startVelocity: 55 })
  window.setTimeout(() => {
    fire(0.2, { spread: 60 })
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 })
  }, 100)
  window.setTimeout(() => {
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 })
    fire(0.1, { spread: 120, startVelocity: 45 })
  }, 240)
}
