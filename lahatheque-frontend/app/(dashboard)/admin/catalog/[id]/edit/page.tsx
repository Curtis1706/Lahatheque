"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AdminCatalogBook, AdminCatalogLanguageVersion } from "@/lib/types/admin";
import { getAdminCatalogBook, updateAdminBook } from "@/lib/services/admin";
import { uploadFileDirectlyToR2 } from "@/lib/services/storage";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { InlineLoader } from "@/components/ui/page-loader";
import { StatusBadge } from "@/components/ui/status-badge";
import { 
  ArrowLeft,
  Save, 
  BookOpen, 
  UploadCloud, 
  Languages, 
  Tag, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  FileText,
  Eye,
  AlertCircle,
  ExternalLink,
  GraduationCap,
  Globe,
} from "lucide-react";
import { toast } from "sonner";
import { DisciplineCombobox } from "@/components/features/catalog/discipline-combobox";
import { PublisherCombobox } from "@/components/features/catalog/publisher-combobox";
import { AuthorCombobox } from "@/components/features/catalog/author-combobox";
import { UniversityCombobox } from "@/components/features/catalog/university-combobox";
import { CountryCombobox } from "@/components/features/catalog/country-combobox";

const AVAILABLE_LANGUAGES_LIST = [
  { code: "fr", label: "Français (FR)" },
  { code: "en", label: "Anglais (EN)" },
  { code: "es", label: "Espagnol (ES)" },
  { code: "pt", label: "Portugais (PT)" },
  { code: "de", label: "Allemand (DE)" },
  { code: "ar", label: "Arabe (AR)" },
  { code: "zh", label: "Chinois (ZH)" },
];

export default function AdminBookEditPage() {
  const params = useParams();
  const router = useRouter();
  const bookId = (params?.id as string) || "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"metadata" | "files" | "languages" | "pricing">("metadata");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Metadata
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [summary, setSummary] = useState("");
  const [isbn, setIsbn] = useState("");
  const [publisherName, setPublisherName] = useState("");
  const [discipline, setDiscipline] = useState("");
  const [disciplines, setDisciplines] = useState<string[]>([]);
  const [institution, setInstitution] = useState("");
  const [country, setCountry] = useState("BJ");
  const [publicationYear, setPublicationYear] = useState<number>(2026);
  const [pageCount, setPageCount] = useState<number>(0);
  const [status, setStatus] = useState<AdminCatalogBook["status"]>("published");

  // Authors
  const [authors, setAuthors] = useState<string[]>([]);
  const [newAuthorInput, setNewAuthorInput] = useState("");

  // Languages & Versions
  const [isOriginal, setIsOriginal] = useState<boolean>(true);
  const [originalLanguage, setOriginalLanguage] = useState<string>("fr");
  const [languages, setLanguages] = useState<AdminCatalogLanguageVersion[]>([]);
  const [deletedLanguages, setDeletedLanguages] = useState<string[]>([]);

  // New translation addition
  const [addLangCode, setAddLangCode] = useState("en");
  const [addLangTitle, setAddLangTitle] = useState("");
  const [addLangStatus, setAddLangStatus] = useState<"ready" | "in_progress" | "draft">("ready");
  const [addLangFile, setAddLangFile] = useState<File | null>(null);

  // Files
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [existingFileUrl, setExistingFileUrl] = useState<string>("");

  // Pricing & DRM
  const [priceDigital, setPriceDigital] = useState<number | string>(5000);
  const [pricePaper, setPricePaper] = useState<number | string>(7500);
  const [priceAudio, setPriceAudio] = useState<number | string>(3500);
  const [hasAudioVersion, setHasAudioVersion] = useState<boolean>(false);
  const [isPaperAvailable, setIsPaperAvailable] = useState<boolean>(false);
  const [paperStock, setPaperStock] = useState<number>(0);
  const [protectionType, setProtectionType] = useState<string>("lcp");

  // Upload progress tracking
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    async function loadBook() {
      if (!bookId) return;
      try {
        setLoading(true);
        const b = await getAdminCatalogBook(bookId);
        if (!b) {
          setErrorMsg("Impossible de trouver cet ouvrage dans le catalogue.");
          return;
        }

        setTitle(b.title || "");
        setSubtitle(b.subtitle || "");
        setSummary(b.summary || "");
        setIsbn(b.isbn || "");
        setPublisherName(b.publisher_name || "");
        setDiscipline(b.discipline || "");
        if (b.disciplines && b.disciplines.length > 0) {
          setDisciplines(b.disciplines);
        } else if (b.discipline) {
          setDisciplines([b.discipline]);
        } else {
          setDisciplines([]);
        }
        setInstitution(b.institution || "");
        setCountry(b.country || "BJ");
        setPublicationYear(b.publication_year || 2026);
        setPageCount(b.page_count || 0);
        setStatus(b.status || "published");
        setAuthors(
          b.authors && b.authors.length > 0
            ? [...b.authors]
            : (b.author_name ? [b.author_name] : ["Auteur LAHA"])
        );
        setIsOriginal(b.is_original !== false);
        const orig = b.original_language || b.language || "fr";
        setOriginalLanguage(orig);

        if (b.languages && b.languages.length > 0) {
          setLanguages(b.languages.map(l => ({
            ...l,
            language: l.language || l.language_code || orig,
          })));
        } else {
          setLanguages([
            {
              language: orig,
              language_code: orig,
              is_original: true,
              title: b.title,
              summary: b.summary || "",
              page_count: b.page_count || 0,
              is_paper_available: Boolean(b.is_paper_available),
              paper_stock: b.paper_stock || 0,
              translation_status: "ready",
            }
          ]);
        }

        setCoverPreview(b.cover_url || b.cover_image || "");
        setExistingFileUrl(b.file_url || "");
        setPriceDigital(b.price_digital !== undefined && b.price_digital !== null ? b.price_digital : 5000);
        setPricePaper(b.price_paper !== undefined && b.price_paper !== null ? b.price_paper : 7500);
        setPriceAudio(b.price_audio !== undefined && b.price_audio !== null ? b.price_audio : 3500);
        setHasAudioVersion(Boolean(b.has_audio_version || b.has_audio));
        setIsPaperAvailable(Boolean(b.is_paper_available));
        setPaperStock(b.paper_stock || 0);
        setProtectionType(b.protection_type || "lcp");
      } catch (err: any) {
        setErrorMsg(err.message || "Erreur de chargement.");
      } finally {
        setLoading(false);
      }
    }
    loadBook();
  }, [bookId]);

  // Authors handlers
  const handleAddAuthor = () => {
    const trimmed = newAuthorInput.trim();
    if (!trimmed) return;
    if (!authors.includes(trimmed)) {
      setAuthors([...authors, trimmed]);
    }
    setNewAuthorInput("");
  };

  const handleRemoveAuthor = (index: number) => {
    if (authors.length <= 1) {
      toast.error("Un ouvrage doit avoir au minimum un auteur.");
      return;
    }
    setAuthors(authors.filter((_, idx) => idx !== index));
  };

  // Language handlers
  const handleOriginalLanguageChange = (newLang: string) => {
    setOriginalLanguage(newLang);
    setLanguages((prev) =>
      prev.map((item) => {
        if (item.language === newLang) {
          return { ...item, is_original: true };
        }
        return { ...item, is_original: false };
      })
    );
  };

  const handleAddNewLanguage = async () => {
    if (!addLangCode) return;
    if (languages.some(l => l.language.toLowerCase() === addLangCode.toLowerCase())) {
      toast.error(`La langue ${addLangCode.toUpperCase()} est déjà configurée.`);
      return;
    }

    let r2KeyPdf = "";
    if (addLangFile) {
      try {
        toast.info(`Téléversement du fichier traduit ${addLangCode.toUpperCase()} vers Cloudflare R2...`);
        const res = await uploadFileDirectlyToR2(addLangFile, "book", (percent) => {
          setUploadProgress((p) => ({ ...p, [`new_${addLangCode}`]: percent }));
        });
        if (res.fileKey) {
          r2KeyPdf = res.fileKey;
          toast.success(`Fichier ${addLangCode.toUpperCase()} téléversé.`);
        }
      } catch (err: any) {
        toast.error(`Erreur téléversement: ${err.message}`);
      }
    }

    const newVer: AdminCatalogLanguageVersion = {
      language: addLangCode,
      language_code: addLangCode,
      is_original: false,
      title: addLangTitle.trim() || title,
      summary: summary,
      translation_status: addLangStatus,
      r2_key_pdf: r2KeyPdf,
      page_count: pageCount,
      is_paper_available: false,
      paper_stock: 0,
    };

    setLanguages([...languages, newVer]);
    setDeletedLanguages(deletedLanguages.filter(l => l !== addLangCode));
    setAddLangTitle("");
    setAddLangFile(null);
    toast.success(`Déclinaison en ${addLangCode.toUpperCase()} ajoutée.`);
  };

  const handleRemoveLanguage = (langCode: string) => {
    if (langCode === originalLanguage) {
      toast.error("Impossible de supprimer la langue originale de l'ouvrage.");
      return;
    }
    setLanguages(languages.filter(l => l.language !== langCode));
    setDeletedLanguages([...deletedLanguages, langCode]);
    toast.info(`Déclinaison ${langCode.toUpperCase()} retirée.`);
  };

  const handleUploadTranslationFile = async (langCode: string, file: File) => {
    try {
      toast.info(`Téléversement du fichier traduit (${langCode.toUpperCase()})...`);
      const res = await uploadFileDirectlyToR2(file, "book", (percent) => {
        setUploadProgress((p) => ({ ...p, [langCode]: percent }));
      });
      if (res.fileKey) {
        setLanguages((prev) =>
          prev.map((item) =>
            item.language === langCode
              ? { ...item, r2_key_pdf: res.fileKey }
              : item
          )
        );
        toast.success(`Fichier traduit (${langCode.toUpperCase()}) rattaché avec succès.`);
      }
    } catch (err: any) {
      toast.error(`Échec du téléversement: ${err.message}`);
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleBookFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBookFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSaving(true);

    try {
      let uploadedCoverKey: string | undefined = undefined;
      let uploadedFileKey: string | undefined = undefined;

      if (coverFile) {
        toast.info("Téléversement de la nouvelle couverture vers Cloudflare R2...");
        const covRes = await uploadFileDirectlyToR2(coverFile, "cover", (p) => {
          setUploadProgress((prev) => ({ ...prev, cover: p }));
        });
        if (covRes.fileKey) {
          uploadedCoverKey = covRes.fileKey;
        }
      }

      if (bookFile) {
        toast.info("Téléversement du nouveau fichier document maître...");
        const bookRes = await uploadFileDirectlyToR2(bookFile, "book", (p) => {
          setUploadProgress((prev) => ({ ...prev, master: p }));
        });
        if (bookRes.fileKey) {
          uploadedFileKey = bookRes.fileKey;
        }
      }

      const payload: any = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        summary: summary.trim(),
        isbn: isbn.trim(),
        publisher_name: publisherName.trim(),
        discipline: discipline.trim() || (disciplines.length > 0 ? disciplines[0] : ""),
        disciplines: disciplines,
        institution: institution.trim(),
        country: country.trim(),
        publication_year: publicationYear,
        page_count: pageCount,
        status: status,
        authors: authors,
        price_digital: Number(priceDigital) >= 0 ? Number(priceDigital) : 0,
        price_paper: Number(pricePaper) >= 0 ? Number(pricePaper) : 0,
        price_audio: hasAudioVersion ? (Number(priceAudio) >= 0 ? Number(priceAudio) : 0) : undefined,
        has_audio_version: hasAudioVersion,
        is_paper_available: isPaperAvailable,
        paper_stock: paperStock,
        protection_type: protectionType,
        is_original: isOriginal,
        original_language: originalLanguage,
        languages: languages,
        deleted_languages: deletedLanguages,
      };

      if (uploadedCoverKey) payload.cover_key = uploadedCoverKey;
      if (uploadedFileKey) payload.file_key = uploadedFileKey;

      const res = await updateAdminBook(bookId, payload);

      if (res.success) {
        toast.success(res.message || "Ouvrage mis à jour avec succès !");
        router.push("/admin/catalog");
      } else {
        setErrorMsg(res.error || "Erreur lors de la mise à jour.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Erreur réseau lors de la mise à jour.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 max-w-5xl mx-auto text-center space-y-3">
        <InlineLoader size={24} />
        <p className="text-xs text-foreground-muted">Chargement des données de l&apos;ouvrage...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-6xl mx-auto space-y-6 animate-in fade-in">
      
      {/* Navigation fil d'Ariane & En-tête de page */}
      <div>
        <Link
          href="/admin/catalog"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:text-gold-dark transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour au catalogue</span>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono text-gold font-bold uppercase tracking-wider">
                Ref #{bookId.slice(0, 8)}
              </span>
              {isbn && (
                <span className="text-[11px] font-mono text-foreground-muted">
                  &bull; ISBN: {isbn}
                </span>
              )}
              <StatusBadge status={status} />
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold font-serif text-navy">
              Modifier : {title || "Ouvrage"}
            </h1>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/catalog/reader/${bookId}`}
              target="_blank"
              className="px-3.5 py-2 rounded-xl bg-background-secondary border border-border text-foreground text-xs font-semibold hover:border-gold transition-colors flex items-center gap-1.5 min-h-[38px]"
            >
              <Eye className="w-3.5 h-3.5 text-navy" />
              <span>Aperçu Liseuse</span>
            </Link>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-xs cursor-pointer min-h-[38px]"
            >
              {saving ? (
                <>
                  <InlineLoader size={16} />
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-gold" />
                  <span>Enregistrer l&apos;Ouvrage</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-error/10 border border-error/20 flex items-center gap-3 text-xs text-error font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Onglets de configuration */}
      <div className="flex border-b border-border bg-background gap-2 sm:gap-4 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab("metadata")}
          className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "metadata"
              ? "border-gold text-gold"
              : "border-transparent text-foreground-muted hover:text-navy"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Métadonnées & Auteurs</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("files")}
          className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "files"
              ? "border-gold text-gold"
              : "border-transparent text-foreground-muted hover:text-navy"
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span>Fichiers & Couverture</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("languages")}
          className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "languages"
              ? "border-gold text-gold"
              : "border-transparent text-foreground-muted hover:text-navy"
          }`}
        >
          <Languages className="w-4 h-4" />
          <span>Déclinaisons Multilingues ({languages.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("pricing")}
          className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeTab === "pricing"
              ? "border-gold text-gold"
              : "border-transparent text-foreground-muted hover:text-navy"
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Tarifs, Stocks & DRM</span>
        </button>
      </div>

      {/* Formulaire principal */}
      <form onSubmit={handleSubmit} className="space-y-6">

        {/* ONGLET 1: MÉTADONNÉES & AUTEURS */}
        {activeTab === "metadata" && (
          <div className="p-6 rounded-3xl bg-background border border-border space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">
                  Titre de l&apos;Ouvrage *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-background-secondary border border-border rounded-xl p-3 text-sm text-foreground focus:ring-2 focus:ring-navy focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">
                  Sous-titre
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Sous-titre éventuel..."
                  className="w-full bg-background-secondary border border-border rounded-xl p-3 text-sm text-foreground focus:ring-2 focus:ring-navy focus:outline-hidden"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">
                  Statut de Publication
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full bg-background-secondary border border-border rounded-xl p-3 text-sm text-foreground focus:ring-2 focus:ring-navy focus:outline-hidden"
                >
                  <option value="published">Publié (En ligne sur le catalogue et la vitrine)</option>
                  <option value="draft">Brouillon</option>
                  <option value="submitted">En Soumission / Validation</option>
                  <option value="archived">Archivé</option>
                </select>
              </div>
            </div>

            {/* Gestion des auteurs multiples */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold text-navy uppercase tracking-wider flex items-center justify-between">
                <span>Auteur(s) & Contributeurs</span>
                <span className="text-[11px] font-normal text-foreground-muted">{authors.length} auteur(s)</span>
              </label>

              <div className="flex flex-wrap gap-2">
                {authors.map((author, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 bg-navy/5 border border-navy/20 rounded-xl px-3 py-1.5 text-xs text-navy font-medium"
                  >
                    <span>{author}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAuthor(idx)}
                      className="text-foreground-muted hover:text-error transition-colors cursor-pointer"
                      title="Retirer cet auteur"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 max-w-lg items-center">
                <div className="flex-1">
                  <AuthorCombobox
                    value={newAuthorInput}
                    onChange={(name) => setNewAuthorInput(name)}
                    placeholder="Rechercher en base ou saisir un auteur..."
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddAuthor}
                  className="px-4 py-2.5 rounded-xl bg-navy text-gold text-xs font-bold hover:bg-navy-hover transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter</span>
                </button>
              </div>
            </div>

            {/* Éditeur, Disciplines multiples, Institution, Pays & ISBN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">
                  Maison d&apos;Édition *
                </label>
                <PublisherCombobox
                  value={publisherName}
                  onChange={(name) => setPublisherName(name)}
                  placeholder="Sélectionner ou saisir un éditeur..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider flex items-center justify-between">
                  <span>Disciplines / Catégories *</span>
                  <span className="text-[10px] font-normal text-foreground-muted">Plusieurs choix possibles</span>
                </label>
                <DisciplineCombobox
                  multiple={true}
                  values={disciplines}
                  onValuesChange={(newVals) => {
                    setDisciplines(newVals);
                    if (newVals.length > 0) {
                      setDiscipline(newVals[0]);
                    } else {
                      setDiscipline("");
                    }
                  }}
                  placeholder="Sélectionner ou rechercher des disciplines..."
                  searchPlaceholder="Rechercher parmi les disciplines..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">
                  Université / Institution Affiliée
                </label>
                <UniversityCombobox
                  value={institution}
                  onChange={(val) => setInstitution(val)}
                  placeholder="Sélectionner ou saisir une institution..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">
                  Pays d&apos;Édition / d&apos;Origine
                </label>
                <CountryCombobox
                  value={country}
                  onChange={(name, code) => setCountry(code || name)}
                  placeholder="Sélectionner le pays..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">
                  Numéro ISBN
                </label>
                <input
                  type="text"
                  value={isbn}
                  onChange={(e) => setIsbn(e.target.value)}
                  placeholder="Ex : 978-99919-X-XXX-X"
                  className="w-full bg-background-secondary border border-border rounded-xl p-3 text-xs text-foreground focus:ring-2 focus:ring-navy focus:outline-hidden"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">
                  Année de Publication
                </label>
                <input
                  type="number"
                  value={publicationYear}
                  onChange={(e) => setPublicationYear(parseInt(e.target.value) || 2026)}
                  className="w-full bg-background-secondary border border-border rounded-xl p-3 text-xs text-foreground focus:ring-2 focus:ring-navy focus:outline-hidden"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-navy uppercase tracking-wider">
                  Nombre de Pages
                </label>
                <input
                  type="number"
                  value={pageCount}
                  onChange={(e) => setPageCount(parseInt(e.target.value) || 0)}
                  className="w-full bg-background-secondary border border-border rounded-xl p-3 text-xs text-foreground focus:ring-2 focus:ring-navy focus:outline-hidden"
                />
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-navy uppercase tracking-wider">
                Résumé & Présentation de l&apos;Ouvrage
              </label>
              <textarea
                rows={5}
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="Description éditoriale, sommaire ou 4e de couverture..."
                className="w-full bg-background-secondary border border-border rounded-xl p-3 text-xs text-foreground focus:ring-2 focus:ring-navy focus:outline-hidden resize-y"
              />
            </div>
          </div>
        )}

        {/* ONGLET 2: FICHIERS & COUVERTURE */}
        {activeTab === "files" && (
          <div className="p-6 rounded-3xl bg-background border border-border space-y-6 animate-in fade-in">
            {/* Couverture */}
            <div className="p-5 rounded-2xl bg-background-secondary border border-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-gold" />
                  <h3 className="font-serif font-bold text-navy text-sm">Image de Couverture</h3>
                </div>
                {coverFile && (
                  <span className="text-[11px] font-bold text-gold">Nouveau fichier sélectionné</span>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-28 h-36 shrink-0">
                  <BookCover3D
                    coverUrl={coverPreview}
                    title={title}
                    size="sm"
                    className="w-full h-full"
                  />
                </div>
                <div className="flex-1 space-y-2 w-full">
                  <p className="text-xs text-foreground-muted">
                    Remplacer l&apos;image de couverture par une illustration haute définition. Les formats recommandés sont WebP, PNG et JPEG.
                  </p>
                  <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-background border border-border hover:border-gold text-xs font-semibold text-navy cursor-pointer transition-colors">
                    <UploadCloud className="w-4 h-4 text-gold" />
                    <span>Sélectionner une nouvelle image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverSelect}
                      className="hidden"
                    />
                  </label>
                  {coverFile && (
                    <p className="text-[11px] text-foreground-muted truncate">
                      Sélectionné : {coverFile.name} ({(coverFile.size / 1024).toFixed(1)} Ko)
                    </p>
                  )}
                  {uploadProgress.cover !== undefined && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] text-foreground-muted font-mono">
                        <span>Téléversement vers Cloudflare R2</span>
                        <span>{uploadProgress.cover}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gold transition-all duration-300"
                          style={{ width: `${uploadProgress.cover}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Fichier Document Maître */}
            <div className="p-5 rounded-2xl bg-background-secondary border border-border space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gold" />
                  <h3 className="font-serif font-bold text-navy text-sm">Fichier Document Maître (PDF / EPUB)</h3>
                </div>
                {bookFile && (
                  <span className="text-[11px] font-bold text-gold">Nouveau document prêt au téléversement</span>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-xs text-foreground-muted">
                  {existingFileUrl 
                    ? "Un fichier document est actuellement rattaché à cet ouvrage. Vous pouvez le remplacer en téléversant une maquette révisée." 
                    : "Aucun fichier maître local rattaché ou synchronisé depuis Cloudflare R2."}
                </p>

                <label className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-white hover:bg-navy-hover text-xs font-bold cursor-pointer transition-colors shadow-xs">
                  <UploadCloud className="w-4 h-4 text-gold" />
                  <span>Remplacer le Document Maître (PDF / EPUB)</span>
                  <input
                    type="file"
                    accept=".pdf,.epub"
                    onChange={handleBookFileSelect}
                    className="hidden"
                  />
                </label>

                {bookFile && (
                  <div className="p-3 rounded-xl bg-background border border-border flex items-center justify-between text-xs">
                    <span className="font-semibold text-navy truncate max-w-sm">{bookFile.name}</span>
                    <span className="text-foreground-muted font-mono">{(bookFile.size / (1024 * 1024)).toFixed(2)} Mo</span>
                  </div>
                )}

                {uploadProgress.master !== undefined && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-foreground-muted font-mono">
                      <span>Téléversement direct Cloudflare R2</span>
                      <span>{uploadProgress.master}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gold transition-all duration-300"
                        style={{ width: `${uploadProgress.master}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ONGLET 3: DÉCLINAISONS MULTILINGUES */}
        {activeTab === "languages" && (
          <div className="p-6 rounded-3xl bg-background border border-border space-y-6 animate-in fade-in">
            {/* Langue originale */}
            <div className="p-5 rounded-2xl bg-navy/5 border border-navy/15 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Languages className="w-4 h-4 text-gold" />
                  <h3 className="font-serif font-bold text-navy text-sm">Langue Originale de Référence</h3>
                </div>
                <span className="text-[10px] font-bold text-gold uppercase px-2.5 py-0.5 rounded-full bg-gold/15">
                  Édition Source
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="text-xs text-foreground-muted font-medium">Sélectionner la langue source</label>
                  <select
                    value={originalLanguage}
                    onChange={(e) => handleOriginalLanguageChange(e.target.value)}
                    className="w-full mt-1 bg-background border border-border rounded-xl p-2.5 text-xs text-foreground font-semibold focus:ring-2 focus:ring-navy"
                  >
                    {AVAILABLE_LANGUAGES_LIST.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="isOriginalToggle"
                    checked={isOriginal}
                    onChange={(e) => setIsOriginal(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-navy focus:ring-navy cursor-pointer"
                  />
                  <label htmlFor="isOriginalToggle" className="text-xs font-semibold text-navy cursor-pointer">
                    Cet ouvrage constitue l&apos;édition originale source
                  </label>
                </div>
              </div>
            </div>

            {/* Versions linguistiques */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-navy uppercase tracking-wider">
                Déclinaisons Linguistiques Rattachées ({languages.length})
              </h4>

              <div className="space-y-3">
                {languages.map((lv) => {
                  const isOrig = lv.language === originalLanguage || lv.is_original;
                  return (
                    <div
                      key={lv.language}
                      className="p-4 sm:p-5 rounded-2xl bg-background-secondary border border-border space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="px-2.5 py-1 rounded-lg bg-navy text-gold text-xs font-bold uppercase tracking-wider">
                            {lv.language.toUpperCase()}
                          </span>
                          <span className="text-xs font-bold text-navy">
                            {lv.title || title}
                          </span>
                          {isOrig && (
                            <span className="text-[10px] bg-gold/15 text-gold font-bold px-2 py-0.5 rounded-full">
                              Langue Originale
                            </span>
                          )}
                        </div>

                        {!isOrig && (
                          <button
                            type="button"
                            onClick={() => handleRemoveLanguage(lv.language)}
                            className="p-1.5 rounded-lg text-foreground-muted hover:text-error hover:bg-background transition-colors cursor-pointer"
                            title="Retirer cette langue"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div>
                          <label className="text-[11px] text-foreground-muted font-medium">Statut de Traduction</label>
                          <select
                            value={lv.translation_status || "ready"}
                            onChange={(e) => {
                              const val = e.target.value as any;
                              setLanguages(languages.map(l => l.language === lv.language ? { ...l, translation_status: val } : l));
                            }}
                            className="w-full mt-1 bg-background border border-border rounded-xl p-2 text-xs text-foreground font-medium"
                          >
                            <option value="ready">Prêt (Disponible en lecture)</option>
                            <option value="in_progress">En cours de traduction</option>
                            <option value="draft">Brouillon</option>
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] text-foreground-muted font-medium">Fichier Traduit (.pdf/.epub)</label>
                          <div className="mt-1">
                            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-background border border-border hover:border-gold text-xs text-navy font-medium cursor-pointer transition-colors w-full justify-center">
                              <UploadCloud className="w-3.5 h-3.5 text-gold" />
                              <span className="truncate">
                                {lv.r2_key_pdf ? "Remplacer Fichier" : "Téléverser Traduction"}
                              </span>
                              <input
                                type="file"
                                accept=".pdf,.epub"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handleUploadTranslationFile(lv.language, e.target.files[0]);
                                  }
                                }}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] text-foreground-muted font-medium">Disponibilité Papier</label>
                          <div className="mt-1 flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={Boolean(lv.is_paper_available)}
                              onChange={(e) => {
                                setLanguages(languages.map(l => l.language === lv.language ? { ...l, is_paper_available: e.target.checked } : l));
                              }}
                              className="w-4 h-4 rounded border-border text-navy"
                            />
                            <span className="text-[11px] text-navy">Stock :</span>
                            <input
                              type="number"
                              min={0}
                              value={lv.paper_stock || 0}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setLanguages(languages.map(l => l.language === lv.language ? { ...l, paper_stock: val } : l));
                              }}
                              className="w-20 bg-background border border-border rounded-xl p-1.5 text-xs text-foreground font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      {uploadProgress[lv.language] !== undefined && (
                        <div className="space-y-1 pt-1">
                          <div className="flex justify-between text-[10px] text-foreground-muted font-mono">
                            <span>Téléversement {lv.language.toUpperCase()}...</span>
                            <span>{uploadProgress[lv.language]}%</span>
                          </div>
                          <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gold transition-all duration-300"
                              style={{ width: `${uploadProgress[lv.language]}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Formulaire d'ajout d'une nouvelle déclinaison */}
            <div className="p-5 rounded-2xl bg-background-secondary/50 border border-dashed border-border space-y-3">
              <h4 className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-gold" />
                <span>Ajouter une Déclinaison de Traduction</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-foreground-muted">Langue Cible</label>
                  <select
                    value={addLangCode}
                    onChange={(e) => setAddLangCode(e.target.value)}
                    className="w-full mt-1 bg-background border border-border rounded-xl p-2.5 text-xs text-foreground font-semibold"
                  >
                    {AVAILABLE_LANGUAGES_LIST
                      .filter(l => !languages.some(cur => cur.language === l.code))
                      .map((lang) => (
                        <option key={lang.code} value={lang.code}>
                          {lang.label}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-foreground-muted">Titre Traduit (Optionnel)</label>
                  <input
                    type="text"
                    value={addLangTitle}
                    onChange={(e) => setAddLangTitle(e.target.value)}
                    placeholder={title}
                    className="w-full mt-1 bg-background border border-border rounded-xl p-2.5 text-xs text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-foreground-muted">Fichier Traduit (.pdf, .epub)</label>
                  <input
                    type="file"
                    accept=".pdf,.epub"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setAddLangFile(e.target.files[0]);
                      }
                    }}
                    className="w-full mt-1 text-xs text-foreground file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:bg-navy file:text-gold file:text-xs file:font-semibold cursor-pointer"
                  />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleAddNewLanguage}
                  className="px-4 py-2 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-gold" />
                  <span>Valider l&apos;Ajout de la Traduction</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ONGLET 4: TARIFS, STOCKS & DRM */}
        {activeTab === "pricing" && (
          <div className="p-6 rounded-3xl bg-background border border-border space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-background-secondary border border-border space-y-2">
                <label className="text-xs font-bold text-navy uppercase tracking-wider flex items-center justify-between">
                  <span>Prix Licence Numérique (FCFA) *</span>
                  <span className="text-[10px] text-gold font-bold">Original & Traductions</span>
                </label>
                <input
                  type="number"
                  required
                  min={0}
                  step="any"
                  value={priceDigital}
                  onChange={(e) => setPriceDigital(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-xl p-3 text-sm font-semibold text-foreground focus:ring-2 focus:ring-navy focus:outline-hidden"
                />
                <p className="text-[11px] text-foreground-muted">
                  L&apos;achat confère l&apos;accès à l&apos;ensemble des versions linguistiques numériques sans coût supplémentaire.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-background-secondary border border-border space-y-2">
                <label className="text-xs font-bold text-navy uppercase tracking-wider flex items-center justify-between">
                  <span>Prix Exemplaire Papier (FCFA)</span>
                  <span className="text-[10px] text-foreground-muted">Par Exemplaire</span>
                </label>
                <input
                  type="number"
                  min={0}
                  step="any"
                  value={pricePaper}
                  onChange={(e) => setPricePaper(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full bg-background border border-border rounded-xl p-3 text-sm font-semibold text-foreground focus:ring-2 focus:ring-navy focus:outline-hidden"
                />
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isPaperAvailGlobal"
                    checked={isPaperAvailable}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setIsPaperAvailable(checked);
                      setLanguages((prev) =>
                        prev.map((l) =>
                          l.is_original
                            ? {
                                ...l,
                                is_paper_available: checked,
                                paper_stock: checked ? (l.paper_stock && l.paper_stock > 0 ? l.paper_stock : (paperStock > 0 ? paperStock : 0)) : 0,
                              }
                            : checked
                            ? l
                            : { ...l, is_paper_available: false }
                        )
                      );
                    }}
                    className="w-4 h-4 rounded border-border text-navy"
                  />
                  <label htmlFor="isPaperAvailGlobal" className="text-xs font-medium text-navy cursor-pointer">
                    Disponible à la vente au format papier
                  </label>
                </div>
              </div>
            </div>

            {/* Audio */}
            <div className="p-5 rounded-2xl bg-background-secondary border border-border space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-4 h-4 text-gold" />
                  <span>Version Audio & Studio de Narration</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="hasAudioTogglePage"
                    checked={hasAudioVersion}
                    onChange={(e) => setHasAudioVersion(e.target.checked)}
                    className="w-4 h-4 rounded border-border text-navy cursor-pointer"
                  />
                  <label htmlFor="hasAudioTogglePage" className="text-xs font-bold text-navy cursor-pointer">
                    Activer le format Audio
                  </label>
                </div>
              </div>

              {hasAudioVersion && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-xs text-foreground-muted">Prix Streaming Audio (FCFA)</label>
                    <input
                      type="number"
                      min={0}
                      step="any"
                      value={priceAudio}
                      onChange={(e) => setPriceAudio(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full bg-background border border-border rounded-xl p-2.5 text-xs font-semibold text-foreground"
                    />
                  </div>
                  <div className="flex items-center text-xs text-foreground-muted pt-4">
                    Les pistes audio se gèrent et se rattachent par langue via le Studio Audio dédié (/layout-artist/audio).
                  </div>
                </div>
              )}
            </div>

            {/* DRM */}
            <div className="p-5 rounded-2xl bg-background-secondary border border-border space-y-2">
              <label className="text-xs font-bold text-navy uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-gold" />
                <span>Protection DRM & Tatouage Numérique</span>
              </label>
              <select
                value={protectionType}
                onChange={(e) => setProtectionType(e.target.value)}
                className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground focus:ring-2 focus:ring-navy focus:outline-hidden font-medium"
              >
                <option value="lcp">Protection LCP Readium (Standard européen certifié)</option>
                <option value="watermark">Tatouage dynamique & Filigrane nominatif seul</option>
                <option value="none">Sans DRM (Téléchargement libre)</option>
              </select>
              <p className="text-[11px] text-foreground-muted">
                Le filigrane dynamique personnalisé (nom, email, date) est apposé en temps réel sur toutes les pages consultées dans la liseuse sécurisée.
              </p>
            </div>
          </div>
        )}

        {/* Boutons d'action en bas de page */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Link
            href="/admin/catalog"
            className="px-5 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-background-secondary transition-colors"
          >
            Annuler les modifications
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
          >
            {saving ? (
              <>
                <InlineLoader size={16} />
                <span>Enregistrement en cours...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4 text-gold" />
                <span>Enregistrer les Modifications</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
