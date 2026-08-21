"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  getAdminValidationProofs,
  processAdminValidation,
} from "@/lib/services/admin";
import { AdminValidationProof } from "@/lib/types/admin";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import {
  ArrowLeft,
  FileCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  ShieldCheck,
  UserCheck,
  FileText,
  AlertTriangle,
  Loader2,
  BookOpen,
  Calendar,
  Layers,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminValidationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [proof, setProof] = useState<AdminValidationProof | null>(null);
  const [loading, setLoading] = useState(true);

  // Modales
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadProof() {
      try {
        setLoading(true);
        const proofs = await getAdminValidationProofs();
        const found = proofs.find((p) => p.id === id) || proofs[0] || null;
        setProof(found);
      } catch {
        toast.error("Erreur lors de la récupération de l'épreuve.");
      } finally {
        setLoading(false);
      }
    }
    loadProof();
  }, [id]);

  const handleApprove = async () => {
    if (!proof) return;
    setIsSubmitting(true);
    try {
      const res = await processAdminValidation(proof.id, "approve", undefined, adminNotes);
      if (res.success) {
        toast.success(res.message || "BAT validé et ouvrage publié avec succès !");
        setIsApproveOpen(false);
        router.push("/admin/validation");
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
    if (!proof) return;
    if (!rejectionReason.trim()) {
      toast.error("Veuillez indiquer le motif précis du refus.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await processAdminValidation(proof.id, "reject", rejectionReason, adminNotes);
      if (res.success) {
        toast.success(res.message || "Épreuve rejetée avec transmission du motif.");
        setIsRejectOpen(false);
        router.push("/admin/validation");
      } else {
        toast.error(res.error || "Erreur lors du rejet.");
      }
    } catch {
      toast.error("Erreur de communication avec le serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3 text-foreground-muted">
          <Loader2 className="w-6 h-6 animate-spin text-navy" />
          <p className="text-xs">Chargement du dossier d'épreuve...</p>
        </div>
      </div>
    );
  }

  if (!proof) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-error mx-auto" />
        <h2 className="text-base font-bold text-foreground">Épreuve introuvable</h2>
        <Link
          href="/admin/validation"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour à la file de validation
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* En-tête de navigation */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-border">
        <Link
          href="/admin/validation"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-muted hover:text-navy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux épreuves</span>
        </Link>

        <div className="flex items-center gap-2">
          <StatusBadge
            status={
              proof.status === "pending_admin_approval"
                ? "in_review"
                : proof.status === "published"
                ? "published"
                : proof.status === "rejected"
                ? "rejected"
                : "approved"
            }
          />
        </div>
      </div>

      {/* Titre & Informations Principales */}
      <div className="p-6 rounded-2xl bg-background-secondary border border-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-navy/10 text-navy">
              {proof.discipline}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
              {proof.title}
            </h1>
            <p className="text-xs text-foreground-muted">
              Auteur : <strong className="text-foreground">{proof.author_name}</strong> • Maison d'Édition : <strong className="text-gold">{proof.publisher_name}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={proof.file_url || "#"}
              download
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-background border border-border text-foreground text-xs font-semibold hover:border-gold transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-foreground-muted" />
              <span>Télécharger l'Épreuve</span>
            </a>
          </div>
        </div>

        {proof.rejection_reason && (
          <div className="p-4 rounded-xl bg-error/10 border border-error/20 space-y-1">
            <p className="text-xs font-bold text-error flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Motif de rejet précédent :
            </p>
            <p className="text-xs text-foreground">{proof.rejection_reason}</p>
          </div>
        )}
      </div>

      {/* Grille : Audit Trail & Métadonnées Techniques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Traçabilité & Historique de Relecture */}
        <div className="p-6 rounded-2xl bg-background-secondary border border-border space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-gold" />
            Traçabilité & Historique de Validation
          </h2>

          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-background border border-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-navy">1. Dépôt Initial de la Maquette</span>
                <span className="text-[10px] text-foreground-muted">
                  {new Date(proof.submitted_at).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <p className="text-foreground">Déposé par : <strong className="text-foreground">{proof.submitted_by}</strong></p>
              <p className="text-foreground-muted text-[11px]">Version déposée : {proof.version}</p>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-gold">2. Examen par le Chef Maquettiste</span>
                <span className="text-[10px] text-foreground-muted">
                  {new Date(proof.reviewed_at).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <p className="text-foreground">Revu par : <strong className="text-navy">{proof.reviewed_by}</strong></p>
              <p className="text-foreground-muted text-[11px]">
                {proof.notes || "Structure et conformité technique validées par le chef d'équipe."}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-navy/5 border border-navy/15 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-navy">3. Arbitrage & Publication Direction</span>
                <span className="text-[10px] text-navy font-semibold">Étape Actuelle</span>
              </div>
              <p className="text-foreground-muted text-[11px]">
                L'administrateur valide le Bon à Tirer final ou renvoie l'épreuve avec motif de correction.
              </p>
            </div>
          </div>
        </div>

        {/* Fiche Technique de l'Ouvrage */}
        <div className="p-6 rounded-2xl bg-background-secondary border border-border space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-gold" />
            Fiche Technique & Paramètres LCP DRM
          </h2>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-background border border-border">
              <span className="text-foreground-muted text-[11px]">Format de Fichier</span>
              <p className="font-semibold text-foreground mt-0.5">{proof.format}</p>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border">
              <span className="text-foreground-muted text-[11px]">Nombre de Pages</span>
              <p className="font-semibold text-foreground mt-0.5">{proof.page_count} pages</p>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border">
              <span className="text-foreground-muted text-[11px]">Protection DRM</span>
              <p className="font-semibold text-success flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                Readium LCP 256-bit
              </p>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border">
              <span className="text-foreground-muted text-[11px]">Filigrane Dynamique</span>
              <p className="font-semibold text-foreground mt-0.5">Actif (20% opacité)</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gold/10 border border-gold/20 text-xs space-y-1">
            <p className="font-semibold text-navy">Aperçu Liseuse Souverain :</p>
            <p className="text-foreground-muted leading-relaxed">
              En tant qu'administrateur, vous disposez d'un droit de consultation illimité sur ce document avant sa mise en ligne.
            </p>
          </div>
        </div>
      </div>

      {/* Barre d'Actions Décisionnelles */}
      {proof.status === "pending_admin_approval" && (
        <div className="p-6 rounded-2xl bg-background-secondary border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-foreground">Décision de Publication Officielle</p>
            <p className="text-[11px] text-foreground-muted">
              Approuvez le BAT pour publier l'ouvrage ou renvoyez-le avec motif au Chef Maquettiste.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsRejectOpen(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-semibold hover:bg-error/20 transition-colors flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>Refuser l'Épreuve</span>
            </button>

            <button
              type="button"
              onClick={() => setIsApproveOpen(true)}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-success text-white text-xs font-semibold hover:bg-success/90 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Valider le BAT & Publier</span>
            </button>
          </div>
        </div>
      )}

      {/* Modale d'Approbation Finale */}
      <Modal
        open={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        title="Validation Définitive du BAT & Publication"
      >
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-success/10 border border-success/20">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
            <div>
              <p className="text-xs font-bold text-success">Bon à Tirer & Mise en Ligne Officielle</p>
              <p className="text-[11px] text-foreground">
                L'ouvrage <strong className="font-serif">{proof.title}</strong> sera immédiatement disponible sur le catalogue LAHAThèque.
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Notes administratives</label>
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
              onClick={() => setIsApproveOpen(false)}
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
                  <span>Publication...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirmer la Publication</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modale de Rejet avec Motif Obligatoire */}
      <Modal
        open={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title="Refuser l'Épreuve de Maquette"
      >
        <form onSubmit={handleReject} className="p-6 space-y-5">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-error/10 border border-error/20">
            <AlertTriangle className="w-5 h-5 text-error shrink-0" />
            <div>
              <p className="text-xs font-bold text-error">Rejet de l'épreuve pour corrections</p>
              <p className="text-[11px] text-foreground">
                Le motif saisi sera immédiatement visible par le Chef Maquettiste et le Maquettiste pour leur permettre de corriger le document.
              </p>
            </div>
          </div>

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
              onClick={() => setIsRejectOpen(false)}
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
