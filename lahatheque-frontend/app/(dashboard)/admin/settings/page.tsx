"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Save,
  ShieldCheck,
  Coins,
  Clock,
  ChevronRight,
  RefreshCw,
  BellRing,
  CreditCard,
  Sliders,
  CheckCircle2,
  Lock,
  Smartphone,
  Eye,
  FileCheck2,
  CalendarClock,
} from "lucide-react";
import { toast } from "sonner";
import {
  getGlobalPricingConfig,
  updateGlobalPricingConfig,
} from "@/lib/services/admin";
import { GlobalPricingConfig } from "@/lib/types/admin";

type SettingsTab = "pricing" | "drm" | "reminders" | "gateways";

export default function AdminSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("pricing");
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // 1. Cascade Tarifaire & Abonnements
  const [prixNumXof, setPrixNumXof] = useState(3000);
  const [prixPapierXof, setPrixPapierXof] = useState(5000);
  const [prixAudioXof, setPrixAudioXof] = useState(2500);
  const [prixPassMensuelXof, setPrixPassMensuelXof] = useState(4500);
  const [prixPassAnnuelXof, setPrixPassAnnuelXof] = useState(45000);
  const [defaultCurrency, setDefaultCurrency] = useState("XOF");

  // 2. DRM & Protection LCP
  const [watermarkText, setWatermarkText] = useState("LAHAThèque • Document Protégé");
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.2);
  const [restrictPrint, setRestrictPrint] = useState(true);
  const [restrictCapture, setRestrictCapture] = useState(true);
  const [sessionTimeoutMinutes, setSessionTimeoutMinutes] = useState(15);

  // 3. Moteur de Relances
  const [delaiDepotsJours, setDelaiDepotsJours] = useState(7);
  const [delaiImpayesJours, setDelaiImpayesJours] = useState(7);
  const [delaiAbonnementsJours, setDelaiAbonnementsJours] = useState(15);

  // 4. Passerelles de Paiement & SMS
  const [monerooActive, setMonerooActive] = useState(true);
  const [stripeActive, setStripeActive] = useState(true);
  const [smsActive, setSmsActive] = useState(true);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getGlobalPricingConfig();
      if (data) {
        if (data.prix_defaut_numerique_xof !== undefined) setPrixNumXof(Number(data.prix_defaut_numerique_xof));
        if (data.prix_defaut_papier_xof !== undefined) setPrixPapierXof(Number(data.prix_defaut_papier_xof));
        if (data.prix_defaut_audio_xof !== undefined) setPrixAudioXof(Number(data.prix_defaut_audio_xof));
        if (data.prix_pass_mensuel_xof !== undefined) setPrixPassMensuelXof(Number(data.prix_pass_mensuel_xof));
        if (data.prix_pass_annuel_xof !== undefined) setPrixPassAnnuelXof(Number(data.prix_pass_annuel_xof));
        if (data.devise_defaut) setDefaultCurrency(data.devise_defaut);

        if (data.watermark_texte_defaut) setWatermarkText(data.watermark_texte_defaut);
        if (data.watermark_opacite_defaut !== undefined) setWatermarkOpacity(Number(data.watermark_opacite_defaut));
        if (data.restriction_impression_defaut !== undefined) setRestrictPrint(Boolean(data.restriction_impression_defaut));
        if (data.restriction_capture_defaut !== undefined) setRestrictCapture(Boolean(data.restriction_capture_defaut));
        if (data.duree_session_lecture_minutes !== undefined) setSessionTimeoutMinutes(Number(data.duree_session_lecture_minutes));

        if (data.delai_relance_depots_jours !== undefined) setDelaiDepotsJours(Number(data.delai_relance_depots_jours));
        if (data.delai_relance_impayes_jours !== undefined) setDelaiImpayesJours(Number(data.delai_relance_impayes_jours));
        if (data.delai_relance_abonnements_jours !== undefined) setDelaiAbonnementsJours(Number(data.delai_relance_abonnements_jours));

        if (data.moneroo_actif !== undefined) setMonerooActive(Boolean(data.moneroo_actif));
        if (data.stripe_actif !== undefined) setStripeActive(Boolean(data.stripe_actif));
        if (data.fastermessage_sms_actif !== undefined) setSmsActive(Boolean(data.fastermessage_sms_actif));
      }
    } catch {
      toast.error("Erreur de chargement des paramètres de la plateforme.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload: Partial<GlobalPricingConfig> = {
        prix_defaut_numerique_xof: Number(prixNumXof),
        prix_defaut_papier_xof: Number(prixPapierXof),
        prix_defaut_audio_xof: Number(prixAudioXof),
        prix_pass_mensuel_xof: Number(prixPassMensuelXof),
        prix_pass_annuel_xof: Number(prixPassAnnuelXof),
        devise_defaut: defaultCurrency,
        watermark_texte_defaut: watermarkText,
        watermark_opacite_defaut: Number(watermarkOpacity),
        restriction_impression_defaut: restrictPrint,
        restriction_capture_defaut: restrictCapture,
        duree_session_lecture_minutes: Number(sessionTimeoutMinutes),
        delai_relance_depots_jours: Number(delaiDepotsJours),
        delai_relance_impayes_jours: Number(delaiImpayesJours),
        delai_relance_abonnements_jours: Number(delaiAbonnementsJours),
        moneroo_actif: monerooActive,
        stripe_actif: stripeActive,
        fastermessage_sms_actif: smsActive,
      };

      const result = await updateGlobalPricingConfig(payload);
      if (result.success) {
        toast.success("Paramètres enregistrés et synchronisés avec succès en base de données.");
      } else {
        toast.error(result.error || "Échec de l'enregistrement des paramètres.");
      }
    } catch {
      toast.error("Erreur de communication avec le serveur.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* En-tête avec Fil d'Ariane & Accès Rapides */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2 text-xs text-foreground-muted mb-1">
            <Link href="/admin" className="hover:text-navy transition-colors">Administration</Link>
            <span>/</span>
            <span className="text-navy font-semibold">Paramètres Globaux</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-navy flex items-center gap-2.5">
            <Sliders className="w-6 h-6 text-gold" />
            Paramètres & Configuration Globale
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-1">
            Gouvernance régalienne des tarifs de référence, politiques DRM, moteur de relances et passerelles transactionnelles.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/admin/settings/drm"
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-2xl bg-gold/10 border border-gold/30 text-navy font-bold text-xs hover:bg-gold/20 transition-all min-h-[40px]"
          >
            <ShieldCheck className="w-4 h-4 text-gold" />
            <span>Console DRM & Filigrane</span>
          </Link>
          <button
            type="button"
            onClick={loadSettings}
            disabled={loading}
            className="inline-flex items-center justify-center p-2.5 rounded-2xl bg-background-secondary border border-border text-navy hover:border-gold/40 transition-all min-h-[40px] min-w-[40px]"
            title="Recharger les données"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-gold" : "text-foreground-muted"}`} />
          </button>
        </div>
      </div>

      {/* Onglets de Navigation Supérieurs */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-2 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab("pricing")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[44px] ${
            activeTab === "pricing"
              ? "bg-navy text-white shadow-sm"
              : "bg-background-secondary text-foreground hover:bg-background border border-border"
          }`}
        >
          <Coins className="w-4 h-4" />
          <span>Cascade Tarifaire & Pass</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("drm")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[44px] ${
            activeTab === "drm"
              ? "bg-navy text-white shadow-sm"
              : "bg-background-secondary text-foreground hover:bg-background border border-border"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Sécurité DRM & Protection</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("reminders")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[44px] ${
            activeTab === "reminders"
              ? "bg-navy text-white shadow-sm"
              : "bg-background-secondary text-foreground hover:bg-background border border-border"
          }`}
        >
          <BellRing className="w-4 h-4" />
          <span>Moteur de Relances</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("gateways")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer min-h-[44px] ${
            activeTab === "gateways"
              ? "bg-navy text-white shadow-sm"
              : "bg-background-secondary text-foreground hover:bg-background border border-border"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Passerelles de Paiement & SMS</span>
        </button>
      </div>

      {/* Formulaire de Configuration Globale */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Onglet 1 : Cascade Tarifaire & Pass */}
        {activeTab === "pricing" && (
          <div className="p-5 sm:p-6 rounded-3xl bg-background border border-border space-y-6">
            <div className="border-b border-border pb-4">
              <h2 className="font-serif text-lg font-bold text-navy flex items-center gap-2">
                <Coins className="w-5 h-5 text-gold" />
                Tarifs par Défaut du Catalogue & Abonnements
              </h2>
              <p className="text-xs text-foreground-muted mt-0.5">
                Ces montants s&apos;appliquent automatiquement aux nouveaux dépôts d&apos;ouvrages avant tarification spécifique.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1.5">
                <label className="text-xs font-bold text-navy">Livre Numérique (eBook)</label>
                <div className="relative">
                  <input
                    type="number"
                    min={500}
                    step={100}
                    value={prixNumXof}
                    onChange={(e) => setPrixNumXof(Number(e.target.value))}
                    className="w-full p-2.5 pr-14 text-xs font-mono font-bold rounded-xl bg-background border border-border focus:border-gold focus:outline-none min-h-[40px]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-foreground-muted">FCFA</span>
                </div>
                <p className="text-[11px] text-foreground-muted">Prix public de référence format numérique</p>
              </div>

              <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1.5">
                <label className="text-xs font-bold text-navy">Livre Papier Physique</label>
                <div className="relative">
                  <input
                    type="number"
                    min={1000}
                    step={100}
                    value={prixPapierXof}
                    onChange={(e) => setPrixPapierXof(Number(e.target.value))}
                    className="w-full p-2.5 pr-14 text-xs font-mono font-bold rounded-xl bg-background border border-border focus:border-gold focus:outline-none min-h-[40px]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-foreground-muted">FCFA</span>
                </div>
                <p className="text-[11px] text-foreground-muted">Prix public de référence format broché</p>
              </div>

              <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1.5">
                <label className="text-xs font-bold text-navy">Livre Audio</label>
                <div className="relative">
                  <input
                    type="number"
                    min={500}
                    step={100}
                    value={prixAudioXof}
                    onChange={(e) => setPrixAudioXof(Number(e.target.value))}
                    className="w-full p-2.5 pr-14 text-xs font-mono font-bold rounded-xl bg-background border border-border focus:border-gold focus:outline-none min-h-[40px]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-foreground-muted">FCFA</span>
                </div>
                <p className="text-[11px] text-foreground-muted">Prix public streaming audio narré</p>
              </div>

              <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1.5">
                <label className="text-xs font-bold text-navy">Pass Étudiant — Mensuel</label>
                <div className="relative">
                  <input
                    type="number"
                    min={1000}
                    step={500}
                    value={prixPassMensuelXof}
                    onChange={(e) => setPrixPassMensuelXof(Number(e.target.value))}
                    className="w-full p-2.5 pr-14 text-xs font-mono font-bold rounded-xl bg-background border border-border focus:border-gold focus:outline-none min-h-[40px]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-foreground-muted">FCFA</span>
                </div>
                <p className="text-[11px] text-foreground-muted">Accès illimité individuel 30 jours</p>
              </div>

              <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1.5">
                <label className="text-xs font-bold text-navy">Pass Étudiant — Annuel</label>
                <div className="relative">
                  <input
                    type="number"
                    min={10000}
                    step={1000}
                    value={prixPassAnnuelXof}
                    onChange={(e) => setPrixPassAnnuelXof(Number(e.target.value))}
                    className="w-full p-2.5 pr-14 text-xs font-mono font-bold rounded-xl bg-background border border-border focus:border-gold focus:outline-none min-h-[40px]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-foreground-muted">FCFA</span>
                </div>
                <p className="text-[11px] text-foreground-muted">Accès illimité individuel 365 jours (avec remise)</p>
              </div>

              <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1.5">
                <label className="text-xs font-bold text-navy">Devise Principale</label>
                <select
                  value={defaultCurrency}
                  onChange={(e) => setDefaultCurrency(e.target.value)}
                  className="w-full p-2.5 text-xs font-semibold rounded-xl bg-background border border-border focus:border-gold focus:outline-none min-h-[40px]"
                >
                  <option value="XOF">Franc CFA (XOF) — UEMOA</option>
                  <option value="XAF">Franc CFA (XAF) — CEMAC</option>
                  <option value="CDF">Franc Congolais (CDF) — RDC</option>
                  <option value="USD">Dollar US (USD) — International</option>
                </select>
                <p className="text-[11px] text-foreground-muted">Devise légale de base pour les calculs comptables</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-navy/5 border border-border flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-navy">Gestion des remises par profil acheteur</p>
                <p className="text-[11px] text-foreground-muted">
                  Auteurs (-40% papier, -25% numérique), Grossistes (-32%), Campus (-25% papier, -35% numérique).
                </p>
              </div>
              <Link
                href="/admin/catalog/pricing"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:text-gold transition-colors shrink-0"
              >
                <span>Ajuster la cascade tarifaire</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Onglet 2 : Sécurité DRM & Protection LCP */}
        {activeTab === "drm" && (
          <div className="p-5 sm:p-6 rounded-3xl bg-background border border-border space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h2 className="font-serif text-lg font-bold text-navy flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-gold" />
                  Politique de Protection DRM & Filigrane Dynamique
                </h2>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Chiffrement AES-256-GCM, streaming Range 206 et filigrane nominatif sur le lecteur web sécurisé.
                </p>
              </div>

              <Link
                href="/admin/settings/drm"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:text-gold transition-colors"
              >
                <span>Ouvrir la console DRM dédiée</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 p-4 rounded-2xl bg-background-secondary border border-border space-y-1.5">
                <label className="text-xs font-bold text-navy">Texte du Filigrane Dynamique</label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={(e) => setWatermarkText(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none min-h-[40px]"
                />
                <p className="text-[11px] text-foreground-muted">
                  Ce texte est incrusté dynamiquement en diagonale sur chaque page avec l&apos;e-mail et l&apos;adresse IP du lecteur.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1.5">
                <label className="text-xs font-bold text-navy">Opacité du Filigrane</label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0.10"
                    max="0.40"
                    step="0.05"
                    value={watermarkOpacity}
                    onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                    className="flex-1 accent-navy cursor-pointer"
                  />
                  <span className="font-mono text-xs font-bold text-navy min-w-[40px] text-right">
                    {Math.round(watermarkOpacity * 100)}%
                  </span>
                </div>
                <p className="text-[11px] text-foreground-muted">Recommandé : 20% pour concilier lisibilité et dissuasion anti-fuite</p>
              </div>

              <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1.5">
                <label className="text-xs font-bold text-navy">Validité du Jeton de Session (Minutes)</label>
                <input
                  type="number"
                  min={5}
                  max={120}
                  value={sessionTimeoutMinutes}
                  onChange={(e) => setSessionTimeoutMinutes(parseInt(e.target.value) || 15)}
                  className="w-full p-2.5 text-xs font-mono font-bold rounded-xl bg-background border border-border focus:border-gold focus:outline-none min-h-[40px]"
                />
                <p className="text-[11px] text-foreground-muted">Durée avant renouvellement transparent du token éphémère de lecture</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-background-secondary border border-border">
                <div className="space-y-0.5 pr-3">
                  <p className="text-xs font-bold text-navy">Blocage de l&apos;Impression (Ctrl+P)</p>
                  <p className="text-[11px] text-foreground-muted">Empêche l&apos;impression papier et le transfert PDF via les règles CSS media print.</p>
                </div>
                <input
                  type="checkbox"
                  checked={restrictPrint}
                  onChange={(e) => setRestrictPrint(e.target.checked)}
                  className="w-4 h-4 accent-navy cursor-pointer shrink-0"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-background-secondary border border-border">
                <div className="space-y-0.5 pr-3">
                  <p className="text-xs font-bold text-navy">Protection Anti-Capture d&apos;Écran</p>
                  <p className="text-[11px] text-foreground-muted">Floute automatiquement la page lors de la perte de focus de la fenêtre de lecture.</p>
                </div>
                <input
                  type="checkbox"
                  checked={restrictCapture}
                  onChange={(e) => setRestrictCapture(e.target.checked)}
                  className="w-4 h-4 accent-navy cursor-pointer shrink-0"
                />
              </div>
            </div>
          </div>
        )}

        {/* Onglet 3 : Moteur de Relances */}
        {activeTab === "reminders" && (
          <div className="p-5 sm:p-6 rounded-3xl bg-background border border-border space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h2 className="font-serif text-lg font-bold text-navy flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-gold" />
                  Moteur de Relances Automatiques & Traçabilité
                </h2>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Délais d&apos;inactivité déclenchant les alertes programmées (Celery Beat) pour les maquettes, factures et abonnements.
                </p>
              </div>

              <Link
                href="/admin/reminders"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:text-gold transition-colors"
              >
                <span>Voir le journal des relances</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-navy">Dépôts de Maquettes</label>
                  <FileCheck2 className="w-4 h-4 text-gold" />
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={delaiDepotsJours}
                    onChange={(e) => setDelaiDepotsJours(parseInt(e.target.value) || 7)}
                    className="w-full p-2.5 pr-14 text-xs font-mono font-bold rounded-xl bg-background border border-border focus:border-gold focus:outline-none min-h-[40px]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-foreground-muted">jours</span>
                </div>
                <p className="text-[11px] text-foreground-muted">Alerte envoyée au maquettiste si épreuve en attente sans action</p>
              </div>

              <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-navy">Factures & Impayés</label>
                  <Clock className="w-4 h-4 text-gold" />
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={delaiImpayesJours}
                    onChange={(e) => setDelaiImpayesJours(parseInt(e.target.value) || 7)}
                    className="w-full p-2.5 pr-14 text-xs font-mono font-bold rounded-xl bg-background border border-border focus:border-gold focus:outline-none min-h-[40px]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-foreground-muted">jours</span>
                </div>
                <p className="text-[11px] text-foreground-muted">Relance automatique des commandes à crédit ou factures non soldées</p>
              </div>

              <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-navy">Préavis d&apos;Expiration Pass</label>
                  <CalendarClock className="w-4 h-4 text-gold" />
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={delaiAbonnementsJours}
                    onChange={(e) => setDelaiAbonnementsJours(parseInt(e.target.value) || 15)}
                    className="w-full p-2.5 pr-14 text-xs font-mono font-bold rounded-xl bg-background border border-border focus:border-gold focus:outline-none min-h-[40px]"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-foreground-muted">jours</span>
                </div>
                <p className="text-[11px] text-foreground-muted">Notification envoyée avant fin d&apos;abonnement étudiant ou bouquet</p>
              </div>
            </div>
          </div>
        )}

        {/* Onglet 4 : Passerelles de Paiement & SMS */}
        {activeTab === "gateways" && (
          <div className="p-5 sm:p-6 rounded-3xl bg-background border border-border space-y-6">
            <div className="border-b border-border pb-4">
              <h2 className="font-serif text-lg font-bold text-navy flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gold" />
                Passerelles de Paiement Africaines & SMS Transactionnels
              </h2>
              <p className="text-xs text-foreground-muted mt-0.5">
                Activation des canaux d&apos;encaissement Mobile Money, cartes bancaires et notifications SMS officielles.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-background-secondary border border-border">
                <div className="space-y-1 pr-4">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-gold" />
                    <p className="text-xs font-bold text-navy">Moneroo — Passerelle Mobile Money Africaine</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20">
                      UEMOA · CEMAC · RDC
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground-muted">
                    Encaissement par MTN MoMo, Moov Money, Orange Money, Wave et Airtel Money sur l&apos;ensemble de l&apos;Afrique.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={monerooActive}
                  onChange={(e) => setMonerooActive(e.target.checked)}
                  className="w-4 h-4 accent-navy cursor-pointer shrink-0"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-background-secondary border border-border">
                <div className="space-y-1 pr-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gold" />
                    <p className="text-xs font-bold text-navy">Stripe — Cartes Bancaires Internationales</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-navy/5 text-navy border border-border">
                      Visa · Mastercard
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground-muted">
                    Paiements par cartes bancaires pour la diaspora, les commandes institutionnelles et les partenaires étrangers.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={stripeActive}
                  onChange={(e) => setStripeActive(e.target.checked)}
                  className="w-4 h-4 accent-navy cursor-pointer shrink-0"
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-background-secondary border border-border">
                <div className="space-y-1 pr-4">
                  <div className="flex items-center gap-2">
                    <BellRing className="w-4 h-4 text-gold" />
                    <p className="text-xs font-bold text-navy">FasterMessage — SMS Transactionnels & Alertes</p>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20">
                      SMS Direct
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground-muted">
                    Envoi instantané des confirmations d&apos;achat, codes OTP de connexion et alertes de versement aux auteurs par SMS.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={smsActive}
                  onChange={(e) => setSmsActive(e.target.checked)}
                  className="w-4 h-4 accent-navy cursor-pointer shrink-0"
                />
              </div>
            </div>
          </div>
        )}

        {/* Bouton d'Enregistrement Centralisé */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-[11px] text-foreground-muted">
            Toute modification est immédiatement enregistrée dans le journal d&apos;audit administrateur.
          </p>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-2xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            <Save className="w-4 h-4 text-gold" />
            <span>{isSaving ? "Enregistrement en cours..." : "Enregistrer les Paramètres"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
