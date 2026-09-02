"use client";

import type { Difficulty } from "../lib/types";
import { DIFFICULTY_META } from "../lib/theme";

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const meta = DIFFICULTY_META[difficulty];
  return (
    <span
      className="font-display"
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.05em",
        textTransform: "uppercase",
        padding: "3px 10px",
        borderRadius: 999,
        color: meta.color,
        background: `${meta.color}1a`,
        border: `1px solid ${meta.color}55`,
      }}
    >
      {meta.label}
    </span>
  );
}

export function DifficultyPills({
  value,
  onChange,
  disabled,
}: {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
  disabled?: boolean;
}) {
  const items: Difficulty[] = ["easy", "medium", "hard"];
  return (
    <div style={{ display: "inline-flex", gap: 6 }}>
      {items.map((d) => {
        const active = d === value;
        const meta = DIFFICULTY_META[d];
        return (
          <button
            key={d}
            disabled={disabled}
            onClick={() => onChange(d)}
            aria-pressed={active}
            aria-label={`Difficulté ${meta.label}`}
            className="focus-ring"
            style={{
              cursor: disabled ? "not-allowed" : "pointer",
              opacity: disabled ? 0.5 : 1,
              fontSize: 12,
              fontWeight: 600,
              padding: "6px 12px",
              borderRadius: 999,
              color: active ? "#0a0a0f" : meta.color,
              background: active ? meta.color : "transparent",
              border: `1px solid ${meta.color}${active ? "" : "55"}`,
              transition: "all 0.2s",
            }}
          >
            {meta.label}
          </button>
        );
      })}
    </div>
  );
}

export function CardSkeleton({ height = 120 }: { height?: number }) {
  return (
    <div
      className="glass shimmer"
      style={{ height, width: "100%", borderRadius: 16 }}
      aria-hidden
    />
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="font-display"
      style={{
        fontSize: 13,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        color: "#8888aa",
        marginBottom: 12,
      }}
    >
      {children}
    </h2>
  );
}

export function secondsToClock(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function paceToString(secPerKm: number): string {
  const m = Math.floor(secPerKm / 60);
  const s = Math.round(secPerKm % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}
