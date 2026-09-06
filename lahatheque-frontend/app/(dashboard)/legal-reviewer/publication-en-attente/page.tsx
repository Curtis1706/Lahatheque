"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  BookOpenCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileSignature,
  Send,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  BookOpen,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { BookCover3D } from "@/components/ui/book-cover-3d";
import { Modal } from "@/components/ui/modal";
import { InlineLoader } from "@/components/ui/page-loader";
import { AuthGuard } from "@/components/auth-guard";
import {
  getPendingPublicationBooks,
  publishPendingOuvrage,
} from "@/lib/services/legal";
import type { PendingPublicationBook } from "@/lib/types/legal";

export default function LegalPendingPublicationPage() {
  const [books, setBooks] = useState<PendingPublicationBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // Modale de confirmation
  const [selectedBook, setSelectedBook] = useState<PendingPublicationBook | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const data = await getPendingPublicationBooks();
      setBooks(data);
    } catch {
      toast.error("Impossible de récupérer les ouvrages en attente de publication.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const filteredBooks = books.filter((b) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const titleMatch = b.title.toLowerCase().includes(q);
    const authorMatch = (b.authors || []).some((a) => a.toLowerCase().includes(q));
    const disciplineMatch = (b.discipline || "").toLowerCase().includes(q);
    return titleMatch || authorMatch || disciplineMatch;
  });

  const readyToPublishCount = books.filter((b) => b.has_active_contract).length;
  const missingContractCount = books.filter((b) => !b.has_active_contract).length;

  const handleOpenPublishModal = (book: PendingPublicationBook) => {
    setErrorMessage(null);
    setSelectedBook(book);
  };

  const handleConfirmPublish = async () => {
    if (!selectedBook) return;
    setPublishing(true);
    setErrorMessage(null);

    const res = await publishPendingOuvrage(selectedBook.id);

    setPublishing(false);
    if (res.success) {
      toast.success(res.message || `L'ouvrage « ${selectedBook.title} » est maintenant publié sur la vitrine.`);
      setSelectedBook(null);
      // Retirer l'ouvrage publié de la liste
      startTransition(() => {
        setBooks((prev) => prev.filter((b) => b.id !== selectedBook.id));
      });
    } else {
      const err = res.error || "Une erreur est survenue lors de la publication.";
      setErrorMessage(err);
      toast.error(err);
    }
  };

  return (
    <AuthGuard requiredRoles={["legal_reviewer", "admin", "super_admin"]}>
      <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
        {/* En-tête de page */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-gold uppercase tracking-wider">
              <ShieldCheck className="size-4" />
              <span>Contrôle Juridique &amp; Validation Finale</span>
            </div>
            <h1 className="font-serif font-bold text-2xl sm:text-3xl text-navy">
              Publications en Attente
            </h1>
            <p className="text-xs sm:text-sm text-foreground-muted max-w-3xl">
              Ces ouvrages internes ont été examinés et validés par le Chef Maquettiste.
              En tant que Juriste, vérifiez le rattachement d'un contrat d'édition actif avant d'autoriser la publication officielle sur la vitrine.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={fetchBooks}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-background-secondary text-navy text-xs font-bold transition-colors cursor-pointer min-h-[44px]"
            >
              <RefreshCw className={`size-3.5 text-gold ${loading ? "animate-spin" : ""}`} />
              Actualiser
            </button>
            <Link
              href="/legal-reviewer/contracts/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-navy hover:bg-navy-hover text-white text-xs font-bold transition-colors shadow-xs cursor-pointer min-h-[44px]"
            >
              <FileSignature className="size-3.5 text-gold" />
              Nouveau Contrat
            </Link>
          </div>
        </div>

        {/* Indicateurs / KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-2xl bg-background-secondary border border-border flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-foreground-muted">Total en attente</p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-navy mt-1">
                {books.length}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-navy/10 text-navy flex items-center justify-center">
              <BookOpenCheck className="size-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-success/5 border border-success/20 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-foreground-muted">Prêts à publier</p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-success mt-1">
                {readyToPublishCount}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-success/15 text-success flex items-center justify-center">
              <CheckCircle2 className="size-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-warning/5 border border-warning/20 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-foreground-muted">Contrat manquant</p>
              <p className="text-xl sm:text-2xl font-bold font-mono text-warning mt-1">
                {missingContractCount}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-warning/15 text-warning flex items-center justify-center">
              <AlertTriangle className="size-5" />
            </div>
          </div>
        </div>

        {/* Barre de recherche */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-foreground-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par titre, auteur ou discipline..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-navy/20 min-h-[44px]"
          />
        </div>

        {/* Contenu principal */}
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-center rounded-2xl border border-border bg-background-secondary">
            <InlineLoader size={32} />
            <p className="text-xs font-medium text-foreground-muted">
              Chargement des ouvrages en attente de validation juridique...
            </p>
          </div>
        ) : filteredBooks.length === 0 ? (
          <div className="p-10 sm:p-14 rounded-2xl border border-border bg-background-secondary text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gold/10 text-gold flex items-center justify-center mx-auto">
              <BookOpenCheck className="size-6" />
            </div>
            <h2 className="font-serif font-bold text-navy text-lg">
              {search ? "Aucun résultat trouvé" : "Aucun ouvrage en attente"}
            </h2>
            <p className="text-xs text-foreground-muted max-w-md mx-auto">
              {search
                ? "Modifiez votre recherche pour afficher les ouvrages en attente."
                : "Tous les ouvrages internes validés par le Chef Maquettiste ont déjà été traités ou sont publiés."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Version mobile : cartes empilées */}
            <div className="grid grid-cols-1 md:hidden gap-3.5">
              {filteredBooks.map((book) => (
                <div
                  key={book.id}
                  className="p-4 rounded-2xl border border-border bg-background space-y-3 shadow-xs"
                >
                  <div className="flex items-start gap-3">
                    <BookCover3D
                      title={book.title}
                      authors={book.authors}
                      discipline={book.discipline}
                      coverUrl={book.cover_url || undefined}
                      size="xs"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <h3 className="font-serif font-bold text-navy text-sm line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-xs text-foreground-muted line-clamp-1">
                        {book.authors?.length ? book.authors.join(", ") : "Auteur non spécifié"}
                      </p>
                      {book.discipline && (
                        <span className="inline-block text-[10px] font-semibold text-navy bg-navy/5 px-2 py-0.5 rounded-md border border-navy/10">
                          {book.discipline}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border flex flex-col gap-2">
                    {book.has_active_contract ? (
                      <div className="flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-success bg-success/10 px-2.5 py-1 rounded-lg border border-success/20">
                          <CheckCircle2 className="size-3.5" />
                          Contrat Actif Vérifié
                        </span>
                        <Link
                          href={`/legal-reviewer/contracts?search=${encodeURIComponent(book.title)}`}
                          className="text-[11px] text-navy hover:text-gold font-medium flex items-center gap-1"
                        >
                          Voir contrat
                          <ExternalLink className="size-3" />
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-warning bg-warning/10 px-2.5 py-1 rounded-lg border border-warning/20">
                            <AlertTriangle className="size-3.5" />
                            Contrat Manquant
                          </span>
                          <Link
                            href={`/legal-reviewer/contracts/new?book_id=${book.id}`}
                            className="text-[11px] text-gold hover:underline font-bold flex items-center gap-1"
                          >
                            Établir contrat
                            <ArrowRight className="size-3" />
                          </Link>
                        </div>
                        <p className="text-[10px] text-foreground-muted italic">
                          Publication impossible tant qu'un contrat d'édition n'est pas actif.
                        </p>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleOpenPublishModal(book)}
                        disabled={!book.has_active_contract}
                        title={
                          book.has_active_contract
                            ? "Publier cet ouvrage sur la vitrine publique"
                            : "Veuillez enregistrer un contrat actif avant de publier"
                        }
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 min-h-[44px] transition-colors ${
                          book.has_active_contract
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                            : "bg-background-secondary text-foreground-muted border border-border cursor-not-allowed opacity-60"
                        }`}
                      >
                        <Send className="size-3.5" />
                        Publier sur la Vitrine
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Version desktop : Table structurée */}
            <div className="hidden md:block rounded-2xl border border-border bg-background overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-background-secondary border-b border-border text-foreground-muted uppercase tracking-wider font-semibold text-[11px]">
                      <th className="py-3 px-4">Ouvrage</th>
                      <th className="py-3 px-4">Discipline</th>
                      <th className="py-3 px-4">Statut Contrat</th>
                      <th className="py-3 px-4 text-right">Action Publication</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredBooks.map((book) => (
                      <tr key={book.id} className="hover:bg-background-secondary/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <BookCover3D
                              title={book.title}
                              authors={book.authors}
                              discipline={book.discipline}
                              coverUrl={book.cover_url || undefined}
                              size="xs"
                            />
                            <div className="min-w-0 max-w-md">
                              <p className="font-serif font-bold text-navy text-sm truncate">
                                {book.title}
                              </p>
                              <p className="text-[11px] text-foreground-muted truncate">
                                {book.authors?.length ? book.authors.join(", ") : "Auteur non spécifié"}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {book.discipline ? (
                            <span className="inline-block text-[11px] font-semibold text-navy bg-navy/5 px-2.5 py-1 rounded-lg border border-navy/10">
                              {book.discipline}
                            </span>
                          ) : (
                            <span className="text-foreground-muted italic">Non catégorisé</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {book.has_active_contract ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-success bg-success/10 px-2.5 py-1 rounded-lg border border-success/20">
                                <CheckCircle2 className="size-3.5" />
                                Contrat Actif
                              </span>
                              <div>
                                <Link
                                  href={`/legal-reviewer/contracts?search=${encodeURIComponent(book.title)}`}
                                  className="text-[10px] text-navy hover:text-gold font-medium inline-flex items-center gap-1"
                                >
                                  Consulter les droits
                                  <ExternalLink className="size-2.5" />
                                </Link>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-warning bg-warning/10 px-2.5 py-1 rounded-lg border border-warning/20">
                                <AlertTriangle className="size-3.5" />
                                Aucun Contrat Actif
                              </span>
                              <div>
                                <Link
                                  href={`/legal-reviewer/contracts/new?book_id=${book.id}`}
                                  className="text-[10px] text-gold hover:underline font-bold inline-flex items-center gap-1"
                                >
                                  Établir le contrat
                                  <ArrowRight className="size-2.5" />
                                </Link>
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenPublishModal(book)}
                            disabled={!book.has_active_contract}
                            title={
                              book.has_active_contract
                                ? "Publier cet ouvrage sur la vitrine publique"
                                : "Veuillez enregistrer un contrat actif avant de publier"
                            }
                            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors min-h-[40px] ${
                              book.has_active_contract
                                ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                                : "bg-background-secondary text-foreground-muted border border-border cursor-not-allowed opacity-60"
                            }`}
                          >
                            <Send className="size-3.5" />
                            Publier sur la Vitrine
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modale de confirmation de publication */}
        {selectedBook && (
          <Modal
            open={Boolean(selectedBook)}
            onClose={() => {
              if (!publishing) {
                setSelectedBook(null);
                setErrorMessage(null);
              }
            }}
            title="Confirmation de Publication sur la Vitrine"
            description="Double contrôle juridique LAHAThèque"
          >
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-2xl bg-background-secondary border border-border flex items-start gap-3">
                <BookCover3D
                  title={selectedBook.title}
                  authors={selectedBook.authors}
                  discipline={selectedBook.discipline}
                  coverUrl={selectedBook.cover_url || undefined}
                  size="xs"
                />
                <div className="min-w-0 space-y-1">
                  <h4 className="font-serif font-bold text-navy text-sm">
                    {selectedBook.title}
                  </h4>
                  <p className="text-xs text-foreground-muted">
                    {selectedBook.authors?.join(", ") || "Auteur"}
                  </p>
                  <p className="text-[11px] text-gold font-medium">
                    Discipline : {selectedBook.discipline || "Générale"}
                  </p>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs font-medium space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertTriangle className="size-4 shrink-0" />
                    <span>Échec de publication</span>
                  </div>
                  <p>{errorMessage}</p>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-emerald-700">
                  <CheckCircle2 className="size-4 shrink-0" />
                  <span>Contrat d'édition actif détecté</span>
                </div>
                <p className="text-[11px] text-foreground-muted">
                  En confirmant, l'ouvrage passera immédiatement au statut public (<span className="font-mono">published</span>). Il deviendra accessible aux lecteurs et acheteurs sur le catalogue vitrine.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBook(null)}
                  disabled={publishing}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl border border-border bg-background hover:bg-background-secondary text-xs font-bold text-navy transition-colors cursor-pointer min-h-[44px]"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPublish}
                  disabled={publishing}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer min-h-[44px]"
                >
                  {publishing ? (
                    <InlineLoader size={16} />
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" />
                      Confirmer la Publication
                    </>
                  )}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AuthGuard>
  );
}
