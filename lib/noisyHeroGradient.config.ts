/**
 * Ajuste aqui amplitude, escala, threshold, etc. (hero noisy gradient).
 * Cores padrão do produto: primária #FF0048, secundária #09090B.
 */
export const HERO_NOISY_GRADIENT_COLORS = {
  colorA: '#FF0048',
  colorB: '#09090B',
} as const

export const HERO_NOISY_GRADIENT_PARAMS = {
  amplitude: 1.17,
  /** Zoom do ruído (maior = padrão mais fino). */
  scale: 0.30,
  threshold: 0.33,
  softness: 0.26,
  grain: 0.58,
  seed: 42069,
  /** O shader usa 4 octavas fixas no GLSL; mantenha ≤ 4 ou ignore. */
  octaves: 4,
  /** Multiplicador de “velocidade” da fase (1 = um loop em PREVIEW_LOOP_SEC). */
  speed: 0.1,
  monochrome: false,
} as const

/** Duração de uma volta completa de fase (0→1), em segundos. */
export const HERO_NOISY_PREVIEW_LOOP_SEC = 22

export function hexToRgb01(hex: string): [number, number, number] {
  let h = hex.replace('#', '').trim()
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  }
  const n = parseInt(h, 16)
  if (Number.isNaN(n)) return [1, 0, 0.28]
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((x) => x / 255) as [
    number,
    number,
    number,
  ]
}

export function seedToVec2(seed: number): [number, number] {
  const fr = (n: number) => n - Math.floor(n)
  const x = fr(Math.sin(seed * 12.9898) * 43758.5453123)
  const y = fr(Math.cos(seed * 78.233) * 24634.6245123)
  return [x * 800 - 400, y * 800 - 400]
}
