"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SavoirAfriqueSection } from "@/components/features/about/savoir-afrique-section";

const MISSION_TAGS = [
  "Futurs juristes et magistrats",
  "Médecins et professionnels de santé",
  "Ingénieurs et bâtisseurs",
  "Enseignants et chercheurs",
  "Économistes et décideurs",
  "Entrepreneurs innovants",
];

export function VisionSection() {
  return (
    <section className="py-20 px-6 md:px-10 bg-background border-t border-border">
      <div className="max-w-4xl mx-auto space-y-14">

        {/* En-tête */}
        <div className="space-y-3 text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-gold">
            Notre Vision
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-navy">
            Du savoir que l&apos;on reçoit<br className="hidden sm:block" /> au savoir que l&apos;on partage
          </h2>
        </div>

        {/* Contenu narratif */}
        <div className="space-y-6 text-foreground/90 font-sans text-sm sm:text-base leading-relaxed">
          <p>
            Dans de nombreuses régions d&apos;Afrique, des millions d&apos;étudiants, de chercheurs, d&apos;enseignants et de passionnés de savoir partagent le même combat silencieux : accéder aux ouvrages dont ils ont besoin pour apprendre, réussir et transmettre.
          </p>

          <div className="bg-background-secondary p-6 sm:p-8 rounded-2xl border border-border">
            <p className="font-serif text-base sm:text-lg text-navy font-bold leading-relaxed">
              LAHAThèque est bien plus qu&apos;un diffuseur d&apos;ouvrages numériques. C&apos;est une passerelle entre le savoir et celles et ceux qui en ont besoin : une bibliothèque moderne pensée pour l&apos;Afrique et connectée au monde.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-serif text-xl font-bold text-navy">
              Notre Vision
            </h3>
            <p>
              Bâtir la première plateforme universitaire panafricaine capable de rendre accessibles des dizaines de milliers d&apos;ouvrages scientifiques, juridiques, économiques et techniques, tout en protégeant les droits patrimoniaux et moraux des auteurs et éditeurs.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <h3 className="font-serif text-xl font-bold text-navy">
              Notre Mission
            </h3>
            <p>
              Chaque livre diffusé sur LAHAThèque porte une mission : former, inspirer et préparer les bâtisseurs de demain :
            </p>
            <div className="flex flex-wrap gap-2.5 pt-2">
              {MISSION_TAGS.map((val, idx) => (
                <span
                  key={idx}
                  className="px-4 py-2 bg-navy text-white rounded-xl text-xs font-bold tracking-wide shadow-xs"
                >
                  {val}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Scène animée Savoir Afrique */}
        <SavoirAfriqueSection />

        {/* CTA vers À Propos */}
        <div className="text-center pt-2">
          <Link
            href="/about"
            className="inline-flex items-center gap-2 border border-navy hover:bg-navy hover:text-white text-navy px-8 py-3 rounded font-bold text-sm transition-all duration-200 group"
          >
            En savoir plus sur nous
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

      </div>
    </section>
  );
}
