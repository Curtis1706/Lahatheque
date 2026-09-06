"use client";

import React, { useState, useEffect } from "react";
import { Send, X, AlertTriangle, ShieldAlert, CheckCircle2, AlertCircle, Mail, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ClientDebt } from "@/lib/types/legal";
import { sendDetailedDebtReminder } from "@/lib/services/legal";
import { InlineLoader } from "@/components/ui/page-loader";

interface SendDebtReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  debt: ClientDebt | null;
}

const REMINDER_LEVELS = [
  {
    level: 1 as const,
    title: "Niveau 1 — Relance Amiable",
    description: "Rappel bienveillant de la facture en attente de règlement.",
    badgeClass: "bg-info/10 text-info border-info/20",
  },
  {
    level: 2 as const,
    title: "Niveau 2 — Relance Ferme",
    description: "Avertissement solennel constatant le retard persistant.",
    badgeClass: "bg-warning/10 text-warning border-warning/20",
  },
  {
    level: 3 as const,
    title: "Niveau 3 — Mise en Demeure",
    description: "Dernier avis formel avant blocage du compte et poursuites judiciaires.",
    badgeClass: "bg-error/10 text-error border-error/20",
  },
];

export function SendDebtReminderModal({
  isOpen,
  onClose,
  onSuccess,
  debt,
}: SendDebtReminderModalProps) {
  const [level, setLevel] = useState<1 | 2 | 3>(1);
  const [customNote, setCustomNote] = useState<string>("");
  const [ccAccountant, setCcAccountant] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (debt) {
      if ((debt.reminder_count ?? 0) >= 2 || debt.days_overdue > 21) {
        setLevel(3);
      } else if ((debt.reminder_count ?? 0) === 1 || debt.days_overdue > 10) {
        setLevel(2);
      } else {
        setLevel(1);
      }
      setCustomNote("");
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [debt]);

  if (!isOpen || !debt) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await sendDetailedDebtReminder({
        debt_id: debt.id,
        client_id: debt.client_id || debt.id,
        client_email: debt.client_email,
        amount: debt.amount || debt.total_debt_amount,
        days_overdue: debt.days_overdue,
        reminder_level: level,
        custom_note: customNote.trim() ? customNote.trim() : undefined,
        custom_message: customNote.trim() ? customNote.trim() : undefined,
        cc_accountant: ccAccountant,
      });

      if (res.success) {
        setSuccessMsg(res.message || "Relance expédiée avec succès via le serveur officiel LAHAThèque.");
        setTimeout(() => {
          onSuccess?.();
          onClose();
        }, 1400);
      } else {
        setErrorMsg(res.error || "Impossible d'expédier la relance.");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Erreur réseau lors de l'expédition.");
    } finally {
      setLoading(false);
    }
  };

  const formattedAmount = new Intl.NumberFormat("fr-FR").format(debt.amount || debt.total_debt_amount || 0);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 overflow-hidden"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-background border border-border rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[min(90dvh,760px)]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* En-tête fixe */}
          <div className="flex items-center justify-between p-5 sm:p-6 pb-4 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gold/10 text-gold border border-gold/20">
                <ShieldAlert className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-navy text-base">
                  Expédition d&apos;une Relance d&apos;Impayé
                </h2>
                <p className="text-xs text-foreground-muted">
                  Procédure de recouvrement amiable ou contentieuse
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-background-secondary transition-colors text-foreground-muted min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Formulaire avec corps scrollable et pied d'actions fixe */}
          <form onSubmit={handleSend} className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Corps scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4">
              {/* Fiche Débiteur */}
              <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground-muted">Débiteur :</span>
                  <span className="font-bold text-navy">{debt.client_name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground-muted">Adresse e-mail :</span>
                  <span className="font-mono text-navy">{debt.client_email}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground-muted">Montant exigible :</span>
                  <span className="font-mono font-bold text-error">{formattedAmount} {debt.currency || "FCFA"}</span>
                </div>
                {debt.reference_document && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground-muted">Réf. pièce :</span>
                    <span className="font-mono text-navy">{debt.reference_document}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground-muted">Retard constaté :</span>
                  <span className="font-semibold text-warning">{debt.days_overdue} jours</span>
                </div>
              </div>

              {/* Choix du niveau de relance */}
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-2">
                  Niveau d&apos;avertissement *
                </label>
                <div className="space-y-2">
                  {REMINDER_LEVELS.map((r) => (
                    <button
                      key={r.level}
                      type="button"
                      onClick={() => setLevel(r.level)}
                      className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 min-h-[44px] cursor-pointer ${
                        level === r.level
                          ? "bg-navy/5 border-navy shadow-xs"
                          : "bg-background-secondary border-border hover:bg-background-secondary/80"
                      }`}
                    >
                      <div className={`mt-0.5 px-2 py-0.5 rounded-lg text-[10px] font-bold border uppercase tracking-wider ${r.badgeClass}`}>
                        N{r.level}
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs font-bold ${level === r.level ? "text-navy" : "text-foreground"}`}>
                          {r.title}
                        </p>
                        <p className="text-[11px] text-foreground-muted mt-0.5">
                          {r.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Note complémentaire */}
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                  Instruction ou précision particulière (optionnel)
                </label>
                <textarea
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="Ex : Paiement partiel reçu de 10 000 FCFA, solde restant à régler sous 48h..."
                  rows={2}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-border bg-background-secondary focus:outline-none focus:border-gold text-navy placeholder:text-foreground-muted"
                />
              </div>

              {/* Copie comptabilité */}
              <div className="p-3 rounded-xl bg-background-secondary border border-border flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-gold" />
                    Copie conforme comptabilité
                  </span>
                  <p className="text-[11px] text-foreground-muted">
                    Mettre en copie le pôle financier (comptabilite@lahatheque.bj)
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={ccAccountant}
                  onChange={(e) => setCcAccountant(e.target.checked)}
                  className="w-4 h-4 rounded border-border accent-navy cursor-pointer"
                />
              </div>

              {/* Messages de statut */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-error/10 border border-error/20 text-xs text-error flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="p-3 rounded-xl bg-success/10 border border-success/20 text-xs text-success flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}
            </div>

            {/* Actions / Pied de modale fixe */}
            <div className="p-4 sm:p-6 border-t border-border bg-background-secondary/30 shrink-0 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:text-navy min-h-[44px] cursor-pointer transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px] shadow-xs cursor-pointer"
              >
                {loading ? (
                  <InlineLoader size={16} />
                ) : (
                  <>
                    <Send className="w-4 h-4 text-gold" />
                    Expédier la Relance
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
