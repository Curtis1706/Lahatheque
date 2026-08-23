"use client";

import React, { useState } from "react";
import { Globe as GlobeIcon, MapPin, Sparkles, Building2, BookOpen } from "lucide-react";
import { Globe, type Marker, type Arc } from "@/components/ui/cobe-globe";

const COUNTRIES = [
  { id: "bj", name: "Bénin", city: "Cotonou", location: [6.3654, 2.4183] as [number, number], hub: true },
  { id: "sn", name: "Sénégal", city: "Dakar", location: [14.7167, -17.4677] as [number, number] },
  { id: "ci", name: "Côte d'Ivoire", city: "Abidjan", location: [5.3600, -4.0083] as [number, number] },
  { id: "tg", name: "Togo", city: "Lomé", location: [6.1375, 1.2123] as [number, number] },
  { id: "ne", name: "Niger", city: "Niamey", location: [13.5116, 2.1254] as [number, number] },
  { id: "ml", name: "Mali", city: "Bamako", location: [12.6392, -8.0029] as [number, number] },
  { id: "ga", name: "Gabon", city: "Libreville", location: [0.4162, 9.4673] as [number, number] },
  { id: "cd", name: "RDC", city: "Kinshasa", location: [-4.4419, 15.2663] as [number, number] },
];

const markers: Marker[] = COUNTRIES.map((c) => ({
  id: c.id,
  location: c.location,
  label: `${c.name} (${c.city})`,
}));

const hubLocation: [number, number] = [6.3654, 2.4183]; // Cotonou, Bénin

const arcs: Arc[] = COUNTRIES.filter((c) => !c.hub).map((c) => ({
  id: `bj-${c.id}`,
  from: hubLocation,
  to: c.location,
  label: `Bénin → ${c.name}`,
}));

export function PanafricanPresenceSection() {
  const [activeCountry, setActiveCountry] = useState<string>("bj");

  const selectedCountry = COUNTRIES.find((c) => c.id === activeCountry) || COUNTRIES[0];

  return (
    <section className="py-20 px-6 md:px-10 bg-navy text-white relative overflow-hidden border-t border-navy-hover">
      {/* Halo lumineux subtil */}
      <div className="absolute top-1/2 left-3/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        {/* Colonne Gauche — Argumentaire */}
        <div className="lg:col-span-5 space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 border border-gold/30 text-gold text-xs font-bold uppercase tracking-wider mb-4">
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

          <div className="space-y-6 divide-y divide-navy-hover/60">
            <div className="pt-2">
              <h3 className="font-serif text-lg text-gold font-bold mb-1.5 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gold" />
                Expertise locale
              </h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Des contenus académiques rigoureusement conformes aux programmes universitaires et réalités africaines.
              </p>
            </div>

            <div className="pt-6">
              <h3 className="font-serif text-lg text-gold font-bold mb-1.5 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gold" />
                Innovation technologique
              </h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Liseuse optimisée pour les connexions bas débit, protection LCP et synchronisation hors-ligne.
              </p>
            </div>

            <div className="pt-6">
              <h3 className="font-serif text-lg text-gold font-bold mb-1.5 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold" />
                Réseau logistique &amp; dépôts
              </h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Entrepôts et partenaires d&apos;impression pour la livraison physique express de vos manuels reliés.
              </p>
            </div>
          </div>
        </div>

        {/* Colonne Droite — Globe 3D Cobe & Pays */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-xl bg-navy-dark/90 p-6 sm:p-8 rounded-3xl border border-navy-hover shadow-2xl flex flex-col items-center backdrop-blur-xs">
            {/* Titre & sous-titre */}
            <div className="text-center space-y-1 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-gold/15 border border-gold/30 text-gold flex items-center justify-center mx-auto mb-2 shadow-xs">
                <GlobeIcon className="w-5 h-5 text-gold" />
              </div>
              <h3 className="font-serif font-bold text-lg text-white">
                Déjà présent dans plusieurs pays :
              </h3>
              <p className="text-xs text-white/60">
                Faites tourner le globe ou sélectionnez un pays pour explorer notre réseau
              </p>
            </div>

            {/* Globe 3D interactif Cobe */}
            <div className="w-full max-w-[340px] sm:max-w-[400px] aspect-square relative my-2">
              <Globe
                markers={markers}
                arcs={arcs}
                markerColor={[0.85, 0.68, 0.32]} // Gold vibrant
                baseColor={[0.12, 0.18, 0.35]}   // Navy doux
                arcColor={[0.85, 0.68, 0.32]}    // Gold arcs
                glowColor={[0.18, 0.28, 0.52]}   // Halo navy
                dark={1}
                mapBrightness={8}
                markerSize={0.045}
                markerElevation={0.025}
                arcWidth={0.7}
                arcHeight={0.3}
                speed={0.0025}
                theta={0.1}
                diffuse={1.7}
              />
            </div>

            {/* Pills des pays */}
            <div className="w-full pt-4 border-t border-navy-hover/60">
              <div className="flex flex-wrap justify-center gap-2 text-xs font-bold">
                {COUNTRIES.map((c) => {
                  const isActive = c.id === activeCountry;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setActiveCountry(c.id)}
                      className={`px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        isActive
                          ? "bg-gold text-navy border-gold shadow-xs scale-105"
                          : "bg-navy border-navy-hover text-white/90 hover:border-gold/60 hover:text-white"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-navy" : "bg-gold"}`} />
                      {c.name}
                    </button>
                  );
                })}
              </div>

              {/* Détails du pays actif */}
              <div className="mt-4 p-3 rounded-2xl bg-navy/60 border border-navy-hover/80 text-center text-xs">
                <span className="text-gold font-bold font-serif">{selectedCountry.name} ({selectedCountry.city})</span>
                <span className="text-white/70 block text-[11px] mt-0.5">
                  {selectedCountry.hub
                    ? "Siège principal & Hub logistique d'expédition Afrique de l'Ouest"
                    : "Réseau de distribution académique & partenariats universitaires actifs"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
