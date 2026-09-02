"use client";

import { useTimer } from "../hooks/useTimer";
import { beepBlockEnd, beepSessionEnd } from "../lib/effects";
import { secondsToClock } from "./ui";
import type { SessionBlock } from "../lib/types";

const RADIUS = 120;
const STROKE = 12;
const CIRC = 2 * Math.PI * RADIUS;

function blockColor(block: SessionBlock | undefined): string {
  if (!block) return "#00d4ff";
  if (block.type === "rest") return "#22c55e";
  if (block.type === "warmup") return "#eab308";
  if (block.type === "cooldown") return "#a855f7";
  return "#00d4ff";
}

export default function Timer({ blocks }: { blocks: SessionBlock[] }) {
  const t = useTimer(blocks, {
    onBlockEnd: () => beepBlockEnd(),
    onSessionEnd: () => beepSessionEnd(),
  });

  const color = blockColor(t.current);
  const progress = t.total > 0 ? 1 - t.remaining / t.total : 0;
  const offset = CIRC * (1 - progress);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div
        className="font-display"
        style={{
          fontSize: 13,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color,
          textAlign: "center",
          minHeight: 20,
        }}
      >
        {t.finished ? "Séance terminée 🎉" : t.current?.label ?? "—"}
      </div>

      <div style={{ position: "relative", width: 2 * (RADIUS + STROKE), height: 2 * (RADIUS + STROKE) }}>
        <svg
          width={2 * (RADIUS + STROKE)}
          height={2 * (RADIUS + STROKE)}
          style={{ transform: "rotate(-90deg)" }}
        >
          <circle
            cx={RADIUS + STROKE}
            cy={RADIUS + STROKE}
            r={RADIUS}
            fill="none"
            stroke="#2a2a40"
            strokeWidth={STROKE}
          />
          <circle
            cx={RADIUS + STROKE}
            cy={RADIUS + STROKE}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={offset}
            style={{
              transition: "stroke-dashoffset 1s linear, stroke 0.4s",
              filter: `drop-shadow(0 0 8px ${color})`,
            }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="font-display"
            style={{ fontSize: 52, fontWeight: 800, color: "#f0f0ff", lineHeight: 1 }}
          >
            {secondsToClock(t.remaining)}
          </div>
          <div style={{ fontSize: 12, color: "#8888aa", marginTop: 6 }}>
            Bloc {Math.min(t.index + 1, blocks.length)} / {blocks.length}
          </div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: "#8888aa", minHeight: 18, textAlign: "center" }}>
        {t.next ? <>Suivant : {t.next.label}</> : "Dernier bloc"}
      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        {!t.running ? (
          <TimerBtn onClick={t.start} primary color={color} disabled={t.finished}>
            ▶ Start
          </TimerBtn>
        ) : (
          <TimerBtn onClick={t.pause} color={color}>
            ⏸ Pause
          </TimerBtn>
        )}
        <TimerBtn onClick={t.skip} disabled={t.finished}>
          ⏭ Bloc suivant
        </TimerBtn>
        <TimerBtn onClick={t.reset}>↺ Reset</TimerBtn>
      </div>
    </div>
  );
}

function TimerBtn({
  children,
  onClick,
  primary,
  color = "#8888aa",
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  primary?: boolean;
  color?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="focus-ring"
      style={{
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        fontWeight: 700,
        fontSize: 14,
        padding: "10px 18px",
        borderRadius: 12,
        color: primary ? "#0a0a0f" : "#f0f0ff",
        background: primary ? color : "rgba(255,255,255,0.06)",
        border: `1px solid ${primary ? color : "rgba(255,255,255,0.12)"}`,
        boxShadow: primary ? `0 0 20px ${color}55` : "none",
      }}
    >
      {children}
    </button>
  );
}
