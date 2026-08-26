"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { ContractPdfViewer } from "./contract-pdf-viewer";
import type { LegalContract } from "@/lib/types/legal";
import {
  ShieldCheck,
  FileText,
  Clock,
  Tag,
  Percent,
  X,
  ExternalLink,
  ArrowRight,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

interface ContractConsultationModalProps {
  contract: LegalContract | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ContractConsultationModal({
  contract,
  isOpen,
  onClose,
}: ContractConsultationModalProps) {
  if (!contract) return null;

  return (
    <Modal open={isOpen} onClose={onClose} title="Consultation du Contrat Légale">
      <div className="p-6 space-y-6 max-h-[88vh] overflow-y-auto">
        
        {/* Header Modal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-xs text-gold px-2 py-0.5 rounded bg-gold/10 border border-gold/20">
                {contract.reference}
              </span>
              <StatusBadge status={contract.status} />
              <span className="text-[10px] text-foreground-muted font-mono uppercase bg-background-secondary px-2 py-0.5 rounded border border-border">
                {contract.party_type === "author" ? "Auteur" : contract.party_type === "university" ? "Université" : "Éditeur Tiers"}
              </span>
            </div>
            <h2 className="font-serif text-xl sm:text-2xl font-bold text-navy leading-snug">
              {contract.title}
            </h2>
            <p className="text-xs text-foreground-muted">
              Partie contractante : <strong className="text-navy">{contract.contracting_party}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/catalog/reader/lesson_pdf?contract_id=${contract.id}&file=${encodeURIComponent(contract.file_url || "")}&title=${encodeURIComponent(contract.title)}`}
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-all inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Ouvrir dans la liseuse officielle LAHAThèque avec FlipBook et défilement continu"
            >
              <BookOpen className="w-3.5 h-3.5" /> Ouvrir dans la Liseuse
            </Link>
          </div>
        </div>

        {/* Content Layout 2 Columns: Visionneuse PDF (Gauche) & Métadonnées (Droite) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Colonne Gauche: Visionneuse PDF et DOCX */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-serif font-bold text-xs text-navy uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-gold" /> Liseuse &amp; Aperçu de l&apos;Acte Contractuel
            </h3>

            <ContractPdfViewer
              contractId={contract.id}
              fileUrl={contract.file_url}
              fileName={contract.file_name}
              fileSize={contract.file_size}
              title={contract.title}
              reference={contract.reference}
              extractedText={(contract as any).extracted_text || (contract as any).extracted_text_preview || contract.notes}
            />
          </div>

          {/* Colonne Droite: Métadonnées & Historique */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Fiche Métadonnées */}
            <div className="p-5 rounded-3xl bg-background-secondary border border-border space-y-3.5 shadow-xs">
              <h3 className="font-serif font-bold text-xs text-navy uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-gold" /> Métadonnées Légales &amp; Indexation
              </h3>

              <div className="space-y-3 text-xs">
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
                  <span className="text-foreground-muted block text-[10px] uppercase font-bold">Archivage Légal</span>
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

            {/* Avenants Légalement Liés */}
            <div className="p-5 rounded-3xl bg-background-secondary border border-border space-y-3 shadow-xs">
              <h3 className="font-serif font-bold text-xs text-navy uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold" /> Avenants Registre
              </h3>

              {contract.amendments && contract.amendments.length > 0 ? (
                <div className="space-y-2">
                  {contract.amendments.map((am) => (
                    <div key={am.id} className="p-3 rounded-2xl bg-background border border-border flex items-center justify-between gap-2 text-xs">
                      <div>
                        <p className="font-bold text-navy text-[11px]">{am.title}</p>
                        <p className="text-[10px] text-foreground-muted font-mono">{am.date}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-navy/10 text-navy font-bold text-[10px]">
                        Enregistré
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-foreground-muted italic">Aucun avenant enregistré pour ce contrat.</p>
              )}
            </div>

            {/* Raccourci vers Fiche Droits d'Auteur */}
            <div className="pt-2">
              <Link
                href="/legal-reviewer/royalties"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-navy text-gold font-bold text-xs hover:bg-navy-dark transition-colors flex items-center justify-center gap-2 border border-gold/30 shadow-xs"
              >
                <Percent className="w-4 h-4" />
                Gérer les Taux de Redevances Liés
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>

        </div>

      </div>
    </Modal>
  );
}

export default ContractConsultationModal;
