"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Sliders, CheckCircle2, RotateCcw, Save, Sparkles, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { getAdminUserDiscounts, updateAdminUserDiscounts } from "@/lib/services/admin";
import type { AdminUser, AuthorUserDiscounts } from "@/lib/types/admin";
import { UserAvatar } from "@/components/ui/user-avatar";

interface AuthorDiscountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AdminUser | null;
  onUpdated?: () => void;
}

export function AuthorDiscountsModal({
  isOpen,
  onClose,
  user,
  onUpdated,
}: AuthorDiscountsModalProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [discountsData, setDiscountsData] = useState<AuthorUserDiscounts | null>(null);

  const [mode, setMode] = useState<"global" | "custom">("global");
  const [paperPct, setPaperPct] = useState<number>(40);
  const [digitalPct, setDigitalPct] = useState<number>(25);
  const [audioPct, setAudioPct] = useState<number>(25);

  useEffect(() => {
    if (!isOpen || !user) return;

    let isMounted = true;
    setLoading(true);

    getAdminUserDiscounts(user.id)
      .then((data: AuthorUserDiscounts | null) => {
        if (!isMounted) return;
        if (data) {
          setDiscountsData(data);
          const isCustom = Boolean(data.is_custom);
          setMode(isCustom ? "custom" : "global");
          setPaperPct(data.effective_paper_pct ?? data.global_defaults?.paper_pct ?? 40);
          setDigitalPct(data.effective_digital_pct ?? data.global_defaults?.digital_pct ?? 25);
          setAudioPct(data.effective_audio_pct ?? data.global_defaults?.audio_pct ?? 25);
        } else {
          // Fallback depuis l'objet utilisateur
          const hasCustom = Boolean(
            user.custom_remise_papier_pct !== null ||
            user.custom_remise_numerique_pct !== null ||
            user.custom_remise_audio_pct !== null
          );
          setMode(hasCustom ? "custom" : "global");
          setPaperPct(user.custom_remise_papier_pct ?? user.extra_info?.effective_paper_discount ?? 40);
          setDigitalPct(user.custom_remise_numerique_pct ?? user.extra_info?.effective_digital_discount ?? 25);
          setAudioPct(user.custom_remise_audio_pct ?? user.extra_info?.effective_audio_discount ?? 25);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        toast.error("Impossible de récupérer les remises actuelles.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, user]);

  if (!user) return null;

  const globalPaper = discountsData?.global_defaults?.paper_pct ?? 40;
  const globalDigital = discountsData?.global_defaults?.digital_pct ?? 25;
  const globalAudio = discountsData?.global_defaults?.audio_pct ?? 25;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload =
        mode === "global"
          ? { use_global: true }
          : {
              use_global: false,
              paper_pct: Number(paperPct),
              digital_pct: Number(digitalPct),
              audio_pct: Number(audioPct),
            };

      const res = await updateAdminUserDiscounts(user.id, payload);
      if (res.success) {
        toast.success(
          mode === "global"
            ? `Remises de ${user.first_name} ${user.last_name} réalignées sur la politique globale.`
            : `Remises personnalisées enregistrées pour ${user.first_name} ${user.last_name}.`
        );
        if (onUpdated) onUpdated();
        onClose();
      } else {
        toast.error(res.error || "Erreur lors de la sauvegarde des remises.");
      }
    } catch {
      toast.error("Erreur de communication avec le serveur.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-navy font-bold">
          <Sliders className="w-5 h-5 text-gold" />
          <span>Remises Auteur &ndash; Configuration Individuelle</span>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-5 max-w-lg mx-auto bg-background text-foreground">
        {/* Identité Auteur */}
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-background-secondary border border-border">
          <UserAvatar
            src={user.avatar_url || user.avatar}
            name={`${user.first_name} ${user.last_name}`}
            size="md"
          />
          <div className="min-w-0">
            <h4 className="font-serif font-bold text-navy text-sm truncate">
              {user.first_name} {user.last_name}
            </h4>
            <p className="text-xs text-foreground-muted font-mono truncate">{user.email}</p>
            <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-navy/10 text-navy">
              Auteur Partenaire
            </span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-6 h-6 border-2 border-navy border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-foreground-muted">Chargement des paramètres tarifaires...</p>
          </div>
        ) : (
          <>
            {/* Sélecteur de politique */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-navy">
                Régime de réduction appliqué
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setMode("global")}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[70px] ${
                    mode === "global"
                      ? "border-navy bg-navy/5 ring-1 ring-navy"
                      : "border-border bg-background-secondary hover:border-navy/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-navy">Politique Générale</span>
                    {mode === "global" && <CheckCircle2 className="w-4 h-4 text-navy" />}
                  </div>
                  <p className="text-[11px] text-foreground-muted mt-1">
                    Standard : -{globalPaper}% Papier, -{globalDigital}% Num., -{globalAudio}% Audio
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setMode("custom")}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between min-h-[70px] ${
                    mode === "custom"
                      ? "border-gold bg-gold/10 ring-1 ring-gold"
                      : "border-border bg-background-secondary hover:border-gold/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-navy">Remise Sur-mesure</span>
                    {mode === "custom" && <Sparkles className="w-4 h-4 text-gold" />}
                  </div>
                  <p className="text-[11px] text-foreground-muted mt-1">
                    Taux personnalisés négociés pour cet auteur
                  </p>
                </button>
              </div>
            </div>

            {/* Champs d'édition si sur-mesure */}
            {mode === "custom" ? (
              <div className="p-4 rounded-2xl bg-gold/5 border border-gold/30 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <span className="text-xs font-bold text-navy">
                    Définition des Taux Sur-mesure pour cet Auteur
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-navy uppercase block">
                      Papier (%)
                    </label>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        min="0"
                        max="80"
                        value={paperPct}
                        onChange={(e) => setPaperPct(Number(e.target.value))}
                        className="w-full p-2 text-xs font-mono font-bold rounded-xl bg-background border border-border text-navy focus:border-gold focus:outline-none"
                        required
                      />
                      <span className="text-[10px] font-bold text-foreground-muted">%</span>
                    </div>
                    <span className="text-[9px] text-foreground-muted mt-0.5 block">
                      Défaut: -{globalPaper}%
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-navy uppercase block">
                      Numérique (%)
                    </label>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        min="0"
                        max="80"
                        value={digitalPct}
                        onChange={(e) => setDigitalPct(Number(e.target.value))}
                        className="w-full p-2 text-xs font-mono font-bold rounded-xl bg-background border border-border text-navy focus:border-gold focus:outline-none"
                        required
                      />
                      <span className="text-[10px] font-bold text-foreground-muted">%</span>
                    </div>
                    <span className="text-[9px] text-foreground-muted mt-0.5 block">
                      Défaut: -{globalDigital}%
                    </span>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-navy uppercase block">
                      Audio (%)
                    </label>
                    <div className="flex items-center gap-1 mt-1">
                      <input
                        type="number"
                        min="0"
                        max="80"
                        value={audioPct}
                        onChange={(e) => setAudioPct(Number(e.target.value))}
                        className="w-full p-2 text-xs font-mono font-bold rounded-xl bg-background border border-border text-navy focus:border-gold focus:outline-none"
                        required
                      />
                      <span className="text-[10px] font-bold text-foreground-muted">%</span>
                    </div>
                    <span className="text-[9px] text-foreground-muted mt-0.5 block">
                      Défaut: -{globalAudio}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-navy" />
                  <span className="text-xs font-bold text-navy">
                    Politique Standard de la Plateforme Active
                  </span>
                </div>
                <p className="text-xs text-foreground-muted">
                  Cet auteur bénéficie des remises globales configurées dans le menu Cascade Tarifaire :
                </p>
                <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-xs text-center">
                  <div className="p-2 rounded-xl bg-background border border-border">
                    <span className="text-[9px] text-foreground-muted block font-sans">Papier</span>
                    <span className="font-bold text-gold">-{globalPaper}%</span>
                  </div>
                  <div className="p-2 rounded-xl bg-background border border-border">
                    <span className="text-[9px] text-foreground-muted block font-sans">Numérique</span>
                    <span className="font-bold text-navy">-{globalDigital}%</span>
                  </div>
                  <div className="p-2 rounded-xl bg-background border border-border">
                    <span className="text-[9px] text-foreground-muted block font-sans">Audio</span>
                    <span className="font-bold text-navy">-{globalAudio}%</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:bg-background-secondary transition-colors cursor-pointer min-h-[42px]"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-dark transition-all flex items-center gap-2 shadow-xs cursor-pointer min-h-[42px] disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5 text-gold" />
                <span>{saving ? "Enregistrement..." : "Enregistrer les Remises"}</span>
              </button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}
