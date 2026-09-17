"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Layers,
  BookOpen,
  CheckCircle2,
  Calendar,
  Sparkles,
  Clock,
  CreditCard,
  Key,
} from "lucide-react";
import {
  getBouquetRelevanceReport,
  type BouquetRelevanceReport,
} from "@/lib/services/university";
import type { UniversityBouquet } from "@/lib/types/university";
import { InlineLoader } from "@/components/ui/page-loader";
import { toast } from "sonner";
import { BouquetBooksModal } from "@/components/features/bouquets/bouquet-books-modal";

interface BouquetCardProps {
  bouquet: UniversityBouquet;
  onSubscribe?: (bouquetId: string, period: "monthly" | "annual") => Promise<boolean | any>;
}

export function BouquetCard({ bouquet, onSubscribe }: BouquetCardProps) {
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<"monthly" | "annual">("annual");
  const [relevance, setRelevance] = useState<BouquetRelevanceReport | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const isActive = bouquet.is_subscribed ?? (bouquet.status === "active");
  const monthlyPrice = bouquet.monthly_price || 50000;
  const annualPrice = bouquet.annual_price || 500000;

  React.useEffect(() => {
    let isMounted = true;
    const targetId = bouquet.offering_id || bouquet.id;
    if (targetId && !isActive) {
      getBouquetRelevanceReport(targetId)
        .then((data) => {
          if (isMounted) setRelevance(data);
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, [bouquet.id, bouquet.offering_id, isActive]);

  const handleSubscribe = async () => {
    if (!onSubscribe) return;
    setLoading(true);
    try {
      await onSubscribe(bouquet.offering_id || bouquet.id, selectedPeriod);
    } catch {
      toast.error("Une erreur réseau est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-background border border-border flex flex-col justify-between gap-5 hover:border-gold/50 transition-all shadow-xs group font-poppins">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-navy">
              <Layers className="w-3.5 h-3.5 text-gold" />
              <span>{bouquet.faculty_code || bouquet.discipline || "Bouquet Thématique"}</span>
            </div>
            <h3 className="font-playfair text-lg font-bold text-navy leading-snug group-hover:text-navy-hover transition-colors">
              {bouquet.title}
            </h3>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 border ${
              isActive
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-navy/10 text-navy border-navy/20"
            }`}
          >
            {isActive ? "Souscription Active" : "Disponible"}
          </span>
        </div>

        <p className="text-xs text-foreground/70 leading-relaxed line-clamp-2">
          {bouquet.description || "Accès documentaire académique certifié par LAHAThèque."}
        </p>

        {/* Détails Métriques & Tarifs */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-background-secondary/40 border border-border">
          <div className="space-y-0.5">
            <span className="text-[10px] text-foreground/60 font-medium flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-gold" />
              Volumes Inclus
            </span>
            <p className="font-mono text-sm font-bold text-navy">
              {bouquet.books_count} ouvrages
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-foreground/60 font-medium flex items-center gap-1">
              <CreditCard className="w-3 h-3 text-gold" />
              {isActive ? "Formule Souscrite" : "Sélection Formule"}
            </span>
            <p className="font-mono text-xs sm:text-sm font-bold text-gold">
              {isActive
                ? (bouquet.subscription_period === "monthly" ? "Mensuel (30j)" : "Annuel (365j)")
                : (selectedPeriod === "monthly"
                    ? `${monthlyPrice.toLocaleString("fr-FR")} FCFA/mois`
                    : `${annualPrice.toLocaleString("fr-FR")} FCFA/an`)}
            </p>
          </div>
        </div>

        {/* Sélecteur de Période (Mensuel / Annuel) pour les non-abonnés */}
        {!isActive && (
          <div className="space-y-1.5 pt-1">
            <label className="block text-[11px] font-semibold text-navy">
              Choisissez votre formule d&apos;abonnement :
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedPeriod("monthly")}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  selectedPeriod === "monthly"
                    ? "bg-navy text-white border-navy shadow-xs"
                    : "bg-background-secondary/30 border-border text-foreground hover:border-gold/40"
                }`}
              >
                <span className="text-[10px] font-medium block opacity-80">Mensuel (30 jours)</span>
                <span className="font-mono text-xs font-bold block mt-0.5">
                  {monthlyPrice.toLocaleString("fr-FR")} FCFA
                </span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedPeriod("annual")}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  selectedPeriod === "annual"
                    ? "bg-navy text-white border-navy shadow-xs"
                    : "bg-background-secondary/30 border-border text-foreground hover:border-gold/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium block opacity-80">Annuel (365 jours)</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-gold text-navy shrink-0">
                    Recommandé
                  </span>
                </div>
                <span className="font-mono text-xs font-bold block mt-0.5">
                  {annualPrice.toLocaleString("fr-FR")} FCFA
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Informations d'échéance si abonné */}
        {isActive && bouquet.end_date && (
          <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-900">
            <span className="flex items-center gap-1.5 font-medium">
              <Clock className="w-3.5 h-3.5 text-emerald-700" />
              Accès actif jusqu&apos;au
            </span>
            <span className="font-bold">
              {new Date(bouquet.end_date).toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        )}

        {/* Échantillon d'ouvrages avec Couvertures Visibles */}
        {bouquet.sample_books && bouquet.sample_books.length > 0 && (
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-navy">
              Titres Majeurs du Bouquet :
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {bouquet.sample_books.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center gap-2.5 p-2 rounded-xl bg-background border border-border hover:border-gold transition-colors"
                >
                  <div className="relative w-9 h-12 rounded bg-navy/10 overflow-hidden shrink-0 border border-border shadow-xs">
                    {b.cover_url ? (
                      <Image
                        src={b.cover_url}
                        alt={b.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-navy text-white text-[9px] font-bold">
                        LAHA
                      </div>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-playfair font-bold text-navy truncate">
                      {b.title}
                    </p>
                    <p className="text-[10px] text-foreground/60 truncate">
                      {b.author}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rapport de Pertinence des Bouquets (Section IA CDC) */}
        {!isActive && relevance && relevance.total_books > 0 && (
          <div className="p-3 rounded-xl bg-gold/5 border border-gold/20 space-y-1">
            <p className="text-xs font-semibold text-navy">
              {relevance.relevance_percent}% de ce bouquet correspond &agrave; vos disciplines enseign&eacute;es
            </p>
            <p className="text-[11px] text-foreground/70">
              {relevance.matching_books} sur {relevance.total_books} ouvrages
              {relevance.matched_disciplines && relevance.matched_disciplines.length > 0 && (
                <>, couvrant : {relevance.matched_disciplines.join(", ")}</>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-4 border-t border-border">
        <button
          type="button"
          onClick={() => setIsDetailsOpen(true)}
          className="w-full sm:flex-1 px-4 py-2.5 rounded-xl bg-background-secondary border border-border hover:border-gold hover:text-navy text-navy text-xs font-bold transition-colors inline-flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
        >
          <BookOpen className="w-4 h-4 text-gold" />
          <span>Consulter les Ouvrages ({bouquet.books_count})</span>
        </button>

        {isActive ? (
          <div className="w-full sm:flex-1 flex flex-col sm:flex-row items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold w-full sm:w-auto justify-center border border-emerald-200 min-h-[44px]">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Campus Abonné</span>
            </span>
            <Link
              href={`/university/bouquets/success?subscription_id=${bouquet.id}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors w-full sm:w-auto justify-center min-h-[44px] shadow-xs"
            >
              <Key className="w-3.5 h-3.5 text-gold" />
              <span>Identifiants &amp; Guide</span>
            </Link>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full sm:flex-1 px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center justify-center gap-2 shadow-xs min-h-[44px] disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <InlineLoader size={16} />
                <span>Paiement...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-gold" />
                <span>
                  Souscrire ({selectedPeriod === "monthly" ? "Mensuel" : "Annuel"})
                </span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Modale d'inspection des livres du bouquet avec lecture des extraits */}
      <BouquetBooksModal
        bouquet={bouquet as any}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        onSubscribe={onSubscribe}
      />
    </div>
  );
}
