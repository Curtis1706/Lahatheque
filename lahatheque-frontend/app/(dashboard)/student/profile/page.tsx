"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  User,
  ArrowLeft,
  Save,
  AlertCircle,
  Mail,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { InlineLoader } from "@/components/ui/page-loader";
import { PhoneInput } from "@/components/ui/phone-input";
import { useAuth } from "@/hooks/use-auth";
import {
  getStudentProfile,
  updateStudentProfile,
  type StudentProfileAPI,
} from "@/lib/services/student";
import { ProfileAvatarCard } from "@/components/features/profile/profile-avatar-card";
import { ChangePasswordCard } from "@/components/features/profile/change-password-card";

export default function StudentProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<StudentProfileAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError(null);
      try {
        const data = await getStudentProfile();
        setProfile(data);
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setPhone(data.phone || "");
        setCountry(data.country || "");
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "Erreur de chargement du profil"
        );
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateStudentProfile({
        first_name: firstName,
        last_name: lastName,
        phone,
        country,
      });
      setProfile((prev) => (prev ? { ...prev, ...updated } : prev));
      toast.success("Vos informations de profil ont été enregistrées avec succès.");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la sauvegarde du profil."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/student" className="hover:text-navy">
          Mon Espace
        </Link>
        <span>/</span>
        <span className="text-navy font-semibold">Profil</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-5">
        <Link
          href="/student"
          className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
          <User className="w-4 h-4 text-gold" />
          Compte Client &amp; Lecteur
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
          Profil &amp; Préférences
        </h1>
        <p className="text-xs text-foreground-muted mt-1">
          Gérez vos coordonnées personnelles, vos identifiants et votre mot de passe de sécurité.
        </p>
      </div>

      {/* ── Erreur ────────────────────────────────────────────────────── */}
      {error && (
        <div className="p-4 rounded-2xl border border-error/30 bg-error/10 text-error text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Skeleton ──────────────────────────────────────────────────── */}
      {loading && (
        <div className="space-y-4">
          <div className="h-14 rounded-2xl bg-navy/10 animate-pulse" />
          <div className="h-28 rounded-3xl bg-navy/10 animate-pulse" />
          <div className="h-14 rounded-2xl bg-navy/10 animate-pulse" />
        </div>
      )}

      {/* ── Formulaire Infos ──────────────────────────────────────────── */}
      {!loading && profile && (
        <>
          {/* Photo de Profil */}
          <ProfileAvatarCard
            currentAvatarUrl={profile.avatar}
            userFullName={`${firstName || profile.first_name || ""} ${lastName || profile.last_name || ""}`.trim() || user?.first_name || "Lecteur"}
            userRole="student"
            onAvatarUpdated={(newUrl) => {
              setProfile((prev) => (prev ? { ...prev, avatar: newUrl } : prev));
            }}
          />

          {/* Identité du compte */}
          <div className="p-5 rounded-3xl bg-background-secondary border border-border space-y-2">
            <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider">
              Identifiant de Connexion
            </h3>
            <div className="flex items-center gap-2 text-xs">
              <Mail className="w-4 h-4 text-gold shrink-0" />
              <span className="font-mono text-navy font-bold">
                {profile.email}
              </span>
              <span className="text-foreground-muted">(adresse email sécurisée)</span>
            </div>
          </div>

          {/* Formulaire modifiable */}
          <form
            onSubmit={handleSave}
            className="p-6 rounded-3xl bg-background border border-border shadow-xs space-y-5"
          >
            <h3 className="font-serif font-bold text-navy text-sm uppercase tracking-wider border-b border-border pb-2">
              Coordonnées Personnelles
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="first-name"
                  className="block text-[10px] font-bold text-navy uppercase tracking-wider"
                >
                  Prénom *
                </label>
                <input
                  id="first-name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="last-name"
                  className="block text-[10px] font-bold text-navy uppercase tracking-wider"
                >
                  Nom de Famille *
                </label>
                <input
                  id="last-name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
                  required
                />
              </div>

              <div className="space-y-1">
                <label
                  className="block text-[10px] font-bold text-navy uppercase tracking-wider"
                >
                  Numéro de Téléphone (Mobile Money / WhatsApp)
                </label>
                <PhoneInput
                  value={phone}
                  onChange={setPhone}
                  className="bg-background-secondary min-h-[44px]"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="country"
                  className="block text-[10px] font-bold text-navy uppercase tracking-wider"
                >
                  Pays de Résidence
                </label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="country"
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Bénin (BJ)"
                    className="w-full pl-9 pr-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl text-navy font-semibold focus:outline-none focus:border-gold min-h-[44px]"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 shadow-xs min-h-[44px] disabled:opacity-60 cursor-pointer"
              >
                {saving ? (
                  <InlineLoader size={16} />
                ) : (
                  <Save className="w-4 h-4 text-gold" />
                )}
                {saving ? "Enregistrement..." : "Enregistrer les modifications"}
              </button>
            </div>
          </form>

          {/* Sécurité & Mot de passe */}
          <ChangePasswordCard />
        </>
      )}
    </div>
  );
}
