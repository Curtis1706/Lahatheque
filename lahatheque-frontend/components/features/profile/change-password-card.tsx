"use client";

import React, { useState } from "react";
import { KeyRound, Eye, EyeOff, Lock, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { changePassword } from "@/lib/services/auth";
import { InlineLoader } from "@/components/ui/page-loader";

export function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLengthValid = newPassword.length >= 8;
  const isMatchValid = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error("Veuillez saisir votre mot de passe actuel.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Le nouveau mot de passe doit comporter au moins 8 caractères.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Le nouveau mot de passe et sa confirmation ne correspondent pas.");
      return;
    }

    if (currentPassword === newPassword) {
      toast.error("Le nouveau mot de passe doit être différent du mot de passe actuel.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      if (res.success) {
        toast.success(res.message || "Votre mot de passe a été modifié avec succès.");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res.error || "Échec de la modification du mot de passe.");
      }
    } catch {
      toast.error("Erreur de connexion avec le serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 rounded-3xl bg-background border border-border shadow-xs space-y-5">
      {/* Header de section */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-gold/15 text-gold">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider">
              Sécurité &amp; Mot de Passe
            </h3>
            <p className="text-xs text-foreground-muted">
              Modifiez régulièrement votre mot de passe pour garantir la sécurité de votre compte.
            </p>
          </div>
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mot de passe actuel */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-navy uppercase tracking-wider block">
            Mot de passe actuel
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none">
              <Lock className="w-4 h-4 text-gold" />
            </div>
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-border bg-background text-navy text-xs font-mono placeholder:text-foreground-muted/40 focus:outline-none focus:border-gold transition-colors min-h-[42px]"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-navy p-1"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Nouveau mot de passe et Confirmation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nouveau mot de passe */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-navy uppercase tracking-wider block">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none">
                <Lock className="w-4 h-4 text-gold" />
              </div>
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Au moins 8 caractères"
                required
                minLength={8}
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-border bg-background text-navy text-xs font-mono placeholder:text-foreground-muted/40 focus:outline-none focus:border-gold transition-colors min-h-[42px]"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-navy p-1"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirmer le mot de passe */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-navy uppercase tracking-wider block">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none">
                <Lock className="w-4 h-4 text-gold" />
              </div>
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Répétez le nouveau mot de passe"
                required
                minLength={8}
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-border bg-background text-navy text-xs font-mono placeholder:text-foreground-muted/40 focus:outline-none focus:border-gold transition-colors min-h-[42px]"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-navy p-1"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Indicateurs de conformité */}
        {newPassword.length > 0 && (
          <div className="flex flex-wrap items-center gap-4 text-[11px] pt-1">
            <span
              className={`inline-flex items-center gap-1 font-semibold ${
                isLengthValid ? "text-success" : "text-foreground-muted"
              }`}
            >
              {isLengthValid ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              Au moins 8 caractères
            </span>

            {confirmPassword.length > 0 && (
              <span
                className={`inline-flex items-center gap-1 font-semibold ${
                  isMatchValid ? "text-success" : "text-error"
                }`}
              >
                {isMatchValid ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
                {isMatchValid ? "Mots de passe identiques" : "Les mots de passe diffèrent"}
              </span>
            )}
          </div>
        )}

        {/* Bouton de soumission */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting || !currentPassword || !isLengthValid || !isMatchValid}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-all disabled:opacity-50 min-h-[42px] shadow-xs"
          >
            {isSubmitting ? (
              <>
                <InlineLoader size={16} />
                <span>Modification en cours...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Mettre à jour le mot de passe</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
