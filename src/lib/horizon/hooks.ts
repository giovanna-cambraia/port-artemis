"use client"

import { useEffect, useRef } from "react"
export function lerp(start: number, end: number, t: number) {
  return start + (end - start) * t
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function useMouseTracker(smoothing = 0.15) {
  const target = useRef({ x: 0, y: 0 })
  const smooth = useRef({ x: 0, y: 0 })
  const velocity = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (typeof window === "undefined") return
    target.current = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
    smooth.current = { ...target.current }

    let raf = 0
    const onMove = (e: PointerEvent) => {
      target.current.x = e.clientX
      target.current.y = e.clientY
    }

    const tick = () => {
      const prevX = smooth.current.x
      const prevY = smooth.current.y
      smooth.current.x = lerp(smooth.current.x, target.current.x, smoothing)
      smooth.current.y = lerp(smooth.current.y, target.current.y, smoothing)
      velocity.current.x = smooth.current.x - prevX
      velocity.current.y = smooth.current.y - prevY
      raf = requestAnimationFrame(tick)
    }

    window.addEventListener("pointermove", onMove, { passive: true })
    raf = requestAnimationFrame(tick)
    return () => {
      window.removeEventListener("pointermove", onMove)
      cancelAnimationFrame(raf)
    }
  }, [smoothing])

  return { target, smooth, velocity }
}

export function usePrefersReducedMotion() {
  const ref = useRef(false)
  useEffect(() => {
    if (typeof window === "undefined") return
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    ref.current = mq.matches
    const handler = () => (ref.current = mq.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])
  return ref
}
