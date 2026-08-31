"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { InlineLoader } from "@/components/ui/page-loader";
import {
  getAdminValidationProofs,
  processAdminValidation,
} from "@/lib/services/admin";
import { AdminValidationProof } from "@/lib/types/admin";
import {
  FileCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  AlertTriangle,
  UserCheck,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminValidationPage() {
  const [proofs, setProofs] = useState<AdminValidationProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Modales
  const [selectedProofForApprove, setSelectedProofForApprove] = useState<AdminValidationProof | null>(null);
  const [selectedProofForReject, setSelectedProofForReject] = useState<AdminValidationProof | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getAdminValidationProofs();
      setProofs(data);
    } catch {
      toast.error("Impossible de récupérer les épreuves de maquette.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProofs = proofs.filter((p) => {
    if (filterStatus === "pending") return p.status === "pending_admin_approval";
    if (filterStatus === "published") return p.status === "published" || p.status === "approved";
    if (filterStatus === "rejected") return p.status === "rejected";
    return true;
  });

  const pendingCount = proofs.filter((p) => p.status === "pending_admin_approval").length;
  const publishedCount = proofs.filter((p) => p.status === "published" || p.status === "approved").length;
  const rejectedCount = proofs.filter((p) => p.status === "rejected").length;

  const handleApprove = async () => {
    if (!selectedProofForApprove) return;
    setIsSubmitting(true);
    try {
      const res = await processAdminValidation(selectedProofForApprove.id, "approve", undefined, adminNotes);
      if (res.success) {
        toast.success(res.message || "BAT validé et ouvrage publié avec succès !");
        setSelectedProofForApprove(null);
        setAdminNotes("");
        await loadData();
      } else {
        toast.error(res.error || "Erreur lors de la validation du BAT.");
      }
    } catch {
      toast.error("Erreur de communication avec le serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProofForReject) return;
    if (!rejectionReason.trim()) {
      toast.error("Veuillez indiquer le motif précis du refus.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await processAdminValidation(selectedProofForReject.id, "reject", rejectionReason, adminNotes);
      if (res.success) {
        toast.success(res.message || "Épreuve rejetée. Le motif a été transmis au chef maquettiste.");
        setSelectedProofForReject(null);
        setRejectionReason("");
        setAdminNotes("");
        await loadData();
      } else {
        toast.error(res.error || "Erreur lors du rejet de l'épreuve.");
      }
    } catch {
      toast.error("Erreur de communication avec le serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMobileCard = (row: AdminValidationProof) => (
    <div className="space-y-3 bg-background p-4 rounded-2xl border border-border">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-serif font-bold text-navy text-sm sm:text-base leading-snug">
            {row.title}
          </h4>
          <p className="text-xs text-foreground-muted mt-0.5">
            {row.author_name} • <span className="text-gold font-medium">{row.publisher_name}</span>
          </p>
        </div>
        <StatusBadge
          status={
            row.status === "pending_admin_approval"
              ? "in_review"
              : row.status === "published"
              ? "published"
              : row.status === "rejected"
              ? "rejected"
              : "approved"
          }
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border/60 text-xs">
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-navy/10 text-navy font-mono font-bold text-xs">
          {row.version || "v1.0"}
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-background-secondary border border-border text-foreground font-semibold text-[11px] uppercase">
          {row.format || "PDF"}
        </span>
        {row.lcp_compliant ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[10px] font-semibold">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            LCP DRM
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-600 border border-slate-500/20 text-[10px]">
            Standard
          </span>
        )}
        <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-navy/5 text-navy font-medium ml-auto">
          {row.discipline}
        </span>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
        <div className="flex items-center gap-1.5 text-foreground-muted font-mono text-[11px]">
          <Clock className="w-3.5 h-3.5 text-gold shrink-0" />
          <span>
            {row.submitted_at
              ? new Date(row.submitted_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })
              : "Aujourd'hui"}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/admin/validation/${row.id}`}
            className="p-2 rounded-xl bg-background-secondary border border-border text-foreground hover:text-navy hover:border-gold transition-colors"
            title="Examiner"
          >
            <Eye className="w-4 h-4" />
          </Link>

          {row.status === "pending_admin_approval" && (
            <>
              <button
                type="button"
                onClick={() => setSelectedProofForApprove(row)}
                className="px-3 py-1.5 rounded-xl bg-success text-white hover:bg-success/90 transition-colors text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Valider</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedProofForReject(row)}
                className="px-2.5 py-1.5 rounded-xl bg-error/10 border border-error/20 text-error hover:bg-error/20 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Rejeter</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const columns: DataTableColumn<AdminValidationProof>[] = [
    {
      key: "title",
      header: "Ouvrage & Discipline",
      className: "min-w-[280px]",
      cell: (row) => (
        <div className="space-y-1 py-0.5">
          <p className="font-serif font-bold text-xs sm:text-sm text-navy line-clamp-1">
            {row.title}
          </p>
          <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
            <span className="font-medium text-foreground">{row.author_name || "Auteur non renseigné"}</span>
            <span>•</span>
            <span className="text-gold font-medium">{row.publisher_name || "Éditions LAHA"}</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-navy/10 text-navy font-semibold">
              {row.discipline || "Général"}
            </span>
            {row.dewey_code && (
              <span className="text-[10px] font-mono text-foreground-muted">
                CDD: {row.dewey_code}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "version",
      header: "Version & Format",
      className: "min-w-[200px]",
      cell: (row) => (
        <div className="space-y-1.5 py-0.5">
          {/* Ligne 1 : Badges Version & Format */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-navy/10 text-navy font-mono text-xs font-bold border border-navy/15">
              {row.version || "v1.0"}
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-background-secondary border border-border text-foreground font-semibold text-[11px] uppercase tracking-wider">
              {row.format || "PDF"}
            </span>
            {row.page_count ? (
              <span className="text-[11px] text-foreground-muted font-mono">
                {row.page_count} p.
              </span>
            ) : null}
          </div>

          {/* Ligne 2 : Statut Protection DRM */}
          <div>
            {row.lcp_compliant ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 text-[10px] font-semibold whitespace-nowrap">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Conforme LCP DRM</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-500/10 text-slate-600 border border-slate-500/20 text-[10px] font-medium whitespace-nowrap">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Protection Standard</span>
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "submitted_at",
      header: "Date de Publication / Soumission",
      className: "min-w-[180px] whitespace-nowrap",
      cell: (row) => {
        let displayDate = "Aujourd'hui";
        if (row.submitted_at) {
          const d = new Date(row.submitted_at);
          if (!isNaN(d.getTime()) && d.getFullYear() > 1970) {
            displayDate = d.toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
          }
        }
        return (
          <div className="space-y-1 text-[11px]">
            <div className="flex items-center gap-1.5 text-foreground-muted">
              <Clock className="w-3.5 h-3.5 text-gold shrink-0" />
              <span className="font-mono text-xs text-foreground font-medium">
                {displayDate}
              </span>
            </div>
            {row.reviewed_by && (
              <p className="text-[10px] text-foreground-muted flex items-center gap-1 truncate max-w-[160px]">
                <UserCheck className="w-3 h-3 text-navy shrink-0" />
                <span className="truncate">Par {row.reviewed_by}</span>
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Statut",
      className: "min-w-[140px]",
      cell: (row) => (
        <div className="space-y-1">
          <StatusBadge
            status={
              row.status === "pending_admin_approval"
                ? "in_review"
                : row.status === "published"
                ? "published"
                : row.status === "rejected"
                ? "rejected"
                : "approved"
            }
          />
          {row.rejection_reason && (
            <p className="text-[10px] text-error font-medium line-clamp-1" title={row.rejection_reason}>
              Motif : {row.rejection_reason}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right min-w-[160px]",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            href={`/admin/validation/${row.id}`}
            className="p-2 rounded-xl bg-background-secondary border border-border text-foreground hover:border-gold hover:text-navy transition-colors text-xs font-semibold"
            title="Examiner la maquette en détail"
            aria-label="Examiner la maquette"
          >
            <Eye className="w-4 h-4" />
          </Link>

          {row.status === "pending_admin_approval" && (
            <>
              <button
                type="button"
                onClick={() => setSelectedProofForApprove(row)}
                className="px-3 py-1.5 rounded-xl bg-success text-white hover:bg-success/90 transition-colors text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer"
                title="Valider le BAT et publier"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Valider</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedProofForReject(row)}
                className="px-2.5 py-1.5 rounded-xl bg-error/10 border border-error/20 text-error hover:bg-error/20 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                title="Rejeter l'épreuve avec motif"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Rejeter</span>
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* En-tête avec fil d'Ariane */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-xs text-foreground-muted mb-1">
            <Link href="/admin" className="hover:text-navy transition-colors">Administration</Link>
            <span>/</span>
            <span className="text-navy font-semibold">Validation Maquettisme & BAT</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy flex items-center gap-2.5">
            <FileCheck2 className="w-6 h-6 text-gold" />
            Supervision & Validation des Épreuves (BAT)
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Centre de contrôle régalien des épreuves PDF/EPUB, traçabilité des relectures et validation finale de publication.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/catalog"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-background border border-border text-foreground text-xs font-semibold hover:border-gold transition-colors"
          >
            <BookOpen className="w-4 h-4 text-gold" />
            <span>Catalogue Global</span>
          </Link>
        </div>
      </div>

      {/* Cartes d'Indicateurs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => setFilterStatus(filterStatus === "pending" ? "all" : "pending")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === "pending"
              ? "bg-gold/10 border-gold shadow-xs ring-2 ring-gold/20"
              : "bg-background-secondary border-border hover:border-navy/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted">En Attente Validation Admin</span>
            <Clock className="w-4 h-4 text-gold" />
          </div>
          <p className="text-2xl font-bold font-serif text-navy mt-2">{pendingCount}</p>
          <p className="text-[11px] text-foreground-muted mt-1">Épreuves relues par le Chef Maquettiste</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus(filterStatus === "published" ? "all" : "published")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === "published"
              ? "bg-success/10 border-success shadow-xs ring-2 ring-success/20"
              : "bg-background-secondary border-border hover:border-navy/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted">BAT Validés & Publiés</span>
            <CheckCircle2 className="w-4 h-4 text-success" />
          </div>
          <p className="text-2xl font-bold font-serif text-navy mt-2">{publishedCount}</p>
          <p className="text-[11px] text-foreground-muted mt-1">Ouvrages en ligne sur le catalogue</p>
        </button>

        <button
          type="button"
          onClick={() => setFilterStatus(filterStatus === "rejected" ? "all" : "rejected")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === "rejected"
              ? "bg-error/10 border-error shadow-xs ring-2 ring-error/20"
              : "bg-background-secondary border-border hover:border-navy/30"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground-muted">Épreuves Rejetées</span>
            <XCircle className="w-4 h-4 text-error" />
          </div>
          <p className="text-2xl font-bold font-serif text-navy mt-2">{rejectedCount}</p>
          <p className="text-[11px] text-foreground-muted mt-1">En attente de corrections maquettiste</p>
        </button>
      </div>

      {/* Tableau des Épreuves (DataTable intégrée) */}
      <DataTable
        data={filteredProofs}
        columns={columns}
        rowKey="id"
        loading={loading}
        searchable={true}
        searchPlaceholder="Rechercher par titre, auteur, éditeur ou chef maquettiste..."
        mobileCard={renderMobileCard}
        pageSize={10}
        emptyMessage="Aucune épreuve de maquette ne correspond aux critères sélectionnés."
      />

      {/* Modale d'Approbation Finale du BAT */}
      <Modal
        open={!!selectedProofForApprove}
        onClose={() => setSelectedProofForApprove(null)}
        title="Validation Définitive du BAT & Publication"
      >
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-success/10 border border-success/20">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
            <div>
              <p className="text-xs font-bold text-success">Bon à Tirer & Mise en Ligne Officielle</p>
              <p className="text-[11px] text-foreground">
                Cette action valide définitivement l'épreuve et publie l'ouvrage sur le catalogue LAHAThèque.
              </p>
            </div>
          </div>

          {selectedProofForApprove && (
            <div className="space-y-2 text-xs">
              <p className="font-semibold text-foreground">Ouvrage : <span className="font-serif text-navy">{selectedProofForApprove.title}</span></p>
              <p className="text-foreground-muted">Version : <strong className="text-foreground">{selectedProofForApprove.version}</strong> • Format : {selectedProofForApprove.format}</p>
              <p className="text-foreground-muted">Revu par : <strong className="text-navy">{selectedProofForApprove.reviewed_by}</strong></p>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-foreground">Notes administratives (optionnel)</label>
            <textarea
              rows={2}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Observations de la Direction..."
              className="w-full mt-1.5 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none resize-none"
            />
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedProofForApprove(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-foreground-muted hover:bg-background-secondary"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleApprove}
              className="px-5 py-2 rounded-xl bg-success text-white text-xs font-semibold hover:bg-success/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <InlineLoader size={14} />
                  <span>Publication en cours...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Valider le BAT & Publier</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modale de Rejet avec Motif Obligatoire */}
      <Modal
        open={!!selectedProofForReject}
        onClose={() => setSelectedProofForReject(null)}
        title="Refuser l'Épreuve de Maquette"
      >
        <form onSubmit={handleReject} className="p-6 space-y-5">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-error/10 border border-error/20">
            <AlertTriangle className="w-5 h-5 text-error shrink-0" />
            <div>
              <p className="text-xs font-bold text-error">Rejet de l'épreuve pour corrections</p>
              <p className="text-[11px] text-foreground">
                Le statut de l'épreuve passera à "Rejeté". Le motif saisi sera immédiatement visible par le Chef Maquettiste et le Maquettiste.
              </p>
            </div>
          </div>

          {selectedProofForReject && (
            <div className="space-y-1 text-xs">
              <p className="font-semibold text-foreground">Ouvrage : <span className="font-serif text-navy">{selectedProofForReject.title}</span></p>
              <p className="text-foreground-muted">Version : {selectedProofForReject.version}</p>
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-foreground">
              Motif précis du rejet (obligatoire) *
            </label>
            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Exemple : Marges de reliure insuffisantes sur les pages 40 à 60. Résolution de couverture trop basse."
              className="w-full mt-1.5 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none resize-none"
            />
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedProofForReject(null)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-foreground-muted hover:bg-background-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-error text-white text-xs font-semibold hover:bg-error/90 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <InlineLoader size={14} />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Confirmer le Rejet</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
