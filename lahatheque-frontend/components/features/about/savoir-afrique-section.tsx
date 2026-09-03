"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";

// Constantes géométriques et coordonnées du schéma (format 1600x700 compact & équilibré)
const W = 1600;
const H = 700;
const TOTAL_DURATION = 14.0;

const CUES = {
  Ouverture: 0,
  Importation: 2.5,
  Bascule: 6.5,
  Rayonnement: 9.0,
};

const C = { x: 800, y: 360 };
const PLATE = { w: 340, h: 176 };
const NODE = { w: 212, h: 62 };

const NODES = [
  { label: "EUROPE", x: 300, y: 150 },
  { label: "AMÉRIQUE DU NORD", x: 152, y: 360 },
  { label: "ASIE", x: 1300, y: 150 },
  { label: "MOYEN-ORIENT", x: 1448, y: 360 },
  { label: "AMÉRIQUE LATINE", x: 330, y: 570 },
  { label: "OCÉANIE", x: 1270, y: 570 },
];

const CONN = NODES.map((n, i) => {
  const dx = C.x - n.x;
  const dy = C.y - n.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const a = { x: n.x + ux * 124, y: n.y + uy * 124 };
  const b = { x: C.x - ux * 208, y: C.y - uy * 208 };
  return {
    i,
    node: n,
    a,
    b,
    ang: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
    len: Math.hypot(b.x - a.x, b.y - a.y),
  };
});

// Fonctions d'animation & easing
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutQuart = (t: number) =>
  t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const easeOutBack = (t: number) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

function clamp(v: number, min: number, max: number) {
  return Math.min(Math.max(v, min), max);
}

function lerp(a: number, b: number, p: number) {
  return a + (b - a) * p;
}

function anim(
  from: number,
  to: number,
  start: number,
  end: number,
  ease?: (t: number) => number
) {
  return (T: number) => {
    if (T <= start) return from;
    if (T >= end) return to;
    const p = (T - start) / (end - start);
    const ep = ease ? ease(p) : p;
    return from + (to - from) * ep;
  };
}

const enterAnim = (start: number, dur = 0.7) => anim(0, 1, start, start + dur, easeOutCubic);
const drawAnim = (start: number, dur = 0.9) => anim(0, 1, start, start + dur, easeInOutQuart);
const popAnim = (start: number, dur = 0.5) => anim(0, 1, start, start + dur, easeOutBack);

function CornerMarks({ color = "rgba(46,63,102,0.4)" }: { color?: string }) {
  const s: React.CSSProperties = {
    position: "absolute",
    fontSize: "14px",
    lineHeight: 1,
    fontFamily: "monospace",
    color,
    userSelect: "none",
  };
  return (
    <>
      <span style={{ ...s, left: -5, top: -7 }}>+</span>
      <span style={{ ...s, right: -5, top: -7 }}>+</span>
      <span style={{ ...s, left: -5, bottom: -7 }}>+</span>
      <span style={{ ...s, right: -5, bottom: -7 }}>+</span>
    </>
  );
}

export function SavoirAfriqueSection() {
  const [time, setTime] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const timeOffsetRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  // Boucle d'animation continue de 14s sans scroll trapping
  useEffect(() => {
    let animId: number;

    const tick = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      const elapsed = (timestamp - startTimeRef.current) / 1000 + timeOffsetRef.current;
      const currentLoopTime = elapsed % TOTAL_DURATION;
      setTime(currentLoopTime);

      if (currentLoopTime < CUES.Bascule) {
        setActiveStep(0);
      } else if (currentLoopTime < CUES.Rayonnement) {
        setActiveStep(1);
      } else {
        setActiveStep(2);
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  const handleStepClick = (stepIndex: number) => {
    setActiveStep(stepIndex);
    const targetTimes = [CUES.Importation, CUES.Bascule, CUES.Rayonnement];
    const targetT = targetTimes[stepIndex];
    if (startTimeRef.current !== null) {
      const now = performance.now();
      const currentElapsed = (now - startTimeRef.current) / 1000 + timeOffsetRef.current;
      const currentBase = Math.floor(currentElapsed / TOTAL_DURATION) * TOTAL_DURATION;
      timeOffsetRef.current = currentBase + targetT - (now - startTimeRef.current) / 1000;
    }
  };

  const T = time;

  // Calculs cinématiques en temps réel
  const outerP = enterAnim(0.0, 1.0)(T);
  const innerP = enterAnim(0.2, 0.9)(T);
  const gridP = enterAnim(0.4, 0.8)(T);

  const nodePs = useMemo(
    () => [
      enterAnim(0.5, 0.7)(T),
      enterAnim(0.7, 0.7)(T),
      enterAnim(0.6, 0.7)(T),
      enterAnim(0.8, 0.7)(T),
      enterAnim(0.75, 0.7)(T),
      enterAnim(0.85, 0.7)(T),
    ],
    [T]
  );

  const lineInPs = useMemo(
    () => [
      drawAnim(1.1, 0.9)(T),
      drawAnim(1.3, 0.9)(T),
      drawAnim(1.2, 0.9)(T),
      drawAnim(1.4, 0.9)(T),
      drawAnim(1.35, 0.9)(T),
      drawAnim(1.45, 0.9)(T),
    ],
    [T]
  );

  const lineOutPs = useMemo(
    () => [
      drawAnim(9.2, 0.9)(T),
      drawAnim(9.4, 0.9)(T),
      drawAnim(9.3, 0.9)(T),
      drawAnim(9.5, 0.9)(T),
      drawAnim(9.45, 0.9)(T),
      drawAnim(9.55, 0.9)(T),
    ],
    [T]
  );

  const diamondInPs = useMemo(
    () => [
      popAnim(2.0)(T),
      popAnim(2.2)(T),
      popAnim(2.1)(T),
      popAnim(2.3)(T),
      popAnim(2.25)(T),
      popAnim(2.35)(T),
    ],
    [T]
  );

  const diamondOutPs = useMemo(
    () => [
      popAnim(10.1)(T),
      popAnim(10.3)(T),
      popAnim(10.2)(T),
      popAnim(10.4)(T),
      popAnim(10.35)(T),
      popAnim(10.45)(T),
    ],
    [T]
  );

  const plateP = popAnim(0.4, 0.9)(T);

  const fill = anim(0, 1, CUES.Bascule, CUES.Bascule + 1.2, easeInOutSine)(T);

  const chipPs = useMemo(
    () => [
      anim(0, 1, CUES.Bascule + 0.3, CUES.Bascule + 0.9, easeOutBack)(T),
      anim(0, 1, CUES.Bascule + 0.6, CUES.Bascule + 1.2, easeOutBack)(T),
      anim(0, 1, CUES.Bascule + 0.9, CUES.Bascule + 1.5, easeOutBack)(T),
    ],
    [T]
  );

  // Jetons animés le long des liaisons
  const packets = useMemo(() => {
    const pkts: {
      key: string;
      pos: { x: number; y: number };
      o: number;
      s: number;
      solid: boolean;
    }[] = [];

    // Phase 1 : Importation (des nœuds vers l'Afrique)
    if (T >= CUES.Importation && T < CUES.Bascule) {
      const dur = 2.4;
      const tIn = (T - CUES.Importation) / dur;
      CONN.forEach((c, idx) => {
        const off = (idx * 0.16) % 1;
        const prog = (tIn + off) % 1;
        const pos = {
          x: lerp(c.a.x, c.b.x, prog),
          y: lerp(c.a.y, c.b.y, prog),
        };
        const fadeIn = clamp(prog / 0.15, 0, 1);
        const fadeOut = clamp((1 - prog) / 0.15, 0, 1);
        const o = Math.min(fadeIn, fadeOut) * 0.95;
        pkts.push({
          key: `in-${idx}`,
          pos,
          o,
          s: 1,
          solid: false,
        });
      });
    }

    // Phase 3 : Exportation & Rayonnement (de l'Afrique vers le Monde)
    if (T >= CUES.Rayonnement && T < TOTAL_DURATION) {
      const dur = 2.6;
      const tOut = (T - CUES.Rayonnement) / dur;
      CONN.forEach((c, idx) => {
        const off = (idx * 0.16) % 1;
        const prog = (tOut + off) % 1;
        const pos = {
          x: lerp(c.b.x, c.a.x, prog),
          y: lerp(c.b.y, c.a.y, prog),
        };
        const fadeIn = clamp(prog / 0.12, 0, 1);
        const fadeOut = clamp((1 - prog) / 0.12, 0, 1);
        const o = Math.min(fadeIn, fadeOut);
        pkts.push({
          key: `out-${idx}`,
          pos,
          o,
          s: 1.25,
          solid: true,
        });
      });
    }

    return pkts;
  }, [T]);

  return (
    <section className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 overflow-hidden">
      <div className="w-full space-y-6 sm:space-y-8">
        {/* En-tête de section */}
        <div className="text-center max-w-3xl mx-auto space-y-2.5">
          <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase text-gold">
            NOTRE VISION
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-navy leading-tight">
            Du savoir que l’on reçoit au savoir que l’on partage
          </h2>
        </div>

        {/* Scène Blueprint Interactive responsive */}
        <figure
          className="relative w-full max-w-6xl mx-auto border border-border rounded-3xl bg-[#F5F6F8] shadow-sm overflow-hidden"
          style={{ margin: "0 auto" }}
        >
          <div
            className="relative w-full"
            style={{
              paddingBottom: "43.75%", // Ratio 1600x700
              minHeight: "360px",
            }}
          >
            <div
              className="absolute top-0 left-0 w-[1600px] h-[700px] origin-top-left pointer-events-none select-none"
              style={{
                transform: `scale(var(--scale, 1))`,
                width: `${W}px`,
                height: `${H}px`,
              }}
              ref={(el) => {
                if (!el) return;
                const updateScale = () => {
                  if (!el.parentElement) return;
                  const parentWidth = el.parentElement.clientWidth;
                  const scale = parentWidth / W;
                  el.style.transform = `scale(${scale})`;
                };
                updateScale();
                window.addEventListener("resize", updateScale);
              }}
            >
              {/* Grille technique blueprint */}
              <svg
                width={W}
                height={H}
                className="absolute inset-0 pointer-events-none"
                style={{ opacity: gridP * 0.35 }}
              >
                <defs>
                  <pattern
                    id="blueprint-grid-pattern-about"
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="#2E3F66"
                      strokeWidth="0.5"
                      strokeOpacity="0.4"
                    />
                  </pattern>
                </defs>
                <rect
                  x="0"
                  y="0"
                  width={W}
                  height={H}
                  fill="url(#blueprint-grid-pattern-about)"
                />
              </svg>

              {/* Cadre extérieur double */}
              <div
                style={{
                  position: "absolute",
                  left: 40,
                  top: 25,
                  width: W - 80,
                  height: H - 50,
                  border: "1px solid #2E3F66",
                  opacity: outerP * 0.3,
                }}
              >
                <CornerMarks />
              </div>
              <div
                style={{
                  position: "absolute",
                  left: 56,
                  top: 41,
                  width: W - 112,
                  height: H - 82,
                  border: "0.5px solid #2E3F66",
                  opacity: innerP * 0.2,
                }}
              />

              {/* Lignes de liaison (SVG) */}
              <svg
                width={W}
                height={H}
                className="absolute inset-0 pointer-events-none"
                style={{ overflow: "visible" }}
              >
                {CONN.map((c, i) => {
                  const pIn = lineInPs[i];
                  const pOut = lineOutPs[i];

                  return (
                    <g key={c.node.label}>
                      {/* Ligne d'importation */}
                      {pIn > 0 && (
                        <line
                          x1={c.a.x}
                          y1={c.a.y}
                          x2={lerp(c.a.x, c.b.x, pIn)}
                          y2={lerp(c.a.y, c.b.y, pIn)}
                          stroke="#2E3F66"
                          strokeWidth="1.2"
                          strokeDasharray="4 4"
                          strokeOpacity={lerp(0.8, 0.4, fill)}
                        />
                      )}

                      {/* Ligne d'exportation / rayonnement */}
                      {pOut > 0 && (
                        <line
                          x1={c.b.x}
                          y1={c.b.y}
                          x2={lerp(c.b.x, c.a.x, pOut)}
                          y2={lerp(c.b.y, c.a.y, pOut)}
                          stroke="#1B2A4E"
                          strokeWidth="2.5"
                          strokeOpacity="0.9"
                        />
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Losanges de jalonnement le long des axes */}
              {CONN.map((c, i) => {
                const mid = {
                  x: (c.a.x + c.b.x) / 2,
                  y: (c.a.y + c.b.y) / 2,
                };
                const dIn = diamondInPs[i];
                const dOut = diamondOutPs[i];

                return (
                  <React.Fragment key={`dia-${c.node.label}`}>
                    {dIn > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          left: mid.x - 6,
                          top: mid.y - 6,
                          width: 12,
                          height: 12,
                          border: "1px solid #2E3F66",
                          background: "#F5F6F8",
                          transform: `rotate(45deg) scale(${dIn})`,
                          opacity: dIn * (1 - fill * 0.5),
                        }}
                      />
                    )}
                    {dOut > 0 && (
                      <div
                        style={{
                          position: "absolute",
                          left: mid.x - 7,
                          top: mid.y - 7,
                          width: 14,
                          height: 14,
                          border: "1.5px solid #1B2A4E",
                          background: "#1B2A4E",
                          transform: `rotate(45deg) scale(${dOut})`,
                          opacity: dOut,
                        }}
                      />
                    )}
                  </React.Fragment>
                );
              })}

              {/* Nœuds des continents périphériques */}
              {NODES.map((n, i) => {
                const p = nodePs[i];
                return (
                  <div
                    key={n.label}
                    style={{
                      position: "absolute",
                      left: n.x - NODE.w / 2,
                      top: n.y - NODE.h / 2,
                      width: NODE.w,
                      height: NODE.h,
                      border: "1px solid #2E3F66",
                      background: "rgba(245,246,248,0.92)",
                      opacity: p,
                      transform: `scale(${lerp(0.85, 1, p)})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 12px",
                    }}
                  >
                    <CornerMarks />
                    <span className="font-mono text-xs font-bold tracking-widest text-[#2E3F66] text-center">
                      {n.label}
                    </span>
                  </div>
                );
              })}

              {/* Plaque centrale AFRIQUE */}
              <div
                style={{
                  position: "absolute",
                  left: C.x - PLATE.w / 2,
                  top: C.y - PLATE.h / 2,
                  width: PLATE.w,
                  height: PLATE.h,
                  border: `1.5px solid ${fill > 0.2 ? "#1B2A4E" : "#2E3F66"}`,
                  opacity: plateP,
                  transform: `scale(${lerp(0.9, 1, plateP)})`,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "#1B2A4E",
                    opacity: fill,
                  }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <span
                    className={`font-serif text-5xl font-bold tracking-widest leading-none ${
                      fill > 0.5 ? "text-white" : "text-navy"
                    }`}
                  >
                    AFRIQUE
                  </span>
                  <span
                    className={`font-mono text-xs font-bold tracking-[0.25em] ${
                      fill > 0.5 ? "text-gold" : "text-[#2E3F66]"
                    }`}
                  >
                    PRODUCTION DU SAVOIR
                  </span>
                </div>
                <CornerMarks color={fill > 0.5 ? "#B08D42" : "#2E3F66"} />
              </div>

              {/* Badges sous Afrique (PRODUIRE · VALORISER · TRANSMETTRE) */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: C.y + PLATE.h / 2 + 20,
                  display: "flex",
                  justifyContent: "center",
                  gap: 14,
                }}
              >
                {["PRODUIRE", "VALORISER", "TRANSMETTRE"].map((w, i) => {
                  const p = chipPs[i];
                  return (
                    <div
                      key={w}
                      className="px-4 py-2 border border-border bg-background shadow-xs"
                      style={{
                        opacity: p,
                        transform: `translateY(${(1 - p) * 10}px)`,
                      }}
                    >
                      <span className="font-serif text-sm font-bold tracking-widest text-navy">
                        {w}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Jetons en mouvement animés */}
              {packets.map((p) => {
                if (p.o <= 0.01) return null;
                return (
                  <div
                    key={p.key}
                    style={{
                      position: "absolute",
                      left: p.pos.x - 8,
                      top: p.pos.y - 8,
                      width: 16,
                      height: 16,
                      border: `2px solid ${p.solid ? "#1B2A4E" : "#2E3F66"}`,
                      background: p.solid ? "#1B2A4E" : "rgba(245,246,248,0.95)",
                      boxShadow: p.solid
                        ? "0 0 10px rgba(27,42,78,0.35)"
                        : "0 0 8px rgba(46,63,102,0.25)",
                      opacity: p.o,
                      transform: `rotate(45deg) scale(${p.s})`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </figure>

        {/* Section inférieure en 2 colonnes */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-4 sm:gap-6 items-stretch">
          {/* Colonne Gauche : Cadre Blueprint avec le texte narratif */}
          <div className="relative p-5 sm:p-6 border border-border rounded-2xl sm:rounded-3xl bg-background shadow-xs space-y-3 sm:space-y-3.5 flex flex-col justify-center">
            <CornerMarks />
            <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed font-sans">
              Pendant longtemps, une grande partie des connaissances consommées sur notre continent
              a été importée d’autres horizons. Aujourd’hui, nous souhaitons contribuer à changer
              cette dynamique : produire, valoriser et transmettre un savoir issu de notre
              intelligence, de nos talents et de nos réalités.
            </p>
            <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed font-sans">
              Notre ambition est de faire de la connaissance un vecteur de rayonnement, en
              développant des contenus et des solutions capables de dépasser nos frontières et de
              trouver leur place à l’échelle internationale.
            </p>
          </div>

          {/* Colonne Droite : Étapes numérotées synchronisées + Encart Sombre */}
          <div className="flex flex-col gap-3 sm:gap-3.5 justify-between">
            {/* 3 Étapes synchronisées avec clic interactif pour sauter à la phase */}
            <div className="border border-border rounded-2xl overflow-hidden divide-y divide-border bg-background shadow-xs">
              {[
                { num: "01", label: "SAVOIR IMPORTÉ" },
                { num: "02", label: "PRODUIRE · VALORISER · TRANSMETTRE" },
                { num: "03", label: "SAVOIR EXPORTÉ" },
              ].map((step, idx) => {
                const isActive = activeStep === idx;
                return (
                  <button
                    key={step.num}
                    type="button"
                    onClick={() => handleStepClick(idx)}
                    className={`w-full flex items-baseline gap-3.5 px-4 py-2.5 sm:px-5 sm:py-3 transition-all duration-300 text-left cursor-pointer ${
                      isActive
                        ? "bg-gold/10 text-navy font-bold"
                        : "bg-transparent hover:bg-navy/5 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <span
                      className={`font-mono text-xs font-bold tracking-wider ${
                        isActive ? "text-gold" : "text-foreground-muted"
                      }`}
                    >
                      {step.num}
                    </span>
                    <span
                      className={`font-serif text-sm sm:text-base font-bold tracking-wider ${
                        isActive ? "text-navy" : "text-foreground-muted"
                      }`}
                    >
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Encart sombre d'emphase finale */}
            <div
              className={`relative p-4 sm:p-5 border border-navy rounded-2xl sm:rounded-3xl bg-navy text-white shadow-md transition-all duration-500 ${
                activeStep === 2 ? "ring-2 ring-gold/40 shadow-lg scale-[1.01]" : ""
              }`}
            >
              <CornerMarks color="rgba(176,141,66,0.6)" />
              <p className="font-serif font-bold text-base sm:text-lg leading-snug">
                Parce que l’Afrique ne doit pas seulement être une destination du savoir :{" "}
                <span className="text-gold">elle peut aussi en devenir une source.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default SavoirAfriqueSection;
