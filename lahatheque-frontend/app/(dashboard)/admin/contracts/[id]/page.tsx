"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  getAdminContracts,
  processAdminContract,
} from "@/lib/services/admin";
import { AdminContract } from "@/lib/types/admin";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import {
  ArrowLeft,
  Scale,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  ShieldCheck,
  UserCheck,
  FileText,
  AlertTriangle,
  Loader2,
  Building2,
  User,
  Coins,
  Percent,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminContractDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [contract, setContract] = useState<AdminContract | null>(null);
  const [loading, setLoading] = useState(true);

  // Modales
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [approvedRate, setApprovedRate] = useState<number>(70);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function loadContract() {
      try {
        setLoading(true);
        const list = await getAdminContracts();
        const found = list.find((c) => c.id === id) || list[0] || null;
        setContract(found);
        if (found) {
          setApprovedRate(found.royalty_rate);
        }
      } catch {
        toast.error("Erreur lors de la récupération du contrat.");
      } finally {
        setLoading(false);
      }
    }
    loadContract();
  }, [id]);

  const handleApprove = async () => {
    if (!contract) return;
    setIsSubmitting(true);
    try {
      const res = await processAdminContract(contract.id, "approve", undefined, approvedRate);
      if (res.success) {
        toast.success(res.message || "Contrat approuvé et mis en vigueur avec succès !");
        setIsApproveOpen(false);
        router.push("/admin/contracts");
      } else {
        toast.error(res.error || "Erreur lors de l'approbation du contrat.");
      }
    } catch {
      toast.error("Erreur de communication avec le serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract) return;
    if (!rejectionReason.trim()) {
      toast.error("Veuillez indiquer le motif précis du refus.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await processAdminContract(contract.id, "reject", rejectionReason);
      if (res.success) {
        toast.success(res.message || "Contrat rejeté avec transmission du motif.");
        setIsRejectOpen(false);
        router.push("/admin/contracts");
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
          <p className="text-xs">Chargement du dossier juridique...</p>
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-error mx-auto" />
        <h2 className="text-base font-bold text-foreground">Contrat introuvable</h2>
        <Link
          href="/admin/contracts"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux contrats
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* En-tête de navigation */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-border">
        <Link
          href="/admin/contracts"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-muted hover:text-navy transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux contrats</span>
        </Link>

        <div className="flex items-center gap-2">
          <StatusBadge
            status={
              contract.status === "pending_admin_approval"
                ? "in_review"
                : contract.status === "en_vigueur"
                ? "approved"
                : "rejected"
            }
          />
        </div>
      </div>

      {/* Titre & Informations Contractuelles */}
      <div className="p-6 rounded-2xl bg-background-secondary border border-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5">
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-navy/10 text-navy">
              {contract.contract_number}
            </span>
            <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
              {contract.title}
            </h1>
            <p className="text-xs text-foreground-muted">
              Partenaire : <strong className="text-foreground">{contract.partner_name}</strong> ({contract.partner_email})
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="p-3 rounded-xl bg-gold/15 border border-gold/30 text-right">
              <span className="text-[10px] uppercase font-bold text-navy">Taux de Redevance</span>
              <p className="text-xl font-mono font-bold text-navy">{contract.royalty_rate}%</p>
            </div>
          </div>
        </div>

        {contract.rejection_reason && (
          <div className="p-4 rounded-xl bg-error/10 border border-error/20 space-y-1">
            <p className="text-xs font-bold text-error flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Motif de rejet précédent :
            </p>
            <p className="text-xs text-foreground">{contract.rejection_reason}</p>
          </div>
        )}
      </div>

      {/* Grille : Clauses & Instruction Juridique */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Instruction Juridique */}
        <div className="p-6 rounded-2xl bg-background-secondary border border-border space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-gold" />
            Instruction & Avis Juridique
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-background border border-border space-y-1">
              <span className="text-foreground-muted text-[11px]">Juriste Instructeur</span>
              <p className="font-semibold text-navy">{contract.reviewed_by_juriste}</p>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border space-y-1">
              <span className="text-foreground-muted text-[11px]">Date de Création du Dossier</span>
              <p className="font-semibold text-foreground">
                {new Date(contract.created_at).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border space-y-1">
              <span className="text-foreground-muted text-[11px]">Observations Juridiques</span>
              <p className="text-foreground leading-relaxed">
                {contract.notes || "Dossier conforme aux dispositions du droit d'auteur OAPI et dispositions contractuelles LAHAThèque."}
              </p>
            </div>
          </div>
        </div>

        {/* Clauses & Périmètre des Droits */}
        <div className="p-6 rounded-2xl bg-background-secondary border border-border space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-gold" />
            Clauses & Périmètre de Cession
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-background border border-border space-y-1">
              <span className="text-foreground-muted text-[11px]">Exploitation Numérique</span>
              <p className="font-semibold text-foreground">Format EPUB Fixed/Reflow & PDF Sécurisé LCP</p>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border space-y-1">
              <span className="text-foreground-muted text-[11px]">Territorialité de Diffusion</span>
              <p className="font-semibold text-foreground">Zone UEMOA / CEMAC & International</p>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border space-y-1">
              <span className="text-foreground-muted text-[11px]">Dérogation Tarifaire</span>
              <p className="font-semibold text-navy">
                {contract.is_derogatory
                  ? "Oui — Accord spécial dérogeant au barème standard"
                  : "Non — Application stricte du barème standard"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Barre d'Actions Décisionnelles */}
      {contract.status === "pending_admin_approval" && (
        <div className="p-6 rounded-2xl bg-background-secondary border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-foreground">Décision Juridique Régalienne</p>
            <p className="text-[11px] text-foreground-muted">
              Validez la mise en vigueur officielle du contrat ou renvoyez-le avec motif au Juriste.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsRejectOpen(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-semibold hover:bg-error/20 transition-colors flex items-center justify-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>Refuser le Contrat</span>
            </button>

            <button
              type="button"
              onClick={() => setIsApproveOpen(true)}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-success text-white text-xs font-semibold hover:bg-success/90 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approuver & Mettre en Vigueur</span>
            </button>
          </div>
        </div>
      )}

      {/* Modale d'Approbation de Contrat */}
      <Modal
        open={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        title="Approbation & Mise en Vigueur du Contrat"
      >
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-success/10 border border-success/20">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
            <div>
              <p className="text-xs font-bold text-success">Validation Officielle de la Direction</p>
              <p className="text-[11px] text-foreground">
                Cette décision valide les engagements juridiques et active le barème de redevances associé.
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-foreground">Taux de Redevance Validé (%)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={approvedRate}
              onChange={(e) => setApprovedRate(parseFloat(e.target.value) || 0)}
              className="w-full mt-1.5 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none font-mono font-bold"
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
                  <span>Validation...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approuver & Mettre en Vigueur</span>
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modale de Rejet de Contrat avec Motif */}
      <Modal
        open={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title="Refuser le Projet de Contrat"
      >
        <form onSubmit={handleReject} className="p-6 space-y-5">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-error/10 border border-error/20">
            <AlertTriangle className="w-5 h-5 text-error shrink-0" />
            <div>
              <p className="text-xs font-bold text-error">Rejet du contrat pour révision</p>
              <p className="text-[11px] text-foreground">
                Le juriste et le titulaire seront notifiés avec le motif indiqué ci-dessous.
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
              placeholder="Exemple : Taux dérogatoire non justifié, clause d'exclusivité territoriale incomplète."
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
