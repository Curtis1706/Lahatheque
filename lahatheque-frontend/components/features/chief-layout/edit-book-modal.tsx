"use client";

import React, { useState } from "react";
import {
  X,
  Save,
  BookOpen,
  ShoppingBag,
  Layers,
  GraduationCap,
  Sparkles,
  UploadCloud,
  FileText,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import type { LayoutDeposit } from "@/lib/types/layout-artist";
import { updateCatalogBookWithFiles } from "@/lib/services/layout-artist";
import { toast } from "sonner";

import { 
  GENRE_CATEGORIES, 
  matchGenreCategory, 
  matchLanguage, 
  matchCountry, 
  getUniversityOptions, 
  getLanguageOptions, 
  getCountryOptions, 
  getGenreOptions 
} from "@/lib/constants/classification";
import { useDisciplines } from "@/lib/hooks/use-disciplines";
import { SearchableSelect, type SearchableOption } from "@/components/ui/searchable-select";

interface EditBookModalProps {
  book: LayoutDeposit;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updated: LayoutDeposit) => void;
}

export function EditBookModal({ book, isOpen, onClose, onSaved }: EditBookModalProps) {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "pricing" | "classification">("general");

  // Form states
  const [title, setTitle] = useState(book.metadata.title);
  const [subtitle, setSubtitle] = useState(book.metadata.subtitle || "");
  const [authorsStr, setAuthorsStr] = useState(book.metadata.authors.join(", "));
  const [summary, setSummary] = useState(book.metadata.summary);
  const [isbn, setIsbn] = useState(book.metadata.isbn || "");
  const [language, setLanguage] = useState(matchLanguage(book.metadata.language || "fr"));
  const [year, setYear] = useState(book.metadata.publication_year || 2026);

  // Pricing & Formats
  const [priceDigital, setPriceDigital] = useState(book.default_price || 5000);
  const [isPaperAvailable, setIsPaperAvailable] = useState(Boolean(book.is_paper_available));
  const [pricePaper, setPricePaper] = useState(book.admin_price || 7500);

  // Classification
  const { disciplines: realDisciplines, loading: disciplinesLoading } = useDisciplines();
  const [discipline, setDiscipline] = useState(book.classification.discipline || "Littérature Africaine & Conte");
  const [deweyCode, setDeweyCode] = useState(book.classification.discipline ? "" : "800");
  const [university, setUniversity] = useState(book.classification.university || "Université d'Abomey-Calavi (UAC - Bénin)");
  const [faculty, setFaculty] = useState(book.classification.faculty || "");
  const [country, setCountry] = useState(matchCountry(book.classification.country || "BJ"));
  const [targetAudience, setTargetAudience] = useState("Grand Public & Universitaire");

  const disciplineOptions: SearchableOption[] = React.useMemo(() => {
    const list: SearchableOption[] = realDisciplines.length > 0
      ? realDisciplines.map((d) => ({
          value: d.name,
          label: d.name,
          subtitle: d.code_dewey ? `Dewey ${d.code_dewey}` : undefined,
          badge: d.code_dewey || undefined,
        }))
      : getGenreOptions(null, discipline).map((g) => ({
          value: g.label,
          label: g.label,
          subtitle: g.dewey ? `Dewey ${g.dewey}` : undefined,
          badge: g.dewey || undefined,
        }));

    if (discipline && !list.some((o) => o.value === discipline)) {
      list.unshift({
        value: discipline,
        label: discipline,
        subtitle: deweyCode ? `Dewey ${deweyCode}` : undefined,
        badge: deweyCode || undefined,
      });
    }
    return list;
  }, [realDisciplines, discipline, deweyCode]);

  // Files
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | undefined>(book.files.cover_url);
  const [bookFile, setBookFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleBookFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBookFile(e.target.files[0]);
    }
  };

  const handleGenreChange = (newGenre: string) => {
    setDiscipline(newGenre);
    const realFound = realDisciplines.find((d) => d.name === newGenre);
    if (realFound && realFound.code_dewey) {
      setDeweyCode(realFound.code_dewey);
    }
    const found = matchGenreCategory(newGenre);
    if (found) {
      if (!realFound?.code_dewey) {
        setDeweyCode(found.dewey);
      }
      if (found.faculty) setFaculty(found.faculty);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Le titre de l'ouvrage est obligatoire.");
      return;
    }

    setSaving(true);
    try {
      const updated = await updateCatalogBookWithFiles(
        book.id,
        {
          metadata: {
            title: title.trim(),
            subtitle: subtitle.trim(),
            authors: authorsStr ? authorsStr.split(",").map((a) => a.trim()) : ["Auteur LAHA"],
            publication_year: year,
            language,
            language_source: "manual",
            summary,
            summary_source: "manual",
            isbn: isbn.trim(),
          },
          classification: {
            country,
            university,
            faculty,
            discipline,
            source: "manual",
          },
          default_price: priceDigital,
          admin_price: isPaperAvailable ? pricePaper : 0,
          is_paper_available: isPaperAvailable,
        },
        coverFile,
        bookFile
      );

      toast.success(`L'ouvrage « ${updated.metadata.title} » a été mis à jour avec succès.`);
      onSaved(updated);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de la modification.";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-3xl bg-background rounded-3xl border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-navy text-white flex items-center justify-between border-b border-navy-hover shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gold/20 text-gold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif font-bold text-base sm:text-lg text-white">
                  Modifier l&apos;Ouvrage
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gold text-navy">
                  Chef Maquettiste
                </span>
              </div>
              <p className="text-xs text-navy-light mt-0.5 line-clamp-1">
                {book.metadata.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-border bg-background-secondary shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === "general"
                ? "border-gold text-navy"
                : "border-transparent text-foreground-muted hover:text-foreground"
            }`}
          >
            1. Notice &amp; Informations Générales
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("pricing")}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === "pricing"
                ? "border-gold text-navy"
                : "border-transparent text-foreground-muted hover:text-foreground"
            }`}
          >
            2. Tarification &amp; Formats (Papier / Numérique)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("classification")}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
              activeTab === "classification"
                ? "border-gold text-navy"
                : "border-transparent text-foreground-muted hover:text-foreground"
            }`}
          >
            3. Classification &amp; Faculté
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: General Info */}
          {activeTab === "general" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-start">
                {/* Couverture */}
                <div className="space-y-2 flex flex-col items-center">
                  <div className="w-32 h-44 rounded-2xl bg-navy/5 border border-border overflow-hidden relative group shadow-xs">
                    {coverPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverPreview}
                        alt="Couverture"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center text-foreground-muted text-xs">
                        <BookOpen className="w-8 h-8 text-gold mb-1" />
                        Sans image
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-[11px] font-bold cursor-pointer transition-opacity">
                      <UploadCloud className="w-5 h-5 mb-1 text-gold" />
                      Changer
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                  <label className="text-[11px] text-navy font-bold hover:underline cursor-pointer">
                    Remplacer l&apos;image
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Métadonnées principales */}
                <div className="sm:col-span-2 space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-navy">
                      Titre de l&apos;Ouvrage *
                    </label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-navy">
                      Sous-titre
                    </label>
                    <input
                      type="text"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="Ex: Manuel de référence universitaire"
                      className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-navy">
                      Auteur(s) (séparés par des virgules) *
                    </label>
                    <input
                      type="text"
                      required
                      value={authorsStr}
                      onChange={(e) => setAuthorsStr(e.target.value)}
                      className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy">
                    ISBN-13
                  </label>
                  <input
                    type="text"
                    value={isbn}
                    onChange={(e) => setIsbn(e.target.value)}
                    placeholder="978-99919-X-XXX-X"
                    className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy">
                    Année
                  </label>
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value) || 2026)}
                    className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy">
                    Langue
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                  >
                    <option value="Français">Français</option>
                    <option value="Anglais">Anglais</option>
                    <option value="Fon">Fon</option>
                    <option value="Yoruba">Yoruba</option>
                    <option value="Wolof">Wolof</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-navy">
                  Présentation de l&apos;Ouvrage / Résumé *
                </label>
                <textarea
                  rows={4}
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground focus:ring-2 focus:ring-navy"
                />
              </div>

              {/* Remplacement éventuel du fichier PDF/EPUB */}
              <div className="p-3 rounded-2xl bg-navy/5 border border-border flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gold shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-navy">
                      Fichier source actuel : {bookFile ? bookFile.name : book.files.book_file_name || "Document principal"}
                    </p>
                    <p className="text-[11px] text-foreground-muted">
                      Vous pouvez téléverser une nouvelle épreuve PDF ou EPUB si nécessaire.
                    </p>
                  </div>
                </div>

                <label className="px-3 py-2 rounded-xl bg-background border border-border text-navy text-xs font-bold hover:border-gold cursor-pointer shrink-0">
                  Remplacer le fichier
                  <input
                    type="file"
                    accept=".pdf,.epub"
                    onChange={handleBookFileChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: Pricing & Formats */}
          {activeTab === "pricing" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-5 rounded-2xl bg-background-secondary border border-border space-y-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-gold" />
                  <h3 className="text-sm font-bold font-serif text-navy">
                    Modalités Tarifaires &amp; Disponibilité des Formats
                  </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Prix numérique */}
                  <div className="space-y-1.5 p-4 rounded-xl bg-background border border-border">
                    <label className="text-xs font-bold text-navy flex items-center justify-between">
                      <span>Prix Version Numérique (FCFA) *</span>
                      <span className="text-[10px] text-gold font-bold">Liseuse DRM</span>
                    </label>
                    <input
                      type="number"
                      step="500"
                      required
                      value={priceDigital}
                      onChange={(e) => setPriceDigital(parseFloat(e.target.value) || 0)}
                      className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm font-mono text-navy font-bold focus:ring-2 focus:ring-navy min-h-[44px]"
                    />
                    <p className="text-[11px] text-foreground-muted">
                      Accès immédiat garanti à vie sur le lecteur sécurisé.
                    </p>
                  </div>

                  {/* Prix papier */}
                  <div className={`space-y-1.5 p-4 rounded-xl bg-background border border-border ${
                    !isPaperAvailable ? "opacity-50" : ""
                  }`}>
                    <label className="text-xs font-bold text-navy flex items-center justify-between">
                      <span>Prix Version Papier (FCFA)</span>
                      <span className="text-[10px] text-foreground-muted font-normal">
                        {isPaperAvailable ? "Physique" : "Désactivé"}
                      </span>
                    </label>
                    <input
                      type="number"
                      step="500"
                      disabled={!isPaperAvailable}
                      value={pricePaper}
                      onChange={(e) => setPricePaper(parseFloat(e.target.value) || 0)}
                      className="w-full bg-background border border-border rounded-xl p-3 text-xs sm:text-sm font-mono text-navy font-bold focus:ring-2 focus:ring-navy min-h-[44px]"
                    />
                    <p className="text-[11px] text-foreground-muted">
                      Prix de vente pour les commandes avec livraison physique.
                    </p>
                  </div>
                </div>

                {/* Toggle interactif */}
                <div className="pt-3 border-t border-border flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-navy">
                      Activer la disponibilité en version papier physique
                    </span>
                    <p className="text-[11px] text-foreground-muted">
                      {isPaperAvailable
                        ? "La version imprimée est active : les clients peuvent la commander dans la modale unifiée."
                        : "Seule la version numérique est commandable pour cet ouvrage."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsPaperAvailable((v) => !v)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      isPaperAvailable ? "bg-gold" : "bg-border"
                    }`}
                    role="switch"
                    aria-checked={isPaperAvailable}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        isPaperAvailable ? "translate-x-5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Classification */}
          {activeTab === "classification" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy">
                    Discipline / Genre *
                  </label>
                  <SearchableSelect
                    options={disciplineOptions}
                    value={discipline}
                    onChange={(val) => handleGenreChange(val)}
                    placeholder={disciplinesLoading && realDisciplines.length === 0 ? "Chargement des disciplines..." : "Sélectionner ou rechercher une discipline..."}
                    searchPlaceholder="Rechercher parmi les 900+ disciplines (nom, Dewey)..."
                    emptyMessage="Aucune discipline trouvée pour cette recherche."
                    disabled={disciplinesLoading && realDisciplines.length === 0}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy">
                    Code Dewey
                  </label>
                  <input
                    type="text"
                    value={deweyCode}
                    onChange={(e) => setDeweyCode(e.target.value)}
                    placeholder="Ex: 340, 800, 741.5"
                    className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy">
                    Université de Rattachement
                  </label>
                  <select
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                  >
                    {getUniversityOptions(null, university).map((u, i) => (
                      <option key={i} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy">
                    Faculté / Département
                  </label>
                  <input
                    type="text"
                    value={faculty}
                    onChange={(e) => setFaculty(e.target.value)}
                    placeholder="Ex: Faculté de Droit et de Science Politique (FADESP)"
                    className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy">
                    Pays d&apos;Ancrage
                  </label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                  >
                    {getCountryOptions(null, country).map((c, i) => (
                      <option key={i} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-navy">
                    Public Cible
                  </label>
                  <input
                    type="text"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    placeholder="Grand Public, Étudiants Licence/Master..."
                    className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground focus:ring-2 focus:ring-navy min-h-[44px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-border text-navy text-xs font-bold hover:bg-background-secondary transition-colors min-h-[44px] cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-xl bg-gold hover:bg-gold-light text-navy text-xs font-bold shadow-md transition-all flex items-center gap-2 min-h-[44px] cursor-pointer"
            >
              <Save className="w-4 h-4 text-navy" />
              {saving ? "Enregistrement..." : "Enregistrer les Modifications"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
