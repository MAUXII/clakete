"use client"

import Image from "next/image"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface HandWrittenTitleProps {
  /** Logo inside the circle (replaces text title). */
  logoSrc?: string
  logoAlt?: string
  /** Rendered below the circle — keeps the oval uncluttered. */
  subtitle?: string
  className?: string
  logoClassName?: string
  subtitleClassName?: string
  strokeClassName?: string
}

function HandWrittenTitle({
  logoSrc = "/claketeletters.svg",
  logoAlt = "clakete",
  subtitle,
  className,
  logoClassName,
  subtitleClassName,
  strokeClassName,
}: HandWrittenTitleProps) {
  const draw = {
    hidden: { pathLength: 0, opacity: 0 },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: 2.4, ease: [0.43, 0.13, 0.23, 0.96] },
        opacity: { duration: 0.5 },
      },
    },
  }

  return (
    <motion.div
      className={cn(
        "relative mx-auto flex w-full max-w-md flex-col items-center px-4",
        className,
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div className="relative flex w-full items-center justify-center">
        <motion.svg
          width="100%"
          viewBox="0 0 1200 600"
          initial="hidden"
          animate="visible"
          className="h-[min(52vw,280px)] w-full max-w-[320px] sm:max-w-[360px]"
          aria-hidden
        >
          <motion.path
            d="M 950 90 
               C 1250 300, 1050 480, 600 520
               C 250 520, 150 480, 150 300
               C 150 120, 350 80, 600 80
               C 850 80, 950 180, 950 180"
            fill="none"
            strokeWidth="9"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            variants={draw}
            className={cn("opacity-80", strokeClassName ?? "text-[#FF0048]")}
          />
        </motion.svg>

        <motion.div
          className="absolute inset-0 flex items-center justify-center px-10 sm:px-12"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.75, ease: "easeOut" }}
        >
          <Image
            src={logoSrc}
            alt={logoAlt}
            width={260}
            height={85}
            priority
            className={cn(
              "h-auto w-[min(200px,58vw)] max-w-[75%] object-contain",
              logoClassName,
            )}
          />
        </motion.div>
      </motion.div>

      {subtitle ? (
        <motion.p
          className={cn(
            "-mt-0 max-w-[min(100%,280px)] text-pretty text-center text-[11px] font-normal leading-relaxed text-zinc-500 sm:text-xs",
            subtitleClassName,
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.7 }}
        >
          {subtitle}
        </motion.p>
      ) : null}
    </motion.div>
  )
}

export { HandWrittenTitle }
