"use client";

import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { getProfile, updateProfile, UserProfileData } from "@/lib/services/auth";
import { ProfileAvatarCard } from "@/components/features/profile/profile-avatar-card";
import { ChangePasswordCard } from "@/components/features/profile/change-password-card";
import { 
  User, 
  Mail, 
  Phone, 
  Shield, 
  Save, 
  Lock,
  Bell,
  CheckCircle,
  Eye,
  EyeOff,
  Camera,
  GraduationCap,
  Sparkles,
  Feather
} from "lucide-react";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  // Form profile states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+229");
  const [country, setCountry] = useState("BJ");
  const [penName, setPenName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [institutionName, setInstitutionName] = useState<string | null>(null);

  // Avatar file
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preference notifications
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const res = await getProfile();
      if (res.success && res.data) {
        setFirstName(res.data.first_name || "");
        setLastName(res.data.last_name || "");
        setEmail(res.data.email || "");
        setPhone(res.data.phone || "+229");
        setCountry(res.data.country || "BJ");
        setPenName(res.data.pen_name || "");
        setBio(res.data.bio || "");
        setAvatarUrl(res.data.avatar_url || null);
        setInstitutionName(res.data.institution_name || null);
      } else if (user) {
        setFirstName(user.first_name || "");
        setLastName(user.last_name || "");
        setEmail(user.email || "");
        setPhone((user as any).phone || "+229");
        setCountry((user as any).country || "BJ");
      }
      setLoading(false);
    }
    loadData();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const formData = new FormData();
      formData.append("first_name", firstName);
      formData.append("last_name", lastName);
      formData.append("phone", phone);
      formData.append("country", country);
      formData.append("pen_name", penName);
      formData.append("bio", bio);

      const res = await updateProfile(formData);
      if (res.success) {
        toast.success(res.message || "Profil mis à jour avec succès !");
        if (res.data?.avatar_url) {
          setAvatarUrl(res.data.avatar_url);
        }
        refreshUser?.();
      } else {
        toast.error(res.error || "Erreur lors de la mise à jour.");
      }
    } catch {
      toast.error("Une erreur inattendue est survenue.");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="space-y-1 border-b border-border pb-4">
        <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-gold" />
          Espace Personnel & Sécurité
        </div>
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy">Mon Profil</h1>
        <p className="text-xs text-foreground-muted">Gérez vos informations personnelles, photo de profil et paramètres de sécurité.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Colonne Principale : Formulaire de Profil */}
        <div className="md:col-span-8 space-y-6">
          
          {/* Photo de Profil */}
          <ProfileAvatarCard
            currentAvatarUrl={previewUrl || avatarUrl}
            userFullName={`${firstName} ${lastName}`.trim() || user?.first_name || "Utilisateur"}
            userRole={user?.role}
            onAvatarUpdated={(newUrl) => {
              setAvatarUrl(newUrl);
            }}
          />

          {/* Carte Profil */}
          <form onSubmit={handleSaveProfile} className="bg-background border border-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">

            {/* Champs d'Informations Personnelles */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                <User className="w-4 h-4 text-gold" />
                Coordonnées
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-navy">Prénom *</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-navy min-h-[44px]"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-navy">Nom *</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-navy min-h-[44px]"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-navy">Adresse Email</label>
                  <input 
                    type="email" 
                    disabled
                    className="w-full bg-background-secondary border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground-muted cursor-not-allowed min-h-[44px]"
                    value={email}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-navy">Téléphone (Mobile Money & Alertes)</label>
                  <input 
                    type="text"
                    placeholder="+229 97 00 00 00"
                    className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-navy min-h-[44px]"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              {/* Champs Auteur */}
              {(user?.role === "author" || penName || bio) && (
                <div className="pt-4 border-t border-border space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                    <Feather className="w-4 h-4 text-gold" />
                    Profil Éditorial & Auteur
                  </h4>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-navy">Nom de Plume / Signature Publique</label>
                    <input 
                      type="text"
                      placeholder="Ex: Pr. Jean-Marc KOUADIO"
                      className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-navy min-h-[44px]"
                      value={penName}
                      onChange={(e) => setPenName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-navy">Biographie Courte (Notice Catalogue)</label>
                    <textarea 
                      rows={3}
                      placeholder="Présentez votre parcours académique, vos thèmes de recherche..."
                      className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-navy"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>
                </div>
              )}

            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="inline-flex items-center gap-2 bg-navy hover:bg-navy-hover text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-xl shadow-xs disabled:opacity-50 transition-colors min-h-[44px] cursor-pointer"
              >
                <Save className="w-4 h-4 text-gold" />
                {savingProfile ? "Enregistrement..." : "Sauvegarder les modifications"}
              </button>
            </div>
          </form>

          {/* Sécurité & Mot de Passe */}
          <ChangePasswordCard />
        </div>

        {/* Colonne Latérale : Préférences & Notifications */}
        <div className="md:col-span-4 bg-background border border-border rounded-3xl shadow-xs p-6 space-y-6">
          <div className="space-y-1 border-b border-border pb-3">
            <h3 className="font-serif text-base font-bold text-navy flex items-center gap-1.5">
              <Bell className="w-5 h-5 text-gold" />
              Notifications & Alertes
            </h3>
            <p className="text-[11px] text-foreground-muted">Choisissez vos canaux de réception</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <input 
                type="checkbox" 
                id="emailNotif"
                className="w-4 h-4 cursor-pointer mt-1"
                checked={emailNotif}
                onChange={(e) => setEmailNotif(e.target.checked)}
              />
              <div className="space-y-0.5">
                <label htmlFor="emailNotif" className="text-xs font-bold text-navy cursor-pointer block">
                  Alertes par e-mail
                </label>
                <p className="text-[11px] text-foreground-muted leading-relaxed">
                  Reçus de paiements, validations de manuscrits et relevés de droits d&apos;auteur.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 pt-3 border-t border-border">
              <input 
                type="checkbox" 
                id="smsNotif"
                className="w-4 h-4 cursor-pointer mt-1"
                checked={smsNotif}
                onChange={(e) => setSmsNotif(e.target.checked)}
              />
              <div className="space-y-0.5">
                <label htmlFor="smsNotif" className="text-xs font-bold text-navy cursor-pointer block">
                  Alertes SMS & WhatsApp
                </label>
                <p className="text-[11px] text-foreground-muted leading-relaxed">
                  Notifications instantanées lors de l&apos;expédition de vos commandes papier ou activation de vos bouquets.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
