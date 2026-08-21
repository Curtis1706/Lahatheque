"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Building2,
  ArrowLeft,
  Save,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  Bell,
  Lock,
  Camera,
  CheckCircle2,
  Percent,
  Warehouse,
  Truck,
  FileText,
  BadgePercent,
  Eye,
  EyeOff,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { getProfile, updateProfile } from "@/lib/services/auth";
import { ProfileAvatarCard } from "@/components/features/profile/profile-avatar-card";
import { ChangePasswordCard } from "@/components/features/profile/change-password-card";
import {
  getWholesaleCompanyProfile,
  updateWholesaleCompanyProfile,
} from "@/lib/services/wholesaler";
import type { WholesaleCompanyProfile } from "@/lib/types/wholesaler";
import { toast } from "sonner";

export default function WholesalerProfilePage() {
  const { user, refreshUser } = useAuth();

  // Profile data
  const [profile, setProfile] = useState<WholesaleCompanyProfile | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [nifNumber, setNifNumber] = useState("");
  const [rccmNumber, setRccmNumber] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [headquartersAddress, setHeadquartersAddress] = useState("");
  const [warehouseAddress, setWarehouseAddress] = useState("");
  const [city, setCity] = useState("Cotonou");
  const [country, setCountry] = useState("BJ");

  // Notifications
  const [notifyNewBooks, setNotifyNewBooks] = useState(true);
  const [notifyBestSellers, setNotifyBestSellers] = useState(true);
  const [notifyStockRestock, setNotifyStockRestock] = useState(true);
  const [notifyCarrierDispatch, setNotifyCarrierDispatch] = useState(true);

  // Avatar / Logo
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Loading
  const [loading, setLoading] = useState(true);
  const [savingCompany, setSavingCompany] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [authProf, companyProf] = await Promise.all([
          getProfile(),
          getWholesaleCompanyProfile(),
        ]);

        if (companyProf) {
          setProfile(companyProf);
          setCompanyName(companyProf.company_name);
          setTradeName(companyProf.trade_name || "");
          setNifNumber(companyProf.nif_number);
          setRccmNumber(companyProf.rccm_number);
          setContactPerson(companyProf.contact_person);
          setContactEmail(companyProf.contact_email);
          setContactPhone(companyProf.contact_phone);
          setHeadquartersAddress(companyProf.headquarters_address);
          setWarehouseAddress(companyProf.warehouse_address);
          setCity(companyProf.city);
          setCountry(companyProf.country);
        }

        if (authProf.success && authProf.data) {
          if (authProf.data.avatar_url) {
            setAvatarUrl(authProf.data.avatar_url);
          }
        }
      } catch (err) {
        console.error("Erreur de chargement profil grossiste", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingCompany(true);

    try {
      // 1. Mise à jour de l'entité entreprise grossiste
      const updated = await updateWholesaleCompanyProfile({
        company_name: companyName,
        trade_name: tradeName,
        nif_number: nifNumber,
        rccm_number: rccmNumber,
        contact_person: contactPerson,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        headquarters_address: headquartersAddress,
        warehouse_address: warehouseAddress,
        city,
        country,
      });

      // 2. Mise à jour auth contact
      const formData = new FormData();
      formData.append("first_name", contactPerson.split(" ")[0] || "Grossiste");
      formData.append("last_name", contactPerson.split(" ").slice(1).join(" ") || "");
      formData.append("email", contactEmail);
      formData.append("phone", contactPhone);
      formData.append("country", country);

      await updateProfile(formData);
      setProfile(updated);
      toast.success("Informations de facturation et coordonnées d'entreprise enregistrées avec succès !");
      refreshUser?.();
    } catch {
      toast.error("Une erreur est survenue lors de la sauvegarde.");
    } finally {
      setSavingCompany(false);
    }
  };



  const displayAvatar = previewUrl || avatarUrl;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <Link
          href="/wholesaler"
          className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour au tableau de bord
        </Link>
        <div className="flex items-center gap-2 text-xs font-bold text-navy uppercase tracking-wider mb-1">
          <Building2 className="w-4 h-4 text-gold" />
          Compte Partenaire Grossiste &amp; Distributeur Agréé
        </div>
        <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy">
          Profil Entreprise &amp; Facturation B2B
        </h1>
        <p className="text-xs text-foreground-muted mt-1">
          Gérez vos identifiants fiscaux (NIF/RCCM), vos entrepôts de réception des cartons et vos conditions tarifaires de gros.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Colonne Principale (8 cols) : Formulaire Entreprise & Mot de passe */}
        <div className="lg:col-span-8 space-y-6">
          {/* Logo & Photo de l'Entreprise */}
          <ProfileAvatarCard
            currentAvatarUrl={previewUrl || avatarUrl}
            userFullName={companyName || tradeName || "Grossiste"}
            userRole="wholesaler"
            onAvatarUpdated={(newUrl) => {
              setAvatarUrl(newUrl);
            }}
          />

          {/* Formulaire Principal des Informations */}
          <form
            onSubmit={handleSaveCompany}
            className="bg-background border border-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-6"
          >
            {/* Bloc 1 : Identification Fiscale & Juridique */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-gold" />
                Identité Juridique &amp; Fiscale de l&apos;Entreprise
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-navy">Raison Sociale Officielle *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-background-secondary border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:outline-none focus:border-gold min-h-[44px]"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-navy">Nom Commercial / Enseigne</label>
                  <input
                    type="text"
                    placeholder="Ex: LIB Bénin Distribution"
                    className="w-full bg-background-secondary border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:outline-none focus:border-gold min-h-[44px]"
                    value={tradeName}
                    onChange={(e) => setTradeName(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-navy">Numéro NIF / IFU *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-background-secondary border border-border rounded-xl p-3 text-xs sm:text-sm font-mono font-bold text-foreground focus:outline-none focus:border-gold min-h-[44px]"
                    value={nifNumber}
                    onChange={(e) => setNifNumber(e.target.value)}
                  />
                  <p className="text-[10px] text-foreground-muted">Apposé obligatoirement sur vos factures proforma.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-navy">Numéro Registre du Commerce (RCCM) *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-background-secondary border border-border rounded-xl p-3 text-xs sm:text-sm font-mono font-bold text-foreground focus:outline-none focus:border-gold min-h-[44px]"
                    value={rccmNumber}
                    onChange={(e) => setRccmNumber(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Bloc 2 : Contact d'Approvisionnement */}
            <div className="space-y-4 pt-2 border-t border-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-gold" />
                Contact d&apos;Approvisionnement &amp; Facturation
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-navy">Responsable Achats / Contact *</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-background-secondary border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:outline-none focus:border-gold min-h-[44px]"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-navy">E-mail Réception Factures *</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      className="w-full bg-background-secondary border border-border rounded-xl pl-9 pr-3 py-3 text-xs sm:text-sm text-foreground focus:outline-none focus:border-gold min-h-[44px]"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy">Téléphone d&apos;Astreinte / Coordination *</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    className="w-full bg-background-secondary border border-border rounded-xl pl-9 pr-3 py-3 text-xs sm:text-sm font-mono text-foreground focus:outline-none focus:border-gold min-h-[44px]"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Bloc 3 : Adresses Siège & Entrepôt de Réception */}
            <div className="space-y-4 pt-2 border-t border-border">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                <Warehouse className="w-4 h-4 text-gold" />
                Adresses &amp; Point de Déchargement Logistique
              </h4>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy">Adresse du Siège Social (Facturation) *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-background-secondary border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:outline-none focus:border-gold min-h-[44px]"
                  value={headquartersAddress}
                  onChange={(e) => setHeadquartersAddress(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy">Adresse de l&apos;Entrepôt de Livraison (Cartons papier) *</label>
                <input
                  type="text"
                  required
                  className="w-full bg-background-secondary border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:outline-none focus:border-gold min-h-[44px]"
                  value={warehouseAddress}
                  onChange={(e) => setWarehouseAddress(e.target.value)}
                />
                <p className="text-[10px] text-foreground-muted">
                  Adresse transmise automatiquement au Gestionnaire de stock lors de la préparation des expéditions transporteur.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingCompany}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center justify-center gap-2 shadow-sm min-h-[44px] disabled:opacity-50"
              >
                {savingCompany ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4 text-gold" />
                    Enregistrer les coordonnées de l&apos;entreprise
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Préférences d'Alertes Logistiques & Commerciales */}
          <div className="bg-background border border-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Bell className="w-4 h-4 text-gold" />
              <h3 className="font-serif font-bold text-navy text-base">
                Alertes &amp; Notifications B2B
              </h3>
            </div>

            <div className="space-y-4 text-xs">
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-2xl bg-background-secondary hover:bg-background-secondary/80 transition-colors border border-border">
                <input
                  type="checkbox"
                  checked={notifyNewBooks}
                  onChange={(e) => setNotifyNewBooks(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-navy rounded accent-navy"
                />
                <div>
                  <p className="font-bold text-navy">Nouveautés éditoriales &amp; Parutions universitaires</p>
                  <p className="text-foreground-muted text-[11px]">
                    Recevoir une notification dès qu&apos;un nouvel ouvrage est validé et publié au catalogue de gros.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-2xl bg-background-secondary hover:bg-background-secondary/80 transition-colors border border-border">
                <input
                  type="checkbox"
                  checked={notifyBestSellers}
                  onChange={(e) => setNotifyBestSellers(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-navy rounded accent-navy"
                />
                <div>
                  <p className="font-bold text-navy">Rapport mensuel des meilleures ventes académiques</p>
                  <p className="text-foreground-muted text-[11px]">
                    Bilan des ouvrages les plus demandés pour optimiser vos commandes de réapprovisionnement.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-2xl bg-background-secondary hover:bg-background-secondary/80 transition-colors border border-border">
                <input
                  type="checkbox"
                  checked={notifyStockRestock}
                  onChange={(e) => setNotifyStockRestock(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-navy rounded accent-navy"
                />
                <div>
                  <p className="font-bold text-navy">Alertes de réassort d&apos;exemplaires papier</p>
                  <p className="text-foreground-muted text-[11px]">
                    Notification dès réapprovisionnement d&apos;un titre précédemment en rupture chez le gestionnaire.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-2xl bg-background-secondary hover:bg-background-secondary/80 transition-colors border border-border">
                <input
                  type="checkbox"
                  checked={notifyCarrierDispatch}
                  onChange={(e) => setNotifyCarrierDispatch(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-navy rounded accent-navy"
                />
                <div>
                  <p className="font-bold text-navy">Prise en charge transporteur &amp; N° de suivi colis</p>
                  <p className="text-foreground-muted text-[11px]">
                    Alerte par email/SMS dès la remise de vos cartons à DHL Express ou Chronopost.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Modification du Mot de Passe */}
          <ChangePasswordCard />
        </div>

        {/* Colonne Latérale (4 cols) : Palier Tarifaire & Conditions Commerciales */}
        <div className="lg:col-span-4 space-y-6">
          {/* Badge Conditions Tarifaires Grossiste */}
          <div className="bg-navy text-white rounded-3xl p-6 shadow-md space-y-5 border border-navy-hover">
            <div className="flex items-center gap-2">
              <BadgePercent className="w-5 h-5 text-gold" />
              <h3 className="font-serif font-bold text-base">Conditions Tarifaires B2B</h3>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
              <span className="text-[11px] font-bold text-gold uppercase tracking-wider">
                {profile?.tier.name || "Grand Compte Librairies"}
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-navy-dark/60 border border-white/5">
                  <span className="text-navy-light block text-[10px]">Remise Papier</span>
                  <span className="font-bold text-base text-gold">-{profile?.tier.print_discount_percent || 30}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-navy-dark/60 border border-white/5">
                  <span className="text-navy-light block text-[10px]">Remise Licences</span>
                  <span className="font-bold text-base text-gold">-{profile?.tier.digital_discount_percent || 25}%</span>
                </div>
              </div>
              <p className="text-[11px] text-navy-light leading-relaxed">
                {profile?.tier.description || "Remise dégressive applicable dès 20 exemplaires par commande."}
              </p>
            </div>

            <ul className="space-y-2.5 text-xs text-navy-light">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <span>Seuil minimum : <strong>{profile?.tier.min_quantity || 20} exemplaires</strong> par référence</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <span>Facture proforma PDF avec TVA et NIF déductibles</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <span>Activation instantanée des licences numériques après virement</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <span>Règlement : {profile?.payment_terms || "Virement bancaire / Mobile Money"}</span>
              </li>
            </ul>
          </div>

          {/* Entrepôt de Déchargement Actuel */}
          <div className="bg-background border border-border rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="font-serif font-bold text-navy text-sm flex items-center gap-2 border-b border-border pb-3">
              <Warehouse className="w-4 h-4 text-gold" />
              Entrepôt de Réception Assigné
            </h3>

            <div className="p-3.5 rounded-2xl bg-background-secondary border border-border space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <p className="font-bold text-navy">{tradeName || companyName}</p>
                <span className="font-mono text-[10px] text-gold font-bold">HABILITÉ</span>
              </div>
              <p className="text-foreground-muted flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{warehouseAddress || "Zone Industrielle de Ganhi, Hangar 4B, Cotonou, Bénin"}</span>
              </p>
              <p className="text-[10px] text-foreground-muted pt-1">
                Astreinte : <span className="font-bold text-foreground">{contactPhone}</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
