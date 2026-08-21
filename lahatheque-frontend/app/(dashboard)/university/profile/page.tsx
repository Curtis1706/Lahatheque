"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  ArrowLeft,
  CheckCircle2,
  Save,
  Lock,
  DollarSign,
  ShieldCheck,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { FacultyManager } from "@/components/features/university/faculty-manager";
import { ProfileAvatarCard } from "@/components/features/profile/profile-avatar-card";
import { ChangePasswordCard } from "@/components/features/profile/change-password-card";
import {
  getUniversityProfile,
  updateUniversityProfile,
  getUniversityFaculties,
  addUniversityFaculty,
  deleteUniversityFaculty,
} from "@/lib/services/university";
import type {
  UniversityProfileData,
  UniversityFacultyData,
} from "@/lib/types/university";

export default function UniversityProfilePage() {
  const [profile, setProfile] = useState<UniversityProfileData | null>(null);
  const [faculties, setFaculties] = useState<UniversityFacultyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [profData, facData] = await Promise.all([
        getUniversityProfile(),
        getUniversityFaculties(),
      ]);
      setProfile(profData);
      setFaculties(facData);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setSaving(true);
    try {
      const updated = await updateUniversityProfile(profile);
      setProfile(updated);
      toast.success("Profil de l'université mis à jour avec succès.");
    } catch {
      toast.error("Erreur lors de la sauvegarde du profil.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddFaculty = async (faculty: Omit<UniversityFacultyData, "id">) => {
    const newFac = await addUniversityFaculty(faculty);
    setFaculties((prev) => [...prev, newFac]);
    return newFac;
  };

  const handleDeleteFaculty = async (id: string) => {
    const ok = await deleteUniversityFaculty(id);
    if (ok) {
      setFaculties((prev) => prev.filter((f) => f.id !== id));
    }
    return ok;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("Le nouveau mot de passe doit comporter au moins 8 caractères.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setChangingPassword(true);
    await new Promise((r) => setTimeout(r, 600));
    setChangingPassword(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    toast.success("Mot de passe sécurisé modifié avec succès.");
  };

  if (loading || !profile) {
    return (
      <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 max-w-5xl mx-auto animate-pulse">
        <div className="h-8 bg-background-secondary rounded-xl w-1/3" />
        <div className="h-64 bg-background-secondary rounded-3xl" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-8 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/university" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <span className="text-navy font-semibold">Profil &amp; Paramètres</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-6">
        <Link href="/university" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-2">
          <ArrowLeft className="w-3.5 h-3.5" />
          Vue d&apos;ensemble
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
          <Building2 className="w-4 h-4 text-gold" />
          Fiche de l&apos;Établissement &amp; Structure Académique
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
          Configuration &amp; Coordonnées de l&apos;Université
        </h1>
        <p className="text-xs text-foreground-muted mt-1">
          Gérez l&apos;identité officielle de votre établissement, vos facultés rattachées et vos coordonnées de reversement.
        </p>
      </div>

      {/* Logo & Photo de l'Établissement */}
      <ProfileAvatarCard
        currentAvatarUrl={profile?.logo_url}
        userFullName={profile?.name || "Université"}
        userRole="university"
        onAvatarUpdated={(newUrl) => {
          setProfile((prev) => (prev ? { ...prev, logo_url: newUrl || undefined } : prev));
        }}
      />

      {/* 1. Formulaire Identité & Contact */}
      <form onSubmit={handleSaveProfile} className="space-y-6">
        <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider border-b border-border pb-3">
            <Building2 className="w-4 h-4 text-gold" />
            1. Informations Officielles de l&apos;Établissement
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">
                Nom Officiel de l&apos;Université <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[40px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">
                Sigle / Acronyme <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={profile.short_name}
                onChange={(e) => setProfile({ ...profile, short_name: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy uppercase min-h-[40px]"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">
                Adresse Géographique du Campus
              </label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[40px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">
                Ville / Campus
              </label>
              <input
                type="text"
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[40px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">
                Nom du Recteur / Président
              </label>
              <input
                type="text"
                value={profile.rector_name}
                onChange={(e) => setProfile({ ...profile, rector_name: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[40px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">
                Directeur Affaires Académiques
              </label>
              <input
                type="text"
                value={profile.academic_director_name}
                onChange={(e) => setProfile({ ...profile, academic_director_name: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[40px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">
                E-mail Officiel de Contact
              </label>
              <input
                type="email"
                value={profile.contact_email}
                onChange={(e) => setProfile({ ...profile, contact_email: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[40px]"
              />
            </div>
          </div>
        </div>

        {/* 2. Coordonnées Bancaires Trésorerie (Redevances 15%) */}
        <div className="p-6 rounded-3xl bg-background border border-border space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider border-b border-border pb-3">
            <DollarSign className="w-4 h-4 text-gold" />
            Coordonnées Bancaires de Trésorerie (Reversement des 15%)
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">
                Banque / Domiciliation Trésor Public
              </label>
              <input
                type="text"
                value={profile.bank_name}
                onChange={(e) => setProfile({ ...profile, bank_name: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[40px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">
                Code SWIFT / BIC
              </label>
              <input
                type="text"
                value={profile.bank_swift}
                onChange={(e) => setProfile({ ...profile, bank_swift: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[40px]"
              />
            </div>

            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">
                RIB / Numéro de Compte Trésorerie
              </label>
              <input
                type="text"
                value={profile.bank_iban}
                onChange={(e) => setProfile({ ...profile, bank_iban: e.target.value })}
                className="w-full px-3.5 py-2 text-xs font-mono bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy min-h-[40px]"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 shadow-xs min-h-[44px] disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4 text-gold" />
              )}
              <span>Enregistrer les Coordonnées</span>
            </button>
          </div>
        </div>
      </form>

      {/* 3. Gestionnaire des Facultés & UFRs */}
      <FacultyManager
        faculties={faculties}
        onAddFaculty={handleAddFaculty}
        onDeleteFaculty={handleDeleteFaculty}
      />

      {/* 4. Sécurité & Changement de Mot de Passe */}
      <ChangePasswordCard />
    </div>
  );
}
