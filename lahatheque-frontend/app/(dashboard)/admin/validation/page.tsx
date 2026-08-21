"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
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
  Download,
  Eye,
  AlertTriangle,
  UserCheck,
  Layers,
  Search,
  Filter,
  ShieldCheck,
  FileText,
  Calendar,
  Loader2,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminValidationPage() {
  const [proofs, setProofs] = useState<AdminValidationProof[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

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
    const matchesSearch =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.author_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.publisher_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "pending" && p.status === "pending_admin_approval") ||
      (filterStatus === "published" && (p.status === "published" || p.status === "approved")) ||
      (filterStatus === "rejected" && p.status === "rejected");

    return matchesSearch && matchesStatus;
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

  const columns: DataTableColumn<AdminValidationProof>[] = [
    {
      key: "title",
      header: "Ouvrage & Discipline",
      cell: (row) => (
        <div className="space-y-0.5">
          <p className="font-semibold text-xs text-foreground line-clamp-1">{row.title}</p>
          <div className="flex items-center gap-2 text-[11px] text-foreground-muted">
            <span>{row.author_name}</span>
            <span>•</span>
            <span className="text-gold font-medium">{row.publisher_name}</span>
          </div>
          <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-navy/10 text-navy font-semibold">
            {row.discipline}
          </span>
        </div>
      ),
    },
    {
      key: "version",
      header: "Version & Format",
      cell: (row) => (
        <div className="space-y-1">
          <span className="font-mono text-xs font-bold text-navy">{row.version || "v1.0"}</span>
          <p className="text-[11px] text-foreground-muted">{row.format}</p>
          {row.lcp_compliant && (
            <div className="flex items-center gap-1 text-[10px] text-success font-medium">
              <ShieldCheck className="w-3 h-3 text-success" />
              <span>Conforme LCP DRM</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "submitted_at",
      header: "Date de Publication / Soumission",
      cell: (row) => (
        <div className="space-y-1 text-[11px]">
          <div className="flex items-center gap-1.5 text-foreground-muted">
            <Clock className="w-3.5 h-3.5 text-gold shrink-0" />
            <span className="font-mono text-xs text-foreground font-medium">
              {row.submitted_at
                ? new Date(row.submitted_at).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Date non renseignée"}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut",
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
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Link
            href={`/admin/validation/${row.id}`}
            className="p-2 rounded-xl bg-background-secondary border border-border text-foreground hover:border-gold hover:text-navy transition-colors text-xs font-semibold"
            title="Examiner la maquette en détail"
          >
            <Eye className="w-3.5 h-3.5" />
          </Link>

          {row.status === "pending_admin_approval" && (
            <>
              <button
                type="button"
                onClick={() => setSelectedProofForApprove(row)}
                className="px-2.5 py-1.5 rounded-xl bg-success text-white hover:bg-success/90 transition-colors text-xs font-semibold flex items-center gap-1 shadow-xs"
                title="Valider le BAT et publier"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Valider BAT</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedProofForReject(row)}
                className="px-2.5 py-1.5 rounded-xl bg-error/10 border border-error/20 text-error hover:bg-error/20 transition-colors text-xs font-semibold flex items-center gap-1"
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
          onClick={() => setFilterStatus("pending")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterStatus === "pending"
              ? "bg-gold/10 border-gold shadow-xs"
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
          onClick={() => setFilterStatus("published")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterStatus === "published"
              ? "bg-success/10 border-success shadow-xs"
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
          onClick={() => setFilterStatus("rejected")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterStatus === "rejected"
              ? "bg-error/10 border-error shadow-xs"
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

      {/* Barre de Recherche et Filtres */}
      <div className="p-4 rounded-2xl bg-background-secondary border border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Rechercher par titre, auteur, éditeur ou chef maquettiste..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
              filterStatus === "all"
                ? "bg-navy text-white"
                : "bg-background border border-border text-foreground hover:bg-background-secondary"
            }`}
          >
            Tous ({proofs.length})
          </button>
        </div>
      </div>

      {/* Tableau des Épreuves */}
      <div className="rounded-2xl bg-background-secondary border border-border overflow-hidden p-4 sm:p-6">
        <DataTable
          data={filteredProofs}
          columns={columns}
          rowKey="id"
          loading={loading}
          emptyMessage="Aucune épreuve de maquette ne correspond aux critères sélectionnés."
        />
      </div>

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
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
