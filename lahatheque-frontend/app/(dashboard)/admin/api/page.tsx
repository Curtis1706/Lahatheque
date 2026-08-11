"use client";

import React, { useState } from "react";
import { Key, Plus, Copy, Shield, Check, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function AdminApiKeysPage() {
  const [keys, setKeys] = useState([
    {
      id: "key-101",
      name: "API BU Université d'Abomey-Calavi",
      partner: "UAC Abomey",
      apiKey: "laha_live_99a8b7c6d5e4f3a2b1",
      created_at: "2023-10-15",
      is_active: true,
      last_used: "2024-03-21 14:10",
    },
    {
      id: "key-102",
      name: "API L'Harmattan Éditions",
      partner: "L'Harmattan Bénin",
      apiKey: "laha_live_1234567890abcdef12",
      created_at: "2023-12-01",
      is_active: true,
      last_used: "2024-03-20 09:30",
    },
  ]);

  const handleCreateKey = () => {
    const newKey = {
      id: `key-${Date.now()}`,
      name: "Nouvelle Clé API Partenaire",
      partner: "Partenaire Externe",
      apiKey: `laha_live_${Math.random().toString(36).substring(2, 18)}`,
      created_at: new Date().toISOString().split("T")[0],
      is_active: true,
      last_used: "Jamais",
    };
    setKeys([newKey, ...keys]);
    toast.success("Nouvelle clé API générée avec succès !");
  };

  const copyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("Clé API copiée !");
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
            Gestion des Clés API & Partenaires
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Accès REST pour les bibliothèques universitaires partenaires, moissonnage OAI-PMH et webhooks.
          </p>
        </div>

        <button
          onClick={handleCreateKey}
          className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-2 shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4 text-gold" />
          Générer une Clé API
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        {keys.map((k) => (
          <div key={k.id} className="p-5 rounded-2xl bg-background-secondary border border-border space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Key className="w-4 h-4 text-gold" />
                  {k.name}
                </h3>
                <p className="text-xs text-foreground-muted">Partenaire : {k.partner}</p>
              </div>

              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-success/15 text-success font-semibold shrink-0">
                Clé Active
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-background border border-border">
              <span className="font-mono text-xs font-bold text-navy tracking-wider select-all">
                {k.apiKey}
              </span>
              <button
                onClick={() => copyKey(k.apiKey)}
                className="p-1.5 rounded-lg hover:bg-background-secondary text-foreground-muted hover:text-foreground transition-colors"
                title="Copier la clé"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between text-[11px] text-foreground-muted pt-1 border-t border-border">
              <span>Créée le : <strong className="text-foreground font-mono">{k.created_at}</strong></span>
              <span>Dernière activité : <strong className="text-foreground font-mono">{k.last_used}</strong></span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
