"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  Save,
  RefreshCw,
  Lock,
  Eye,
  CheckCircle2,
  Sliders,
  Smartphone,
  Clock,
  Printer,
  Copy,
  Sparkles,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { toast } from "sonner";
import {
  getDrmGlobalSettings,
  saveDrmGlobalSettings,
} from "@/lib/services/protection";

export default function AdminDrmSettingsPage() {
  const [profilDefault, setProfilDefault] = useState<"standard" | "renforce">("standard");

  // 1. Filigrane pour la lecture directe sur LAHAThèque (abonnés, étudiants)
  const [watermarkLahaTemplate, setWatermarkLahaTemplate] = useState("LAHAThèque • Exemplaire Certifié • {titre}");
  const [watermarkLahaSubtext, setWatermarkLahaSubtext] = useState("Licence accordée au Lecteur Authentifié • Reproduction interdite");

  // 2. Filigrane de traçabilité pour les accès externes et universités partenaires
  const [watermarkTemplate, setWatermarkTemplate] = useState("Document confié à {nom} ({email}) • IP: {ip}");

  // Réglages visuels du filigrane
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.20);
  const [watermarkPosition, setWatermarkPosition] = useState<"diagonal" | "header" | "footer">("diagonal");
  const [invisibleEnabled, setInvisibleEnabled] = useState(true);

  // Onglet actif pour l'aperçu visuel
  const [previewTab, setPreviewTab] = useState<"laha" | "partner">("laha");

  // Restrictions de lecture
  const [blockPrint, setBlockPrint] = useState(true);
  const [blockCopy, setBlockCopy] = useState(true);
  const [maxDevices, setMaxDevices] = useState(3);
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState(15);
  const [configVersion, setConfigVersion] = useState(1);

  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const data = await getDrmGlobalSettings();
        if (data.profil_default === "renforce" || data.profil_default === "standard") {
          setProfilDefault(data.profil_default);
        }
        setWatermarkLahaTemplate(data.watermark_laha_template || "LAHAThèque • Exemplaire Certifié • {titre}");
        setWatermarkLahaSubtext(data.watermark_laha_subtext || "Licence accordée au Lecteur Authentifié • Reproduction interdite");
        const opacityNum = data.watermark_opacity != null ? parseFloat(String(data.watermark_opacity)) : 0.20;
        setWatermarkOpacity(!isNaN(opacityNum) ? opacityNum : 0.20);
        if (data.watermark_position === "header" || data.watermark_position === "footer" || data.watermark_position === "diagonal") {

          setWatermarkPosition(data.watermark_position);
        }
        setInvisibleEnabled(data.invisible_watermark_enabled ?? true);
        setBlockPrint(!data.allow_print);
        setBlockCopy(!data.allow_copy);
        setMaxDevices(data.max_devices || 3);
        setSessionDurationMinutes(data.session_duration_minutes || 15);
        setConfigVersion(data.config_version || 1);
      } catch (err) {
        console.error("[DRM] Erreur chargement configuration:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSaveDrmSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const ok = await saveDrmGlobalSettings({
        profil_default: profilDefault,
        watermark_template: watermarkTemplate,
        watermark_laha_template: watermarkLahaTemplate,
        watermark_laha_subtext: watermarkLahaSubtext,
        watermark_opacity: watermarkOpacity,
        watermark_position: watermarkPosition,
        invisible_watermark_enabled: invisibleEnabled,
        allow_print: !blockPrint,
        allow_copy: !blockCopy,
        max_devices: maxDevices,
        session_duration_minutes: sessionDurationMinutes,
        config_version: configVersion,
      });

      if (ok) {
        setConfigVersion((v) => v + 1);
        toast.success("Règles de sécurité DRM enregistrées avec succès.");
      } else {
        toast.error("Erreur : impossible d'enregistrer sur le serveur.");
      }
    } catch {
      toast.error("Erreur inattendue lors de l'enregistrement.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInvalidateCache = async () => {
    setIsSaving(true);
    try {
      const ok = await saveDrmGlobalSettings({
        profil_default: profilDefault,
        watermark_template: watermarkTemplate,
        watermark_laha_template: watermarkLahaTemplate,
        watermark_laha_subtext: watermarkLahaSubtext,
        watermark_opacity: watermarkOpacity,
        watermark_position: watermarkPosition,
        invisible_watermark_enabled: invisibleEnabled,
        allow_print: !blockPrint,
        allow_copy: !blockCopy,
        max_devices: maxDevices,
        session_duration_minutes: sessionDurationMinutes,
        config_version: configVersion + 1,
      });
      if (ok) {
        setConfigVersion((v) => v + 1);
        toast.success("Cache vidé. Les prochains livres ouverts afficheront immédiatement vos nouveaux filigranes.");
      } else {
        toast.error("Impossible de vider le cache.");
      }
    } catch {
      toast.error("Erreur lors de la purge.");
    } finally {
      setIsSaving(false);
    }
  };

  // Rendu de l'aperçu du filigrane avec variables remplacées
  const previewLahaText = useMemo(() => {
    return watermarkLahaTemplate
      .replace(/{titre}/g, "Traité de Droit OHADA")
      .replace(/{id}/g, "BK-101");
  }, [watermarkLahaTemplate]);

  const previewPartnerText = useMemo(() => {
    return watermarkTemplate
      .replace(/{nom}/g, "Koffi Mensah")
      .replace(/{email}/g, "koffi.mensah@univ.bj")
      .replace(/{ip}/g, "197.234.221.14");
  }, [watermarkTemplate]);

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-gold bg-gold/10 px-2 py-0.5 rounded">
              Sécurité & Propriété Intellectuelle
            </span>
            <span className="text-[10px] text-foreground-muted font-mono">
              Version {configVersion}.0
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy mt-1">
            Protection des Livres & Filigranes
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Configurez les textes incrustés sur les pages, le niveau de protection et les interdictions de copie.
          </p>
        </div>

        <button
          type="button"
          onClick={handleInvalidateCache}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-background border border-border text-foreground hover:bg-background-secondary transition-colors cursor-pointer shrink-0 disabled:opacity-50"
          title="Applique immédiatement les nouveaux réglages à tous les livres ouverts"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gold ${isSaving ? "animate-spin" : ""}`} />
          <span>Appliquer aux livres déjà ouverts</span>
        </button>
      </div>

      <form onSubmit={handleSaveDrmSettings} className="space-y-6">
        {/* 1. Mode de Protection du Catalogue */}
        <div className="p-5 sm:p-6 rounded-2xl bg-background-secondary border border-border space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Sliders className="w-4 h-4 text-gold" />
              Niveau de Protection des Documents
            </h2>
            <span className="text-[11px] font-bold text-navy bg-navy/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {profilDefault === "standard" ? "Mode Standard" : "Haute Sécurité"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setProfilDefault("standard")}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                profilDefault === "standard"
                  ? "bg-gold/10 border-gold shadow-sm ring-1 ring-gold"
                  : "bg-background border-border hover:border-navy-hover opacity-80"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-gold" />
                  Mode Standard (Recommandé)
                </span>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    profilDefault === "standard"
                      ? "border-gold bg-gold text-navy-dark"
                      : "border-border bg-background"
                  }`}
                >
                  {profilDefault === "standard" && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
              </div>
              <p className="text-[11px] text-foreground-muted mt-2 leading-relaxed">
                Lecture fluide et rapide. Les lecteurs peuvent utiliser la recherche dans le texte, les surlignages et la lecture audio vocale (TTS).
              </p>
            </button>

            <button
              type="button"
              onClick={() => setProfilDefault("renforce")}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                profilDefault === "renforce"
                  ? "bg-gold/10 border-gold shadow-sm ring-1 ring-gold"
                  : "bg-background border-border hover:border-navy-hover opacity-80"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-gold" />
                  Mode Haute Sécurité (Anti-Extraction)
                </span>
                <div
                  className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                    profilDefault === "renforce"
                      ? "border-gold bg-gold text-navy-dark"
                      : "border-border bg-background"
                  }`}
                >
                  {profilDefault === "renforce" && <CheckCircle2 className="w-3.5 h-3.5" />}
                </div>
              </div>
              <p className="text-[11px] text-foreground-muted mt-2 leading-relaxed">
                Empêche tout logiciel d'extraire le texte : les pages sont diffusées sous forme d'images haute définition sans couche texte brute téléchargeable.
              </p>
            </button>
          </div>
        </div>

        {/* 2. Textes des Filigranes & Aperçu */}
        <div className="p-5 sm:p-6 rounded-2xl bg-background-secondary border border-border space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Eye className="w-4 h-4 text-gold" />
                Textes des Filigranes sur les Pages
              </h2>
              <p className="text-[11px] text-foreground-muted mt-0.5">
                Le filigrane s'incruste en transparence sur chaque page pour protéger vos droits d'auteur.
              </p>
            </div>
            <span className="text-[10px] text-gold font-mono uppercase bg-gold/10 px-2 py-0.5 rounded">
              2 situations distinctes
            </span>
          </div>

          {/* Cas 1 : Lecture sur LAHAThèque */}
          <div className="p-4 rounded-xl bg-background border border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gold" />
                <span className="text-xs font-bold text-navy">
                  1. Quand un lecteur lit directement sur LAHAThèque
                </span>
              </div>
              <span className="text-[10px] text-foreground-muted">Abonnés & étudiants</span>
            </div>
            <p className="text-[11px] text-foreground-muted">
              Texte incrusté pour certifier l'ouvrage et rappeler qu'il s'agit d'un document protégé.
            </p>

            {/* Ligne 1 : Texte Principal */}
            <div>
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Texte Principal</span>
                <span className="text-[10px] text-foreground-muted">Incrusté en grand sur la page</span>
              </label>
              <input
                type="text"
                value={watermarkLahaTemplate}
                onChange={(e) => setWatermarkLahaTemplate(e.target.value)}
                className="w-full mt-1 p-2.5 text-xs rounded-xl bg-background-secondary border border-border focus:border-gold focus:outline-none font-medium text-foreground"
                placeholder="Ex : LAHAThèque • Exemplaire Certifié • {titre}"
              />
              <div className="flex items-center gap-2 text-[10px] text-foreground-muted mt-1.5">
                <span>Variables :</span>
                <button
                  type="button"
                  onClick={() => setWatermarkLahaTemplate((t) => (t.includes("{titre}") ? t : `${t} • {titre}`))}
                  className="font-mono font-bold bg-background-secondary border border-border text-gold px-2 py-0.5 rounded hover:bg-gold/10 transition-colors cursor-pointer"
                  title="Insère le titre du livre automatiquement"
                >
                  {"{titre}"} (Titre du livre)
                </button>
                <button
                  type="button"
                  onClick={() => setWatermarkLahaTemplate((t) => (t.includes("{id}") ? t : `${t} • {id}`))}
                  className="font-mono font-bold bg-background-secondary border border-border text-gold px-2 py-0.5 rounded hover:bg-gold/10 transition-colors cursor-pointer"
                  title="Insère l'identifiant du livre"
                >
                  {"{id}"} (Référence)
                </button>
              </div>
            </div>

            {/* Ligne 2 : Sous-Texte / Mention de Protection */}
            <div>
              <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Sous-Texte / Mention de Protection</span>
                <span className="text-[10px] text-foreground-muted">Deuxième ligne en dessous (optionnel)</span>
              </label>
              <input
                type="text"
                value={watermarkLahaSubtext}
                onChange={(e) => setWatermarkLahaSubtext(e.target.value)}
                className="w-full mt-1 p-2.5 text-xs rounded-xl bg-background-secondary border border-border focus:border-gold focus:outline-none font-sans text-foreground"
                placeholder="Ex : Licence accordée au Lecteur Authentifié • Reproduction interdite"
              />
            </div>
          </div>


          {/* Cas 2 : Lecture via Partenaires / Universités */}
          <div className="p-4 rounded-xl bg-background border border-border space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-gold" />
                <span className="text-xs font-bold text-navy">
                  2. Quand un livre est lu depuis une Université ou un Partenaire externe
                </span>
              </div>
              <span className="text-[10px] text-foreground-muted">Traçage nominatif</span>
            </div>
            <p className="text-[11px] text-foreground-muted">
              Incruste l'identité et l'adresse IP du lecteur externe pour dissuader les fuites et identifier l'auteur d'une capture d'écran.
            </p>

            <input
              type="text"
              value={watermarkTemplate}
              onChange={(e) => setWatermarkTemplate(e.target.value)}
              className="w-full p-2.5 text-xs rounded-xl bg-background-secondary border border-border focus:border-gold focus:outline-none font-medium text-foreground"
              placeholder="Ex : Document confié à {nom} ({email}) • IP: {ip}"
            />
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-foreground-muted">
              <span>Insérer une information :</span>
              <button
                type="button"
                onClick={() => setWatermarkTemplate((t) => (t.includes("{nom}") ? t : `${t} • {nom}`))}
                className="font-mono font-bold bg-background-secondary border border-border text-gold px-2 py-0.5 rounded hover:bg-gold/10 transition-colors"
              >
                {"{nom}"} (Nom du lecteur)
              </button>
              <button
                type="button"
                onClick={() => setWatermarkTemplate((t) => (t.includes("{email}") ? t : `${t} ({email})`))}
                className="font-mono font-bold bg-background-secondary border border-border text-gold px-2 py-0.5 rounded hover:bg-gold/10 transition-colors"
              >
                {"{email}"} (Email)
              </button>
              <button
                type="button"
                onClick={() => setWatermarkTemplate((t) => (t.includes("{ip}") ? t : `${t} • IP: {ip}`))}
                className="font-mono font-bold bg-background-secondary border border-border text-gold px-2 py-0.5 rounded hover:bg-gold/10 transition-colors"
              >
                {"{ip}"} (Adresse IP)
              </button>
            </div>
          </div>

          {/* Réglages visuels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground">
                Emplacement sur la page
              </label>
              <select
                value={watermarkPosition}
                onChange={(e) => setWatermarkPosition(e.target.value as any)}
                className="w-full mt-1.5 p-2.5 text-xs rounded-xl bg-background border border-border focus:border-gold focus:outline-none text-foreground cursor-pointer"
              >
                <option value="diagonal">Diagonale (Au centre en biais)</option>
                <option value="header">En haut (En-tête de page)</option>
                <option value="footer">En bas (Pied de page)</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Visibilité / Transparence
                </label>
                <span className="text-xs font-bold font-mono text-gold bg-gold/10 px-2 py-0.5 rounded">
                  {Math.round(watermarkOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.50"
                step="0.05"
                value={watermarkOpacity}
                onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                className="w-full mt-2.5 accent-navy cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-foreground-muted font-mono mt-1">
                <span>Très discret (5%)</span>
                <span>Idéal (20%)</span>
                <span>Très visible (50%)</span>
              </div>
            </div>
          </div>

          {/* Aperçu en direct */}
          <div className="rounded-xl border border-border bg-background p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-foreground-muted">
                Aperçu en direct sur une page
              </span>
              <div className="flex items-center gap-1 bg-background-secondary p-1 rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setPreviewTab("laha")}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    previewTab === "laha"
                      ? "bg-gold text-navy-dark shadow-sm"
                      : "text-foreground-muted hover:text-foreground"
                  }`}
                >
                  Vue Lecteur LAHAThèque
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("partner")}
                  className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    previewTab === "partner"
                      ? "bg-gold text-navy-dark shadow-sm"
                      : "text-foreground-muted hover:text-foreground"
                  }`}
                >
                  Vue Lecteur Partenaire
                </button>
              </div>
            </div>

            <div className="relative h-36 w-full rounded-lg bg-background-secondary border border-dashed border-border overflow-hidden flex flex-col justify-between p-3 select-none">
              {/* Position Header */}
              {watermarkPosition === "header" && (
                <div
                  style={{ opacity: watermarkOpacity }}
                  className="text-center font-bold text-[11px] sm:text-xs text-navy tracking-tight"
                >
                  {previewTab === "laha" ? previewLahaText : previewPartnerText}
                </div>
              )}

              {/* Position Diagonale */}
              {watermarkPosition === "diagonal" && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div
                    style={{ opacity: watermarkOpacity }}
                    className="transform -rotate-12 text-center font-bold text-[11px] sm:text-xs text-navy tracking-tight px-4"
                  >
                    {previewTab === "laha" ? previewLahaText : previewPartnerText}
                  </div>
                </div>
              )}

              {/* Lignes de texte factices */}
              <div className="space-y-1.5 opacity-25 pointer-events-none">
                <div className="h-2 w-3/4 bg-foreground rounded" />
                <div className="h-2 w-full bg-foreground rounded" />
                <div className="h-2 w-5/6 bg-foreground rounded" />
                <div className="h-2 w-2/3 bg-foreground rounded" />
              </div>

              {/* Position Footer */}
              {watermarkPosition === "footer" && (
                <div
                  style={{ opacity: watermarkOpacity }}
                  className="text-center font-bold text-[11px] sm:text-xs text-navy tracking-tight"
                >
                  {previewTab === "laha" ? previewLahaText : previewPartnerText}
                </div>
              )}
            </div>
          </div>

          {/* Signature invisible anti-fuite */}
          <div
            onClick={() => setInvisibleEnabled((v) => !v)}
            className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border cursor-pointer hover:border-navy-hover transition-colors"
          >
            <div className="pr-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-gold" />
                <p className="text-xs font-semibold text-foreground">Signature invisible anti-fuite</p>
              </div>
              <p className="text-[11px] text-foreground-muted mt-0.5">
                Incruste un code cryptographique caché dans le fichier. Même si un pirate efface le filigrane visible, ce code permet de retrouver qui a divulgué le livre.
              </p>
            </div>
            <button
              type="button"
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                invisibleEnabled ? "bg-navy" : "bg-muted"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  invisibleEnabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>

        {/* 3. Interdictions & Contrôle d'accès */}
        <div className="p-5 sm:p-6 rounded-2xl bg-background-secondary border border-border space-y-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Lock className="w-4 h-4 text-gold" />
            Interdictions de Copie & Limites d'Accès
          </h2>

          <div className="space-y-3">
            {/* Interdire Impression */}
            <div
              onClick={() => setBlockPrint((v) => !v)}
              className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border cursor-pointer hover:border-navy-hover transition-colors"
            >
              <div className="flex items-center gap-3 pr-4">
                <div className="p-2 rounded-lg bg-navy/5 text-navy">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Interdire l'impression des pages</p>
                  <p className="text-[11px] text-foreground-muted">Bloque le raccourci Ctrl+P et rend les pages invisibles à l'impression.</p>
                </div>
              </div>
              <button
                type="button"
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                  blockPrint ? "bg-navy" : "bg-muted"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    blockPrint ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Interdire Copier-Coller */}
            <div
              onClick={() => setBlockCopy((v) => !v)}
              className="flex items-center justify-between p-3.5 rounded-xl bg-background border border-border cursor-pointer hover:border-navy-hover transition-colors"
            >
              <div className="flex items-center gap-3 pr-4">
                <div className="p-2 rounded-lg bg-navy/5 text-navy">
                  <Copy className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Interdire la copie de texte</p>
                  <p className="text-[11px] text-foreground-muted">Empêche de sélectionner ou copier le texte brut avec la souris ou Ctrl+C.</p>
                </div>
              </div>
              <button
                type="button"
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${
                  blockCopy ? "bg-navy" : "bg-muted"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    blockCopy ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Compteurs numériques Appareils & Durée de Session */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-xl bg-background border border-border space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-navy" />
                    Nombre d'écrans simultanés
                  </span>
                  <span className="font-mono text-xs font-bold text-navy bg-navy/10 px-2 py-0.5 rounded">
                    {maxDevices} écran{maxDevices > 1 ? "s" : ""} max
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMaxDevices((v) => Math.max(1, v - 1))}
                    className="w-8 h-8 rounded-lg bg-background-secondary border border-border text-foreground font-bold hover:bg-gold/10 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={maxDevices}
                    onChange={(e) => setMaxDevices(parseInt(e.target.value) || 1)}
                    className="flex-1 accent-navy cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setMaxDevices((v) => Math.min(10, v + 1))}
                    className="w-8 h-8 rounded-lg bg-background-secondary border border-border text-foreground font-bold hover:bg-gold/10 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <p className="text-[10px] text-foreground-muted">Nombre d'appareils pouvant lire en même temps avec le même compte.</p>
              </div>

              <div className="p-3.5 rounded-xl bg-background border border-border space-y-2">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-navy" />
                    Durée d'une session de lecture
                  </span>
                  <span className="font-mono text-xs font-bold text-navy bg-navy/10 px-2 py-0.5 rounded">
                    {sessionDurationMinutes} min
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSessionDurationMinutes((v) => Math.max(5, v - 5))}
                    className="w-8 h-8 rounded-lg bg-background-secondary border border-border text-foreground font-bold hover:bg-gold/10 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="range"
                    min={5}
                    max={120}
                    step={5}
                    value={sessionDurationMinutes}
                    onChange={(e) => setSessionDurationMinutes(parseInt(e.target.value) || 5)}
                    className="flex-1 accent-navy cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setSessionDurationMinutes((v) => Math.min(120, v + 5))}
                    className="w-8 h-8 rounded-lg bg-background-secondary border border-border text-foreground font-bold hover:bg-gold/10 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
                <p className="text-[10px] text-foreground-muted">Fréquence de vérification des droits en cours de lecture.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bouton Enregistrer */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-gold" />
            <span>{isSaving ? "Enregistrement en cours..." : "Enregistrer les modifications"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
