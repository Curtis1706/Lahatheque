"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BookOpen,
  ShieldCheck,
  Smartphone,
  Coins,
  Award,
} from "lucide-react";

const features = [
  {
    icon: BookOpen,
    title: "Richesse du catalogue",
    description:
      "Plus grand fonds d'ouvrages universitaires africains numérisés. Des milliers de titres couvrant toutes les disciplines académiques.",
  },
  {
    icon: ShieldCheck,
    title: "Qualité garantie",
    description:
      "Ouvrages sélectionnés et validés par des comités scientifiques universitaires et comités de lecture reconnus.",
  },
  {
    icon: Smartphone,
    title: "Accessibilité",
    description:
      "Lecture hors-ligne et compatibilité multi-supports : ordinateur, tablette et smartphone.",
  },
  {
    icon: Coins,
    title: "Tarifs adaptés",
    description:
      "Des offres pensées pour le pouvoir d'achat des étudiants africains et des formules d'abonnement flexibles.",
  },
  {
    icon: Award,
    title: "Ouvrages adaptés aux réalités locales",
    description:
      "Des contenus académiques, juridiques (OHADA), économiques et scientifiques en prise directe avec les contextes, programmes universitaires et réalités du continent africain.",
  },
];

export function WhyChooseSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="bg-background py-16 sm:py-20 px-4 sm:px-6 md:px-10 border-t border-border">
      <div className="mx-auto max-w-6xl">
        {/* En-tête */}
        <div className="text-center mb-10 sm:mb-14">
          <span className="inline-block text-xs font-bold tracking-[0.15em] uppercase mb-3 text-gold">
            Nos avantages
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-navy">
            Pourquoi choisir Lahathèque ?
          </h2>
        </div>

        {/* Grille — 3 cartes en haut */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4">
          {features.slice(0, 3).map((feature, idx) => (
            <FeatureCard
              key={idx}
              index={idx}
              feature={feature}
              hoveredIndex={hoveredIndex}
              setHoveredIndex={setHoveredIndex}
            />
          ))}
        </div>

        {/* Grille — 2 cartes en bas centrées */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 max-w-4xl mx-auto mt-2 sm:mt-4">
          {features.slice(3).map((feature, idx) => (
            <FeatureCard
              key={idx + 3}
              index={idx + 3}
              feature={feature}
              hoveredIndex={hoveredIndex}
              setHoveredIndex={setHoveredIndex}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({
  feature,
  index,
  hoveredIndex,
  setHoveredIndex,
}: {
  feature: (typeof features)[number];
  index: number;
  hoveredIndex: number | null;
  setHoveredIndex: (i: number | null) => void;
}) {
  const Icon = feature.icon;
  const isHovered = hoveredIndex === index;

  return (
    <div
      className="relative block p-2 sm:p-3 h-full w-full group cursor-pointer"
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {/* Animation d'arrière-plan glissant */}
      <AnimatePresence>
        {isHovered && (
          <motion.span
            className="absolute inset-0 block h-full w-full rounded-2xl bg-gold/10"
            layoutId="featureHoverBg"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { duration: 0.15 },
            }}
            exit={{
              opacity: 0,
              transition: { duration: 0.15, delay: 0.1 },
            }}
          />
        )}
      </AnimatePresence>

      {/* Contenu de la carte */}
      <div
        className={`relative z-10 rounded-2xl p-6 sm:p-7 border transition-all duration-300 h-full flex flex-col ${
          isHovered
            ? "border-gold/40 bg-background-secondary shadow-md"
            : "border-border/60 bg-transparent"
        }`}
      >
        {/* Conteneur d'icône */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 shrink-0 ${
            isHovered
              ? "bg-gold/15 text-gold scale-105"
              : "bg-navy/5 text-navy/70"
          }`}
        >
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>

        {/* Titre */}
        <h3
          className={`font-serif text-lg font-bold mb-2 transition-all duration-200 ${
            isHovered ? "text-gold translate-x-1" : "text-navy"
          }`}
        >
          {feature.title}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm leading-relaxed text-foreground-muted">
          {feature.description}
        </p>
      </div>
    </div>
  );
}

export default WhyChooseSection;
