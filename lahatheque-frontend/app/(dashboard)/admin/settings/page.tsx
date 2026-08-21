"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Settings, Save, ShieldCheck, Mail, Lock, Globe, 
  Bell, Database, Coins, Clock, ChevronRight, RefreshCw, 
  Sliders, UserCheck, Smartphone, AlertTriangle, CheckCircle2,
  Server, HardDrive, Loader2
} from "lucide-react";
import { toast } from "sonner";
import { getPlatformGlobalSettings, updatePlatformGlobalSettings, PlatformGlobalSettings } from "@/lib/services/admin";

type SettingsTab = "general" | "drm" | "access" | "notifications" | "storage";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");
  const [loading, setLoading] = useState(true);

  // Général & Identité
  const [siteName, setSiteName] = useState("LAHAThèque — Bibliothèque Numérique Africaine");
  const [siteDescription, setSiteDescription] = useState("Plateforme académique et universitaire de diffusion des savoirs et manuels africains.");
  const [supportEmail, setSupportEmail] = useState("contact@lahatheque.com");
  const [defaultCurrency, setDefaultCurrency] = useState("XOF");
  const [timezone, setTimezone] = useState("Africa/Porto-Novo");

  // Tarifs & Relances Backend
  const [prixNumXof, setPrixNumXof] = useState(3000);
  const [prixPapierXof, setPrixPapierXof] = useState(5000);
  const [prixAudioXof, setPrixAudioXof] = useState(2500);
  const [prixPassMensuelXof, setPrixPassMensuelXof] = useState(5000);
  const [prixPassAnnuelXof, setPrixPassAnnuelXof] = useState(45000);
  const [delaiDepotsJours, setDelaiDepotsJours] = useState(7);
  const [delaiImpayesJours, setDelaiImpayesJours] = useState(7);

  // Inscriptions & Accès
  const [allowPublicRegistrations, setAllowPublicRegistrations] = useState(true);
  const [autoVerifyUniversityEmails, setAutoVerifyUniversityEmails] = useState(true);
  const [enforceStrongPassword, setEnforceStrongPassword] = useState(true);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(60);

  // Notifications & Alertes
  const [notifyOnNewSubmission, setNotifyOnNewSubmission] = useState(true);
  const [notifyOnRoyaltyDue, setNotifyOnRoyaltyDue] = useState(true);
  const [notifyOnUnpaidContract, setNotifyOnUnpaidContract] = useState(true);
  const [adminAlertEmail, setAdminAlertEmail] = useState("direction@lahatheque.com");

  // Maintenance & Stockage
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [cacheTtlHours, setCacheTtlHours] = useState(24);

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      const data = await getPlatformGlobalSettings();
      if (data) {
        if (data.devise_defaut) setDefaultCurrency(data.devise_defaut);
        if (data.duree_session_lecture_minutes) setSessionTimeoutMinutes(data.duree_session_lecture_minutes);
        if (data.prix_defaut_numerique_xof !== undefined) setPrixNumXof(Number(data.prix_defaut_numerique_xof));
        if (data.prix_defaut_papier_xof !== undefined) setPrixPapierXof(Number(data.prix_defaut_papier_xof));
        if (data.prix_defaut_audio_xof !== undefined) setPrixAudioXof(Number(data.prix_defaut_audio_xof));
        if (data.prix_pass_mensuel_xof !== undefined) setPrixPassMensuelXof(Number(data.prix_pass_mensuel_xof));
        if (data.prix_pass_annuel_xof !== undefined) setPrixPassAnnuelXof(Number(data.prix_pass_annuel_xof));
        if (data.delai_relance_depots_jours !== undefined) setDelaiDepotsJours(Number(data.delai_relance_depots_jours));
        if (data.delai_relance_impayes_jours !== undefined) setDelaiImpayesJours(Number(data.delai_relance_impayes_jours));
      }
      setLoading(false);
    }
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const payload: Partial<PlatformGlobalSettings> = {
      devise_defaut: defaultCurrency,
      duree_session_lecture_minutes: sessionTimeoutMinutes,
      prix_defaut_numerique_xof: prixNumXof,
      prix_defaut_papier_xof: prixPapierXof,
      prix_defaut_audio_xof: prixAudioXof,
      prix_pass_mensuel_xof: prixPassMensuelXof,
      prix_pass_annuel_xof: prixPassAnnuelXof,
      delai_relance_depots_jours: delaiDepotsJours,
      delai_relance_impayes_jours: delaiImpayesJours,
    };

    const result = await updatePlatformGlobalSettings(payload);
    setIsSaving(false);
    if (result.success) {
      toast.success("Paramètres de la plateforme enregistrés avec succès en base de données.");
    } else {
      toast.error(result.error || "Échec de l'enregistrement des paramètres.");
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6">
      {/* En-tête avec Fil d'Ariane */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-xs text-foreground-muted mb-1">
            <Link href="/admin" className="hover:text-navy transition-colors">Administration</Link>
            <span>/</span>
            <span className="text-navy font-semibold">Paramètres Globaux</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy">
            Paramètres & Configuration de la Plateforme
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Administration centrale des règles métier, politiques de protection, accès et infrastructure.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/admin/settings/drm"
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-gold/10 border border-gold/30 text-navy font-bold text-xs hover:bg-gold/20 transition-colors"
          >
            <ShieldCheck className="w-4 h-4 text-gold" />
            <span>Console DRM & Filigrane</span>
          </Link>
        </div>
      </div>

      {/* Barre d'Onglets de Navigation (Mobile-First Scrollable) */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "general"
              ? "bg-navy text-white shadow-sm"
              : "bg-background-secondary text-foreground hover:bg-background border border-border"
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Général & Identité</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("drm")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "drm"
              ? "bg-navy text-white shadow-sm"
              : "bg-background-secondary text-foreground hover:bg-background border border-border"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Sécurité DRM & LCP</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("access")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "access"
              ? "bg-navy text-white shadow-sm"
              : "bg-background-secondary text-foreground hover:bg-background border border-border"
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Inscriptions & Accès</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "notifications"
              ? "bg-navy text-white shadow-sm"
              : "bg-background-secondary text-foreground hover:bg-background border border-border"
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Notifications & Alertes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("storage")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === "storage"
              ? "bg-navy text-white shadow-sm"
              : "bg-background-secondary text-foreground hover:bg-background border border-border"
          }`}
        >
          <HardDrive className="w-3.5 h-3.5" />
          <span>Stockage & Système</span>
        </button>
      </div>

      {/* Contenu des Onglets */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Onglet 1 : Général & Identité */}
        {activeTab === "general" && (
          <div className="p-5 sm:p-6 rounded-2xl bg-background-secondary border border-border space-y-6">
            <div className="border-b border-border pb-3">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Globe className="w-4 h-4 text-gold" />
                Identité Visuelle & Informations Institutionnelles
              </h2>
              <p className="text-xs text-foreground-muted mt-0.5">
                Configuration des libellés légaux et des devises de facturation en zone africaine.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-foreground">Nom Officiel du Service</label>
                <input
                  type="text"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="w-full mt-1.5 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-foreground">Description & Slogan</label>
                <textarea
                  rows={2}
                  value={siteDescription}
                  onChange={(e) => setSiteDescription(e.target.value)}
                  className="w-full mt-1.5 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">E-mail de Support / Contact</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="w-full mt-1.5 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-gold" />
                  Devise Principale de Facturation
                </label>
                <select
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  className="w-full mt-1.5 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none font-medium"
                >
                  <option value="XOF">Franc CFA (XOF) — Zone UEMOA (Bénin, Sénégal, Côte d'Ivoire...)</option>
                  <option value="XAF">Franc CFA (XAF) — Zone CEMAC (Cameroun, Gabon...)</option>
                  <option value="CDF">Franc Congolais (CDF) — RDC</option>
                  <option value="USD">Dollar US (USD) — International</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-navy" />
                  Fuseau Horaire de Référence
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full mt-1.5 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none font-medium"
                >
                  <option value="Africa/Porto-Novo">Afrique de l'Ouest / Porto-Novo (UTC+1)</option>
                  <option value="Africa/Dakar">Afrique de l'Ouest / Dakar (UTC+0)</option>
                  <option value="Africa/Douala">Afrique Centrale / Douala (UTC+1)</option>
                  <option value="Africa/Kinshasa">Afrique Centrale / Kinshasa (UTC+1)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Onglet 2 : Sécurité DRM & LCP */}
        {activeTab === "drm" && (
          <div className="p-5 sm:p-6 rounded-2xl bg-background-secondary border border-border space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
              <div>
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-gold" />
                  Politique Globale DRM & Filigrane Dynamique
                </h2>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Chiffrement AES-256-GCM, protection des flux Range 206 et conformité LCP-like.
                </p>
              </div>

              <Link
                href="/admin/settings/drm"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:text-navy-hover transition-colors"
              >
                <span>Accéder à la console complète</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-background border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-navy">Filigrane Visible Dynamique</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Actif</span>
                </div>
                <p className="text-[11px] text-foreground-muted">
                  Incruste à 45° l'e-mail, le nom et l'adresse IP de chaque lecteur sur toutes les pages consultées.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-background border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-navy">Tatouage Invisible Stéganographique</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Actif</span>
                </div>
                <p className="text-[11px] text-foreground-muted">
                  Signe cryptographiquement la structure du document avec empreinte SHA-256 pour tracer toute fuite.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-background border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-navy">Protection Anti-Impression (Ctrl+P)</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-navy/10 text-navy border border-navy/20">Verrouillé</span>
                </div>
                <p className="text-[11px] text-foreground-muted">
                  Neutralise le raccourci et masque les pages via les règles d'impression CSS.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-background border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-navy">Journal d'Audit TraceAccès</span>
                  <Link href="/admin/security/traces" className="text-[10px] font-bold text-gold hover:underline">
                    Consulter les traces →
                  </Link>
                </div>
                <p className="text-[11px] text-foreground-muted">
                  Enregistre chaque fragment Range 206 délivré avec géolocalisation et empreinte appareil.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Onglet 3 : Inscriptions & Accès */}
        {activeTab === "access" && (
          <div className="p-5 sm:p-6 rounded-2xl bg-background-secondary border border-border space-y-5">
            <div className="border-b border-border pb-3">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-gold" />
                Politique d'Inscription & Contrôle des Accès
              </h2>
              <p className="text-xs text-foreground-muted mt-0.5">
                Règles de création de compte pour les étudiants, enseignants et partenaires universitaires.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border">
                <div>
                  <p className="text-xs font-semibold text-foreground">Autoriser l'Inscription Publique Autonome</p>
                  <p className="text-[11px] text-foreground-muted">Permet aux étudiants et particuliers de s'inscrire sans invitation préalable.</p>
                </div>
                <input
                  type="checkbox"
                  checked={allowPublicRegistrations}
                  onChange={(e) => setAllowPublicRegistrations(e.target.checked)}
                  className="w-4 h-4 accent-navy cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border">
                <div>
                  <p className="text-xs font-semibold text-foreground">Affiliation Automatique aux Domaines Universitaires (.edu / .bj / .sn / .ci)</p>
                  <p className="text-[11px] text-foreground-muted">Attribue instantanément les bouquets institutionnels aux adresses académiques reconnues.</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoVerifyUniversityEmails}
                  onChange={(e) => setAutoVerifyUniversityEmails(e.target.checked)}
                  className="w-4 h-4 accent-navy cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border">
                <div>
                  <p className="text-xs font-semibold text-foreground">Exiger une Complexité de Mot de Passe Renforcée</p>
                  <p className="text-[11px] text-foreground-muted">Minimum 8 caractères, au moins une majuscule, un chiffre et un caractère spécial.</p>
                </div>
                <input
                  type="checkbox"
                  checked={enforceStrongPassword}
                  onChange={(e) => setEnforceStrongPassword(e.target.checked)}
                  className="w-4 h-4 accent-navy cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-background border border-border max-w-sm">
                <label className="text-xs font-semibold text-foreground">Délai d'Expiration de Session Inactive (Minutes)</label>
                <input
                  type="number"
                  min={15}
                  max={240}
                  value={sessionTimeoutMinutes}
                  onChange={(e) => setSessionTimeoutMinutes(parseInt(e.target.value) || 60)}
                  className="w-full mt-1.5 p-2 text-xs rounded-xl bg-background-secondary border border-border focus:border-gold focus:outline-none font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* Onglet 4 : Notifications & Alertes */}
        {activeTab === "notifications" && (
          <div className="p-5 sm:p-6 rounded-2xl bg-background-secondary border border-border space-y-5">
            <div className="border-b border-border pb-3">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Bell className="w-4 h-4 text-gold" />
                Notifications & Alertes Administratives
              </h2>
              <p className="text-xs text-foreground-muted mt-0.5">
                Gestion des alertes transactionnelles, relances de contrats et suivi des dépôts éditeurs.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border">
                <div>
                  <p className="text-xs font-semibold text-foreground">Alerter lors d'un Nouveau Dépôt d'Ouvrage</p>
                  <p className="text-[11px] text-foreground-muted">Envoie un e-mail à l'équipe relecture juridique lors d'une soumission éditeur.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyOnNewSubmission}
                  onChange={(e) => setNotifyOnNewSubmission(e.target.checked)}
                  className="w-4 h-4 accent-navy cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border">
                <div>
                  <p className="text-xs font-semibold text-foreground">Alerter sur les Échéances de Redevances Auteurs</p>
                  <p className="text-[11px] text-foreground-muted">Rappel automatique 7 jours avant la clôture trimestrielle des versements de droits.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyOnRoyaltyDue}
                  onChange={(e) => setNotifyOnRoyaltyDue(e.target.checked)}
                  className="w-4 h-4 accent-navy cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border">
                <div>
                  <p className="text-xs font-semibold text-foreground">Relances Automatiques des Factures Impayées Grossistes</p>
                  <p className="text-[11px] text-foreground-muted">Déclenche un rappel courtois puis formel à J+7 et J+15 après échéance de facture.</p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyOnUnpaidContract}
                  onChange={(e) => setNotifyOnUnpaidContract(e.target.checked)}
                  className="w-4 h-4 accent-navy cursor-pointer"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-background border border-border max-w-md">
                <label className="text-xs font-semibold text-foreground">E-mail de Réception des Alertes Critiques</label>
                <input
                  type="email"
                  value={adminAlertEmail}
                  onChange={(e) => setAdminAlertEmail(e.target.value)}
                  className="w-full mt-1.5 p-2 text-xs rounded-xl bg-background-secondary border border-border focus:border-gold focus:outline-none font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* Onglet 5 : Stockage & Système */}
        {activeTab === "storage" && (
          <div className="p-5 sm:p-6 rounded-2xl bg-background-secondary border border-border space-y-5">
            <div className="border-b border-border pb-3">
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-gold" />
                Infrastructure de Stockage & Maintenance
              </h2>
              <p className="text-xs text-foreground-muted mt-0.5">
                Passerelle Cloudflare R2, durée de validité des caches chiffrés et mode maintenance.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-background border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-gold" />
                    Stockage Chiffré Cloudflare R2
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Connecté</span>
                </div>
                <p className="text-[11px] text-foreground-muted">
                  Les objets maîtres sont stockés chiffrés en AES-256-GCM. Aucun document source en clair n'est exposé.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-background border border-border space-y-2">
                <label className="text-xs font-bold text-navy">TTL du Cache Dérivés (Heures)</label>
                <input
                  type="number"
                  min={1}
                  max={72}
                  value={cacheTtlHours}
                  onChange={(e) => setCacheTtlHours(parseInt(e.target.value) || 24)}
                  className="w-full p-2 text-xs rounded-xl bg-background-secondary border border-border focus:border-gold focus:outline-none"
                />
                <p className="text-[10px] text-foreground-muted">
                  Durée avant purge automatique des dérivés temporaires filigranés.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-rose-500/30">
              <div>
                <p className="text-xs font-bold text-rose-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Mode Maintenance de la Plateforme
                </p>
                <p className="text-[11px] text-foreground-muted">
                  Suspend l'accès public au catalogue et aux espaces de lecture pour intervention technique.
                </p>
              </div>
              <input
                type="checkbox"
                checked={isMaintenanceMode}
                onChange={(e) => setIsMaintenanceMode(e.target.checked)}
                className="w-4 h-4 accent-rose-600 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* Bouton de Soumission Global */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            <Save className="w-4 h-4 text-gold" />
            <span>{isSaving ? "Enregistrement en cours..." : "Enregistrer les Paramètres"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
