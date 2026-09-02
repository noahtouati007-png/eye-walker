"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Lock, X, Share2 } from "lucide-react";
import { useApp } from "./AppProvider";
import { BADGE_DEFS } from "../lib/badges";
import type { Badge } from "../lib/types";

export function Badges() {
  const { state } = useApp();
  const [selected, setSelected] = useState<Badge | null>(null);

  const badges = BADGE_DEFS.map((def) => state.badges[def.id]).filter(Boolean);
  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <h1 className="font-display" style={{ fontSize: 24, fontWeight: 800 }}>Badges</h1>
        <div className="font-display" style={{ color: "#8888aa", fontSize: 14 }}>
          <span style={{ color: "#00d4ff" }}>{unlockedCount}</span> / {badges.length}
        </div>
      </div>

      <div className="badge-grid" style={{ display: "grid", gap: 12 }}>
        {badges.map((b) => (
          <BadgeCard key={b.id} badge={b} onClick={() => b.unlocked && setSelected(b)} />
        ))}
      </div>

      <AnimatePresence>
        {selected && <BadgeModal badge={selected} onClose={() => setSelected(null)} />}
      </AnimatePresence>

      <style>{`
        .badge-grid { grid-template-columns: repeat(3, 1fr); }
        @media (min-width: 768px) { .badge-grid { grid-template-columns: repeat(5, 1fr); } }
      `}</style>
    </div>
  );
}

function BadgeCard({ badge, onClick }: { badge: Badge; onClick: () => void }) {
  const locked = !badge.unlocked;
  const secret = locked && badge.hidden;

  return (
    <motion.button
      onClick={onClick}
      whileHover={badge.unlocked ? { scale: 1.05, rotateY: 8 } : {}}
      className="focus-ring"
      aria-label={secret ? "Badge secret verrouillé" : `${badge.name}${locked ? " (verrouillé)" : ""}`}
      style={{
        cursor: badge.unlocked ? "pointer" : "default",
        position: "relative",
        aspectRatio: "1",
        borderRadius: 16,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        padding: 8,
        textAlign: "center",
        border: badge.unlocked ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,255,255,0.05)",
        background: badge.unlocked
          ? "linear-gradient(135deg, rgba(168,85,247,0.18), rgba(0,212,255,0.1))"
          : "rgba(255,255,255,0.02)",
        boxShadow: badge.unlocked ? "0 0 18px rgba(168,85,247,0.25)" : "none",
      }}
    >
      <div
        style={{
          fontSize: 30,
          filter: locked ? "grayscale(1) blur(1px)" : "none",
          opacity: locked ? 0.5 : 1,
        }}
      >
        {secret ? "❓" : badge.icon}
      </div>
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: badge.unlocked ? "#f0f0ff" : "#8888aa",
          lineHeight: 1.2,
        }}
      >
        {secret ? "Badge Secret" : badge.name}
      </div>
      {locked && (
        <Lock size={12} color="#8888aa" style={{ position: "absolute", top: 8, right: 8 }} />
      )}
    </motion.button>
  );
}

function BadgeModal({ badge, onClose }: { badge: Badge; onClose: () => void }) {
  const share = async () => {
    const text = `J'ai débloqué le badge "${badge.name}" sur Eye-Walker ! 🏆`;
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: "Eye-Walker", text });
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        toast.success("Copié dans le presse-papiers");
      }
    } catch {
      /* user cancelled */
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 70,
        background: "rgba(4,4,8,0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <motion.div
        initial={{ rotateY: 180, opacity: 0, scale: 0.8 }}
        animate={{ rotateY: 0, opacity: 1, scale: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
        className="glass"
        style={{ padding: 28, maxWidth: 340, width: "100%", textAlign: "center", position: "relative" }}
      >
        <button
          onClick={onClose}
          aria-label="Fermer"
          className="focus-ring"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            background: "transparent",
            border: "none",
            color: "#8888aa",
            cursor: "pointer",
          }}
        >
          <X size={18} />
        </button>
        <div style={{ fontSize: 56, marginBottom: 10 }}>{badge.icon}</div>
        <h2 className="font-display" style={{ fontSize: 22, fontWeight: 800, color: "#f0f0ff" }}>{badge.name}</h2>
        <p style={{ color: "#8888aa", fontSize: 14, margin: "10px 0 16px" }}>{badge.description}</p>
        {badge.unlockedAt && (
          <div style={{ fontSize: 12, color: "#22c55e", marginBottom: 16 }}>
            Débloqué le {new Date(badge.unlockedAt).toLocaleDateString("fr-FR")}
          </div>
        )}
        <button
          onClick={share}
          className="focus-ring"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            cursor: "pointer",
            padding: "10px 20px",
            borderRadius: 12,
            border: "none",
            fontWeight: 700,
            color: "#0a0a0f",
            background: "linear-gradient(135deg,#a855f7,#00d4ff)",
          }}
        >
          <Share2 size={16} /> Partager
        </button>
      </motion.div>
    </motion.div>
  );
}
