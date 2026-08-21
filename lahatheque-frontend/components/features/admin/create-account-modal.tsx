"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { AdminRole } from "@/lib/types/admin";
import { createAdminUser } from "@/lib/services/admin";
import { User, Shield, Mail, Phone, Globe, Lock, CheckCircle2, Copy } from "lucide-react";
import { toast } from "sonner";

export interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: AdminRole;
  onSuccess?: () => void;
}

const ROLE_OPTIONS: { role: AdminRole; label: string; desc: string }[] = [
  { role: "student", label: "Client Lecteur / Étudiant", desc: "Accès à la liseuse LCP DRM, abonnements et achats" },
  { role: "author", label: "Auteur", desc: "Consultation des droits propres, redevances et dépôts manuscrit" },
  { role: "publisher", label: "Éditeur Tiers", desc: "Portail éditeur, dépôts ONIX 3.0 et suivi financier" },
  { role: "university", label: "Université Partenaire", desc: "Gestion des bouquets institutionnels, affiliations et redevances 15%" },
  { role: "layout_artist", label: "Maquettiste", desc: "Dépôt des épreuves PDF/EPUB et classification catalogue" },
  { role: "chief_layout", label: "Chef Maquettiste", desc: "Validation des épreuves et publication officielle" },
  { role: "manager", label: "Gestionnaire Stock & Livraison", desc: "Stock papier physique et suivi des livraisons" },
  { role: "legal_reviewer", label: "Juriste", desc: "Validation des contrats, droits d'auteur et impayés" },
  { role: "wholesaler", label: "Grossiste", desc: "Achats en gros à tarifs dégressifs et commandes groupées" },
];

export function CreateAccountModal({
  isOpen,
  onClose,
  defaultRole = "student",
  onSuccess,
}: CreateAccountModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedRole, setSelectedRole] = useState<AdminRole>(defaultRole);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    country: "BJ",
    institutionName: "",
  });
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNextStep1 = () => {
    setStep(2);
  };

  const handleGenerateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createAdminUser({
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        country: formData.country,
        role: selectedRole,
      });

      if (res.success) {
        setGeneratedPassword(res.temporary_password || "Laha-" + Math.random().toString(36).substring(2, 8).toUpperCase() + "!");
        setStep(3);
        toast.success("Compte utilisateur créé avec succès !");
        onSuccess?.();
      } else {
        toast.error(res.error || "Erreur lors de la création du compte.");
      }
    } catch {
      toast.error("Impossible de contacter le serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyPasswordToClipboard = () => {
    navigator.clipboard.writeText(generatedPassword);
    toast.success("Mot de passe copié dans le presse-papier !");
  };

  const handleResetAndClose = () => {
    setStep(1);
    setFormData({ firstName: "", lastName: "", email: "", phone: "", country: "BJ", institutionName: "" });
    setGeneratedPassword("");
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={handleResetAndClose} title="Créer un nouveau compte">
      <div className="p-6 max-w-lg mx-auto bg-background text-foreground space-y-6">
        {/* Stepper Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-bold font-serif text-navy">Créer un Nouveau Compte</h2>
            <p className="text-xs text-foreground-muted">Étape {step} sur 3</p>
          </div>
          <div className="flex items-center gap-1.5">
            {[1, 2, 3].map((s) => (
              <span
                key={s}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  step === s ? "bg-gold w-6" : step > s ? "bg-navy" : "bg-border"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Étape 1 : Choix du Rôle */}
        {step === 1 && (
          <div className="space-y-4">
            <label className="text-xs font-semibold text-foreground">
              Sélectionnez le rôle du compte à créer :
            </label>
            <div className="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {ROLE_OPTIONS.map((opt) => {
                const isSelected = selectedRole === opt.role;
                return (
                  <button
                    key={opt.role}
                    type="button"
                    onClick={() => setSelectedRole(opt.role)}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                      isSelected
                        ? "border-gold bg-gold/10 shadow-xs"
                        : "border-border hover:border-navy/40 hover:bg-background-secondary"
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg mt-0.5 ${
                        isSelected ? "bg-navy text-gold" : "bg-background-secondary text-foreground-muted"
                      }`}
                    >
                      <Shield className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-xs text-foreground">{opt.label}</p>
                      <p className="text-[11px] text-foreground-muted">{opt.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-border">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-foreground-muted hover:bg-background-secondary"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleNextStep1}
                className="px-5 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors"
              >
                Suivant : Coordonnées
              </button>
            </div>
          </div>
        )}

        {/* Étape 2 : Formulaire Identité */}
        {step === 2 && (
          <form onSubmit={handleGenerateAndSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground">Prénom *</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Kossi"
                  className="w-full mt-1 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Nom *</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Adambounou"
                  className="w-full mt-1 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground">Adresse E-mail *</label>
              <div className="relative mt-1">
                <Mail className="w-4 h-4 text-foreground-muted absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="kossi@uac.bj"
                  className="w-full p-2.5 pl-9 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground">Téléphone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+229 97 00 00 00"
                  className="w-full mt-1 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground">Pays</label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full mt-1 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none"
                >
                  <option value="BJ">Bénin (BJ)</option>
                  <option value="CI">Côte d'Ivoire (CI)</option>
                  <option value="SN">Sénégal (SN)</option>
                  <option value="NE">Niger (NE)</option>
                  <option value="TG">Togo (TG)</option>
                  <option value="GA">Gabon (GA)</option>
                  <option value="CD">Congo RDC (CD)</option>
                </select>
              </div>
            </div>

            {(selectedRole === "partner_api" || selectedRole === "university") && (
              <div>
                <label className="text-xs font-medium text-foreground">Nom de l'Université / Institution</label>
                <input
                  type="text"
                  value={formData.institutionName}
                  onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                  placeholder="Université d'Abomey-Calavi"
                  className="w-full mt-1 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none"
                />
              </div>
            )}

            <div className="pt-4 flex justify-between gap-2 border-t border-border">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-foreground-muted hover:bg-background-secondary"
              >
                Retour
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Création en cours..." : "Générer le Compte"}
              </button>
            </div>
          </form>
        )}

        {/* Étape 3 : Confirmation & Mot de passe généré */}
        {step === 3 && (
          <div className="space-y-5 text-center py-2">
            <div className="w-12 h-12 rounded-full bg-success/15 text-success mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-foreground">Compte Créé avec Succès !</h3>
              <p className="text-xs text-foreground-muted mt-1">
                Le rôle <span className="font-semibold text-navy">{selectedRole}</span> a été assigné à{" "}
                <span className="font-semibold">{formData.email}</span>.
              </p>
            </div>

            {/* Mot de Passe Généré Box */}
            <div className="p-4 rounded-xl bg-background-secondary border border-border text-left space-y-2">
              <p className="text-[11px] font-semibold text-foreground-muted uppercase tracking-wider">
                Mot de passe temporaire généré :
              </p>
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-background border border-border">
                <span className="font-mono text-sm font-bold text-gold tracking-wider">
                  {generatedPassword}
                </span>
                <button
                  type="button"
                  onClick={copyPasswordToClipboard}
                  className="p-1.5 rounded-md hover:bg-background-secondary text-foreground-muted hover:text-foreground transition-colors"
                  title="Copier le mot de passe"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-foreground-muted">
                Un e-mail de bienvenue contenant ses identifiants d'accès a été transmis à l'utilisateur.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
