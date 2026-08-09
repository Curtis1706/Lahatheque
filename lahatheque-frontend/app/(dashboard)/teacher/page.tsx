"use client";

import { useEffect, useState } from "react";
import { getTeacherCourses, getSpecimenRequests } from "@/lib/services/teacher";
import { Course, SpecimenRequest } from "@/lib/types/teacher";
import { 
  GraduationCap, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Building2, 
  FileText,
  Bookmark,
  ArrowRight,
  User,
  ExternalLink,
  Calendar
} from "lucide-react";
import Link from "next/link";
import { KpiGrid } from "@/components/ui/kpi-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, EmptyIcon, EmptyTitle, EmptyDescription } from "@/components/ui/empty-state";

export default function TeacherDashboardPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [specimens, setSpecimens] = useState<SpecimenRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeacherData() {
      try {
        setLoading(true);
        const [coursesData, specimensData] = await Promise.all([
          getTeacherCourses(),
          getSpecimenRequests()
        ]);
        setCourses(coursesData);
        setSpecimens(specimensData.slice(0, 3)); // afficher seulement les 3 plus récents
      } catch (err) {
        console.error("Erreur de chargement des données enseignant", err);
      } finally {
        setLoading(false);
      }
    }
    loadTeacherData();
  }, []);



  return (
    <div className="p-6 lg:p-8 space-y-8">
      
      {/* Banner */}
      <div className="bg-navy-dark text-white rounded-3xl p-6 sm:p-8 border border-navy/30 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy text-gold text-xs font-bold uppercase tracking-wider border border-gold/20">
            <User className="w-3.5 h-3.5" />
            Espace Enseignant-Chercheur
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold">
            Bonjour, Pr. Marc SOW
          </h1>
          <p className="text-xs sm:text-sm text-white/80 max-w-xl">
            Recommandez des manuels pour vos cours, accédez aux spécimens numériques d'évaluation et gérez les lectures de vos cohortes d'étudiants.
          </p>
        </div>

        <div className="bg-navy/80 p-4 rounded-2xl border border-gold/20 space-y-2 text-xs z-10 w-full md:w-auto">
          <div className="flex items-center gap-2 text-gold font-bold">
            <Building2 className="w-4 h-4" />
            Université d'Abomey-Calavi (UAC)
          </div>
          <div className="flex items-center gap-2 text-success font-bold">
            <CheckCircle className="w-3.5 h-3.5 text-success" />
            Vérification de statut : Approuvé
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-background border border-border p-5 rounded-2xl animate-pulse space-y-3 h-36">
              <div className="w-10 h-10 rounded-xl bg-background-secondary" />
              <div className="h-7 w-20 bg-background-secondary rounded" />
              <div className="h-3.5 w-28 bg-background-secondary rounded" />
            </div>
          ))}
        </div>
      ) : (
        <KpiGrid
          cols={3}
          cards={[
            {
              label: "Cours actifs",
              value: courses.length,
              formatValue: (v) => `${v} cours`,
              icon: GraduationCap,
              trend: 0,
              sparkline: [50, 50, 60, 55, 65, 65, 70],
            },
            {
              label: "Ouvrages recommandés",
              value: courses.reduce((sum, c) => sum + c.recommended_books.length, 0),
              icon: Bookmark,
              trend: 10,
              sparkline: [30, 40, 45, 55, 60, 65, 75],
            },
            {
              label: "Spécimens demandés",
              value: specimens.length,
              formatValue: (v) => `${v} demandes`,
              icon: FileText,
              trend: 3,
              sparkline: [20, 25, 30, 28, 35, 40, 45],
            },
          ]}
        />
      )}

      {/* Grid: Resume of Courses & Specimens */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left: Courses list overview */}
        <div className="lg:col-span-7 bg-background border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-navy">Cours & Recommandations récents</h3>
            <Link 
              href="/teacher/courses" 
              className="text-xs text-gold hover:text-gold-dark font-bold flex items-center gap-1"
            >
              Gérer tout
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-6 space-y-4 animate-pulse">
              <div className="h-10 bg-background-secondary rounded" />
              <div className="h-12 bg-background-secondary rounded" />
            </div>
          ) : courses.length === 0 ? (
            <EmptyState className="py-8">
              <EmptyIcon icon={GraduationCap} />
              <EmptyTitle>Aucun cours actif</EmptyTitle>
              <EmptyDescription>Vos cours apparaîtront ici une fois ajoutés.</EmptyDescription>
            </EmptyState>
          ) : (
            <div className="divide-y divide-border/40">
              {courses.slice(0, 3).map((course) => (
                <div key={course.id} className="p-5 space-y-2 hover:bg-background-secondary/20 transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-navy-light text-navy">{course.code}</span>
                    <span className="text-xs text-foreground-muted">{course.student_count} étudiants</span>
                  </div>
                  <h4 className="font-serif font-bold text-navy text-sm">{course.name}</h4>
                  <p className="text-xs text-foreground-muted">
                    {course.recommended_books.length} ouvrage(s) recommandé(s) pour ce cours.
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Specimens list overview */}
        <div className="lg:col-span-5 bg-background border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h3 className="font-serif text-base font-bold text-navy">Dernières demandes</h3>
            <Link 
              href="/teacher/specimens" 
              className="text-xs text-gold hover:text-gold-dark font-bold flex items-center gap-1"
            >
              Voir tout
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-6 space-y-4 animate-pulse">
              <div className="h-10 bg-background-secondary rounded" />
              <div className="h-12 bg-background-secondary rounded" />
            </div>
          ) : specimens.length === 0 ? (
            <EmptyState className="py-8">
              <EmptyIcon icon={FileText} />
              <EmptyTitle>Aucune demande active</EmptyTitle>
              <EmptyDescription>Vos demandes de spécimens apparaîtront ici.</EmptyDescription>
            </EmptyState>
          ) : (
            <div className="divide-y divide-border/40">
              {specimens.map((spec) => (
                <div key={spec.id} className="p-4 space-y-2 hover:bg-background-secondary/20 transition-colors">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-navy text-xs truncate max-w-[180px]">{spec.book_title}</p>
                    <StatusBadge status={spec.status} />
                  </div>
                  <p className="text-[10px] text-foreground-muted flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Demandé le {new Date(spec.requested_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
