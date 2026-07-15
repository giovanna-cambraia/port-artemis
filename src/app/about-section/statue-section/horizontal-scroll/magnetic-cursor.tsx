"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

export function MagneticCursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [label, setLabel] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    const xToRing = gsap.quickTo(ring, "x", {
      duration: 0.5,
      ease: "power3.out",
    });
    const yToRing = gsap.quickTo(ring, "y", {
      duration: 0.5,
      ease: "power3.out",
    });
    const xToDot = gsap.quickTo(dot, "x", {
      duration: 0.12,
      ease: "power3.out",
    });
    const yToDot = gsap.quickTo(dot, "y", {
      duration: 0.12,
      ease: "power3.out",
    });

    let last = { x: 0, y: 0 };
    let velX = 0;
    let velY = 0;

    const onMove = (e: PointerEvent) => {
      const { clientX: x, clientY: y } = e;
      velX = x - last.x;
      velY = y - last.y;
      last = { x, y };
      xToRing(x);
      yToRing(y);
      xToDot(x);
      yToDot(y);

      const speed = Math.min(Math.hypot(velX, velY), 90);
      const angle = (Math.atan2(velY, velX) * 180) / Math.PI;
      gsap.to(ring, {
        rotate: angle,
        scaleX: 1 + speed / 110,
        scaleY: 1 - speed / 260,
        duration: 0.4,
        ease: "power3.out",
        overwrite: "auto",
      });
    };

    const setHover = (active: boolean, text = "") => {
      setLabel(text);
      gsap.to(ring, {
        scale: active ? (text ? 2.6 : 1.9) : 1,
        borderColor: active ? "rgba(255,90,31,0.9)" : "rgba(244,239,233,0.55)",
        duration: 0.45,
        ease: "power3.out",
        overwrite: "auto",
      });
      gsap.to(dot, {
        scale: active ? 0 : 1,
        duration: 0.35,
        ease: "power3.out",
      });
    };

    const enter = (e: Event) => {
      const el = e.currentTarget as HTMLElement;
      setHover(true, el.dataset.cursor ?? "");
    };
    const leave = () => setHover(false);

    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(
        "[data-cursor], a, button, .hz-interactive",
      ),
    );
    targets.forEach((el) => {
      el.addEventListener("pointerenter", enter);
      el.addEventListener("pointerleave", leave);
    });

    window.addEventListener("pointermove", onMove, { passive: true });
    gsap.set([ring, dot], { xPercent: -50, yPercent: -50 });
    gsap.to([ring, dot], { autoAlpha: 1, duration: 0.6, delay: 0.3 });

    return () => {
      window.removeEventListener("pointermove", onMove);
      targets.forEach((el) => {
        el.removeEventListener("pointerenter", enter);
        el.removeEventListener("pointerleave", leave);
      });
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="hz-cursor-ring" aria-hidden="true">
        <span ref={labelRef} className="hz-cursor-label">
          {label}
        </span>
      </div>
      <div ref={dotRef} className="hz-cursor-dot" aria-hidden="true" />
    </>
  );
}
