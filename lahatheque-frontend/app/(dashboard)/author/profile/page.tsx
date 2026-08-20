"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { 
  User, 
  ArrowLeft, 
  Save, 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  Smartphone, 
  Building2,
  CheckCircle2,
  GraduationCap,
  Camera,
  Upload
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { AuthorTeamAccessCard } from "@/components/features/author/author-team-access-card";
import { getAuthorDelegates, inviteAuthorDelegate, removeAuthorDelegate } from "@/lib/services/author";
import { getProfile, updateProfile, changePassword } from "@/lib/services/auth";
import type { AuthorDelegateAccess } from "@/lib/types/author";
import { toast } from "sonner";

export default function AuthorProfilePage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(user?.first_name || "Augustin");
  const [lastName, setLastName] = useState(user?.last_name || "CHAKIROU");
  const [penName, setPenName] = useState("");
  const [affiliation, setAffiliation] = useState("Université d'Abomey-Calavi (UAC) - Faculté de Droit");
  const [email, setEmail] = useState(user?.email || "augustin.chakirou@uac.bj");
  const [phone, setPhone] = useState("+229 97 00 11 22");
  const [avatarPreview, setAvatarPreview] = useState<string | null>((user as any)?.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Coordonnées bancaires & Mobile Money
  const [bankName, setBankName] = useState("ECOBANK Bénin");
  const [iban, setIBAN] = useState("BJ66 0100 1001 0000 1234 5678 90");
  const [swift, setSWIFT] = useState("ECOCBJBJ");
  const [momoNumber, setMomoNumber] = useState("+229 97 00 11 22");

  // Délégation d'accès (Co-auteurs & Assistants)
  const [delegates, setDelegates] = useState<AuthorDelegateAccess[]>([]);
  const [saving, setSaving] = useState(false);

  // Mot de passe
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [delData, profData] = await Promise.all([
        getAuthorDelegates(),
        getProfile(),
      ]);
      setDelegates(delData);

      if (profData.success && profData.data) {
        const u = profData.data;
        if (u.first_name) setFirstName(u.first_name);
        if (u.last_name) setLastName(u.last_name);
        if (u.email) setEmail(u.email);
        if (u.phone) setPhone(u.phone);
        if (u.pen_name) setPenName(u.pen_name);
        if (u.university_affiliation) setAffiliation(u.university_affiliation);
        if (u.bank_name) setBankName(u.bank_name);
        if (u.iban) setIBAN(u.iban);
        if (u.swift) setSWIFT(u.swift);
        if (u.momo_number) setMomoNumber(u.momo_number);
        if (u.avatar_url) setAvatarPreview(u.avatar_url);
      }
    }
    loadData();
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      setAvatarFile(f);
      setAvatarPreview(URL.createObjectURL(f));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const fd = new FormData();
    fd.append("first_name", firstName);
    fd.append("last_name", lastName);
    fd.append("pen_name", penName);
    fd.append("university_affiliation", affiliation);
    fd.append("phone", phone);
    fd.append("bank_name", bankName);
    fd.append("iban", iban);
    fd.append("swift", swift);
    fd.append("momo_number", momoNumber);
    if (avatarFile) {
      fd.append("avatar", avatarFile);
    }

    const res = await updateProfile(fd);
    setSaving(false);

    if (res.success) {
      toast.success("Vos coordonnées personnelles, d'affiliation et bancaires ont été enregistrées !");
    } else {
      toast.error(res.error || "Erreur lors de l'enregistrement du profil.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      toast.error("Veuillez remplir tous les champs du mot de passe.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les deux mots de passe ne correspondent pas.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Le nouveau mot de passe doit comporter au moins 8 caractères.");
      return;
    }

    setChangingPassword(true);
    const res = await changePassword({
      current_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    setChangingPassword(false);
    if (res.success) {
      toast.success("Votre mot de passe a été modifié avec succès !");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      toast.error(res.error || "Échec de la modification du mot de passe.");
    }
  };

  const handleInviteDelegate = async (name: string, email: string, role: "co_author" | "assistant") => {
    const newDel = await inviteAuthorDelegate(name, email, role);
    setDelegates((prev) => [...prev, newDel]);
    toast.success(`Invitation envoyée à ${name}.`);
  };

  const handleRemoveDelegate = async (id: string) => {
    const ok = await removeAuthorDelegate(id);
    if (ok) {
      setDelegates((prev) => prev.filter((d) => d.id !== id));
      toast.info("Accès délégué révoqué.");
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/author" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Profil &amp; Coordonnées</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/author" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Vue d&apos;ensemble
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <User className="w-4 h-4 text-gold" />
            Paramètres du Compte Auteur
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Profil, Affiliation &amp; Coordonnées
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Gérez votre identité officielle, vos coordonnées de versement et vos accès délégués.
          </p>
        </div>
      </div>

      {/* Carte de Délégation d'Accès */}
      <AuthorTeamAccessCard
        delegates={delegates}
        onInviteDelegate={handleInviteDelegate}
        onRemoveDelegate={handleRemoveDelegate}
      />

      {/* Formulaire 1 : Informations Personnelles & Coordonnées Bancaires */}
      <form onSubmit={handleSaveProfile} className="p-6 sm:p-8 rounded-3xl bg-background border border-border space-y-6 shadow-xs">
        <div className="space-y-4">
          <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider border-b border-border pb-2">
            Identité Officielle de l&apos;Auteur
          </h3>

          {/* Photo de Profil */}
          <div className="flex items-center gap-4 pb-2">
            <div className="relative group">
              <div className="w-16 h-16 rounded-full bg-navy text-gold font-serif font-bold text-xl flex items-center justify-center overflow-hidden border-2 border-gold/40">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  `${firstName.slice(0, 1)}${lastName.slice(0, 1)}`
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-navy/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white cursor-pointer"
                title="Changer la photo"
              >
                <Camera className="w-5 h-5 text-gold" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <div>
              <p className="font-bold text-xs text-navy">Photo de profil / Portrait Auteur</p>
              <p className="text-[11px] text-foreground-muted">PNG, JPG ou WEBP (Max 5 Mo)</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-navy mb-1.5">Prénom (Identité Officielle) *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-navy mb-1.5">Nom de Famille (Identité Officielle) *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-navy mb-1.5">
                Nom de Plume / Pseudonyme <span className="text-foreground-muted font-normal">(Facultatif)</span>
              </label>
              <input
                type="text"
                value={penName}
                onChange={(e) => setPenName(e.target.value)}
                placeholder="Optionnel si identique au nom civil"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
              />
            </div>
            <div>
              <label className="block font-bold text-navy mb-1.5">
                Affiliation Universitaire / Institution <span className="text-foreground-muted font-normal">(Facultatif)</span>
              </label>
              <input
                type="text"
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
                placeholder="Facultatif — ex: Enseignant-Chercheur ou Auteur indépendant"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
              />
            </div>
            <div>
              <label className="block font-bold text-navy mb-1.5">Email Officiel</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background-secondary text-foreground-muted min-h-[44px] cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block font-bold text-navy mb-1.5">Téléphone / WhatsApp</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
              />
            </div>
          </div>
        </div>

        {/* Coordonnées de Paiement des Droits d'Auteur */}
        <div className="space-y-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-gold" />
              Coordonnées de Versement des Redevances
            </h3>
            <span className="text-[10px] text-success font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Règlement direct automatique
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-navy mb-1.5">Banque Domiciliataire</label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
              />
            </div>
            <div>
              <label className="block font-bold text-navy mb-1.5">Code SWIFT / BIC</label>
              <input
                type="text"
                value={swift}
                onChange={(e) => setSWIFT(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-navy mb-1.5">IBAN / RIB National UEMOA</label>
              <input
                type="text"
                value={iban}
                onChange={(e) => setIBAN(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground font-mono focus:ring-2 focus:ring-navy min-h-[44px]"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-bold text-navy mb-1.5">Numéro Mobile Money (MTN MoMo / Moov Money)</label>
              <input
                type="tel"
                value={momoNumber}
                onChange={(e) => setMomoNumber(e.target.value)}
                placeholder="+229 97 00 11 22"
                className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gold text-navy text-xs font-bold hover:bg-gold-light transition-colors flex items-center gap-2 min-h-[44px] shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Enregistrer les Modifications
              </>
            )}
          </button>
        </div>
      </form>

      {/* Formulaire 2 : Changement de Mot de Passe */}
      <form onSubmit={handleChangePassword} className="p-6 sm:p-8 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
        <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider border-b border-border pb-2 flex items-center gap-2">
          <Lock className="w-4 h-4 text-gold" />
          Sécurité &amp; Modification du Mot de Passe
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="block font-bold text-navy mb-1.5">Mot de passe actuel</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
            />
          </div>
          <div>
            <label className="block font-bold text-navy mb-1.5">Nouveau mot de passe</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 caractères"
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
            />
          </div>
          <div>
            <label className="block font-bold text-navy mb-1.5">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={changingPassword || !oldPassword || !newPassword}
            className="px-6 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[44px] shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {changingPassword ? "Mise à jour..." : "Mettre à jour le mot de passe"}
          </button>
        </div>
      </form>
    </div>
  );
}
