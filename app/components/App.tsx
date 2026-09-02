"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "./AppProvider";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { Navigation, type NavTab } from "./Navigation";
import { Onboarding } from "./Onboarding";
import { Dashboard } from "./Dashboard";
import { Programme } from "./Programme";
import { Badges } from "./Badges";
import { SessionDetail } from "./SessionDetail";
import { LevelUpOverlay } from "./LevelUpOverlay";
import { EyeWalkerLogo } from "./Logo";
import { WEEK_LAYOUT } from "../lib/theme";
import {
  currentPhase,
  recommendedDifficulty,
  enforcePhaseDifficulty,
  weekNumberSince,
} from "../lib/progressiveOverload";
import { variantCount } from "../lib/workouts";
import type { SessionType, Difficulty } from "../lib/types";

export interface SessionRef {
  type: SessionType;
  difficulty: Difficulty;
  week: number;
  phaseIndex: number;
  variantIndex: number;
}

// Stats pulls in Recharts — client-only.
const Stats = dynamic(() => import("./Stats").then((m) => m.Stats), {
  ssr: false,
  loading: () => <PageSkeleton />,
});

export default function App() {
  const { state, hydrated, onboardedGate, levelUpInfo, clearLevelUp } = useAppGates();
  const [tab, setTab] = useState<NavTab>("dashboard");
  const [modal, setModal] = useState<SessionRef | null>(null);

  // Per-session difficulty selection (persisted, resolved against phase).
  const [difficulties, setDifficulties] = useLocalStorage<Partial<Record<SessionType, Difficulty>>>(
    "ew_difficulties",
    {}
  );
  // Per-session variant override (persisted). Overrides the weekly rotation.
  const [variantOverrides, setVariantOverrides] = useLocalStorage<Partial<Record<SessionType, number>>>(
    "ew_variants",
    {}
  );

  const phase = currentPhase(state.user.startDate);
  const currentWeek = weekNumberSince(state.user.startDate);

  const getDifficulty = useCallback(
    (type: SessionType): Difficulty => {
      const stored = difficulties[type] ?? recommendedDifficulty(phase.index);
      return enforcePhaseDifficulty(phase.index, stored);
    },
    [difficulties, phase.index]
  );

  const setDifficulty = useCallback(
    (type: SessionType, d: Difficulty) => {
      setDifficulties((prev) => ({ ...prev, [type]: d }));
    },
    [setDifficulties]
  );

  const getVariantIndex = useCallback(
    (type: SessionType, week: number): number => {
      const override = variantOverrides[type];
      if (override !== undefined) return override % variantCount(type);
      return week % variantCount(type);
    },
    [variantOverrides]
  );

  const cycleVariant = useCallback(
    (type: SessionType, week: number) => {
      setVariantOverrides((prev) => {
        const current = prev[type] ?? week % variantCount(type);
        return { ...prev, [type]: (current + 1) % variantCount(type) };
      });
    },
    [setVariantOverrides]
  );

  const openSession = useCallback(
    (type: SessionType, week: number = currentWeek, phaseIndex: number = phase.index) =>
      setModal({
        type,
        difficulty: enforcePhaseDifficulty(
          phaseIndex,
          difficulties[type] ?? recommendedDifficulty(phaseIndex)
        ),
        week,
        phaseIndex,
        variantIndex: getVariantIndex(type, week),
      }),
    [currentWeek, phase.index, difficulties, getVariantIndex]
  );

  const todayType = WEEK_LAYOUT[(new Date().getDay() + 6) % 7].type;

  if (!hydrated) return <BootSkeleton />;
  if (!onboardedGate) return <Onboarding />;

  return (
    <div style={{ minHeight: "100dvh", paddingBottom: 80 }}>
      <Navigation active={tab} onTab={setTab} onPlay={() => openSession(todayType)} />

      <main style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 16px 40px" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {tab === "dashboard" && (
              <Dashboard
                onOpenSession={openSession}
                getDifficulty={getDifficulty}
                getVariantIndex={getVariantIndex}
                currentWeek={currentWeek}
                phaseIndex={phase.index}
              />
            )}
            {tab === "programme" && (
              <Programme
                onOpenSession={openSession}
                getDifficulty={getDifficulty}
                setDifficulty={setDifficulty}
                getVariantIndex={getVariantIndex}
                cycleVariant={cycleVariant}
              />
            )}
            {tab === "stats" && <Stats />}
            {tab === "badges" && <Badges />}
          </motion.div>
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {modal && (
          <SessionDetail
            type={modal.type}
            difficulty={modal.difficulty}
            week={modal.week}
            phaseIndex={modal.phaseIndex}
            variantIndex={modal.variantIndex}
            onClose={() => setModal(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {levelUpInfo && <LevelUpOverlay info={levelUpInfo} onDone={clearLevelUp} />}
      </AnimatePresence>
    </div>
  );
}

// Small wrapper so we read the context in one place.
function useAppGates() {
  const { state, hydrated, levelUpInfo, clearLevelUp } = useApp();
  return { state, hydrated, onboardedGate: state.onboarded, levelUpInfo, clearLevelUp };
}

function BootSkeleton() {
  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
      }}
    >
      <EyeWalkerLogo size={72} />
      <div className="font-display tracking-brand" style={{ color: "#8888aa", fontSize: 13 }}>
        CHARGEMENT…
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {[0, 1, 2].map((i) => (
        <div key={i} className="glass shimmer" style={{ height: 160, borderRadius: 16 }} aria-hidden />
      ))}
    </div>
  );
}
