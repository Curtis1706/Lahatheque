"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { 
  User, 
  ArrowLeft, 
  Save, 
  ShieldCheck, 
  Lock, 
  Building2,
  CheckCircle2, 
  Camera, 
  Scale
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getProfile, updateProfile, changePassword } from "@/lib/services/auth";
import { toast } from "sonner";

export default function LegalReviewerProfilePage() {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [firstName, setFirstName] = useState(user?.first_name || "Maitre Patrice");
  const [lastName, setLastName] = useState(user?.last_name || "HOUNKPONOU");
  const [affiliation, setAffiliation] = useState("Direction des Affaires Juridiques & Propriété Intellectuelle — LAHA Éditions");
  const [email, setEmail] = useState(user?.email || "juridique@lahatheque.bj");
  const [phone, setPhone] = useState("+229 97 22 33 44");
  const [avatarPreview, setAvatarPreview] = useState<string | null>((user as any)?.avatar_url || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [saving, setSaving] = useState(false);

  // Mot de passe
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    async function loadData() {
      const profData = await getProfile();
      if (profData.success && profData.data) {
        const u = profData.data;
        if (u.first_name) setFirstName(u.first_name);
        if (u.last_name) setLastName(u.last_name);
        if (u.email) setEmail(u.email);
        if (u.phone) setPhone(u.phone);
        if (u.university_affiliation) setAffiliation(u.university_affiliation);
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
    fd.append("university_affiliation", affiliation);
    fd.append("phone", phone);
    if (avatarFile) {
      fd.append("avatar", avatarFile);
    }

    const res = await updateProfile(fd);
    setSaving(false);

    if (res.success) {
      toast.success("Profil juridique mis à jour avec succès.");
    } else {
      toast.error(res.error || "Erreur lors de la mise à jour du profil.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Les deux nouveaux mots de passe ne correspondent pas.");
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
      confirm_password: confirmPassword
    });
    setChangingPassword(false);

    if (res.success) {
      toast.success("Mot de passe modifié avec succès.");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      toast.error(res.error || "Erreur lors du changement de mot de passe.");
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/legal-reviewer" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Mon Profil Juriste</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link href="/legal-reviewer" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour au tableau de bord
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
            <Scale className="w-4 h-4 text-gold" />
            Paramètres &amp; Sécurité Juriste
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Profil &amp; Habilitations Juridiques
          </h1>
          <p className="text-xs text-foreground-muted mt-1">
            Informations officielles, gestion des accès et sécurité du compte juridique.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne Principale : Informations Officielles */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveProfile} className="p-6 sm:p-8 rounded-3xl bg-background border border-border space-y-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <User className="w-4 h-4 text-gold" />
              <h2 className="font-serif font-bold text-navy text-base">Identité &amp; Titre Professionnel</h2>
            </div>

            {/* Photo / Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-20 h-20 rounded-2xl bg-navy/10 border-2 border-gold/40 flex items-center justify-center overflow-hidden text-navy font-serif font-bold text-xl">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{firstName.charAt(0)}{lastName.charAt(0)}</span>
                  )}
                </div>
                <div className="absolute inset-0 bg-navy/50 text-white rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className="w-5 h-5" />
                </div>
              </div>
              <input 
                ref={fileInputRef} 
                type="file" 
                accept="image/png,image/jpeg,image/webp" 
                onChange={handleAvatarChange} 
                className="hidden" 
              />
              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl border border-border text-navy text-xs font-bold hover:bg-background-secondary transition-colors cursor-pointer"
                >
                  Changer le portrait officiel
                </button>
                <p className="text-[11px] text-foreground-muted mt-1">PNG, JPG ou WEBP (Max 5 Mo)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-navy mb-1.5">Prénom Officiel *</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-navy mb-1.5">Nom Officiel (Patronyme) *</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-navy mb-1.5">Affiliation &amp; Titre Juridique</label>
                <input
                  type="text"
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  placeholder="Ex: Direction des Affaires Juridiques — LAHA Éditions / Barreau de Cotonou"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                />
              </div>

              <div>
                <label className="block font-bold text-navy mb-1.5">E-mail Professionnel *</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background-secondary text-foreground-muted min-h-[44px] cursor-not-allowed"
                />
                <p className="text-[10px] text-foreground-muted mt-1">Géré par l&apos;administrateur système.</p>
              </div>

              <div>
                <label className="block font-bold text-navy mb-1.5">Téléphone / Contact Direct</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-border">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-all flex items-center gap-2 shadow-sm min-h-[44px] cursor-pointer"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Enregistrer les modifications
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Colonne Latérale : Sécurité & Mot de Passe */}
        <div className="space-y-6">
          <form onSubmit={handleChangePassword} className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Lock className="w-4 h-4 text-gold" />
              <h2 className="font-serif font-bold text-navy text-sm">Changer de Mot de Passe</h2>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-navy mb-1">Mot de passe actuel *</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-navy mb-1">Nouveau mot de passe *</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 caractères"
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-navy mb-1">Confirmer le mot de passe *</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={changingPassword || !oldPassword || !newPassword}
              className="w-full mt-2 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[44px] flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {changingPassword ? (
                <span className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-gold" />
                  Mettre à jour le mot de passe
                </>
              )}
            </button>
          </form>

          {/* Badge Rôle & Conformité */}
          <div className="p-5 rounded-3xl bg-background-secondary border border-border space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-gold" />
              <span className="font-bold text-navy">Habilitation Juridique Active</span>
            </div>
            <p className="text-[11px] text-foreground-muted leading-relaxed">
              Accès certifié à la GED des contrats, à l&apos;attribution des droits d&apos;auteur et au journal des relances.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
