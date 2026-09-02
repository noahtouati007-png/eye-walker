"use client";

import { motion } from "framer-motion";

export function EyeWalkerLogo({ size = 40 }: { size?: number }) {
  const id = "ew-logo";
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-label="Logo Eye-Walker"
      role="img"
      animate={{ scale: [1, 1.05, 1], opacity: [1, 0.85, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    >
      <defs>
        <radialGradient id={`${id}-iris`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00d4ff" />
          <stop offset="65%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#4c1d95" />
        </radialGradient>
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.6" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M6 32 Q32 10 58 32 Q32 54 6 32 Z"
        fill="none"
        stroke="#00d4ff"
        strokeWidth="2"
        opacity="0.9"
        filter={`url(#${id}-glow)`}
      />
      <circle cx="32" cy="32" r="12.5" fill={`url(#${id}-iris)`} />
      <circle cx="32" cy="32" r="5" fill="#0a0a0f" />
      <circle cx="28.8" cy="28.8" r="1.9" fill="#ffffff" opacity="0.9" />
    </motion.svg>
  );
}

export function BrandName({ className = "" }: { className?: string }) {
  return (
    <span
      className={`font-display tracking-brand text-glow ${className}`}
      style={{ color: "#00d4ff" }}
    >
      EYE-WALKER
    </span>
  );
}
