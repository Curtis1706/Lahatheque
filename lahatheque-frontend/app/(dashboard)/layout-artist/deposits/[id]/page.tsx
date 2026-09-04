"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  BookOpen, 
  Send, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  ShieldCheck, 
  FileText,
  Upload,
  Image as ImageIcon,
  DollarSign,
  GraduationCap,
  Sparkles,
  Wand2,
  Check,
  Search,
  Layers,
  HelpCircle,
  Hash,
  Edit3,
  Eye,
  UserCheck
} from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { AISuggestionBadge } from "@/components/features/layout-artist/ai-suggestion-badge";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";
import { 
  getDepositDetail, 
  updateDeposit, 
  submitDepositForValidation,
  searchPreEditions,
  searchAuthors,
  type PreEditionSearchResult,
  type AuthorSearchResult
} from "@/lib/services/layout-artist";
import { extractBookMetadataWithAi, type AiBookAnalysisResult } from "@/lib/services/ai";
import { getDisciplines, type DisciplineItem } from "@/lib/services/classification";
import { DisciplineCombobox } from "@/components/features/catalog/discipline-combobox";
import { PublisherCombobox } from "@/components/features/catalog/publisher-combobox";
import { InlineLoader } from "@/components/ui/page-loader";
import type { LayoutDeposit } from "@/lib/types/layout-artist";
import { toast } from "sonner";

export default function DepositDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const [deposit, setDeposit] = useState<LayoutDeposit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingCover, setSavingCover] = useState(false);

  // Pre-editions & Authors search state
  const [preEditionsList, setPreEditionsList] = useState<PreEditionSearchResult[]>([]);
  const [selectedPreEditionId, setSelectedPreEditionId] = useState<string>("");
  const [authorsList, setAuthorsList] = useState<AuthorSearchResult[]>([]);

  // IA State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiBookAnalysisResult | null>(null);

  // Form State - Métadonnées
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [authorsStr, setAuthorsStr] = useState("");
  const [publisherName, setPublisherName] = useState("LAHA Éditions");
  const [year, setYear] = useState(2026);
  const [language, setLanguage] = useState("Français");
  const [summary, setSummary] = useState("");
  const [isbn, setIsbn] = useState("");
  const [keywordsStr, setKeywordsStr] = useState("");

  // Form State - Classification
  const [categories, setCategories] = useState<string[]>([]);
  const [discipline, setDiscipline] = useState("");
  const [deweyCode, setDeweyCode] = useState("");
  const [country, setCountry] = useState("BJ");
  const [university, setUniversity] = useState("");
  const [faculty, setFaculty] = useState("");
  const [department, setDepartment] = useState("");
  const [targetAudience, setTargetAudience] = useState("");

  // Form State - Format & Tarification
  const [format, setFormat] = useState<"PDF" | "EPUB" | "AUDIO" | "PAPIER">("PDF");
  const [priceDigital, setPriceDigital] = useState(5000);
  const [isPaperAvailable, setIsPaperAvailable] = useState(false);
  const [pricePaper, setPricePaper] = useState(7500);

  // Fichiers de remplacement
  const [newBookFile, setNewBookFile] = useState<File | null>(null);
  const [newCoverFile, setNewCoverFile] = useState<File | null>(null);
  const [newCoverPreview, setNewCoverPreview] = useState<string | null>(null);

  const bookFileInputRef = useRef<HTMLInputElement>(null);
  const coverFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [data, preEditions, authors] = await Promise.all([
          getDepositDetail(id),
          searchPreEditions("").catch(() => []),
          searchAuthors("").catch(() => []),
        ]);
        
        setDeposit(data);
        setPreEditionsList(preEditions || []);
        setAuthorsList(authors || []);

        if (data) {
          setTitle(data.metadata.title || "");
          setSubtitle(data.metadata.subtitle || "");
          setAuthorsStr(data.metadata.authors.join(", "));
          setPublisherName(data.metadata.publisher_name || "LAHA Éditions");
          setYear(data.metadata.publication_year || 2026);
          setLanguage(data.metadata.language || "Français");
          setSummary(data.metadata.summary || "");
          setIsbn(data.metadata.isbn || "");
          setKeywordsStr(data.metadata.keywords?.join(", ") || "");

          const loadedDiscs = data.classification.disciplines && data.classification.disciplines.length > 0
            ? data.classification.disciplines
            : (data.classification.discipline ? [data.classification.discipline] : []);
          setCategories(loadedDiscs);
          setDiscipline(loadedDiscs[0] || data.classification.discipline || "");
          setDeweyCode(data.classification.dewey_code || "");
          setCountry(data.classification.country || "BJ");
          setUniversity(data.classification.university || "");
          setFaculty(data.classification.faculty || "");
          setDepartment(data.classification.department || "");
          setTargetAudience(data.classification.target_audience || "");

          setFormat(data.files.format || "PDF");
          setPriceDigital(data.default_price || 5000);
          setIsPaperAvailable(Boolean(data.is_paper_available));
          setPricePaper(data.admin_price || 7500);

          if (data.pre_edition_dossier?.id) {
            setSelectedPreEditionId(String(data.pre_edition_dossier.id));
          }
        }
      } catch (err) {
        toast.error("Impossible de charger le dépôt.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const canEdit = deposit?.status === "draft" || deposit?.status === "revision_requested";
  const isEditing = Boolean(canEdit && searchParams.get("mode") === "edit");

  // Options pour le SearchableSelect de Pré-Édition
  const preEditionOptions: SearchableOption[] = preEditionsList.map((pe) => ({
    value: pe.id,
    label: pe.titre_previsionnel,
    subtitle: `${pe.auteur_nom}${pe.universite_nom ? ` • ${pe.universite_nom}` : ""}`,
    badge: pe.code_dossier,
  }));

  // Options pour le SearchableSelect d'Auteurs
  const authorOptions: SearchableOption[] = authorsList.map((a) => ({
    value: a.name,
    label: a.name,
    subtitle: a.email || a.bio || "Auteur enregistré",
  }));

  const handlePreEditionSelect = (selectedId: string) => {
    setSelectedPreEditionId(selectedId);
    if (!selectedId) return;
    const found = preEditionsList.find((p) => p.id === selectedId);
    if (found) {
      if (found.titre_previsionnel && !title) setTitle(found.titre_previsionnel);
      if (found.auteur_nom && !authorsStr) setAuthorsStr(found.auteur_nom);
      if (found.universite_nom && !university) setUniversity(found.universite_nom);
      if (found.faculte_nom && !faculty) setFaculty(found.faculte_nom);
      toast.info(`Informations du dossier ${found.code_dossier} appliquées.`);
    }
  };

  const handleAuthorSelect = (authorName: string) => {
    if (!authorsStr) {
      setAuthorsStr(authorName);
    } else if (!authorsStr.includes(authorName)) {
      setAuthorsStr(`${authorsStr}, ${authorName}`);
    }
  };

  const handleRunAiAnalysis = async (customFile?: File) => {
    setAiLoading(true);
    toast.info("Analyse documentaire du manuscrit en cours...");
    try {
      const fileToAnalyze = customFile || newBookFile || undefined;
      const filenameToAnalyze = fileToAnalyze?.name || deposit?.files.book_file_name || deposit?.metadata.title || "ouvrage.pdf";
      const res = await extractBookMetadataWithAi(fileToAnalyze, filenameToAnalyze, summary || title);
      
      if (res.success && res.data) {
        setAiResult(res.data);
        toast.success("Suggestions documentaires générées avec succès.");
      } else {
        toast.error(res.error || "Erreur lors de l'analyse IA.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'analyse IA.");
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAllAi = () => {
    if (!aiResult) return;
    if (aiResult.title) setTitle(aiResult.title);
    if (aiResult.subtitle) setSubtitle(aiResult.subtitle);
    if (aiResult.authors && aiResult.authors.length > 0) setAuthorsStr(aiResult.authors.join(", "));
    if (aiResult.publisher_name) setPublisherName(aiResult.publisher_name);
    if (aiResult.publication_year) setYear(aiResult.publication_year);
    if (aiResult.language) setLanguage(aiResult.language);
    if (aiResult.summary) setSummary(aiResult.summary);
    if (aiResult.isbn) setIsbn(aiResult.isbn);
    if (aiResult.keywords?.length) setKeywordsStr(aiResult.keywords.join(", "));
    
    const aiDiscs = aiResult.disciplines && aiResult.disciplines.length > 0
      ? aiResult.disciplines
      : (aiResult.genre_category ? [aiResult.genre_category] : []);
    setCategories(aiDiscs);
    setDiscipline(aiDiscs[0] || aiResult.genre_category || "");
    
    if (aiResult.dewey_code) setDeweyCode(aiResult.dewey_code);
    if (aiResult.institution_suggestion) setUniversity(aiResult.institution_suggestion);
    if (aiResult.faculty_suggestion) setFaculty(aiResult.faculty_suggestion);
    if (aiResult.department_suggestion) setDepartment(aiResult.department_suggestion);
    if (aiResult.target_audience) setTargetAudience(aiResult.target_audience);
    if (aiResult.country) setCountry(aiResult.country);
    toast.success("Toutes les métadonnées et classifications suggérées par l'IA ont été appliquées !");
  };

  const handleCoverSelect = (file: File) => {
    setNewCoverFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setNewCoverPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveCoverOnly = async () => {
    if (!deposit || !newCoverFile) return;
    setSavingCover(true);
    try {
      const updated = await updateDeposit(
        deposit.id,
        {
          metadata: deposit.metadata,
          classification: deposit.classification,
          files: deposit.files,
          default_price: deposit.default_price,
          admin_price: deposit.admin_price,
          is_paper_available: deposit.is_paper_available,
        },
        null,
        newCoverFile
      );

      if (updated) {
        setDeposit(updated);
        setNewCoverFile(null);
        setNewCoverPreview(null);
        toast.success("Nouvelle image de couverture enregistrée avec succès !");
      } else {
        toast.error("Erreur lors de la mise à jour de la couverture.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'enregistrement de la couverture.");
    } finally {
      setSavingCover(false);
    }
  };

  const handleSave = async () => {
    if (!deposit) return;
    setSaving(true);
    try {
      const keywordsArray = keywordsStr
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      const updated = await updateDeposit(
        deposit.id,
        {
          metadata: {
            ...deposit.metadata,
            title,
            subtitle,
            authors: authorsStr.split(",").map((a) => a.trim()).filter(Boolean),
            publisher_name: publisherName,
            publication_year: Number(year),
            language,
            summary,
            isbn,
            keywords: keywordsArray,
          },
          classification: {
            ...deposit.classification,
            discipline: categories[0] || discipline,
            disciplines: categories,
            dewey_code: deweyCode,
            country,
            university,
            faculty,
            department,
            target_audience: targetAudience,
          },
          files: {
            ...deposit.files,
            format,
          },
          default_price: Number(priceDigital),
          admin_price: Number(pricePaper),
          is_paper_available: isPaperAvailable,
        },
        newBookFile,
        newCoverFile
      );

      if (updated) {
        setDeposit(updated);
        setNewBookFile(null);
        setNewCoverFile(null);
        setNewCoverPreview(null);
        toast.success("Modifications enregistrées avec succès !");
      } else {
        toast.error("Erreur lors de l'enregistrement.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  const handleResubmit = async () => {
    if (!deposit) return;
    setSaving(true);
    try {
      await handleSave();
      const res = await submitDepositForValidation(deposit.id);
      if (res) {
        toast.success("Corrections soumises au Chef Maquettiste avec succès !");
        router.push("/layout-artist/deposits");
      }
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la resoumission.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px] space-y-3">
        <InlineLoader size={32} />
        <p className="text-xs font-semibold text-foreground-muted">Chargement du dossier maquette...</p>
      </div>
    );
  }

  if (!deposit) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-error mx-auto" />
        <h2 className="text-xl font-bold text-navy">Dépôt introuvable</h2>
        <p className="text-xs text-foreground-muted">Ce dépôt n&apos;existe pas ou a été retiré.</p>
        <Link
          href="/layout-artist/deposits"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-navy text-white text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux dépôts
        </Link>
      </div>
    );
  }

  const inputClass = `w-full px-3.5 py-2.5 rounded-xl border border-border text-xs sm:text-sm min-h-[42px] transition-colors ${
    !isEditing 
      ? "bg-background-secondary/50 text-foreground cursor-not-allowed border-border" 
      : "bg-background text-foreground focus:ring-2 focus:ring-navy"
  }`;

  return (
    <div className="p-3.5 sm:p-6 md:p-8 w-full max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-foreground-muted">
        <Link href="/layout-artist" className="hover:text-navy">Vue d&apos;ensemble</Link>
        <span>/</span>
        <Link href="/layout-artist/deposits" className="hover:text-navy">Mes Dépôts</Link>
        <span>/</span>
        <span className="text-navy font-semibold truncate max-w-[220px]">{deposit.metadata.title}</span>
      </div>

      {/* Header */}
      <div className="border-b border-border pb-5 space-y-4">
        <Link href="/layout-artist/deposits" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" />
          Retour à mes dépôts
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                isEditing ? "bg-gold/15 text-gold border border-gold/30" : "bg-navy/10 text-navy border border-navy/20"
              }`}>
                {isEditing ? "Mode Édition / Correction" : "Mode Consultation (Lecture seule)"}
              </span>
            </div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-navy">{deposit.metadata.title}</h1>
            <p className="text-xs text-foreground-muted mt-0.5">
              Déposé le {new Date(deposit.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Bascule Mode Consultation <-> Mode Édition */}
            {canEdit && (
              isEditing ? (
                <Link
                  href={`/layout-artist/deposits/${deposit.id}`}
                  className="px-3.5 py-2 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
                >
                  <Eye className="w-3.5 h-3.5 text-navy" />
                  <span>Mode Consultation</span>
                </Link>
              ) : (
                <Link
                  href={`/layout-artist/deposits/${deposit.id}?mode=edit`}
                  className="px-3.5 py-2 rounded-xl border border-gold/40 bg-gold/10 hover:bg-gold hover:text-navy text-gold text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer min-h-[40px]"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{deposit.status === "revision_requested" ? "Corriger l'épreuve" : "Modifier le dépôt"}</span>
                </Link>
              )
            )}

            {/* Bouton Assistant IA (actif en mode édition) */}
            {isEditing && (
              <button
                type="button"
                onClick={() => handleRunAiAnalysis()}
                disabled={aiLoading}
                className="px-3.5 py-2 rounded-xl bg-gold/15 hover:bg-gold/25 border border-gold/40 text-gold text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer min-h-[40px]"
                title="Analyser le document avec l'Intelligence Artificielle"
              >
                {aiLoading ? <InlineLoader size={14} /> : <Sparkles className="w-3.5 h-3.5 text-gold" />}
                <span>{aiLoading ? "Analyse en cours..." : "Assistant IA"}</span>
              </button>
            )}

            <Link
              href={`/catalog/reader/${deposit.id}`}
              target="_blank"
              className="px-4 py-2 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer min-h-[40px]"
            >
              <BookOpen className="w-4 h-4 text-gold" />
              Lire dans la Liseuse
            </Link>
            <StatusBadge status={deposit.status} />
          </div>
        </div>
      </div>

      {/* Bannière Suggestions IA globales si générées */}
      {isEditing && aiResult && (
        <div className="p-4 rounded-2xl bg-gold/10 border border-gold/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gold/20 text-gold flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-navy">
                Suggestions IA prêtes pour l&apos;ensemble de la notice
              </p>
              <p className="text-[11px] text-foreground-muted">
                Vous pouvez insérer les valeurs suggérées champ par champ ou appliquer l&apos;ensemble en un clic.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleApplyAllAi}
            className="px-4 py-2 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors shrink-0 cursor-pointer min-h-[38px]"
          >
            <Wand2 className="w-3.5 h-3.5 text-gold" />
            Tout Appliquer
          </button>
        </div>
      )}

      {/* Message de révision si revision_requested */}
      {deposit.status === "revision_requested" && (
        <div className="p-5 rounded-3xl bg-error/5 border border-error/20 space-y-2">
          <div className="flex items-center gap-2 text-error font-bold text-xs uppercase tracking-wider">
            <AlertCircle className="w-4 h-4" />
            Demande de correction du Chef Maquettiste
          </div>
          <p className="text-xs text-foreground bg-background p-3.5 rounded-2xl border border-border italic font-medium">
            &ldquo;{deposit.chef_comment || "Veuillez vérifier et corriger les métadonnées et fichiers de l'ouvrage."}&rdquo;
          </p>
          {isEditing ? (
            <p className="text-[11px] text-foreground-muted">
              Apportez les modifications requises ci-dessous puis cliquez sur &quot;Soumettre les corrections au Chef Maquettiste&quot;.
            </p>
          ) : (
            <p className="text-[11px] text-foreground-muted">
              Cliquez sur le bouton &quot;Corriger l&apos;épreuve&quot; ci-dessus pour déverrouiller le formulaire et appliquer les corrections.
            </p>
          )}
        </div>
      )}

      {/* Formulaire complet des 4 étapes */}
      <div className="space-y-6">
        {/* BLOC 1 : FICHIERS & COUVERTURE */}
        <div className="p-5 sm:p-6 rounded-3xl bg-background-secondary border border-border space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <h3 className="font-serif font-bold text-navy text-sm sm:text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-gold" />
              1. Fichiers &amp; Rendu Vitrine 3D
            </h3>
            <span className="text-[11px] text-foreground-muted font-semibold">
              Format {format}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Fichier de l'ouvrage */}
            <div className="p-4 rounded-2xl bg-background border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-gold" />
                  Manuscrit / Épreuve numérique
                </span>
                {newBookFile && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Nouveau fichier sélectionné
                  </span>
                )}
              </div>

              <div className="p-3 bg-background-secondary rounded-xl border border-border space-y-1">
                <p className="text-xs font-semibold text-navy truncate">
                  {newBookFile ? newBookFile.name : (deposit.files.book_file_name || "ouvrage.pdf")}
                </p>
                <p className="text-[11px] text-foreground-muted">
                  Taille : {newBookFile ? `${(newBookFile.size / 1024 / 1024).toFixed(2)} Mo` : "Enregistré sur Cloudflare R2"}
                </p>
              </div>

              {isEditing && (
                <div className="space-y-2">
                  <input
                    ref={bookFileInputRef}
                    type="file"
                    accept=".pdf,.epub"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) setNewBookFile(e.target.files[0]);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => bookFileInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-xl border border-border bg-background hover:bg-background-secondary text-xs font-bold text-navy flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[38px]"
                  >
                    <Upload className="w-3.5 h-3.5 text-gold" />
                    {newBookFile ? "Changer le fichier sélectionné" : "Remplacer le fichier PDF / EPUB"}
                  </button>
                </div>
              )}
            </div>

            {/* Couverture */}
            <div className="p-4 rounded-2xl bg-background border border-border space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-navy flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-gold" />
                  Couverture de l&apos;ouvrage
                </span>
                {newCoverFile && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Nouvelle image prête
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <BookCover3D
                  title={title || deposit.metadata.title}
                  authors={authorsStr ? authorsStr.split(",") : deposit.metadata.authors}
                  discipline={discipline || deposit.classification.discipline}
                  coverUrl={newCoverPreview || deposit.files.cover_url}
                  size="xs"
                />
                <div className="text-xs min-w-0">
                  <p className="font-semibold text-navy truncate">
                    {newCoverFile ? newCoverFile.name : (deposit.files.cover_name || "Couverture actuelle")}
                  </p>
                  <p className="text-[11px] text-foreground-muted mt-0.5">Rendu 3D généré automatiquement</p>
                </div>
              </div>

              {isEditing && (
                <div className="space-y-2">
                  <input
                    ref={coverFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleCoverSelect(e.target.files[0]);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => coverFileInputRef.current?.click()}
                    className="w-full py-2 px-3 rounded-xl border border-border bg-background hover:bg-background-secondary text-xs font-bold text-navy flex items-center justify-center gap-2 transition-colors cursor-pointer min-h-[38px]"
                  >
                    <Upload className="w-3.5 h-3.5 text-gold" />
                    {newCoverFile ? "Changer la couverture sélectionnée" : "Remplacer l'image de couverture"}
                  </button>

                  {newCoverFile && (
                    <button
                      type="button"
                      onClick={handleSaveCoverOnly}
                      disabled={savingCover}
                      className="w-full py-2 px-3 rounded-xl bg-gold text-navy text-xs font-bold hover:bg-gold-light transition-colors flex items-center justify-center gap-2 cursor-pointer min-h-[38px] shadow-sm"
                    >
                      {savingCover ? <InlineLoader size={16} /> : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          Enregistrer la nouvelle image de couverture
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BLOC 2 : MÉTADONNÉES ÉDITORIALES */}
        <div className="p-5 sm:p-6 rounded-3xl bg-background-secondary border border-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <h3 className="font-serif font-bold text-navy text-sm sm:text-base flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gold" />
              2. Notice Éditoriale Complète
            </h3>
            <AISuggestionBadge source={aiResult ? "ai_suggested" : deposit.metadata.language_source} />
          </div>

          {/* Dossier de Pré-édition avec SearchableSelect */}
          <div className="space-y-1.5 text-xs">
            <label className="block font-semibold text-navy">Dossier de Pré-édition associé *</label>
            {isEditing ? (
              <SearchableSelect
                options={preEditionOptions}
                value={selectedPreEditionId}
                onChange={handlePreEditionSelect}
                placeholder="Sélectionner ou rechercher un dossier de pré-édition..."
                searchPlaceholder="Filtrer par titre, nom d'auteur ou code..."
                icon={<FileText className="w-4 h-4 text-gold" />}
              />
            ) : (
              <div className="p-3 bg-background border border-border rounded-xl flex items-center justify-between">
                <span className="font-semibold text-navy">
                  {deposit.metadata.pre_edition_code 
                    ? `${deposit.metadata.pre_edition_code} • ${deposit.metadata.pre_edition_title || "Dossier pré-édition"}`
                    : (deposit.pre_edition_dossier ? `${deposit.pre_edition_dossier.code_dossier} • ${deposit.pre_edition_dossier.titre_previsionnel}` : "Aucun dossier pré-édition rattaché")}
                </span>
                {deposit.metadata.pre_edition_code && (
                  <span className="text-[10px] font-mono font-bold text-gold px-1.5 py-0.5 bg-gold/10 rounded">
                    {deposit.metadata.pre_edition_code}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Titre & Sous-titre */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-navy">Titre de l&apos;ouvrage *</label>
                  {isEditing && aiResult?.title && aiResult.title !== title && (
                    <button
                      type="button"
                      onClick={() => setTitle(aiResult.title)}
                      className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      title={aiResult.title}
                    >
                      <Wand2 className="w-3 h-3" />
                      IA : « {aiResult.title.slice(0, 24)}... »
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-navy">Sous-titre (Optionnel)</label>
                  {isEditing && aiResult?.subtitle && aiResult.subtitle !== subtitle && (
                    <button
                      type="button"
                      onClick={() => setSubtitle(aiResult.subtitle || "")}
                      className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
                      title={aiResult.subtitle}
                    >
                      <Wand2 className="w-3 h-3" />
                      IA : « {aiResult.subtitle.slice(0, 22)}... »
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ex : Manuel pratique et analyse critique"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Auteurs, Année & Langue */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-navy">Auteur(s) *</label>
                  {isEditing && aiResult?.authors?.length && (
                    <button
                      type="button"
                      onClick={() => setAuthorsStr(aiResult.authors.join(", "))}
                      className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      IA
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={authorsStr}
                  onChange={(e) => setAuthorsStr(e.target.value)}
                  placeholder="Pr. Jean KOUADIO, Dr. Aminata SOW"
                  className={inputClass}
                />
                {isEditing && authorOptions.length > 0 && (
                  <div className="pt-1">
                    <SearchableSelect
                      options={authorOptions}
                      value=""
                      onChange={handleAuthorSelect}
                      placeholder="Ajouter un auteur enregistré..."
                      searchPlaceholder="Rechercher par nom..."
                      icon={<UserCheck className="w-3.5 h-3.5 text-gold" />}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-navy">Maison d&apos;Édition *</label>
                  {isEditing && aiResult?.publisher_name && (
                    <button
                      type="button"
                      onClick={() => setPublisherName(aiResult.publisher_name!)}
                      className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                      title="Appliquer l'éditeur détecté par l'IA"
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      IA : {aiResult.publisher_name}
                    </button>
                  )}
                </div>
                <PublisherCombobox
                  value={publisherName}
                  onChange={(val) => setPublisherName(val)}
                  disabled={!isEditing}
                  placeholder="Sélectionner ou saisir l'éditeur..."
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-navy">Année de publication</label>
                  {isEditing && aiResult?.publication_year && (
                    <button
                      type="button"
                      onClick={() => setYear(aiResult.publication_year)}
                      className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      IA
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  disabled={!isEditing}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value))}
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-navy">Langue de rédaction</label>
                  {isEditing && aiResult?.language && (
                    <button
                      type="button"
                      onClick={() => setLanguage(aiResult.language)}
                      className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      IA : {aiResult.language}
                    </button>
                  )}
                </div>
                <select
                  disabled={!isEditing}
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={inputClass}
                >
                  <option value="Français">Français</option>
                  <option value="Anglais">Anglais</option>
                  <option value="Portugais">Portugais</option>
                  <option value="Espagnol">Espagnol</option>
                  <option value="Arabe">Arabe</option>
                  <option value="Fon">Fon</option>
                  <option value="Yoruba">Yoruba</option>
                </select>
              </div>
            </div>

            {/* Résumé */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block font-semibold text-navy">Résumé éditorial (Synopsis) *</label>
                {isEditing && aiResult?.summary && (
                  <button
                    type="button"
                    onClick={() => setSummary(aiResult.summary)}
                    className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Wand2 className="w-3 h-3" />
                    Insérer le résumé généré par l&apos;IA
                  </button>
                )}
              </div>
              <textarea
                rows={4}
                disabled={!isEditing}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Rédigez ou collez le résumé de l'ouvrage..."
                className={`w-full p-3.5 rounded-xl border border-border text-xs sm:text-sm resize-y min-h-[90px] ${
                  !isEditing 
                    ? "bg-background-secondary/50 text-foreground cursor-not-allowed border-border" 
                    : "bg-background text-foreground focus:ring-2 focus:ring-navy"
                }`}
              />
            </div>

            {/* ISBN & Mots-clés */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-navy">Code ISBN-13</label>
                  {isEditing && aiResult?.isbn && (
                    <button
                      type="button"
                      onClick={() => setIsbn(aiResult.isbn)}
                      className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      IA : {aiResult.isbn}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="978-99919-X-XXX-X"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-navy">Mots-clés (séparés par des virgules)</label>
                  {isEditing && aiResult?.keywords?.length && (
                    <button
                      type="button"
                      onClick={() => setKeywordsStr(aiResult.keywords.join(", "))}
                      className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      IA
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={keywordsStr}
                  onChange={(e) => setKeywordsStr(e.target.value)}
                  placeholder="Droit, Commerce, OHADA, Afrique, Traité"
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* BLOC 3 : CLASSIFICATION DOCUMENTAIRE */}
        <div className="p-5 sm:p-6 rounded-3xl bg-background-secondary border border-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <h3 className="font-serif font-bold text-navy text-sm sm:text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-gold" />
              3. Classification Documentaire &amp; Rattachement Académique
            </h3>
            <AISuggestionBadge source={aiResult ? "ai_suggested" : deposit.classification.source} />
          </div>

          <div className="space-y-3.5 text-xs">
            {/* Discipline & Dewey */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-navy">
                    Disciplines / Catégories * <span className="text-[10px] font-normal text-foreground-muted">(Plusieurs choix possibles)</span>
                  </label>
                  {isEditing && aiResult && (aiResult.disciplines?.length || aiResult.genre_category) && (
                    <button
                      type="button"
                      onClick={() => {
                        const newDiscs = aiResult.disciplines && aiResult.disciplines.length > 0
                          ? aiResult.disciplines
                          : [aiResult.genre_category];
                        setCategories(newDiscs);
                        setDiscipline(newDiscs[0] || aiResult.genre_category);
                      }}
                      className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                      title="Appliquer les disciplines suggérées par l'IA"
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      IA : {aiResult.disciplines && aiResult.disciplines.length > 0 ? aiResult.disciplines.join(", ") : aiResult.genre_category}
                    </button>
                  )}
                </div>
                <DisciplineCombobox
                  multiple={true}
                  values={categories}
                  onValuesChange={(newVals) => {
                    setCategories(newVals);
                    if (newVals.length > 0) setDiscipline(newVals[0]);
                  }}
                  disabled={!isEditing}
                  placeholder="Sélectionner ou rechercher une discipline..."
                  searchPlaceholder="Rechercher parmi les disciplines..."
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-navy">Code Dewey</label>
                  {isEditing && aiResult?.dewey_code && (
                    <button
                      type="button"
                      onClick={() => setDeweyCode(aiResult.dewey_code)}
                      className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      IA : {aiResult.dewey_code}
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={deweyCode}
                  onChange={(e) => setDeweyCode(e.target.value)}
                  placeholder="340, 800, 100, etc."
                  className={inputClass}
                />
              </div>
            </div>

            {/* Université, Faculté & Département */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-navy">Université / Institution</label>
                  {isEditing && aiResult?.institution_suggestion && (
                    <button
                      type="button"
                      onClick={() => setUniversity(aiResult.institution_suggestion || "")}
                      className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      IA
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="Université d'Abomey-Calavi (UAC)"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-navy">Faculté / UFR</label>
                  {isEditing && aiResult?.faculty_suggestion && (
                    <button
                      type="button"
                      onClick={() => setFaculty(aiResult.faculty_suggestion || "")}
                      className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      IA
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  placeholder="Faculté de Droit (FADESP)"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-navy">Département d&apos;études</label>
                  {isEditing && aiResult?.department_suggestion && (
                    <button
                      type="button"
                      onClick={() => setDepartment(aiResult.department_suggestion || "")}
                      className="text-[11px] font-bold text-gold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <Wand2 className="w-2.5 h-2.5" />
                      IA
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Département de Droit Privé"
                  className={inputClass}
                />
              </div>
            </div>

            {/* Code Pays */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="block font-semibold text-navy">Code Pays (ISO)</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="BJ, CI, SN, BR, etc."
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        </div>

        {/* BLOC 4 : COMMERCIALISATION & PROTECTION DRM */}
        <div className="p-5 sm:p-6 rounded-3xl bg-background-secondary border border-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-3">
            <h3 className="font-serif font-bold text-navy text-sm sm:text-base flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gold" />
              4. Tarification, Format &amp; Protection DRM
            </h3>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-gold" />
              <StatusBadge status="approved" leftLabel="Tatouage &amp; DRM LCP Actifs" />
            </div>
          </div>

          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-navy mb-1">Format de publication</label>
                <select
                  disabled={!isEditing}
                  value={format}
                  onChange={(e) => setFormat(e.target.value as any)}
                  className={inputClass}
                >
                  <option value="PDF">PDF (Mise en page fixe sécurisée)</option>
                  <option value="EPUB">EPUB (Texte recomposable)</option>
                  <option value="AUDIO">AUDIO (Livre audio)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-navy mb-1">Prix Numérique (FCFA) *</label>
                <input
                  type="number"
                  disabled={!isEditing}
                  value={priceDigital}
                  onChange={(e) => setPriceDigital(Number(e.target.value))}
                  min={0}
                  step={500}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Option Papier */}
            <div className="p-4 rounded-2xl bg-background border border-border space-y-3">
              <label className={`flex items-center gap-3 select-none ${isEditing ? "cursor-pointer" : "cursor-not-allowed"}`}>
                <input
                  type="checkbox"
                  disabled={!isEditing}
                  checked={isPaperAvailable}
                  onChange={(e) => setIsPaperAvailable(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-navy focus:ring-navy cursor-pointer disabled:cursor-not-allowed"
                />
                <span className="font-bold text-navy text-xs">
                  Disponible également en version imprimée (Livre Papier)
                </span>
              </label>

              {isPaperAvailable && (
                <div className="pt-2 pl-7">
                  <label className="block font-semibold text-navy mb-1">Prix Version Papier (FCFA)</label>
                  <input
                    type="number"
                    disabled={!isEditing}
                    value={pricePaper}
                    onChange={(e) => setPricePaper(Number(e.target.value))}
                    min={0}
                    step={500}
                    className={`w-full max-w-xs ${inputClass}`}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions de sauvegarde & resoumission (visibles en mode édition) */}
      {isEditing && (
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-border">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-border bg-background text-navy text-xs font-bold hover:bg-background-secondary transition-colors flex items-center justify-center gap-2 min-h-[44px] cursor-pointer"
          >
            <Save className="w-4 h-4 text-gold" />
            Enregistrer les modifications
          </button>

          {deposit.status === "revision_requested" && (
            <button
              type="button"
              onClick={handleResubmit}
              disabled={saving}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gold text-navy text-xs font-bold hover:bg-gold-light transition-colors flex items-center justify-center gap-2 min-h-[44px] shadow-sm cursor-pointer"
            >
              {saving ? (
                <InlineLoader size={16} />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Soumettre les corrections au Chef Maquettiste
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
