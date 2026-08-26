"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ShieldCheck,
  FileText,
  ExternalLink,
  Clock,
  Tag,
  Percent,
  CheckCircle2,
  BookOpen,
  Users,
  Scale,
  DollarSign,
  Building2,
  Smartphone,
  Headphones,
} from "lucide-react";
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

  const getContractTypeLabel = (type?: string, partyType?: string) => {
    const t = (type || partyType || "").toLowerCase();
    if (t === "author_contract" || t === "edition_auteur" || t === "author") {
      return "Contrat d'Édition Auteur";
    }
    if (t === "university_agreement" || t === "partenariat_universite" || t === "convention_universite" || t === "university") {
      return "Convention Cadre Université (Taux 15%)";
    }
    if (t === "pre_edition") {
      return "Accord de Pré-Édition";
    }
    if (t === "avenant") {
      return "Avenant Contractuel";
    }
    return "Partenariat Éditeur Tiers";
  };

  const getPartyTypeLabel = (partyType?: string, type?: string) => {
    const p = (partyType || type || "").toLowerCase();
    if (p === "author" || p === "edition_auteur" || p === "author_contract") {
      return "Auteur Individuel";
    }
    if (p === "university" || p === "partenariat_universite" || p === "university_agreement") {
      return "Université / Institution";
    }
    return "Éditeur Tiers / Partenaire";
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/legal-reviewer" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/legal-reviewer/contracts" className="hover:text-navy">Contrats Légaux</Link>
        <span>/</span>
        <span className="text-navy font-semibold">{contract.reference}</span>
      </div>

      {/* En-tête Contrat */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-border pb-6">
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
              {getPartyTypeLabel(contract.party_type, contract.type)}
            </span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy mt-2 leading-snug">
            {contract.title}
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1">
            Partie contractante : <span className="font-bold text-navy">{contract.contracting_party}</span>
          </p>
        </div>

        {/* Liens rapides & Actions de lecture */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href={`/catalog/reader/lesson_pdf?contract_id=${contract.id}&file=${encodeURIComponent(contract.file_url || "")}&title=${encodeURIComponent(contract.title)}`}
            target="_blank"
            className="px-4 py-2.5 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-all inline-flex items-center gap-2 shadow-xs min-h-[44px] cursor-pointer"
            title="Ouvrir dans la liseuse officielle LAHAThèque (Modes FlipBook 3D et Défilement continu)"
          >
            <BookOpen className="w-4 h-4" />
            Ouvrir dans la Liseuse
          </Link>

          <Link
            href="/legal-reviewer/royalties"
            className="px-4 py-2.5 rounded-xl bg-navy text-gold font-bold text-xs hover:bg-navy-dark transition-colors inline-flex items-center gap-2 border border-gold/30 shadow-xs min-h-[44px] cursor-pointer"
            title="Consulter les clés de redevances"
          >
            <Percent className="w-4 h-4" />
            Fiche Droits &amp; Taux
          </Link>
        </div>
      </div>

      {/* Bloc Ouvrage Lié & Répartition des Droits */}
      {contract.ouvrage && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-6 rounded-3xl bg-background border border-border shadow-xs">
          {/* Carte Ouvrage */}
          <div className="md:col-span-4 flex gap-4 items-center">
            {contract.ouvrage.cover_url ? (
              <div className="relative w-20 h-28 rounded-xl overflow-hidden shadow-md shrink-0 border border-border">
                <Image
                  src={contract.ouvrage.cover_url}
                  alt={contract.ouvrage.title}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-20 h-28 rounded-xl bg-navy text-white flex flex-col items-center justify-center p-2 text-center shrink-0">
                <BookOpen className="w-6 h-6 text-gold mb-1" />
                <span className="text-[9px] font-bold uppercase">LAHA</span>
              </div>
            )}

            <div className="space-y-1 text-xs">
              <span className="text-2xs font-bold text-gold uppercase tracking-wider block">
                Ouvrage Lié en Base
              </span>
              <h3 className="font-bold text-navy text-sm line-clamp-2">
                {contract.ouvrage.title}
              </h3>
              {contract.ouvrage.isbn && (
                <p className="font-mono text-2xs text-foreground-muted">
                  ISBN: {contract.ouvrage.isbn}
                </p>
              )}
              <div className="pt-1 flex items-center gap-2">
                <span className="text-2xs font-bold text-navy bg-background-secondary px-2 py-0.5 rounded border border-border">
                  {contract.ouvrage.total_sales_count} ventes
                </span>
                <span className="text-2xs font-bold text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {contract.ouvrage.total_sales_revenue.toLocaleString("fr-FR")} XOF
                </span>
              </div>
            </div>
          </div>

          {/* Grille des quotes-parts d'ayants droit */}
          <div className="md:col-span-8 border-t md:border-t-0 md:border-l border-border md:pl-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-gold" />
                Clé de Répartition Actuelle (Verrouillée sous ce contrat)
              </span>
              <span className="text-2xs font-bold text-emerald-700 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                100.00% Validé
              </span>
            </div>

            {contract.repartitions && contract.repartitions.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {contract.repartitions.map((rep) => (
                  <div
                    key={rep.id}
                    className="p-3 rounded-2xl bg-background-secondary border border-border text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy">{rep.name || "Auteur"}</span>
                      <span className="font-mono font-bold text-gold">{rep.pourcentage}%</span>
                    </div>
                    <span className="text-2xs text-foreground-muted block">{rep.role_libelle}</span>
                    <div className="flex items-center justify-between text-2xs text-foreground-muted pt-1 border-t border-border/50">
                      <span>Papier: {rep.taux_papier || 10}%</span>
                      <span>Numérique: {rep.taux_numerique || 15}%</span>
                      <span>Audio TTS: {rep.taux_audio_tts || 8}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-foreground-muted italic">
                Clé standard 100% attribuée à l&apos;Auteur Principal ({contract.contracting_party}).
              </p>
            )}
          </div>
        </div>
      )}

      {/* Disposition en 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Colonne Gauche: Visionneuse PDF / DOCX */}
        <div className="lg:col-span-8 space-y-4">
          <h3 className="font-serif font-bold text-sm text-navy uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4 text-gold" /> Liseuse &amp; Aperçu Documentaire
          </h3>

          <ContractPdfViewer
            contractId={contract.id}
            streamUrl={(contract as any).stream_url}
            fileUrl={contract.file_url}
            fileName={contract.file_name}
            fileSize={contract.file_size}
            title={contract.title}
            reference={contract.reference}
            extractedText={(contract as any).extracted_text || (contract as any).extracted_text_preview || contract.notes}
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
                  {getContractTypeLabel(contract.type, contract.party_type)}
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

            {contract.avenants && contract.avenants.length > 0 ? (
              <div className="space-y-2.5">
                {contract.avenants.map((am) => (
                  <div key={am.id} className="p-3.5 rounded-2xl bg-background border border-border flex items-center justify-between gap-2 text-xs">
                    <div>
                      <p className="font-bold text-navy text-[11px]">{am.title}</p>
                      <p className="text-[10px] text-foreground-muted font-mono">{am.signed_at}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-navy/10 text-navy font-bold text-[10px]">
                      {am.reference}
                    </span>
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

