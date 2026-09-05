"use client";

import React, { useState } from "react";
import { Send, X, FileText, CheckCircle2, AlertCircle, Calendar, Mail, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { AuthorEmailReport, PeriodType } from "@/lib/types/legal";
import { sendAuthorRoyaltyStatementDetailed } from "@/lib/services/legal";
import { InlineLoader } from "@/components/ui/page-loader";

interface SendAuthorStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  author: AuthorEmailReport | null;
  defaultPeriodType?: PeriodType;
  defaultYear?: number;
  defaultMonth?: number;
  defaultQuarter?: number;
}

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

const QUARTER_NAMES = [
  { value: 1, label: "T1 (Janvier - Mars)" },
  { value: 2, label: "T2 (Avril - Juin)" },
  { value: 3, label: "T3 (Juillet - Septembre)" },
  { value: 4, label: "T4 (Octobre - Décembre)" },
];

export function SendAuthorStatementModal({
  isOpen,
  onClose,
  onSuccess,
  author,
  defaultPeriodType = "monthly",
  defaultYear = new Date().getFullYear(),
  defaultMonth = new Date().getMonth() + 1,
  defaultQuarter = Math.ceil((new Date().getMonth() + 1) / 3),
}: SendAuthorStatementModalProps) {
  const [periodType, setPeriodType] = useState<PeriodType>(defaultPeriodType);
  const [year, setYear] = useState<number>(defaultYear);
  const [month, setMonth] = useState<number>(defaultMonth);
  const [quarter, setQuarter] = useState<number>(defaultQuarter);
  const [includePdf, setIncludePdf] = useState<boolean>(true);
  const [customNote, setCustomNote] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen || !author) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.author_id && !author.email) {
      setErrorMsg("Identifiant de l'auteur manquant.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await sendAuthorRoyaltyStatementDetailed({
        author_id: author.author_id || author.email || "",
        period_type: periodType,
        year,
        month: periodType === "monthly" ? month : undefined,
        quarter: periodType === "quarterly" ? quarter : undefined,
        include_pdf: includePdf,
        custom_note: customNote.trim() ? customNote.trim() : undefined,
      });

      if (res.success) {
        setSuccessMsg(res.message || "Bordereau expédié avec succès via le serveur officiel LAHAThèque.");
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1400);
      } else {
        setErrorMsg(res.error || "Impossible d'expédier le bordereau.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Erreur réseau lors de l'expédition.");
    } finally {
      setLoading(false);
    }
  };

  const periodLabel = periodType === "monthly"
    ? `${MONTH_NAMES[month - 1]} ${year}`
    : `T${quarter} ${year} (${QUARTER_NAMES[quarter - 1]?.label || ""})`;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-background border border-border rounded-3xl shadow-xl w-full max-w-lg p-6 space-y-5"
          onClick={(e) => e.stopPropagation()}
        >
          {/* En-tête */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gold/10 text-gold border border-gold/20">
                <FileText className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-navy text-base">
                  Expédition du Relevé de Droits
                </h2>
                <p className="text-xs text-foreground-muted">
                  Bordereau financier périodique adressé à l&apos;auteur
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-background-secondary transition-colors text-foreground-muted min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Fiche Destinataire & Canal Pro */}
          <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground-muted">Bénéficiaire :</span>
              <span className="font-bold text-navy">{author.name || author.author_name || "Auteur"}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-foreground-muted">Adresse e-mail :</span>
              <span className="font-mono text-navy">{author.email || author.author_email || "N/A"}</span>
            </div>
            <div className="pt-2 border-t border-border flex items-center gap-2 text-xs text-foreground-muted">
              <ShieldCheck className="w-3.5 h-3.5 text-gold flex-shrink-0" />
              <span>Expédié depuis le mail pro certifié <strong className="text-navy">contact@mail.lahalex.com</strong></span>
            </div>
          </div>

          <form onSubmit={handleSend} className="space-y-4">
            {/* Choix de la périodicité : Mensuel vs Trimestriel */}
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
                Période du Relevé *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPeriodType("monthly")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors min-h-[44px] ${
                    periodType === "monthly"
                      ? "bg-navy text-white border-navy font-bold"
                      : "bg-background-secondary text-foreground-muted border-border hover:text-navy"
                  }`}
                >
                  Mensuel
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodType("quarterly")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors min-h-[44px] ${
                    periodType === "quarterly"
                      ? "bg-navy text-white border-navy font-bold"
                      : "bg-background-secondary text-foreground-muted border-border hover:text-navy"
                  }`}
                >
                  Trimestriel
                </button>
              </div>
            </div>

            {/* Sélecteurs Année et Mois/Trimestre */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                  Année *
                </label>
                <select
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-border bg-background-secondary focus:outline-none focus:border-gold text-navy min-h-[44px]"
                >
                  {[defaultYear, defaultYear - 1, defaultYear - 2].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              {periodType === "monthly" ? (
                <div>
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                    Mois *
                  </label>
                  <select
                    value={month}
                    onChange={(e) => setMonth(parseInt(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-border bg-background-secondary focus:outline-none focus:border-gold text-navy min-h-[44px]"
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={name} value={idx + 1}>{name}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                    Trimestre *
                  </label>
                  <select
                    value={quarter}
                    onChange={(e) => setQuarter(parseInt(e.target.value))}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-border bg-background-secondary focus:outline-none focus:border-gold text-navy min-h-[44px]"
                  >
                    {QUARTER_NAMES.map((q) => (
                      <option key={q.value} value={q.value}>{q.label}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Option PDF */}
            <div className="p-3 rounded-xl bg-background-secondary border border-border flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-gold" />
                  Pièce jointe PDF sécurisée
                </span>
                <p className="text-[11px] text-foreground-muted">
                  Générer et joindre le bordereau officiel signé (Bordereau_{year}...)
                </p>
              </div>
              <input
                type="checkbox"
                checked={includePdf}
                onChange={(e) => setIncludePdf(e.target.checked)}
                className="w-4 h-4 rounded border-border accent-navy cursor-pointer"
              />
            </div>

            {/* Note d'accompagnement juridique */}
            <div>
              <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Note juridique d&apos;accompagnement (optionnel)
              </label>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Ex : Précisions relatives aux ventes papier du salon de Cotonou..."
                rows={2}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-border bg-background-secondary focus:outline-none focus:border-gold text-navy"
              />
            </div>

            {/* Récapitulatif Période */}
            <div className="p-3 rounded-xl bg-gold/10 border border-gold/20 flex items-center gap-2 text-xs text-navy">
              <Calendar className="w-4 h-4 text-gold flex-shrink-0" />
              <span>
                Relevé programmé pour : <strong>{periodLabel}</strong>
              </span>
            </div>

            {/* Messages de statut */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:text-navy min-h-[44px]"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px] shadow-xs"
              >
                {loading ? (
                  <InlineLoader size={16} />
                ) : (
                  <>
                    <Send className="w-4 h-4 text-gold" />
                    Expédier le Relevé
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
