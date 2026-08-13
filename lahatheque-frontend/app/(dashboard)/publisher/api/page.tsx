"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Key, ArrowLeft, ShieldCheck, FileCode, CheckCircle2, RefreshCw } from "lucide-react";
import { ApiKeyManager } from "@/components/features/publisher/api-key-manager";
import { getApiKeys, generateApiKey, revokeApiKey } from "@/lib/services/publisher";
import type { ApiKey } from "@/lib/types/publisher";

export default function PublisherApiPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getApiKeys();
      setKeys(data);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleGenerateKey = async (name: string) => {
    const res = await generateApiKey(name);
    setKeys((prev) => [res.apiKey, ...prev]);
    return res;
  };

  const handleRevokeKey = async (keyId: string) => {
    const success = await revokeApiKey(keyId);
    if (success) {
      setKeys((prev) =>
        prev.map((k) => (k.id === keyId ? { ...k, status: "revoked" } : k))
      );
      alert("La clé d'API a été révoquée immédiatement. Les appels associés seront rejetés.");
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/publisher" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Clés API &amp; Intégration</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/publisher" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <Key className="w-4 h-4 text-gold" />
            API Partenaires &amp; Synchronisation (Section 9)
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Clés API &amp; Intégration Système (OAuth 2.0)
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
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
            <p className="mt-1">OAuth 2.0 (Client Credentials), HTTPS strict, JSON REST &amp; ONIX 3.0 (XML).</p>
          </div>

          <div className="p-3 rounded-2xl bg-background-secondary border border-border">
            <span className="font-bold text-navy block text-xs">Opérations Automatisées</span>
            <p className="mt-1">Création/mise à jour en masse des notices, téléversement multipart, mise à jour des prix/territoires.</p>
          </div>

          <div className="p-3 rounded-2xl bg-background-secondary border border-border">
            <span className="font-bold text-navy block text-xs">Sécurité &amp; Révocation</span>
            <p className="mt-1">Le Secret API n&apos;est affiché qu&apos;une seule fois à la création. Révocation immédiate disponible.</p>
          </div>
        </div>
      </div>

      {/* Gestionnaire de clés API 21st.dev Auth Two-Factor Setup id: 19155 */}
      <ApiKeyManager
        keys={keys}
        onGenerate={handleGenerateKey}
        onRevoke={handleRevokeKey}
      />
    </div>
  );
}
