"use client";

import { useEffect, useState } from "react";
import { 
  getSpecimenRequests, 
  createSpecimenRequest 
} from "@/lib/services/teacher";
import { SpecimenRequest } from "@/lib/types/teacher";
import { 
  BookOpen, 
  Clock,
  Plus,
  ArrowLeft,
  Sparkles,
  GraduationCap
} from "lucide-react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { StatusBadge } from "@/components/ui/status-badge";
import { BookCover } from "@/components/features/student/book-cover";
import { StudentBookAccess } from "@/lib/types/student";
import { EmptyState, EmptyIcon, EmptyTitle, EmptyDescription } from "@/components/ui/empty-state";
import { mockBooks } from "@/lib/mock/catalog";

export default function TeacherSpecimensPage() {
  const [specimens, setSpecimens] = useState<SpecimenRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // State des modales
  const [showSpecimenModal, setShowSpecimenModal] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState("");
  const [submittingSpecimen, setSubmittingSpecimen] = useState(false);

  useEffect(() => {
    async function loadSpecimens() {
      try {
        setLoading(true);
        const data = await getSpecimenRequests();
        setSpecimens(data);
      } catch (err) {
        console.error("Erreur lors du chargement des spécimens", err);
      } finally {
        setLoading(false);
      }
    }
    loadSpecimens();
  }, []);

  const handleRequestSpecimen = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookId) return;
    const selectedBook = mockBooks.find(b => b.id === selectedBookId);
    if (!selectedBook) return;
    try {
      setSubmittingSpecimen(true);
      const req = await createSpecimenRequest(
        selectedBook.id, 
        selectedBook.title, 
        selectedBook.authors_details.map(a => `${a.first_name} ${a.last_name}`).join(", ")
      );
      setSpecimens(prev => [req, ...prev]);
      setShowSpecimenModal(false);
      setSelectedBookId("");
    } catch (err) {
      alert("Erreur lors de la demande.");
    } finally {
      setSubmittingSpecimen(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <Link
            href="/teacher"
            className="inline-flex items-center gap-1 text-xs font-bold text-navy hover:underline mb-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour au Tableau de Bord
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold">
            <GraduationCap className="w-4 h-4" />
            <span>Spécimens Numériques d&apos;Évaluation</span>
          </div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy">
            Demandes de Spécimens Enseignant
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted max-w-2xl">
            Demandez et consultez les manuels de référence mis gratuitement à votre disposition pour évaluation avant prescription à vos cohortes d&apos;étudiants.
          </p>
        </div>

        <button
          onClick={() => setShowSpecimenModal(true)}
          className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 self-start md:self-auto shrink-0 min-h-[44px]"
        >
          <Plus className="w-4 h-4 text-gold" />
          Demander un Spécimen
        </button>
      </div>

      {/* Grille de Spécimens Mobile-First */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-background-secondary h-44 rounded-2xl border border-border" />
          ))}
        </div>
      ) : specimens.length === 0 ? (
        <EmptyState>
          <EmptyIcon icon={BookOpen} />
          <EmptyTitle>Aucun spécimen demandé</EmptyTitle>
          <EmptyDescription>Vous n&apos;avez encore soumis aucune demande d&apos;évaluation d&apos;ouvrage.</EmptyDescription>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specimens.map((spec) => {
            const dummyBook: StudentBookAccess = {
              id: spec.book_id,
              title: spec.book_title,
              author: spec.author,
              discipline: spec.discipline,
              institution: "UAC",
              format: "PDF",
              cover_bg: spec.cover_bg,
              cover_color: spec.cover_color,
              progress_percent: 100,
              isbn: "978-2-84299-SPEC",
              edition_year: 2024,
              page_count: 320,
              is_favorite: false
            };

            return (
              <div key={spec.id} className="bg-background border border-border p-5 rounded-2xl flex items-start gap-4 shadow-xs">
                <BookCover book={dummyBook} size="sm" />

                <div className="space-y-2 min-w-0 flex-1">
                  <StatusBadge status={spec.status} />

                  <h3 className="font-serif font-bold text-navy text-base leading-snug line-clamp-2">
                    {spec.book_title}
                  </h3>

                  <p className="text-xs text-foreground-muted font-medium truncate">Par {spec.author}</p>

                  <div className="pt-2 border-t border-border space-y-1 text-[11px] text-foreground-muted">
                    <p className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gold shrink-0" />
                      Demandé le {spec.requested_at}
                    </p>
                    {spec.reason && (
                      <p className="italic text-[10px] truncate" title={spec.reason}>
                        &ldquo;{spec.reason}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modale de Demande de Spécimen */}
      <Modal
        open={showSpecimenModal}
        onClose={() => setShowSpecimenModal(false)}
        title="Nouvelle Demande de Spécimen Enseignant"
      >
        <form onSubmit={handleRequestSpecimen} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-navy uppercase tracking-wider">
              Sélectionner un Manuel dans le Catalogue
            </label>
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              required
              className="w-full px-3 py-2.5 rounded-xl bg-background-secondary border border-border text-xs font-medium text-foreground focus:outline-none focus:border-gold min-h-[44px]"
            >
              <option value="">-- Choisir un manuel --</option>
              {mockBooks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title} ({b.authors_details.map(a => `${a.first_name} ${a.last_name}`).join(", ")})
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => setShowSpecimenModal(false)}
              className="px-4 py-2 rounded-xl bg-background-secondary text-foreground text-xs font-semibold hover:bg-border transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={submittingSpecimen}
              className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors shadow-xs"
            >
              {submittingSpecimen ? "Envoi en cours..." : "Soumettre la demande"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
