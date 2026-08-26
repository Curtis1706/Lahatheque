"use client";

import React, { useEffect, useId, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_IN_OUT } from "./loader-utils/ease";

export type LoaderVariant =
  | "spinner"
  | "dots"
  | "bars"
  | "dot-matrix"
  | "dither"
  | "ascii"
  | "ascii-line"
  | "ascii-braille"
  | "ascii-blocks"
  | "ascii-bounce"
  | "morph"
  | "comet"
  | "scramble"
  | "metaballs"
  | "newton"
  | "helix"
  | "percent";

export interface LoaderProps {
  variant?: LoaderVariant;
  size?: number;
  speed?: number;
  label?: string;
  className?: string;
}

export function Loader({
  variant = "dots",
  size = 28,
  speed = 1,
  label = "Chargement",
  className = "",
}: LoaderProps) {
  const shouldReduceMotion = useReducedMotion();
  const filterId = useId();

  // Mode réduction de mouvement : pulsation d'opacité calme
  if (shouldReduceMotion) {
    return (
      <div
        role="status"
        aria-label={label}
        className={`inline-flex items-center justify-center ${className}`}
        style={{ width: size, height: size }}
      >
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-full h-full rounded-full bg-current"
        />
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  const duration = Math.max(0.2, speed);

  return (
    <div
      role="status"
      aria-label={label}
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      {renderVariant(variant, size, duration, filterId)}
      <span className="sr-only">{label}</span>
    </div>
  );
}

function renderVariant(
  variant: LoaderVariant,
  size: number,
  duration: number,
  filterId: string
) {
  switch (variant) {
    case "dots":
      return <DotsLoader size={size} duration={duration} />;
    case "spinner":
      return <SpinnerLoader size={size} duration={duration} />;
    case "bars":
      return <BarsLoader size={size} duration={duration} />;
    case "dot-matrix":
      return <DotMatrixLoader size={size} duration={duration} />;
    case "dither":
      return <DitherLoader size={size} duration={duration} />;
    case "ascii":
    case "ascii-line":
    case "ascii-braille":
    case "ascii-blocks":
    case "ascii-bounce":
      return <AsciiLoader variant={variant} size={size} duration={duration} />;
    case "morph":
      return <MorphLoader size={size} duration={duration} />;
    case "comet":
      return <CometLoader size={size} duration={duration} />;
    case "scramble":
      return <ScrambleLoader size={size} duration={duration} />;
    case "metaballs":
      return <MetaballsLoader size={size} duration={duration} filterId={filterId} />;
    case "newton":
      return <NewtonLoader size={size} duration={duration} />;
    case "helix":
      return <HelixLoader size={size} duration={duration} />;
    case "percent":
      return <PercentLoader size={size} duration={duration} />;
    default:
      return <DotsLoader size={size} duration={duration} />;
  }
}

// --- 1. Dots (Variante principale pour LAHAThèque) ---
function DotsLoader({ size, duration }: { size: number; duration: number }) {
  const dotSize = Math.max(3, Math.round(size * 0.22));
  const gap = Math.max(2, Math.round(size * 0.12));

  return (
    <div className="flex items-center justify-center" style={{ gap }}>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="rounded-full bg-current block"
          style={{ width: dotSize, height: dotSize }}
          animate={{
            y: [0, -dotSize * 1.1, 0],
            opacity: [0.4, 1, 0.4],
            scale: [0.85, 1.15, 0.85],
          }}
          transition={{
            duration: duration * 0.9,
            repeat: Infinity,
            delay: i * (duration * 0.18),
            ease: EASE_IN_OUT,
          }}
        />
      ))}
    </div>
  );
}

// --- 2. Spinner classique fluide ---
function SpinnerLoader({ size, duration }: { size: number; duration: number }) {
  const strokeWidth = Math.max(2, Math.round(size * 0.12));
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      animate={{ rotate: 360 }}
      transition={{ duration: duration * 0.8, repeat: Infinity, ease: "linear" }}
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeOpacity="0.2"
      />
      <motion.circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray="16 40"
      />
    </motion.svg>
  );
}

// --- 3. Bars ---
function BarsLoader({ size, duration }: { size: number; duration: number }) {
  const barWidth = Math.max(2, Math.round(size * 0.14));
  const barHeight = Math.max(8, Math.round(size * 0.75));
  const gap = Math.max(2, Math.round(size * 0.1));

  return (
    <div className="flex items-center justify-center" style={{ gap, height: size }}>
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="rounded-full bg-current"
          style={{ width: barWidth, height: barHeight }}
          animate={{
            scaleY: [0.3, 1, 0.3],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: duration * 0.8,
            repeat: Infinity,
            delay: i * (duration * 0.15),
            ease: EASE_IN_OUT,
          }}
        />
      ))}
    </div>
  );
}

// --- 4. Dot Matrix ---
function DotMatrixLoader({ size, duration }: { size: number; duration: number }) {
  const dotSize = Math.max(2, Math.round(size * 0.18));
  const gap = Math.max(2, Math.round(size * 0.12));

  return (
    <div
      className="grid grid-cols-3 grid-rows-3"
      style={{ width: size, height: size, gap }}
    >
      {Array.from({ length: 9 }).map((_, i) => (
        <motion.div
          key={i}
          className="rounded-full bg-current"
          style={{ width: dotSize, height: dotSize }}
          animate={{
            opacity: [0.2, 1, 0.2],
            scale: [0.7, 1.1, 0.7],
          }}
          transition={{
            duration: duration * 1.2,
            repeat: Infinity,
            delay: ((i % 3) + Math.floor(i / 3)) * (duration * 0.15),
            ease: EASE_IN_OUT,
          }}
        />
      ))}
    </div>
  );
}

// --- 5. Dither ---
function DitherLoader({ size, duration }: { size: number; duration: number }) {
  const cellSize = Math.max(2, Math.round(size / 4));
  return (
    <div
      className="grid grid-cols-4 grid-rows-4"
      style={{ width: size, height: size }}
    >
      {Array.from({ length: 16 }).map((_, i) => (
        <motion.div
          key={i}
          className="bg-current"
          style={{ width: cellSize, height: cellSize }}
          animate={{
            opacity: [0.1, 0.9, 0.1],
          }}
          transition={{
            duration: duration * 0.9,
            repeat: Infinity,
            delay: ((i * 7) % 16) * (duration * 0.05),
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// --- 6. ASCII Loader ---
const ASCII_FRAMES: Record<string, string[]> = {
  ascii: ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"],
  "ascii-line": ["-", "\\", "|", "/"],
  "ascii-braille": ["⣾", "⣽", "⣻", "⢿", "⡿", "⣟", "⣯", "⣷"],
  "ascii-blocks": [" ", "▃", "▄", "▅", "▆", "▇", "█", "▇", "▆", "▅", "▄", "▃"],
  "ascii-bounce": ["⠁", "⠂", "⠄", "⠂"],
};

function AsciiLoader({
  variant,
  size,
  duration,
}: {
  variant: string;
  size: number;
  duration: number;
}) {
  const frames = ASCII_FRAMES[variant] || ASCII_FRAMES.ascii;
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    const intervalMs = (duration * 1000) / frames.length;
    const timer = setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [duration, frames.length]);

  return (
    <span
      className="font-mono font-bold leading-none select-none flex items-center justify-center text-current"
      style={{ fontSize: Math.max(12, Math.round(size * 0.8)) }}
    >
      {frames[frameIndex]}
    </span>
  );
}

// --- 7. Morph Shape ---
function MorphLoader({ size, duration }: { size: number; duration: number }) {
  return (
    <motion.div
      className="bg-current"
      style={{ width: size * 0.7, height: size * 0.7 }}
      animate={{
        borderRadius: ["20%", "50%", "20%"],
        rotate: [0, 180, 360],
        scale: [0.8, 1.1, 0.8],
      }}
      transition={{
        duration: duration * 1.5,
        repeat: Infinity,
        ease: EASE_IN_OUT,
      }}
    />
  );
}

// --- 8. Comet ---
function CometLoader({ size, duration }: { size: number; duration: number }) {
  const strokeWidth = Math.max(2, Math.round(size * 0.12));
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      animate={{ rotate: 360 }}
      transition={{ duration: duration * 0.9, repeat: Infinity, ease: "linear" }}
    >
      <circle
        cx="16"
        cy="16"
        r="12"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeDasharray="20 60"
        strokeLinecap="round"
      />
    </motion.svg>
  );
}

// --- 9. Scramble ---
function ScrambleLoader({ size, duration }: { size: number; duration: number }) {
  const chars = ["0", "1", "X", "#", "+", "~", "•"];
  const [char, setChar] = useState("0");

  useEffect(() => {
    const timer = setInterval(() => {
      setChar(chars[Math.floor(Math.random() * chars.length)]);
    }, 120);
    return () => clearInterval(timer);
  }, []);

  return (
    <span
      className="font-mono font-bold select-none text-current"
      style={{ fontSize: Math.max(12, Math.round(size * 0.75)) }}
    >
      {char}
    </span>
  );
}

// --- 10. Metaballs (utilisant useId pour le filtre SVG) ---
function MetaballsLoader({
  size,
  duration,
  filterId,
}: {
  size: number;
  duration: number;
  filterId: string;
}) {
  const ballSize = Math.max(6, Math.round(size * 0.35));
  const filterKey = `goo-${filterId.replace(/:/g, "")}`;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute w-0 h-0">
        <defs>
          <filter id={filterKey}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
      <div
        className="flex items-center justify-center relative w-full h-full"
        style={{ filter: `url(#${filterKey})` }}
      >
        <motion.div
          className="rounded-full bg-current absolute"
          style={{ width: ballSize, height: ballSize }}
          animate={{ x: [-size * 0.22, size * 0.22, -size * 0.22] }}
          transition={{ duration: duration * 1.1, repeat: Infinity, ease: EASE_IN_OUT }}
        />
        <motion.div
          className="rounded-full bg-current absolute"
          style={{ width: ballSize, height: ballSize }}
          animate={{ x: [size * 0.22, -size * 0.22, size * 0.22] }}
          transition={{ duration: duration * 1.1, repeat: Infinity, ease: EASE_IN_OUT }}
        />
      </div>
    </div>
  );
}

// --- 11. Newton Cradle ---
function NewtonLoader({ size, duration }: { size: number; duration: number }) {
  const ballSize = Math.max(4, Math.round(size * 0.2));
  return (
    <div className="flex items-center justify-center" style={{ gap: 2, height: size }}>
      <motion.div
        className="rounded-full bg-current"
        style={{ width: ballSize, height: ballSize }}
        animate={{ x: [0, -ballSize * 1.2, 0] }}
        transition={{ duration: duration * 0.8, repeat: Infinity, ease: EASE_IN_OUT }}
      />
      <div className="rounded-full bg-current" style={{ width: ballSize, height: ballSize }} />
      <motion.div
        className="rounded-full bg-current"
        style={{ width: ballSize, height: ballSize }}
        animate={{ x: [0, ballSize * 1.2, 0] }}
        transition={{ duration: duration * 0.8, repeat: Infinity, delay: duration * 0.4, ease: EASE_IN_OUT }}
      />
    </div>
  );
}

// --- 12. Helix ---
function HelixLoader({ size, duration }: { size: number; duration: number }) {
  const dotSize = Math.max(3, Math.round(size * 0.18));
  return (
    <div className="flex items-center justify-center" style={{ gap: 3, width: size }}>
      {[0, 1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="rounded-full bg-current"
          style={{ width: dotSize, height: dotSize }}
          animate={{
            y: [-size * 0.25, size * 0.25, -size * 0.25],
            scale: [0.7, 1.2, 0.7],
          }}
          transition={{
            duration: duration * 0.9,
            repeat: Infinity,
            delay: i * (duration * 0.14),
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// --- 13. Percent ---
function PercentLoader({ size, duration }: { size: number; duration: number }) {
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const stepMs = (duration * 1000) / 100;
    const timer = setInterval(() => {
      setPct((p) => (p >= 99 ? 0 : p + 1));
    }, stepMs);
    return () => clearInterval(timer);
  }, [duration]);

  return (
    <span
      className="font-mono font-bold text-current select-none text-center"
      style={{ fontSize: Math.max(10, Math.round(size * 0.4)) }}
    >
      {pct}%
    </span>
  );
}
