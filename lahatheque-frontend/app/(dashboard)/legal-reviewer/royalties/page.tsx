"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Percent, Sparkles, Edit2, Check, ArrowLeft, Users, ShieldCheck } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EditRoyaltyModal } from "@/components/features/legal/edit-royalty-modal";
import { RightsSplitterSlider } from "@/components/features/legal/rights-splitter-slider";
import {
  getBookRoyalties,
  updateBookRoyaltyRate,
  getAIRoyaltySuggestions,
  validateAISuggestion,
} from "@/lib/services/legal";
import type { BookRoyalty, AIRoyaltySuggestion, CoAuthorSplit } from "@/lib/types/legal";

import { toast } from "sonner";
import { Suspense } from "react";

function LegalRoyaltiesPageContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "suggestions" ? "suggestions" : "global";
  const [activeTab, setActiveTab] = useState<"global" | "suggestions">(initialTab);

  const [royalties, setRoyalties] = useState<BookRoyalty[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AIRoyaltySuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  // State pour modale d'édition
  const [selectedRoyalty, setSelectedRoyalty] = useState<BookRoyalty | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [rData, sData] = await Promise.all([
        getBookRoyalties(),
        getAIRoyaltySuggestions(),
      ]);
      setRoyalties(rData);
      setAiSuggestions(sData);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleUpdateRoyalty = async (newRate: number, applyRetroactively: boolean, universityRate?: number | null) => {
    if (!selectedRoyalty) return;
    const success = await updateBookRoyaltyRate(selectedRoyalty.book_id, newRate, applyRetroactively, universityRate);
    if (success) {
      setRoyalties((prev) =>
        prev.map((r) =>
          r.book_id === selectedRoyalty.book_id
            ? { ...r, current_rate: newRate, university_share_percent: universityRate, source: "manual_override" }
            : r
        )
      );
      toast.success(
        `Taux mis à jour à ${newRate}% ! ${
          applyRetroactively
            ? "Appliqué rétroactivement aux ventes antérieures."
            : "S'applique aux ventes futures."
        }`
      );
    } else {
      toast.error("Échec de la mise à jour du taux de droits d'auteur.");
    }
  };

  const handleValidateSuggestion = async (suggestionId: string, adjustedSplits?: CoAuthorSplit[]) => {
    const res = await validateAISuggestion(suggestionId, adjustedSplits);
    if (res.success) {
      setAiSuggestions((prev) => prev.filter((s) => s.id !== suggestionId));
      toast.success(res.message || "La suggestion IA de partage de droits a été validée et enregistrée avec succès !");
    } else {
      toast.error(res.error || "Impossible de valider la suggestion.");
    }
  };

  const globalColumns: DataTableColumn<BookRoyalty>[] = [
    {
      key: "title",
      header: "Titre de l'Ouvrage",
      cell: (row) => (
        <div>
          <p className="font-serif font-bold text-xs text-navy leading-snug">{row.title}</p>
          <p className="text-[10px] text-foreground-muted font-mono">
            {row.isbn ? `ISBN : ${row.isbn}` : "ISBN : Non assigné"}
          </p>
          {row.institution && (
            <p className="text-[10px] text-gold font-medium mt-0.5">
              {row.institution.name} &bull; Taux univ : {row.university_share_percent ?? row.institution.royalty_rate}%
              {row.university_share_percent !== undefined && row.university_share_percent !== null && row.university_share_percent !== row.institution.royalty_rate && " (spécifique)"}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "authors",
      header: "Auteur(s)",
      cell: (row) => <span className="font-semibold text-xs text-foreground">{row.authors.join(", ")}</span>,
    },
    {
      key: "current_rate",
      header: "Taux Actuel (%)",
      cell: (row) => (
        <span className="font-mono font-bold text-navy text-sm px-2.5 py-1 rounded-xl bg-gold/15 border border-gold/30">
          {row.current_rate}%
        </span>
      ),
    },
    {
      key: "source",
      header: "Provenance",
      cell: (row) => (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
            row.source === "ai_suggested"
              ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
              : "bg-navy-light text-navy border-navy/20"
          }`}
        >
          {row.source === "ai_suggested" ? "Suggéré par l'IA" : "Déclaré par le Juriste"}
        </span>
      ),
    },
    {
      key: "actions" as keyof BookRoyalty,
      header: "",
      cell: (row) => (
        <button
          type="button"
          onClick={() => setSelectedRoyalty(row)}
          className="px-3 py-1.5 rounded-xl bg-navy text-white text-[10px] font-bold hover:bg-navy-hover transition-colors whitespace-nowrap min-h-[36px] inline-flex items-center gap-1"
        >
          <Edit2 className="w-3.5 h-3.5 text-gold" />
          Ajuster le taux
        </button>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/legal-reviewer" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Droits d&apos;Auteur</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/legal-reviewer" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <Percent className="w-4 h-4 text-gold" />
            Gestion Exclusive des Droits
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Droits d&apos;Auteur &amp; Répartition IA
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Seul le Juriste peut enregistrer, modifier rétroactivement ou valider les pourcentages de droits d&apos;auteur.
          </p>
        </div>
      </div>

      {/* Onglets Global vs Suggestions IA */}
      <div className="flex items-center gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setActiveTab("global")}
          className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 ${
            activeTab === "global"
              ? "border-gold text-navy font-serif text-sm"
              : "border-transparent text-foreground-muted hover:text-navy"
          }`}
        >
          Vue globale des taux par livre ({royalties.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("suggestions")}
          className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 flex items-center gap-1.5 ${
            activeTab === "suggestions"
              ? "border-gold text-navy font-serif text-sm"
              : "border-transparent text-foreground-muted hover:text-navy"
          }`}
        >
          <Sparkles className="w-4 h-4 text-gold" />
          Suggestions IA à valider ({aiSuggestions.length})
        </button>
      </div>

      {/* Tab 1: Global */}
      {activeTab === "global" && (
        <DataTable
          data={royalties}
          columns={globalColumns}
          rowKey="book_id"
          loading={loading}
          emptyMessage="Aucun enregistrement de droits d'auteur."
          pageSize={10}
        />
      )}

      {/* Tab 2: Suggestions IA */}
      {activeTab === "suggestions" && (
        <div className="space-y-6">
          {aiSuggestions.length === 0 ? (
            <div className="p-8 text-center bg-background-secondary border border-border rounded-3xl space-y-2">
              <Check className="w-8 h-8 text-success mx-auto" />
              <h3 className="font-serif font-bold text-navy text-sm">Toutes les suggestions IA sont validées !</h3>
              <p className="text-xs text-foreground-muted">Aucun nouveau partage de droits en attente d&apos;examen.</p>
            </div>
          ) : (
            aiSuggestions.map((sug) => (
              <div key={sug.id} className="p-6 rounded-3xl bg-background border border-border shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gold/15 text-gold text-[10px] font-bold uppercase tracking-wider mb-1">
                      <Sparkles className="w-3 h-3" />
                      Confiance IA : {sug.ai_confidence}%
                    </div>
                    <h3 className="font-serif font-bold text-navy text-base leading-snug">{sug.title}</h3>
                    <p className="text-xs text-foreground-muted">Auteurs détectés : {sug.authors.join(", ")}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleValidateSuggestion(sug.id, sug.proposed_splits)}
                    className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 shadow-xs min-h-[44px] shrink-0"
                  >
                    <Check className="w-4 h-4 text-gold" />
                    Valider ce Partage de Droits
                  </button>
                </div>

                {/* Slider dual-range 21st.dev pour ajuster si besoin */}
                <RightsSplitterSlider
                  authors={sug.authors}
                  initialSplits={sug.proposed_splits}
                  onChange={(newSplits) => {
                    setAiSuggestions((prev) =>
                      prev.map((item) =>
                        item.id === sug.id ? { ...item, proposed_splits: newSplits } : item
                      )
                    );
                  }}
                />
              </div>
            ))
          )}
        </div>
      )}

      {selectedRoyalty && (
        <EditRoyaltyModal
          royalty={selectedRoyalty}
          isOpen={!!selectedRoyalty}
          onClose={() => setSelectedRoyalty(null)}
          onConfirm={handleUpdateRoyalty}
        />
      )}
    </div>
  );
}

export default function LegalRoyaltiesPage() {
  return (
    <Suspense fallback={<div className="p-8 space-y-4 animate-pulse"><div className="h-8 bg-background-secondary rounded w-1/3" /><div className="h-96 bg-background-secondary rounded-3xl" /></div>}>
      <LegalRoyaltiesPageContent />
    </Suspense>
  );
}
