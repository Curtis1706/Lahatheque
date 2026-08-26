"use client";

import React, { useState } from "react";
import { Key, PlusCircle, ShieldCheck, Eye, EyeOff, Trash2, Copy, Check, Lock, AlertTriangle } from "lucide-react";
import type { ApiKey } from "@/lib/types/publisher";
import { InlineLoader } from "@/components/ui/page-loader";

interface ApiKeyManagerProps {
  keys: ApiKey[];
  onGenerate: (name: string) => Promise<{ apiKey: ApiKey; fullSecret: string }>;
  onRevoke: (keyId: string) => Promise<void>;
  className?: string;
}

export function ApiKeyManager({
  keys,
  onGenerate,
  onRevoke,
  className,
}: ApiKeyManagerProps) {
  const [newKeyName, setNewKeyName] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setGenerating(true);
    try {
      const res = await onGenerate(newKeyName.trim());
      setGeneratedSecret(res.fullSecret);
      setNewKeyName("");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`p-6 rounded-3xl bg-background border border-border shadow-xs space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gold/15 text-gold border border-gold/30">
            <Key className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-navy text-base">Gestionnaire de Clés API &amp; OAuth 2.0</h3>
            <p className="text-xs text-foreground-muted">Client Credentials pour synchronisation automatique ERP &amp; Logiciels Éditoriaux</p>
          </div>
        </div>
      </div>

      {/* Formulaire de génération */}
      <form onSubmit={handleCreate} className="p-4 rounded-2xl bg-background-secondary border border-border space-y-3">
        <label htmlFor="key-name" className="block text-xs font-bold text-navy uppercase tracking-wider">
          Générer une nouvelle clé d&apos;API
        </label>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            id="key-name"
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="ex. Intégration ERP Production ONIX 3.0"
            className="flex-1 w-full px-3.5 py-2.5 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
            required
          />
          <button
            type="submit"
            disabled={generating}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 min-h-[44px] shadow-xs shrink-0 disabled:opacity-50"
          >
            {generating ? (
              <InlineLoader size={16} />
            ) : (
              <>
                <PlusCircle className="w-4 h-4 text-gold" />
                Générer la Clé
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modale d'affichage unique du secret 21st.dev Auth Two-Factor Setup id: 19155 */}
      {generatedSecret && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
          <div className="flex items-center gap-2 text-amber-600 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Conservez ce Secret API en lieu sûr ! Il ne sera plus réaffiché.</span>
          </div>

          <div className="flex items-center gap-2 bg-background p-3 rounded-xl border border-border">
            <code className="font-mono text-xs text-navy font-bold flex-1 truncate select-all">{generatedSecret}</code>
            <button
              type="button"
              onClick={() => handleCopy(generatedSecret)}
              className="p-2 rounded-lg bg-navy text-white hover:bg-navy-hover transition-colors text-xs font-bold flex items-center gap-1 shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4 text-gold" />}
              {copied ? "Copié !" : "Copier"}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setGeneratedSecret(null)}
            className="text-[11px] font-bold text-navy hover:underline"
          >
            J&apos;ai sauvegardé le secret, fermer cet avertissement.
          </button>
        </div>
      )}

      {/* Liste des Clés API */}
      <div className="space-y-3">
        <h4 className="font-serif font-bold text-xs text-navy uppercase tracking-wider">
          Clés d&apos;Accès Actives &amp; Révocables ({keys.length})
        </h4>

        <div className="space-y-3">
          {keys.map((k) => (
            <div key={k.id} className="p-4 rounded-2xl bg-background-secondary border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-navy">{k.name}</span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      k.status === "active"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
                        : "bg-rose-500/10 text-rose-600 border-rose-500/30"
                    }`}
                  >
                    {k.status === "active" ? "Clé Active" : "Révolquée"}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-foreground-muted">Client ID : {k.client_id}</p>
                <p className="text-[11px] font-mono text-foreground-muted">Secret : {k.client_secret_masked}</p>
              </div>

              {k.status === "active" && (
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm("Révoler cette clé d'API ? L'action est immédiate.")) {
                      await onRevoke(k.id);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-background border border-rose-500/30 hover:bg-rose-500/10 text-rose-600 text-xs font-bold transition-colors inline-flex items-center gap-1.5 min-h-[38px] shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Révoquer Immédiatement
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
