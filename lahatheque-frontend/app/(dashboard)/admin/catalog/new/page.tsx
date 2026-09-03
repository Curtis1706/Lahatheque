"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
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
  Image as ImageIcon,
  X,
  FileText,
  HelpCircle,
  Radio,
  Boxes,
  Percent,
} from "lucide-react";
import { toast } from "sonner";
import { FileDropzone } from "@/components/features/layout-artist/file-dropzone";
import { CreatorSelector } from "@/components/features/catalog/creator-selector";
import { createAdminCatalogBook } from "@/lib/services/admin";
import { extractBookMetadataWithAi } from "@/lib/services/publisher";
import { getDisciplines, type DisciplineItem } from "@/lib/services/classification";
import type { CreatorOption } from "@/lib/services/creators";
import { AFRICAN_COUNTRIES_PRESET } from "@/lib/services/countries";
import { InlineLoader } from "@/components/ui/page-loader";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";

export default function AdminNewProductPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [disciplinesList, setDisciplinesList] = useState<DisciplineItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  // ─── Étape 1 : Identité (Le livre) ──────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [authorPublisher, setAuthorPublisher] = useState("LAHA Éditions");
  const [selectedCreator, setSelectedCreator] = useState<CreatorOption | null>(null);
  const [country, setCountry] = useState("Tous les pays");
  const [summary, setSummary] = useState("");
  const [disciplineName, setDisciplineName] = useState("Manuels scolaires");
  const [targetAudience, setTargetAudience] = useState("CM2");
  const [reductionPercent, setReductionPercent] = useState<number>(0);
  const [isNewRelease, setIsNewRelease] = useState(true);

  // ─── Étape 2 : Formats & prix (Offre commerciale) ───────────────────────────
  const [formatType, setFormatType] = useState<"pdf" | "epub" | "audio">("pdf");
  const [isbnDigital, setIsbnDigital] = useState("");
  const [isbnPrint, setIsbnPrint] = useState("");
  const [isPaperAvailable, setIsPaperAvailable] = useState(true);
  const [priceDigital, setPriceDigital] = useState<number>(5000);
  const [pricePaper, setPricePaper] = useState<number>(7500);
  const [currency, setCurrency] = useState("FCFA");
  const [licenceType, setLicenceType] = useState("tous_droits_reserves");
  const [territories, setTerritories] = useState("Tous les pays");

  // ─── Étape 3 : Fichiers (Documents) ─────────────────────────────────────────
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [manuscriptFile, setManuscriptFile] = useState<File | null>(null);

  // ─── Étape 4 : Validation ───────────────────────────────────────────────────
  const [publicationStatus, setPublicationStatus] = useState<"published" | "draft">("published");

  // Chargement des disciplines
  useEffect(() => {
    async function loadDisciplines() {
      try {
        const data = await getDisciplines();
        if (data && data.length > 0) {
          setDisciplinesList(data);
          if (!disciplineName) setDisciplineName(data[0].name);
        }
      } catch (err) {
        console.error("Erreur chargement disciplines", err);
      }
    }
    loadDisciplines();
  }, []);

  const disciplineOptions: SearchableOption[] = useMemo(() => {
    if (disciplinesList.length > 0) {
      return disciplinesList.map((d) => ({
        value: d.name,
        label: d.name,
        subtitle: d.code_dewey ? `Dewey ${d.code_dewey}` : undefined,
        badge: d.code_dewey || undefined,
      }));
    }
    return [
      { value: "Manuels scolaires", label: "Manuels scolaires" },
      { value: "Droit & Sciences Politiques", label: "Droit & Sciences Politiques" },
      { value: "Sciences Économiques & Gestion", label: "Sciences Économiques & Gestion" },
      { value: "Littérature Africaine & Conte", label: "Littérature Africaine & Conte" },
      { value: "Sciences Exactes & Technologies", label: "Sciences Exactes & Technologies" },
      { value: "Philosophie & Sciences Humaines", label: "Philosophie & Sciences Humaines" },
      { value: "Arts, Culture & Musique", label: "Arts, Culture & Musique" },
    ];
  }, [disciplinesList]);

  // Gestion Couverture
  const handleCoverSelect = (f: File) => {
    setCoverFile(f);
    const url = URL.createObjectURL(f);
    setCoverPreview(url);
    toast.success(`Couverture « ${f.name} » prête.`);
  };

  const handleCoverRemove = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(null);
    setCoverPreview(null);
  };

  // Assistant IA pour Résumé et Métadonnées
  const handleAiSuggest = async () => {
    if (!title.trim() && !manuscriptFile) {
      toast.info("Veuillez saisir au moins le titre de l'ouvrage pour l'analyse IA.");
      return;
    }
    setAiAnalyzing(true);
    try {
      const res = await extractBookMetadataWithAi({
        title: title.trim() || undefined,
        filename: manuscriptFile?.name,
        file: manuscriptFile || undefined,
      });
      if (res.discipline) setDisciplineName(res.discipline);
      if (res.summary && !summary) setSummary(res.summary);
      if (res.target_audience) setTargetAudience(res.target_audience);
      toast.success("Classification et résumé suggérés par l'IA appliqués avec succès.");
    } catch {
      toast.error("Erreur lors de l'analyse IA. Vous pouvez remplir les champs manuellement.");
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Soumission finale
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Veuillez renseigner le titre du livre.");
      setCurrentStep(1);
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title.trim());
      if (subtitle.trim()) formData.append("subtitle", subtitle.trim());

      // Auteur et Éditeur & Liaisons de Droits
      const authorTrimmed = authorPublisher.trim();
      formData.append("authors_names", authorTrimmed || "Auteur LAHA");

      if (selectedCreator) {
        if (selectedCreator.type === "author") {
          if (selectedCreator.user_id) formData.append("author_user_id", selectedCreator.user_id);
          formData.append("author_id", selectedCreator.id);
          if (selectedCreator.email) formData.append("authors_emails", selectedCreator.email);
          formData.append("publisher_name", "LAHA Éditions");
        } else if (selectedCreator.type === "publisher") {
          formData.append("publisher_id", selectedCreator.id);
          formData.append("publisher_name", selectedCreator.name);
          if (selectedCreator.user_id) formData.append("author_user_id", selectedCreator.user_id);
        }
      } else {
        formData.append("publisher_name", authorTrimmed.toLowerCase().includes("laha") ? "LAHA Éditions" : authorTrimmed);
      }

      // Pays & Classification
      formData.append("country", country === "Tous les pays" ? "GL" : country);
      formData.append("discipline_name", disciplineName);
      formData.append("target_audience", targetAudience);
      formData.append("summary", summary || "Ouvrage ajouté au catalogue officiel.");
      formData.append("keywords", isNewRelease ? "Nouveauté, Catalogue Officiel" : "Catalogue Officiel");

      // Formats & Tarification
      formData.append("format_type", formatType);
      formData.append("isbn", isbnDigital.trim() || (isPaperAvailable ? isbnPrint.trim() : "") || `978-LAHA-${Date.now().toString().slice(-6)}`);
      formData.append("price_digital", String(priceDigital || 0));
      formData.append("price_paper", String(pricePaper || 0));
      formData.append("is_paper_available", isPaperAvailable ? "true" : "false");
      formData.append("status", publicationStatus);

      // Fichiers
      if (manuscriptFile) {
        formData.append("book_file", manuscriptFile, manuscriptFile.name);
      }
      if (coverFile) {
        formData.append("cover_image", coverFile, coverFile.name);
      }

      const res = await createAdminCatalogBook(formData);
      if (res.success) {
        toast.success(`L'ouvrage « ${title} » a été ajouté et publié avec succès au catalogue.`);
        router.push("/admin/catalog");
      } else {
        toast.error(res.error || "Erreur lors de l'enregistrement de l'ouvrage.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur réseau lors de la création.");
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: "Identité", sub: "Le livre" },
    { num: 2, title: "Formats & prix", sub: "Offre commerciale" },
    { num: 3, title: "Fichiers", sub: "Documents" },
    { num: 4, title: "Validation", sub: "Vérification" },
  ];

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* En-tête de la page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-gold font-mono block">
            Espace Administration • Catalogue
          </span>
          <h1 className="font-serif text-2xl font-bold text-navy mt-0.5">Ajouter un produit</h1>
          <p className="text-xs text-foreground-muted">Workflow de création en étapes séparées.</p>
        </div>

        {/* Boutons d'accès rapide en haut à droite */}
        <div className="flex items-center gap-2">
          <Link
            href="/admin/catalog"
            className="px-3.5 py-1.5 rounded-xl border border-border bg-background-secondary text-xs font-semibold text-navy hover:border-gold transition-colors inline-flex items-center gap-1.5 min-h-[36px]"
          >
            <BookOpen className="w-3.5 h-3.5 text-gold" />
            <span>Catalogue</span>
          </Link>
          <Link
            href="/admin/stock"
            className="px-3.5 py-1.5 rounded-xl border border-border bg-background-secondary text-xs font-semibold text-navy hover:border-gold transition-colors inline-flex items-center gap-1.5 min-h-[36px]"
          >
            <Boxes className="w-3.5 h-3.5 text-navy" />
            <span>Stock &amp; Hubs</span>
          </Link>
          <Link
            href="/admin/catalog/pricing"
            className="px-3.5 py-1.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-1.5 min-h-[36px] shadow-xs"
          >
            <Tag className="w-3.5 h-3.5 text-gold" />
            <span>Tarification</span>
          </Link>
        </div>
      </div>

      {/* Carte Principale du Workflow */}
      <div className="bg-background rounded-3xl border border-border shadow-xs overflow-hidden">
        {/* Titre interne de la carte */}
        <div className="p-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-background-secondary/30">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gold font-mono block mb-1">
              Workflow Produit
            </span>
            <h2 className="font-serif font-bold text-xl text-navy">Créer un produit</h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Chaque étape est séparée pour éviter les erreurs de saisie.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-background border border-border text-xs font-semibold text-foreground-muted self-start sm:self-auto shadow-2xs">
            Nouveau
          </span>
        </div>

        {/* Stepper 4 étapes */}
        <div className="p-4 sm:p-6 border-b border-border bg-background-secondary/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {steps.map((s) => {
              const isActive = currentStep === s.num;
              const isPast = currentStep > s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setCurrentStep(s.num)}
                  className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-3 cursor-pointer ${
                    isActive
                      ? "bg-background border-gold ring-1 ring-gold shadow-xs"
                      : isPast
                      ? "bg-background/80 border-border hover:border-gold/50"
                      : "bg-background-secondary/60 border-border/70 opacity-70 hover:opacity-100"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                      isActive
                        ? "bg-navy text-gold"
                        : isPast
                        ? "bg-emerald-500/15 text-emerald-700 font-bold"
                        : "bg-foreground-muted/15 text-foreground-muted"
                    }`}
                  >
                    {isPast ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : s.num}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${isActive ? "text-navy" : "text-foreground"}`}>
                      {s.title}
                    </p>
                    <p className="text-[10px] text-foreground-muted truncate">{s.sub}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenu du Formulaire par Étape */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ══════════════════════════════════════════════════════════════════════
              ÉTAPE 1 : IDENTITÉ (Le livre)
          ══════════════════════════════════════════════════════════════════════ */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 01 Informations principales */}
              <div className="p-5 rounded-2xl bg-background-secondary/40 border border-border space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-navy/10 text-navy font-bold text-xs flex items-center justify-center font-mono">
                    01
                  </span>
                  <div>
                    <h3 className="font-serif font-bold text-navy text-sm">Informations principales</h3>
                    <p className="text-[11px] text-foreground-muted">Les informations visibles sur la fiche du livre.</p>
                  </div>
                </div>

                <div className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-navy">Titre du livre *</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Titre du livre"
                      className="w-full p-3 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-medium"
                    />
                  </div>

                  {/* Sélecteur intelligent Auteur / Éditeur avec attribution automatique des droits */}
                  <CreatorSelector
                    value={authorPublisher}
                    onChange={(val) => setAuthorPublisher(val)}
                    onSelectCreator={(creator) => setSelectedCreator(creator)}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-navy">Pays</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full p-3 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-medium"
                  >
                    <option value="Tous les pays">Tous les pays</option>
                    <option value="BJ">Bénin</option>
                    <option value="CI">Côte d&apos;Ivoire</option>
                    <option value="SN">Sénégal</option>
                    <option value="TG">Togo</option>
                    <option value="BF">Burkina Faso</option>
                    <option value="ML">Mali</option>
                    <option value="NE">Niger</option>
                    <option value="GN">Guinée</option>
                    <option value="CM">Cameroun</option>
                    <option value="GA">Gabon</option>
                    <option value="CG">Congo</option>
                    <option value="FR">France</option>
                    <option value="GL">International / Global</option>
                  </select>
                </div>
              </div>

              {/* 02 Résumé éditorial */}
              <div className="p-5 rounded-2xl bg-background-secondary/40 border border-border space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-lg bg-navy/10 text-navy font-bold text-xs flex items-center justify-center font-mono">
                      02
                    </span>
                    <div>
                      <h3 className="font-serif font-bold text-navy text-sm">Résumé éditorial</h3>
                      <p className="text-[11px] text-foreground-muted">Décrivez le contenu : l&apos;IA classera ensuite le livre.</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAiSuggest}
                    disabled={aiAnalyzing}
                    className="px-3 py-1.5 rounded-xl bg-gold/15 border border-gold/40 text-navy hover:bg-gold/25 transition-colors text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    {aiAnalyzing ? <InlineLoader size={12} /> : <Sparkles className="w-3.5 h-3.5 text-gold" />}
                    <span>Assistance IA</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-navy">Description</label>
                  <textarea
                    rows={4}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Résumé, public visé, programme..."
                    className="w-full p-3 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-medium leading-relaxed"
                  />
                  <p className="text-[11px] text-foreground-muted italic">
                    La catégorie est sélectionnée automatiquement après la saisie.
                  </p>
                </div>
              </div>

              {/* 03 Classement et mise en avant */}
              <div className="p-5 rounded-2xl bg-background-secondary/40 border border-border space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-navy/10 text-navy font-bold text-xs flex items-center justify-center font-mono">
                    03
                  </span>
                  <div>
                    <h3 className="font-serif font-bold text-navy text-sm">Classement et mise en avant</h3>
                    <p className="text-[11px] text-foreground-muted">Vérifiez la proposition de l&apos;IA et ajustez-la si nécessaire.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-navy">Catégorie</label>
                    <SearchableSelect
                      options={disciplineOptions}
                      value={disciplineName}
                      onChange={(val) => setDisciplineName(val)}
                      placeholder="Sélectionner ou rechercher une catégorie..."
                      searchPlaceholder="Rechercher parmi les disciplines..."
                      emptyMessage="Aucune discipline trouvée."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-navy">Niveau d&apos;étude</label>
                    <select
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="w-full p-3 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-medium"
                    >
                      <option value="CM2">CM2</option>
                      <option value="Primaire">Primaire (CI, CP, CE1, CE2, CM1)</option>
                      <option value="6ème">6ème</option>
                      <option value="5ème">5ème</option>
                      <option value="4ème">4ème</option>
                      <option value="3ème">3ème</option>
                      <option value="Seconde">Seconde</option>
                      <option value="Première">Première</option>
                      <option value="Terminale">Terminale</option>
                      <option value="Licence">Licence Universitaire (L1, L2, L3)</option>
                      <option value="Master">Master Universitaire (M1, M2)</option>
                      <option value="Doctorat">Doctorat / Recherche</option>
                      <option value="Tous publics">Tous publics / Général</option>
                    </select>
                    <p className="text-[10px] text-foreground-muted">Demandé uniquement pour les manuels scolaires.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center pt-1">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-navy">Réduction %</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={reductionPercent}
                      onChange={(e) => setReductionPercent(parseInt(e.target.value, 10) || 0)}
                      className="w-full p-3 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-medium font-mono"
                    />
                  </div>

                  <div className="pt-4 flex items-center">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-navy">
                      <input
                        type="checkbox"
                        checked={isNewRelease}
                        onChange={(e) => setIsNewRelease(e.target.checked)}
                        className="w-4 h-4 rounded text-navy border-border focus:ring-gold"
                      />
                      <span>Classer en nouveauté</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              ÉTAPE 2 : FORMATS & PRIX (Offre commerciale)
          ══════════════════════════════════════════════════════════════════════ */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Formats et ISBN */}
              <div className="p-5 rounded-2xl bg-background-secondary/40 border border-border space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-navy/10 text-navy font-bold text-xs flex items-center justify-center font-mono">
                    01
                  </span>
                  <div>
                    <h3 className="font-serif font-bold text-navy text-sm">Formats et Disponibilité</h3>
                    <p className="text-[11px] text-foreground-muted">Type de format numérique et versions disponibles.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-navy">Format Numérique Principal</label>
                    <select
                      value={formatType}
                      onChange={(e) => setFormatType(e.target.value as any)}
                      className="w-full p-3 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-medium"
                    >
                      <option value="pdf">PDF Sécurisé (LCP / Filigrane)</option>
                      <option value="epub">EPUB Recomposable</option>
                      <option value="audio">Livre Audio</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-navy">ISBN Numérique</label>
                    <input
                      type="text"
                      value={isbnDigital}
                      onChange={(e) => setIsbnDigital(e.target.value)}
                      placeholder="978-99919-..."
                      className="w-full p-3 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-medium font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-navy">ISBN Papier (Optionnel)</label>
                    <input
                      type="text"
                      value={isbnPrint}
                      onChange={(e) => setIsbnPrint(e.target.value)}
                      placeholder="978-99919-..."
                      className="w-full p-3 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-medium font-mono"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-navy">
                    <input
                      type="checkbox"
                      checked={isPaperAvailable}
                      onChange={(e) => setIsPaperAvailable(e.target.checked)}
                      className="w-4 h-4 rounded text-navy border-border focus:ring-gold"
                    />
                    <span>Version physique / papier disponible à la commande</span>
                  </label>
                </div>
              </div>

              {/* Tarification commerciale */}
              <div className="p-5 rounded-2xl bg-background-secondary/40 border border-border space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-navy/10 text-navy font-bold text-xs flex items-center justify-center font-mono">
                    02
                  </span>
                  <div>
                    <h3 className="font-serif font-bold text-navy text-sm">Tarification commerciale</h3>
                    <p className="text-[11px] text-foreground-muted">Prix public unitaire en monnaie locale (FCFA / XOF).</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-navy">Prix Numérique (FCFA) *</label>
                    <input
                      type="number"
                      step="500"
                      required
                      value={priceDigital}
                      onChange={(e) => setPriceDigital(parseFloat(e.target.value) || 0)}
                      className="w-full p-3 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-medium font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-navy">Prix Papier (FCFA)</label>
                    <input
                      type="number"
                      step="500"
                      disabled={!isPaperAvailable}
                      value={pricePaper}
                      onChange={(e) => setPricePaper(parseFloat(e.target.value) || 0)}
                      className="w-full p-3 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-medium font-mono disabled:opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Droits & Territoires */}
              <div className="p-5 rounded-2xl bg-background-secondary/40 border border-border space-y-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-navy/10 text-navy font-bold text-xs flex items-center justify-center font-mono">
                    03
                  </span>
                  <div>
                    <h3 className="font-serif font-bold text-navy text-sm">Droits &amp; Territoires</h3>
                    <p className="text-[11px] text-foreground-muted">Zone de distribution et régime de licence.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-navy">Type de Licence</label>
                    <select
                      value={licenceType}
                      onChange={(e) => setLicenceType(e.target.value)}
                      className="w-full p-3 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-medium"
                    >
                      <option value="tous_droits_reserves">Tous droits réservés (Standard LAHA)</option>
                      <option value="creative_commons">Creative Commons (Accès Ouvert)</option>
                      <option value="domaine_public">Domaine Public</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-navy">Territoires Autorisés</label>
                    <select
                      value={territories}
                      onChange={(e) => setTerritories(e.target.value)}
                      className="w-full p-3 text-xs bg-background border border-border rounded-xl focus:outline-none focus:border-gold text-navy font-medium"
                    >
                      <option value="Tous les pays">Monde Entier (Tous les pays)</option>
                      <option value="Zone UEMOA">Zone UEMOA (8 pays)</option>
                      <option value="Zone CEDEAO">Zone CEDEAO (15 pays)</option>
                      <option value="Afrique Centrale & CEMAC">Afrique Centrale &amp; CEMAC</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              ÉTAPE 3 : FICHIERS (Documents)
          ══════════════════════════════════════════════════════════════════════ */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Première de Couverture */}
                <div className="p-5 rounded-2xl bg-background-secondary/40 border border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-gold" />
                      <h3 className="font-serif font-bold text-navy text-sm">Première de Couverture</h3>
                    </div>
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
                      label="Téléverser la Couverture (PNG, JPG, WEBP)"
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

                {/* Manuscrit PDF */}
                <div className="p-5 rounded-2xl bg-background-secondary/40 border border-border space-y-3">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-gold" />
                    <h3 className="font-serif font-bold text-navy text-sm">Manuscrit &amp; Document Principal</h3>
                  </div>

                  <FileDropzone
                    label="Téléverser le PDF / EPUB"
                    acceptTypes={[".pdf", ".epub"]}
                    selectedFileName={manuscriptFile?.name}
                    selectedFileSize={manuscriptFile?.size}
                    onFileSelect={(f) => {
                      setManuscriptFile(f);
                      toast.success(`Fichier « ${f.name} » sélectionné.`);
                    }}
                    onFileRemove={() => setManuscriptFile(null)}
                  />
                  <p className="text-[10px] text-foreground-muted">
                    Document complet avec table des matières et mentions légales.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              ÉTAPE 4 : VALIDATION (Vérification & Publication)
          ══════════════════════════════════════════════════════════════════════ */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-5 rounded-2xl bg-background-secondary/40 border border-border space-y-4">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h3 className="font-serif font-bold text-navy text-sm">Récapitulatif avant publication</h3>
                    <p className="text-[11px] text-foreground-muted">Vérifiez les données du produit avant son enregistrement.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-background border border-border text-xs">
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-foreground-muted block">Titre &amp; Auteur</span>
                      <p className="font-bold text-navy text-sm">{title || "Sans titre"}</p>
                      <p className="text-foreground-muted">Par {authorPublisher}</p>
                      {selectedCreator && (
                        <span className="inline-block mt-1 text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 font-semibold">
                          Droits de vente rattachés à : {selectedCreator.name} ({selectedCreator.role_label})
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-foreground-muted block">Catégorie &amp; Niveau</span>
                      <p className="font-medium text-foreground">{disciplineName} • {targetAudience}</p>
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-foreground-muted block">Pays &amp; Nouveauté</span>
                      <p className="font-medium text-foreground">
                        {country} {isNewRelease && "• Classé en Nouveauté"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-foreground-muted block">Tarification</span>
                      <p className="font-mono font-bold text-navy">
                        Numérique : {priceDigital.toLocaleString("fr-FR")} FCFA
                      </p>
                      {isPaperAvailable && (
                        <p className="font-mono text-foreground-muted">
                          Papier : {pricePaper.toLocaleString("fr-FR")} FCFA
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] uppercase font-bold text-foreground-muted block">Fichiers &amp; Protection</span>
                      <p className="text-foreground">
                        {manuscriptFile ? `Document : ${manuscriptFile.name}` : "Aucun fichier PDF joint"}
                      </p>
                      <p className="text-foreground">
                        {coverFile ? `Couverture : ${coverFile.name}` : "Couverture par défaut"}
                      </p>
                      <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-navy/10 text-navy font-semibold">
                        Protection DRM LCP &amp; Filigrane activés
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <label className="text-xs font-bold text-navy">Statut de Publication Immédiat</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPublicationStatus("published")}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                        publicationStatus === "published"
                          ? "bg-navy/5 border-navy ring-1 ring-navy"
                          : "bg-background border-border hover:border-gold"
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-navy">Publier directement</p>
                        <p className="text-[10px] text-foreground-muted">Visible immédiatement sur le catalogue</p>
                      </div>
                      {publicationStatus === "published" && <CheckCircle2 className="w-4 h-4 text-gold" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => setPublicationStatus("draft")}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between cursor-pointer transition-all ${
                        publicationStatus === "draft"
                          ? "bg-navy/5 border-navy ring-1 ring-navy"
                          : "bg-background border-border hover:border-gold"
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold text-navy">Enregistrer comme brouillon</p>
                        <p className="text-[10px] text-foreground-muted">Non visible publiquement</p>
                      </div>
                      {publicationStatus === "draft" && <CheckCircle2 className="w-4 h-4 text-gold" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════════
              BARRE DE NAVIGATION DU STEPPER (En bas)
          ══════════════════════════════════════════════════════════════════════ */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => {
                if (currentStep > 1) {
                  setCurrentStep(currentStep - 1);
                } else {
                  router.push("/admin/catalog");
                }
              }}
              className="px-5 py-2.5 rounded-xl border border-border text-xs font-bold text-navy hover:bg-background-secondary transition-colors inline-flex items-center gap-2 cursor-pointer min-h-[40px]"
            >
              <ArrowLeft className="w-4 h-4 text-gold" />
              <span>Retour</span>
            </button>

            {currentStep < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 1 && !title.trim()) {
                    toast.error("Veuillez renseigner le titre du livre.");
                    return;
                  }
                  setCurrentStep(currentStep + 1);
                }}
                className="px-6 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs min-h-[40px]"
              >
                <span>Continuer</span>
                <ArrowRight className="w-4 h-4 text-gold" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs min-h-[40px]"
              >
                {submitting ? (
                  <InlineLoader size={16} />
                ) : (
                  <>
                    <Save className="w-4 h-4 text-gold" />
                    <span>Créer et publier le produit</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
