"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, FileText, Upload, Save } from "lucide-react";
import { FileDropzone } from "@/components/features/layout-artist/file-dropzone";
import { createLegalContract } from "@/lib/services/legal";
import type { ContractType } from "@/lib/types/legal";
import { toast } from "sonner";

export default function NewLegalContractPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [contractingParty, setContractingParty] = useState("");
  const [partyType, setPartyType] = useState<"author" | "university" | "publisher">("author");
  const [type, setType] = useState<ContractType>("author_contract");
  const [signedAt, setSignedAt] = useState(new Date().toISOString().slice(0, 10));
  const [expiresAt, setExpiresAt] = useState("");
  const [tags, setTags] = useState("contrat, droit");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !contractingParty) return;

    setSubmitting(true);
    try {
      await createLegalContract(
        {
          title,
          contracting_party: contractingParty,
          party_type: partyType,
          type,
          signed_at: signedAt,
          expires_at: expiresAt || undefined,
          file_name: file ? file.name : "Contrat_Official.pdf",
          file_size: file ? file.size : 2500000,
          tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
          notes,
        },
        file
      );

      toast.success("Le contrat a été enregistré, chiffré et indexé avec succès dans le moteur de recherche !");
      router.push("/legal-reviewer/contracts");
    } catch (err) {
      toast.error("Erreur lors de l'enregistrement du contrat.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/legal-reviewer" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/legal-reviewer/contracts" className="hover:text-navy">Contrats</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Nouveau Contrat</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-4">
        <Link
          href="/legal-reviewer/contracts"
          className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour aux Contrats
        </Link>
        <h1 className="font-serif text-2xl font-bold text-navy">
          Enregistrer un Nouveau Contrat
        </h1>
        <p className="text-xs text-foreground-muted mt-1">
          Téléversement sécurisé (PDF uniquement) et indexation automatique dans le moteur de recherche légal.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Téléversement du document */}
        <div className="p-6 rounded-3xl bg-background border border-border shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider flex items-center gap-2">
            <Upload className="w-4 h-4 text-gold" />
            1. Document du Contrat (PDF)
          </h3>

          <FileDropzone
            acceptTypes={[".pdf"]}
            label="Téléversement sécurisé du fichier scanné ou signé (PDF uniquement) *"
            onFileSelect={(f) => setFile(f)}
            onFileRemove={() => setFile(null)}
            selectedFileName={file?.name}
            selectedFileSize={file?.size}
          />
        </div>

        {/* Step 2: Métadonnées */}
        <div className="p-6 rounded-3xl bg-background border border-border shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-gold" />
            2. Métadonnées &amp; Indexation Légale
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="contract-title" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Intitulé / Titre du Contrat *
              </label>
              <input
                id="contract-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ex. Contrat d'Édition Exclusive — Prof. Joseph DJOGBÉNOU"
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
                required
              />
            </div>

            <div>
              <label htmlFor="contracting-party" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Partie Contractante *
              </label>
              <input
                id="contracting-party"
                type="text"
                value={contractingParty}
                onChange={(e) => setContractingParty(e.target.value)}
                placeholder="ex. Université d'Abomey-Calavi / Éditions Hachette"
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
                required
              />
            </div>

            <div>
              <label htmlFor="party-type" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Catégorie de la Partie *
              </label>
              <select
                id="party-type"
                value={partyType}
                onChange={(e) => setPartyType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
              >
                <option value="author">Auteur Individuel</option>
                <option value="university">Université / Institution</option>
                <option value="publisher">Éditeur Tiers / Partenaire</option>
              </select>
            </div>

            <div>
              <label htmlFor="contract-type" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Type de Contrat *
              </label>
              <select
                id="contract-type"
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
              >
                <option value="author_contract">Contrat d&apos;Édition Auteur</option>
                <option value="university_agreement">Convention Cadre Université</option>
                <option value="publisher_partnership">Partenariat Éditeur Tiers</option>
                <option value="pre_edition">Contrat de Pré-Édition</option>
              </select>
            </div>

            <div>
              <label htmlFor="signed-date" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Date de Signature *
              </label>
              <input
                id="signed-date"
                type="date"
                value={signedAt}
                onChange={(e) => setSignedAt(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
                required
              />
            </div>

            <div>
              <label htmlFor="expires-date" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Date d&apos;Expiration (Optionnelle)
              </label>
              <input
                id="expires-date"
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
              />
            </div>

            <div>
              <label htmlFor="contract-tags" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Mots-Clés d&apos;Indexation (séparés par des virgules)
              </label>
              <input
                id="contract-tags"
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="droit, uac, exclusivite, 18%"
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
              />
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="contract-notes" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
                Notes &amp; Particularités Contractuelles
              </label>
              <textarea
                id="contract-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Remarques particulières, clauses d'exclusivité, dérogations..."
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[80px]"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            href="/legal-reviewer/contracts"
            className="px-5 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground-muted hover:text-navy transition-colors min-h-[44px] inline-flex items-center justify-center"
          >
            Annuler
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 disabled:opacity-50 min-h-[44px] shadow-xs"
          >
            {submitting ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4 text-gold" />
                Enregistrer &amp; Indexer le Contrat
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
