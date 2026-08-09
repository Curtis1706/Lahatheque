"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  GraduationCap, 
  BookOpen, 
  Bookmark, 
  Clock, 
  Building2, 
  FileText, 
  ArrowUpRight, 
  Sparkles,
  Search,
  CheckCircle2
} from "lucide-react";

export default function StudentDashboardPage() {
  const [activeTab, setActiveTab] = useState<"borrowed" | "favorites">("borrowed");

  // Mock de données d'emprunts et de favoris pour la démonstration Student Dashboard
  const borrowedBooks = [
    {
      id: "1",
      title: "Droit Constitutionnel des États d'Afrique Francophone",
      author: "Prof. Jean-Marc Agossou",
      discipline: "Droit & Sciences Politiques",
      institution: "Université d'Abomey-Calavi (UAC)",
      expiresInDays: 14,
      format: "PDF",
    },
    {
      id: "2",
      title: "Économie du Développement et Politiques Publiques",
      author: "Dr. Amina Diallo",
      discipline: "Économie & Gestion",
      institution: "Université Cheikh Anta Diop (UCAD)",
      expiresInDays: 28,
      format: "EPUB",
    }
  ];

  const favoriteBooks = [
    {
      id: "3",
      title: "Précis de Pathologie Médicale et Thérapeutique",
      author: "Dr. Koffi Mensah",
      discipline: "Médecine & Santé",
      institution: "Université de Lomé",
      format: "Audio",
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Banner Welcome Student */}
        <div className="bg-navy-dark text-white rounded-3xl p-6 sm:p-8 border border-navy/30 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-2 z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy text-gold text-xs font-bold uppercase tracking-wider border border-gold/20">
              <GraduationCap className="w-3.5 h-3.5" />
              Espace Étudiant • Licence Droit
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold">
              Bienvenue sur votre portail d'étude
            </h1>
            <p className="text-xs sm:text-sm text-white/80 max-w-xl">
              Consultez vos manuels universitaires souscrits, gérez vos favoris et accédez au lecteur numérique protégé.
            </p>
          </div>

          <div className="bg-navy/80 p-4 rounded-2xl border border-gold/20 space-y-2 text-xs z-10 w-full md:w-auto">
            <div className="flex items-center gap-2 text-gold font-bold">
              <Building2 className="w-4 h-4" />
              Université d'Abomey-Calavi (UAC)
            </div>
            <div className="flex items-center gap-2 text-white/90">
              <CheckCircle2 className="w-3.5 h-3.5 text-success" />
              Matricule : 1029384-UAC (Validé)
            </div>
          </div>
        </div>

        {/* Statistiques Rapides */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-background-secondary p-5 rounded-2xl border border-border flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-navy-light flex items-center justify-center text-navy">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-serif font-bold text-navy">2</span>
              <span className="block text-xs font-semibold text-foreground-muted uppercase tracking-wider">Ouvrages Actifs</span>
            </div>
          </div>

          <div className="bg-background-secondary p-5 rounded-2xl border border-border flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center text-gold-dark">
              <Bookmark className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-serif font-bold text-navy">1</span>
              <span className="block text-xs font-semibold text-foreground-muted uppercase tracking-wider">Favoris Enregistrés</span>
            </div>
          </div>

          <div className="bg-background-secondary p-5 rounded-2xl border border-border flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-navy-light flex items-center justify-center text-navy">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-2xl font-serif font-bold text-navy">14 Jours</span>
              <span className="block text-xs font-semibold text-foreground-muted uppercase tracking-wider">Prochaine Échéance</span>
            </div>
          </div>
        </div>

        {/* Onglets Emprunts / Favoris */}
        <div className="space-y-6">
          <div className="flex border-b border-border gap-6">
            <button
              onClick={() => setActiveTab("borrowed")}
              className={`pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === "borrowed"
                  ? "border-gold text-navy"
                  : "border-transparent text-foreground-muted hover:text-navy"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Mes Emprunts & Accès ({borrowedBooks.length})
            </button>

            <button
              onClick={() => setActiveTab("favorites")}
              className={`pb-3 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === "favorites"
                  ? "border-gold text-navy"
                  : "border-transparent text-foreground-muted hover:text-navy"
              }`}
            >
              <Bookmark className="w-4 h-4" />
              Mes Favoris ({favoriteBooks.length})
            </button>
          </div>

          {/* Contenu Emprunts */}
          {activeTab === "borrowed" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {borrowedBooks.map((book) => (
                <div key={book.id} className="bg-background-secondary p-6 rounded-2xl border border-border space-y-4 flex flex-col justify-between hover:border-gold transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                        {book.discipline}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-navy-light text-navy">
                        {book.format}
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-navy text-lg leading-snug">
                      {book.title}
                    </h3>
                    <p className="text-xs text-foreground-muted font-medium">
                      {book.author}
                    </p>
                    <p className="text-xs text-navy font-semibold flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-gold" />
                      {book.institution}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-foreground-muted flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gold" />
                      Valide encore {book.expiresInDays} jours
                    </span>
                    <Link
                      href={`/catalog/reader/${book.id}`}
                      className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-1.5"
                    >
                      Lire maintenant
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Contenu Favoris */}
          {activeTab === "favorites" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {favoriteBooks.map((book) => (
                <div key={book.id} className="bg-background-secondary p-6 rounded-2xl border border-border space-y-4 flex flex-col justify-between hover:border-gold transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gold">
                        {book.discipline}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-navy-light text-navy">
                        {book.format}
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-navy text-lg leading-snug">
                      {book.title}
                    </h3>
                    <p className="text-xs text-foreground-muted font-medium">
                      {book.author}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-border flex items-center justify-between text-xs">
                    <Link
                      href={`/catalog/${book.id}`}
                      className="text-gold font-bold hover:underline"
                    >
                      Voir la notice
                    </Link>
                    <Link
                      href={`/catalog/reader/${book.id}`}
                      className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors flex items-center gap-1.5"
                    >
                      Consulter l'extrait
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
