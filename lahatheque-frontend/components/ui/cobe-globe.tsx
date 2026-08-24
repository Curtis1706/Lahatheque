"use client";

import React, { useEffect, useRef, useCallback } from "react";
import createGlobe from "cobe";

export interface Marker {
  id: string;
  location: [number, number];
  label: string;
}

export interface Arc {
  id: string;
  from: [number, number];
  to: [number, number];
  label?: string;
}

export interface GlobeProps {
  markers?: Marker[];
  arcs?: Arc[];
  className?: string;
  focusLocation?: [number, number] | null;
  markerColor?: [number, number, number];
  baseColor?: [number, number, number];
  arcColor?: [number, number, number];
  glowColor?: [number, number, number];
  dark?: number;
  mapBrightness?: number;
  markerSize?: number;
  markerElevation?: number;
  arcWidth?: number;
  arcHeight?: number;
  speed?: number;
  theta?: number;
  diffuse?: number;
  mapSamples?: number;
}

export function Globe({
  markers = [],
  arcs = [],
  className = "",
  focusLocation = null,
  markerColor = [0.93, 0.70, 0.25], // Gold vibrant (#EF9F27)
  baseColor = [0.22, 0.32, 0.58],   // Bleu Navy lumineux et contrasté pour voir nettement les continents
  arcColor = [0.93, 0.70, 0.25],    // Gold vibrant
  glowColor = [0.25, 0.38, 0.68],   // Halo lumineux
  dark = 0.82,                      // Contraste optimal (pas trop sombre)
  mapBrightness = 13,               // Contours des continents éclatants et lisibles
  markerSize = 0.05,
  markerElevation = 0.03,
  arcWidth = 0.9,
  arcHeight = 0.32,
  speed = 0.002,
  theta = 0.12,
  diffuse = 1.8,
  mapSamples = 16000,
}: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<{ x: number; y: number } | null>(null);
  const lastPointer = useRef<{ x: number; y: number; t: number } | null>(null);
  const dragOffset = useRef({ phi: 0, theta: 0 });
  const velocity = useRef({ phi: 0, theta: 0 });
  const phiOffsetRef = useRef(0);
  const thetaOffsetRef = useRef(0);
  const isPausedRef = useRef(false);
  const focusTargetRef = useRef<{ phi: number; theta: number } | null>(null);

  // Mettre à jour la cible de focus lors d'un changement de pays
  useEffect(() => {
    if (focusLocation) {
      const [lat, lon] = focusLocation;
      // Convertir lat/lon en coordonnées cobe phi/theta
      // Dans cobe: phi 0 fait face à l'Afrique centrale (~0 lon), theta 0 à l'équateur
      const targetPhi = -(lon * Math.PI) / 180 + Math.PI / 2;
      const targetTheta = (lat * Math.PI) / 180 * 0.5;
      focusTargetRef.current = { phi: targetPhi, theta: targetTheta };
    }
  }, [focusLocation]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerInteracting.current = { x: e.clientX, y: e.clientY };
    if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
    isPausedRef.current = true;
    focusTargetRef.current = null; // Libérer le focus si l'utilisateur interagit
  }, []);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (pointerInteracting.current !== null) {
      const deltaX = e.clientX - pointerInteracting.current.x;
      const deltaY = e.clientY - pointerInteracting.current.y;
      dragOffset.current = { phi: deltaX / 250, theta: deltaY / 800 };
      const now = Date.now();
      if (lastPointer.current) {
        const dt = Math.max(now - lastPointer.current.t, 1);
        const maxVelocity = 0.15;
        velocity.current = {
          phi: Math.max(
            -maxVelocity,
            Math.min(
              maxVelocity,
              ((e.clientX - lastPointer.current.x) / dt) * 0.3
            )
          ),
          theta: Math.max(
            -maxVelocity,
            Math.min(
              maxVelocity,
              ((e.clientY - lastPointer.current.y) / dt) * 0.08
            )
          ),
        };
      }
      lastPointer.current = { x: e.clientX, y: e.clientY, t: now };
    }
  }, []);

  const handlePointerUp = useCallback(() => {
    if (pointerInteracting.current !== null) {
      phiOffsetRef.current += dragOffset.current.phi;
      thetaOffsetRef.current += dragOffset.current.theta;
      dragOffset.current = { phi: 0, theta: 0 };
      lastPointer.current = null;
    }
    pointerInteracting.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = "grab";
    isPausedRef.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    let globe: ReturnType<typeof createGlobe> | null = null;
    let animationId: number;
    let phi = 0;

    function init() {
      const width = canvas.offsetWidth;
      if (width === 0 || globe) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      globe = createGlobe(canvas, {
        devicePixelRatio: dpr,
        width: width * dpr,
        height: width * dpr,
        phi: 0,
        theta,
        dark,
        diffuse,
        mapSamples,
        mapBrightness,
        baseColor,
        markerColor,
        glowColor,
        markerElevation,
        markers: markers.map((m) => ({
          location: m.location,
          size: markerSize,
          id: m.id,
        })),
        arcs: arcs.map((a) => ({
          from: a.from,
          to: a.to,
          id: a.id,
        })),
        arcColor,
        arcWidth,
        arcHeight,
        opacity: 0.95,
      });

      function animate() {
        if (!isPausedRef.current) {
          // Si un focus est actif, interpoler doucement vers la cible
          if (focusTargetRef.current) {
            const currentTotalPhi = phi + phiOffsetRef.current;
            // Normaliser l'angle pour trouver le chemin le plus court
            let diffPhi = (focusTargetRef.current.phi - currentTotalPhi) % (Math.PI * 2);
            if (diffPhi > Math.PI) diffPhi -= Math.PI * 2;
            if (diffPhi < -Math.PI) diffPhi += Math.PI * 2;

            phiOffsetRef.current += diffPhi * 0.06;
            const diffTheta = focusTargetRef.current.theta - (theta + thetaOffsetRef.current);
            thetaOffsetRef.current += diffTheta * 0.06;

            if (Math.abs(diffPhi) < 0.005 && Math.abs(diffTheta) < 0.005) {
              focusTargetRef.current = null; // Animation terminée, reprendre la lente rotation
            }
          } else {
            phi += speed;
          }

          if (
            Math.abs(velocity.current.phi) > 0.0001 ||
            Math.abs(velocity.current.theta) > 0.0001
          ) {
            phiOffsetRef.current += velocity.current.phi;
            thetaOffsetRef.current += velocity.current.theta;
            velocity.current.phi *= 0.95;
            velocity.current.theta *= 0.95;
          }

          const thetaMin = -0.4;
          const thetaMax = 0.4;
          if (thetaOffsetRef.current < thetaMin) {
            thetaOffsetRef.current += (thetaMin - thetaOffsetRef.current) * 0.1;
          } else if (thetaOffsetRef.current > thetaMax) {
            thetaOffsetRef.current += (thetaMax - thetaOffsetRef.current) * 0.1;
          }
        }

        globe?.update({
          phi: phi + phiOffsetRef.current + dragOffset.current.phi,
          theta: theta + thetaOffsetRef.current + dragOffset.current.theta,
          dark,
          mapBrightness,
          markerColor,
          baseColor,
          arcColor,
          markerElevation,
          markers: markers.map((m) => ({
            location: m.location,
            size: markerSize,
            id: m.id,
          })),
          arcs: arcs.map((a) => ({
            from: a.from,
            to: a.to,
            id: a.id,
          })),
        });
        animationId = requestAnimationFrame(animate);
      }
      animate();
      setTimeout(() => {
        if (canvas) canvas.style.opacity = "1";
      });
    }

    if (canvas.offsetWidth > 0) {
      init();
    } else {
      const ro = new ResizeObserver((entries) => {
        if (entries[0]?.contentRect.width > 0) {
          ro.disconnect();
          init();
        }
      });
      ro.observe(canvas);
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      if (globe) globe.destroy();
    };
  }, [
    markers,
    arcs,
    markerColor,
    baseColor,
    arcColor,
    glowColor,
    dark,
    mapBrightness,
    markerSize,
    markerElevation,
    arcWidth,
    arcHeight,
    speed,
    theta,
    diffuse,
    mapSamples,
  ]);

  return (
    <div className={`relative aspect-square select-none ${className}`}>
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        className="w-full h-full cursor-grab opacity-0 transition-opacity duration-1000 rounded-full touch-none"
      />
    </div>
  );
}
