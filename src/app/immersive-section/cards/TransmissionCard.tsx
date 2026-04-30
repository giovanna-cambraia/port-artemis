"use client";

import { useEffect, useRef } from "react";
import "./TransmissionCard.css"

// ─── Transmission data types ─────────────────────────────────────────────
export interface TransmissionData {
  id: string;
  signal: string;
  coords: string;
  redactedCoords?: boolean;
  title: string;
  redactedTitle?: boolean;
  status: string;
  body: React.ReactNode;
}

// ─── HUD corner SVG ───────────────────────────────────────────────────────
function HudCorner() {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      style={{ width: "100%", height: "100%" }}
    >
      <path
        d="M1 14 L1 1 L14 1"
        stroke="rgba(240,236,228,0.2)"
        strokeWidth="1"
      />
    </svg>
  );
}

// ─── Single transmission card ─────────────────────────────────────────────
export function TransmissionCard({
  data,
  active,
  currentIdx,
  total,
}: {
  data: TransmissionData;
  active: boolean;
  currentIdx: number;
  total: number;
}) {
  const titleRef = useRef<HTMLDivElement>(null);
  const prevActive = useRef(false);

  useEffect(() => {
    if (active && !prevActive.current && titleRef.current) {
      titleRef.current.classList.remove("tx-glitch");
      void titleRef.current.offsetWidth;
      titleRef.current.classList.add("tx-glitch");
    }
    prevActive.current = active;
  }, [active]);

  return (
    <div
      className="tx-panel"
      style={{
        opacity: active ? 1 : 0,
        transition: "opacity 0.2s ease",
        position: "absolute",
      }}
    >
      <div className="tx-label-top">Intercepted Signal — Personal Archive</div>

      <div className="tx-inner">
        {/* hud corners */}
        <div className="hud-corner hud-tl">
          <HudCorner />
        </div>
        <div className="hud-corner hud-tr">
          <HudCorner />
        </div>
        <div className="hud-corner hud-bl">
          <HudCorner />
        </div>
        <div className="hud-corner hud-br">
          <HudCorner />
        </div>

        <div className="tx-torn-edge" />

        <div className="tx-meta">
          <span className="sig-id">{data.signal}</span>
          <span>
            {data.redactedCoords ? (
              <span className="tx-redacted">{data.coords}</span>
            ) : (
              data.coords
            )}
          </span>
        </div>

        <div
          className="tx-title"
          ref={titleRef}
          style={data.redactedTitle ? { color: "transparent" } : {}}
        >
          {data.redactedTitle ? (
            <span className="tx-redacted">{data.title}</span>
          ) : (
            data.title
          )}
        </div>

        <div className="tx-body">{data.body}</div>

        <div className="tx-footer">
          <span className="tx-status">
            <span className="tx-blink" />
            {data.status}
          </span>
          <span className="tx-num">{data.id}</span>
        </div>

        <div className="tx-dots">
          {Array.from({ length: total }).map((_, i) => (
            <div
              key={i}
              className={`tx-dot ${i === currentIdx ? "active" : ""}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
