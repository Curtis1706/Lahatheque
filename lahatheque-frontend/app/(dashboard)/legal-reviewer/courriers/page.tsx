"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  FileText,
  ArrowLeft,
  Search,
  Filter,
  CheckCircle2,
  Send,
  AlertTriangle,
  ExternalLink,
  Edit,
  RotateCcw,
  Clock,
  Check,
  Ban,
  Building2,
  User,
  Layers,
} from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { InlineLoader } from "@/components/ui/page-loader";
import { toast } from "sonner";
import type { CourrierOfficiel, CourrierStatus, CourrierCategory } from "@/lib/types/courrier";
import {
  getCourriers,
  getCourrierPdfPreviewUrl,
} from "@/lib/services/courrier";
import { EditCourrierModal } from "@/components/features/legal/edit-courrier-modal";
import {
  ValidateCourrierDialog,
  SendCourrierEmailDialog,
  CancelCourrierDialog,
} from "@/components/features/legal/courrier-action-dialogs";

const STATUS_FILTERS: { value: CourrierStatus | "all"; label: string }[] = [
  { value: "all", label: "Tous les courriers" },
  { value: "draft", label: "Brouillons" },
  { value: "validated", label: "Validés" },
  { value: "sent", label: "Envoyés" },
  { value: "canceled", label: "Annulés" },
];

const CATEGORY_LABELS: Record<CourrierCategory, string> = {
  royalty_author: "Redevance Auteur",
  royalty_university: "Redevance Université",
  royalty_publisher: "Redevance Éditeur",
  debt_reminder: "Relance Impayé",
  other: "Correspondance",
};

export default function LegalCourriersPage() {
  const [courriers, setCourriers] = useState<CourrierOfficiel[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<CourrierStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<CourrierCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modales d'action
  const [editingCourrier, setEditingCourrier] = useState<CourrierOfficiel | null>(null);
  const [validatingCourrier, setValidatingCourrier] = useState<CourrierOfficiel | null>(null);
  const [sendingCourrier, setSendingCourrier] = useState<CourrierOfficiel | null>(null);
  const [cancelingCourrier, setCancelingCourrier] = useState<CourrierOfficiel | null>(null);

  const fetchCourriers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCourriers({
        status: statusFilter,
        category: categoryFilter,
        search: searchQuery.trim() || undefined,
      });
      if (res.success && res.data) {
        setCourriers(res.data);
      } else {
        toast.error(res.error || "Impossible de charger la liste des courriers.");
      }
    } catch {
      toast.error("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    fetchCourriers();
  }, [fetchCourriers]);

  const handleOpenPdf = (courrier: CourrierOfficiel) => {
    const url = getCourrierPdfPreviewUrl(courrier.id);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCourrierUpdated = (updated: CourrierOfficiel) => {
    setCourriers((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  };

  const columns: DataTableColumn<CourrierOfficiel>[] = [
    {
      key: "reference",
      header: "Réf & Catégorie",
      cell: (row) => (
        <div className="space-y-1">
          <span className="font-mono font-bold text-xs text-navy tracking-wide block">
            {row.reference}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-navy/10 text-navy border border-navy/20">
            {CATEGORY_LABELS[row.category] || row.category_label}
          </span>
        </div>
      ),
    },
    {
      key: "recipient_name",
      header: "Destinataire",
      cell: (row) => (
        <div className="space-y-0.5">
          <p className="font-serif font-bold text-xs text-navy leading-snug">
            {row.recipient_name}
          </p>
          <p className="text-[11px] text-foreground-muted font-mono">
            {row.recipient_email || "Email non renseigné"}
          </p>
        </div>
      ),
    },
    {
      key: "period",
      header: "Période & Montant",
      cell: (row) => (
        <div className="space-y-0.5">
          <p className="font-mono font-bold text-gold text-xs">
            {row.amount.toLocaleString("fr-FR")} FCFA
          </p>
          <p className="text-[11px] text-foreground-muted">
            {row.period || "Période standard"}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut",
      cell: (row) => {
        switch (row.status) {
          case "draft":
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-navy/10 text-navy border border-navy/20">
                <Clock className="w-3 h-3 text-gold" />
                Brouillon
              </span>
            );
          case "validated":
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-gold/15 text-navy border border-gold/30">
                <Check className="w-3 h-3 text-gold" />
                Validé
              </span>
            );
          case "sent":
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
                <Send className="w-3 h-3 text-emerald-600" />
                Envoyé
              </span>
            );
          case "canceled":
            return (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl bg-background-secondary text-foreground-muted border border-border">
                <Ban className="w-3 h-3" />
                Annulé
              </span>
            );
          default:
            return <span className="text-xs text-foreground-muted">{row.status_label}</span>;
        }
      },
    },
    {
      key: "created_at",
      header: "Créé le",
      cell: (row) => (
        <span className="text-xs text-foreground-muted font-mono">
          {new Date(row.created_at).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Action PDF toujours active */}
          <button
            type="button"
            onClick={() => handleOpenPdf(row)}
            className="px-2.5 py-1.5 rounded-xl border border-border bg-background text-navy text-xs font-bold hover:bg-background-secondary transition-colors inline-flex items-center gap-1 min-h-[36px] cursor-pointer"
            title="Aperçu direct du PDF officiel dans le navigateur"
          >
            <FileText className="w-3.5 h-3.5 text-gold" />
            <span>PDF</span>
            <ExternalLink className="w-3 h-3 text-foreground-muted" />
          </button>

          {/* Action Corriger (Brouillon seulement) */}
          {row.status === "draft" && (
            <button
              type="button"
              onClick={() => setEditingCourrier(row)}
              className="px-2.5 py-1.5 rounded-xl border border-border bg-background text-navy text-xs font-bold hover:bg-background-secondary transition-colors inline-flex items-center gap-1 min-h-[36px] cursor-pointer"
              title="Personnaliser l'objet et le texte du courrier"
            >
              <Edit className="w-3.5 h-3.5 text-gold" />
              <span>Corriger</span>
            </button>
          )}

          {/* Action Valider (Brouillon seulement) */}
          {row.status === "draft" && (
            <button
              type="button"
              onClick={() => setValidatingCourrier(row)}
              className="px-2.5 py-1.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-1 min-h-[36px] cursor-pointer shadow-xs"
              title="Valider définitivement et figer le PDF sur gabarit officiel"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-gold" />
              <span>Valider</span>
            </button>
          )}

          {/* Action Envoyer par email (Validé seulement) */}
          {row.status === "validated" && (
            <button
              type="button"
              onClick={() => setSendingCourrier(row)}
              className="px-2.5 py-1.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-1 min-h-[36px] cursor-pointer shadow-xs"
              title="Expédier l'email officiel avec le PDF certifié en pièce jointe"
            >
              <Send className="w-3.5 h-3.5 text-gold" />
              <span>Envoyer par email</span>
            </button>
          )}

          {/* Action Annuler (Brouillon ou Validé) */}
          {(row.status === "draft" || row.status === "validated") && (
            <button
              type="button"
              onClick={() => setCancelingCourrier(row)}
              className="px-2.5 py-1.5 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors inline-flex items-center gap-1 min-h-[36px] cursor-pointer"
              title="Annuler ce courrier"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Annuler</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto font-sans">
      {/* Fil d'Ariane */}
      <nav aria-label="Fil d'Ariane" className="flex items-center gap-2 text-xs text-foreground-muted font-sans">
        <Link href="/legal-reviewer" className="hover:text-navy transition-colors">
          Vue d&apos;ensemble
        </Link>
        <span>/</span>
        <span className="text-navy font-bold">Courriers Officiels</span>
      </nav>

      {/* En-tête principal */}
      <div className="border-b border-border pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <FileText className="w-4 h-4 text-gold" />
            Correspondances Institutionnelles &amp; Recouvrement
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Courriers Officiels LAHAThèque
          </h1>
          <p className="text-xs text-foreground-muted mt-1 max-w-3xl">
            Gestion du cycle de vie des courriers officiels sur papier à en-tête LAHA : préparation,
            correction contextuelle, scellement de PDF certifié et expédition par e-mail avec pièce jointe.
          </p>
        </div>

        {/* Liens de retour rapide vers les sources */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <Link
            href="/legal-reviewer/redevances"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-navy text-xs font-bold hover:bg-background-secondary transition-colors min-h-[44px]"
          >
            <Building2 className="w-4 h-4 text-gold" />
            <span>Redevances</span>
          </Link>
          <Link
            href="/legal-reviewer/relances"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border bg-background text-navy text-xs font-bold hover:bg-background-secondary transition-colors min-h-[44px]"
          >
            <Layers className="w-4 h-4 text-gold" />
            <span>Relances</span>
          </Link>
          <button
            type="button"
            onClick={fetchCourriers}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors shadow-xs min-h-[44px] cursor-pointer disabled:opacity-50"
            title="Actualiser la liste des courriers"
          >
            {loading ? <InlineLoader size={16} /> : <RotateCcw className="w-4 h-4 text-gold" />}
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {/* Barre de filtrage : Statuts + Catégorie + Recherche */}
      <div className="p-4 rounded-2xl bg-background-secondary border border-border flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Onglets de statut */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
          {STATUS_FILTERS.map((f) => {
            const isActive = statusFilter === f.value;
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setStatusFilter(f.value)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap min-h-[36px] cursor-pointer ${
                  isActive
                    ? "bg-navy text-white shadow-xs"
                    : "border border-border bg-background text-foreground-muted hover:text-navy"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Filtre catégorie & Recherche textuelle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative">
            <Filter className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as CourrierCategory | "all")}
              className="pl-8 pr-8 py-2 rounded-xl border border-border bg-background text-navy text-xs font-bold focus:outline-none focus:border-gold min-h-[40px] cursor-pointer appearance-none"
            >
              <option value="all">Toutes les catégories</option>
              <option value="royalty_author">Droits d&apos;Auteurs</option>
              <option value="royalty_university">Redevances Universités</option>
              <option value="royalty_publisher">Redevances Éditeurs</option>
              <option value="debt_reminder">Relances Impayés</option>
              <option value="other">Autres</option>
            </select>
          </div>

          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher réf, destinataire..."
              className="w-full pl-8 pr-3.5 py-2 rounded-xl border border-border bg-background text-navy text-xs font-sans focus:outline-none focus:border-gold min-h-[40px]"
            />
          </div>
        </div>
      </div>

      {/* Tableau des courriers officiels */}
      <DataTable
        data={courriers}
        columns={columns}
        rowKey="id"
        loading={loading}
        searchable={false}
        emptyMessage="Aucun courrier officiel ne correspond à ces critères."
        mobileCard={(row) => (
          <div className="p-4 rounded-xl border border-border bg-background space-y-3 font-sans">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono font-bold text-xs text-navy block">{row.reference}</span>
                <span className="text-[10px] font-bold text-gold uppercase">{row.category_label}</span>
              </div>
              <div>
                {row.status === "draft" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-navy/10 text-navy">Brouillon</span>
                )}
                {row.status === "validated" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gold/15 text-navy">Validé</span>
                )}
                {row.status === "sent" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700">Envoyé</span>
                )}
                {row.status === "canceled" && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-background-secondary text-foreground-muted">Annulé</span>
                )}
              </div>
            </div>

            <div>
              <p className="font-serif font-bold text-sm text-navy">{row.recipient_name}</p>
              <p className="text-xs text-foreground-muted font-mono">{row.recipient_email || "—"}</p>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-border/60">
              <span className="text-foreground-muted">{row.period || "Période standard"}</span>
              <span className="font-mono font-bold text-gold">{row.amount.toLocaleString("fr-FR")} FCFA</span>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-border/60 flex-wrap">
              <button
                type="button"
                onClick={() => handleOpenPdf(row)}
                className="px-3 py-2 rounded-xl border border-border bg-background text-navy text-xs font-bold inline-flex items-center gap-1 min-h-[44px]"
              >
                <FileText className="w-4 h-4 text-gold" />
                <span>Aperçu PDF</span>
              </button>
              {row.status === "draft" && (
                <>
                  <button
                    type="button"
                    onClick={() => setEditingCourrier(row)}
                    className="px-3 py-2 rounded-xl border border-border bg-background text-navy text-xs font-bold inline-flex items-center gap-1 min-h-[44px]"
                  >
                    <Edit className="w-4 h-4 text-gold" />
                    <span>Corriger</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setValidatingCourrier(row)}
                    className="px-3 py-2 rounded-xl bg-navy text-white text-xs font-bold inline-flex items-center gap-1 min-h-[44px]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-gold" />
                    <span>Valider</span>
                  </button>
                </>
              )}
              {row.status === "validated" && (
                <button
                  type="button"
                  onClick={() => setSendingCourrier(row)}
                  className="px-3 py-2 rounded-xl bg-navy text-white text-xs font-bold inline-flex items-center gap-1 min-h-[44px]"
                >
                  <Send className="w-4 h-4 text-gold" />
                  <span>Envoyer</span>
                </button>
              )}
              {(row.status === "draft" || row.status === "validated") && (
                <button
                  type="button"
                  onClick={() => setCancelingCourrier(row)}
                  className="px-3 py-2 rounded-xl border border-red-200 text-red-600 text-xs font-bold inline-flex items-center gap-1 min-h-[44px]"
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Annuler</span>
                </button>
              )}
            </div>
          </div>
        )}
      />

      {/* Modale d'édition contextuelle (Corriger) */}
      <EditCourrierModal
        isOpen={!!editingCourrier}
        onClose={() => setEditingCourrier(null)}
        courrier={editingCourrier}
        onUpdated={handleCourrierUpdated}
      />

      {/* Boîte de confirmation de validation */}
      <ValidateCourrierDialog
        isOpen={!!validatingCourrier}
        onClose={() => setValidatingCourrier(null)}
        courrier={validatingCourrier}
        onSuccess={handleCourrierUpdated}
      />

      {/* Boîte de confirmation d'envoi par e-mail */}
      <SendCourrierEmailDialog
        isOpen={!!sendingCourrier}
        onClose={() => setSendingCourrier(null)}
        courrier={sendingCourrier}
        onSuccess={handleCourrierUpdated}
      />

      {/* Boîte de confirmation d'annulation */}
      <CancelCourrierDialog
        isOpen={!!cancelingCourrier}
        onClose={() => setCancelingCourrier(null)}
        courrier={cancelingCourrier}
        onSuccess={handleCourrierUpdated}
      />
    </div>
  );
}
