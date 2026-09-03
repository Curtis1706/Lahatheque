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

export function WhyChooseSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState(0);
  const [scale, setScale] = useState(1);
  const startTimeRef = useRef<number | null>(null);
  const isVisibleRef = useRef(true);

  // ResizeObserver pour adapter l'échelle 1600x700 de manière responsive
  useEffect(() => {
    if (!containerRef.current) return;
    const updateScale = () => {
      if (containerRef.current) {
        const currentWidth = containerRef.current.clientWidth;
        setScale(currentWidth / W);
      }
    };
    updateScale();
    const ro = new ResizeObserver(updateScale);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Boucle d'animation continue (Boucle 14s fluide à 60 FPS)
  useEffect(() => {
    let animId: number;

    const onVisibilityChange = () => {
      isVisibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    const loop = (now: number) => {
      if (startTimeRef.current === null) startTimeRef.current = now;
      if (isVisibleRef.current) {
        const elapsed = ((now - startTimeRef.current) / 1000) % TOTAL_DURATION;
        setTime(elapsed);
      }
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const T = time;

  // Calculs précis de progression des états selon la boucle temporelle (14s)
  const groundP = enterAnim(0.05, 0.7)(T);
  const plateP = popAnim(0.6, 0.8)(T);

  // Phase 1 (Importation) : jetons creux convergents vers l'Afrique
  const inFlow =
    anim(0, 1, CUES.Importation - 0.25, CUES.Importation + 0.55, easeOutCubic)(T) *
    anim(1, 0, CUES.Bascule - 0.15, CUES.Bascule + 0.35, easeInOutSine)(T);

  // Phase 2 (Bascule / Transformation) : la plaque Afrique se remplit
  const fill = anim(0, 1, CUES.Bascule + 0.45, CUES.Bascule + 1.25, easeInOutQuart)(T);

  // Phase 3 (Rayonnement / Exportation) : jetons pleins rayonnant vers le monde entier
  const outFlow = enterAnim(CUES.Rayonnement - 0.15, 0.7)(T);

  // Étape active synchronisée avec la boucle
  const activeStep = T < CUES.Bascule ? 0 : T < CUES.Rayonnement ? 1 : 2;

  // Liens nodaux
  const links = useMemo(() => {
    return CONN.map((c) => {
      const drawIn = drawAnim(CUES.Importation - 0.5 + c.i * 0.12, 0.8)(T);
      const drawOut = drawAnim(CUES.Rayonnement - 0.35 + c.i * 0.1, 0.7)(T);
      return {
        c,
        base: drawIn,
        strong: Math.max(inFlow, outFlow) * Math.max(drawIn, drawOut),
      };
    });
  }, [T, inFlow, outFlow]);

  // Jetons / Packets en circulation fluide
  const packets = useMemo(() => {
    const res: Array<{
      key: string;
      solid: boolean;
      s: number;
      o: number;
      pos: { x: number; y: number };
    }> = [];
    const per = 2.4;

    CONN.forEach((c) => {
      for (let k = 0; k < 2; k++) {
        const ph = (c.i * 0.17 + k * 0.5) % 1;

        // Entrant : pôles étrangers -> Afrique (Import)
        let pi = ((T - CUES.Importation) / per + ph) % 1;
        if (pi < 0) pi += 1;
        const fadeIn = Math.min(1, pi / 0.14) * Math.min(1, (1 - pi) / 0.14);
        res.push({
          key: "i" + c.i + k,
          solid: false,
          s: 1.1,
          o: inFlow * fadeIn,
          pos: { x: lerp(c.a.x, c.b.x, pi), y: lerp(c.a.y, c.b.y, pi) },
        });

        // Sortant : Afrique -> monde entier (Export)
        let po = ((T - CUES.Rayonnement) / per + ph) % 1;
        if (po < 0) po += 1;
        const fadeOut = Math.min(1, po / 0.12) * Math.min(1, (1 - po) / 0.16);
        res.push({
          key: "o" + c.i + k,
          solid: true,
          s: lerp(0.85, 1.25, po),
          o: outFlow * fadeOut,
          pos: { x: lerp(c.b.x, c.a.x, po), y: lerp(c.b.y, c.a.y, po) },
        });
      }
    });
    return res;
  }, [T, inFlow, outFlow]);

  const chipPs = [0, 1, 2].map((i) => popAnim(CUES.Bascule + 0.55 + i * 0.32, 0.5)(T));

  const nodeHot = CONN.map((c) => {
    const arriveIn = inFlow * 0.55;
    const arriveOut = outFlow * enterAnim(CUES.Rayonnement + 0.9 + c.i * 0.18, 0.5)(T);
    return clamp(Math.max(arriveIn, arriveOut), 0, 1);
  });

  // Clic sur l'une des 3 étapes pour sauter directement à cette phase dans la boucle
  const handleStepClick = (stepIdx: number) => {
    const targetTime = stepIdx === 0 ? 3.0 : stepIdx === 1 ? 7.2 : 10.2;
    startTimeRef.current = performance.now() - targetTime * 1000;
    setTime(targetTime);
  };

  return (
    <section className="bg-background py-20 md:py-28 px-4 sm:px-6 md:px-10 lg:px-12 border-t border-border overflow-hidden">
      <div className="max-w-[1240px] mx-auto w-full flex flex-col gap-10 md:gap-14">
        
        {/* En-tête de la section */}
        <header className="flex flex-col items-center gap-4 text-center">
          <span className="inline-block px-3.5 py-1.5 rounded-full bg-gold/10 border border-gold/30 text-gold text-[11px] font-bold tracking-[0.2em] uppercase">
            NOTRE VISION
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-bold text-navy tracking-tight leading-[1.1] max-w-4xl">
            Du savoir que l’on reçoit au savoir que l’on partage
          </h2>
        </header>

        {/* Blueprint Stage Figure (ratio 16:9 compact 43.75%) */}
        <figure className="relative m-0 p-0 border border-border rounded-2xl sm:rounded-3xl bg-[#f5f6f8] overflow-hidden shadow-xs">
          <CornerMarks />

          <div
            ref={containerRef}
            className="relative w-full overflow-hidden"
            style={{ paddingBottom: "43.75%" }}
          >
            <div
              className="absolute top-0 left-0 origin-top-left pointer-events-none select-none"
              style={{
                width: W,
                height: H,
                transform: `scale(${scale})`,
              }}
            >
              {/* Grille technique de fond */}
              <div
                className="absolute inset-0"
                style={{
                  opacity: groundP * 0.85,
                  backgroundImage:
                    "repeating-linear-gradient(to right, rgba(27,42,78,0.06) 0 1px, transparent 1px 48px), repeating-linear-gradient(to bottom, rgba(27,42,78,0.06) 0 1px, transparent 1px 48px)",
                }}
              />

              {/* Cadre intérieur technique */}
              <div
                className="absolute left-10 top-8 right-10 bottom-8 border border-border"
                style={{ opacity: groundP }}
              >
                <CornerMarks />
              </div>

              {/* Liens et lignes vectorielles */}
              {links.map((l) => (
                <React.Fragment key={"L" + l.c.i}>
                  {/* Ligne de base */}
                  <div
                    style={{
                      position: "absolute",
                      left: l.c.a.x,
                      top: l.c.a.y,
                      width: l.c.len,
                      height: 1,
                      transformOrigin: "0 50%",
                      transform: `rotate(${l.c.ang}deg) scaleX(${l.base})`,
                      background: "rgba(27,42,78,0.2)",
                    }}
                  />
                  {/* Ligne active forte */}
                  <div
                    style={{
                      position: "absolute",
                      left: outFlow > 0.4 ? l.c.b.x : l.c.a.x,
                      top: outFlow > 0.4 ? l.c.b.y : l.c.a.y,
                      width: l.c.len,
                      height: 1.5,
                      transformOrigin: "0 50%",
                      transform: `rotate(${outFlow > 0.4 ? l.c.ang + 180 : l.c.ang}deg) scaleX(${l.strong})`,
                      background: "rgba(46,63,102,0.85)",
                    }}
                  />
                </React.Fragment>
              ))}

              {/* Pôles régionaux mondiaux */}
              {NODES.map((n, i) => {
                const hot = nodeHot[i];
                const p = enterAnim(0.9 + i * 0.13, 0.6)(T);
                return (
                  <div
                    key={n.label}
                    style={{
                      position: "absolute",
                      left: n.x - NODE.w / 2,
                      top: n.y - NODE.h / 2,
                      width: NODE.w,
                      height: NODE.h,
                      display: "grid",
                      placeItems: "center",
                      border: `1px solid ${hot > 0.5 ? "#2E3F66" : "rgba(27,42,78,0.2)"}`,
                      background: `rgba(46,63,102,${0.12 * hot})`,
                      opacity: p,
                      transform: `scale(${lerp(0.94, 1, p)})`,
                    }}
                  >
                    <CornerMarks color={hot > 0.5 ? "#2E3F66" : "rgba(27,42,78,0.3)"} />
                    <span
                      className={`font-serif text-lg font-bold tracking-wider ${
                        hot > 0.5 ? "text-navy" : "text-foreground-muted"
                      }`}
                    >
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
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_1fr] gap-6 md:gap-10 items-start">
          {/* Colonne Gauche : Cadre Blueprint avec le texte narratif */}
          <div className="relative p-6 sm:p-8 md:p-10 border border-border rounded-3xl bg-background shadow-xs space-y-4">
            <CornerMarks />
            <p className="text-sm sm:text-base text-foreground-muted leading-relaxed font-sans">
              Pendant longtemps, une grande partie des connaissances consommées sur notre continent
              a été importée d’autres horizons. Aujourd’hui, nous souhaitons contribuer à changer
              cette dynamique : produire, valoriser et transmettre un savoir issu de notre
              intelligence, de nos talents et de nos réalités.
            </p>
            <p className="text-sm sm:text-base text-foreground-muted leading-relaxed font-sans">
              Notre ambition est de faire de la connaissance un vecteur de rayonnement, en
              développant des contenus et des solutions capables de dépasser nos frontières et de
              trouver leur place à l’échelle internationale.
            </p>
          </div>

          {/* Colonne Droite : Étapes numérotées synchronisées + Encart Sombre */}
          <div className="flex flex-col gap-4">
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
                    className={`w-full flex items-baseline gap-4 px-5 py-3.5 sm:px-6 sm:py-4 transition-all duration-300 text-left cursor-pointer ${
                      isActive
                        ? "bg-navy/5 border-l-4 border-l-navy"
                        : "bg-transparent hover:bg-navy/5 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <span
                      className={`font-mono text-xs font-bold tracking-wider ${
                        isActive ? "text-navy" : "text-foreground-muted"
                      }`}
                    >
                      {step.num}
                    </span>
                    <span
                      className={`font-serif text-base sm:text-lg font-bold tracking-wider ${
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
              className={`relative p-6 sm:p-7 md:p-8 border border-navy rounded-3xl bg-navy text-white shadow-md transition-all duration-500 ${
                activeStep === 2 ? "ring-2 ring-gold/40 shadow-lg scale-[1.01]" : ""
              }`}
            >
              <CornerMarks color="rgba(176,141,66,0.6)" />
              <p className="font-serif font-bold text-lg sm:text-xl md:text-2xl leading-snug">
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

export default WhyChooseSection;
