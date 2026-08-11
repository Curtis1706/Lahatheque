"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, Save, FileText } from "lucide-react";
import { toast } from "sonner";

export default function AdminProtectionSettingsPage() {
  const [lcpEnabled, setLcpEnabled] = useState(true);
  const [watermarkTemplate, setWatermarkTemplate] = useState("Licence accordée à {email} — LAHAThèque {date}");

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Paramètres DRM et filigranes enregistrés avec succès !");
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href="/admin/catalog"
          className="inline-flex items-center gap-1 text-xs font-medium text-gold hover:text-gold-dark mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Retour au catalogue
        </Link>
        <div className="pb-4 border-b border-border">
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
            Protection Numérique & DRM Globaux
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Paramètres globaux du serveur Readium LCP et des règles de marquage dynamique de la liseuse.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="p-6 rounded-2xl bg-background-secondary border border-border space-y-6">
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-navy" />
            Serveur DRM Readium LCP (Publication & Prêt Numérique)
          </h2>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border">
            <div>
              <p className="text-xs font-semibold text-foreground">Activer le chiffrement Readium LCP par Défaut</p>
              <p className="text-[11px] text-foreground-muted">Applique le chiffrement AES-256 LCP sur tous les fichiers EPUB et PDF déposés.</p>
            </div>
            <input
              type="checkbox"
              checked={lcpEnabled}
              onChange={(e) => setLcpEnabled(e.target.checked)}
              className="w-4 h-4 accent-navy"
            />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-border">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-gold" />
            Filigrane Dynamique (Watermark visuel)
          </h2>

          <div>
            <label className="text-xs font-medium text-foreground">Modèle de texte du filigrane</label>
            <input
              type="text"
              value={watermarkTemplate}
              onChange={(e) => setWatermarkTemplate(e.target.value)}
              className="w-full mt-1 p-2.5 text-xs rounded-xl bg-background border border-border font-mono text-foreground focus:border-gold focus:outline-none"
            />
            <p className="text-[10px] text-foreground-muted mt-1">Variables disponibles: &#123;email&#125;, &#123;date&#125;, &#123;ip&#125;</p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4 text-gold" />
            Enregistrer les Règles DRM
          </button>
        </div>
      </form>
    </div>
  );
}
