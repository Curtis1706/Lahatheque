"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Shield,
  Save,
  Lock,
  Bell,
  Camera,
  Warehouse,
  Truck,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  MapPin,
  Clock,
  ShieldCheck,
  Building,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getProfile, updateProfile, changePassword } from "@/lib/services/auth";
import { getEntrepots, type Entrepot } from "@/lib/services/manager";
import { toast } from "sonner";

export default function ManagerProfilePage() {
  const { user, refreshUser } = useAuth();

  // Profile fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+229 97 00 11 22");
  const [country, setCountry] = useState("BJ");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Affectations & Entrepôts
  const [entrepots, setEntrepots] = useState<Entrepot[]>([]);
  const [primaryWarehouse, setPrimaryWarehouse] = useState("ENT-BJ-01");

  // Notifications logistiques
  const [notifCriticalOutage, setNotifCriticalOutage] = useState(true);
  const [notifLowStock, setNotifLowStock] = useState(true);
  const [notifNewOrder, setNotifNewOrder] = useState(true);
  const [notifCarrierDispatch, setNotifCarrierDispatch] = useState(true);

  // Mot de passe
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [profRes, entrepotList] = await Promise.all([
          getProfile(),
          getEntrepots(),
        ]);

        if (profRes.success && profRes.data) {
          setFirstName(profRes.data.first_name || "");
          setLastName(profRes.data.last_name || "");
          setEmail(profRes.data.email || "");
          setPhone(profRes.data.phone || "+229 97 00 11 22");
          setCountry(profRes.data.country || "BJ");
          setAvatarUrl(profRes.data.avatar_url || null);
        } else if (user) {
          setFirstName(user.first_name || "Gestionnaire");
          setLastName(user.last_name || "Stock");
          setEmail(user.email || "");
        }

        setEntrepots(entrepotList);
        if (entrepotList.length > 0) {
          setPrimaryWarehouse(entrepotList[0].code);
        }
      } catch (err) {
        console.error("Erreur chargement profil gestionnaire", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const formData = new FormData();
      formData.append("first_name", firstName);
      formData.append("last_name", lastName);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("country", country);

      if (selectedFile) {
        formData.append("avatar", selectedFile);
      }

      const res = await updateProfile(formData);
      if (res.success) {
        toast.success(res.message || "Profil logistique mis à jour avec succès !");
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

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Le nouveau mot de passe et sa confirmation ne correspondent pas.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Le mot de passe doit comporter au moins 8 caractères.");
      return;
    }

    setSavingPassword(true);
    try {
      const res = await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      if (res.success) {
        toast.success(res.message || "Votre mot de passe a été modifié avec succès !");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(res.error || "Erreur lors de la modification du mot de passe.");
      }
    } catch {
      toast.error("Impossible de contacter le serveur.");
    } finally {
      setSavingPassword(false);
    }
  };

  const displayAvatar = previewUrl || avatarUrl;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <Link
          href="/manager"
          className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour au tableau de bord
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
          <Warehouse className="w-4 h-4 text-gold" />
          Gestionnaire Logistique &amp; Expéditions
        </div>
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy">
          Mon Profil Opérationnel
        </h1>
        <p className="text-xs text-foreground-muted mt-1">
          Paramètres de votre compte gestionnaire, coordonnées d&apos;astreinte et préférences d&apos;alertes de stock.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Colonne Principale : Formulaire de Profil & Entrepôts */}
        <div className="lg:col-span-8 space-y-6">
          {/* Carte Coordonnées */}
          <form
            onSubmit={handleSaveProfile}
            className="bg-background border border-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-6"
          >
            {/* Section Photo de Profil & Statut */}
            <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-border">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gold/40 bg-navy/5 flex items-center justify-center shadow-md">
                  {displayAvatar ? (
                    <img
                      src={displayAvatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-serif font-bold text-navy">
                      {(firstName[0] || "G").toUpperCase()}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-navy text-white hover:bg-navy-hover shadow-md transition-transform hover:scale-105 cursor-pointer"
                  title="Modifier la photo"
                >
                  <Camera className="w-4 h-4 text-gold" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                />
              </div>

              <div className="space-y-1 text-center sm:text-left min-w-0">
                <h3 className="font-serif font-bold text-navy text-lg truncate">
                  {firstName} {lastName || ""}
                </h3>
                <p className="text-xs text-foreground-muted truncate">{email}</p>
                <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
                  <span className="px-2.5 py-0.5 rounded-full bg-navy/10 text-navy text-[11px] font-bold uppercase tracking-wider border border-navy/20 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                    Gestionnaire Stock &amp; Livraison
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-gold/15 text-gold text-[11px] font-bold flex items-center gap-1 border border-gold/30">
                    <Warehouse className="w-3 h-3" />
                    Habilité Multi-Entrepôts
                  </span>
                </div>
              </div>
            </div>

            {/* Champs Coordonnées */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                <User className="w-4 h-4 text-gold" />
                Informations Personnelles
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-navy">Prénom *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-background-secondary border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:outline-none focus:border-gold min-h-[44px]"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-navy">Nom de famille *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-background-secondary border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:outline-none focus:border-gold min-h-[44px]"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-navy">Adresse e-mail *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="nom@exemple.com"
                      className="w-full bg-background-secondary border border-border rounded-xl pl-9 pr-3 py-3 text-xs sm:text-sm text-foreground focus:outline-none focus:border-gold min-h-[44px]"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-foreground-muted">Adresse e-mail de contact (personnelle ou professionnelle).</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-navy">Téléphone d&apos;astreinte *</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      required
                      placeholder="+229 97 00 00 00"
                      className="w-full bg-background-secondary border border-border rounded-xl pl-9 pr-3 py-3 text-xs sm:text-sm text-foreground focus:outline-none focus:border-gold min-h-[44px]"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-foreground-muted">Utilisé pour la coordination transporteurs.</p>
                </div>
              </div>
            </div>

            {/* Entrepôt Principal Référent */}
            <div className="space-y-4 pt-2 border-t border-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                <Building className="w-4 h-4 text-gold" />
                Affectation Logistique Principale
              </h4>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy">Entrepôt de Rattachement Principal</label>
                <select
                  value={primaryWarehouse}
                  onChange={(e) => setPrimaryWarehouse(e.target.value)}
                  className="w-full bg-background-secondary border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:outline-none focus:border-gold min-h-[44px]"
                >
                  {entrepots.map((e) => (
                    <option key={e.id} value={e.code}>
                      {e.nom} ({e.ville}, {e.pays}) — Code : {e.code}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-foreground-muted">
                  Définit l&apos;entrepôt pré-sélectionné par défaut lors de vos saisies de mouvements.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingProfile}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 shadow-sm min-h-[44px] disabled:opacity-50"
              >
                {savingProfile ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 text-gold" />
                    Enregistrer les modifications
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Préférences d'Alertes Logistiques */}
          <div className="bg-background border border-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Bell className="w-4 h-4 text-gold" />
              <h3 className="font-serif font-bold text-navy text-base">
                Préférences d&apos;Alertes &amp; Notifications
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-2xl bg-background-secondary hover:bg-background-secondary/80 transition-colors border border-border">
                <input
                  type="checkbox"
                  checked={notifCriticalOutage}
                  onChange={(e) => setNotifCriticalOutage(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-navy rounded accent-navy"
                />
                <div>
                  <p className="font-bold text-navy">Ruptures de stock critiques (0 exemplaire)</p>
                  <p className="text-foreground-muted text-[11px]">
                    Recevoir une alerte prioritaire immédiate dès qu&apos;un livre physique est épuisé.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-2xl bg-background-secondary hover:bg-background-secondary/80 transition-colors border border-border">
                <input
                  type="checkbox"
                  checked={notifLowStock}
                  onChange={(e) => setNotifLowStock(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-navy rounded accent-navy"
                />
                <div>
                  <p className="font-bold text-navy">Passage sous le seuil d&apos;alerte de réassort</p>
                  <p className="text-foreground-muted text-[11px]">
                    Notification quotidienne résumant les ouvrages nécessitant un bon de réapprovisionnement.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-2xl bg-background-secondary hover:bg-background-secondary/80 transition-colors border border-border">
                <input
                  type="checkbox"
                  checked={notifNewOrder}
                  onChange={(e) => setNotifNewOrder(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-navy rounded accent-navy"
                />
                <div>
                  <p className="font-bold text-navy">Nouvelles commandes physiques à préparer</p>
                  <p className="text-foreground-muted text-[11px]">
                    Notification dès validation du paiement d&apos;un panier contenant un livre papier.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-2xl bg-background-secondary hover:bg-background-secondary/80 transition-colors border border-border">
                <input
                  type="checkbox"
                  checked={notifCarrierDispatch}
                  onChange={(e) => setNotifCarrierDispatch(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-navy rounded accent-navy"
                />
                <div>
                  <p className="font-bold text-navy">Prise en charge transporteur &amp; suivi de colis</p>
                  <p className="text-foreground-muted text-[11px]">
                    Mise à jour automatique de statut lors du scan de prise en charge par DHL/Chronopost.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Modification du Mot de Passe */}
          <form
            onSubmit={handleSavePassword}
            className="bg-background border border-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-6"
          >
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif font-bold text-navy text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-gold" />
                Sécurité &amp; Mot de Passe
              </h3>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-gold hover:text-gold-dark font-medium flex items-center gap-1"
              >
                {showPassword ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" /> Masquer
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" /> Afficher
                  </>
                )}
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy">Mot de passe actuel *</label>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  className="w-full bg-background-secondary border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:outline-none focus:border-gold min-h-[44px]"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-navy">Nouveau mot de passe *</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Min. 8 caractères"
                    className="w-full bg-background-secondary border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:outline-none focus:border-gold min-h-[44px]"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-navy">Confirmer le nouveau mot de passe *</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    className="w-full bg-background-secondary border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:outline-none focus:border-gold min-h-[44px]"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingPassword || !newPassword || !currentPassword}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 shadow-sm min-h-[44px] disabled:opacity-50"
              >
                {savingPassword ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-gold" />
                    Changer le mot de passe
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Colonne Latérale : Habilitations & Entrepôts Actifs */}
        <div className="lg:col-span-4 space-y-6">
          {/* Badge de Droits & Habilitations */}
          <div className="bg-navy text-white rounded-3xl p-6 shadow-md space-y-4 border border-navy-hover">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-gold" />
              <h3 className="font-serif font-bold text-base">Habilitations Logistiques</h3>
            </div>
            <p className="text-xs text-navy-light leading-relaxed">
              En tant que Gestionnaire de Stock, votre compte dispose des privilèges opérationnels suivants sur l&apos;ensemble de la chaîne physique :
            </p>
            <ul className="space-y-2.5 text-xs">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <span>Enregistrement des réassorts (entrées de stock &amp; BL)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <span>Ajustements d&apos;inventaire &amp; sorties avaries</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <span>Attribution de transporteurs &amp; N° de suivi</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <span>Escalade directe des ruptures à l&apos;Admin</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <span>Exportation des rapports physiques (sans données financières)</span>
              </li>
            </ul>
          </div>

          {/* Entrepôts Connectés */}
          <div className="bg-background border border-border rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-serif font-bold text-navy text-sm flex items-center gap-2">
                <Warehouse className="w-4 h-4 text-gold" />
                Entrepôts Connectés ({entrepots.length})
              </h3>
            </div>

            <div className="space-y-3">
              {entrepots.map((e) => (
                <div
                  key={e.id}
                  className="p-3 rounded-2xl bg-background-secondary border border-border space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-navy">{e.nom}</p>
                    <span className="font-mono text-[10px] text-gold font-bold">{e.code}</span>
                  </div>
                  <p className="text-foreground-muted flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    {e.ville}, {e.pays}
                  </p>
                  <p className="text-[10px] text-foreground-muted">
                    Responsable : <span className="font-medium text-foreground">{e.responsable_nom}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
