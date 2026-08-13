"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Download, FileText, ExternalLink, Clock, Tag, Percent, CheckCircle2 } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { ContractPdfViewer } from "@/components/features/legal/contract-pdf-viewer";
import { getContractDetail } from "@/lib/services/legal";
import type { LegalContract } from "@/lib/types/legal";

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [contract, setContract] = useState<LegalContract | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await getContractDetail(resolvedParams.id);
      setContract(data);
      setLoading(false);
    }
    loadData();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="p-8 space-y-4 w-full animate-pulse">
        <div className="h-8 bg-background-secondary rounded w-1/3" />
        <div className="h-96 bg-background-secondary rounded-3xl" />
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto">
        <h2 className="font-serif font-bold text-navy text-lg">Contrat introuvable</h2>
        <p className="text-xs text-foreground-muted">Le contrat recherché n&apos;existe pas ou a été archivé.</p>
        <Link href="/legal-reviewer/contracts" className="text-xs font-bold text-gold hover:underline block">
          Retour à la liste des contrats
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 sm:space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/legal-reviewer" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/legal-reviewer/contracts" className="hover:text-navy">Contrats Légaux</Link>
        <span>/</span>
        <span className="text-navy font-semibold">{contract.reference}</span>
      </div>

      {/* Header Banner */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/legal-reviewer/contracts"
            className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour à la liste des contrats
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-bold text-xs text-gold px-2.5 py-0.5 rounded bg-gold/10 border border-gold/20">
              {contract.reference}
            </span>
            <StatusBadge status={contract.status} />
            <span className="text-[10px] text-foreground-muted font-mono uppercase bg-background-secondary px-2 py-0.5 rounded border border-border">
              {contract.party_type === "author" ? "Auteur" : contract.party_type === "university" ? "Université" : "Éditeur Tiers"}
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy mt-2 leading-snug">
            {contract.title}
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1">
            Partie contractante : <span className="font-bold text-navy">{contract.contracting_party}</span>
          </p>
        </div>

        {/* Liens rapides & Actions de téléchargement */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <a
            href={contract.file_url}
            download={contract.file_name}
            className="px-4 py-2.5 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-hover transition-colors inline-flex items-center gap-2 shadow-xs min-h-[44px]"
          >
            <Download className="w-4 h-4" />
            Télécharger le PDF
          </a>

          <Link
            href="/legal-reviewer/royalties"
            className="px-4 py-2.5 rounded-xl bg-navy text-gold font-bold text-xs hover:bg-navy-dark transition-colors inline-flex items-center gap-2 border border-gold/30 shadow-xs min-h-[44px]"
          >
            <Percent className="w-4 h-4" />
            Fiche Droits &amp; Taux
          </Link>
        </div>
      </div>

      {/* Disposition Full Width en 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Colonne Gauche: Visionneuse PDF 21st.dev interactive */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="font-serif font-bold text-sm text-navy uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-gold" /> Preview &amp; Lecture du Document PDF Stocké
          </h3>

          <ContractPdfViewer
            fileUrl={contract.file_url}
            fileName={contract.file_name}
            fileSize={contract.file_size}
            title={contract.title}
            reference={contract.reference}
          />
        </div>

        {/* Colonne Droite: Fiche Métadonnées & Registre Avenants */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Fiche Métadonnées */}
          <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4 shadow-xs">
            <h3 className="font-serif font-bold text-xs text-navy uppercase tracking-wider flex items-center gap-2 border-b border-border pb-3">
              <ShieldCheck className="w-4 h-4 text-gold" />
              Métadonnées Légales &amp; Indexation
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-foreground-muted block text-[10px] uppercase font-bold">Type de contrat</span>
                <span className="font-semibold text-navy">
                  {contract.type === "author_contract"
                    ? "Contrat d'Édition Auteur"
                    : contract.type === "university_agreement"
                    ? "Convention Cadre Université (Taux 15%)"
                    : "Partenariat Éditeur Tiers"}
                </span>
              </div>

              <div>
                <span className="text-foreground-muted block text-[10px] uppercase font-bold">Date de signature</span>
                <span className="font-mono font-bold text-navy">
                  {new Date(contract.signed_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                </span>
              </div>

              {contract.expires_at && (
                <div>
                  <span className="text-foreground-muted block text-[10px] uppercase font-bold">Date d&apos;expiration</span>
                  <span className="font-mono font-bold text-navy">
                    {new Date(contract.expires_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
                  </span>
                </div>
              )}

              <div>
                <span className="text-foreground-muted block text-[10px] uppercase font-bold">Conservation légale</span>
                <span className="text-success font-bold flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" /> Stockage numérique certifié permanent
                </span>
              </div>

              {contract.tags && contract.tags.length > 0 && (
                <div>
                  <span className="text-foreground-muted block text-[10px] uppercase font-bold mb-1">Indexation &amp; Mots-clés</span>
                  <div className="flex flex-wrap gap-1">
                    {contract.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 rounded-md bg-navy/10 text-navy text-[10px] font-mono font-semibold">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {contract.notes && (
                <div className="p-3 rounded-xl bg-background border border-border text-[11px] text-foreground-muted space-y-1">
                  <span className="font-bold text-navy block">Notes du Juriste :</span>
                  <p>{contract.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Historique des Avenants */}
          <div className="p-6 rounded-3xl bg-background-secondary border border-border space-y-4 shadow-xs">
            <h3 className="font-serif font-bold text-xs text-navy uppercase tracking-wider flex items-center gap-2 border-b border-border pb-3">
              <Clock className="w-4 h-4 text-gold" />
              Avenants Registre Liés
            </h3>

            {contract.amendments && contract.amendments.length > 0 ? (
              <div className="space-y-2.5">
                {contract.amendments.map((am) => (
                  <div key={am.id} className="p-3.5 rounded-2xl bg-background border border-border flex items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="font-bold text-navy text-[11px]">{am.title}</p>
                      <p className="text-[10px] text-foreground-muted font-mono">{am.date}</p>
                    </div>
                    <a href={am.file_url} download className="p-2 rounded-lg hover:bg-background-secondary text-navy transition-colors">
                      <Download className="w-4 h-4 text-gold" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-foreground-muted italic">Aucun avenant enregistré pour ce contrat.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
