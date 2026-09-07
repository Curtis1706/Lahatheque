"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { PhoneInput } from "@/components/ui/phone-input";
import { ProfessionalContact, ContactCategory } from "@/lib/types/contacts";
import { User, Mail, Phone, Building2, Briefcase, Tag, FileText, Loader2 } from "lucide-react";

interface AddEditContactModalProps {
  open: boolean;
  onClose: () => void;
  contact?: ProfessionalContact | null;
  onSave: (savedContact: ProfessionalContact) => void;
}

const CATEGORY_OPTIONS: { value: ContactCategory; label: string }[] = [
  { value: "university", label: "Université / Académie" },
  { value: "author", label: "Auteur / Écrivain" },
  { value: "publisher", label: "Éditeur Tiers / Partenaire" },
  { value: "institution", label: "Ministère / Institution Publique" },
  { value: "partner", label: "Diffuseur / Libraire / B2B" },
  { value: "press", label: "Presse & Média" },
  { value: "other", label: "Autre contact" },
];

export function AddEditContactModal({
  open,
  onClose,
  contact,
  onSave,
}: AddEditContactModalProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [organization, setOrganization] = useState("");
  const [roleOrTitle, setRoleOrTitle] = useState("");
  const [category, setCategory] = useState<ContactCategory>("university");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = Boolean(contact);

  useEffect(() => {
    if (contact) {
      setFirstName(contact.first_name || "");
      setLastName(contact.last_name || "");
      setEmail(contact.email || "");
      setPhone(contact.phone || "");
      setOrganization(contact.organization || "");
      setRoleOrTitle(contact.role_or_title || "");
      setCategory(contact.category || "university");
      setNotes(contact.notes || "");
    } else {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setOrganization("");
      setRoleOrTitle("");
      setCategory("university");
      setNotes("");
    }
    setError(null);
  }, [contact, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("Le prénom, le nom et l'adresse e-mail sont requis.");
      return;
    }

    if (!email.includes("@")) {
      setError("Veuillez saisir une adresse e-mail valide.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        organization: organization.trim(),
        role_or_title: roleOrTitle.trim(),
        category,
        notes: notes.trim(),
      };

      const { createContact, updateContact } = await import("@/lib/services/contacts");
      let saved: ProfessionalContact;
      if (isEditing && contact) {
        saved = await updateContact(contact.id, payload);
      } else {
        saved = await createContact(payload);
      }

      onSave(saved);
      onClose();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEditing ? "Modifier le Contact" : "Nouveau Contact Professionnel"}
      description={
        isEditing
          ? "Mettez à jour les informations et coordonnées de cet interlocuteur."
          : "Ajoutez un contact institutionnel, académique ou partenaire à votre carnet."
      }
      maxWidth={580}
      footer={
        <div className="flex items-center justify-end gap-3 w-full">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-foreground-muted hover:text-foreground hover:bg-background-secondary rounded-xl transition-colors"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-navy hover:bg-navy-hover rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-navy focus:outline-none disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <span>{isEditing ? "Enregistrer les modifications" : "Créer le contact"}</span>
            )}
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-navy dark:text-white">
              Prénom <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none" />
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ex: Mahougnon"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-background focus:ring-2 focus:ring-navy focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-navy dark:text-white">
              Nom <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none" />
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Ex: Hounkpati"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-background focus:ring-2 focus:ring-navy focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-navy dark:text-white">
              Adresse e-mail <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nom@domaine.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-background focus:ring-2 focus:ring-navy focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-navy dark:text-white">
              Téléphone / WhatsApp
            </label>
            <PhoneInput
              value={phone}
              onChange={setPhone}
              placeholder="97 00 00 00"
              className="min-h-[44px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-navy dark:text-white">
              Organisation / Établissement
            </label>
            <div className="relative">
              <Building2 className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none" />
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Ex: Université d'Abomey-Calavi"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-background focus:ring-2 focus:ring-navy focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-navy dark:text-white">
              Fonction / Qualité
            </label>
            <div className="relative">
              <Briefcase className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none" />
              <input
                type="text"
                value={roleOrTitle}
                onChange={(e) => setRoleOrTitle(e.target.value)}
                placeholder="Ex: Doyen de Faculté"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-background focus:ring-2 focus:ring-navy focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-navy dark:text-white">
            Catégorie
          </label>
          <div className="relative">
            <Tag className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-foreground-muted pointer-events-none" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ContactCategory)}
              className="w-full pl-9 pr-8 py-2 text-sm rounded-xl border border-border bg-background focus:ring-2 focus:ring-navy focus:outline-none cursor-pointer appearance-none"
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-muted text-xs pointer-events-none">
              ▼
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-navy dark:text-white">
            Notes internes & historique
          </label>
          <div className="relative">
            <FileText className="size-4 absolute left-3 top-3 text-foreground-muted pointer-events-none" />
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contexte relationnel, projets en cours, conventions..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-background focus:ring-2 focus:ring-navy focus:outline-none resize-none"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default AddEditContactModal;
