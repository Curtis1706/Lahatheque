"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  getAdminContractById,
  processAdminContract,
} from "@/lib/services/admin";
import { AdminContract } from "@/lib/types/admin";
import { StatusBadge } from "@/components/ui/status-badge";
import { Modal } from "@/components/ui/modal";
import { PageLoader, InlineLoader } from "@/components/ui/page-loader";
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
  Building2,
  User,
  Coins,
  Percent,
  Calendar,
  BookOpen,
  Tag,
  FileSpreadsheet,
  RotateCw,
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
  const [approvedRate, setApprovedRate] = useState<number>(15);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadContract = useCallback(async () => {
    try {
      setLoading(true);
      const found = await getAdminContractById(id);
      setContract(found);
      if (found) {
        setApprovedRate(found.royalty_rate || 15);
      }
    } catch {
      toast.error("Erreur lors de la récupération du contrat.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadContract();
    }
  }, [id, loadContract]);

  const handleApprove = async () => {
    if (!contract) return;
    setIsSubmitting(true);
    try {
      const res = await processAdminContract(contract.id, "approve", undefined, approvedRate);
      if (res.success) {
        toast.success(res.message || "Contrat approuvé et mis en vigueur avec succès !");
        setIsApproveOpen(false);
        await loadContract();
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
        await loadContract();
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
    return <PageLoader label="Chargement du dossier juridique" />;
  }

  if (!contract) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-error mx-auto" />
        <h2 className="text-base font-bold text-navy">Contrat introuvable</h2>
        <Link
          href="/admin/contracts"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-dark transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux contrats
        </Link>
      </div>
    );
  }

  const rawStatus = contract.status;
  const normalizedStatus =
    rawStatus === "active" || rawStatus === "en_vigueur"
      ? "active"
      : rawStatus === "pending_signature" || rawStatus === "pending_admin_approval"
      ? "pending_signature"
      : rawStatus === "expired"
      ? "expired"
      : "rejected";

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
          <button
            type="button"
            onClick={loadContract}
            disabled={loading}
            className="p-2 rounded-xl bg-background hover:bg-background-secondary border border-border text-navy font-bold text-xs transition-colors inline-flex items-center justify-center cursor-pointer shadow-2xs"
            title="Actualiser ce contrat"
          >
            <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <StatusBadge status={normalizedStatus} />
        </div>
      </div>

      {/* Titre & Informations Contractuelles */}
      <div className="p-6 rounded-2xl bg-background-secondary border border-border space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-navy/10 text-gold border border-navy/20">
                {contract.contract_number}
              </span>
              <span className="text-[11px] font-bold text-navy px-2 py-0.5 rounded-lg bg-background border border-border">
                {contract.type === "partenariat_universite"
                  ? "Convention Université Partenaire"
                  : contract.type === "editeur_tiers"
                  ? "Contrat Éditeur Tiers"
                  : contract.type === "pre_edition"
                  ? "Accord de Pré-édition"
                  : contract.type === "avenant"
                  ? "Avenant Contractuel"
                  : "Contrat d'Édition Auteur"}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
              {contract.title}
            </h1>

            <div className="flex items-center gap-2 text-xs text-foreground-muted flex-wrap pt-1">
              <div className="flex items-center gap-1 font-semibold text-navy">
                {contract.partner_type === "publisher" ? (
                  <Building2 className="w-3.5 h-3.5 text-gold shrink-0" />
                ) : contract.partner_type === "university" ? (
                  <Scale className="w-3.5 h-3.5 text-navy shrink-0" />
                ) : (
                  <User className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                )}
                <span>{contract.partner_name}</span>
              </div>
              {contract.partner_email && (
                <>
                  <span>•</span>
                  <span>{contract.partner_email}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="p-3.5 rounded-xl bg-gold/10 border border-gold/30 text-right min-w-[140px]">
              <span className="text-[10px] uppercase font-bold text-navy block">Taux Redevance</span>
              <p className="text-2xl font-mono font-bold text-navy">
                {contract.royalty_rate ? `${contract.royalty_rate}%` : "15%"}
              </p>
              {contract.is_derogatory && (
                <span className="text-[9px] font-bold text-navy bg-gold/20 px-1.5 py-0.5 rounded inline-block mt-0.5">
                  Barème Dérogatoire
                </span>
              )}
            </div>
          </div>
        </div>

        {contract.rejection_reason && (
          <div className="p-4 rounded-xl bg-error/10 border border-error/20 space-y-1">
            <p className="text-xs font-bold text-error flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Motif de rejet précédent :
            </p>
            <p className="text-xs text-navy font-medium">{contract.rejection_reason}</p>
          </div>
        )}
      </div>

      {/* Ouvrage Rattaché & Clé de Répartition */}
      {contract.repartition_droits && contract.repartition_droits.length > 0 && (
        <div className="p-6 rounded-2xl bg-background-secondary border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-navy flex items-center gap-2">
              <Coins className="w-4 h-4 text-gold" />
              Clé de Répartition des Redevances Auteurs &amp; Ayants Droit
            </h2>
            {contract.ouvrage && (
              <span className="text-xs font-semibold text-navy flex items-center gap-1 bg-background px-2.5 py-1 rounded-lg border border-border">
                <BookOpen className="w-3.5 h-3.5 text-gold" />
                {contract.ouvrage.title}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-border text-foreground-muted font-bold">
                  <th className="pb-2">Bénéficiaire</th>
                  <th className="pb-2">Rôle Contractuel</th>
                  <th className="pb-2 text-center">Quote-part (%)</th>
                  <th className="pb-2 text-center">Taux Papier</th>
                  <th className="pb-2 text-center">Taux Numérique</th>
                  <th className="pb-2 text-center">Taux Audio TTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {contract.repartition_droits.map((r, idx) => (
                  <tr key={r.id || idx} className="hover:bg-background/50">
                    <td className="py-2.5 font-bold text-navy">
                      {r.author_name}
                      {r.author_email && (
                        <span className="block font-normal text-[10px] text-foreground-muted">
                          {r.author_email}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-navy font-medium">{r.role || "Auteur Principal"}</td>
                    <td className="py-2.5 text-center font-mono font-bold text-navy">{r.percentage}%</td>
                    <td className="py-2.5 text-center font-mono text-foreground-muted">{r.paper_rate ?? 10}%</td>
                    <td className="py-2.5 text-center font-mono font-bold text-navy">{r.digital_rate ?? 15}%</td>
                    <td className="py-2.5 text-center font-mono text-foreground-muted">{r.audio_tts_rate ?? 8}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grille : Clauses & Instruction Juridique */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Instruction Juridique */}
        <div className="p-6 rounded-2xl bg-background-secondary border border-border space-y-4">
          <h2 className="text-sm font-bold text-navy flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-gold" />
            Instruction &amp; Avis Juridique
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-background border border-border space-y-1">
              <span className="text-foreground-muted text-[11px]">Juriste Instructeur</span>
              <p className="font-semibold text-navy">{contract.reviewed_by_juriste || "Cabinet Juridique LAHA"}</p>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border space-y-1">
              <span className="text-foreground-muted text-[11px]">Date de Signature &amp; Enregistrement</span>
              <p className="font-semibold text-navy">
                {contract.date_signature
                  ? new Date(contract.date_signature).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : contract.created_at
                  ? new Date(contract.created_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "En attente de signature"}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border space-y-1">
              <span className="text-foreground-muted text-[11px]">Date d&apos;Échéance / Expiration</span>
              <p className="font-semibold text-navy">
                {contract.date_expiration
                  ? new Date(contract.date_expiration).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "Durée légale de protection des droits (OAPI - 50 ans post-mortem)"}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border space-y-1">
              <span className="text-foreground-muted text-[11px]">Observations &amp; Notes Juridiques</span>
              <p className="text-navy leading-relaxed font-medium">
                {contract.notes || "Dossier conforme aux dispositions du droit d'auteur OAPI et dispositions contractuelles LAHAThèque."}
              </p>
            </div>
          </div>
        </div>

        {/* Clauses & Périmètre des Droits */}
        <div className="p-6 rounded-2xl bg-background-secondary border border-border space-y-4">
          <h2 className="text-sm font-bold text-navy flex items-center gap-2">
            <FileText className="w-4 h-4 text-gold" />
            Clauses &amp; Périmètre de Cession
          </h2>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-background border border-border space-y-1">
              <span className="text-foreground-muted text-[11px]">Exploitation Numérique</span>
              <p className="font-semibold text-navy">Format EPUB Fixed/Reflow &amp; PDF Sécurisé LCP</p>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border space-y-1">
              <span className="text-foreground-muted text-[11px]">Territorialité de Diffusion</span>
              <p className="font-semibold text-navy">Zone UEMOA / CEMAC &amp; International</p>
            </div>

            <div className="p-3 rounded-xl bg-background border border-border space-y-1">
              <span className="text-foreground-muted text-[11px]">Dérogation Tarifaire</span>
              <p className="font-semibold text-navy">
                {contract.is_derogatory
                  ? "Oui — Accord spécial dérogeant au barème standard"
                  : "Non — Application stricte du barème standard"}
              </p>
            </div>

            {contract.file_url ? (
              <div className="p-3 rounded-xl bg-background border border-border space-y-2">
                <span className="text-foreground-muted text-[11px] block">Document Contractuel Scellé</span>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                    <span className="font-mono text-xs font-bold text-navy truncate">
                      {contract.file_name || `${contract.contract_number}.pdf`}
                    </span>
                  </div>
                  <a
                    href={contract.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-bold text-gold hover:underline shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Télécharger
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-background border border-border space-y-1">
                <span className="text-foreground-muted text-[11px]">Document Contractuel</span>
                <p className="text-foreground-muted italic">Généré numériquement lors de la signature.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barre d'Actions Décisionnelles */}
      {(contract.status === "pending_admin_approval" || contract.status === "pending_signature") && (
        <div className="p-6 rounded-2xl bg-background-secondary border border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-navy">Décision Juridique Régalienne</p>
            <p className="text-[11px] text-foreground-muted">
              Validez la mise en vigueur officielle du contrat ou renvoyez-le avec motif au Juriste.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsRejectOpen(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-semibold hover:bg-error/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>Refuser le Contrat</span>
            </button>

            <button
              type="button"
              onClick={() => setIsApproveOpen(true)}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-success text-white text-xs font-semibold hover:bg-success/90 transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approuver &amp; Mettre en Vigueur</span>
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
            <label className="text-xs font-semibold text-navy">Taux de Redevance Validé (%)</label>
            <input
              type="number"
              min={1}
              max={100}
              value={approvedRate}
              onChange={(e) => setApprovedRate(parseFloat(e.target.value) || 0)}
              className="w-full mt-1.5 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none font-mono font-bold text-navy"
            />
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsApproveOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-foreground-muted hover:bg-background-secondary border border-border cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleApprove}
              className="px-5 py-2 rounded-xl bg-success text-white text-xs font-semibold hover:bg-success/90 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <InlineLoader size={14} />
                  <span>Validation...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Approuver &amp; Mettre en Vigueur</span>
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
            <label className="text-xs font-semibold text-navy">
              Motif précis du rejet (obligatoire) *
            </label>
            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Exemple : Taux dérogatoire non justifié, clause d'exclusivité territoriale incomplète."
              className="w-full mt-1.5 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none resize-none text-navy"
            />
          </div>

          <div className="pt-3 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsRejectOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-foreground-muted hover:bg-background-secondary border border-border cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-error text-white text-xs font-semibold hover:bg-error/90 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer shadow-xs"
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
