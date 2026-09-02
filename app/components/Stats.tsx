"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Flame, Dumbbell, Zap, MapPin } from "lucide-react";
import { useApp } from "./AppProvider";
import { SESSION_META } from "../lib/theme";
import { weekKey, format } from "../lib/date";
import { addWeeks } from "date-fns";
import type { SessionType, PersonalBests } from "../lib/types";
import { SectionTitle } from "./ui";

const ALL_TYPES: SessionType[] = ["EF", "VMA", "SEUIL", "FORCE1", "FORCE2", "RAMEUR", "SKI"];

const KM_ESTIMATE: Record<SessionType, Record<string, number>> = {
  EF: { easy: 10, medium: 13.5, hard: 18 },
  VMA: { easy: 5, medium: 6.5, hard: 8 },
  SEUIL: { easy: 8, medium: 9.5, hard: 11 },
  FORCE1: { easy: 0, medium: 0, hard: 0 },
  FORCE2: { easy: 0, medium: 0, hard: 0 },
  RAMEUR: { easy: 0, medium: 0, hard: 0 },
  SKI: { easy: 0, medium: 0, hard: 0 },
};

export function Stats() {
  const { state, updatePersonalBests } = useApp();

  const { totalKm, perType, bestStreak, totalSessions } = useMemo(() => {
    const perType: Record<SessionType, number> = {
      EF: 0, VMA: 0, SEUIL: 0, FORCE1: 0, FORCE2: 0, RAMEUR: 0, SKI: 0,
    };
    let totalKm = 0;
    let totalSessions = 0;
    const days = new Set<string>();
    for (const wk of Object.keys(state.weekLogs)) {
      const week = state.weekLogs[wk];
      for (const t of Object.keys(week)) {
        const e = week[t];
        if (!e?.completed) continue;
        totalSessions++;
        if (t in perType) {
          perType[t as SessionType]++;
          totalKm += KM_ESTIMATE[t as SessionType]?.[e.difficulty] ?? 0;
        }
        if (e.completedAt) days.add(e.completedAt.slice(0, 10));
      }
    }
    const sorted = Array.from(days).sort();
    let best = 0;
    let run = 0;
    let prev: number | null = null;
    for (const d of sorted) {
      const t = new Date(d).getTime();
      if (prev !== null && t - prev === 86400000) run++;
      else run = 1;
      best = Math.max(best, run);
      prev = t;
    }
    return { totalKm, perType, bestStreak: best, totalSessions };
  }, [state.weekLogs]);

  // Weekly volume (last 8 weeks) — stacked counts per type
  const weeklyVolume = useMemo(() => {
    const rows: Record<string, number | string>[] = [];
    for (let i = 7; i >= 0; i--) {
      const ref = addWeeks(new Date(), -i);
      const key = weekKey(ref);
      const week = state.weekLogs[key] ?? {};
      const row: Record<string, number | string> = { name: format(ref, "dd/MM") };
      for (const t of ALL_TYPES) row[t] = week[t]?.completed ? 1 : 0;
      rows.push(row);
    }
    return rows;
  }, [state.weekLogs]);

  // XP progression (last 12 weeks, cumulative)
  const xpProgression = useMemo(() => {
    const rows: { name: string; xp: number }[] = [];
    let cum = 0;
    // cumulative from earliest of the 12-week window
    for (let i = 11; i >= 0; i--) {
      const ref = addWeeks(new Date(), -i);
      const key = weekKey(ref);
      const week = state.weekLogs[key] ?? {};
      let earned = 0;
      for (const t of Object.keys(week)) if (week[t]?.completed) earned += week[t].xpEarned ?? 0;
      cum += earned;
      rows.push({ name: format(ref, "dd/MM"), xp: cum });
    }
    return rows;
  }, [state.weekLogs]);

  const breakdown = useMemo(
    () =>
      ALL_TYPES.map((t) => ({ name: SESSION_META[t].short, value: perType[t], color: SESSION_META[t].accent })).filter(
        (d) => d.value > 0
      ),
    [perType]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800 }}>Statistiques</h1>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }} className="dash-row">
        <SummaryTile icon={<Zap size={18} />} label="Total XP" value={state.user.xp.toLocaleString("fr-FR")} color="#a855f7" />
        <SummaryTile icon={<Dumbbell size={18} />} label="Séances" value={String(totalSessions)} color="#00d4ff" />
        <SummaryTile icon={<Flame size={18} />} label="Record série" value={`${Math.max(bestStreak, state.user.streak)} j`} color="#eab308" />
        <SummaryTile icon={<MapPin size={18} />} label="Km estimés" value={`${Math.round(totalKm)}`} color="#22c55e" />
      </div>

      {/* Weekly volume */}
      <div className="glass" style={{ padding: 18 }}>
        <SectionTitle>Volume hebdomadaire (8 semaines)</SectionTitle>
        <div style={{ width: "100%", height: 240 }}>
          <ResponsiveContainer>
            <BarChart data={weeklyVolume} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a40" />
              <XAxis dataKey="name" tick={{ fill: "#8888aa", fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#8888aa", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#12121a", border: "1px solid #2a2a40", borderRadius: 10, color: "#f0f0ff" }}
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
              />
              {ALL_TYPES.map((t) => (
                <Bar key={t} dataKey={t} stackId="v" fill={SESSION_META[t].accent} radius={[0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* XP progression */}
      <div className="glass" style={{ padding: 18 }}>
        <SectionTitle>Progression XP (12 semaines)</SectionTitle>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <LineChart data={xpProgression} margin={{ top: 4, right: 8, bottom: 0, left: -14 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2a40" />
              <XAxis dataKey="name" tick={{ fill: "#8888aa", fontSize: 11 }} />
              <YAxis tick={{ fill: "#8888aa", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "#12121a", border: "1px solid #2a2a40", borderRadius: 10, color: "#f0f0ff" }}
              />
              <Line type="monotone" dataKey="xp" stroke="#a855f7" strokeWidth={3} dot={{ fill: "#00d4ff", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown donut */}
      <div className="glass" style={{ padding: 18 }}>
        <SectionTitle>Répartition des séances</SectionTitle>
        {breakdown.length === 0 ? (
          <EmptyHint />
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
            <div style={{ width: 200, height: 200 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={breakdown} dataKey="value" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {breakdown.map((d) => (
                      <Cell key={d.name} fill={d.color} stroke="#0a0a0f" />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#12121a", border: "1px solid #2a2a40", borderRadius: 10, color: "#f0f0ff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {breakdown.map((d) => (
                <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: d.color }} />
                  <span style={{ color: "#f0f0ff", minWidth: 60 }}>{d.name}</span>
                  <span style={{ color: "#8888aa" }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Personal bests */}
      <div className="glass" style={{ padding: 18 }}>
        <SectionTitle>Records personnels</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12 }}>
          <PB label="500m Rameur" field="rameur500" placeholder="1:35" pbs={state.personalBests} onSave={updatePersonalBests} />
          <PB label="2000m Rameur" field="rameur2000" placeholder="6:50" pbs={state.personalBests} onSave={updatePersonalBests} />
          <PB label="500m Ski" field="ski500" placeholder="1:42" pbs={state.personalBests} onSave={updatePersonalBests} />
          <PB label="1km Course" field="run1km" placeholder="3:05" pbs={state.personalBests} onSave={updatePersonalBests} />
          <PB label="VMA (km/h)" field="vma" placeholder="18" pbs={state.personalBests} onSave={updatePersonalBests} />
        </div>
      </div>
    </div>
  );
}

function SummaryTile({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="glass" style={{ padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ color }}>{icon}</div>
      <div className="font-display" style={{ fontSize: 22, fontWeight: 800, color: "#f0f0ff" }}>{value}</div>
      <div style={{ fontSize: 11, color: "#8888aa" }}>{label}</div>
    </div>
  );
}

function PB({
  label,
  field,
  placeholder,
  pbs,
  onSave,
}: {
  label: string;
  field: keyof PersonalBests;
  placeholder: string;
  pbs: PersonalBests;
  onSave: (p: Partial<PersonalBests>) => void;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: 11, color: "#8888aa" }}>{label}</span>
      <input
        value={pbs[field]}
        placeholder={placeholder}
        onChange={(e) => onSave({ [field]: e.target.value } as Partial<PersonalBests>)}
        className="focus-ring font-display"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 10,
          padding: "10px 12px",
          color: "#00d4ff",
          fontSize: 18,
          outline: "none",
          width: "100%",
        }}
        aria-label={label}
      />
    </label>
  );
}

function EmptyHint() {
  return (
    <div style={{ padding: "24px 0", textAlign: "center", color: "#8888aa", fontSize: 14 }}>
      Complète des séances pour voir tes statistiques apparaître ici. 📊
    </div>
  );
}
