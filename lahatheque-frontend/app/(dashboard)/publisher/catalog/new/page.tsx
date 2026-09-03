"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  PlusCircle,
  Sparkles,
  Upload,
  Save,
  CheckCircle2,
  ShieldCheck,
  DollarSign,
  Tag,
  Info,
  Building2,
  Bot,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { FileDropzone } from "@/components/features/layout-artist/file-dropzone";
import { createPublisherBook, extractBookMetadataWithAi } from "@/lib/services/publisher";
import type { SalesModel, PublisherAiMetadataSuggestion } from "@/lib/types/publisher";
import { getDisciplines, type DisciplineItem } from "@/lib/services/classification";
import { DisciplineCombobox } from "@/components/features/catalog/discipline-combobox";
import { InlineLoader } from "@/components/ui/page-loader";

export default function NewPublisherBookPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  // Bloc 1: Identification
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [isbnDigital, setIsbnDigital] = useState("");
  const [isbnPrint, setIsbnPrint] = useState("");
  const [doi, setDoi] = useState("");
  const [language, setLanguage] = useState("fr");

  // Bloc 2: Contributeurs
  const [authors, setAuthors] = useState("");
  const [coAuthors, setCoAuthors] = useState("");

  // Bloc 3: Classification & IA
  const [disciplinesList, setDisciplinesList] = useState<DisciplineItem[]>([]);
  const [categories, setCategories] = useState<string[]>(["Droit Public & Administration"]);
  const [discipline, setDiscipline] = useState("Droit Public & Administration");
  const [keywords, setKeywords] = useState("droit, afrique, uac");
  const [targetAudience, setTargetAudience] = useState<"universitaire" | "professionnel" | "grand_public">("universitaire");
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  useEffect(() => {
    getDisciplines().then((list) => {
      if (list && list.length > 0) {
        setDisciplinesList(list);
        setCategories([list[0].name]);
        setDiscipline(list[0].name);
      }
    });
  }, []);

  // Bloc 4: Commercial
  const [price, setPrice] = useState(12000);
  const [currency, setCurrency] = useState("XOF");
  const [salesModel, setSalesModel] = useState<SalesModel>("purchase");
  const [territories, setTerritories] = useState("Bénin, Togo, Côte d'Ivoire, Sénégal");

  // Bloc 5: Description & Visuels
  const [summary, setSummary] = useState("");
  const [authorsBio, setAuthorsBio] = useState("");
  const [manuscriptFile, setManuscriptFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  const handleCoverSelect = (f: File) => {
    setCoverFile(f);
    const url = URL.createObjectURL(f);
    setCoverPreview(url);
    toast.success(`Couverture « ${f.name} » prête pour l'envoi.`);
  };

  const handleCoverRemove = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    setCoverPreview(null);
  };

  // Bloc 6: Droits & Licences
  const [licenceType, setLicenceType] = useState<"tous_droits_reserves" | "creative_commons">("tous_droits_reserves");
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Analyse et complétion par IA (OpenAI / Heuristique)
  const handleAiSuggest = async () => {
    if (!title.trim() && !manuscriptFile) {
      toast.info("Veuillez d'abord saisir le titre ou sélectionner le fichier manuscrit.");
      return;
    }
    setAiAnalyzing(true);
    try {
      const res = await extractBookMetadataWithAi({
        title: title.trim() || undefined,
        filename: manuscriptFile?.name,
        file: manuscriptFile || undefined,
      });
      if ((res as any).disciplines && (res as any).disciplines.length > 0) {
        setCategories((res as any).disciplines);
        setDiscipline((res as any).disciplines[0]);
      } else if (res.discipline) {
        setCategories([res.discipline]);
        setDiscipline(res.discipline);
      }
      if (res.language) setLanguage(res.language);
      if (res.suggested_keywords && res.suggested_keywords.length > 0) {
        setKeywords(res.suggested_keywords.join(", "));
      }
      if (res.summary) {
        setSummary(res.summary);
      }
      if (res.target_audience) {
        setTargetAudience(res.target_audience);
      }
      const modeLabel = res.analysis_mode === "openai" ? "Analyse IA (OpenAI)" : "Classification thématique";
      toast.success(`${modeLabel} : métadonnées et résumé appliqués avec succès.`);
    } catch {
      toast.error("Erreur lors de l'analyse IA. Les champs par défaut sont conservés.");
    } finally {
      setAiAnalyzing(false);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !isbnDigital || !authors) {
      toast.error("Veuillez renseigner les champs obligatoires (Titre, ISBN et Auteurs).");
      return;
    }

    setSubmitting(true);
    try {
      await createPublisherBook(
        {
          title,
          subtitle: subtitle || undefined,
          isbn_digital: isbnDigital,
          isbn_print: isbnPrint || undefined,
          doi: doi || undefined,
          authors: authors.split(",").map((a) => a.trim()).filter(Boolean),
          discipline: categories[0] || discipline,
          disciplines: categories,
          language,
          keywords: keywords.split(",").map((k) => k.trim()).filter(Boolean),
          target_audience: targetAudience,
          price,
          currency,
          sales_model: salesModel,
          allowed_territories: territories.split(",").map((t) => t.trim()).filter(Boolean),
          summary: summary || "Ouvrage déposé pour examen éditorial.",
          authors_bio: authorsBio,
          licence_type: licenceType,
          protection_config: {
            watermark_enabled: watermarkEnabled,
            watermark_position: "bottom-right",
            watermark_opacity: 30,
            user_watermarking: true,
            lcp_drm_enabled: true,
            max_allowed_devices: 3,
            max_loan_days: 14,
            disable_copy_paste: true,
            disable_print: false,
            audio_encryption_auto: true,
            access_tracing_auto: true,
          },
        },
        manuscriptFile,
        coverFile
      );


      toast.success("L'ouvrage et sa couverture ont été transmis avec succès au comité.");
      router.push("/publisher/catalog");
    } catch {
      toast.error("Erreur lors du dépôt de l'ouvrage. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  const stepLabels = [
    "1. Identification",
    "2. Contributeurs",
    "3. Fichiers & Résumé",
    "4. Commercial",
    "5. Classification (IA)",
    "6. Droits & Protection",
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href="/publisher/catalog"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-navy hover:text-gold transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au Catalogue
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold font-serif text-navy tracking-tight">
            Nouveau Dépôt d&apos;Ouvrage Partenaire
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted mt-0.5">
            Renseignez les métadonnées et téléversez votre fichier d&apos;épreuve pour soumission au comité LAHA.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAiSuggest}
          disabled={aiAnalyzing}
          className="px-4 py-2.5 rounded-xl bg-gold/15 text-gold border border-gold/30 hover:bg-gold/25 font-bold text-xs transition-colors flex items-center gap-2 shadow-xs shrink-0 min-h-[44px] disabled:opacity-50"
        >
          {aiAnalyzing ? (
            <InlineLoader size={16} />
          ) : (
            <Bot className="w-4 h-4 text-gold" />
          )}
          <span>{aiAnalyzing ? "Analyse IA en cours..." : "Pré-remplir par Assistant IA"}</span>
        </button>
      </div>

      {/* Stepper Navigation */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 p-2 rounded-2xl bg-background-secondary border border-border">
        {stepLabels.map((lbl, idx) => {
          const stepNum = idx + 1;
          const isActive = currentStep === stepNum;
          const isPassed = currentStep > stepNum;
          return (
            <button
              key={lbl}
              type="button"
              onClick={() => setCurrentStep(stepNum)}
              className={`p-2.5 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between min-h-[44px] ${
                isActive
                  ? "bg-navy text-white shadow-xs"
                  : isPassed
                  ? "bg-background text-emerald-700 border border-emerald-500/30"
                  : "text-foreground-muted hover:bg-background"
              }`}
            >
              <span className="truncate">{lbl}</span>
              {isPassed && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
            </button>
          );
        })}
      </div>

      {/* Formulaire Multi-Étapes */}
      <form onSubmit={handleSubmit} className="p-6 rounded-3xl bg-background border border-border space-y-6 shadow-xs">
        {/* Étape 1: Identification */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <BookOpen className="w-5 h-5 text-gold" />
              <h2 className="font-serif font-bold text-navy text-base">Identification Bibliographique</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">
                  Titre Principal de l&apos;Ouvrage <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="ex. Traité Général de Droit International et Africain"
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">Sous-Titre (Optionnel)</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="ex. Principes, Traités et Jurisprudence OHADA"
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">
                  ISBN Numérique (EPUB/PDF) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={isbnDigital}
                  onChange={(e) => setIsbnDigital(e.target.value)}
                  placeholder="978-2-01-398010-4"
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-mono min-h-[44px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">ISBN Format Papier</label>
                <input
                  type="text"
                  value={isbnPrint}
                  onChange={(e) => setIsbnPrint(e.target.value)}
                  placeholder="978-2-01-398011-1"
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-mono min-h-[44px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">Identifiant DOI</label>
                <input
                  type="text"
                  value={doi}
                  onChange={(e) => setDoi(e.target.value)}
                  placeholder="10.1016/j.afadmin.2025.01"
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-mono min-h-[44px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">Langue de l&apos;Ouvrage</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
                >
                  <option value="fr">Français</option>
                  <option value="en">Anglais</option>
                  <option value="es">Espagnol</option>
                  <option value="pt">Portugais</option>
                  <option value="ar">Arabe</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Étape 2: Contributeurs */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <BookOpen className="w-5 h-5 text-gold" />
              <h2 className="font-serif font-bold text-navy text-base">Contributeurs &amp; Auteurs</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">
                  Auteur(s) Principal(aux) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                  placeholder="ex. Prof. Augustin CHAKIROU, Dr. Honoré ZINSOU"
                  required
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
                />
                <p className="text-[11px] text-foreground-muted">Séparez les noms d&apos;auteurs par une virgule.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">
                  Co-auteurs, Traducteurs ou Préfaciers
                </label>
                <input
                  type="text"
                  value={coAuthors}
                  onChange={(e) => setCoAuthors(e.target.value)}
                  placeholder="ex. Dr. Fatou DIOP (Préfacier)"
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Étape 3: Fichiers & Résumé */}
        {currentStep === 3 && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Upload className="w-5 h-5 text-gold" />
              <h2 className="font-serif font-bold text-navy text-base">Fichiers &amp; Éléments Visuels</h2>
            </div>

            {/* Grille Couverture + Manuscrit */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* 1. Première de Couverture */}
              <div className="space-y-2 p-4 rounded-2xl bg-background-secondary border border-border">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-gold" />
                    Première de Couverture (Image)
                  </label>
                  {coverFile && (
                    <button
                      type="button"
                      onClick={handleCoverRemove}
                      className="text-[11px] font-semibold text-rose-500 hover:underline inline-flex items-center gap-1"
                    >
                      <X className="w-3 h-3" /> Supprimer
                    </button>
                  )}
                </div>

                {coverPreview ? (
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-background border border-border">
                    <img
                      src={coverPreview}
                      alt="Aperçu couverture"
                      className="w-16 h-22 object-cover rounded-lg border border-border shadow-xs shrink-0"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-xs font-bold text-navy truncate">{coverFile?.name}</p>
                      <p className="text-[10px] text-foreground-muted font-mono">
                        {coverFile ? `${(coverFile.size / 1024).toFixed(1)} Ko` : ""}
                      </p>
                      <span className="inline-block text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 font-semibold">
                        Couverture prête
                      </span>
                    </div>
                  </div>
                ) : (
                  <FileDropzone
                    label="Téléverser l'Image de Couverture (PNG, JPG, WEBP)"
                    acceptTypes={[".png", ".jpg", ".jpeg", ".webp"]}
                    selectedFileName={coverFile?.name}
                    selectedFileSize={coverFile?.size}
                    onFileSelect={handleCoverSelect}
                    onFileRemove={handleCoverRemove}
                  />
                )}
                <p className="text-[10px] text-foreground-muted">
                  Format recommandé : 1600x2400 px (ratio 3:4), max 10 Mo.
                </p>
              </div>

              {/* 2. Manuscrit PDF */}
              <div className="space-y-2 p-4 rounded-2xl bg-background-secondary border border-border">
                <label className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="w-3.5 h-3.5 text-gold" />
                  Manuscrit / Épreuve Numérique (PDF)
                </label>
                <FileDropzone
                  label="Téléverser le Manuscrit (PDF uniquement)"
                  acceptTypes={[".pdf"]}
                  selectedFileName={manuscriptFile?.name}
                  selectedFileSize={manuscriptFile?.size}
                  onFileSelect={(f) => {
                    setManuscriptFile(f);
                    toast.success(`Manuscrit « ${f.name} » prêt pour l'envoi.`);
                  }}
                  onFileRemove={() => setManuscriptFile(null)}
                />
                <p className="text-[10px] text-foreground-muted">
                  Document complet avec mentions légales et table des matières.
                </p>
              </div>
            </div>

            {/* Résumé et Biographie */}
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">
                  Résumé / Quatrième de Couverture
                </label>
                <textarea
                  rows={4}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Présentation synthétique du contenu de l'ouvrage..."
                  className="w-full p-3.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-medium leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">Biographie de l&apos;Auteur</label>
                <textarea
                  rows={2}
                  value={authorsBio}
                  onChange={(e) => setAuthorsBio(e.target.value)}
                  placeholder="Notice biographique et affiliations universitaires..."
                  className="w-full p-3.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-medium leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* Étape 4: Commercial */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <DollarSign className="w-5 h-5 text-gold" />
              <h2 className="font-serif font-bold text-navy text-base">Modèle Commercial &amp; Territoires</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">Prix Public Unitaire</label>
                <div className="relative">
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    min={0}
                    className="w-full pl-3.5 pr-16 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-bold min-h-[44px]"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-foreground-muted">
                    {currency}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">Modèle de Distribution</label>
                <select
                  value={salesModel}
                  onChange={(e) => setSalesModel(e.target.value as SalesModel)}
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
                >
                  <option value="purchase">Vente à l&apos;unité uniquement</option>
                  <option value="subscription">Inclus dans les abonnements</option>
                  <option value="bundle">Intégrable aux bouquets institutionnels</option>
                  <option value="free">Accès Libre (Open Access)</option>
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">
                  Territoires d&apos;Exploitation Autorisés
                </label>
                <input
                  type="text"
                  value={territories}
                  onChange={(e) => setTerritories(e.target.value)}
                  placeholder="ex. Bénin, Togo, Côte d'Ivoire, Sénégal, France, Monde"
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Étape 5: Classification (IA) */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold" />
                <h2 className="font-serif font-bold text-navy text-base">Classification Thématique &amp; Académique</h2>
              </div>
              <button
                type="button"
                onClick={handleAiSuggest}
                disabled={aiAnalyzing}
                className="text-xs font-bold text-gold hover:underline inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {aiAnalyzing ? (
                  <InlineLoader size={14} />
                ) : (
                  <Bot className="w-3.5 h-3.5" />
                )}
                <span>Auto-classification IA</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">
                  Disciplines / Catégories <span className="text-[10px] font-normal text-foreground-muted">(Plusieurs choix possibles)</span>
                </label>
                <DisciplineCombobox
                  multiple={true}
                  values={categories}
                  onValuesChange={(newVals) => {
                    setCategories(newVals);
                    if (newVals.length > 0) setDiscipline(newVals[0]);
                  }}
                  disciplines={disciplinesList}
                  placeholder="Sélectionner ou rechercher une discipline..."
                  searchPlaceholder="Rechercher parmi les disciplines..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">Public Cible</label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
                >
                  <option value="universitaire">Niveau Universitaire (Licence/Master/Doctorat)</option>
                  <option value="professionnel">Professionnels &amp; Praticiens</option>
                  <option value="grand_public">Grand Public &amp; Culture Générale</option>
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">Mots-Clés Thématiques</label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="ex. droit public, afrique de l'ouest, uac, contentieux"
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
                />
              </div>
            </div>
          </div>
        )}


        {/* Étape 6: Droits & Protection */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <ShieldCheck className="w-5 h-5 text-gold" />
              <h2 className="font-serif font-bold text-navy text-base">Droits, Licences &amp; Tatouage Numérique</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">Type de Licence</label>
                <select
                  value={licenceType}
                  onChange={(e) => setLicenceType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 text-xs bg-background-secondary border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-semibold min-h-[44px]"
                >
                  <option value="tous_droits_reserves">Tous Droits Réservés (Convention LAHA)</option>
                  <option value="creative_commons">Creative Commons (CC-BY-NC)</option>
                </select>
              </div>

              <div className="p-4 rounded-2xl bg-background-secondary border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-navy">Activer le Tatouage Visible Personnalisé</span>
                  <button
                    type="button"
                    onClick={() => setWatermarkEnabled(!watermarkEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                      watermarkEnabled ? "bg-gold" : "bg-border"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        watermarkEnabled ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                <p className="text-[11px] text-foreground-muted">
                  Applique dynamiquement le nom du lecteur, la date et le numéro de licence sur chaque page.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Boutons de Navigation Suivant / Précédent */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
              className="px-5 py-2.5 rounded-xl bg-background-secondary border border-border text-xs font-bold text-navy hover:bg-background transition-colors min-h-[44px]"
            >
              Étape Précédente
            </button>
          ) : (
            <div />
          )}

          {currentStep < 6 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((s) => Math.min(6, s + 1))}
              className="px-5 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors min-h-[44px] shadow-xs"
            >
              Étape Suivante
            </button>
          ) : (
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-gold text-navy font-bold text-xs hover:bg-gold-light transition-all flex items-center gap-2 min-h-[44px] shadow-sm disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <InlineLoader size={16} />
                  <span>Envoi en cours...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Soumettre au Comité LAHA</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
