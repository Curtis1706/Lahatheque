"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { updateLegalContract, getContractFormOptions } from "@/lib/services/legal";
import type { LegalContract, ContractFormOptions } from "@/lib/types/legal";
import { ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface EditContractModalProps {
  contract: LegalContract | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditContractModal({
  contract,
  isOpen,
  onClose,
  onSuccess,
}: EditContractModalProps) {
  const [title, setTitle] = useState("");
  const [contractingParty, setContractingParty] = useState("");
  const [partyType, setPartyType] = useState<"author" | "university" | "publisher" | "other">("author");
  const [contractType, setContractType] = useState("author_contract");
  const [selectedBookId, setSelectedBookId] = useState("");
  const [signedAt, setSignedAt] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [status, setStatus] = useState("active");
  const [tags, setTags] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [options, setOptions] = useState<ContractFormOptions | null>(null);

  useEffect(() => {
    async function loadOpts() {
      try {
        const data = await getContractFormOptions();
        setOptions(data);
      } catch (e) {
        // Optionnel
      }
    }
    if (isOpen) {
      loadOpts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (contract) {
      setTitle(contract.title || "");
      setContractingParty(contract.contracting_party || "");
      setPartyType(contract.party_type || "author");
      setContractType(contract.type || "author_contract");
      setSelectedBookId(contract.ouvrage_id || "");
      setSignedAt(contract.signed_at ? contract.signed_at.slice(0, 10) : "");
      setExpiresAt(contract.expires_at ? contract.expires_at.slice(0, 10) : "");
      setStatus(contract.status || "active");
      setTags(Array.isArray(contract.tags) ? contract.tags.join(", ") : (contract.tags || ""));
      setNotes(contract.notes || "");
    }
  }, [contract]);

  if (!contract) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !contractingParty.trim()) {
      toast.error("L'intitulé du contrat et la partie contractante sont obligatoires.");
      return;
    }

    try {
      setSaving(true);
      const ok = await updateLegalContract(contract.id, {
        title: title.trim(),
        contracting_party: contractingParty.trim(),
        party_type: partyType,
        type: contractType,
        ouvrage_id: selectedBookId || undefined,
        signed_at: signedAt || undefined,
        expires_at: expiresAt || undefined,
        status,
        tags: tags.trim() ? tags.split(",").map((t) => t.trim()).filter(Boolean) : undefined,
        notes: notes.trim(),
      });

      if (ok) {
        toast.success("Contrat légal mis à jour avec succès.");
        onSuccess();
        onClose();
      } else {
        toast.error("Impossible de mettre à jour le contrat.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la mise à jour.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title="Modifier le Contrat Légal"
      description={`Référence : ${contract.reference} — Registre légal LAHA`}
      maxWidth={600}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy font-bold text-xs transition-colors min-h-[44px] cursor-pointer"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="edit-contract-form"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-navy hover:bg-navy-dark text-gold font-bold text-xs border border-gold/30 shadow-xs transition-colors min-h-[44px] inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4 text-gold" />
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>
      }
    >
      <form id="edit-contract-form" onSubmit={handleSubmit} className="space-y-4 py-2">
        {/* Intitulé Officiel */}
        <div>
          <label htmlFor="contract-title" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
            Intitulé Officiel du Contrat *
          </label>
          <input
            id="contract-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
          />
        </div>

        {/* Partie Contractante & Type de Partie */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contracting-party" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Partie Contractante (Nom / Raison Sociale) *
            </label>
            <input
              id="contracting-party"
              type="text"
              value={contractingParty}
              onChange={(e) => setContractingParty(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
            />
          </div>

          <div>
            <label htmlFor="party-type-select" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Type de Tiers *
            </label>
            <select
              id="party-type-select"
              value={partyType}
              onChange={(e) => setPartyType(e.target.value as any)}
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px] cursor-pointer"
            >
              <option value="author">Auteur (Personne physique)</option>
              <option value="university">Université / Institution</option>
              <option value="publisher">Éditeur Tiers / Partenaire</option>
            </select>
          </div>
        </div>

        {/* Type de contrat & Ouvrage rattaché */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contract-type-select" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Type de Convention *
            </label>
            <select
              id="contract-type-select"
              value={contractType}
              onChange={(e) => setContractType(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px] cursor-pointer"
            >
              <option value="author_contract">Contrat d&apos;Édition Auteur</option>
              <option value="university_agreement">Convention Institutionnelle / Université</option>
              <option value="publisher_license">Licence de Diffusion Éditeur Tiers</option>
              <option value="pre_edition">Accord de Pré-Édition</option>
              <option value="avenant">Avenant Contractuel</option>
            </select>
          </div>

          <div>
            <label htmlFor="book-select" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Ouvrage du Catalogue Rattaché
            </label>
            <select
              id="book-select"
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px] cursor-pointer"
            >
              <option value="">Aucun ouvrage direct (Convention cadre)</option>
              {options?.ouvrages?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} {b.isbn ? `(${b.isbn})` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dates de Signature et d'Échéance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contract-signed-at" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Date de Signature
            </label>
            <input
              id="contract-signed-at"
              type="date"
              value={signedAt}
              onChange={(e) => setSignedAt(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
            />
          </div>
          <div>
            <label htmlFor="contract-expires-at" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Date d&apos;Échéance
            </label>
            <input
              id="contract-expires-at"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
            />
          </div>
        </div>

        {/* Statut & Tags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contract-status" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Statut Juridique *
            </label>
            <select
              id="contract-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px] cursor-pointer"
            >
              <option value="active">Actif (En vigueur)</option>
              <option value="pending_signature">En attente de signature</option>
              <option value="expired">Échu / Expiré</option>
              <option value="archived">Archivé</option>
            </select>
          </div>

          <div>
            <label htmlFor="contract-tags" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Mots-clés / Tags (séparés par virgule)
            </label>
            <input
              id="contract-tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="ex: exclusivité, droit_penal, 2026"
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
            />
          </div>
        </div>

        {/* Notes & Observations */}
        <div>
          <label htmlFor="contract-notes" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
            Notes &amp; Observations Juridiques
          </label>
          <textarea
            id="contract-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Précisions sur les clauses, avenants, conditions de résiliation..."
            className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy resize-none"
          />
        </div>
      </form>
    </Modal>
  );
}
