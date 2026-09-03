"use client";

import React, { useState } from "react";
import { ShieldCheck, Lock, Eye, FileText, Smartphone, Printer, Copy, CheckCircle2, Save } from "lucide-react";
import { toast } from "sonner";
import type { ProtectionConfig } from "@/lib/types/publisher";
import { InlineLoader } from "@/components/ui/page-loader";

interface ProtectionConfigCardProps {
  initialConfig: ProtectionConfig;
  onSave?: (config: ProtectionConfig) => Promise<void>;
  readOnly?: boolean;
  className?: string;
}

export function ProtectionConfigCard({
  initialConfig,
  onSave,
  readOnly = false,
  className,
}: ProtectionConfigCardProps) {
  const [config, setConfig] = useState<ProtectionConfig>(initialConfig);
  const [saving, setSaving] = useState(false);

  const toggle = (key: keyof ProtectionConfig) => {
    if (readOnly) return;
    setConfig((prev) => ({
      ...prev,
      [key]: typeof prev[key] === "boolean" ? !prev[key] : prev[key],
    }));
  };

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(config);
      toast.success("Paramètres de protection anti-piratage enregistrés avec succès.");
    } catch {
      toast.error("Erreur lors de l'enregistrement de la configuration DRM.");
    } finally {
      setSaving(false);
    }
  };



  return (
    <div className={`p-6 rounded-3xl bg-background border border-border shadow-xs space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gold/15 text-gold border border-gold/30">
            <ShieldCheck className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-navy text-base">Protection Anti-Piratage &amp; Droits Numériques</h3>
            <p className="text-xs text-foreground-muted">Configuration des règles DRM/LCP et filigranes applicables à cet ouvrage</p>
          </div>
        </div>

        {!readOnly && onSave && (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center gap-2 shadow-xs min-h-[40px] disabled:opacity-50"
          >
            {saving ? (
              <InlineLoader size={16} />
            ) : (
              <>
                <Save className="w-4 h-4 text-gold" />
                Enregistrer la Protection
              </>
            )}
          </button>
        )}
      </div>

      {/* Switches 21st.dev Privacy Settings Switches id: 22210 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Filigrane Visible */}
        <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-gold" />
              <span className="font-bold text-xs text-navy">Filigrane Visuel Personnalisé</span>
            </div>
            <button
              type="button"
              onClick={() => toggle("watermark_enabled")}
              disabled={readOnly}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                config.watermark_enabled ? "bg-gold" : "bg-border"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  config.watermark_enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <p className="text-[11px] text-foreground-muted">
            Incruste un filigrane dynamique comportant le nom de l&apos;utilisateur et le code de traçabilité.
          </p>

          {config.watermark_enabled && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
              <div>
                <label htmlFor="watermark-pos" className="text-[10px] uppercase font-bold text-navy block mb-1">Position</label>
                <select
                  id="watermark-pos"
                  value={config.watermark_position}
                  onChange={(e) => setConfig((prev) => ({ ...prev, watermark_position: e.target.value as any }))}
                  disabled={readOnly}
                  className="w-full text-xs p-1.5 rounded-lg border border-border bg-background text-navy"
                >
                  <option value="bottom-right">Bas Droite</option>
                  <option value="center">Centre Diagonal</option>
                  <option value="top-right">Haut Droite</option>
                </select>
              </div>
              <div>
                <label htmlFor="watermark-opac" className="text-[10px] uppercase font-bold text-navy block mb-1">Opacité ({config.watermark_opacity}%)</label>
                <input
                  id="watermark-opac"
                  type="range"
                  min="10"
                  max="60"
                  value={config.watermark_opacity}
                  onChange={(e) => setConfig((prev) => ({ ...prev, watermark_opacity: parseInt(e.target.value) }))}
                  disabled={readOnly}
                  className="w-full accent-gold"
                />
              </div>
            </div>
          )}
        </div>

        {/* 2. Protection LCP / DRM Readium */}
        <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-gold" />
              <span className="font-bold text-xs text-navy">Protection DRM LCP Readium</span>
            </div>
            <button
              type="button"
              onClick={() => toggle("lcp_drm_enabled")}
              disabled={readOnly}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                config.lcp_drm_enabled ? "bg-navy" : "bg-border"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  config.lcp_drm_enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <p className="text-[11px] text-foreground-muted">
            Limite l&apos;ouverture du fichier aux applications certifiées Readium et encadre les appareils autorisés.
          </p>

          {config.lcp_drm_enabled && (
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60 text-xs">
              <div>
                <label htmlFor="max-devices" className="text-[10px] uppercase font-bold text-navy block mb-1">Appareils autorisés</label>
                <input
                  id="max-devices"
                  type="number"
                  min="1"
                  max="10"
                  value={config.max_allowed_devices}
                  onChange={(e) => setConfig((prev) => ({ ...prev, max_allowed_devices: parseInt(e.target.value) || 1 }))}
                  disabled={readOnly}
                  className="w-full text-xs p-1.5 rounded-lg border border-border bg-background font-mono font-bold text-navy"
                />
              </div>
              <div>
                <label htmlFor="max-loan" className="text-[10px] uppercase font-bold text-navy block mb-1">Durée prêt (jours)</label>
                <input
                  id="max-loan"
                  type="number"
                  min="1"
                  max="90"
                  value={config.max_loan_days}
                  onChange={(e) => setConfig((prev) => ({ ...prev, max_loan_days: parseInt(e.target.value) || 1 }))}
                  disabled={readOnly}
                  className="w-full text-xs p-1.5 rounded-lg border border-border bg-background font-mono font-bold text-navy"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. Blocage Copier / Coller */}
        <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Copy className="w-4 h-4 text-gold" />
              <span className="font-bold text-xs text-navy">Interdire le Copier-Coller</span>
            </div>
            <button
              type="button"
              onClick={() => toggle("disable_copy_paste")}
              disabled={readOnly}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                config.disable_copy_paste ? "bg-navy" : "bg-border"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  config.disable_copy_paste ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          <p className="text-[11px] text-foreground-muted">
            Empêche la sélection et la copie de texte dans le lecteur web sécurisé.
          </p>
        </div>

        {/* 4. Interdiction Impression */}
        <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Printer className="w-4 h-4 text-gold" />
              <span className="font-bold text-xs text-navy">Bloquer l&apos;Impression PDF</span>
            </div>
            <button
              type="button"
              onClick={() => toggle("disable_print")}
              disabled={readOnly}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                config.disable_print ? "bg-navy" : "bg-border"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  config.disable_print ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
          <p className="text-[11px] text-foreground-muted">
            Désactive le module d&apos;impression directe ou d&apos;export papier du document.
          </p>
        </div>
      </div>

      {/* Protections Automatiques (Section 6 Cahier des charges) */}
      <div className="p-4 rounded-2xl bg-navy/5 border border-navy/20 space-y-2 text-xs">
        <p className="font-bold text-navy flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-success" />
          Protections Système Automatiques &amp; Non Désactivables :
        </p>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-foreground-muted list-disc list-inside">
          <li>Tatouage invisible par utilisateur (IP + ID + Appareil)</li>
          <li>Chiffrement automatique des fichiers audio en DRM LCP</li>
          <li>Journalisation intégrale des accès dans les logs de traçabilité</li>
          <li>Code de traçabilité unique gravé dans l&apos;en-tête du fichier</li>
        </ul>
      </div>
    </div>
  );
}
