"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Layers,
  BookOpen,
  CheckCircle2,
  Download,
  Calendar,
  FileText,
  Building2,
  GraduationCap,
  Sparkles,
  PieChart,
} from "lucide-react";
import { BouquetDistributionModal } from "@/components/features/bouquets/bouquet-distribution-modal";
import { toast } from "sonner";
import { exportBouquetCatalogWord } from "@/lib/services/university";
import type { UniversityBouquet } from "@/lib/types/university";
import { InlineLoader } from "@/components/ui/page-loader";

interface BouquetCardProps {
  bouquet: UniversityBouquet;
  onSubscribe?: (bouquetId: string) => Promise<boolean>;
}

export function BouquetCard({ bouquet, onSubscribe }: BouquetCardProps) {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showDistribution, setShowDistribution] = useState(false);

  const handleSubscribe = async () => {
    if (!onSubscribe) return;
    setLoading(true);
    try {
      const ok = await onSubscribe(bouquet.offering_id || bouquet.id);
      if (ok) {
        toast.success(`Souscription activée pour le ${bouquet.title}.`);
      } else {
        toast.error("Erreur lors de la souscription au bouquet.");
      }
    } catch {
      toast.error("Une erreur réseau est survenue.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportWord = async () => {
    setExporting(true);
    try {
      await exportBouquetCatalogWord(bouquet);
      toast.success("Document Word (.doc) généré et téléchargé.");
    } catch {
      toast.error("Erreur lors de la génération du document.");
    } finally {
      setExporting(false);
    }
  };

  const isActive = bouquet.is_subscribed ?? (bouquet.status === "active");

  return (
    <div className="p-6 rounded-3xl bg-background border border-border flex flex-col justify-between gap-5 hover:border-gold/50 transition-all shadow-xs group">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-navy">
              <Layers className="w-3.5 h-3.5 text-gold" />
              <span>{bouquet.faculty_code || bouquet.discipline || "Bouquet Thématique"}</span>
            </div>
            <h3 className="font-serif text-lg font-bold text-navy leading-snug group-hover:text-navy-hover transition-colors">
              {bouquet.title}
            </h3>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-bold shrink-0 border ${
              isActive
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-navy-light text-navy border-navy-hover/20"
            }`}
          >
            {isActive ? "Souscription Active" : "Disponible à l'abonnement"}
          </span>
        </div>

        <p className="text-xs text-foreground-muted leading-relaxed line-clamp-2">
          {bouquet.description}
        </p>

        {/* Détails Métriques */}
        <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-background-secondary border border-border">
          <div className="space-y-0.5">
            <span className="text-[10px] text-foreground-muted font-medium flex items-center gap-1">
              <BookOpen className="w-3 h-3 text-gold" />
              Volumes Inclus
            </span>
            <p className="font-mono text-sm font-bold text-navy">
              {bouquet.books_count} ouvrages
            </p>
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-foreground-muted font-medium flex items-center gap-1">
              <Calendar className="w-3 h-3 text-gold" />
              Tarif Annuel Campus
            </span>
            <p className="font-mono text-sm font-bold text-navy">
              {bouquet.annual_price.toLocaleString("fr-FR")} {bouquet.currency}
            </p>
          </div>
        </div>

        {/* Badge Ouvrages Détenus par l'Établissement & Accès Camembert */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-gold/10 border border-gold/25 text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gold shrink-0" />
            <span className="font-bold text-navy">
              {bouquet.my_books_count ?? Math.max(1, Math.round(bouquet.books_count * 0.35))} de vos ouvrages inclus
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowDistribution(true)}
            className="text-[11px] font-bold text-gold hover:text-navy transition-colors inline-flex items-center gap-1 cursor-pointer"
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Voir Camembert</span>
          </button>
        </div>

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
                    <p className="text-xs font-serif font-bold text-navy truncate">
                      {b.title}
                    </p>
                    <p className="text-[10px] text-foreground-muted truncate">
                      {b.author}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-2 pt-4 border-t border-border">
        {isActive ? (
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
            <span className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold w-full justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Campus Abonn&eacute; (Acc&egrave;s Illimit&eacute;)
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full sm:w-auto flex-1 px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center justify-center gap-2 shadow-xs min-h-[44px] disabled:opacity-50"
          >
            {loading ? (
              <>
                <InlineLoader size={16} />
                <span>Validation en cours...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-gold" />
                <span>Souscrire au Bouquet</span>
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => setShowDistribution(true)}
          className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-gold/15 text-navy border border-gold/30 hover:bg-gold/25 text-xs font-bold transition-colors inline-flex items-center justify-center gap-1.5 min-h-[44px] cursor-pointer"
          title="Consulter le camembert et les statistiques de répartition"
        >
          <PieChart className="w-4 h-4 text-gold" />
          <span>Camembert &amp; Stats</span>
        </button>

        <button
          type="button"
          onClick={handleExportWord}
          disabled={exporting}
          className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-background-secondary border border-border hover:border-gold text-navy text-xs font-bold transition-colors inline-flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50"
          title="Exporter la liste des ouvrages du bouquet en Word (.doc)"
        >
          {exporting ? (
            <InlineLoader size={16} />
          ) : (
            <Download className="w-4 h-4 text-gold" />
          )}
          <span>Export Word</span>
        </button>
      </div>

      {/* Modale de Répartition et Camembert Statistique */}
      <BouquetDistributionModal
        open={showDistribution}
        onClose={() => setShowDistribution(false)}
        bouquet={{
          id: bouquet.id,
          title: bouquet.title,
          annual_price: bouquet.annual_price,
          currency: bouquet.currency,
        }}
        highlightUniversityName="Université"
      />
    </div>
  );
}
