"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  User,
  Mail,
  Phone,
  Save,
  Bell,
  Warehouse,
  CheckCircle2,
  ArrowLeft,
  MapPin,
  ShieldCheck,
  Building,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getProfile, updateProfile } from "@/lib/services/auth";
import { getEntrepots, type Entrepot } from "@/lib/services/manager";
import { toast } from "sonner";
import { ProfileAvatarCard } from "@/components/features/profile/profile-avatar-card";
import { ChangePasswordCard } from "@/components/features/profile/change-password-card";
import { InlineLoader } from "@/components/ui/page-loader";

export default function ManagerProfilePage() {
  const { user, refreshUser } = useAuth();

  // Profile fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+229 97 00 11 22");
  const [country, setCountry] = useState("BJ");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Affectations & Entrepôts
  const [entrepots, setEntrepots] = useState<Entrepot[]>([]);
  const [primaryWarehouse, setPrimaryWarehouse] = useState("ENT-BJ-01");

  // Notifications logistiques
  const [notifCriticalOutage, setNotifCriticalOutage] = useState(true);
  const [notifLowStock, setNotifLowStock] = useState(true);
  const [notifNewOrder, setNotifNewOrder] = useState(true);
  const [notifCarrierDispatch, setNotifCarrierDispatch] = useState(true);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

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

      {/* Photo de Profil */}
      <ProfileAvatarCard
        currentAvatarUrl={avatarUrl}
        userFullName={`${firstName} ${lastName}`.trim() || "Gestionnaire"}
        userRole="manager"
        onAvatarUpdated={(newUrl) => setAvatarUrl(newUrl)}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Colonne Principale : Formulaire de Profil & Entrepôts */}
        <div className="lg:col-span-8 space-y-6">
          {/* Carte Coordonnées */}
          <form
            onSubmit={handleSaveProfile}
            className="bg-background border border-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-6"
          >
            {/* Champs Coordonnées */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                <User className="w-4 h-4 text-gold" />
                Informations Personnelles &amp; Contact
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
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 shadow-sm min-h-[44px] disabled:opacity-50 cursor-pointer"
              >
                {savingProfile ? (
                  <InlineLoader size={16} />
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

          {/* Modification Sécurisée du Mot de Passe */}
          <ChangePasswordCard />
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
