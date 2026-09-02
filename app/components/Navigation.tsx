"use client";

import { Home, CalendarDays, Play, BarChart3, Award } from "lucide-react";
import { motion } from "framer-motion";
import { useApp } from "./AppProvider";
import { EyeWalkerLogo, BrandName } from "./Logo";
import { levelProgress } from "../lib/gamification";

export type NavTab = "dashboard" | "programme" | "stats" | "badges";

const TABS: { id: NavTab; label: string; icon: typeof Home }[] = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "programme", label: "Programme", icon: CalendarDays },
  { id: "stats", label: "Stats", icon: BarChart3 },
  { id: "badges", label: "Badges", icon: Award },
];

export function Navigation({
  active,
  onTab,
  onPlay,
}: {
  active: NavTab;
  onTab: (t: NavTab) => void;
  onPlay: () => void;
}) {
  const { levelInfo, state } = useApp();
  const progress = levelProgress(state.user.xp);
  const isLegend = levelInfo.level >= 7;

  return (
    <>
      {/* ---------- Desktop top bar ---------- */}
      <header
        className="glass-strong"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(16px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <EyeWalkerLogo size={36} />
          <BrandName className="text-lg hidden sm:inline" />
        </div>

        <nav className="hidden md:flex" style={{ gap: 4, alignItems: "center" }}>
          {TABS.slice(0, 2).map((t) => (
            <TopTab key={t.id} tab={t} active={active === t.id} onClick={() => onTab(t.id)} />
          ))}
          <button
            onClick={onPlay}
            className="focus-ring"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              padding: "8px 16px",
              borderRadius: 10,
              margin: "0 4px",
              color: "#0a0a0f",
              fontWeight: 700,
              background: "linear-gradient(135deg,#00d4ff,#0ea5e9)",
              border: "none",
              boxShadow: "0 0 16px rgba(0,212,255,0.4)",
            }}
          >
            <Play size={16} fill="#0a0a0f" /> Séance
          </button>
          {TABS.slice(2).map((t) => (
            <TopTab key={t.id} tab={t} active={active === t.id} onClick={() => onTab(t.id)} />
          ))}
        </nav>

        <LevelChip level={levelInfo.level} name={levelInfo.name} progress={progress} legend={isLegend} />
      </header>

      {/* ---------- Mobile bottom tab bar ---------- */}
      <nav
        className="md:hidden"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: 64,
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          background: "rgba(10,10,15,0.8)",
          backdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <BottomTab tab={TABS[0]} active={active === "dashboard"} onClick={() => onTab("dashboard")} />
        <BottomTab tab={TABS[1]} active={active === "programme"} onClick={() => onTab("programme")} />
        <button
          onClick={onPlay}
          aria-label="Démarrer la séance du jour"
          className="focus-ring"
          style={{
            width: 58,
            height: 58,
            marginTop: -22,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#0a0a0f",
            background: "linear-gradient(135deg,#00d4ff,#0ea5e9)",
            border: "3px solid #0a0a0f",
            boxShadow: "0 0 24px rgba(0,212,255,0.6)",
          }}
        >
          <Play size={26} fill="#0a0a0f" />
        </button>
        <BottomTab tab={TABS[2]} active={active === "stats"} onClick={() => onTab("stats")} />
        <BottomTab tab={TABS[3]} active={active === "badges"} onClick={() => onTab("badges")} />
      </nav>
    </>
  );
}

function TopTab({
  tab,
  active,
  onClick,
}: {
  tab: { label: string; icon: typeof Home };
  active: boolean;
  onClick: () => void;
}) {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      className="focus-ring"
      aria-current={active ? "page" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        cursor: "pointer",
        padding: "8px 14px",
        borderRadius: 10,
        fontWeight: 600,
        fontSize: 14,
        background: active ? "rgba(255,255,255,0.06)" : "transparent",
        color: active ? "#00d4ff" : "#8888aa",
        border: "none",
      }}
    >
      <Icon size={16} /> {tab.label}
    </button>
  );
}

function BottomTab({
  tab,
  active,
  onClick,
}: {
  tab: { label: string; icon: typeof Home };
  active: boolean;
  onClick: () => void;
}) {
  const Icon = tab.icon;
  return (
    <button
      onClick={onClick}
      aria-label={tab.label}
      aria-current={active ? "page" : undefined}
      className="focus-ring"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 2,
        cursor: "pointer",
        background: "transparent",
        border: "none",
        color: active ? "#00d4ff" : "#8888aa",
        width: 60,
      }}
    >
      <Icon size={20} />
      <span style={{ fontSize: 10, fontWeight: 600 }}>{tab.label}</span>
    </button>
  );
}

function LevelChip({
  level,
  name,
  progress,
  legend,
}: {
  level: number;
  name: string;
  progress: number;
  legend: boolean;
}) {
  return (
    <motion.div
      className={legend ? "legend-glow" : ""}
      whileHover={{ scale: 1.03 }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "6px 12px",
        borderRadius: 999,
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    >
      <div
        className="font-display"
        style={{
          width: 30,
          height: 30,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 13,
          fontWeight: 800,
          color: "#0a0a0f",
          background: "linear-gradient(135deg,#a855f7,#00d4ff)",
        }}
      >
        {level}
      </div>
      <div className="hidden sm:block" style={{ minWidth: 84 }}>
        <div className="font-display" style={{ fontSize: 12, color: "#f0f0ff" }}>{name}</div>
        <div style={{ height: 4, background: "#2a2a40", borderRadius: 4, marginTop: 3, overflow: "hidden" }}>
          <div
            style={{
              height: "100%",
              width: `${Math.round(progress * 100)}%`,
              background: "linear-gradient(90deg,#a855f7,#00d4ff)",
              transition: "width 0.8s ease-out",
            }}
          />
        </div>
      </div>
    </motion.div>
  );
}
