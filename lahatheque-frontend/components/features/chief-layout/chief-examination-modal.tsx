"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  CheckCircle2, 
  AlertCircle, 
  X, 
  ShieldCheck, 
  User, 
  Sparkles, 
  FileText, 
  Send, 
  Eye, 
  BookOpen,
  DollarSign,
  GraduationCap,
  Tag,
  Building,
  Globe,
  Calendar,
  Layers
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { StatusBadge } from "@/components/ui/status-badge";
import { InlineLoader } from "@/components/ui/page-loader";
import { AISuggestionBadge } from "@/components/features/layout-artist/ai-suggestion-badge";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { useAuth } from "@/hooks/use-auth";
import type { LayoutDeposit } from "@/lib/types/layout-artist";

interface ChiefExaminationModalProps {
  deposit: LayoutDeposit | null;
  isOpen: boolean;
  onClose: () => void;
  onValidate: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}

export function ChiefExaminationModal({
  deposit,
  isOpen,
  onClose,
  onValidate,
  onReject,
}: ChiefExaminationModalProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<"view" | "reject">("view");
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCurrentUser = Boolean(
    user &&
    deposit &&
    (
      (deposit.maquettiste_id && (deposit.maquettiste_id === user.id || deposit.maquettiste_id === String(user.id))) ||
      (`${user.first_name || ""} ${user.last_name || ""}`.trim().toLowerCase() === (deposit.maquettiste_name || "").toLowerCase()) ||
      (user.email && (deposit.maquettiste_name || "").toLowerCase().includes(user.email.toLowerCase()))
    )
  );

  if (!isOpen || !deposit) return null;

  const handleValidate = async () => {
    setLoading(true);
    try {
      await onValidate(deposit.id);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      setError("Veuillez obligatoirement indiquer le motif du refus et les corrections à effectuer.");
      return;
    }
    setLoading(true);
    try {
      await onReject(deposit.id, rejectReason.trim());
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndClose = () => {
    setMode("view");
    setRejectReason("");
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-navy-dark/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto"
        onClick={handleResetAndClose}
        role="dialog"
        aria-modal="true"
        aria-label={`Examen du dépôt : ${deposit.metadata.title}`}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-background border border-border rounded-3xl shadow-2xl w-full max-w-3xl p-5 sm:p-7 space-y-6 my-6 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Modale */}
          <div className="flex items-start justify-between border-b border-border pb-4">
            <div className="space-y-1 pr-4">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gold bg-gold/10 px-2.5 py-0.5 rounded-full border border-gold/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Examen du Chef Maquettiste
                </span>
                <StatusBadge status={deposit.status} />
              </div>
              <h2 className="font-serif font-bold text-navy text-xl sm:text-2xl leading-tight">
                {deposit.metadata.title}
              </h2>
              {deposit.metadata.subtitle && (
                <p className="text-xs text-foreground-muted italic">{deposit.metadata.subtitle}</p>
              )}
              <p className="text-xs text-foreground-muted flex items-center gap-1.5 pt-0.5">
                <User className="w-3.5 h-3.5 text-gold" />
                Soumis par{" "}
                {isCurrentUser ? (
                  <span className="font-bold text-gold">
                    Vous {deposit.maquettiste_name && deposit.maquettiste_name !== "Maquettiste" ? `(${deposit.maquettiste_name})` : ""}
                  </span>
                ) : (
                  <span className="font-semibold text-foreground">{deposit.maquettiste_name || "Maquettiste"}</span>
                )}
                {deposit.submitted_at && (
                  <span>
                    • {new Date(deposit.submitted_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                  </span>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetAndClose}
              className="p-2 rounded-xl hover:bg-background-secondary text-foreground-muted hover:text-navy transition-colors shrink-0 cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Mode 1 : Visualisation Complète de l'examen */}
          {mode === "view" && (
            <div className="space-y-5">
              {/* Rattachement Pré-édition (si disponible) */}
              {(deposit.metadata.pre_edition_code || deposit.pre_edition_dossier) && (
                <div className="p-3.5 bg-navy/5 border border-navy/20 rounded-2xl flex items-center gap-3 text-xs">
                  <div className="w-7 h-7 rounded-lg bg-gold/10 text-gold flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-navy">
                      Dossier Pré-édition d&apos;origine : <span className="font-mono text-gold">{deposit.metadata.pre_edition_code || deposit.pre_edition_dossier?.code_dossier}</span>
                    </p>
                    <p className="text-[11px] text-foreground-muted truncate">
                      {deposit.metadata.pre_edition_title || deposit.pre_edition_dossier?.titre_previsionnel}
                      {deposit.metadata.pre_edition_author ? ` • Auteur : ${deposit.metadata.pre_edition_author}` : ""}
                    </p>
                  </div>
                </div>
              )}

              {/* 1. Couverture 3D & Notice Éditoriale */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 bg-background-secondary p-5 rounded-2xl border border-border items-center">
                <div className="sm:col-span-4 flex flex-col items-center justify-center">
                  <BookCover3D
                    title={deposit.metadata.title}
                    authors={deposit.metadata.authors}
                    discipline={deposit.classification.discipline}
                    coverUrl={deposit.files.cover_url}
                    size="md"
                  />
                  <span className="text-[11px] text-foreground-muted mt-2.5 font-mono text-center font-semibold">
                    Format : {deposit.files.format}
                  </span>
                </div>

                <div className="sm:col-span-8 space-y-2 text-xs">
                  <div className="flex items-center justify-between pb-1 border-b border-border">
                    <span className="font-bold text-navy text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-gold" />
                      Notice Éditoriale
                    </span>
                    <AISuggestionBadge source={deposit.metadata.language_source} />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">Auteur(s) :</span>
                    <span className="font-semibold text-foreground text-right">{deposit.metadata.authors.join(", ") || "Non renseigné"}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">Langue &amp; Année :</span>
                    <span className="font-medium text-foreground">{deposit.metadata.language} • {deposit.metadata.publication_year}</span>
                  </div>

                  {deposit.metadata.isbn && (
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-muted">Code ISBN :</span>
                      <span className="font-mono text-foreground">{deposit.metadata.isbn}</span>
                    </div>
                  )}

                  {deposit.metadata.keywords && deposit.metadata.keywords.length > 0 && (
                    <div className="flex items-start justify-between gap-2 pt-1">
                      <span className="text-foreground-muted shrink-0">Mots-clés :</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {deposit.metadata.keywords.map((kw, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-background border border-border text-[10px] text-navy font-medium">
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Classification Académique Complète */}
              <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-3 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-border">
                  <span className="font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-gold" />
                    Classification Académique &amp; Universitaire
                  </span>
                  <AISuggestionBadge source={deposit.classification.source} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">Discipline :</span>
                    <span className="font-bold text-navy text-right">{deposit.classification.discipline || "Non classifié"}</span>
                  </div>

                  {deposit.classification.dewey_code && (
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-muted">Code Dewey :</span>
                      <span className="font-mono font-bold text-gold">{deposit.classification.dewey_code}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">Université / Établissement :</span>
                    <span className="text-foreground text-right">{deposit.classification.university || "Non affilié"}</span>
                  </div>

                  {deposit.classification.faculty && (
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-muted">Faculté / UFR :</span>
                      <span className="text-foreground text-right">{deposit.classification.faculty}</span>
                    </div>
                  )}

                  {deposit.classification.department && (
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-muted">Département :</span>
                      <span className="text-foreground text-right">{deposit.classification.department}</span>
                    </div>
                  )}

                  {deposit.classification.target_audience && (
                    <div className="flex items-center justify-between">
                      <span className="text-foreground-muted">Public cible :</span>
                      <span className="text-foreground text-right">{deposit.classification.target_audience}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-foreground-muted">Pays :</span>
                    <span className="font-mono text-foreground uppercase">{deposit.classification.country || "BJ"}</span>
                  </div>
                </div>
              </div>

              {/* 3. Résumé éditorial */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-navy uppercase tracking-wider">Résumé de l&apos;ouvrage</h4>
                <p className="text-xs text-foreground bg-background p-3.5 rounded-2xl border border-border leading-relaxed max-h-32 overflow-y-auto">
                  {deposit.metadata.summary || "Aucun résumé renseigné."}
                </p>
              </div>

              {/* 4. Tarification & Disponibilité Papier */}
              <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-border">
                  <span className="font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-gold" />
                    Tarification &amp; Commercialisation
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-border">
                    <span className="text-foreground-muted">Prix Numérique :</span>
                    <span className="font-bold text-navy text-sm font-mono">{Number(deposit.default_price || 5000).toLocaleString("fr-FR")} FCFA</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-border">
                    <span className="text-foreground-muted">Version Papier :</span>
                    <span className="font-semibold text-foreground">
                      {deposit.is_paper_available ? (
                        <span className="text-emerald-700 font-bold font-mono">
                          Disponible • {Number(deposit.admin_price || 7500).toLocaleString("fr-FR")} FCFA
                        </span>
                      ) : (
                        <span className="text-foreground-muted">Non disponible</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* 5. Document original & Consultation dans la liseuse */}
              <div className="p-4 rounded-2xl bg-background-secondary border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <BookCover3D
                    title={deposit.metadata.title}
                    authors={deposit.metadata.authors}
                    discipline={deposit.classification.discipline}
                    coverUrl={deposit.files.cover_url}
                    size="xs"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-navy text-xs truncate">
                      {deposit.files.book_file_name || `${deposit.metadata.title}.${(deposit.files.format || "pdf").toLowerCase()}`}
                    </p>
                    <p className="text-[11px] text-foreground-muted">
                      Document original soumis par <span className="font-medium text-foreground">{deposit.maquettiste_name}</span>
                      {deposit.files.book_file_size ? ` • ${(deposit.files.book_file_size / (1024 * 1024)).toFixed(2)} Mo` : ""}
                    </p>
                  </div>
                </div>
                <Link
                  href={`/catalog/reader/${deposit.id}`}
                  target="_blank"
                  className="px-4 py-2.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold flex items-center justify-center gap-2 shrink-0 shadow-xs transition-colors cursor-pointer min-h-[44px]"
                >
                  <BookOpen className="w-4 h-4 text-gold" />
                  Lire dans la liseuse LAHAThèque
                </Link>
              </div>

              {/* DRM & Filigrane */}
              <div className="p-3.5 rounded-2xl bg-background-secondary border border-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-gold" />
                  <span className="font-semibold text-navy">Protection Numérique &amp; Tatouage Filigrane DRM</span>
                </div>
                <StatusBadge status="approved" leftLabel="Filigrane &amp; DRM Actifs" />
              </div>

              {/* Actions de Décision */}
              <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMode("reject")}
                  className="w-full sm:flex-1 py-3 px-4 rounded-2xl border border-error/30 bg-error/10 text-error text-xs font-bold hover:bg-error/20 transition-colors flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
                >
                  <AlertCircle className="w-4 h-4" />
                  Refuser / Demander correction
                </button>

                <button
                  type="button"
                  onClick={handleValidate}
                  disabled={loading}
                  className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 min-h-[44px] shadow-sm cursor-pointer"
                >
                  {loading ? (
                    <InlineLoader size={16} />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Valider &amp; Publier sur la Vitrine
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Mode 2 : Formulaire de Refus / Motif de correction obligatoire */}
          {mode === "reject" && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-error/5 border border-error/20 space-y-2">
                <div className="flex items-center gap-2 text-error font-bold text-xs uppercase tracking-wider">
                  <AlertCircle className="w-4 h-4" />
                  Formulaire de Demande de Correction
                </div>
                <p className="text-xs text-foreground-muted">
                  Veuillez spécifier avec précision les corrections à apporter (ex : typographie, métadonnées, classification, fichier manquant). Ce message sera notifié et affiché au maquettiste <strong className="text-foreground">{deposit.maquettiste_name}</strong>.
                </p>
              </div>

              {error && (
                <p className="text-xs text-error font-semibold bg-error/10 p-3 rounded-xl border border-error/20">
                  {error}
                </p>
              )}

              <div>
                <label className="block text-xs font-semibold text-navy mb-1.5">
                  Motif du refus &amp; instructions de correction *
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => {
                    setRejectReason(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Ex : Veuillez corriger le nom de l'auteur principal et renseigner le code Dewey exact pour la discipline Droit Privé..."
                  rows={5}
                  className="w-full p-3.5 text-xs rounded-2xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-navy/20 leading-relaxed"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setMode("view");
                    setError(null);
                  }}
                  className="w-full sm:flex-1 py-3 px-4 rounded-2xl border border-border bg-background hover:bg-background-secondary text-xs font-bold text-navy transition-colors cursor-pointer min-h-[44px]"
                >
                  Annuler
                </button>

                <button
                  type="button"
                  onClick={handleConfirmReject}
                  disabled={loading}
                  className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-error text-white text-xs font-bold hover:bg-error/90 transition-colors flex items-center justify-center gap-2 min-h-[44px] shadow-sm cursor-pointer"
                >
                  {loading ? (
                    <InlineLoader size={16} />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Confirmer le Refus &amp; Notifier
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
