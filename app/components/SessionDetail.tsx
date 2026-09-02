"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { X, ChevronDown, Flame, Zap } from "lucide-react";
import { useApp } from "./AppProvider";
import { getSession, SESSION_DESCRIPTIONS, xpForDifficulty } from "../lib/workouts";
import { SESSION_META, DIFFICULTY_META, gradient } from "../lib/theme";
import { currentPhase } from "../lib/progressiveOverload";
import { XP } from "../lib/gamification";
import { secondsToClock } from "./ui";
import { fireConfetti } from "../lib/effects";
import type { SessionType, Difficulty, SessionBlock } from "../lib/types";

// Timer is heavy (SVG + audio) — load client-side only.
const Timer = dynamic(() => import("./Timer"), {
  ssr: false,
  loading: () => (
    <div className="glass shimmer" style={{ height: 320, borderRadius: 16 }} aria-hidden />
  ),
});

export function SessionDetail({
  type,
  difficulty,
  onClose,
}: {
  type: SessionType;
  difficulty: Difficulty;
  onClose: () => void;
}) {
  const { state, completeSession } = useApp();
  const [notes, setNotes] = useState("");
  const [showWarmup, setShowWarmup] = useState(true);
  const [showCooldown, setShowCooldown] = useState(false);
  const [freeMode, setFreeMode] = useState(false);
  const [done, setDone] = useState(false);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const meta = SESSION_META[type];
  const phase = currentPhase(state.user.startDate);
  const custom = state.customSessions[type];

  const session = useMemo(
    () => getSession(type, difficulty, custom),
    [type, difficulty, custom]
  );

  const xpToEarn = xpForDifficulty(difficulty) + (difficulty === "hard" ? XP.modifiedHarder : 0);

  const warmup = session.blocks.filter((b) => b.type === "warmup");
  const work = session.blocks.filter((b) => b.type === "work" || b.type === "rest");
  const cooldown = session.blocks.filter((b) => b.type === "cooldown");

  const handleComplete = () => {
    const res = completeSession(type, difficulty, notes.trim() || undefined);
    setDone(true);
    void fireConfetti();

    toast.success(`Séance terminée ! +${res.xpEarned} XP gagnés`, { icon: "✅" });
    for (const b of res.newBadges) {
      toast(`Badge débloqué : ${b.name} !`, { icon: "🏆" });
    }
    if (res.perfectWeek) toast.success("Semaine parfaite ! +500 XP bonus !", { icon: "💎" });
    if (res.leveledUp && res.newLevel)
      toast.success(`Niveau ${res.newLevel.level} atteint — ${res.newLevel.name} !`, { icon: "⚡" });
    if (res.streakMilestone)
      toast.success(`${res.streakMilestone} jours consécutifs ! Incroyable !`, { icon: "🔥" });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Séance ${meta.label}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(4,4,8,0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        overflowY: "auto",
        padding: "24px 16px 96px",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="glass"
        style={{ width: "100%", maxWidth: 620, overflow: "hidden" }}
      >
        {/* Header */}
        <div style={{ position: "relative", padding: 24, background: gradient(type) }}>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="focus-ring"
            style={{
              position: "absolute",
              top: 14,
              right: 14,
              width: 34,
              height: 34,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
              background: "rgba(0,0,0,0.25)",
              border: "none",
            }}
          >
            <X size={18} />
          </button>
          <div style={{ fontSize: 40 }}>{meta.icon}</div>
          <h1 className="font-display" style={{ fontSize: 26, fontWeight: 800, color: "#fff", margin: "6px 0" }}>
            {meta.label}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, maxWidth: 420 }}>
            {SESSION_DESCRIPTIONS[type]}
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <Chip>
              Phase {phase.name}
            </Chip>
            <Chip>{DIFFICULTY_META[difficulty].label}</Chip>
            <Chip>
              <Zap size={12} /> {session.estimatedDuration} min
            </Chip>
            <Chip>
              <Flame size={12} /> +{xpToEarn} XP
            </Chip>
          </div>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
          {done ? (
            <CompletedView xp={xpToEarn} onClose={onClose} />
          ) : (
            <>
              {/* mode toggle */}
              <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                <ModeToggle active={!freeMode} onClick={() => setFreeMode(false)}>
                  Mode timer
                </ModeToggle>
                <ModeToggle active={freeMode} onClick={() => setFreeMode(true)}>
                  Mode libre
                </ModeToggle>
              </div>

              {/* Warm-up */}
              <Collapsible
                title="Échauffement"
                accent={meta.accent}
                open={showWarmup}
                onToggle={() => setShowWarmup((v) => !v)}
              >
                {warmup.map((b) => (
                  <BlockRow key={b.id} block={b} checked={!!checked[b.id]} onCheck={() => toggle(b.id)} />
                ))}
              </Collapsible>

              {/* Main work */}
              <div>
                <SectionLabel>Séance principale</SectionLabel>
                {freeMode ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {work.map((b) => (
                      <BlockRow key={b.id} block={b} checked={!!checked[b.id]} onCheck={() => toggle(b.id)} big />
                    ))}
                  </div>
                ) : (
                  <div className="glass" style={{ padding: 20, marginTop: 4 }}>
                    <Timer blocks={session.blocks} />
                  </div>
                )}
              </div>

              {/* Cool-down */}
              <Collapsible
                title="Retour au calme"
                accent={meta.accent}
                open={showCooldown}
                onToggle={() => setShowCooldown((v) => !v)}
              >
                {cooldown.map((b) => (
                  <BlockRow key={b.id} block={b} checked={!!checked[b.id]} onCheck={() => toggle(b.id)} />
                ))}
              </Collapsible>

              {/* Notes */}
              <div>
                <SectionLabel>Notes</SectionLabel>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Sensations, RPE, charges utilisées…"
                  className="focus-ring"
                  rows={3}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    padding: 12,
                    color: "#f0f0ff",
                    fontSize: 14,
                    resize: "vertical",
                    outline: "none",
                  }}
                />
              </div>

              <button
                onClick={handleComplete}
                className="focus-ring"
                style={{
                  cursor: "pointer",
                  width: "100%",
                  padding: "16px",
                  borderRadius: 14,
                  border: "none",
                  fontWeight: 800,
                  fontSize: 16,
                  color: "#0a0a0f",
                  background: gradient(type),
                  boxShadow: `0 0 24px ${meta.accent}55`,
                }}
              >
                Marquer comme terminée
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );

  function toggle(id: string) {
    setChecked((c) => ({ ...c, [id]: !c[id] }));
  }
}

function CompletedView({ xp, onClose }: { xp: number; onClose: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "20px 0" }}>
      <motion.svg width={90} height={90} viewBox="0 0 90 90">
        <motion.circle
          cx={45}
          cy={45}
          r={40}
          fill="none"
          stroke="#22c55e"
          strokeWidth={5}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5 }}
        />
        <motion.path
          d="M28 47 L40 59 L63 34"
          fill="none"
          stroke="#22c55e"
          strokeWidth={6}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          style={{ filter: "drop-shadow(0 0 6px #22c55e)" }}
        />
      </motion.svg>
      <div className="font-display" style={{ fontSize: 22, color: "#22c55e" }}>
        Séance validée !
      </div>
      <div className="font-display" style={{ fontSize: 32, color: "#f0f0ff" }}>+{xp} XP</div>
      <button
        onClick={onClose}
        className="focus-ring"
        style={{
          cursor: "pointer",
          padding: "12px 28px",
          borderRadius: 12,
          border: "none",
          fontWeight: 700,
          color: "#0a0a0f",
          background: "linear-gradient(135deg,#22c55e,#06b6d4)",
        }}
      >
        Terminer
      </button>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 12,
        fontWeight: 700,
        color: "#fff",
        padding: "4px 10px",
        borderRadius: 999,
        background: "rgba(0,0,0,0.28)",
      }}
    >
      {children}
    </span>
  );
}

function ModeToggle({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="focus-ring"
      style={{
        cursor: "pointer",
        fontSize: 13,
        fontWeight: 600,
        padding: "8px 16px",
        borderRadius: 999,
        color: active ? "#0a0a0f" : "#8888aa",
        background: active ? "#00d4ff" : "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {children}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="font-display"
      style={{ fontSize: 12, letterSpacing: "0.1em", textTransform: "uppercase", color: "#8888aa", marginBottom: 8 }}
    >
      {children}
    </div>
  );
}

function Collapsible({
  title,
  accent,
  open,
  onToggle,
  children,
}: {
  title: string;
  accent: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="glass" style={{ overflow: "hidden" }}>
      <button
        onClick={onToggle}
        aria-expanded={open}
        className="focus-ring"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          cursor: "pointer",
          background: "transparent",
          border: "none",
          color: "#f0f0ff",
        }}
      >
        <span className="font-display" style={{ fontSize: 13, letterSpacing: "0.06em", color: accent }}>
          {title}
        </span>
        <ChevronDown
          size={18}
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s", color: "#8888aa" }}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BlockRow({
  block,
  checked,
  onCheck,
  big,
}: {
  block: SessionBlock;
  checked: boolean;
  onCheck: () => void;
  big?: boolean;
}) {
  const isRest = block.type === "rest";
  const parts: string[] = [];
  if (block.sets) parts.push(`${block.sets} séries`);
  if (block.reps) parts.push(`${block.reps} reps`);
  if (block.duration) parts.push(secondsToClock(block.duration));
  if (block.weight) parts.push(block.weight);
  if (block.intensity) parts.push(block.intensity);

  return (
    <button
      onClick={onCheck}
      className="focus-ring"
      style={{
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 12,
        textAlign: "left",
        padding: big ? "14px" : "10px 12px",
        borderRadius: 12,
        border: `1px solid ${isRest ? "#22c55e33" : "rgba(255,255,255,0.08)"}`,
        background: checked ? "rgba(34,197,94,0.08)" : isRest ? "rgba(34,197,94,0.04)" : "rgba(255,255,255,0.03)",
        width: "100%",
      }}
    >
      <span
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          color: checked ? "#0a0a0f" : "transparent",
          background: checked ? "#22c55e" : "transparent",
          border: `2px solid ${checked ? "#22c55e" : "#3a3a55"}`,
        }}
      >
        ✓
      </span>
      <span style={{ flex: 1 }}>
        <span style={{ display: "block", fontSize: big ? 15 : 14, color: "#f0f0ff", fontWeight: isRest ? 500 : 600 }}>
          {block.label}
        </span>
        {parts.length > 0 && (
          <span style={{ display: "block", fontSize: 12, color: isRest ? "#22c55e" : "#8888aa", marginTop: 2 }}>
            {parts.join(" · ")}
          </span>
        )}
        {block.notes && (
          <span style={{ display: "block", fontSize: 11, color: "#8888aa", marginTop: 2, fontStyle: "italic" }}>
            {block.notes}
          </span>
        )}
      </span>
    </button>
  );
}
