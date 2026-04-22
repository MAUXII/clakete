'use client'

import Image from 'next/image'
import {
  HERO_NOISY_GRADIENT_COLORS,
  HERO_NOISY_GRADIENT_PARAMS,
  HERO_NOISY_PREVIEW_LOOP_SEC,
  hexToRgb01,
  seedToVec2,
} from '@/lib/noisyHeroGradient.config'
import {
  noisyHeroFragmentShader,
  noisyHeroVertexShader,
} from '@/lib/noisyHeroGradientShader'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import * as THREE from 'three'

function applyParamsToMaterial(
  material: THREE.ShaderMaterial,
  width: number,
  height: number,
  colorA: string,
  colorB: string
) {
  const p = HERO_NOISY_GRADIENT_PARAMS
  const [sx, sy] = seedToVec2(p.seed)
  const u = material.uniforms
  u.u_resolution.value.set(width, height)
  const [ar, ag, ab] = hexToRgb01(colorA)
  const [br, bg, bb] = hexToRgb01(colorB)
  u.u_colorA.value.set(ar, ag, ab)
  u.u_colorB.value.set(br, bg, bb)
  u.u_amplitude.value = p.amplitude
  u.u_scale.value = p.scale
  u.u_threshold.value = p.threshold
  u.u_softness.value = p.softness
  u.u_grain.value = p.grain
  u.u_seed.value.set(sx, sy)
  u.u_monochrome.value = p.monochrome ? 1 : 0
}

export type CinematicBackgroundProps = {
  colorA?: string
  colorB?: string
  /** Multiplica `HERO_NOISY_GRADIENT_PARAMS.speed`. */
  speed?: number
}

export default function CinematicBackground({
  colorA = HERO_NOISY_GRADIENT_COLORS.colorA,
  colorB = HERO_NOISY_GRADIENT_COLORS.colorB,
  speed = 1,
}: CinematicBackgroundProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [reducedMotion, setReducedMotion] = useState(false)

  useLayoutEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (reducedMotion) return

    const container = mountRef.current
    if (!container) return

    const scene = new THREE.Scene()
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 10)
    camera.position.z = 1

    const [sx, sy] = seedToVec2(HERO_NOISY_GRADIENT_PARAMS.seed)
    const [ar, ag, ab] = hexToRgb01(colorA)
    const [br, bg, bb] = hexToRgb01(colorB)

    const material = new THREE.ShaderMaterial({
      vertexShader: noisyHeroVertexShader,
      fragmentShader: noisyHeroFragmentShader,
      uniforms: {
        u_resolution: { value: new THREE.Vector2(1, 1) },
        u_phase: { value: 0 },
        u_colorA: { value: new THREE.Vector3(ar, ag, ab) },
        u_colorB: { value: new THREE.Vector3(br, bg, bb) },
        u_amplitude: { value: HERO_NOISY_GRADIENT_PARAMS.amplitude },
        u_scale: { value: HERO_NOISY_GRADIENT_PARAMS.scale },
        u_threshold: { value: HERO_NOISY_GRADIENT_PARAMS.threshold },
        u_softness: { value: HERO_NOISY_GRADIENT_PARAMS.softness },
        u_grain: { value: HERO_NOISY_GRADIENT_PARAMS.grain },
        u_seed: { value: new THREE.Vector2(sx, sy) },
        u_monochrome: { value: HERO_NOISY_GRADIENT_PARAMS.monochrome ? 1 : 0 },
      },
      depthTest: false,
      depthWrite: false,
      toneMapped: false,
    })

    const geometry = new THREE.PlaneGeometry(2, 2)
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    const clear = new THREE.Color(colorB)
    const renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: false,
      powerPreference: 'high-performance',
    })
    renderer.setClearColor(clear, 1)

    const maxDpr = 2
    const resize = () => {
      const rect = container.getBoundingClientRect()
      const w = Math.max(
        1,
        Math.floor(rect.width || window.innerWidth)
      )
      const h = Math.max(1, Math.floor(rect.height))
      const pr = Math.min(window.devicePixelRatio || 1, maxDpr)
      renderer.setPixelRatio(pr)
      renderer.setSize(w, h, false)
      applyParamsToMaterial(
        material,
        renderer.domElement.width,
        renderer.domElement.height,
        colorA,
        colorB
      )
    }
    resize()

    const canvas = renderer.domElement
    canvas.style.cssText =
      'display:block;width:100%;height:100%;max-width:100%;touch-action:none'
    container.appendChild(canvas)

    const ro = new ResizeObserver(resize)
    ro.observe(container)

    const startTime = performance.now()
    let rafId = 0

    const tick = () => {
      rafId = requestAnimationFrame(tick)
      if (document.hidden) return

      const elapsed = (performance.now() - startTime) / 1000
      const spd = HERO_NOISY_GRADIENT_PARAMS.speed * speed
      const raw = (elapsed * spd) / HERO_NOISY_PREVIEW_LOOP_SEC
      material.uniforms.u_phase.value = raw - Math.floor(raw)

      applyParamsToMaterial(
        material,
        renderer.domElement.width,
        renderer.domElement.height,
        colorA,
        colorB
      )
      renderer.render(scene, camera)
    }
    rafId = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      if (canvas.parentNode === container) {
        container.removeChild(canvas)
      }
      geometry.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [reducedMotion, colorA, colorB, speed])

  return (
    <div className="pointer-events-none absolute top-0 bottom-0 left-1/2 z-0 h-full min-h-0 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden">
      <div
        ref={mountRef}
        className="absolute inset-0 z-0 h-full min-h-0 w-full bg-[#09091B]"
      >
     
      </div>
     
     
    
    </div>
  )
}
