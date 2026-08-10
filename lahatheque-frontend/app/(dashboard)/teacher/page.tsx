"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { getTeacherCourses, getSpecimenRequests, getTeacherStats } from "@/lib/services/teacher";
import { Course, SpecimenRequest, PrescribedBook, TeacherStats } from "@/lib/types/teacher";
import { 
  GraduationCap, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Building2, 
  ArrowUpRight,
  Plus,
  Sparkles,
  Search
} from "lucide-react";
import { TeacherKpiCharts } from "@/components/features/teacher/teacher-kpi-charts";
import { BookCard } from "@/components/features/student/book-card";
import { BookListItem } from "@/components/features/student/book-list-item";
import { BookCover } from "@/components/features/student/book-cover";
import { ViewToggle, ViewMode } from "@/components/features/student/view-toggle";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, EmptyIcon, EmptyTitle, EmptyDescription } from "@/components/ui/empty-state";
import { StudentBookAccess } from "@/lib/types/student";

export default function TeacherDashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [specimens, setSpecimens] = useState<SpecimenRequest[]>([]);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function loadTeacherData() {
      try {
        setLoading(true);
        const [coursesData, specimensData, statsData] = await Promise.all([
          getTeacherCourses(),
          getSpecimenRequests(),
          getTeacherStats()
        ]);
        setCourses(coursesData);
        setSpecimens(specimensData);
        setStats(statsData);
      } catch (err) {
        console.error("Erreur de chargement des données enseignant", err);
      } finally {
        setLoading(false);
      }
    }
    loadTeacherData();
  }, []);

  // Extraire tous les manuels prescrits à partir des cours de l'enseignant
  const allPrescribedBooks: StudentBookAccess[] = courses.flatMap((course) =>
    course.recommended_books.map((b) => ({
      id: b.id,
      title: b.title,
      author: b.author,
      discipline: b.discipline,
      institution: b.institution,
      format: b.format,
      cover_bg: b.cover_bg,
      cover_color: b.cover_color,
      progress_percent: b.avg_progress_percent,
      isbn: b.isbn,
      edition_year: b.edition_year,
      page_count: b.page_count,
      is_favorite: false,
      is_recommended: true,
      course_code: course.code,
      course_name: course.name
    }))
  );

  const filteredBooks = allPrescribedBooks.filter((book) =>
    searchQuery === "" ||
    book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
    book.discipline.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background text-foreground py-6 sm:py-8 px-4 sm:px-6 lg:px-8 space-y-8 max-w-7xl mx-auto w-full min-w-0"
    >
      {/* 1. LES KPIS EN PREMIER (Data Visualizations 21st.dev) */}
      {!loading && stats ? (
        <TeacherKpiCharts stats={stats} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-background border border-border p-5 rounded-2xl animate-pulse space-y-3 h-40" />
          ))}
        </div>
      )}

      {/* 2. EN-TÊTE DU DASHBOARD ENSEIGNANT */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold">
            <GraduationCap className="w-4 h-4" />
            <span>Espace Enseignant-Chercheur • UAC</span>
          </div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy">
            Manuels Prescrits & Cours Universitaires
          </h1>
          <p className="text-xs sm:text-sm text-foreground-muted max-w-2xl">
            Gérez les prescriptions de manuels pour vos étudiants, suivez le taux de lecture de vos cohortes et demandez vos spécimens d&apos;évaluation.
          </p>
        </div>

        <Link
          href="/teacher/specimens"
          className="px-4 py-2.5 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors inline-flex items-center gap-2 self-start md:self-auto shrink-0 min-h-[44px]"
        >
          <Plus className="w-4 h-4 text-gold" />
          Demander un spécimen enseignant
        </Link>
      </div>

      {/* 3. BARRE DE RECHERCHE RAPIDE & TOGGLE GRILLE / LISTE */}
      <div className="bg-background border border-border p-4 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-xs">
        <div className="relative flex-1">
          <Search className="w-5 h-5 text-foreground-muted absolute left-3.5 top-1/2 -translate-y-1/2 shrink-0" />
          <input
            type="text"
            placeholder="Rechercher un manuel prescrit, auteur, cours..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-transparent text-sm focus:outline-none text-foreground placeholder:text-foreground-muted min-h-[40px]"
          />
        </div>

        {/* View Toggle (Grille vs Liste) */}
        <ViewToggle mode={viewMode} onChange={setViewMode} className="self-end sm:self-auto" />
      </div>

      {/* 4. SECTION DES MANUELS PRESCRITS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-bold text-navy text-xl flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-gold" />
            Manuels Prescrits à vos Étudiants ({filteredBooks.length})
          </h2>
          <Link href="/teacher/courses" className="text-xs text-navy font-bold hover:underline flex items-center gap-1">
            Gérer mes cours
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
            <div className="bg-background-secondary h-64 rounded-2xl border border-border" />
            <div className="bg-background-secondary h-64 rounded-2xl border border-border" />
            <div className="bg-background-secondary h-64 rounded-2xl border border-border" />
          </div>
        ) : filteredBooks.length === 0 ? (
          <EmptyState>
            <EmptyIcon icon={BookOpen} />
            <EmptyTitle>Aucun manuel prescrit trouvé</EmptyTitle>
            <EmptyDescription>Sélectionnez des manuels dans le catalogue pour les recommander à vos cohortes d&apos;étudiants.</EmptyDescription>
          </EmptyState>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBooks.map((book) => (
              <BookListItem key={book.id} book={book} />
            ))}
          </div>
        )}
      </div>

      {/* 5. SECTION DES DEMANDES DE SPÉCIMENS ENSEIGNANT */}
      <div className="pt-6 border-t border-border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif font-bold text-navy text-xl flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-gold" />
            Mes Demandes de Spécimens Numériques
          </h2>
          <Link href="/teacher/specimens" className="text-xs text-navy font-bold hover:underline flex items-center gap-1">
            Voir tous mes spécimens
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {specimens.length === 0 ? (
          <EmptyState>
            <EmptyIcon icon={BookOpen} />
            <EmptyTitle>Aucune demande de spécimen en cours</EmptyTitle>
            <EmptyDescription>Vous pouvez demander l&apos;accès gratuit d&apos;évaluation aux nouveaux manuels de votre discipline.</EmptyDescription>
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
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
                <div key={spec.id} className="bg-background border border-border p-4 rounded-2xl flex items-center gap-4 shadow-xs">
                  <BookCover book={dummyBook} size="sm" />
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <StatusBadge status={spec.status} />
                    <h3 className="font-serif font-bold text-navy text-sm leading-snug line-clamp-2">
                      {spec.book_title}
                    </h3>
                    <p className="text-[11px] text-foreground-muted truncate">Par {spec.author}</p>
                    <p className="text-[10px] text-foreground-muted flex items-center gap-1 pt-1">
                      <Clock className="w-3 h-3 text-gold" />
                      Demandé le {spec.requested_at}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
