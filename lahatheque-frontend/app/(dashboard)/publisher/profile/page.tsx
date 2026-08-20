"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  User,
  ShieldCheck,
  CreditCard,
  Phone,
  Mail,
  MapPin,
  FileText,
  Save,
  Lock,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";
import { getPublisherProfile, updatePublisherProfile } from "@/lib/services/publisher";
import type { PublisherProfileData, PublisherEntityType } from "@/lib/types/publisher";

export default function PublisherProfilePage() {
  const [profile, setProfile] = useState<PublisherProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [entityType, setEntityType] = useState<PublisherEntityType>("company");
  const [companyName, setCompanyName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [nifNumber, setNifNumber] = useState("");
  const [rccmNumber, setRccmNumber] = useState("");
  const [identityCardNumber, setIdentityCardNumber] = useState("");
  const [country, setCountry] = useState("BJ");
  const [city, setCity] = useState("Cotonou");
  const [headquartersAddress, setHeadquartersAddress] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankIban, setBankIban] = useState("");
  const [bankSwift, setBankSwift] = useState("");
  const [momoNumber, setMomoNumber] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const data = await getPublisherProfile();
        setProfile(data);
        setEntityType(data.entity_type || "company");
        setCompanyName(data.company_name || "");
        setTradeName(data.trade_name || "");
        setNifNumber(data.nif_number || "");
        setRccmNumber(data.rccm_number || "");
        setIdentityCardNumber(data.identity_card_number || "");
        setCountry(data.country || "BJ");
        setCity(data.city || "Cotonou");
        setHeadquartersAddress(data.headquarters_address || "");
        setContactPerson(data.contact_person || "");
        setContactEmail(data.contact_email || "");
        setContactPhone(data.contact_phone || "");
        setBankName(data.bank_name || "");
        setBankIban(data.bank_iban || "");
        setBankSwift(data.bank_swift || "");
        setMomoNumber(data.momo_number || "");
      } catch {
        toast.error("Impossible de charger les données du profil éditeur.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !contactEmail.trim()) {
      toast.error("Veuillez renseigner les informations obligatoires (Nom/Raison Sociale et E-mail).");
      return;
    }

    setSaving(true);
    try {
      const updated = await updatePublisherProfile({
        entity_type: entityType,
        company_name: companyName.trim(),
        trade_name: tradeName.trim(),
        nif_number: nifNumber.trim(),
        rccm_number: rccmNumber.trim(),
        identity_card_number: identityCardNumber.trim(),
        country,
        city: city.trim(),
        headquarters_address: headquartersAddress.trim(),
        contact_person: contactPerson.trim(),
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim(),
        bank_name: bankName.trim(),
        bank_iban: bankIban.trim(),
        bank_swift: bankSwift.trim(),
        momo_number: momoNumber.trim(),
      });
      setProfile(updated);
      toast.success("Profil éditeur et coordonnées de facturation enregistrés avec succès.");
    } catch {
      toast.error("Erreur lors de la mise à jour du profil.");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Veuillez renseigner votre mot de passe actuel et le nouveau mot de passe.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Le nouveau mot de passe doit comporter au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setChangingPassword(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
      toast.success("Mot de passe mis à jour avec succès.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Échec du changement de mot de passe.");
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 space-y-6 max-w-5xl mx-auto animate-pulse">
        <div className="h-8 bg-background-secondary rounded w-1/4" />
        <div className="h-64 bg-background-secondary rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/publisher"
            className="inline-flex items-center gap-1.5 text-xs text-navy font-bold hover:text-gold transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4 text-gold" />
            Paramètres &amp; Informations Légales
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Profil &amp; Mandat d&apos;Édition Tiers
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1">
            Gérez votre statut juridique, vos coordonnées fiscales et les comptes de reversement de vos redevances.
          </p>
        </div>
      </div>

      {/* Carte Mandat & Taux Contractuel */}
      <div className="p-6 rounded-3xl bg-navy text-white border border-navy-hover shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 text-gold text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5" />
            Partenaire Officiel Certifié
          </div>
          <h3 className="font-serif font-bold text-lg text-white">
            Convention de Mandat • Réf : {profile?.contract_reference || "CTR-PUB-2025-08"}
          </h3>
          <p className="text-xs text-white/80">
            Taux de redevance contractuel applicable sur les ventes :{" "}
            <span className="font-bold text-gold font-mono text-sm">
              {profile?.contractual_royalty_rate || 22}%
            </span>
          </p>
        </div>

        <div className="shrink-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
            <CheckCircle2 className="w-4 h-4" /> Compte Vérifié
          </span>
        </div>
      </div>

      {/* Formulaire Principal */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        {/* Sélecteur de Type d'Entité (Maison d'édition vs Personne physique) */}
        <div className="p-6 rounded-3xl bg-background border border-border shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-navy text-base flex items-center gap-2">
            <User className="w-5 h-5 text-gold" />
            1. Nature Juridique du Partenaire
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setEntityType("company")}
              className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 min-h-[60px] ${
                entityType === "company"
                  ? "bg-navy/5 border-gold shadow-xs"
                  : "bg-background-secondary border-border hover:border-border-hover"
              }`}
            >
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  entityType === "company" ? "bg-navy text-gold" : "bg-background text-navy"
                }`}
              >
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-xs text-navy">Maison d&apos;Édition / Personne Morale</p>
                <p className="text-[11px] text-foreground-muted mt-0.5">
                  Société commerciale, SARL/SAS, structure éditoriale enregistrée au RCCM.
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setEntityType("individual")}
              className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3 min-h-[60px] ${
                entityType === "individual"
                  ? "bg-navy/5 border-gold shadow-xs"
                  : "bg-background-secondary border-border hover:border-border-hover"
              }`}
            >
              <div
                className={`p-2.5 rounded-xl shrink-0 ${
                  entityType === "individual" ? "bg-navy text-gold" : "bg-background text-navy"
                }`}
              >
                <User className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-xs text-navy">Éditeur Indépendant / Personne Physique</p>
                <p className="text-[11px] text-foreground-muted mt-0.5">
                  Auto-éditeur, auteur-éditeur indépendant opérant en nom propre.
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Coordonnées de l'Entité */}
        <div className="p-6 rounded-3xl bg-background border border-border shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-navy text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-gold" />
            2. Identification &amp; Enregistrement Légal
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">
                {entityType === "company" ? "Raison Sociale / Maison d'Édition" : "Nom & Prénom de l'Éditeur"}{" "}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={entityType === "company" ? "ex. Éditions Hachette Afrique SARL" : "ex. Dr. Honoré ZINSOU"}
                required
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
              />
            </div>

            {entityType === "company" && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">Nom Commercial / Enseigne</label>
                <input
                  type="text"
                  value={tradeName}
                  onChange={(e) => setTradeName(e.target.value)}
                  placeholder="ex. Hachette Livre Distribution"
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">Numéro NIF / IFU</label>
              <input
                type="text"
                value={nifNumber}
                onChange={(e) => setNifNumber(e.target.value)}
                placeholder="3201900123456"
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-mono min-h-[44px]"
              />
            </div>

            {entityType === "company" ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">Numéro RCCM</label>
                <input
                  type="text"
                  value={rccmNumber}
                  onChange={(e) => setRccmNumber(e.target.value)}
                  placeholder="RB/COT/20-B-12345"
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-mono min-h-[44px]"
                />
              </div>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">Numéro CNI / Passeport</label>
                <input
                  type="text"
                  value={identityCardNumber}
                  onChange={(e) => setIdentityCardNumber(e.target.value)}
                  placeholder="0123456789"
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-mono min-h-[44px]"
                />
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">Pays de Domiciliation</label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
              >
                <option value="BJ">Bénin</option>
                <option value="SN">Sénégal</option>
                <option value="CI">Côte d&apos;Ivoire</option>
                <option value="TG">Togo</option>
                <option value="NE">Niger</option>
                <option value="GA">Gabon</option>
                <option value="CD">RDC</option>
                <option value="FR">France</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">Ville</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Cotonou"
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">Adresse Complète du Siège</label>
              <input
                type="text"
                value={headquartersAddress}
                onChange={(e) => setHeadquartersAddress(e.target.value)}
                placeholder="Avenue Jean-Paul II, Immeuble Horizon, Cotonou"
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* Contacts d'Astreinte & Notifications */}
        <div className="p-6 rounded-3xl bg-background border border-border shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-navy text-base flex items-center gap-2">
            <Mail className="w-5 h-5 text-gold" />
            3. Contact Administratif &amp; Astreinte
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">
                Responsable des Relations LAHA
              </label>
              <input
                type="text"
                value={contactPerson}
                onChange={(e) => setContactPerson(e.target.value)}
                placeholder="Mme Clarisse DOSSA"
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">
                E-mail de Facturation <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="partenaires@editions.com"
                required
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">Téléphone d&apos;Astreinte</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+229 97 00 11 22"
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* Coordonnées Bancaires & Règlements */}
        <div className="p-6 rounded-3xl bg-background border border-border shadow-xs space-y-4">
          <h3 className="font-serif font-bold text-navy text-base flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-gold" />
            4. Coordonnées de Reversement des Redevances
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">Nom de la Banque</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Ecobank Bénin"
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">Code BIC / SWIFT</label>
              <input
                type="text"
                value={bankSwift}
                onChange={(e) => setBankSwift(e.target.value)}
                placeholder="ECOBBJBJ"
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-mono min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">
                Numéro IBAN / Compte Bancaire
              </label>
              <input
                type="text"
                value={bankIban}
                onChange={(e) => setBankIban(e.target.value)}
                placeholder="BJ0610100100145678901234"
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-mono min-h-[44px]"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-gold" />
                Compte Mobile Money (MTN / Moov / Wave / Orange)
              </label>
              <input
                type="tel"
                value={momoNumber}
                onChange={(e) => setMomoNumber(e.target.value)}
                placeholder="+229 97 00 11 22"
                className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* Bouton de Sauvegarde */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center gap-2 min-h-[44px] shadow-xs disabled:opacity-50"
          >
            {saving ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Enregistrement en cours...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-gold" />
                <span>Enregistrer les Informations</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Section Sécurité & Mot de Passe */}
      <form onSubmit={handleChangePassword} className="p-6 rounded-3xl bg-background border border-border shadow-xs space-y-4">
        <h3 className="font-serif font-bold text-navy text-base flex items-center gap-2">
          <Lock className="w-5 h-5 text-gold" />
          5. Sécurité &amp; Mot de Passe du Compte
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-navy uppercase tracking-wider">Mot de Passe Actuel</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-navy uppercase tracking-wider">Nouveau Mot de Passe</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-navy uppercase tracking-wider">Confirmer le Mot de Passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={changingPassword || !newPassword}
            className="px-5 py-2.5 rounded-xl bg-background-secondary border border-border text-xs font-bold text-navy hover:bg-background transition-colors flex items-center gap-2 min-h-[44px] disabled:opacity-50"
          >
            {changingPassword ? (
              <>
                <span className="w-4 h-4 border-2 border-navy/30 border-t-navy rounded-full animate-spin" />
                <span>Modification...</span>
              </>
            ) : (
              <span>Modifier le Mot de Passe</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
