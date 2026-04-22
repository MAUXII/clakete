import { useId } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
}

export function CtaCatalogGridBg({ className }: Props) {
  const safeId = useId().replace(/:/g, '')
  const patternId = `ctaCatalogGrid-${safeId}`

  return (
    <svg
      className={cn('block h-full w-full', className)}
      viewBox="0 0 1200 800"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <defs>
        <pattern
          id={patternId}
          width="48"
          height="48"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M48 0H0V48"
            stroke="white"
            strokeOpacity="0.40"
            strokeWidth="1.25"
          />
        </pattern>
      </defs>
      <rect width="1200" height="800" fill={`url(#${patternId})`} />
    </svg>
  )
}
