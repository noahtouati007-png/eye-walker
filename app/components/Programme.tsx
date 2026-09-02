"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Play, Pencil, Plus, Trash2, RotateCcw, RefreshCw } from "lucide-react";
import { useApp } from "./AppProvider";
import { WEEK_LAYOUT, SESSION_META, gradient, DIFFICULTY_META } from "../lib/theme";
import { getSession, SESSION_DESCRIPTIONS } from "../lib/workouts";
import { currentPhase, weekNumberSince, cycleWeek, PHASES } from "../lib/progressiveOverload";
import { weekKey } from "../lib/date";
import { DifficultyPills, secondsToClock } from "./ui";
import type { SessionType, Difficulty, SessionBlock } from "../lib/types";
import { addWeeks } from "date-fns";

export function Programme({
  onOpenSession,
  getDifficulty,
  setDifficulty,
  getVariantIndex,
  cycleVariant,
}: {
  onOpenSession: (t: SessionType, week?: number, phaseIndex?: number) => void;
  getDifficulty: (t: SessionType) => Difficulty;
  setDifficulty: (t: SessionType, d: Difficulty) => void;
  getVariantIndex: (t: SessionType, week: number) => number;
  cycleVariant: (t: SessionType, week: number) => void;
}) {
  const { state } = useApp();
  const [weekOffset, setWeekOffset] = useState(0);
  const [expanded, setExpanded] = useState<SessionType | null>(null);

  const refDate = addWeeks(new Date(), weekOffset);
  const phase = currentPhase(state.user.startDate, refDate);
  const weekNum = weekNumberSince(state.user.startDate, refDate);
  const cyclePos = cycleWeek(weekNum);
  const logs = state.weekLogs[weekKey(refDate)] ?? {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Phase banner */}
      <div
        className="glass"
        style={{
          padding: 18,
          border: `1px solid ${phase.color}66`,
          background: `linear-gradient(135deg, ${phase.color}22, transparent)`,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
          <div>
            <div className="font-display" style={{ fontSize: 12, letterSpacing: "0.1em", color: "#8888aa" }}>
              PHASE ACTUELLE
            </div>
            <div className="font-display" style={{ fontSize: 26, fontWeight: 800, color: phase.color }}>
              {phase.name}
            </div>
            <div style={{ fontSize: 13, color: "#8888aa", marginTop: 2 }}>{phase.description}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="font-display" style={{ fontSize: 13, color: "#f0f0ff" }}>
              Semaine {cyclePos} / 16
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 8, justifyContent: "flex-end" }}>
              {[0, 1, 2, 3].map((p) => (
                <span
                  key={p}
                  title={PHASES[p as 0 | 1 | 2 | 3].name}
                  style={{
                    width: 22,
                    height: 6,
                    borderRadius: 4,
                    background: p === phase.index ? phase.color : "#2a2a40",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Week nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <NavArrow onClick={() => setWeekOffset((w) => w - 1)}>← Précédente</NavArrow>
        <div className="font-display" style={{ fontSize: 15 }}>
          {weekOffset === 0 ? "Cette semaine" : `Semaine ${weekOffset > 0 ? "+" : ""}${weekOffset}`}
        </div>
        <NavArrow onClick={() => setWeekOffset((w) => w + 1)}>Suivante →</NavArrow>
      </div>

      {/* Session cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {WEEK_LAYOUT.map((d) => (
          <SessionCard
            key={d.day}
            day={d.day}
            type={d.type}
            week={weekNum}
            phaseIndex={phase.index}
            variantIndex={getVariantIndex(d.type, weekNum)}
            onCycleVariant={() => cycleVariant(d.type, weekNum)}
            completed={!!logs[d.type]?.completed}
            difficulty={getDifficulty(d.type)}
            onSetDifficulty={(diff) => setDifficulty(d.type, diff)}
            expanded={expanded === d.type}
            onToggle={() => setExpanded((e) => (e === d.type ? null : d.type))}
            onStart={() => onOpenSession(d.type, weekNum, phase.index)}
            deload={phase.index === 3}
          />
        ))}
      </div>
    </div>
  );
}

function NavArrow({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="focus-ring glass"
      style={{
        cursor: "pointer",
        padding: "8px 14px",
        fontSize: 13,
        fontWeight: 600,
        color: "#f0f0ff",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      {children}
    </button>
  );
}

function SessionCard({
  day,
  type,
  week,
  phaseIndex,
  variantIndex,
  onCycleVariant,
  completed,
  difficulty,
  onSetDifficulty,
  expanded,
  onToggle,
  onStart,
  deload,
}: {
  day: string;
  type: SessionType;
  week: number;
  phaseIndex: number;
  variantIndex: number;
  onCycleVariant: () => void;
  completed: boolean;
  difficulty: Difficulty;
  onSetDifficulty: (d: Difficulty) => void;
  expanded: boolean;
  onToggle: () => void;
  onStart: () => void;
  deload: boolean;
}) {
  const { state, saveCustomSession, resetCustomSession } = useApp();
  const meta = SESSION_META[type];
  const [editing, setEditing] = useState(false);
  const custom = state.customSessions[type];

  const session = useMemo(
    () => getSession(type, difficulty, { week, phaseIndex, variantIndex, customWork: custom }),
    [type, difficulty, week, phaseIndex, variantIndex, custom]
  );
  const work = session.blocks.filter((b) => b.type === "work" || b.type === "rest");

  const [draft, setDraft] = useState<SessionBlock[]>(work);

  const startEditing = () => {
    setDraft(work.map((b) => ({ ...b })));
    setEditing(true);
  };

  const saveEditing = () => {
    saveCustomSession(type, draft);
    setEditing(false);
    toast.success("Séance personnalisée enregistrée");
  };

  const resetEditing = () => {
    resetCustomSession(type);
    setEditing(false);
    toast("Séance réinitialisée");
  };

  return (
    <div className="glass" style={{ overflow: "hidden", border: completed ? "1px solid #22c55e44" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 22,
            background: gradient(type),
            flexShrink: 0,
          }}
        >
          {meta.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: "#8888aa" }}>{day}</div>
          <div className="font-display" style={{ fontSize: 16, fontWeight: 700 }}>{meta.label}</div>
          <div style={{ fontSize: 12, color: meta.accent, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {session.variantName}
          </div>
          <div style={{ fontSize: 11.5, color: "#8888aa" }}>
            ~ {session.estimatedDuration} min · +{session.xpReward} XP
          </div>
        </div>
        {completed && <span style={{ color: "#22c55e", fontSize: 18 }}>✓</span>}
        <button
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label="Détails"
          className="focus-ring"
          style={{ cursor: "pointer", background: "transparent", border: "none", color: "#8888aa" }}
        >
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 13, color: "#8888aa" }}>{SESSION_DESCRIPTIONS[type]}</p>

              {/* Format / variant selector */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 12,
                  background: `${meta.accent}12`,
                  border: `1px solid ${meta.accent}33`,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div className="font-display" style={{ fontSize: 13, color: meta.accent }}>{session.variantName}</div>
                  <div style={{ fontSize: 11.5, color: "#8888aa" }}>{session.focus}</div>
                </div>
                <button
                  onClick={onCycleVariant}
                  className="focus-ring"
                  aria-label="Changer de format"
                  style={{ ...smallBtn, color: meta.accent, borderColor: `${meta.accent}66`, flexShrink: 0 }}
                >
                  <RefreshCw size={13} /> Format
                </button>
              </div>

              {/* Difficulty selector */}
              <div>
                <div style={{ fontSize: 12, color: "#8888aa", marginBottom: 8 }}>
                  Difficulté {deload && <span style={{ color: "#22c55e" }}>(forcée en Deload)</span>}
                </div>
                <DifficultyPills value={difficulty} onChange={onSetDifficulty} disabled={deload} />
              </div>

              {/* Blocks */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: "#8888aa" }}>Blocs de la séance</span>
                  {!editing ? (
                    <button onClick={startEditing} className="focus-ring" style={smallBtn}>
                      <Pencil size={13} /> Modifier
                    </button>
                  ) : (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={saveEditing} className="focus-ring" style={{ ...smallBtn, color: "#22c55e", borderColor: "#22c55e55" }}>
                        Enregistrer
                      </button>
                      {custom && (
                        <button onClick={resetEditing} className="focus-ring" style={smallBtn}>
                          <RotateCcw size={13} /> Reset
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {editing ? (
                  <BlockEditor blocks={draft} onChange={setDraft} />
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {work.map((b) => (
                      <div
                        key={b.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 10,
                          padding: "10px 12px",
                          borderRadius: 10,
                          background: b.type === "rest" ? "rgba(34,197,94,0.05)" : "rgba(255,255,255,0.03)",
                        }}
                      >
                        <span style={{ fontSize: 13, color: "#f0f0ff" }}>{b.label}</span>
                        <span style={{ fontSize: 12, color: "#8888aa", whiteSpace: "nowrap" }}>
                          {formatBlockMeta(b)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={onStart}
                className="focus-ring"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  cursor: "pointer",
                  padding: "12px",
                  borderRadius: 12,
                  border: "none",
                  fontWeight: 800,
                  color: "#0a0a0f",
                  background: gradient(type),
                }}
              >
                <Play size={16} fill="#0a0a0f" /> Démarrer cette séance
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BlockEditor({
  blocks,
  onChange,
}: {
  blocks: SessionBlock[];
  onChange: (b: SessionBlock[]) => void;
}) {
  const update = (id: string, patch: Partial<SessionBlock>) =>
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const remove = (id: string) => onChange(blocks.filter((b) => b.id !== id));
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= blocks.length) return;
    const next = [...blocks];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = () =>
    onChange([
      ...blocks,
      { id: `custom-${Date.now()}`, label: "Nouveau bloc", type: "work" },
    ]);

  const numField = (v: number | undefined) => (v === undefined || Number.isNaN(v) ? "" : String(v));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {blocks.map((b, i) => (
        <div key={b.id} className="glass" style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              value={b.label}
              onChange={(e) => update(b.id, { label: e.target.value })}
              className="focus-ring"
              style={{ ...editInput, flex: 1 }}
              aria-label="Nom du bloc"
            />
            <select
              value={b.type}
              onChange={(e) => update(b.id, { type: e.target.value as SessionBlock["type"] })}
              className="focus-ring"
              style={editInput}
              aria-label="Type de bloc"
            >
              <option value="work">Effort</option>
              <option value="rest">Repos</option>
              <option value="warmup">Échauffement</option>
              <option value="cooldown">Retour au calme</option>
            </select>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 6 }}>
            <LabeledInput
              label="Durée (s)"
              value={numField(b.duration)}
              onChange={(v) => update(b.id, { duration: v ? Number(v) : undefined })}
              type="number"
            />
            <LabeledInput
              label="Séries"
              value={numField(b.sets)}
              onChange={(v) => update(b.id, { sets: v ? Number(v) : undefined })}
              type="number"
            />
            <LabeledInput
              label="Reps"
              value={numField(b.reps)}
              onChange={(v) => update(b.id, { reps: v ? Number(v) : undefined })}
              type="number"
            />
            <LabeledInput
              label="Intensité"
              value={b.intensity ?? ""}
              onChange={(v) => update(b.id, { intensity: v || undefined })}
            />
            <LabeledInput
              label="Distance"
              value={b.distance ?? ""}
              onChange={(v) => update(b.id, { distance: v || undefined })}
            />
            <LabeledInput
              label="Charge / poids"
              value={b.weight ?? ""}
              onChange={(v) => update(b.id, { weight: v || undefined })}
            />
            <LabeledInput
              label="Tempo / cadence"
              value={b.tempo ?? ""}
              onChange={(v) => update(b.id, { tempo: v || undefined })}
            />
            <LabeledInput
              label="RPE"
              value={b.rpe ?? ""}
              onChange={(v) => update(b.id, { rpe: v || undefined })}
            />
          </div>
          <LabeledInput
            label="Notes"
            value={b.notes ?? ""}
            onChange={(v) => update(b.id, { notes: v || undefined })}
          />
          <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
            <IconBtn onClick={() => move(i, -1)} label="Monter"><ChevronUp size={14} /></IconBtn>
            <IconBtn onClick={() => move(i, 1)} label="Descendre"><ChevronDown size={14} /></IconBtn>
            <IconBtn onClick={() => remove(b.id)} label="Supprimer" danger><Trash2 size={14} /></IconBtn>
          </div>
        </div>
      ))}
      <button onClick={add} className="focus-ring" style={{ ...smallBtn, justifyContent: "center", padding: "10px" }}>
        <Plus size={15} /> Ajouter un bloc
      </button>
    </div>
  );
}

function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <span style={{ fontSize: 10, color: "#8888aa" }}>{label}</span>
      <input
        value={value}
        type={type}
        onChange={(e) => onChange(e.target.value)}
        className="focus-ring"
        style={editInput}
        aria-label={label}
      />
    </label>
  );
}

function IconBtn({
  children,
  onClick,
  label,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  label: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="focus-ring"
      style={{
        cursor: "pointer",
        width: 30,
        height: 30,
        borderRadius: 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: danger ? "#ef4444" : "#8888aa",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {children}
    </button>
  );
}

function formatBlockMeta(b: SessionBlock): string {
  const parts: string[] = [];
  if (b.sets) parts.push(`${b.sets}×`);
  if (b.reps) parts.push(`${b.reps} reps`);
  if (b.distance) parts.push(b.distance);
  if (b.duration) parts.push(secondsToClock(b.duration));
  if (b.weight) parts.push(b.weight);
  if (b.intensity) parts.push(b.intensity);
  if (b.tempo) parts.push(b.tempo);
  if (b.rpe) parts.push(b.rpe);
  return parts.join(" · ") || (b.type === "rest" ? "Repos" : "");
}

const smallBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 5,
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
  padding: "6px 12px",
  borderRadius: 8,
  color: "#00d4ff",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(0,212,255,0.35)",
};

const editInput: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  padding: "8px 10px",
  color: "#f0f0ff",
  fontSize: 13,
  outline: "none",
  width: "100%",
};
