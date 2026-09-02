"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Key, ArrowLeft, ShieldCheck, FileCode, CheckCircle2, RefreshCw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { ApiKeyManager } from "@/components/features/publisher/api-key-manager";
import { getApiKeys, createApiKey, revokeApiKey } from "@/lib/services/publisher";
import type { ApiKey } from "@/lib/types/publisher";
import { InlineLoader } from "@/components/ui/page-loader";

export default function PublisherApiPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokeTargetId, setRevokeTargetId] = useState<string | null>(null);
  const [revoking, setRevoking] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getApiKeys();
        setKeys(data);
      } catch {
        toast.error("Impossible de récupérer la liste des clés API.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleGenerateKey = async (name: string) => {
    try {
      const newKey = await createApiKey(name, ["catalog:read", "catalog:write"]);
      setKeys((prev) => [newKey, ...prev]);
      toast.success("Nouvelle clé API générée avec succès.");
      return { apiKey: newKey, fullSecret: newKey.client_secret || "laha_sec_generated" };
    } catch {
      toast.error("Erreur lors de la génération de la clé API.");
      throw new Error("Erreur de génération");
    }
  };

  const handleConfirmRevoke = async () => {
    if (!revokeTargetId) return;
    setRevoking(true);
    try {
      const success = await revokeApiKey(revokeTargetId);
      if (success) {
        setKeys((prev) =>
          prev.map((k) => (k.id === revokeTargetId ? { ...k, status: "revoked" } : k))
        );
        toast.success("La clé API a été révoquée immédiatement.");
      }
    } catch {
      toast.error("Échec de la révocation de la clé.");
    } finally {
      setRevoking(false);
      setRevokeTargetId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 sm:space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/publisher"
            className="inline-flex items-center gap-1.5 text-xs text-navy font-bold hover:text-gold transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <Key className="w-4 h-4 text-gold" />
            API Partenaires &amp; Synchronisation (Section 5.4 &amp; 9)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Clés API &amp; Intégration Système (OAuth 2.0)
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1">
            Connectez votre ERP ou logiciel éditorial directement via nos endpoints HTTPS sécurisés et le standard ONIX 3.0.
          </p>
        </div>
      </div>

      {/* Rappel des normes techniques Section 5.4 & 9.2 */}
      <div className="p-6 rounded-3xl bg-background border border-border space-y-3 shadow-xs text-xs">
        <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-gold" />
          Standards &amp; Spécifications de l&apos;API Partenaire
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-foreground-muted">
          <div className="p-3 rounded-2xl bg-background-secondary border border-border">
            <span className="font-bold text-navy block text-xs">Protocoles Utilisés</span>
            <p className="mt-1">OAuth 2.0 (Client Credentials), HTTPS strict, JSON REST &amp; ONIX 3.0 (XML EDItEUR).</p>
          </div>

          <div className="p-3 rounded-2xl bg-background-secondary border border-border">
            <span className="font-bold text-navy block text-xs">Opérations Automatisées</span>
            <p className="mt-1">Création/mise à jour en masse des notices, téléversement multipart, mise à jour des prix/territoires.</p>
          </div>

          <div className="p-3 rounded-2xl bg-background-secondary border border-border">
            <span className="font-bold text-navy block text-xs">Sécurité &amp; Révocation</span>
            <p className="mt-1">Le Secret API n&apos;est affiché qu&apos;une seule fois à la création. Révocation instantanée disponible.</p>
          </div>
        </div>
      </div>

      {/* Gestionnaire de clés API */}
      <ApiKeyManager
        keys={keys}
        onGenerate={handleGenerateKey}
        onRevoke={async (keyId) => setRevokeTargetId(keyId)}
      />

      {/* Modale de Confirmation de Révocation */}
      {revokeTargetId && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="p-6 rounded-3xl bg-background border border-border max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="font-serif font-bold text-base text-navy">Révoquer cette clé API ?</h3>
            </div>

            <p className="text-xs text-foreground-muted leading-relaxed">
              Cette action est irréversible. Tous les appels automatisés provenant de votre progiciel ERP utilisant ce connecteur seront immédiatement rejetés.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setRevokeTargetId(null)}
                className="px-4 py-2 rounded-xl bg-background-secondary border border-border text-xs font-bold text-navy hover:bg-background transition-colors min-h-[40px]"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmRevoke}
                disabled={revoking}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors flex items-center gap-2 min-h-[40px] shadow-xs disabled:opacity-50"
              >
                {revoking ? (
                  <>
                    <InlineLoader size={16} />
                    <span>Révocation...</span>
                  </>
                ) : (
                  <span>Confirmer la Révocation</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
