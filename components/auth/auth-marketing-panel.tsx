'use client'

import { useEffect, useState, type ComponentType } from 'react'
import Image from 'next/image'
import CinematicBackground from '@/components/CinematicBackground'
import { testimonials } from '@/app/data/testimonial'
import { generateAvatar } from '@/app/utils/avatar-generator'
import { Skeleton } from '@/components/ui/skeleton'

type RivePanelProps = { className?: string }

export function AuthMarketingPanel({
  RiveComponent,
}: {
  RiveComponent: ComponentType<RivePanelProps>
}) {
  const [currentTestimonial, setCurrentTestimonial] = useState(testimonials[0])
  const [imageLoading, setImageLoading] = useState(true)

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * testimonials.length)
    setCurrentTestimonial(testimonials[randomIndex])
  }, [])

  useEffect(() => {
    let mounted = true

    const loadAvatar = async () => {
      try {
        const url = await generateAvatar(currentTestimonial.avatarSeed)
        if (mounted && url.includes('dicebear')) {
          setImageLoading(false)
        }
      } catch {
        if (mounted) setImageLoading(false)
      }
    }

    void loadAvatar()
    return () => {
      mounted = false
    }
  }, [currentTestimonial])

  return (
    <section
      className="relative hidden h-full w-1/2 items-center justify-center overflow-clip rounded-3xl border border-muted/80 lg:flex"
      aria-hidden
    >
      <CinematicBackground fillParent />
      <div className="absolute inset-0 z-[1] bg-white/20 dark:bg-[#090909]/60" />
      <div className="absolute left-16 top-16 z-30 w-full max-w-[620px]">
        <svg
          width="74"
          height="64"
          viewBox="0 0 74 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden
        >
          <path
            d="M58.3154 0.782651H73.3025L58.1087 32.4106H73.3025V63.3151H42.398V32.4106L58.3154 0.782651ZM16.7649 0.782651H31.8554L16.5582 32.4106H31.8554V63.3151H0.950938V32.4106L16.7649 0.782651Z"
            fill="#FF0048"
            fillOpacity="0.1"
          />
        </svg>
        <p className="-mt-6 ml-6 w-full max-w-[400px] text-2xl font-medium text-white lg:text-4xl xl:max-w-[500px]">
          {currentTestimonial.text}
        </p>
        <div className="mt-6 ml-6 flex items-center gap-2">
          <div className="relative">
            {imageLoading ? (
              <Skeleton className="h-12 w-12 rounded-full" />
            ) : (
              <Image
                src={generateAvatar(currentTestimonial.avatarSeed)}
                alt={`${currentTestimonial.author}'s avatar`}
                className="h-12 w-12 rounded-full object-cover"
                width={48}
                height={48}
                priority
              />
            )}
          </div>
          <p className="text-md text-muted-foreground">{currentTestimonial.author}</p>
        </div>
      </div>
      <div className="relative flex h-full w-full items-end justify-end">
        <RiveComponent className="absolute -bottom-28 -right-28 z-30 aspect-square w-[600px] md:w-[800px] lg:w-[900px]" />
      </div>
    </section>
  )
}
