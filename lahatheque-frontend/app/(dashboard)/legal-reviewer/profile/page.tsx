"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  User, 
  ArrowLeft, 
  Save, 
  Building2,
  Scale
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getProfile, updateProfile } from "@/lib/services/auth";
import { toast } from "sonner";
import { ProfileAvatarCard } from "@/components/features/profile/profile-avatar-card";
import { ChangePasswordCard } from "@/components/features/profile/change-password-card";
import { InlineLoader } from "@/components/ui/page-loader";

export default function LegalReviewerProfilePage() {
  const { user, refreshUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [affiliation, setAffiliation] = useState((user as any)?.university_affiliation || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>((user as any)?.avatar_url || null);

  const [saving, setSaving] = useState(false);

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
        if (u.avatar_url) setAvatarUrl(u.avatar_url);
      }
    }
    loadData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const fd = new FormData();
    fd.append("first_name", firstName);
    fd.append("last_name", lastName);
    fd.append("university_affiliation", affiliation);
    fd.append("phone", phone);

    const res = await updateProfile(fd);
    setSaving(false);

    if (res.success) {
      toast.success("Profil juridique mis à jour avec succès.");
      refreshUser?.();
    } else {
      toast.error(res.error || "Erreur lors de la mise à jour du profil.");
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

      {/* Photo de Profil */}
      <ProfileAvatarCard
        currentAvatarUrl={avatarUrl}
        userFullName={`${firstName} ${lastName}`.trim() || "Juriste"}
        userRole="legal_reviewer"
        onAvatarUpdated={(newUrl) => setAvatarUrl(newUrl)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne Principale : Informations Officielles */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveProfile} className="p-6 sm:p-8 rounded-3xl bg-background border border-border space-y-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <User className="w-4 h-4 text-gold" />
              <h2 className="font-serif font-bold text-navy text-base">Identité &amp; Titre Professionnel</h2>
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
            </div>

            <div className="text-xs">
              <label className="block font-bold text-navy mb-1.5">Rattachement Institutionnel / Organisme *</label>
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3 top-3.5 text-foreground-muted" />
                <input
                  type="text"
                  value={affiliation}
                  onChange={(e) => setAffiliation(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                  required
                />
              </div>
              <p className="text-[11px] text-foreground-muted mt-1">Utilisé dans la signature des contrats et cessions de droits d&apos;auteur.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-navy mb-1.5">Adresse Email Professionnelle *</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background-secondary text-foreground-muted min-h-[44px] cursor-not-allowed"
                />
                <p className="text-[10px] text-foreground-muted mt-1">Pour changer d&apos;email, contactez l&apos;administrateur système.</p>
              </div>

              <div>
                <label className="block font-bold text-navy mb-1.5">Téléphone d&apos;Astreinte / WhatsApp</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-gold text-navy font-bold hover:bg-gold-light transition-colors min-h-[44px] flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 text-xs"
              >
                {saving ? (
                  <InlineLoader size={16} />
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
          <ChangePasswordCard />

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
