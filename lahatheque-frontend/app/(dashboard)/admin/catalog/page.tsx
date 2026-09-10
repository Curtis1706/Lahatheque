"use client";

import React, { useEffect, useState } from "react";
import { DataTable, DataTableColumn } from "@/components/ui/data-table";
import { StatusBadge } from "@/components/ui/status-badge";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { getAdminCatalog, deleteAdminCatalogBook } from "@/lib/services/admin";
import { AdminCatalogBook } from "@/lib/types/admin";
import { 
  BookOpen, 
  Search, 
  Tag, 
  History, 
  Shield, 
  Eye, 
  Pencil, 
  Trash2, 
  PlusCircle,
  Headphones,
  Languages, 
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { InlineLoader } from "@/components/ui/page-loader";
import { ViewToggle, ViewMode } from "@/components/features/student/view-toggle";
// Mis en commentaire temporaire (réactivable sans réécriture) :
// import { useAudioPlayer } from "@/components/features/audio/audio-player-context";
// import { AudioReplacementDropzone } from "@/components/features/layout-artist/audio-replacement-dropzone";
import { AuthorsDisplay } from "@/components/features/catalog/authors-display";
import { CATALOG_LANGUAGE_OPTIONS, matchesLanguageFilter } from "@/lib/constants/catalog-languages";

export default function AdminCatalogPage() {
  // const { playBook } = useAudioPlayer();
  const [books, setBooks] = useState<AdminCatalogBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [gridLanguage, setGridLanguage] = useState<string>("all");
  const [gridSearch, setGridSearch] = useState<string>("");

  // State pour la suppression
  const [deleteConfirmBook, setDeleteConfirmBook] = useState<AdminCatalogBook | null>(null);

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        const data = await getAdminCatalog();
        setBooks(data);
      } catch (err) {
        console.error("Erreur chargement catalogue admin", err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  const handleDeleteBook = async () => {
    if (!deleteConfirmBook) return;
    const target = deleteConfirmBook;
    setBooks((prev) => prev.filter((b) => b.id !== target.id));
    setDeleteConfirmBook(null);
    try {
      const res = await deleteAdminCatalogBook(target.id);
      if (res.success) {
        toast.success(res.message || `L'ouvrage "${target.title}" a été retiré du catalogue et de la vitrine.`);
      } else {
        toast.error(res.error || "Erreur lors du retrait de l'ouvrage.");
        const data = await getAdminCatalog();
        setBooks(data);
      }
    } catch {
      toast.error("Erreur serveur lors de l'opération.");
      const data = await getAdminCatalog();
      setBooks(data);
    }
  };

  const formatAuthors = (authors?: string[] | string, fallbackName?: string): string => {
    if (Array.isArray(authors) && authors.length > 0) return authors.join(", ");
    if (typeof authors === "string" && authors.trim().length > 0) return authors;
    if (fallbackName && fallbackName.trim().length > 0) return fallbackName;
    return "Auteur non renseigné";
  };

  const columns: DataTableColumn<AdminCatalogBook>[] = [
    {
      key: "title",
      header: "Ouvrage & Couverture",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <BookCover3D
            title={row.title}
            authors={row.authors || row.author_name}
            discipline={row.discipline}
            coverUrl={row.cover_image || row.cover_url}
            size="xs"
          />
          <div className="min-w-0 max-w-xs space-y-0.5">
            <p className="font-semibold text-xs text-foreground truncate">{row.title}</p>
            <p className="text-[11px] font-mono text-foreground-muted">ISBN: {row.isbn || "—"}</p>
            <div className="flex flex-wrap items-center gap-1 pt-0.5">
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                row.is_original !== false ? "bg-navy/10 text-navy" : "bg-gold/20 text-gold"
              }`}>
                {row.is_original !== false ? "Original" : "Traduction"} [{((row.original_language || row.language || "fr") as string).slice(0, 2).toUpperCase()}]
              </span>
              {row.available_languages && row.available_languages.length > 1 && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-background-secondary text-foreground-muted border border-border">
                  {row.available_languages.map((l: string) => l.toUpperCase()).join(" • ")}
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "authors",
      header: "Auteur(s) & Éditeur",
      cell: (row) => (
        <div className="max-w-xs space-y-1">
          <AuthorsDisplay
            authors={row.authors}
            fallbackName={row.author_name}
            bookTitle={row.title}
            maxVisible={2}
            className="text-xs font-medium text-foreground"
          />
          <p className="text-[11px] text-gold font-medium">{row.publisher_name}</p>
        </div>
      ),
    },
    {
      key: "discipline",
      header: "Discipline",
      cell: (row) => (
        <span className="text-xs px-2.5 py-0.5 rounded-full bg-background-secondary border border-border text-foreground-muted font-medium">
          {row.discipline || "Non classé"}
        </span>
      ),
    },
    {
      key: "price_digital",
      header: "Formats & Tarifs",
      cell: (row) => (
        <div className="font-mono text-xs space-y-0.5">
          <span className="font-bold text-navy block">{row.price_digital.toLocaleString("fr-FR")} FCFA <span className="text-[9px] font-sans text-foreground-muted font-normal">(Num)</span></span>
          <span className="text-[10px] text-foreground-muted block">Papier: {row.price_paper.toLocaleString("fr-FR")} FCFA</span>
          {(row.has_audio_version || (row as any).price_audio) && (
            <span className="text-[10px] text-gold font-bold flex items-center gap-1">
              <Headphones className="w-3 h-3 text-gold" />
              <span>Audio: {((row as any).price_audio || 3500).toLocaleString("fr-FR")} FCFA</span>
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Statut Dépôt",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "id",
      header: "Actions",
      cell: (row) => (
        <div className="flex items-center gap-1.5 justify-end">
          {/* Boutons audio mis en commentaire temporaire chez l'admin
          <button
            type="button"
            onClick={() => {}}
            className="p-1.5 rounded-lg border border-gold/40 bg-gold/10 hover:bg-gold hover:text-navy text-gold transition-colors cursor-pointer"
            title="Écouter la piste audio (Privilège Administrateur)"
          >
            <Headphones className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {}}
            className="p-1.5 rounded-lg border border-border bg-background hover:bg-gold/15 text-foreground-muted hover:text-navy transition-colors cursor-pointer"
            title="Gérer / Remplacer la piste audio"
          >
            <RefreshCw className="w-3.5 h-3.5 text-gold" />
          </button>
          */}
          <Link
            href={`/admin/catalog/${row.id}/edit`}
            className="p-1.5 rounded-lg border border-border bg-background hover:bg-gold hover:text-navy text-foreground-muted transition-colors cursor-pointer"
            title="Modifier l'ouvrage et ses déclinaisons"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Link>
          {/* Bouton de protection mis en commentaire temporaire dans les actions
          <Link
            href={`/admin/catalog/${row.id}/protection`}
            className="p-1.5 rounded-lg border border-border bg-background hover:bg-navy hover:text-white text-foreground-muted transition-colors"
            title="Gérer les droits DRM"
          >
            <Shield className="w-3.5 h-3.5" />
          </Link>
          */}
          <Link
            href={`/catalog/reader/${row.id}`}
            target="_blank"
            className="p-1.5 rounded-lg border border-border bg-background hover:bg-navy hover:text-white text-foreground-muted transition-colors cursor-pointer"
            title="Aperçu dans la liseuse"
          >
            <Eye className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            onClick={() => setDeleteConfirmBook(row)}
            className="p-1.5 rounded-lg border border-border bg-background hover:bg-error/15 text-foreground-muted hover:text-error transition-colors cursor-pointer"
            title="Retirer du catalogue / Archiver"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  const displayedGridBooks = books.filter((book) => {
    const matchesLang = matchesLanguageFilter(book, gridLanguage);
    const q = gridSearch.trim().toLowerCase();
    const matchesSearch =
      !q ||
      book.title.toLowerCase().includes(q) ||
      (book.author_name && book.author_name.toLowerCase().includes(q)) ||
      (Array.isArray(book.authors) && book.authors.some((a) => a.toLowerCase().includes(q)));
    return matchesLang && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 w-full max-w-7xl mx-auto space-y-6">
      {/* En-tête de la page */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-serif text-2xl font-bold text-navy">Gestion du Catalogue Global</h1>
          <p className="text-xs text-foreground-muted mt-1">
            Supervision du catalogue universitaire, tarification dérogatoire et politiques de protection DRM.
          </p>
        </div>

        {/* Boutons d'action et bascule de vue */}
        <div className="flex flex-wrap items-center gap-2.5">
          <ViewToggle mode={viewMode} onChange={setViewMode} />

          <Link
            href="/admin/catalog/new"
            className="px-4 py-2 rounded-xl bg-navy text-white font-bold text-xs hover:bg-navy-hover transition-colors flex items-center gap-2 min-h-[38px] shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-gold" />
            <span>Ajouter un Ouvrage</span>
          </Link>

          <Link
            href="/admin/settings/drm"
            className="px-3.5 py-2 rounded-xl bg-gold/10 border border-gold/30 text-navy font-bold text-xs hover:bg-gold/20 transition-colors flex items-center gap-1.5 min-h-[38px]"
          >
            <Shield className="w-3.5 h-3.5 text-gold" />
            Politiques DRM
          </Link>
          <Link
            href="/admin/catalog/pricing"
            className="px-3.5 py-2 rounded-xl bg-background-secondary border border-border text-foreground font-semibold text-xs hover:border-gold transition-colors flex items-center gap-1.5 min-h-[38px]"
          >
            <Tag className="w-3.5 h-3.5 text-gold" />
            Tarification
          </Link>
          <Link
            href="/admin/catalog/pricing/history"
            className="px-3.5 py-2 rounded-xl bg-background-secondary border border-border text-foreground font-semibold text-xs hover:border-gold transition-colors flex items-center gap-1.5 min-h-[38px]"
          >
            <History className="w-3.5 h-3.5 text-navy" />
            Historique Prix
          </Link>
        </div>
      </div>

      {/* Mode de vue conditionnel (Grille / Liste) */}
      {viewMode === "grid" ? (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-background border border-border">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-foreground-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher par titre ou auteur..."
                value={gridSearch}
                onChange={(e) => setGridSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-background-secondary border border-border text-foreground placeholder:text-foreground-muted focus:ring-2 focus:ring-navy outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <Languages className="w-4 h-4 text-gold shrink-0" />
              <select
                value={gridLanguage}
                onChange={(e) => setGridLanguage(e.target.value)}
                className="py-2 px-3 text-xs rounded-xl bg-background-secondary border border-border text-foreground focus:ring-2 focus:ring-navy outline-none cursor-pointer"
              >
                {CATALOG_LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {displayedGridBooks.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-background border border-border text-foreground-muted text-xs">
              Aucun ouvrage ne correspond à vos critères de recherche ou de langue.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {displayedGridBooks.map((book) => (
                <div key={book.id} className="p-4 rounded-2xl bg-background border border-border space-y-3 hover:border-gold/50 transition-all flex flex-col justify-between group shadow-2xs">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-navy-light text-navy font-bold truncate max-w-[120px]">
                        {book.discipline || "Général"}
                      </span>
                      <StatusBadge status={book.status} />
                    </div>

                    {/* Couverture 3D élégante centrée */}
                    <div className="flex justify-center py-1">
                      <BookCover3D
                        title={book.title}
                        authors={book.authors || book.author_name}
                        discipline={book.discipline}
                        coverUrl={book.cover_image || book.cover_url}
                        size="sm"
                      />
                    </div>

                    <div className="space-y-1 text-center">
                      <h3 className="font-serif font-bold text-sm text-foreground line-clamp-2">{book.title}</h3>
                      <div className="text-xs text-foreground-muted flex items-center justify-center gap-1">
                        <span>Par</span>
                        <AuthorsDisplay
                          authors={book.authors}
                          fallbackName={book.author_name}
                          bookTitle={book.title}
                          maxVisible={2}
                          className="text-xs text-foreground-muted"
                        />
                      </div>
                      <p className="text-xs text-gold font-medium">{book.publisher_name}</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-navy">{book.price_digital.toLocaleString("fr-FR")} FCFA</span>
                      <span className="text-[10px] text-foreground-muted uppercase font-bold">{book.protection_type || "LCP"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2 pt-1 font-sans">
                      <Link
                        href={`/admin/catalog/${book.id}/edit`}
                        className="flex-1 py-2 px-3 rounded-xl bg-gold/10 hover:bg-gold/20 text-navy text-xs font-semibold transition-colors cursor-pointer min-h-[36px] flex items-center justify-center gap-1.5"
                        title="Modifier l'ouvrage et ses déclinaisons"
                      >
                        <Pencil className="w-3.5 h-3.5 text-gold" />
                        <span>Modifier</span>
                      </Link>
                      {/* Bouton de protection mis en commentaire temporaire en vue grille
                      <Link
                        href={`/admin/catalog/${book.id}/protection`}
                        className="flex-1 py-2 px-2 rounded-xl bg-gold/10 hover:bg-gold/20 text-navy text-[11px] font-bold text-center transition-colors flex items-center justify-center gap-1 min-h-[36px]"
                      >
                        <Shield className="w-3 h-3 text-gold" />
                        <span>Protection</span>
                      </Link>
                      */}
                      {/* Bouton audio alternatif mis en commentaire temporaire
                      {((book as any).has_audio || (book as any).has_audio_version || (book as any).format_type === 'audio') && (book as any).is_digital_available === false ? (
                        <Link
                          href={`/listen/${book.id}`}
                          target="_blank"
                          className="p-2 rounded-xl bg-gold/15 hover:bg-gold/25 text-navy transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                          title="Ouvrir dans le lecteur audio sécurisé"
                        >
                          <Headphones className="w-3.5 h-3.5 text-gold" />
                        </Link>
                      ) : null}
                      */}
                      <Link
                        href={`/catalog/reader/${book.id}`}
                        target="_blank"
                        className="p-2 rounded-xl bg-navy/10 hover:bg-navy hover:text-white text-navy transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center cursor-pointer"
                        title="Ouvrir dans le lecteur sécurisé"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmBook(book)}
                        className="p-2 rounded-xl bg-error/10 hover:bg-error/20 text-error transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                        title="Retirer du catalogue / Archiver"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <DataTable
          data={books}
          columns={columns}
          rowKey="id"
          loading={loading}
          filterKey="status"
          filterOptions={[
            { value: "all", label: "Tous les Statuts" },
            { value: "published", label: "Publiés" },
            { value: "submitted", label: "En Soumission" },
            { value: "draft", label: "Brouillons" },
            { value: "archived", label: "Archivés" },
          ]}
          secondaryFilterKey="language"
          secondaryFilterOptions={CATALOG_LANGUAGE_OPTIONS}
          secondaryFilterPlaceholder="Toutes les langues"
          secondaryFilterFn={(row, lang) => matchesLanguageFilter(row, lang)}
          searchPlaceholder="Rechercher par titre ou auteur..."
        />
      )}


      {/* Modal Confirmation de Retrait d'un Ouvrage du Catalogue */}
      {deleteConfirmBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/80 animate-in fade-in">
          <div className="bg-background rounded-3xl border border-border p-6 max-w-md w-full shadow-2xl space-y-4 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-error/15 text-error mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-navy">Retirer l&apos;Ouvrage du Catalogue</h3>
              <p className="text-xs text-foreground-muted mt-1.5 leading-relaxed">
                Êtes-vous sûr de vouloir retirer l&apos;ouvrage{" "}
                <span className="font-semibold text-navy">
                  &laquo; {deleteConfirmBook.title} &raquo;
                </span>{" "}
                du catalogue ? L&apos;ouvrage ne sera plus visible sur les catalogues et la vitrine publique.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmBook(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-foreground-muted hover:bg-background-secondary cursor-pointer transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleDeleteBook}
                className="px-4 py-2 rounded-xl bg-error text-white font-bold text-xs hover:bg-error/90 transition-colors cursor-pointer shadow-xs"
              >
                Retirer du Catalogue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gestion et Remplacement Audio (mise en commentaire temporaire)
      {audioManagingBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/80 animate-in fade-in">
          <div className="bg-background rounded-3xl border border-border p-6 max-w-xl w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gold/10 text-gold">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-navy text-base">Gestion Audio — {audioManagingBook.title}</h3>
                  <p className="text-[11px] text-foreground-muted">Remplacement ou téléversement de la piste audio Cloudflare Stream</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAudioManagingBook(null)}
                className="p-1 text-foreground-muted hover:text-navy rounded-lg hover:bg-background-secondary transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <AudioReplacementDropzone
              bookId={audioManagingBook.id}
              bookTitle={audioManagingBook.title}
              currentDurationSeconds={(audioManagingBook as any).audio_duration_seconds}
              onSuccess={() => {
                setAudioManagingBook(null);
                toast.success("Piste audio actualisée !");
              }}
            />
          </div>
        </div>
      )}
      */}
    </div>
  );
}
