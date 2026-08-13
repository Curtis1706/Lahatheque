"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle, AlertCircle, ShieldCheck, User, Sparkles, FileText, Globe } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { AISuggestionBadge } from "@/components/features/layout-artist/ai-suggestion-badge";
import { VitrinePreviewCard } from "@/components/features/chief-layout/vitrine-preview-card";
import { RevisionModal } from "@/components/features/chief-layout/revision-modal";
import { getDepositDetail, validateDeposit, requestRevision } from "@/lib/services/layout-artist";
import type { LayoutDeposit } from "@/lib/types/layout-artist";

export default function ChefValidationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [deposit, setDeposit] = useState<LayoutDeposit | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getDepositDetail(id);
      setDeposit(data);
      setLoading(false);
    }
    loadData();
  }, [id]);

  const handleValidate = async () => {
    if (!deposit) return;
    setValidating(true);
    await validateDeposit(deposit.id);
    setValidating(false);
    router.push("/chief-layout/validation");
  };

  const handleConfirmRevision = async (comment: string) => {
    if (!deposit) return;
    await requestRevision(deposit.id, comment);
    router.push("/chief-layout/validation");
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-background-secondary rounded-xl" />
        <div className="h-64 bg-background-secondary rounded-3xl" />
      </div>
    );
  }

  if (!deposit) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto text-center space-y-4">
        <FileText className="w-12 h-12 text-foreground-muted mx-auto" />
        <h2 className="font-serif font-bold text-navy text-xl">Dépôt introuvable</h2>
        <Link href="/chief-layout/validation" className="text-xs text-gold font-bold hover:underline">
          Retour à la liste des dépôts
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/chief-layout" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/chief-layout/validation" className="hover:text-navy">Dépôts à valider</Link>
        <span>/</span>
        <span className="text-navy font-semibold truncate max-w-[200px]">{deposit.metadata.title}</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/chief-layout/validation" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour à la liste à valider
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <User className="w-4 h-4 text-gold" />
            Maquettiste : {deposit.maquettiste_name}
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            {deposit.metadata.title}
          </h1>
        </div>

        <StatusBadge status={deposit.status} />
      </div>

      {/* Aperçu Carte Vitrine 3D */}
      <VitrinePreviewCard deposit={deposit} />

      {/* Informations Détaillées du Dépôt */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Métadonnées & Classification */}
        <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4">
          <h3 className="text-sm font-bold text-navy flex items-center justify-between">
            <span>Métadonnées &amp; Classification</span>
            <AISuggestionBadge source={deposit.classification.source} />
          </h3>

          <div className="space-y-2 text-xs">
            <p><span className="text-foreground-muted font-medium">Titre :</span> <span className="font-semibold text-foreground">{deposit.metadata.title}</span></p>
            <p><span className="text-foreground-muted font-medium">Auteur(s) :</span> <span className="text-foreground">{deposit.metadata.authors.join(", ")}</span></p>
            <p><span className="text-foreground-muted font-medium">Langue :</span> <span className="text-foreground font-semibold">{deposit.metadata.language}</span></p>
            <p><span className="text-foreground-muted font-medium">Discipline :</span> <span className="text-foreground font-semibold">{deposit.classification.discipline}</span></p>
            <p><span className="text-foreground-muted font-medium">Établissement :</span> <span className="text-foreground">{deposit.classification.university} ({deposit.classification.faculty})</span></p>
          </div>
        </div>

        {/* Fichiers & DRM */}
        <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4">
          <h3 className="text-sm font-bold text-navy flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gold" />
            Fichiers &amp; Sécurité DRM
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-background border border-border">
              <span className="font-semibold text-navy">Format principal</span>
              <span className="font-mono font-bold text-gold">{deposit.files.format}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-2xl bg-background border border-border">
              <span className="font-semibold text-navy">Protection DRM Audio</span>
              <StatusBadge status="approved" leftLabel="Chiffrement LCP Actif ✓" />
            </div>
          </div>
        </div>
      </div>

      {/* Actions de Décision Éditoriale */}
      {deposit.status === "pending_validation" && (
        <div className="p-6 rounded-3xl bg-background border border-gold/40 shadow-md space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" />
            <h3 className="text-sm font-bold text-navy">Décision de validation éditoriale</h3>
          </div>
          <p className="text-xs text-foreground-muted">
            La validation déclenchera immédiatement la mise en ligne automatique de l&apos;ouvrage sur la vitrine publique. 
            En cas d&apos;anomalie, renvoyez le dossier en correction avec des instructions claires.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setRevisionModalOpen(true)}
              className="w-full sm:flex-1 px-4 py-3 rounded-2xl border border-error/30 bg-error/10 text-error font-bold text-xs hover:bg-error/20 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
            >
              <AlertCircle className="w-4 h-4" />
              Demander une correction
            </button>

            <button
              type="button"
              onClick={handleValidate}
              disabled={validating}
              className="w-full sm:flex-1 px-6 py-3 rounded-2xl bg-success text-white font-bold text-xs hover:opacity-90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px] shadow-sm"
            >
              {validating ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Valider et Mettre en Ligne sur la Vitrine
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Modale de révision */}
      {revisionModalOpen && (
        <RevisionModal
          deposit={deposit}
          isOpen={revisionModalOpen}
          onClose={() => setRevisionModalOpen(false)}
          onConfirm={handleConfirmRevision}
        />
      )}
    </div>
  );
}
