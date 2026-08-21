"use client";

import React, { useState } from "react";
import {
  DollarSign,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  FileSpreadsheet,
  Building2,
  Clock,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface UniversityRoyaltyCardProps {
  availableBalance: number;
  totalPaid: number;
  contractualRate?: number;
  currency?: string;
  minThreshold?: number;
  onWithdraw: (amount: number) => Promise<boolean>;
}

export function UniversityRoyaltyCard({
  availableBalance,
  totalPaid,
  contractualRate = 15.0,
  currency = "XOF",
  minThreshold = 100000,
  onWithdraw,
}: UniversityRoyaltyCardProps) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [amount, setAmount] = useState(availableBalance);

  const canWithdraw = availableBalance >= minThreshold;

  const handleConfirmWithdraw = async () => {
    if (amount < minThreshold || amount > availableBalance) {
      toast.error(`Le montant doit être compris entre ${minThreshold.toLocaleString("fr-FR")} et ${availableBalance.toLocaleString("fr-FR")} ${currency}.`);
      return;
    }

    setLoading(true);
    try {
      const ok = await onWithdraw(amount);
      if (ok) {
        toast.success(`Demande de virement de ${amount.toLocaleString("fr-FR")} ${currency} transmise à la Trésorerie LAHA.`);
        setShowModal(false);
      } else {
        toast.error("Échec de la demande de virement.");
      }
    } catch {
      toast.error("Erreur de communication avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="p-6 rounded-3xl bg-navy text-white space-y-6 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 border-b border-navy-hover pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-gold uppercase tracking-wider">
              <DollarSign className="w-4 h-4" />
              Redevance Partenaire Universitaire (15% HT)
            </div>
            <h3 className="font-serif text-xl sm:text-2xl font-bold">
              Solde de Redevance Disponible
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-gold/15 border border-gold/30 text-gold text-xs font-bold">
              Taux Fixe : {contractualRate}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
          <div className="p-4 rounded-2xl bg-navy-dark/60 border border-navy-hover space-y-1">
            <span className="text-[11px] text-slate-300 font-medium">
              Disponible pour Reversement
            </span>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
              {availableBalance.toLocaleString("fr-FR")}{" "}
              <span className="text-base text-gold font-sans">{currency}</span>
            </p>
            <p className="text-[10px] text-slate-400">
              Seuil minimal de virement : {minThreshold.toLocaleString("fr-FR")} {currency}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-navy-dark/60 border border-navy-hover space-y-1">
            <span className="text-[11px] text-slate-300 font-medium">
              Total Déjà Versé à l&apos;Établissement
            </span>
            <p className="text-2xl sm:text-3xl font-serif font-bold text-emerald-400 tracking-tight">
              {totalPaid.toLocaleString("fr-FR")}{" "}
              <span className="text-base text-gold font-sans">{currency}</span>
            </p>
            <p className="text-[10px] text-slate-400">
              Reversé sur compte Trésor Public / Ecobank
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 relative z-10">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-gold" />
            <span>Redevance régie par la Convention Cadre Universitaire</span>
          </div>

          <button
            type="button"
            onClick={() => {
              setAmount(availableBalance);
              setShowModal(true);
            }}
            disabled={!canWithdraw}
            className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gold hover:bg-gold-light text-navy text-xs font-bold transition-all inline-flex items-center justify-center gap-2 shadow-xs min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Demander le Virement des Redevances</span>
          </button>
        </div>
      </div>

      {/* Modal Demande de Virement */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-navy/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 text-navy">
                <DollarSign className="w-5 h-5 text-gold" />
                <h3 className="font-serif font-bold text-base">
                  Demande de Versement des Redevances
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-foreground-muted hover:text-navy text-xs font-bold"
              >
                Fermer
              </button>
            </div>

            <p className="text-xs text-foreground-muted leading-relaxed">
              Le montant sera viré sur le compte officiel de l&apos;université enregistré dans votre convention (Trésor Public / Banque de domiciliation).
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">
                Montant à Transférer ({currency})
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={minThreshold}
                max={availableBalance}
                className="w-full px-3.5 py-2.5 text-sm font-mono font-bold bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[44px]"
              />
              <p className="text-[10px] text-foreground-muted">
                Maximum disponible : {availableBalance.toLocaleString("fr-FR")} {currency}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-background-secondary border border-border space-y-1 text-xs">
              <span className="font-bold text-navy">Compte Bénéficiaire Institutionnel :</span>
              <p className="text-foreground-muted font-mono text-[11px]">Trésor Public / Ecobank Bénin</p>
              <p className="text-foreground-muted font-mono text-[10px]">IBAN : BJ0610100100198765432100</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-background-secondary border border-border text-navy text-xs font-bold hover:border-gold transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmWithdraw}
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-gold" />
                )}
                <span>Valider Demande</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
