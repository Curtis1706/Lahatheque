"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";

const W = 1080;
const H = 1920;
const BASE = { x: 540, y: 1790 };
const RAD = Math.PI / 180;

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function cub(p: { x: number; y: number }[], u: number) {
  const m = 1 - u;
  const a = m * m * m;
  const b = 3 * m * m * u;
  const c = 3 * m * u * u;
  const d = u * u * u;
  return {
    x: a * p[0].x + b * p[1].x + c * p[2].x + d * p[3].x,
    y: a * p[0].y + b * p[1].y + c * p[2].y + d * p[3].y,
  };
}

function cubTan(p: { x: number; y: number }[], u: number) {
  const m = 1 - u;
  const a = 3 * m * m;
  const b = 6 * m * u;
  const c = 3 * u * u;
  return {
    x: a * (p[1].x - p[0].x) + b * (p[2].x - p[1].x) + c * (p[3].x - p[2].x),
    y: a * (p[1].y - p[0].y) + b * (p[2].y - p[1].y) + c * (p[3].y - p[2].y),
  };
}

const fmt = (p: { x: number; y: number }) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`;

interface TreeData {
  trunk: { d: string };
  branches: { d: string; ord: number; fromU: number }[];
  twigs: { d: string; ord: number; y: number }[];
  leaves: { x: number; y: number; ang: number; len: number; w: number; phase: number; ord: number }[];
}

function buildTreeData(): TreeData {
  const r = rng(20260830);
  const TR = [
    { x: 540, y: BASE.y },
    { x: 532, y: 1620 },
    { x: 548, y: 1420 },
    { x: 540, y: 1250 },
  ];
  const trunk = { d: `M ${fmt(TR[0])} C ${fmt(TR[1])} ${fmt(TR[2])} ${fmt(TR[3])}` };
  const trunkAt = (u: number) => cub(TR, u);

  const branches: { d: string; ord: number; fromU: number }[] = [];
  const twigs: { d: string; ord: number; y: number }[] = [];
  const leaves: { x: number; y: number; ang: number; len: number; w: number; phase: number; ord: number }[] = [];

  const N = 5;
  for (let i = 0; i < N; i++) {
    const t = (i - (N - 1) / 2) / ((N - 1) / 2);
    const tt = t + (r() - 0.5) * 0.06;
    const S = trunkAt(1 - 0.4 * Math.abs(tt));
    const topY = 320 + Math.abs(tt) * 430 + (r() - 0.5) * 50;
    const tipX = BASE.x + tt * 385 * (1 + (r() - 0.5) * 0.1);
    const tip = { x: tipX, y: topY };
    const c1 = { x: S.x + tt * 105, y: S.y - 200 };
    const c2 = { x: tipX - tt * 90, y: topY + 330 };
    const seg = [S, c1, c2, tip];
    const d = `M ${fmt(S)} C ${fmt(c1)} ${fmt(c2)} ${fmt(tip)}`;
    const at = (u: number) => cub(seg, u);
    const tanAt = (u: number) => cubTan(seg, u);
    branches.push({ d, ord: i / (N - 1), fromU: 1 - 0.4 * Math.abs(tt) });

    const nT = 2 + (r() > 0.4 ? 1 : 0);
    for (let k = 0; k < nT; k++) {
      const u = 0.42 + k * 0.2 + r() * 0.07;
      const P = at(u);
      const tg = tanAt(u);
      const baseAng = Math.atan2(tg.y, tg.x);
      const side = (k % 2 === 0 ? 1 : -1) * (tt >= 0 ? 1 : -1);
      const ang = baseAng + side * (44 + r() * 26) * RAD;
      const len = 80 + r() * 56;
      const end = { x: P.x + Math.cos(ang) * len, y: P.y + Math.sin(ang) * len };
      const ca = ang - side * 16 * RAD;
      const ctrl = { x: P.x + Math.cos(ca) * len * 0.55, y: P.y + Math.sin(ca) * len * 0.55 };
      twigs.push({ d: `M ${fmt(P)} Q ${fmt(ctrl)} ${fmt(end)}`, ord: 0, y: end.y });
      leaves.push({
        x: end.x,
        y: end.y,
        ang: ang / RAD,
        len: 84 + r() * 26,
        w: 34 + r() * 9,
        phase: r() * 6.28,
        ord: 0,
      });
    }
    const tg = tanAt(1);
    leaves.push({
      x: tip.x,
      y: tip.y,
      ang: Math.atan2(tg.y, tg.x) / RAD,
      len: 90 + r() * 22,
      w: 36 + r() * 8,
      phase: r() * 6.28,
      ord: 0,
    });
  }

  const byY = <T extends { y: number; ord: number }>(arr: T[]) => {
    const idx = arr.map((_, i) => i).sort((a, b) => arr[b].y - arr[a].y);
    idx.forEach((id, rank) => {
      arr[id].ord = arr.length > 1 ? rank / (arr.length - 1) : 0;
    });
  };

  byY(twigs);
  byY(leaves);
  return { trunk, branches, twigs, leaves };
}

const TREE = buildTreeData();

function leafPath(len: number, w: number) {
  return `M 0,0 Q ${(len * 0.5).toFixed(1)},${(-w / 2).toFixed(1)} ${len.toFixed(1)},0 Q ${(len * 0.5).toFixed(1)},${(w / 2).toFixed(1)} 0,0`;
}

const Easing = {
  easeInOutSine: (t: number) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeOutBack: (t: number) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

function animate({
  from = 0,
  to = 1,
  start = 0,
  end = 1,
  ease = (t: number) => t,
}: {
  from?: number;
  to?: number;
  start: number;
  end: number;
  ease?: (t: number) => number;
}) {
  return (t: number) => {
    if (t <= start) return from;
    if (t >= end) return to;
    const local = (t - start) / (end - start);
    return from + (to - from) * ease(local);
  };
}

const MOTION = {
  grow: (start: number, end: number) =>
    animate({ from: 0, to: 1, start, end, ease: Easing.easeInOutSine }),
  pop: (start: number, dur: number) =>
    animate({ from: 0, to: 1, start, end: start + dur, ease: Easing.easeOutBack }),
};

const CUES = {
  Graine: 0,
  Tronc: 1.6,
  Branches: 4.6,
  Rameaux: 8.2,
  Feuilles: 11.4,
  Repos: 14.4,
};

interface AnimatedGoldenTreeProps {
  className?: string;
  stemColor?: string;
  leafColor?: string;
  sway?: boolean;
}

export function AnimatedGoldenTree({
  className = "",
  stemColor = "#c0a165",
  leafColor = "#a8873f",
  sway = true,
}: AnimatedGoldenTreeProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const animRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const step = (now: number) => {
      if (startRef.current === null) {
        startRef.current = now;
      }
      const elapsed = (now - startRef.current) / 1000;
      setElapsedTime(elapsed);
      animRef.current = requestAnimationFrame(step);
    };

    animRef.current = requestAnimationFrame(step);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  // La croissance de l'arbre se fait une seule fois (de 0 à 15s) et ne boucle jamais
  const growthT = Math.min(elapsedTime, CUES.Repos + 1.0);
  // Le balancement naturel au vent continue en permanence
  const swayT = elapsedTime;

  const twigSpan = Math.max(0.8, CUES.Feuilles - CUES.Rameaux - 0.6);
  const leafSpan = Math.max(0.8, CUES.Repos - CUES.Feuilles - 0.3);

  const swayMultiplier = sway ? 1 : 0;
  const swayIn = clamp((swayT - CUES.Rameaux) / 2.4, 0, 1) * swayMultiplier;
  const wind = Math.sin(swayT * 0.85) * swayIn;

  // Trunk (pousse une seule fois)
  const trunkP = MOTION.grow(CUES.Graine + 0.4, CUES.Branches + 0.2)(growthT);

  // Branches (poussent une seule fois)
  const branchPList = useMemo(() => {
    return TREE.branches.map((b) => {
      const st = CUES.Branches + 0.15 + (1 - b.fromU) * 1.6;
      return MOTION.grow(st, CUES.Rameaux + 0.1)(growthT);
    });
  }, [growthT]);

  // Twigs (poussent une seule fois)
  const twigPList = useMemo(() => {
    return TREE.twigs.map((tw) => {
      const st = CUES.Rameaux + tw.ord * twigSpan;
      return MOTION.grow(st, st + 0.75)(growthT);
    });
  }, [growthT, twigSpan]);

  // Leaves (s'ouvrent une seule fois)
  const leafPList = useMemo(() => {
    return TREE.leaves.map((lf) => {
      const st = CUES.Feuilles + lf.ord * leafSpan;
      return MOTION.pop(st, 0.85)(growthT);
    });
  }, [growthT, leafSpan]);

  const breathe =
    Math.sin((swayT - CUES.Repos) * 0.6) * 0.015 * clamp((swayT - CUES.Repos) / 1.5, 0, 1);
  const baseScale = 1 + breathe;

  return (
    <div className={`relative select-none pointer-events-none ${className}`}>
      <svg
        viewBox="80 180 920 1640"
        className="w-full h-full object-contain overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="treeLeafGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f7ebd0" />
            <stop offset="45%" stopColor="#e2c98f" />
            <stop offset="85%" stopColor="#c5a45f" />
            <stop offset="100%" stopColor="#aa8842" />
          </linearGradient>

          <filter id="goldenGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <radialGradient id="treeBaseShade" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0%" stopColor="rgba(192, 161, 101, 0.35)" />
            <stop offset="60%" stopColor="rgba(192, 161, 101, 0.12)" />
            <stop offset="100%" stopColor="rgba(192, 161, 101, 0)" />
          </radialGradient>
        </defs>

        <g transform={`translate(0, 0) scale(${baseScale.toFixed(4)})`} style={{ transformOrigin: "540px 1790px" }}>
          {/* Base Shadow / Aura */}
          <ellipse cx="540" cy="1795" rx="140" ry="24" fill="url(#treeBaseShade)" opacity={clamp(trunkP * 1.5, 0, 1)} />

          {/* Tree Structure with Wind Sway */}
          <g transform={`rotate(${(wind * 0.8).toFixed(3)}, 540, 1790)`}>
            {/* Trunk */}
            {trunkP > 0.002 && (
              <path
                d={TREE.trunk.d}
                fill="none"
                stroke={stemColor}
                strokeWidth={16}
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray={1}
                strokeDashoffset={1 - trunkP}
                className="transition-all"
              />
            )}

            {/* Branches */}
            {TREE.branches.map((b, i) => {
              const p = branchPList[i];
              if (p <= 0.002) return null;
              return (
                <path
                  key={`branch-${i}`}
                  d={b.d}
                  fill="none"
                  stroke={stemColor}
                  strokeWidth={7}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - p}
                />
              );
            })}

            {/* Twigs */}
            {TREE.twigs.map((tw, i) => {
              const p = twigPList[i];
              if (p <= 0.002) return null;
              return (
                <path
                  key={`twig-${i}`}
                  d={tw.d}
                  fill="none"
                  stroke={stemColor}
                  strokeWidth={2.8}
                  strokeLinecap="round"
                  pathLength={1}
                  strokeDasharray={1}
                  strokeDashoffset={1 - p}
                />
              );
            })}

            {/* Leaves */}
            {TREE.leaves.map((lf, i) => {
              const p = leafPList[i];
              if (p <= 0.002) return null;
              const flutter = Math.sin(swayT * 1.4 + lf.phase) * 4.5 * swayIn;
              const scaleVal = p.toFixed(3);
              const opac = clamp(p * 1.6, 0, 1);

              return (
                <g
                  key={`leaf-${i}`}
                  transform={`translate(${lf.x.toFixed(1)}, ${lf.y.toFixed(1)}) rotate(${(lf.ang + flutter).toFixed(2)}) scale(${scaleVal})`}
                  opacity={opac}
                  style={{ transformOrigin: "0px 0px" }}
                >
                  <path
                    d={leafPath(lf.len, lf.w)}
                    fill="url(#treeLeafGrad)"
                    stroke={leafColor}
                    strokeWidth={1.6}
                  />
                  <path
                    d={`M 2,0 L ${(lf.len - 4).toFixed(1)},0`}
                    stroke={leafColor}
                    strokeWidth={1.1}
                    opacity={0.65}
                    fill="none"
                  />
                </g>
              );
            })}
          </g>
        </g>
      </svg>
    </div>
  );
}
