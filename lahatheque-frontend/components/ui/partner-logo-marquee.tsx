"use client";

import React from "react";
import Link from "next/link";
import { Building2, Sparkles, ArrowRight } from "lucide-react";

export interface PartnerLogo {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string;
  country: string;
  description: string;
}

export const PARTNER_LOGOS: PartnerLogo[] = [
  {
    id: "uac",
    name: "Université d'Abomey-Calavi",
    shortName: "UAC",
    logoUrl: "/partenaire/uac.jpg",
    country: "Bénin",
    description: "Plus grand pôle universitaire du Bénin — Facultés FADESP, FASEG, FSS"
  },
  {
    id: "una",
    name: "Université Nationale d'Agriculture",
    shortName: "UNA",
    logoUrl: "/partenaire/una.jpg",
    country: "Bénin",
    description: "Excellence agronomique et sciences environnementales"
  },
  {
    id: "unstim",
    name: "UNSTIM Abomey",
    shortName: "UNSTIM",
    logoUrl: "/partenaire/unstim.png",
    country: "Bénin",
    description: "Sciences, Technologies, Ingénierie & Mathématiques"
  },
  {
    id: "up",
    name: "Université de Parakou",
    shortName: "UP",
    logoUrl: "/partenaire/up.jpg",
    country: "Bénin",
    description: "Pôle universitaire du Nord-Bénin — Droit, Économie & Médecine"
  }
];

interface PartnerLogoMarqueeProps {
  title?: string;
  subtitle?: string;
  showSectionHeader?: boolean;
  className?: string;
}

export function PartnerLogoMarquee({
  title = "Nos universités & institutions partenaires",
  subtitle = "Des institutions académiques d'excellence engagées pour la diffusion du savoir",
  showSectionHeader = true,
  className = ""
}: PartnerLogoMarqueeProps) {
  // Dupliquer la liste pour un défilement infini fluide
  const marqueeItems = [...PARTNER_LOGOS, ...PARTNER_LOGOS, ...PARTNER_LOGOS, ...PARTNER_LOGOS];

  return (
    <section className={`py-12 md:py-16 overflow-hidden bg-background-secondary border-y border-border ${className}`}>
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        
        {/* Header optionnel */}
        {showSectionHeader && (
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 text-navy border border-gold/20 text-xs font-bold uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-gold" />
                Réseau Universitaire
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
                {title}
              </h2>
              <p className="text-xs sm:text-sm text-foreground-muted max-w-xl leading-relaxed">
                {subtitle}
              </p>
            </div>

            <Link
              href="/partners"
              className="text-xs sm:text-sm font-bold text-navy hover:text-gold transition-colors flex items-center gap-1 shrink-0 group"
            >
              Voir toutes les conventions
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-gold" />
            </Link>
          </div>
        )}

        {/* Conteneur Marquee avec Dégradés d'Estompement */}
        <div className="relative w-full overflow-hidden py-4">
          
          {/* Masques de fondu à gauche et à droite */}
          <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-background-secondary to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-background-secondary to-transparent z-10 pointer-events-none" />

          {/* Bande animée */}
          <div className="animate-marquee gap-6 items-center">
            {marqueeItems.map((partner, index) => (
              <Link
                key={`${partner.id}-${index}`}
                href="/partners"
                className="group shrink-0 w-64 sm:w-72 bg-background rounded-2xl border border-border p-4 shadow-sm hover:border-gold hover:shadow-md transition-all duration-300 flex items-center gap-4"
              >
                {/* Logo conteneur */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-white border border-border flex items-center justify-center p-2 shrink-0 group-hover:scale-105 transition-transform duration-200 shadow-sm overflow-hidden">
                  <img
                    src={partner.logoUrl}
                    alt={partner.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Métadonnées du partenaire */}
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-navy group-hover:text-gold transition-colors truncate">
                      {partner.shortName}
                    </span>
                    <span className="text-[10px] font-semibold text-foreground-muted bg-background-secondary px-1.5 py-0.5 rounded border border-border">
                      {partner.country}
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground-muted line-clamp-1 font-medium">
                    {partner.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}
