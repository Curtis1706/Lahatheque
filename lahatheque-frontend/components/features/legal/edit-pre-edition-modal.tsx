"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Modal } from "@/components/ui/modal";
import { updatePreEditionStatus, getContractFormOptions } from "@/lib/services/legal";
import type { PreEditionContract, ContractFormOptions } from "@/lib/types/legal";
import { SearchableSelect } from "@/components/ui/searchable-select";
import { DatePicker } from "@/components/ui/date-picker";
import { ShieldCheck, Users, Building2 } from "lucide-react";
import { toast } from "sonner";

interface EditPreEditionModalProps {
  dossier: PreEditionContract | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditPreEditionModal({
  dossier,
  isOpen,
  onClose,
  onSuccess,
}: EditPreEditionModalProps) {
  const [title, setTitle] = useState("");
  const [isExistingAuthor, setIsExistingAuthor] = useState(true);
  const [selectedAuthorId, setSelectedAuthorId] = useState("");
  const [customAuthorName, setCustomAuthorName] = useState("");
  const [customAuthorEmail, setCustomAuthorEmail] = useState("");
  const [selectedInstitutionId, setSelectedInstitutionId] = useState("");
  const [customUniversity, setCustomUniversity] = useState("");
  const [faculty, setFaculty] = useState("");
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState("");
  const [status, setStatus] = useState("en_attente_depot");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const [formOptions, setFormOptions] = useState<ContractFormOptions | null>(null);

  useEffect(() => {
    async function loadOptions() {
      try {
        const opts = await getContractFormOptions();
        setFormOptions(opts);
      } catch (err) {
        console.error("Erreur chargement options:", err);
      }
    }
    if (isOpen) {
      loadOptions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (dossier) {
      setTitle(dossier.title || "");
      setFaculty(dossier.faculty || "");
      setExpectedDeliveryDate(
        dossier.expected_delivery_date
          ? dossier.expected_delivery_date.slice(0, 10)
          : ""
      );
      setStatus(dossier.status || "en_attente_depot");
      setNotes(dossier.notes || "");

      // Auteur
      if (dossier.author_user_id) {
        setIsExistingAuthor(true);
        setSelectedAuthorId(dossier.author_user_id);
      } else {
        setIsExistingAuthor(false);
        setCustomAuthorName(dossier.author_name || "");
        setCustomAuthorEmail(dossier.author_email || "");
      }

      // Université
      setCustomUniversity(dossier.university || "");
    }
  }, [dossier]);

  // Options pour SearchableSelect
  const authorOptions = useMemo(() => {
    if (!formOptions?.authors) return [];
    return formOptions.authors.map((a) => ({
      value: a.id,
      label: a.name,
      subtitle: a.email,
      badge: a.phone || "Auteur",
    }));
  }, [formOptions]);

  const institutionOptions = useMemo(() => {
    if (!formOptions?.institutions) return [];
    return formOptions.institutions.map((i) => ({
      value: i.id,
      label: i.name,
      subtitle: `Pays: ${i.country}`,
      badge: `Taux: ${i.rate}%`,
    }));
  }, [formOptions]);

  if (!dossier) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    let finalAuthorName = customAuthorName.trim();
    let finalAuthorEmail = customAuthorEmail.trim() || undefined;

    if (isExistingAuthor && selectedAuthorId) {
      const selected = formOptions?.authors.find((a) => a.id === selectedAuthorId);
      if (selected) {
        finalAuthorName = selected.name;
        finalAuthorEmail = selected.email;
      }
    }

    if (!title.trim() || !finalAuthorName) {
      toast.error("Le titre prévisionnel et l'auteur sont obligatoires.");
      return;
    }

    let finalUniversity = customUniversity.trim();
    if (selectedInstitutionId) {
      const inst = formOptions?.institutions.find((i) => i.id === selectedInstitutionId);
      if (inst) finalUniversity = inst.name;
    }

    try {
      setSaving(true);
      const ok = await updatePreEditionStatus(dossier.id, {
        provisional_title: title.trim(),
        author_name: finalAuthorName,
        author_email: finalAuthorEmail,
        university: finalUniversity || "Université d'Abomey-Calavi (UAC)",
        faculty: faculty.trim() || "Faculté de Droit et de Science Politique (FADESP)",
        expected_delivery_date: expectedDeliveryDate || undefined,
        status,
        notes: notes.trim(),
      });

      if (ok) {
        toast.success("Dossier de pré-édition mis à jour avec succès.");
        onSuccess();
        onClose();
      } else {
        toast.error("Impossible de mettre à jour le dossier.");
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
      title="Modifier le Dossier de Pré-édition"
      description={`Code : ${dossier.code_dossier} — Projet en cadrage légal`}
      maxWidth={580}
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
            form="edit-pre-edition-form"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-navy hover:bg-navy-dark text-gold font-bold text-xs border border-gold/30 shadow-xs transition-colors min-h-[44px] inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4 text-gold" />
            {saving ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>
      }
    >
      <form id="edit-pre-edition-form" onSubmit={handleSubmit} className="space-y-4 pt-2">
        {/* Titre prévisionnel */}
        <div>
          <label htmlFor="edit-pre-title" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
            Titre Prévisionnel de l&apos;Ouvrage *
          </label>
          <input
            id="edit-pre-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex. Manuel de Pharmacologie et Thérapeutique Clinique"
            className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
            required
          />
        </div>

        {/* Type d'auteur (Existant ou Externe) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-navy uppercase tracking-wider">
              Auteur Bénéficiaire *
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsExistingAuthor(true)}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                  isExistingAuthor ? "bg-navy text-gold" : "text-foreground-muted hover:text-navy"
                }`}
              >
                Compte Auteur Existant
              </button>
              <button
                type="button"
                onClick={() => setIsExistingAuthor(false)}
                className={`text-[11px] font-bold px-2 py-0.5 rounded-md transition-colors ${
                  !isExistingAuthor ? "bg-navy text-gold" : "text-foreground-muted hover:text-navy"
                }`}
              >
                Nouvel Auteur Externe
              </button>
            </div>
          </div>

          {isExistingAuthor ? (
            <SearchableSelect
              options={authorOptions}
              value={selectedAuthorId}
              onChange={setSelectedAuthorId}
              placeholder="Rechercher un auteur inscrit..."
              searchPlaceholder="Taper le nom ou l'email..."
              icon={<Users className="w-4 h-4" />}
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                value={customAuthorName}
                onChange={(e) => setCustomAuthorName(e.target.value)}
                placeholder="Nom complet (ex. Prof. Victorien DOUGNON)"
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
                required={!isExistingAuthor}
              />
              <input
                type="email"
                value={customAuthorEmail}
                onChange={(e) => setCustomAuthorEmail(e.target.value)}
                placeholder="Email (ex. v.dougnon@uac.bj)"
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[44px]"
              />
            </div>
          )}
        </div>

        {/* Université & Faculté */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Université Rattachée *
            </label>
            <SearchableSelect
              options={institutionOptions}
              value={selectedInstitutionId}
              onChange={(val) => {
                setSelectedInstitutionId(val);
                const inst = formOptions?.institutions.find((i) => i.id === val);
                if (inst) setCustomUniversity(inst.name);
              }}
              placeholder="Sélectionner l'université..."
              searchPlaceholder="Rechercher l'institution..."
              icon={<Building2 className="w-4 h-4" />}
            />
          </div>

          <div>
            <label htmlFor="edit-fac" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Faculté / Établissement *
            </label>
            <input
              id="edit-fac"
              type="text"
              value={faculty}
              onChange={(e) => setFaculty(e.target.value)}
              placeholder="ex. Faculté de Médecine (FSS)"
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
              required
            />
          </div>
        </div>

        {/* Date Prévue de Remise & Statut Cycle de Vie */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Date Prévue de Remise du Manuscrit
            </label>
            <DatePicker
              value={expectedDeliveryDate}
              onChange={setExpectedDeliveryDate}
              placeholder="Sélectionner la date estimée..."
              presets={[
                { label: "+1 mois", offsetMonths: 1 },
                { label: "+3 mois", offsetMonths: 3 },
                { label: "+6 mois", offsetMonths: 6 },
              ]}
            />
          </div>

          <div>
            <label htmlFor="edit-status" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
              Statut Cycle de Vie *
            </label>
            <select
              id="edit-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px] cursor-pointer"
            >
              <option value="en_attente_depot">En attente du manuscrit (Auteur)</option>
              <option value="maquette_en_cours">Maquette en cours (PAO)</option>
              <option value="valide_legalement">Validé / Scellé légalement</option>
              <option value="archive">Archivé</option>
            </select>
          </div>
        </div>

        {/* Notes juridiques */}
        <div>
          <label htmlFor="edit-notes" className="block text-xs font-bold text-navy uppercase tracking-wider mb-1">
            Notes &amp; Particularités Juridiques
          </label>
          <textarea
            id="edit-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Engagement de publication, préaccord d'exclusivité, volume estimé..."
            className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[70px]"
          />
        </div>
      </form>
    </Modal>
  );
}
