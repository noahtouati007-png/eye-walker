"use client";

let audioCtx: AudioContext | null = null;

function ctx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!audioCtx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === "suspended") void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

function tone(freq: number, durationMs: number, startOffset = 0, volume = 0.2) {
  const ac = ctx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  const t0 = ac.currentTime + startOffset;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.01);
  gain.gain.linearRampToValueAtTime(0, t0 + durationMs / 1000);
  osc.connect(gain).connect(ac.destination);
  osc.start(t0);
  osc.stop(t0 + durationMs / 1000 + 0.02);
}

/** Simple 880Hz beep, 200ms — end of a block. */
export function beepBlockEnd() {
  tone(880, 200);
}

/** Ascending 3-note tone — end of session. */
export function beepSessionEnd() {
  tone(523.25, 180, 0); // C5
  tone(659.25, 180, 0.2); // E5
  tone(783.99, 320, 0.4); // G5
}

export async function fireConfetti() {
  if (typeof window === "undefined") return;
  try {
    const mod = await import("canvas-confetti");
    const confetti = mod.default;
    const colors = ["#00d4ff", "#a855f7", "#22c55e", "#eab308", "#ef4444"];
    confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 }, colors });
    setTimeout(
      () => confetti({ particleCount: 60, angle: 60, spread: 55, origin: { x: 0 }, colors }),
      150
    );
    setTimeout(
      () => confetti({ particleCount: 60, angle: 120, spread: 55, origin: { x: 1 }, colors }),
      300
    );
  } catch {
    /* confetti optional */
  }
}
