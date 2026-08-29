"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Search, 
  MapPin, 
  BookOpen, 
  ArrowRight, 
  Building2, 
  Sparkles, 
  GraduationCap,
  PenTool,
  CheckCircle2
} from "lucide-react";

interface AuthorItem {
  id: string;
  name: string;
  role: string;
  institution: string;
  country: string;
  countryCode: string;
  speciality: string;
  booksCount: number;
  featuredBook: string;
  avatarUrl?: string;
}

const AUTHORS_DATA: AuthorItem[] = [
  {
    id: "author-1",
    name: "Pr. M. N'Dia",
    role: "Professeur Titulaire de Droit Privé",
    institution: "Université d'Abomey-Calavi",
    country: "Bénin",
    countryCode: "BJ",
    speciality: "Droit des obligations & Droit commercial OHADA",
    booksCount: 4,
    featuredBook: "Droit des obligations : Théorie et Pratique",
  },
  {
    id: "author-2",
    name: "Dr. K. Yao",
    role: "Maître de Conférences en Économie",
    institution: "Université Félix Houphouët-Boigny",
    country: "Côte d'Ivoire",
    countryCode: "CI",
    speciality: "Macroéconomie & Politiques Monétaires UEMOA",
    booksCount: 3,
    featuredBook: "Économie monétaire et financière",
  },
  {
    id: "author-3",
    name: "Pr. E. Traoré",
    role: "Directeur de Recherche en Sciences de Gestion",
    institution: "Université Cheikh Anta Diop",
    country: "Sénégal",
    countryCode: "SN",
    speciality: "Comptabilité Approfondie & Normes SYSCOHADA",
    booksCount: 5,
    featuredBook: "Comptabilité approfondie SYSCOHADA",
  },
  {
    id: "author-4",
    name: "Pr. A. Diallo",
    role: "Doyen Honoraire de Faculté de Droit",
    institution: "Université Gamal Abdel Nasser",
    country: "Guinée",
    countryCode: "GN",
    speciality: "Droit Constitutionnel & Institutions Comparées",
    booksCount: 3,
    featuredBook: "Droit constitutionnel des États d'Afrique",
  },
  {
    id: "author-5",
    name: "Dr. S. Diaby",
    role: "Maître-Assistant en Mathématiques Appliquées",
    institution: "Université de Lomé",
    country: "Togo",
    countryCode: "TG",
    speciality: "Algèbre Linéaire & Optimisation Numérique",
    booksCount: 2,
    featuredBook: "Mathématiques pour l'économie et gestion",
  },
  {
    id: "author-6",
    name: "Pr. J. Kouadio",
    role: "Professeur de Sciences Économiques & Gestion",
    institution: "Université Alassane Ouattara",
    country: "Côte d'Ivoire",
    countryCode: "CI",
    speciality: "Management Stratégique & Gouvernance",
    booksCount: 4,
    featuredBook: "Management stratégique des organisations",
  },
  {
    id: "author-7",
    name: "Pr. A. Kouassi",
    role: "Agrégé des Facultés de Droit",
    institution: "Université Nationale d'Agriculture",
    country: "Bénin",
    countryCode: "BJ",
    speciality: "Droit des Affaires & Droit du Travail",
    booksCount: 6,
    featuredBook: "Droit des affaires : Théorie et Pratique",
  },
  {
    id: "author-8",
    name: "Dr. B. Cissé",
    role: "Chercheur en Sciences de l'Éducation",
    institution: "Université Abdou Moumouni",
    country: "Niger",
    countryCode: "NE",
    speciality: "Pédagogie Universitaire & Didactique",
    booksCount: 2,
    featuredBook: "Didactique et méthodes d'apprentissage",
  }
];

const COUNTRY_FILTERS = [
  { code: "ALL", label: "Tous les pays" },
  { code: "BJ", label: "Bénin" },
  { code: "CI", label: "Côte d'Ivoire" },
  { code: "SN", label: "Sénégal" },
  { code: "TG", label: "Togo" },
  { code: "GN", label: "Guinée" },
  { code: "NE", label: "Niger" }
];

export default function AuthorsPublicPage() {
  const [selectedCountry, setSelectedCountry] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAuthors = useMemo(() => {
    return AUTHORS_DATA.filter((author) => {
      const matchCountry = selectedCountry === "ALL" || author.countryCode === selectedCountry;
      const matchQuery = 
        searchQuery.trim() === "" ||
        author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        author.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        author.speciality.toLowerCase().includes(searchQuery.toLowerCase()) ||
        author.institution.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCountry && matchQuery;
    });
  }, [selectedCountry, searchQuery]);

  return (
    <div className="min-h-screen bg-background text-foreground py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-12">
        
        {/* Header Centré */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 text-navy border border-gold/20 text-xs font-bold uppercase tracking-wider">
            <GraduationCap className="w-3.5 h-3.5 text-gold" />
            Corps Professoral &amp; Chercheurs
          </div>
          
          <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-navy">
            Nos Auteurs &amp; Experts
          </h1>
          
          <p className="text-sm sm:text-base text-foreground-muted leading-relaxed">
            Rencontrez les enseignants-chercheurs et professeurs d'Afrique francophone qui enrichissent la bibliothèque numérique LAHAThèque de leurs traités et manuels de référence.
          </p>
        </div>

        {/* Filtres par Pays & Barre de Recherche */}
        <div className="space-y-6 max-w-4xl mx-auto">
          
          {/* Pills Pays */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {COUNTRY_FILTERS.map((f) => (
              <button
                key={f.code}
                onClick={() => setSelectedCountry(f.code)}
                className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 cursor-pointer ${
                  selectedCountry === f.code
                    ? "bg-gold text-white shadow-md ring-2 ring-gold/40"
                    : "bg-background-secondary border border-border text-foreground hover:border-gold hover:text-navy"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Input Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="w-4 h-4 text-foreground-muted absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, spécialité, institution..."
              className="w-full pl-11 pr-4 py-3 rounded-full border border-border bg-background focus:outline-none focus:border-navy focus:ring-2 focus:ring-gold/30 text-xs sm:text-sm shadow-sm transition-all"
            />
          </div>

        </div>

        {/* Grille des Cartes Auteurs */}
        {filteredAuthors.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
            {filteredAuthors.map((author) => (
              <article
                key={author.id}
                className="bg-background-secondary rounded-3xl border border-border p-6 flex flex-col justify-between space-y-6 hover:border-gold hover:shadow-lg transition-all duration-300 group"
              >
                <div className="space-y-4 flex flex-col items-center text-center">
                  
                  {/* Avatar / Portrait stylisé */}
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-background border-2 border-border/80 shadow-md flex items-center justify-center group-hover:border-gold transition-colors">
                    <div className="w-full h-full bg-gradient-to-br from-navy/10 to-gold/10 flex items-center justify-center text-navy font-serif font-bold text-xl">
                      {author.name.split(" ").map(n => n[0]).join("")}
                    </div>
                  </div>

                  {/* Informations */}
                  <div className="space-y-1.5 w-full">
                    <h2 className="font-serif font-bold text-navy text-lg group-hover:text-gold transition-colors">
                      {author.name}
                    </h2>
                    
                    <p className="text-[11px] font-bold uppercase tracking-wider text-gold">
                      {author.role}
                    </p>

                    <div className="flex items-center justify-center gap-1.5 text-xs text-foreground-muted pt-1">
                      <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                      <span>{author.institution}</span>
                    </div>

                    <p className="text-xs text-foreground-muted/80 line-clamp-2 pt-2">
                      {author.speciality}
                    </p>
                  </div>
                </div>

                {/* Footer Carte */}
                <div className="space-y-3 pt-4 border-t border-border w-full">
                  <div className="flex items-center justify-between text-[11px] text-foreground-muted">
                    <span className="flex items-center gap-1 font-medium">
                      <BookOpen className="w-3.5 h-3.5 text-gold" />
                      {author.booksCount} {author.booksCount > 1 ? "ouvrages" : "ouvrage"}
                    </span>
                    <span className="font-semibold text-navy bg-background px-2 py-0.5 rounded border border-border">
                      {author.country}
                    </span>
                  </div>

                  <Link
                    href={`/catalog?author=${encodeURIComponent(author.name)}`}
                    className="w-full py-2.5 rounded-xl bg-background border border-border group-hover:bg-navy group-hover:text-white group-hover:border-navy text-navy text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    Voir les ouvrages
                    <ArrowRight className="w-3.5 h-3.5 text-gold group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-background-secondary rounded-3xl border border-border p-8 max-w-xl mx-auto space-y-4">
            <GraduationCap className="w-12 h-12 text-gold mx-auto opacity-70" />
            <h3 className="font-serif font-bold text-navy text-lg">Aucun auteur trouvé</h3>
            <p className="text-xs text-foreground-muted">
              Aucun enseignant ou chercheur ne correspond à vos critères de recherche.
            </p>
            <button
              onClick={() => { setSelectedCountry("ALL"); setSearchQuery(""); }}
              className="px-6 py-2 rounded-full bg-navy text-white text-xs font-bold hover:bg-navy-hover transition-colors"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {/* Section Bento : Devenir Auteur Partenaire */}
        <section className="bg-background-secondary rounded-3xl border border-border p-8 sm:p-12 mt-16 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy/5 text-navy text-xs font-bold uppercase tracking-wider border border-gold/20">
              <PenTool className="w-3.5 h-3.5 text-gold" />
              Édition &amp; Publication
            </div>
            
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
              Vous êtes enseignant-chercheur ou auteur académique ?
            </h2>
            
            <p className="text-xs sm:text-sm text-foreground-muted leading-relaxed">
              Publiez votre manuel, traité ou thèse d'excellence sur LAHAThèque. Bénéficiez d'une protection DRM certifiée, d'une diffusion dans plus de 160 institutions partenaires et de redevances transparentes.
            </p>

            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-foreground-muted">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                <span>Revue par un comité scientifique</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                <span>Protection contre le piratage</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                <span>Redevances payées semestriellement</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                <span>Diffusion panafricaine &amp; internationale</span>
              </li>
            </ul>
          </div>

          <div className="md:col-span-4 flex flex-col gap-3 justify-center">
            <Link
              href="/submit"
              className="bg-gold hover:bg-gold-dark text-white px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 shadow-md text-center"
            >
              Déposer un manuscrit
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/contact"
              className="bg-background border border-border hover:border-gold text-foreground hover:text-navy px-6 py-3.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex items-center justify-center gap-2 text-center"
            >
              Contacter l'équipe éditoriale
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
