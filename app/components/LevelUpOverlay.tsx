"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import type { LevelInfo } from "../lib/gamification";

export function LevelUpOverlay({ info, onDone }: { info: LevelInfo; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  const particles = Array.from({ length: 28 });
  const isLegend = info.level >= 7;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDone}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 120,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "radial-gradient(circle at center, rgba(20,20,45,0.85), rgba(4,4,8,0.95))",
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      {particles.map((_, i) => {
        const angle = (i / particles.length) * Math.PI * 2;
        const dist = 160 + Math.random() * 220;
        const colors = ["#00d4ff", "#a855f7", "#eab308", "#22c55e", "#ef4444"];
        return (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              opacity: 0,
              scale: 0.3,
            }}
            transition={{ duration: 1.4, ease: "easeOut", delay: 0.1 }}
            style={{
              position: "absolute",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: colors[i % colors.length],
              boxShadow: `0 0 12px ${colors[i % colors.length]}`,
            }}
          />
        );
      })}

      <motion.div
        initial={{ scale: 0.6, opacity: 0, rotateX: -30 }}
        animate={{ scale: 1, opacity: 1, rotateX: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 16 }}
        style={{ textAlign: "center", zIndex: 1 }}
        className={isLegend ? "legend-glow" : ""}
      >
        <div className="font-display" style={{ fontSize: 16, letterSpacing: "0.3em", color: "#00d4ff" }}>
          LEVEL UP
        </div>
        <div
          className="font-display text-glow"
          style={{ fontSize: 88, fontWeight: 900, color: "#f0f0ff", lineHeight: 1, margin: "8px 0" }}
        >
          {info.level}
        </div>
        <div
          className="font-display"
          style={{
            fontSize: 26,
            fontWeight: 800,
            background: "linear-gradient(90deg,#a855f7,#00d4ff)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {info.name}
        </div>
      </motion.div>
    </motion.div>
  );
}
