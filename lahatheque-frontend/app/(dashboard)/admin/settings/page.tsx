"use client";

import React, { useState } from "react";
import { Settings, Save, ShieldCheck, Mail, Lock, Globe } from "lucide-react";
import { toast } from "sonner";

export default function AdminSettingsPage() {
  const [siteName, setSiteName] = useState("LAHAThèque — Bibliothèque Numérique Africaine");
  const [supportEmail, setSupportEmail] = useState("contact@lahatheque.com");
  const [allowPublicRegistrations, setAllowPublicRegistrations] = useState(true);
  const [forceWatermark, setForceWatermark] = useState(true);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Paramètres globaux enregistrés avec succès !");
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-border">
        <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
          Paramètres Globaux de la Plateforme
        </h1>
        <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
          Configuration générale du système, des politiques de sécurité DRM et des communications.
        </p>
      </div>

      <form onSubmit={handleSaveSettings} className="p-6 rounded-2xl bg-background-secondary border border-border space-y-6">
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Globe className="w-4 h-4 text-gold" />
            Identité Visuelle & Informations Générales
          </h2>

          <div>
            <label className="text-xs font-medium text-foreground">Nom Officiel du Service</label>
            <input
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              className="w-full mt-1 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground">Adresse E-mail de Contact / Support</label>
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              className="w-full mt-1 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-navy" />
            Sécurité, Inscription & Filigrane LCP
          </h2>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border">
            <div>
              <p className="text-xs font-semibold text-foreground">Autoriser l'Inscription Publique (Étudiants & Lecteurs)</p>
              <p className="text-[11px] text-foreground-muted">Permet la création autonome de compte sans invitation préalable.</p>
            </div>
            <input
              type="checkbox"
              checked={allowPublicRegistrations}
              onChange={(e) => setAllowPublicRegistrations(e.target.checked)}
              className="w-4 h-4 accent-navy"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border">
            <div>
              <p className="text-xs font-semibold text-foreground">Activer le Filigrane Dynamique par Défaut</p>
              <p className="text-[11px] text-foreground-muted">Inscrit l'adresse e-mail du lecteur sur chaque page des ouvrages consultés.</p>
            </div>
            <input
              type="checkbox"
              checked={forceWatermark}
              onChange={(e) => setForceWatermark(e.target.checked)}
              className="w-4 h-4 accent-navy"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4 text-gold" />
            Enregistrer les Modifications
          </button>
        </div>
      </form>
    </div>
  );
}
