"use client";

import { useEffect, useState } from "react";
import { 
  getTeacherCourses
} from "@/lib/services/teacher";
import { Course } from "@/lib/types/teacher";
import { 
  GraduationCap, 
  Plus, 
  BookOpen, 
  Users, 
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import { BookCover } from "@/components/features/student/book-cover";
import { BookCard } from "@/components/features/student/book-card";
import { BookListItem } from "@/components/features/student/book-list-item";
import { ViewToggle, ViewMode } from "@/components/features/student/view-toggle";
import { EmptyState, EmptyIcon, EmptyTitle, EmptyDescription } from "@/components/ui/empty-state";
import { StudentBookAccess } from "@/lib/types/student";

export default function TeacherCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  useEffect(() => {
    async function loadCourses() {
      try {
        setLoading(true);
        const data = await getTeacherCourses();
        setCourses(data);
      } catch (err) {
        console.error("Erreur lors du chargement des cours", err);
      } finally {
        setLoading(false);
      }
    }
    loadCourses();
  }, []);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full min-w-0">
      {/* Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <Link href="/teacher" className="inline-flex items-center gap-1 text-xs text-navy font-bold hover:underline mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Retour au tableau de bord
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gold">
            <GraduationCap className="w-4 h-4" />
            <span>Gestion des Cours & Cohortes</span>
          </div>
          <h1 className="font-serif text-2xl lg:text-3xl font-bold text-navy">
            Mes Cours & Prescription de Manuels
          </h1>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <ViewToggle mode={viewMode} onChange={setViewMode} />
        </div>
      </div>

      {/* Liste des Cours avec Manuels Prescrits */}
      {loading ? (
        <div className="space-y-6 animate-pulse">
          {Array.from({ length: 2 }).map((_, idx) => (
            <div key={idx} className="h-64 bg-background-secondary rounded-2xl border border-border" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState>
          <EmptyIcon icon={GraduationCap} />
          <EmptyTitle>Aucun cours enregistré</EmptyTitle>
          <EmptyDescription>Créez votre premier cours universitaire pour y associer des manuels de référence.</EmptyDescription>
        </EmptyState>
      ) : (
        <div className="space-y-8">
          {courses.map((course) => (
            <div key={course.id} className="bg-background border border-border rounded-3xl p-5 sm:p-6 space-y-6 shadow-xs">
              {/* Entête du cours */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-navy bg-gold/15 px-2.5 py-0.5 rounded-md border border-gold/30">
                      {course.code}
                    </span>
                    <span className="text-xs text-foreground-muted font-medium bg-background-secondary px-2.5 py-0.5 rounded-md border border-border">
                      {course.level}
                    </span>
                  </div>
                  <h2 className="font-serif font-bold text-navy text-xl sm:text-2xl pt-1">
                    {course.name}
                  </h2>
                </div>

                <div className="flex items-center gap-3 bg-navy-dark text-white p-3 px-4 rounded-2xl border border-navy-hover shrink-0 self-start sm:self-auto">
                  <Users className="w-5 h-5 text-gold shrink-0" />
                  <div>
                    <div className="text-xs font-bold">{course.student_count} Étudiants</div>
                    <p className="text-[10px] text-white/70">Cohorte inscrite UAC</p>
                  </div>
                </div>
              </div>

              {/* Manuels Recommandés pour ce cours */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-navy text-base flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-gold" />
                    Ouvrage(s) de Référence Prescrit(s) ({course.recommended_books.length})
                  </h3>
                </div>

                {course.recommended_books.length === 0 ? (
                  <p className="text-xs text-foreground-muted italic">Aucun manuel prescrit pour ce cours.</p>
                ) : viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {course.recommended_books.map((b) => {
                      const bookAccess: StudentBookAccess = {
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
                        course_code: course.code
                      };
                      return <BookCard key={b.id} book={bookAccess} />;
                    })}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {course.recommended_books.map((b) => {
                      const bookAccess: StudentBookAccess = {
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
                        course_code: course.code
                      };
                      return <BookListItem key={b.id} book={bookAccess} />;
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
