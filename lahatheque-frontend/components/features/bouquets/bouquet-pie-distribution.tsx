"use client";

import React, { useState } from "react";
import {
  PieChart as PieIcon,
  TrendingUp,
  Building2,
  BookOpen,
  Info,
  DollarSign,
  Layers,
} from "lucide-react";
import type {
  BouquetDistributionResult,
  UniversityDistributionItem,
} from "@/lib/services/bouquet-distribution";

interface BouquetPieDistributionProps {
  distribution: BouquetDistributionResult;
  highlightUniversityId?: string;
  highlightUniversityName?: string;
  showTitle?: boolean;
}

export function BouquetPieDistribution({
  distribution,
  highlightUniversityId,
  highlightUniversityName,
  showTitle = true,
}: BouquetPieDistributionProps) {
  const [hoveredUnivId, setHoveredUnivId] = useState<string | null>(null);

  const {
    bouquet_title,
    total_ca,
    currency,
    royalty_rate,
    total_royalties,
    total_books,
    total_consultations,
    items,
  } = distribution;

  // ─── Calcul SVG pour le diagramme circulaire vectoriel (Pie Chart) ───────
  const size = 300;
  const center = size / 2;
  const radius = 105;

  let cumulativeAngle = -Math.PI / 2; // Démarrage à 12h

  const slices = items.map((item) => {
    const fraction = item.usage_share_percent / 100;
    const angle = fraction * 2 * Math.PI;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    // Calcul des coordonnées d'arc
    const x1 = center + radius * Math.cos(startAngle);
    const y1 = center + radius * Math.sin(startAngle);
    const x2 = center + radius * Math.cos(endAngle);
    const y2 = center + radius * Math.sin(endAngle);

    const largeArc = angle > Math.PI ? 1 : 0;
    const pathData = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    // Angle médian pour positionner le libellé et l'explosion légère
    const midAngle = startAngle + angle / 2;
    const explodeDist = 3;
    const offsetX = explodeDist * Math.cos(midAngle);
    const offsetY = explodeDist * Math.sin(midAngle);

    // Position du point d'ancrage extérieur du libellé
    const labelRadius = radius + 32;
    const labelX = center + labelRadius * Math.cos(midAngle);
    const labelY = center + labelRadius * Math.sin(midAngle);

    // Coordonnées de l'extrémité sur le pourtour du cercle
    const edgeX = center + (radius + 4) * Math.cos(midAngle);
    const edgeY = center + (radius + 4) * Math.sin(midAngle);

    return {
      item,
      pathData,
      offsetX,
      offsetY,
      labelX,
      labelY,
      edgeX,
      edgeY,
      midAngle,
    };
  });

  // ─── Bar Chart Horizontal des Redevances ─────────────────────────────────
  const maxRoyalty = Math.max(...items.map((it) => it.royalty_amount), 1);
  // Générateur d'échelle pour l'axe horizontal (0, 200, 400...)
  const scaleStep = Math.ceil(maxRoyalty / 4 / 50) * 50 || 100;
  const scaleTicks = [0, scaleStep, scaleStep * 2, scaleStep * 3, scaleStep * 4];

  // Inverser l'ordre des barres pour afficher du plus petit en haut au plus grand en bas (comme dans la capture UNA -> Parakou -> UAC)
  const reversedItems = [...items].reverse();

  const isHighlighted = (item: UniversityDistributionItem) => {
    if (highlightUniversityId && item.institution_id === highlightUniversityId) return true;
    if (
      highlightUniversityName &&
      item.institution_name.toLowerCase().includes(highlightUniversityName.toLowerCase())
    )
      return true;
    return false;
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 rounded-3xl bg-background border border-border space-y-8 shadow-xs">
      {/* Titre Général de la Section */}
      {showTitle && (
        <div className="text-center space-y-1 pb-4 border-b border-border">
          <h2 className="font-serif font-bold text-lg sm:text-2xl text-navy">
            Répartition des redevances &ndash; Bouquets Documentaires
          </h2>
          <p className="text-xs text-foreground-muted">
            Modèle de calcul dynamique par usage réel &bull; {bouquet_title} &bull; Taux conventionné :{" "}
            <span className="font-bold text-navy">{royalty_rate}%</span>
          </p>
        </div>
      )}

      {/* ─── GRILLE 2 COLONNES : DIAGRAMME CIRCULAIRE (GAUCHE) & BARRES HORIZONTALES (DROITE) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* COLONNE GAUCHE : DIAGRAMME CIRCULAIRE PLEIN (PIE CHART) */}
        <div className="p-5 rounded-2xl bg-background-secondary border border-border space-y-4 flex flex-col items-center">
          <div className="text-center space-y-0.5">
            <h3 className="font-bold text-xs sm:text-sm text-navy">
              Répartition des consultations
            </h3>
            <p className="text-[11px] text-foreground-muted font-mono">
              (Total bouquet : {total_ca.toLocaleString("fr-FR")} {currency})
            </p>
          </div>

          <div className="relative w-full max-w-[320px] aspect-square flex items-center justify-center my-2">
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="w-full h-full overflow-visible"
              aria-label="Diagramme de répartition institutionnelle des consultations"
            >
              {slices.map((slice) => {
                const isHovered = hoveredUnivId === slice.item.institution_id;
                const isItemHighlighted = isHighlighted(slice.item);

                return (
                  <g
                    key={slice.item.institution_id}
                    className="cursor-pointer transition-transform duration-200"
                    onMouseEnter={() => setHoveredUnivId(slice.item.institution_id)}
                    onMouseLeave={() => setHoveredUnivId(null)}
                    style={{
                      transform: isHovered
                        ? `translate(${slice.offsetX * 2.5}px, ${slice.offsetY * 2.5}px)`
                        : `translate(${slice.offsetX}px, ${slice.offsetY}px)`,
                    }}
                  >
                    {/* Segment plein */}
                    <path
                      d={slice.pathData}
                      fill={slice.item.color}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      className="transition-opacity duration-150"
                      opacity={hoveredUnivId && !isHovered ? 0.65 : 1}
                    />

                    {/* Ligne indicatrice vers l'étiquette extérieure */}
                    <polyline
                      points={`${slice.edgeX},${slice.edgeY} ${slice.labelX},${slice.labelY}`}
                      fill="none"
                      stroke={slice.item.color}
                      strokeWidth={1.2}
                      strokeDasharray="2,2"
                      opacity={0.8}
                    />

                    {/* Étiquette textuelle extérieure */}
                    <text
                      x={slice.labelX}
                      y={slice.labelY}
                      textAnchor={slice.labelX >= center ? "start" : "end"}
                      dominantBaseline="middle"
                      className="text-[10px] font-sans font-bold"
                      fill={slice.item.color}
                    >
                      <tspan
                        x={slice.labelX >= center ? slice.labelX + 4 : slice.labelX - 4}
                        dy="-0.3em"
                        className="font-semibold text-[10px]"
                      >
                        {slice.item.short_name}
                      </tspan>
                      <tspan
                        x={slice.labelX >= center ? slice.labelX + 4 : slice.labelX - 4}
                        dy="1.2em"
                        className="text-[9px] font-normal"
                        fill="#6B7280"
                      >
                        {slice.item.consultations_count.toLocaleString("fr-FR")} consult. ({slice.item.usage_share_percent}%)
                      </tspan>
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Légende interactive sous le diagramme circulaire */}
          <div className="w-full flex flex-wrap items-center justify-center gap-2.5 pt-2 border-t border-border/60">
            {items.map((item) => (
              <button
                key={item.institution_id}
                type="button"
                onMouseEnter={() => setHoveredUnivId(item.institution_id)}
                onMouseLeave={() => setHoveredUnivId(null)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-pointer ${
                  hoveredUnivId === item.institution_id
                    ? "border-navy text-navy font-bold bg-navy/5 shadow-2xs"
                    : isHighlighted(item)
                    ? "border-gold bg-gold/10 text-navy font-bold"
                    : "border-border bg-background text-foreground-muted"
                }`}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.short_name}</span>
                <span className="font-mono font-bold text-navy">
                  ({item.usage_share_percent}%)
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* COLONNE DROITE : BARRES HORIZONTALES (REDEVANCES UNIVERSITAIRES) */}
        <div className="p-5 rounded-2xl bg-background-secondary border border-border space-y-5 flex flex-col justify-between">
          <div className="text-center space-y-0.5">
            <h3 className="font-bold text-xs sm:text-sm text-navy">
              Redevances universitaires ({royalty_rate} %)
            </h3>
            <p className="text-[11px] text-foreground-muted">
              vers&eacute;es automatiquement selon l&apos;usage r&eacute;el
            </p>
          </div>

          {/* Graphique à barres horizontales conforme à la capture */}
          <div className="space-y-4 my-2 pr-2">
            {reversedItems.map((item) => {
              const barPercent = Math.min(100, Math.max(4, (item.royalty_amount / maxRoyalty) * 100));
              const isHovered = hoveredUnivId === item.institution_id;
              const isItemHighlighted = isHighlighted(item);

              return (
                <div
                  key={item.institution_id}
                  className={`space-y-1 p-2 rounded-xl transition-all cursor-pointer ${
                    isHovered
                      ? "bg-navy/5 ring-1 ring-navy/20"
                      : isItemHighlighted
                      ? "bg-gold/10 ring-1 ring-gold/30"
                      : ""
                  }`}
                  onMouseEnter={() => setHoveredUnivId(item.institution_id)}
                  onMouseLeave={() => setHoveredUnivId(null)}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="font-bold text-navy truncate">
                        {item.short_name}
                      </span>
                      {isItemHighlighted && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-gold text-navy font-bold uppercase">
                          Votre &eacute;tablissement
                        </span>
                      )}
                    </div>

                    <span className="font-mono text-xs font-bold text-navy shrink-0">
                      {item.royalty_amount.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {currency}
                    </span>
                  </div>

                  {/* Barre horizontale */}
                  <div className="h-6 w-full bg-background rounded-lg border border-border/80 overflow-hidden flex items-center p-0.5">
                    <div
                      className="h-full rounded-md transition-all duration-500 flex items-center justify-end pr-2"
                      style={{
                        width: `${barPercent}%`,
                        backgroundColor: item.color,
                      }}
                    >
                      {barPercent > 25 && (
                        <span className="text-[10px] text-white font-mono font-bold drop-shadow-xs">
                          {item.usage_share_percent}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Axe horizontal de graduation (échelle en bas) */}
          <div className="pt-3 border-t border-border/70 space-y-1">
            <div className="flex justify-between text-[10px] font-mono text-foreground-muted px-1">
              {scaleTicks.map((tick) => (
                <span key={tick}>{tick}</span>
              ))}
            </div>
            <p className="text-center text-[10px] text-foreground-muted font-medium">
              Redevance universitaire ({currency})
            </p>
          </div>
        </div>
      </div>

      {/* ─── TABLEAU DE CALCUL OFFICIEL (SECTION 11.2 DU CAHIER DES CHARGES) ─── */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-serif font-bold text-base text-navy flex items-center gap-2">
              <Layers className="w-4 h-4 text-gold" />
              R&eacute;partition des redevances &ndash; Exemple bouquet {total_ca.toLocaleString("fr-FR")} {currency}
            </h3>
            <p className="text-[11px] text-foreground-muted">
              Prorata calcul&eacute; sur {total_books} ouvrages et {total_consultations.toLocaleString("fr-FR")} consultations totales
            </p>
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-gold/15 text-navy font-bold border border-gold/30 self-start sm:self-auto">
            <DollarSign className="w-3.5 h-3.5 text-gold" />
            Taux Redevance : {royalty_rate}%
          </span>
        </div>

        {/* Tableau Responsive */}
        <div className="overflow-x-auto rounded-2xl border border-border shadow-xs">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-background-secondary border-b border-border text-navy font-bold">
                <th className="py-3 px-4">Universit&eacute;</th>
                <th className="py-3 px-4 text-center">Livres Poss&eacute;d&eacute;s</th>
                <th className="py-3 px-4 text-center">Part Utilisation (%)</th>
                <th className="py-3 px-4 text-right">Part du CA ({currency})</th>
                <th className="py-3 px-4 text-right">Redevance Revers&eacute;e ({royalty_rate} %)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70 bg-background">
              {items.map((item) => {
                const isHovered = hoveredUnivId === item.institution_id;
                const isItemHighlighted = isHighlighted(item);

                return (
                  <tr
                    key={item.institution_id}
                    className={`transition-colors ${
                      isHovered
                        ? "bg-navy/5"
                        : isItemHighlighted
                        ? "bg-gold/10 font-medium"
                        : "hover:bg-background-secondary/50"
                    }`}
                    onMouseEnter={() => setHoveredUnivId(item.institution_id)}
                    onMouseLeave={() => setHoveredUnivId(null)}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <div>
                          <p className="font-bold text-navy">{item.institution_name}</p>
                          <p className="text-[10px] text-foreground-muted">
                            Sigle : {item.short_name} &bull; {item.consultations_count.toLocaleString("fr-FR")} lectures
                          </p>
                        </div>
                        {isItemHighlighted && (
                          <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-gold text-navy font-bold uppercase shrink-0">
                            Votre &eacute;tablissement
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-navy">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-navy/5">
                        {item.books_count} {item.books_count > 1 ? "livres" : "livre"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-navy">
                      {item.usage_share_percent}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-semibold text-foreground">
                      {item.ca_share_allocated.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {currency}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-navy">
                      {item.royalty_amount.toLocaleString("fr-FR", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {currency}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Ligne des Totaux */}
            <tfoot>
              <tr className="bg-navy-light/60 border-t-2 border-navy/20 font-bold text-navy text-xs">
                <td className="py-3 px-4 uppercase tracking-wider">Total Consolid&eacute;</td>
                <td className="py-3 px-4 text-center font-mono">{total_books} livres</td>
                <td className="py-3 px-4 text-center font-mono">100.00 %</td>
                <td className="py-3 px-4 text-right font-mono">
                  {total_ca.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  {currency}
                </td>
                <td className="py-3 px-4 text-right font-mono text-sm text-gold">
                  {total_royalties.toLocaleString("fr-FR", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  {currency}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
