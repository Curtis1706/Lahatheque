"use client";

import React from "react";
import { BookOpen, Building2, MapPin, Sparkles } from "lucide-react";
import { Globe, type Marker, type Arc } from "@/components/ui/cobe-globe";

const COUNTRIES = [
  { id: "bj", name: "Bénin", location: [6.3654, 2.4183] as [number, number], hub: true },
  { id: "sn", name: "Sénégal", location: [14.7167, -17.4677] as [number, number] },
  { id: "ci", name: "Côte d'Ivoire", location: [5.3600, -4.0083] as [number, number] },
  { id: "tg", name: "Togo", location: [6.1375, 1.2123] as [number, number] },
  { id: "ne", name: "Niger", location: [13.5116, 2.1254] as [number, number] },
  { id: "ml", name: "Mali", location: [12.6392, -8.0029] as [number, number] },
  { id: "ga", name: "Gabon", location: [0.4162, 9.4673] as [number, number] },
  { id: "cd", name: "RDC", location: [-4.4419, 15.2663] as [number, number] },
];

const markers: Marker[] = COUNTRIES.map((c) => ({
  id: c.id,
  location: c.location,
  label: c.name,
}));

const hubLocation: [number, number] = [6.3654, 2.4183]; // Cotonou, Bénin

const arcs: Arc[] = COUNTRIES.filter((c) => !c.hub).map((c) => ({
  id: `bj-${c.id}`,
  from: hubLocation,
  to: c.location,
  label: `Bénin → ${c.name}`,
}));

export function PanafricanPresenceSection() {
  return (
    <section className="py-20 px-6 md:px-10 bg-navy text-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Colonne Gauche — Argumentaire */}
        <div className="space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 text-gold text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" />
              Rayonnement Continental
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
              Une présence panafricaine
            </h2>
            <p className="text-sm text-white/70 mt-3 leading-relaxed">
              LAHAThèque connecte les universités, éditeurs et étudiants à travers un réseau panafricain intégré de distribution numérique et physique.
            </p>
          </div>

          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-navy-dark/60">
              <h3 className="font-serif text-lg text-gold font-bold mb-1.5 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gold" />
                Expertise locale
              </h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Des contenus adaptés aux réalités et aux programmes académiques africains (CAMES, ministères nationaux).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-navy-dark/60">
              <h3 className="font-serif text-lg text-gold font-bold mb-1.5 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gold" />
                Innovation technologique
              </h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Une liseuse ultra-légère sous DRM LCP, pensée pour les connexions bas débit et la lecture fluide sur mobile.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-navy-dark/60">
              <h3 className="font-serif text-lg text-gold font-bold mb-1.5 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold" />
                Réseau logistique &amp; dépôts
              </h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Entrepôts locaux et partenaires d&apos;impression pour la livraison physique express de vos manuels reliés.
              </p>
            </div>
          </div>
        </div>

        {/* Colonne Droite — Carte avec Globe 3D & Tags Pays */}
        <div className="flex justify-center">
          <div className="w-full max-w-lg bg-navy-dark p-6 sm:p-8 rounded-3xl text-center shadow-xl">
            <p className="text-base font-medium text-white mb-2">
              Déjà présent dans plusieurs pays :
            </p>
            <p className="text-xs text-white/60 mb-6">
              Réseau de distribution académique et logistique actif
            </p>

            {/* Globe 3D Cobe */}
            <div className="w-full max-w-[320px] sm:max-w-[380px] aspect-square mx-auto relative my-2">
              <Globe
                markers={markers}
                arcs={arcs}
                markerColor={[0.93, 0.70, 0.25]} // Gold (#EF9F27)
                baseColor={[0.22, 0.32, 0.58]}   // Continents contrastés
                arcColor={[0.93, 0.70, 0.25]}    // Arcs dorés
                glowColor={[0.12, 0.18, 0.35]}   // Halo navy sombre
                dark={0.82}
                mapBrightness={13}
                markerSize={0.05}
                markerElevation={0.025}
                arcWidth={0.8}
                arcHeight={0.3}
                speed={0.0025}
                theta={0.12}
                diffuse={1.8}
              />
            </div>

            {/* Badges Pays (statiques, sans sélection) */}
            <div className="flex flex-wrap justify-center gap-2 text-xs font-bold pt-6">
              {COUNTRIES.map((c) => (
                <span
                  key={c.id}
                  className="px-3.5 py-1.5 bg-navy-hover text-white rounded-full text-xs font-semibold"
                >
                  {c.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
