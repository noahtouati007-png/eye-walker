"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "./AppProvider";
import { EyeWalkerLogo, BrandName } from "./Logo";
import { paceToString } from "./ui";

type HyroxLevel = "Débutant" | "Intermédiaire" | "Elite" | "Solo Pro";

const LEVEL_DEFAULTS: Record<HyroxLevel, { vma: number; fcmax: number; pace: number }> = {
  "Débutant": { vma: 14, fcmax: 195, pace: 300 },
  "Intermédiaire": { vma: 16, fcmax: 192, pace: 270 },
  "Elite": { vma: 17.5, fcmax: 190, pace: 255 },
  "Solo Pro": { vma: 18, fcmax: 190, pace: 250 },
};

export function Onboarding() {
  const { finishOnboarding } = useApp();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [level, setLevel] = useState<HyroxLevel>("Solo Pro");
  const [vma, setVma] = useState(18);
  const [fcmax, setFcmax] = useState(190);
  const [paceMin, setPaceMin] = useState(4);
  const [paceSec, setPaceSec] = useState(10);

  const pickLevel = (l: HyroxLevel) => {
    setLevel(l);
    const d = LEVEL_DEFAULTS[l];
    setVma(d.vma);
    setFcmax(d.fcmax);
    setPaceMin(Math.floor(d.pace / 60));
    setPaceSec(d.pace % 60);
  };

  const finish = () => {
    finishOnboarding({
      name: name.trim() || "Athlète",
      vma,
      fcmax,
      thresholdPace: paceMin * 60 + paceSec,
      startDate: new Date().toISOString(),
    });
  };

  const canNext = step === 1 ? name.trim().length > 0 : true;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "radial-gradient(circle at 50% 20%, #14142a, #0a0a0f 70%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="glass-strong glass"
        style={{ width: "100%", maxWidth: 440, padding: 28 }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <EyeWalkerLogo size={72} />
          <BrandName className="text-2xl" />
          <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                style={{
                  width: 28,
                  height: 4,
                  borderRadius: 4,
                  background: s <= step ? "#00d4ff" : "#2a2a40",
                  transition: "background 0.3s",
                }}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {step === 1 && (
              <Field title="Bienvenue, athlète. Quel est ton prénom ?">
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canNext && setStep(2)}
                  placeholder="Ton prénom"
                  className="focus-ring"
                  style={inputStyle}
                  aria-label="Prénom"
                />
              </Field>
            )}

            {step === 2 && (
              <Field title="Ton niveau Hyrox ?">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {(Object.keys(LEVEL_DEFAULTS) as HyroxLevel[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => pickLevel(l)}
                      className="focus-ring"
                      style={{
                        cursor: "pointer",
                        padding: "16px 12px",
                        borderRadius: 12,
                        fontWeight: 700,
                        color: level === l ? "#0a0a0f" : "#f0f0ff",
                        background:
                          level === l ? "linear-gradient(135deg,#00d4ff,#a855f7)" : "rgba(255,255,255,0.05)",
                        border: `1px solid ${level === l ? "transparent" : "rgba(255,255,255,0.1)"}`,
                        boxShadow: level === l ? "0 0 20px rgba(168,85,247,0.4)" : "none",
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
                {level === "Solo Pro" && (
                  <p style={{ color: "#00d4ff", fontSize: 12, marginTop: 12, textAlign: "center" }}>
                    Mode Solo Pro — difficulté Moyen et volumes élevés pré-sélectionnés.
                  </p>
                )}
              </Field>
            )}

            {step === 3 && (
              <Field title="Tes paramètres physiologiques">
                <NumberRow label="VMA (km/h)" value={vma} onChange={setVma} step={0.5} min={8} max={25} />
                <NumberRow label="FCmax (bpm)" value={fcmax} onChange={setFcmax} step={1} min={140} max={220} />
                <div style={{ marginTop: 8 }}>
                  <label style={labelStyle}>Allure seuil (min/km)</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <input
                      type="number"
                      value={paceMin}
                      min={2}
                      max={9}
                      onChange={(e) => setPaceMin(Number(e.target.value))}
                      className="focus-ring"
                      style={{ ...inputStyle, width: 80 }}
                      aria-label="Minutes allure seuil"
                    />
                    <span className="font-display" style={{ fontSize: 20 }}>:</span>
                    <input
                      type="number"
                      value={paceSec}
                      min={0}
                      max={59}
                      onChange={(e) => setPaceSec(Number(e.target.value))}
                      className="focus-ring"
                      style={{ ...inputStyle, width: 80 }}
                      aria-label="Secondes allure seuil"
                    />
                    <span style={{ color: "#8888aa", fontSize: 13 }}>/km</span>
                  </div>
                </div>
              </Field>
            )}

            {step === 4 && (
              <Field title="Récapitulatif">
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <SummaryRow k="Prénom" v={name || "Athlète"} />
                  <SummaryRow k="Niveau" v={level} />
                  <SummaryRow k="VMA" v={`${vma} km/h`} />
                  <SummaryRow k="FCmax" v={`${fcmax} bpm`} />
                  <SummaryRow k="Allure seuil" v={`${paceToString(paceMin * 60 + paceSec)} /km`} />
                </div>
              </Field>
            )}
          </motion.div>
        </AnimatePresence>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, gap: 12 }}>
          {step > 1 ? (
            <button onClick={() => setStep(step - 1)} className="focus-ring" style={ghostBtn}>
              Retour
            </button>
          ) : (
            <span />
          )}
          {step < 4 ? (
            <button
              onClick={() => canNext && setStep(step + 1)}
              disabled={!canNext}
              className="focus-ring"
              style={{ ...primaryBtn, opacity: canNext ? 1 : 0.5 }}
            >
              Continuer
            </button>
          ) : (
            <button onClick={finish} className="focus-ring" style={primaryBtn}>
              Let&apos;s go 🔥
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function Field({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-display" style={{ fontSize: 18, marginBottom: 16, color: "#f0f0ff" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function NumberRow({
  label,
  value,
  onChange,
  step,
  min,
  max,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  step: number;
  min: number;
  max: number;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={labelStyle}>{label}</label>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="focus-ring"
        style={inputStyle}
        aria-label={label}
      />
    </div>
  );
}

function SummaryRow({ k, v }: { k: string; v: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "10px 14px",
        borderRadius: 10,
        background: "rgba(255,255,255,0.04)",
      }}
    >
      <span style={{ color: "#8888aa" }}>{k}</span>
      <span className="font-display" style={{ color: "#f0f0ff" }}>{v}</span>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 10,
  padding: "12px 14px",
  color: "#f0f0ff",
  fontSize: 16,
  outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  color: "#8888aa",
  marginBottom: 6,
};

const primaryBtn: React.CSSProperties = {
  cursor: "pointer",
  background: "linear-gradient(135deg,#00d4ff,#a855f7)",
  color: "#0a0a0f",
  border: "none",
  borderRadius: 12,
  padding: "12px 22px",
  fontWeight: 800,
  fontSize: 15,
};

const ghostBtn: React.CSSProperties = {
  cursor: "pointer",
  background: "transparent",
  color: "#8888aa",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  padding: "12px 22px",
  fontWeight: 600,
};
