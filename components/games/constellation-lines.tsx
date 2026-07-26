"use client"

type Line = {
  x1: number
  y1: number
  x2: number
  y2: number
}

export function ConstellationLines({ lines }: { lines: Line[] }) {
  if (lines.length === 0) return null

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    >
      {lines.map((line, i) => (
        <g key={i}>
          <line
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
            stroke="hsl(var(--brand) / 0.55)"
            strokeWidth={2}
            strokeLinecap="round"
          />
          <circle
            cx={line.x2}
            cy={line.y2}
            r={3.5}
            fill="hsl(var(--brand))"
          />
        </g>
      ))}
    </svg>
  )
}
