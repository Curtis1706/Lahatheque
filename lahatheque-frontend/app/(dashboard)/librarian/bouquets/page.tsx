"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowLeft, ShieldCheck, CheckCircle2, BookOpen, Clock } from "lucide-react";
import { BundleSubscriptionCard } from "@/components/features/librarian/bundle-subscription-card";
import { SubscribeBundleModal } from "@/components/features/librarian/subscribe-bundle-modal";
import { getUniversityBundles, subscribeToBundle } from "@/lib/services/librarian";
import type { UniversityBundle } from "@/lib/types/librarian";

export default function UniversityBundlesPage() {
  const [bundles, setBundles] = useState<UniversityBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBundle, setSelectedBundle] = useState<UniversityBundle | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getUniversityBundles();
      setBundles(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleConfirmSubscribe = async (bundleId: string) => {
    const success = await subscribeToBundle(bundleId);
    if (success) {
      setBundles((prev) =>
        prev.map((b) => (b.id === bundleId ? { ...b, status: "active" } : b))
      );
      alert("Souscription au bouquet documentaire validée ! Les étudiants et enseignants peuvent désormais y accéder.");
    }
  };

  const availableBundles: UniversityBundle[] = [
    {
      id: "bdl-faseg-03",
      title: "Bouquet Économie, Gestion & Finance (FASEG)",
      description: "Collection de 50 manuels fondamentaux et revues économiques certifiées.",
      book_count: 50,
      target_audience: "etudiants",
      faculty_scope: "Faculté d'Économie (FASEG)",
      subscription_price: 4200000,
      status: "renewable",
      start_date: "-",
      end_date: "-",
      university_usage_share_percentage: 100,
      university_royalty_amount: 630000,
    },
    {
      id: "bdl-fsa-04",
      title: "Bouquet Agronomie, Climat & Développement Durable (FSA)",
      description: "40 mémoires, thèses et ouvrages spécialisés en agronomie tropicale.",
      book_count: 40,
      target_audience: "recherche",
      faculty_scope: "Faculté d'Agronomie (FSA)",
      subscription_price: 2900000,
      status: "renewable",
      start_date: "-",
      end_date: "-",
      university_usage_share_percentage: 100,
      university_royalty_amount: 435000,
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/librarian" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Bouquets Documentaires</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/librarian" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 text-gold" />
            Packs &amp; Abonnements Institutionnels (Section 11)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Bouquets Documentaires
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Consultez les bouquets souscrits par votre université et souscrivez à de nouvelles collections pour vos étudiants.
          </p>
        </div>
      </div>

      {/* Règle de confidentialité inter-établissements (Validation Client Point 4) */}
      <div className="p-4 rounded-2xl bg-gold/10 border border-gold/30 text-xs text-navy space-y-1">
        <p className="font-bold flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-gold" />
          Principe de Rétribution &amp; Confidentialité Inter-Établissements :
        </p>
        <p className="text-foreground-muted leading-relaxed">
          Pour les bouquets multi-établissements (section 11.2 du cahier des charges), chaque université ne voit **strictement que sa propre part d&apos;utilisation réelle et de redevances**. Les données des autres universités restent confidentielles.
        </p>
      </div>

      {/* Section 1: Bouquets Souscrits Actifs */}
      <div className="space-y-4">
        <h3 className="font-serif font-bold text-navy text-lg flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          Bouquets Documentaires Souscrits &amp; Actifs ({bundles.length})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {bundles.map((bundle) => (
            <BundleSubscriptionCard key={bundle.id} bundle={bundle} />
          ))}
        </div>
      </div>

      {/* Section 2: Offres de Bouquets Disponibles à la Souscription */}
      <div className="space-y-4 pt-6 border-t border-border">
        <h3 className="font-serif font-bold text-navy text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-gold" />
          Catalogue des Bouquets Disponibles à la Souscription
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {availableBundles.map((bundle) => (
            <BundleSubscriptionCard
              key={bundle.id}
              bundle={bundle}
              onSubscribe={(b) => setSelectedBundle(b)}
            />
          ))}
        </div>
      </div>

      {/* Modale de confirmation de souscription */}
      <SubscribeBundleModal
        bundle={selectedBundle}
        isOpen={selectedBundle !== null}
        onClose={() => setSelectedBundle(null)}
        onConfirmSubscribe={handleConfirmSubscribe}
      />
    </div>
  );
}
