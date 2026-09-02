"use client";

import { motion } from "framer-motion";
import { toast } from "sonner";
import { Flame, Play, Target, Trophy } from "lucide-react";
import { useApp } from "./AppProvider";
import { WEEK_LAYOUT, SESSION_META, gradient } from "../lib/theme";
import { getSession } from "../lib/workouts";
import { levelForXp, levelProgress } from "../lib/gamification";
import { currentPhase } from "../lib/progressiveOverload";
import { challengeForIndex } from "../lib/challenges";
import { weekKey } from "../lib/date";
import { DifficultyBadge } from "./ui";
import type { SessionType, Difficulty } from "../lib/types";

export function Dashboard({
  onOpenSession,
  getDifficulty,
}: {
  onOpenSession: (t: SessionType) => void;
  getDifficulty: (t: SessionType) => Difficulty;
}) {
  const { state, completeChallenge } = useApp();
  const todayIdx = (new Date().getDay() + 6) % 7;
  const todayType = WEEK_LAYOUT[todayIdx].type;
  const difficulty = getDifficulty(todayType);
  const session = getSession(todayType, difficulty);
  const meta = SESSION_META[todayType];
  const phase = currentPhase(state.user.startDate);

  const info = levelForXp(state.user.xp);
  const progress = levelProgress(state.user.xp);
  const wk = state.weekLogs[weekKey()] ?? {};

  const handleChallenge = () => {
    const gained = completeChallenge();
    if (gained) toast.success(`Challenge hebdo relevé ! +${gained} XP`, { icon: "🎯" });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div>
        <div style={{ color: "#8888aa", fontSize: 14 }}>
          Salut {state.user.name || "athlète"} 👋
        </div>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800 }}>
          Séance du jour
        </h1>
      </div>

      {/* Hero */}
      <motion.div
        whileHover={{ scale: 1.01 }}
        className="glass"
        style={{
          padding: 24,
          position: "relative",
          overflow: "hidden",
          border: `1px solid ${meta.accent}55`,
          boxShadow: `0 0 30px ${meta.accent}22`,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: gradient(todayType),
            opacity: 0.14,
          }}
        />
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 34 }}>{meta.icon}</div>
              <h2 className="font-display" style={{ fontSize: 28, fontWeight: 800, margin: "4px 0" }}>
                {meta.label}
              </h2>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <DifficultyBadge difficulty={difficulty} />
                <span style={{ color: "#8888aa", fontSize: 13 }}>~ {session.estimatedDuration} min</span>
                <span style={{ color: meta.accent, fontSize: 13, fontWeight: 600 }}>
                  +{session.xpReward} XP
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => onOpenSession(todayType)}
            className="focus-ring"
            style={{
              marginTop: 20,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              padding: "13px 22px",
              borderRadius: 12,
              border: "none",
              fontWeight: 800,
              fontSize: 15,
              color: "#0a0a0f",
              background: gradient(todayType),
              boxShadow: `0 0 22px ${meta.accent}66`,
            }}
          >
            <Play size={18} fill="#0a0a0f" /> Commencer la séance
          </button>
        </div>
      </motion.div>

      {/* XP + Streak row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14 }} className="dash-row">
        <div className="glass" style={{ padding: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                className="font-display"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  color: "#0a0a0f",
                  background: "linear-gradient(135deg,#a855f7,#00d4ff)",
                }}
              >
                {info.level}
              </div>
              <div>
                <div className="font-display" style={{ fontSize: 15 }}>{info.name}</div>
                <div style={{ fontSize: 12, color: "#8888aa" }}>
                  {state.user.xp.toLocaleString("fr-FR")} XP
                  {info.nextThreshold !== null && (
                    <> · {(info.nextThreshold - state.user.xp).toLocaleString("fr-FR")} XP → niv. {info.level + 1}</>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div style={{ height: 10, background: "#2a2a40", borderRadius: 8, overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(progress * 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ height: "100%", background: "linear-gradient(90deg,#a855f7,#00d4ff)" }}
            />
          </div>
        </div>

        <motion.div
          className={`glass ${state.user.streak >= 7 ? "animate-pulse-glow" : ""}`}
          style={{
            padding: 18,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            border: state.user.streak >= 7 ? "1px solid #eab30855" : undefined,
          }}
        >
          <Flame size={26} color="#eab308" fill={state.user.streak >= 7 ? "#eab308" : "none"} />
          <div className="font-display" style={{ fontSize: 30, fontWeight: 800, color: "#eab308" }}>
            {state.user.streak}
          </div>
          <div style={{ fontSize: 11, color: "#8888aa" }}>jours de suite</div>
        </motion.div>
      </div>

      {/* Weekly overview */}
      <div className="glass" style={{ padding: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div className="font-display" style={{ fontSize: 13, letterSpacing: "0.08em", color: "#8888aa" }}>
            CETTE SEMAINE
          </div>
          <div style={{ fontSize: 12, color: phase.color, fontWeight: 700 }}>Phase {phase.name}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 6 }}>
          {WEEK_LAYOUT.map((d, i) => {
            const m = SESSION_META[d.type];
            const completed = wk[d.type]?.completed;
            const isToday = i === todayIdx;
            return (
              <button
                key={d.day}
                onClick={() => onOpenSession(d.type)}
                className="focus-ring"
                aria-label={`${d.day} — ${m.label}`}
                style={{
                  cursor: "pointer",
                  position: "relative",
                  padding: "10px 4px",
                  borderRadius: 12,
                  border: isToday ? `2px solid ${m.accent}` : "1px solid rgba(255,255,255,0.06)",
                  background: `${m.from}1f`,
                  boxShadow: isToday ? `0 0 14px ${m.accent}55` : "none",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <span style={{ fontSize: 10, color: "#8888aa" }}>{d.day.slice(0, 3)}</span>
                <span style={{ fontSize: 18 }}>{m.icon}</span>
                <span className="font-display" style={{ fontSize: 9, color: m.accent, fontWeight: 700 }}>
                  {m.short}
                </span>
                {completed && (
                  <span
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      fontSize: 11,
                      color: "#22c55e",
                    }}
                  >
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Weekly challenge */}
      <div
        className="glass"
        style={{
          padding: 18,
          border: "1px solid #a855f755",
          background: "linear-gradient(135deg, rgba(168,85,247,0.12), rgba(0,212,255,0.06))",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <Target size={18} color="#a855f7" />
          <span className="font-display" style={{ fontSize: 13, letterSpacing: "0.08em", color: "#a855f7" }}>
            CHALLENGE HEBDO
          </span>
          <span style={{ marginLeft: "auto", fontSize: 12, color: "#eab308", fontWeight: 700 }}>+300 XP</span>
        </div>
        <p style={{ fontSize: 15, color: "#f0f0ff", marginBottom: 14 }}>
          {challengeForIndex(state.currentWeekChallenge)}
        </p>
        <button
          onClick={handleChallenge}
          disabled={state.challengeCompleted}
          className="focus-ring"
          style={{
            cursor: state.challengeCompleted ? "default" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "9px 16px",
            borderRadius: 10,
            border: "none",
            fontWeight: 700,
            fontSize: 13,
            color: state.challengeCompleted ? "#22c55e" : "#0a0a0f",
            background: state.challengeCompleted ? "rgba(34,197,94,0.15)" : "linear-gradient(135deg,#a855f7,#ec4899)",
          }}
        >
          <Trophy size={15} /> {state.challengeCompleted ? "Challenge relevé ✓" : "Marquer comme relevé"}
        </button>
      </div>
    </div>
  );
}
