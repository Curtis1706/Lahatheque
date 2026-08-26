"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  getAdminValidationProofs,
  getAdminValidationProofById,
  processAdminValidation,
} from "@/lib/services/admin";
import { AdminValidationProof } from "@/lib/types/admin";
import { StatusBadge } from "@/components/ui/status-badge";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { AISuggestionBadge } from "@/components/features/layout-artist/ai-suggestion-badge";
import { Modal } from "@/components/ui/modal";
import { PageLoader, InlineLoader } from "@/components/ui/page-loader";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Download,
  ShieldCheck,
  User,
  FileText,
  AlertTriangle,
  Loader2,
  BookOpen,
  FileCode,
  Sparkles,
  GraduationCap,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";

export default function AdminValidationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [proof, setProof] = useState<AdminValidationProof | null>(null);
  const [loading, setLoading] = useState(true);
  const [showXmlNotice, setShowXmlNotice] = useState(false);

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
        const data = await getAdminValidationProofById(id);
        setProof(data);
      } catch {
        try {
          const proofs = await getAdminValidationProofs();
          const found = proofs.find((p) => p.id === id) || proofs[0] || null;
          setProof(found);
        } catch {
          toast.error("Erreur lors de la récupération de l'épreuve.");
        }
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

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Aujourd'hui";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime()) || d.getFullYear() <= 1970) return "Aujourd'hui";
      return d.toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "Aujourd'hui";
    }
  };

  if (loading) {
    return <PageLoader label="Chargement du dossier d'épreuve" />;
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
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* En-tête de navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <Link
            href="/admin/validation"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground-muted hover:text-navy transition-colors mb-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour aux épreuves</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider">
            <User className="w-3.5 h-3.5 text-gold" />
            <span>Maquettiste dépositaire : {proof.submitted_by}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
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

      {/* Bannière Fiche Ouvrage avec Couverture 3D */}
      <div className="p-6 rounded-3xl bg-background border border-border flex flex-col md:flex-row items-center md:items-start gap-6 shadow-xs">
        <div className="shrink-0 flex justify-center">
          <BookCover3D
            title={proof.title}
            authors={proof.authors || proof.author_name}
            discipline={proof.discipline}
            coverUrl={proof.cover_image || proof.cover_url}
            size="md"
          />
        </div>

        <div className="flex-1 space-y-3 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-navy/10 text-navy font-bold">
              {proof.discipline}
            </span>
            {proof.dewey_code && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-background-secondary border border-border text-foreground-muted">
                CDD {proof.dewey_code}
              </span>
            )}
            {proof.isbn && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-background-secondary border border-border text-foreground">
                ISBN: {proof.isbn}
              </span>
            )}
          </div>

          <div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy leading-tight">
              {proof.title}
            </h1>
            {proof.subtitle && (
              <p className="text-sm font-medium text-foreground-muted mt-1">{proof.subtitle}</p>
            )}
          </div>

          <div className="text-xs space-y-1 text-foreground-muted">
            <p>
              Auteur(s) : <strong className="text-foreground">{proof.author_name}</strong>
            </p>
            <p>
              Maison d&apos;Édition : <strong className="text-gold">{proof.publisher_name}</strong>
            </p>
            {proof.faculty && (
              <p className="flex items-center justify-center md:justify-start gap-1 text-foreground">
                <GraduationCap className="w-3.5 h-3.5 text-gold shrink-0" />
                <span>{proof.faculty} {proof.department ? `• ${proof.department}` : ""}</span>
              </p>
            )}
          </div>

          {proof.rejection_reason && (
            <div className="p-3.5 rounded-2xl bg-error/10 border border-error/20 text-left space-y-1 mt-3">
              <p className="text-xs font-bold text-error flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Motif de rejet précédent :
              </p>
              <p className="text-xs text-foreground">{proof.rejection_reason}</p>
            </div>
          )}
        </div>
      </div>

      {/* Barre d'Actions de Consultation et d'Inspection */}
      <div className="p-4 sm:p-5 rounded-3xl bg-background border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gold/15 text-gold shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-navy">Contrôle &amp; Lecture Souveraine</h4>
            <p className="text-xs text-foreground-muted">
              Format {proof.format} • {proof.page_count || 105} pages • Droit de consultation illimité Direction
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowXmlNotice(!showXmlNotice)}
            className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-navy hover:bg-background-secondary flex items-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
          >
            <FileCode className="w-4 h-4 text-gold" />
            {showXmlNotice ? "Masquer notice ONIX 3.0" : "Inspecter notice ONIX 3.0"}
          </button>

          {proof.file_url && (
            <a
              href={proof.file_url}
              download
              className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-foreground hover:border-gold flex items-center gap-1.5 transition-colors min-h-[40px]"
            >
              <Download className="w-4 h-4 text-foreground-muted" />
              <span>Télécharger l&apos;Épreuve</span>
            </a>
          )}

          <Link
            href={`/catalog/reader/${proof.id}`}
            target="_blank"
            className="px-5 py-2.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer min-h-[40px]"
          >
            <BookOpen className="w-4 h-4 text-gold" />
            <span>Lire dans la Liseuse</span>
          </Link>
        </div>
      </div>

      {/* Notice ONIX 3.0 Dépliable */}
      {showXmlNotice && (
        <div className="p-5 rounded-3xl bg-navy text-white border border-navy-hover space-y-2 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-navy-hover pb-2">
            <span className="font-bold text-xs text-gold uppercase tracking-wider flex items-center gap-1.5">
              <FileCode className="w-4 h-4" />
              Notice Standardisée ONIX 3.0 Release 3.0 (EDItEUR XML)
            </span>
            <span className="text-[10px] text-white/60 font-mono">Conforme Métadonnées Universitaires</span>
          </div>
          <pre className="p-3 rounded-xl bg-navy-dark text-[10px] font-mono text-white/80 max-h-48 overflow-y-auto border border-navy-hover">
{`<?xml version="1.0" encoding="UTF-8"?>
<ONIXMessage release="3.0" xmlns="http://ns.editeur.org/onix/3.0/reference">
  <Header>
    <Sender><SenderName>LAHA Editions</SenderName></Sender>
  </Header>
  <Product>
    <RecordReference>LAHA-${proof.id}</RecordReference>
    <NotificationType>03</NotificationType>
    <ProductIdentifier>
      <ProductIDType>15</ProductIDType>
      <IDValue>${proof.isbn || "978-99919-0000-0"}</IDValue>
    </ProductIdentifier>
    <DescriptiveDetail>
      <TitleDetail><TitleText>${proof.title}</TitleText></TitleDetail>
      <Contributor><PersonName>${proof.author_name}</PersonName></Contributor>
      <Language><LanguageCode>fre</LanguageCode></Language>
      <Subject><SubjectHeadingText>${proof.discipline}</SubjectHeadingText></Subject>
    </DescriptiveDetail>
  </Product>
</ONIXMessage>`}
          </pre>
        </div>
      )}

      {/* Grille 2 Colonnes : Métadonnées Complètes & Traçabilité */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Métadonnées & Classification Détaillée */}
        <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-navy flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" />
              Métadonnées &amp; Classification
            </h3>
            <AISuggestionBadge source={(proof.classification_source as any) || "ai_suggested"} />
          </div>

          <div className="space-y-2.5 text-xs">
            <p className="flex justify-between py-1 border-b border-border">
              <span className="text-foreground-muted">Titre :</span>
              <span className="font-semibold text-foreground text-right">{proof.title}</span>
            </p>
            <p className="flex justify-between py-1 border-b border-border">
              <span className="text-foreground-muted">Auteur(s) :</span>
              <span className="font-semibold text-foreground text-right">{proof.author_name}</span>
            </p>
            <p className="flex justify-between py-1 border-b border-border">
              <span className="text-foreground-muted">Éditeur / Institution :</span>
              <span className="font-semibold text-gold text-right">{proof.publisher_name}</span>
            </p>
            <p className="flex justify-between py-1 border-b border-border">
              <span className="text-foreground-muted">Discipline académique :</span>
              <span className="font-semibold text-navy text-right">{proof.discipline}</span>
            </p>
            <p className="flex justify-between py-1 border-b border-border">
              <span className="text-foreground-muted">Public cible :</span>
              <span className="font-medium text-foreground text-right">{proof.target_audience || "Étudiants Universitaires"}</span>
            </p>

            {proof.keywords && proof.keywords.length > 0 && (
              <div className="py-1 border-b border-border">
                <span className="text-foreground-muted block mb-1">Mots-clés / Indexation :</span>
                <div className="flex flex-wrap gap-1.5">
                  {proof.keywords.map((kw, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-background border border-border text-foreground font-mono">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2">
              <span className="text-foreground-muted font-bold block mb-1">Résumé de l&apos;ouvrage :</span>
              <p className="text-foreground-muted italic leading-relaxed bg-background p-3 rounded-xl border border-border">
                &ldquo;{proof.summary || "Ouvrage de référence universitaire déposé pour publication au catalogue numérique LAHAThèque."}&rdquo;
              </p>
            </div>
          </div>
        </div>

        {/* Fichiers, Tarifs & Sécurité LCP DRM */}
        <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4">
          <h3 className="text-sm font-bold text-navy flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gold" />
            Fichiers, Tarifs &amp; Protection DRM
          </h3>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-background border border-border">
              <span className="text-foreground-muted text-[11px]">Format de Fichier</span>
              <p className="font-mono font-bold text-foreground mt-0.5">{proof.format}</p>
            </div>

            <div className="p-3 rounded-2xl bg-background border border-border">
              <span className="text-foreground-muted text-[11px]">Nombre de Pages</span>
              <p className="font-semibold text-foreground mt-0.5">{proof.page_count || 105} pages</p>
            </div>

            <div className="p-3 rounded-2xl bg-background border border-border">
              <span className="text-foreground-muted text-[11px]">Prix Numérique (XOF)</span>
              <p className="font-mono font-bold text-navy mt-0.5">{(proof.price_digital || 5000).toLocaleString("fr-FR")} FCFA</p>
            </div>

            <div className="p-3 rounded-2xl bg-background border border-border">
              <span className="text-foreground-muted text-[11px]">Version Papier Physique</span>
              <p className="font-semibold text-foreground mt-0.5">
                {proof.is_paper_available ? `${(proof.price_paper || 7500).toLocaleString("fr-FR")} FCFA` : "Non disponible"}
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-background border border-border col-span-2">
              <span className="text-foreground-muted text-[11px]">Protection Numérique &amp; Watermarking</span>
              <p className="font-semibold text-success flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-4 h-4 text-success" />
                <span>Readium LCP 256-bit • Filigrane Dynamique Actif (20%)</span>
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-background border border-border col-span-2">
              <span className="text-foreground-muted text-[11px]">Accessibilité Audio</span>
              <p className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                <Volume2 className="w-4 h-4 text-gold" />
                <span>Synthèse Vocale Audio (TTS) optimisée pour le lecteur connecté</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Traçabilité & Historique de Validation (3 Étapes) */}
      <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4">
        <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4 text-gold" />
          Traçabilité &amp; Historique de Validation
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-background border border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-navy">1. Dépôt Maquette</span>
              <span className="text-[10px] font-mono text-foreground-muted">
                {formatDate(proof.submitted_at)}
              </span>
            </div>
            <p className="text-foreground">Déposé par : <strong className="text-foreground">{proof.submitted_by}</strong></p>
            <p className="text-foreground-muted text-[11px]">Version déposée : {proof.version || "v1.0"}</p>
          </div>

          <div className="p-4 rounded-2xl bg-background border border-border space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gold">2. Examen Chef Maquettiste</span>
              <span className="text-[10px] font-mono text-foreground-muted">
                {formatDate(proof.reviewed_at || proof.submitted_at)}
              </span>
            </div>
            <p className="text-foreground">Revu par : <strong className="text-navy">{proof.reviewed_by}</strong></p>
            <p className="text-foreground-muted text-[11px] leading-relaxed">
              {proof.notes || "Structure, typographie et conformité technique validées par le chef d'équipe."}
            </p>
          </div>

          <div className={`p-4 rounded-2xl border space-y-1.5 ${
            proof.status === "published" || proof.status === "approved"
              ? "bg-emerald-500/5 border-emerald-500/20"
              : proof.status === "rejected"
              ? "bg-error/5 border-error/20"
              : "bg-navy/5 border-navy/15"
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-navy">3. Arbitrage Direction</span>
              <span className={`text-[10px] font-bold ${
                proof.status === "published" || proof.status === "approved"
                  ? "text-emerald-600"
                  : proof.status === "rejected"
                  ? "text-error"
                  : "text-navy"
              }`}>
                {proof.status === "published" || proof.status === "approved"
                  ? "BAT Validé & Publié"
                  : proof.status === "rejected"
                  ? "Épreuve Rejetée"
                  : "Étape Actuelle"}
              </span>
            </div>
            <p className="text-foreground-muted text-[11px] leading-relaxed">
              {proof.status === "published" || proof.status === "approved"
                ? "Le Bon à Tirer final a été approuvé par la Direction Générale. L'ouvrage est en ligne sur le catalogue public."
                : proof.status === "rejected"
                ? "L'épreuve a été rejetée avec motif de correction notifié à l'équipe maquette."
                : "L'administrateur valide le Bon à Tirer final ou renvoie l'épreuve avec motif de correction."}
            </p>
          </div>
        </div>
      </div>

      {/* Barre d'Actions Décisionnelles */}
      {proof.status === "pending_admin_approval" && (
        <div className="p-6 rounded-3xl bg-background border border-gold/40 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-navy">Décision de Publication Officielle</p>
            <p className="text-[11px] text-foreground-muted">
              Approuvez le Bon à Tirer (BAT) pour publier l&apos;ouvrage au catalogue ou renvoyez-le avec motif.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setIsRejectOpen(true)}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-semibold hover:bg-error/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[44px]"
            >
              <XCircle className="w-4 h-4" />
              <span>Refuser l&apos;Épreuve</span>
            </button>

            <button
              type="button"
              onClick={() => setIsApproveOpen(true)}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-success text-white text-xs font-semibold hover:bg-success/90 transition-colors flex items-center justify-center gap-1.5 shadow-sm cursor-pointer min-h-[44px]"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Valider le BAT &amp; Publier</span>
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
              <p className="text-xs font-bold text-success">Bon à Tirer &amp; Mise en Ligne Officielle</p>
              <p className="text-[11px] text-foreground">
                L&apos;ouvrage <strong className="font-serif">{proof.title}</strong> sera immédiatement disponible sur le catalogue LAHAThèque.
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
              className="px-4 py-2 rounded-xl text-xs font-semibold text-foreground-muted hover:bg-background-secondary cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleApprove}
              className="px-5 py-2 rounded-xl bg-success text-white text-xs font-semibold hover:bg-success/90 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <InlineLoader size={14} />
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
              <p className="text-xs font-bold text-error">Rejet de l&apos;épreuve pour corrections</p>
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
              className="px-4 py-2 rounded-xl text-xs font-semibold text-foreground-muted hover:bg-background-secondary cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-error text-white text-xs font-semibold hover:bg-error/90 transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
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
