"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  IconBooks,
  IconRosetteDiscountCheck,
  IconDevices,
  IconCoin,
  IconWallet,
} from "@tabler/icons-react";

// ─── Laha tokens ───
const GOLD = "#EF9F27";
const DARK = "#0F1B2D";

const features = [
  {
    icon: IconBooks,
    title: "Richesse du catalogue",
    description:
      "Plus grand fonds d'ouvrages universitaires africains numérisés. Des milliers de titres couvrant toutes les disciplines.",
  },
  {
    icon: IconRosetteDiscountCheck,
    title: "Qualité garantie",
    description:
      "Ouvrages sélectionnés et validés par des comités scientifiques universitaires reconnus.",
  },
  {
    icon: IconDevices,
    title: "Accessibilité",
    description:
      "Lecture hors ligne et compatibilité multi-supports : PC, tablette et mobile.",
  },
  {
    icon: IconCoin,
    title: "Tarifs adaptés",
    description:
      "Des offres pensées pour le pouvoir d'achat des étudiants africains.",
  },
  {
    icon: IconWallet,
    title: "Moyens de paiement",
    description:
      "Intégration des solutions de paiement local : Mobile Money, carte bancaire, et plus.",
  },
];

export default function WhyChooseSection() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="bg-white py-20 px-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-14">
          <span
            className="inline-block text-xs font-semibold tracking-[0.15em] uppercase mb-4"
            style={{ color: GOLD }}
          >
            Nos avantages
          </span>
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight"
            style={{ color: DARK }}
          >
            Pourquoi choisir Lahathèque ?
          </h2>
        </div>

        {/* Grid — 3 top */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0">
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
        {/* Grid — 2 bottom centered */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 max-w-4xl mx-auto">
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

  return (
    <div
      className="relative block p-3 h-full w-full group"
      onMouseEnter={() => setHoveredIndex(index)}
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {/* ── Aceternity sliding hover background ── */}
      <AnimatePresence>
        {hoveredIndex === index && (
          <motion.span
            className="absolute inset-0 block h-full w-full rounded-2xl"
            style={{ backgroundColor: "rgba(239, 159, 39, 0.07)" }}
            layoutId="featureHoverBg"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              transition: { duration: 0.15 },
            }}
            exit={{
              opacity: 0,
              transition: { duration: 0.15, delay: 0.2 },
            }}
          />
        )}
      </AnimatePresence>

      {/* ── Card content ── */}
      <div
        className="relative z-10 rounded-2xl p-7 border transition-colors duration-300"
        style={{
          borderColor:
            hoveredIndex === index
              ? "rgba(239, 159, 39, 0.3)"
              : "rgba(0, 0, 0, 0.06)",
          backgroundColor: hoveredIndex === index ? "white" : "transparent",
        }}
      >
        {/* Icon container */}
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-all duration-300"
          style={{
            backgroundColor:
              hoveredIndex === index
                ? "rgba(239, 159, 39, 0.12)"
                : "rgba(15, 27, 45, 0.04)",
            color: hoveredIndex === index ? GOLD : "rgba(15, 27, 45, 0.45)",
          }}
        >
          <Icon size={22} stroke={1.5} />
        </div>

        {/* Title — shifts right on hover like Aceternity */}
        <h3
          className="text-lg font-semibold mb-2 transition-all duration-200"
          style={{
            color: hoveredIndex === index ? GOLD : DARK,
            transform:
              hoveredIndex === index ? "translateX(4px)" : "translateX(0)",
          }}
        >
          {feature.title}
        </h3>

        {/* Description */}
        <p className="text-sm leading-relaxed text-gray-500">
          {feature.description}
        </p>
      </div>
    </div>
  );
}
