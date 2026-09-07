"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { PhoneInput } from "@/components/ui/phone-input";
import { AdminRole } from "@/lib/types/admin";
import { createAdminUser } from "@/lib/services/admin";
import { Shield, Mail, CheckCircle2, Building2, School, PlusCircle } from "lucide-react";
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Institution management
  const [institutionMode, setInstitutionMode] = useState<"existing" | "new">("existing");
  const [institutions, setInstitutions] = useState<{ id: string; name: string; code?: string; country?: string }[]>([]);
  const [selectedInstitutionId, setSelectedInstitutionId] = useState<string>("");
  const [newInstName, setNewInstName] = useState("");
  const [newInstCode, setNewInstCode] = useState("");
  const [newInstCountry, setNewInstCountry] = useState("BJ");
  const [loadingInstitutions, setLoadingInstitutions] = useState(false);

  const isUniversityRole = selectedRole === "university";

  useEffect(() => {
    if (isUniversityRole && institutionMode === "existing" && institutions.length === 0) {
      setLoadingInstitutions(true);
      fetch("/api/bff/partners/institutions/", { credentials: "include" })
        .then((r) => r.json())
        .then((d) => {
          const list = d?.data || d?.results || [];
          setInstitutions(list);
        })
        .catch(() => {})
        .finally(() => setLoadingInstitutions(false));
    }
  }, [isUniversityRole, institutionMode]);

  const handleNextStep1 = () => {
    setStep(2);
  };

  const handleGenerateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    if (isUniversityRole && institutionMode === "existing" && !selectedInstitutionId) {
      toast.error("Veuillez sélectionner une institution partenaire ou créer une nouvelle.");
      return;
    }
    if (isUniversityRole && institutionMode === "new" && !newInstName.trim()) {
      toast.error("Veuillez saisir le nom officiel de la nouvelle institution partenaire.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        country: formData.country,
        role: selectedRole,
      };

      if (isUniversityRole) {
        if (institutionMode === "existing" && selectedInstitutionId) {
          payload.institution_id = selectedInstitutionId;
        } else if (institutionMode === "new" && newInstName.trim()) {
          payload.institution_mode = "new";
          payload.institution_name = newInstName.trim();
          payload.institution_code = newInstCode.trim();
          payload.institution_country = newInstCountry;
        }
      }

      const res = await createAdminUser(payload);

      if (res.success) {
        setStep(3);
        toast.success("Compte utilisateur créé avec succès !");
        onSuccess?.();
      } else {
        toast.error(res.error || "Erreur lors de la création du compte.");
        if (res.suggestion_id) {
          setInstitutionMode("existing");
          setSelectedInstitutionId(res.suggestion_id);
          fetch("/api/bff/partners/institutions/", { credentials: "include" })
            .then((r) => r.json())
            .then((d) => {
              const list = d?.data || d?.results || [];
              setInstitutions(list);
            })
            .catch(() => {});
        }
      }
    } catch {
      toast.error("Impossible de contacter le serveur.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setStep(1);
    setFormData({ firstName: "", lastName: "", email: "", phone: "", country: "BJ", institutionName: "" });
    setSelectedInstitutionId("");
    setNewInstName("");
    setNewInstCode("");
    setNewInstCountry("BJ");
    setInstitutionMode("existing");
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
                <div className="mt-1">
                  <PhoneInput
                    value={formData.phone}
                    onChange={(val) => setFormData({ ...formData, phone: val })}
                    placeholder="97 00 00 00"
                    className="min-h-[44px]"
                  />
                </div>
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

            {isUniversityRole && (
              <div className="space-y-3 p-3 rounded-2xl bg-background-secondary border border-border">
                <div className="flex items-center gap-2 text-xs font-bold text-navy">
                  <Building2 className="w-4 h-4 text-gold" />
                  <span>Institution Partenaire Officielle</span>
                </div>

                {/* Mode switcher */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setInstitutionMode("existing")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                      institutionMode === "existing"
                        ? "bg-navy text-white border-navy"
                        : "bg-background border-border text-foreground-muted hover:border-navy"
                    }`}
                  >
                    <School className="w-3.5 h-3.5" />
                    Rattacher une université existante
                  </button>
                  <button
                    type="button"
                    onClick={() => setInstitutionMode("new")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                      institutionMode === "new"
                        ? "bg-gold text-navy border-gold"
                        : "bg-background border-border text-foreground-muted hover:border-gold"
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Nouvelle institution
                  </button>
                </div>

                {/* Existing institution selector */}
                {institutionMode === "existing" && (
                  <div>
                    {loadingInstitutions ? (
                      <div className="w-full p-2.5 text-xs text-foreground-muted text-center border border-border rounded-xl bg-background">
                        Chargement des institutions...
                      </div>
                    ) : (
                      <select
                        value={selectedInstitutionId}
                        onChange={(e) => setSelectedInstitutionId(e.target.value)}
                        className="w-full p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none min-h-[44px]"
                      >
                        <option value="">-- Sélectionner une université partenaire --</option>
                        {institutions.map((inst) => (
                          <option key={inst.id} value={inst.id}>
                            {inst.name}{inst.code ? ` (${inst.code})` : ""}
                          </option>
                        ))}
                      </select>
                    )}
                    {institutions.length === 0 && !loadingInstitutions && (
                      <p className="text-[10px] text-foreground-muted mt-1">
                        Aucune institution trouvée. Utilisez &laquo; Nouvelle institution &raquo; pour en créer une.
                      </p>
                    )}
                  </div>
                )}

                {/* New institution form */}
                {institutionMode === "new" && (
                  <div className="space-y-2.5">
                    <div>
                      <label className="text-[11px] font-medium text-foreground">Nom officiel complet *</label>
                      <input
                        type="text"
                        value={newInstName}
                        onChange={(e) => setNewInstName(e.target.value)}
                        placeholder="Université d'Abomey-Calavi"
                        className="w-full mt-1 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-medium text-foreground">Sigle / Code</label>
                        <input
                          type="text"
                          value={newInstCode}
                          onChange={(e) => setNewInstCode(e.target.value.toUpperCase())}
                          placeholder="UAC (auto si vide)"
                          maxLength={12}
                          className="w-full mt-1 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-foreground">Pays</label>
                        <select
                          value={newInstCountry}
                          onChange={(e) => setNewInstCountry(e.target.value)}
                          className="w-full mt-1 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none"
                        >
                          <option value="BJ">Bénin (BJ)</option>
                          <option value="TG">Togo (TG)</option>
                          <option value="CI">Côte d&apos;Ivoire (CI)</option>
                          <option value="SN">Sénégal (SN)</option>
                          <option value="NE">Niger (NE)</option>
                          <option value="GA">Gabon (GA)</option>
                          <option value="ML">Mali (ML)</option>
                          <option value="CM">Cameroun (CM)</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 p-2 rounded-lg bg-gold/10 border border-gold/20 text-[10px] text-navy">
                      <Building2 className="w-3 h-3 text-gold shrink-0" />
                      <span>Taux conventionné : <strong>15%</strong> appliqué par défaut. Modifiable depuis Administration &rsaquo; Redevances.</span>
                    </div>
                  </div>
                )}
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

        {/* Étape 3 : Confirmation de création et envoi d'accès sécurisés */}
        {step === 3 && (
          <div className="space-y-5 text-center py-2">
            <div className="w-12 h-12 rounded-full bg-success/15 text-success mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-foreground">Compte Créé avec Succès !</h3>
              <p className="text-xs text-foreground-muted mt-1">
                Le rôle <span className="font-semibold text-navy">{ROLE_OPTIONS.find(r => r.role === selectedRole)?.label || selectedRole}</span> a été assigné à{" "}
                <span className="font-semibold text-foreground">{formData.firstName} {formData.lastName}</span>.
              </p>
            </div>

            {/* Notification de Sécurité & Transmission Email */}
            <div className="p-4 rounded-xl bg-background-secondary border border-border text-left space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-navy">
                <Mail className="w-4 h-4 text-gold" />
                <span>Identifiants transmis par e-mail</span>
              </div>
              <p className="text-xs text-foreground leading-relaxed">
                Un e-mail de bienvenue officiel contenant l'adresse de connexion et le mot de passe temporaire chiffré a été transmis directement à <strong className="font-mono text-navy">{formData.email}</strong>.
              </p>
              <div className="p-2.5 rounded-lg bg-navy/5 border border-navy/10 text-[11px] text-foreground-muted flex items-start gap-2">
                <Shield className="w-4 h-4 text-navy shrink-0 mt-0.5" />
                <span>
                  Conformément aux normes de sécurité et de confidentialité des données, le mot de passe temporaire n'est pas affiché sur l'écran d'administration et reste strictement réservé au titulaire du compte.
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors shadow-sm"
              >
                Terminer & Fermer
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
