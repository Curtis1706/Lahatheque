"use client";

import React from "react";
import { BookOpen, Building2, MapPin, Sparkles } from "lucide-react";
import { Globe, type Marker, type Arc } from "@/components/ui/cobe-globe";

const HUBS_AFRICA = [
  { id: "bj", name: "Bénin", city: "Cotonou", location: [6.3654, 2.4183] as [number, number], hub: true },
  { id: "sn", name: "Sénégal", city: "Dakar", location: [14.7167, -17.4677] as [number, number] },
  { id: "ci", name: "Côte d'Ivoire", city: "Abidjan", location: [5.3600, -4.0083] as [number, number] },
  { id: "cd", name: "RDC", city: "Kinshasa", location: [-4.4419, 15.2663] as [number, number] },
];

const HUBS_GLOBAL = [
  { id: "fr", name: "France", city: "Paris", location: [48.8566, 2.3522] as [number, number] },
  { id: "ca", name: "Canada", city: "Montréal", location: [45.5017, -73.5673] as [number, number] },
  { id: "ch", name: "Suisse", city: "Genève", location: [46.2044, 6.1432] as [number, number] },
  { id: "ae", name: "Émirats", city: "Dubaï", location: [25.2048, 55.2708] as [number, number] },
  { id: "us", name: "États-Unis", city: "New York", location: [40.7128, -74.0060] as [number, number] },
];

const ALL_NODES = [...HUBS_AFRICA, ...HUBS_GLOBAL];

const markers: Marker[] = ALL_NODES.map((c) => ({
  id: c.id,
  location: c.location,
  label: `${c.name} (${c.city})`,
}));

const hubLocation: [number, number] = [6.3654, 2.4183]; // Cotonou, Bénin

const arcs: Arc[] = ALL_NODES.filter((c) => !("hub" in c && c.hub)).map((c) => ({
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
              Rayonnement Panafricain &amp; International
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight">
              Une présence panafricaine &amp; mondiale
            </h2>
            <p className="text-sm text-white/70 mt-3 leading-relaxed">
              LAHAThèque connecte les universités africaines aux grands pôles académiques et éditoriaux mondiaux à travers un réseau d&apos;échange numérique sécurisé et de distribution de savoir.
            </p>
          </div>

          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-navy-dark/60">
              <h3 className="font-serif text-lg text-gold font-bold mb-1.5 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gold" />
                Expertise locale &amp; Rayonnement
              </h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Fonds académique conforme aux référentiels CAMES et partenariats éditoriaux francophones internationaux.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-navy-dark/60">
              <h3 className="font-serif text-lg text-gold font-bold mb-1.5 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gold" />
                Innovation &amp; Accès Universel
              </h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Lecteur web haute sécurité sous DRM LCP, streaming de pages instantané et consultation optimisée sur tout navigateur.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-navy-dark/60">
              <h3 className="font-serif text-lg text-gold font-bold mb-1.5 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold" />
                Réseau de distribution hybride
              </h3>
              <p className="text-sm text-white/80 leading-relaxed">
                Hub logistique central à Cotonou et relais d&apos;impression partenaires pour la distribution physique des ouvrages.
              </p>
            </div>
          </div>
        </div>

        {/* Colonne Droite — Carte avec Globe 3D & Tags Pays */}
        <div className="flex justify-center">
          <div className="w-full max-w-lg bg-navy-dark p-6 sm:p-8 rounded-3xl text-center shadow-xl">
            <p className="text-base font-medium text-white mb-1">
              Réseau académique et partenariats connectés
            </p>
            

            {/* Globe 3D Cobe */}
            <div className="w-full max-w-[340px] sm:max-w-[400px] aspect-square mx-auto relative my-2">
              <Globe
                markers={markers}
                arcs={arcs}
                markerColor={[0.93, 0.70, 0.25]} // Gold (#EF9F27)
                baseColor={[0.22, 0.32, 0.58]}   // Continents contrastés
                arcColor={[0.93, 0.70, 0.25]}    // Arcs dorés
                glowColor={[0.12, 0.18, 0.35]}   // Halo navy
                dark={0.80}
                mapBrightness={13}
                markerSize={0.045}
                markerElevation={0.03}
                arcWidth={0.9}
                arcHeight={0.35}
                speed={0.0025}
                theta={0.15}
                diffuse={1.8}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
export default PanafricanPresenceSection;
