"use client";

import React, { useState } from "react";
import { BellRing, X, Save, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { DebtReminderConfig } from "@/lib/types/legal";
import { InlineLoader } from "@/components/ui/page-loader";

interface DebtReminderConfigModalProps {
  currentConfig: DebtReminderConfig;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (config: DebtReminderConfig) => Promise<void>;
}

export function DebtReminderConfigModal({
  currentConfig,
  isOpen,
  onClose,
  onConfirm,
}: DebtReminderConfigModalProps) {
  const [minAmountThreshold, setMinAmountThreshold] = useState(currentConfig.min_amount_threshold);
  const [daysBeforeFirst, setDaysBeforeFirst] = useState(currentConfig.days_before_first_reminder);
  const [maxReminders, setMaxReminders] = useState(currentConfig.max_reminders_count);
  const [frequencyDays, setFrequencyDays] = useState(currentConfig.frequency_days);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onConfirm({
        min_amount_threshold: minAmountThreshold,
        days_before_first_reminder: daysBeforeFirst,
        max_reminders_count: maxReminders,
        frequency_days: frequencyDays,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

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
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-gold/10 text-gold border border-gold/20">
                <BellRing className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-navy text-base">Configuration des Relances Automatiques</h2>
                <p className="text-xs text-foreground-muted">Seuils et fréquence des e-mails d&apos;impayés clients</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-background-secondary transition-colors text-foreground-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                  Seuil minimum de dette (FCFA) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={minAmountThreshold}
                  onChange={(e) => setMinAmountThreshold(parseInt(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 text-xs font-mono font-bold rounded-xl border border-border bg-background-secondary focus:outline-none focus:border-gold text-navy min-h-[44px]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                  Délai avant 1ère relance (jours) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={daysBeforeFirst}
                  onChange={(e) => setDaysBeforeFirst(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 text-xs font-mono font-bold rounded-xl border border-border bg-background-secondary focus:outline-none focus:border-gold text-navy min-h-[44px]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                  Nombre max de relances *
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={maxReminders}
                  onChange={(e) => setMaxReminders(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 text-xs font-mono font-bold rounded-xl border border-border bg-background-secondary focus:outline-none focus:border-gold text-navy min-h-[44px]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                  Intervalle entre relances (jours) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={frequencyDays}
                  onChange={(e) => setFrequencyDays(parseInt(e.target.value) || 1)}
                  className="w-full px-3.5 py-2.5 text-xs font-mono font-bold rounded-xl border border-border bg-background-secondary focus:outline-none focus:border-gold text-navy min-h-[44px]"
                  required
                />
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-navy/5 border border-navy/20 text-xs text-foreground-muted space-y-1">
              <p className="font-bold text-navy flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-gold" />
                Déclenchement 100% automatique
              </p>
              <p>
                Les relances seront envoyées automatiquement par e-mail aux clients dont le solde débiteur dépasse le seuil configuré.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
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
                    <Save className="w-4 h-4 text-gold" />
                    Enregistrer la configuration
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
