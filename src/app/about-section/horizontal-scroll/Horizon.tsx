"use client"

import { useEffect, useRef, useState } from "react"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { HORIZON_CONFIG, SECTIONS } from "../../../lib/horizon/config"
import { MagneticCursor } from "./magnetic-cursor"
import "./Horizon.css"

gsap.registerPlugin(ScrollTrigger)

const MANIFESTO =
  "In a world shaped by velocity and precision, we engineer the next generation of digital experience — where data, intuition and craft converge into living systems."

const ARCH_CARDS = [
  { i: "A1", t: "Spatial Systems", d: "Interfaces that behave like architecture — engineered, layered, dimensional." },
  { i: "A2", t: "Motion Logic", d: "Every transition carries weight, momentum and intent. Nothing simply appears." },
  { i: "A3", t: "Atmospheric Depth", d: "Light, fog and parallax build a world you travel through, not scroll past." },
  { i: "A4", t: "Living Type", d: "Typography reacts to velocity and rhythm, becoming the hero of the scene." },
  { i: "A5", t: "Interaction Field", d: "A magnetic, context-aware cursor turns the surface into a tactile instrument." },
  { i: "A6", t: "Cinematic Pacing", d: "Arrival, discovery, expansion, revelation — the journey is composed, not stacked." },
]

export function Horizon() {
  const rootRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLSpanElement>(null)
  const counterRef = useRef<HTMLElement>(null)
  const [scene, setScene] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const root = rootRef.current
    const track = trackRef.current
    if (!root || !track) return

    const mm = gsap.matchMedia()

    mm.add(
      {
        motion: "(prefers-reduced-motion: no-preference)",
        reduced: "(prefers-reduced-motion: reduce)",
        desktop: "(min-width: 901px)",
      },
      (ctx) => {
        const { reduced } = ctx.conditions as { reduced: boolean }
        const sections = gsap.utils.toArray<HTMLElement>(".hz-section")

        const getDistance = () => track.scrollWidth - window.innerWidth

        // ---- master horizontal tween ----
        const scrollTween = gsap.to(track, {
          x: () => -getDistance(),
          ease: "none",
          scrollTrigger: {
            trigger: root,
            start: "top top",
            end: () => `+=${getDistance() * HORIZON_CONFIG.scroll.endMultiplier}`,
            pin: true,
            scrub: reduced ? true : HORIZON_CONFIG.scroll.scrub,
            anticipatePin: HORIZON_CONFIG.scroll.anticipatePin,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (progressRef.current)
                progressRef.current.style.transform = `scaleX(${self.progress})`
              if (counterRef.current)
                counterRef.current.textContent = String(Math.round(self.progress * 100)).padStart(2, "0")
              const idx = Math.min(
                sections.length - 1,
                Math.round(self.progress * (sections.length - 1)),
              )
              setScene(idx)

              // velocity-driven skew
              if (!reduced) {
                const v = self.getVelocity()
                const skew = gsap.utils.clamp(
                  -HORIZON_CONFIG.velocity.maxSkew,
                  HORIZON_CONFIG.velocity.maxSkew,
                  v * HORIZON_CONFIG.velocity.skewFactor,
                )
                gsap.to(track, {
                  skewX: skew,
                  duration: 0.4,
                  ease: "power3.out",
                  overwrite: "auto",
                })
              }
            },
          },
        })

        if (reduced) {
          setReady(true)
          return
        }

        // ---- depth parallax per layer ----
        gsap.utils.toArray<HTMLElement>(".hz-layer[data-depth]").forEach((layer) => {
          const depth = parseFloat(layer.dataset.depth ?? "0")
          gsap.fromTo(
            layer,
            { xPercent: depth * 28 },
            {
              xPercent: -depth * 28,
              ease: "none",
              scrollTrigger: {
                trigger: layer.closest(".hz-section"),
                containerAnimation: scrollTween,
                start: "left right",
                end: "right left",
                scrub: true,
              },
            },
          )
        })

        // ---- floating dust (arrival) ----
        gsap.utils.toArray<HTMLElement>(".hz-dust").forEach((d, i) => {
          gsap.to(d, {
            y: gsap.utils.random(-40, 40),
            x: gsap.utils.random(-30, 30),
            duration: gsap.utils.random(3, 6),
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: i * 0.2,
          })
        })

        // ---- arrival title chars ----
        const arrivalChars = gsap.utils.toArray<HTMLElement>(".hz-arrival-title .hz-char")
        gsap.from(arrivalChars, {
          yPercent: 120,
          opacity: 0,
          rotateX: -80,
          stagger: 0.05,
          duration: 1.1,
          ease: "power4.out",
          delay: 0.6,
        })

        // ---- dimension floating shapes ----
        gsap.utils.toArray<HTMLElement>(".hz-float-shape").forEach((s, i) => {
          gsap.to(s, {
            yPercent: gsap.utils.random(-30, 30),
            rotate: gsap.utils.random(-25, 25),
            duration: gsap.utils.random(4, 8),
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
            delay: i * 0.3,
          })
        })

        // ---- manifesto word reveal driven by horizontal scroll ----
        const words = gsap.utils.toArray<HTMLElement>(".hz-manifesto-text .hz-word")
        const manifestoSection = document.querySelector(".hz-manifesto")
        if (words.length && manifestoSection) {
          gsap.to(words, {
            color: "rgba(244,239,233,0.95)",
            stagger: 1,
            ease: "none",
            scrollTrigger: {
              trigger: manifestoSection,
              containerAnimation: scrollTween,
              start: "left center",
              end: "center center",
              scrub: true,
              onUpdate: (self) => {
                const fill = document.querySelector<HTMLElement>(".hz-manifesto-progress span")
                if (fill) fill.style.transform = `scaleX(${self.progress})`
              },
            },
          })
        }

        // ---- architecture cards build-in (3D) ----
        const cards = gsap.utils.toArray<HTMLElement>(".hz-card")
        const archSection = document.querySelector(".hz-architecture")
        if (cards.length && archSection) {
          gsap.from(cards, {
            yPercent: 24,
            opacity: 0,
            rotateY: -22,
            z: -160,
            stagger: 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: archSection,
              containerAnimation: scrollTween,
              start: "left center",
              end: "center center",
              scrub: 1,
            },
          })
        }

        // ---- revelation finale ----
        const revSection = document.querySelector(".hz-revelation")
        if (revSection) {
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: revSection,
              containerAnimation: scrollTween,
              start: "left right",
              end: "right left",
              scrub: 1,
            },
          })
          tl.fromTo(
            ".hz-revelation-title",
            { scale: 0.7, opacity: 0.2, letterSpacing: "0.2em" },
            { scale: 1, opacity: 1, letterSpacing: "-0.02em", ease: "power2.out" },
          )
            .fromTo(
              ".hz-converge",
              { scaleY: 0, opacity: 0 },
              { scaleY: 1, opacity: 1, stagger: 0.04, ease: "power2.out" },
              0,
            )
            .fromTo(
              ".hz-revelation-sub",
              { y: 40, opacity: 0 },
              { y: 0, opacity: 1, ease: "power2.out" },
              0.3,
            )
        }

        setReady(true)
      },
    )

    // ---- card cursor glow ----
    const onCardMove = (e: PointerEvent) => {
      const card = (e.target as HTMLElement).closest<HTMLElement>(".hz-card")
      if (!card) return
      const r = card.getBoundingClientRect()
      card.style.setProperty("--mx", `${((e.clientX - r.left) / r.width) * 100}%`)
      card.style.setProperty("--my", `${((e.clientY - r.top) / r.height) * 100}%`)
    }
    root.addEventListener("pointermove", onCardMove)

    return () => {
      root.removeEventListener("pointermove", onCardMove)
      mm.revert()
    }
  }, [])

  const splitChars = (text: string) =>
    text.split("").map((c, i) => (
      <span className="hz-char" key={i}>
        {c === " " ? "\u00A0" : c}
      </span>
    ))

  return (
    <div className="hz" ref={rootRef}>
      <MagneticCursor />

      {/* HUD */}
      <div className="hz-progress" aria-hidden="true">
        <span ref={progressRef} />
      </div>
      <div className="hz-vignette" aria-hidden="true" />

      {!ready && (
        <div className="hz-intro-overlay" aria-hidden="true">
          Loading the system
        </div>
      )}

      <div className="hz-hud">
        <div className="hz-hud-scene">
          <span>
            Scene <b>{SECTIONS[scene].id}</b> / 05
          </span>
          <span>{SECTIONS[scene].tag}</span>
        </div>
        <div className="hz-hud-counter">
          <strong ref={counterRef}>00</strong>
          <span>% traversed</span>
        </div>
      </div>

      <div className="hz-viewport">
        <div className="hz-track" ref={trackRef}>
          {/* ---------- 01 ARRIVAL ---------- */}
          <section className="hz-section hz-arrival hz-section--wide" aria-label="Arrival">
            <div className="hz-layer hz-atmosphere" data-depth={HORIZON_CONFIG.depth.background} />
            <div className="hz-beam hz-layer" data-depth={HORIZON_CONFIG.depth.background} />
            <div className="hz-layer" data-depth={HORIZON_CONFIG.depth.midground} aria-hidden="true">
              {Array.from({ length: 18 }).map((_, i) => (
                <span
                  key={i}
                  className="hz-dust"
                  style={{ left: `${(i * 53) % 100}%`, top: `${(i * 37) % 100}%` }}
                />
              ))}
            </div>
            <div className="hz-layer--content">
              <p className="hz-kicker" style={{ justifyContent: "center", display: "flex" }}>
                01 — Arrival
              </p>
              <h1 className="hz-display hz-arrival-title">{splitChars("HORIZON")}</h1>
              <span className="hz-enter-hint hz-kicker" style={{ justifyContent: "center", display: "flex" }}>
                Enter the system — scroll to travel
              </span>
            </div>
            <div className="hz-grain" />
          </section>

          {/* ---------- 02 DIMENSION ---------- */}
          <section className="hz-section hz-dimension hz-section--wide" aria-label="Dimension shift">
            <div className="hz-layer hz-perspective-grid" data-depth={HORIZON_CONFIG.depth.background} />
            <div className="hz-layer" data-depth={HORIZON_CONFIG.depth.midground} aria-hidden="true">
              <div className="hz-float-shape" style={{ width: "16vw", height: "16vw", top: "14%", left: "10%" }} />
              <div className="hz-float-shape" style={{ width: "9vw", height: "9vw", bottom: "16%", right: "14%", borderRadius: "50%" }} />
              <div className="hz-float-shape" style={{ width: "12vw", height: "12vw", top: "50%", right: "30%" }} />
            </div>
            <div className="hz-layer--content">
              <p className="hz-kicker" style={{ justifyContent: "center", display: "flex" }}>
                02 — Dimension
              </p>
              <h2 className="hz-display hz-dimension-title">
                <span className="hz-reveal-line">BREAKING</span>
                <span className="hz-reveal-line hz-row-2">THE GRID</span>
              </h2>
            </div>
            <div className="hz-grain" />
          </section>

          {/* ---------- 03 MANIFESTO ---------- */}
          <section className="hz-section hz-manifesto hz-section--xwide" aria-label="Manifesto">
            <div className="hz-layer hz-atmosphere" data-depth={HORIZON_CONFIG.depth.background} />
            <div className="hz-layer--content">
              <div className="hz-manifesto-inner">
                <p className="hz-kicker">03 — Manifesto</p>
                <p className="hz-manifesto-text">
                  {MANIFESTO.split(" ").map((w, i) => {
                    const accent = ["engineer", "converge", "living"].includes(
                      w.replace(/[^a-z]/gi, "").toLowerCase(),
                    )
                    return (
                      <span key={i} className={`hz-word${accent ? " hz-accent-word" : ""}`}>
                        {w}
                        {"\u00A0"}
                      </span>
                    )
                  })}
                </p>
                <div className="hz-manifesto-progress">
                  <span />
                </div>
              </div>
            </div>
            <div className="hz-grain" />
          </section>

          {/* ---------- 04 ARCHITECTURE ---------- */}
          <section className="hz-section hz-architecture hz-section--xwide" aria-label="Architecture">
            <div className="hz-layer hz-atmosphere" data-depth={HORIZON_CONFIG.depth.background} />
            <div className="hz-layer--content" style={{ display: "flex", justifyContent: "center" }}>
              <div className="hz-arch-grid">
                <div className="hz-arch-head">
                  <h2>
                    Building
                    <br />
                    the future
                  </h2>
                  <p className="hz-kicker">04 — Architecture</p>
                </div>
                {ARCH_CARDS.map((c) => (
                  <article className="hz-card hz-interactive" key={c.i} data-cursor="explore">
                    <span className="hz-card-index">{c.i}</span>
                    <h3 className="hz-card-title">{c.t}</h3>
                    <p className="hz-card-desc">{c.d}</p>
                  </article>
                ))}
              </div>
            </div>
            <div className="hz-grain" />
          </section>

          {/* ---------- 05 REVELATION ---------- */}
          <section className="hz-section hz-revelation hz-section--wide" aria-label="Revelation">
            <div className="hz-layer hz-atmosphere" data-depth={HORIZON_CONFIG.depth.background} />
            <div className="hz-layer" aria-hidden="true">
              {Array.from({ length: 7 }).map((_, i) => (
                <span
                  key={i}
                  className="hz-converge"
                  style={{ rotate: `${(i - 3) * 26}deg` }}
                />
              ))}
            </div>
            <div className="hz-layer--content">
              <p className="hz-kicker" style={{ justifyContent: "center", display: "flex" }}>
                05 — Revelation
              </p>
              <h2 className="hz-display hz-revelation-title">THE FUTURE IS NOW</h2>
              <div className="hz-revelation-sub">
                <p className="hz-body">Where visions ignite and systems come alive.</p>
                <div className="hz-social">
                  <span data-cursor="open" className="hz-interactive">
                    Instagram
                  </span>
                  <span data-cursor="open" className="hz-interactive">
                    Behance
                  </span>
                  <span data-cursor="open" className="hz-interactive">
                    X / Twitter
                  </span>
                </div>
              </div>
            </div>
            <div className="hz-grain" />
          </section>
        </div>
      </div>
    </div>
  )
}

export default Horizon
