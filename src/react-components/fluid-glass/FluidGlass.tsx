"use client"

import { useEffect, useRef, useState } from "react"

interface FluidGlassProps {
  children?: React.ReactNode
  intensity?: number
  blur?: number
  borderRadius?: number
  className?: string
}

export default function FluidGlass({
  children,
  intensity = 0.5,
  blur = 20,
  borderRadius = 24,
  className = "",
}: FluidGlassProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      setMousePos({
        x: (e.clientX - rect.left) / rect.width,
        y: (e.clientY - rect.top) / rect.height,
      })
    }

    container.addEventListener("mousemove", handleMouseMove)
    return () => container.removeEventListener("mousemove", handleMouseMove)
  }, [])

  const gradientX = mousePos.x * 100
  const gradientY = mousePos.y * 100

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ borderRadius }}
    >
      {/* Glass background */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(
              circle at ${gradientX}% ${gradientY}%,
              rgba(255, 255, 255, ${0.1 + intensity * 0.15}) 0%,
              rgba(255, 255, 255, ${0.05 + intensity * 0.05}) 40%,
              rgba(255, 255, 255, 0.02) 100%
            )
          `,
          backdropFilter: `blur(${blur}px)`,
          WebkitBackdropFilter: `blur(${blur}px)`,
        }}
      />

      {/* Refraction highlight */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(
              ellipse ${30 + intensity * 40}% ${20 + intensity * 30}% at ${gradientX}% ${gradientY}%,
              rgba(255, 255, 255, ${0.2 * intensity}) 0%,
              transparent 100%
            )
          `,
        }}
      />

      {/* Border glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius,
          boxShadow: `
            inset 0 0 0 1px rgba(255, 255, 255, ${0.1 + intensity * 0.1}),
            0 0 ${20 * intensity}px rgba(255, 255, 255, ${0.05 * intensity})
          `,
        }}
      />

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </div>
  )
}