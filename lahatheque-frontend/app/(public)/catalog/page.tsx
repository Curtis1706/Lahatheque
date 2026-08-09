"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Search, 
  BookOpen, 
  Building2, 
  GraduationCap, 
  Globe, 
  FileText, 
  Headphones, 
  Filter, 
  X,
  Sparkles
} from "lucide-react";

interface Ouvrage {
  id: string;
  isbn: string;
  title: string;
  subtitle?: string;
  authors_details?: Array<{ first_name: string; last_name: string }>;
  discipline_detail?: { id: number; name: string };
  publisher_name?: string;
  institution_name?: string;
  format_type: "pdf" | "epub" | "audio";
  language: string;
  country: string;
  summary?: string;
}

export default function CatalogSearchPage() {
  const [books, setBooks] = useState<Ouvrage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDiscipline, setSelectedDiscipline] = useState("");
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedFormat, setSelectedFormat] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Mock data for initial demonstration if API is unreachable
  const mockBooks: Ouvrage[] = [
    {
      id: "1",
      isbn: "978-2-84299-123-4",
      title: "Droit Constitutionnel des États d'Afrique Francophone",
      subtitle: "Principes généraux et évolutions démocratiques",
      authors_details: [{ first_name: "Jean-Marc", last_name: "Agossou" }],
      discipline_detail: { id: 1, name: "Droit & Sciences Politiques" },
      publisher_name: "LAHA Éditions",
      institution_name: "Université d'Abomey-Calavi (UAC)",
      format_type: "pdf",
      language: "fr",
      country: "BJ",
      summary: "Ouvrage de référence analysant les évolutions constitutionnelles récentes et l'organisation des pouvoirs publics en Afrique subsaharienne."
    },
    {
      id: "2",
      isbn: "978-2-84299-567-8",
      title: "Économie du Développement et Politiques Publiques",
      subtitle: "Modèles d'industrialisation et intégration régionale",
      authors_details: [{ first_name: "Amina", last_name: "Diallo" }],
      discipline_detail: { id: 2, name: "Économie & Gestion" },
      publisher_name: "Presses Universitaires du Sénégal",
      institution_name: "Université Cheikh Anta Diop (UCAD)",
      format_type: "epub",
      language: "fr",
      country: "SN",
      summary: "Une étude empirique rigoureuse sur les moteurs de la croissance inclusive et le financement des infrastructures en Afrique de l'Ouest."
    },
    {
      id: "3",
      isbn: "978-2-84299-901-2",
      title: "Précis de Pathologie Médicale et Thérapeutique",
      subtitle: "Guide clinique à l'usage des étudiants en médecine",
      authors_details: [{ first_name: "Koffi", last_name: "Mensah" }],
      discipline_detail: { id: 3, name: "Médecine & Santé" },
      publisher_name: "LAHA Éditions",
      institution_name: "Université de Lomé",
      format_type: "audio",
      language: "fr",
      country: "TG",
      summary: "Synthèse clinique des pathologies tropicales et chroniques avec recommandations thalassémiques et schémas thérapeutiques."
    }
  ];

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.append("q", searchQuery);
        if (selectedDiscipline) params.append("discipline", selectedDiscipline);
        if (selectedInstitution) params.append("institution", selectedInstitution);
        if (selectedLanguage) params.append("language", selectedLanguage);
        if (selectedCountry) params.append("country", selectedCountry);
        if (selectedFormat) params.append("format", selectedFormat);

        const res = await fetch(`http://localhost:8000/api/v1/catalog/books/?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setBooks(data.results || data);
        } else {
          setBooks(mockBooks);
        }
      } catch {
        setBooks(mockBooks);
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, [searchQuery, selectedDiscipline, selectedInstitution, selectedLanguage, selectedCountry, selectedFormat]);

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedDiscipline("");
    setSelectedInstitution("");
    setSelectedLanguage("");
    setSelectedCountry("");
    setSelectedFormat("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* En-tête de section */}
        <div className="space-y-4 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-light text-navy text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            Bibliothèque Universitaire Numérique
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-navy tracking-tight">
            Catalogue des Ouvrages
          </h1>
          <p className="text-sm sm:text-base text-foreground-muted max-w-3xl">
            Explorez les manuels académiques, thèses et revues scientifiques classés par universités, disciplines et pays d'Afrique francophone.
          </p>
        </div>

        {/* Barre de Recherche Principale */}
        <div className="relative max-w-4xl mx-auto md:mx-0">
          <div className="relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-foreground-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par titre, auteur, résumé (PostgreSQL Full-Text)..."
              className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-border bg-background-secondary text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-navy focus:border-transparent transition-all shadow-sm text-sm sm:text-base"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-4 text-foreground-muted hover:text-navy p-1"
                aria-label="Effacer la recherche"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Bouton Filtre Mobile */}
        <div className="md:hidden flex justify-between items-center">
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-background-secondary text-navy font-medium text-sm w-full justify-center"
          >
            <Filter className="w-4 h-4" />
            Filtres et Classification
          </button>
        </div>

        {/* Grille principale Layout (Filtres + Résultats) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Panneau de Filtres (Sidebar) */}
          <aside className={`md:block space-y-6 bg-background-secondary p-6 rounded-2xl border border-border h-fit ${showMobileFilters ? "block" : "hidden"}`}>
            <div className="flex items-center justify-between border-b border-border pb-4">
              <h2 className="font-serif font-bold text-navy text-lg flex items-center gap-2">
                <Filter className="w-4 h-4 text-gold" />
                Classification
              </h2>
              {(selectedDiscipline || selectedInstitution || selectedLanguage || selectedCountry || selectedFormat || searchQuery) && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-gold hover:text-gold-dark font-medium underline"
                >
                  Réinitialiser
                </button>
              )}
            </div>

            {/* Filtre Université (Hiérarchie Cahier des Charges) */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-gold" />
                Université / Établissement
              </label>
              <select
                value={selectedInstitution}
                onChange={(e) => setSelectedInstitution(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none"
              >
                <option value="">Toutes les universités</option>
                <option value="1">Université d'Abomey-Calavi (UAC)</option>
                <option value="2">Université Cheikh Anta Diop (UCAD)</option>
                <option value="3">Université de Lomé</option>
                <option value="4">Université Felix Houphouët-Boigny</option>
              </select>
            </div>

            {/* Filtre Discipline */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-gold" />
                Discipline Académique
              </label>
              <select
                value={selectedDiscipline}
                onChange={(e) => setSelectedDiscipline(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none"
              >
                <option value="">Toutes les disciplines</option>
                <option value="1">Droit & Sciences Politiques</option>
                <option value="2">Économie & Gestion</option>
                <option value="3">Médecine & Santé</option>
                <option value="4">Lettres, Langues & Arts</option>
                <option value="5">Sciences & Technologies</option>
              </select>
            </div>

            {/* Filtre Format */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-gold" />
                Format de Diffusion
              </label>
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none"
              >
                <option value="">Tous les formats</option>
                <option value="pdf">Livre Numérique (PDF)</option>
                <option value="epub">Livre Numérique (EPUB)</option>
                <option value="audio">Livre Audio (MP3/HLS)</option>
              </select>
            </div>

            {/* Filtre Pays */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-gold" />
                Pays de Rattachement
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full p-2.5 rounded-lg border border-border bg-background text-foreground text-xs sm:text-sm focus:ring-2 focus:ring-navy focus:outline-none"
              >
                <option value="">Tous les pays</option>
                <option value="BJ">Bénin (BJ)</option>
                <option value="SN">Sénégal (SN)</option>
                <option value="TG">Togo (TG)</option>
                <option value="CI">Côte d'Ivoire (CI)</option>
              </select>
            </div>
          </aside>

          {/* Liste des Ouvrages */}
          <main className="md:col-span-3 space-y-6">
            
            {/* Squelette de Chargement */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="animate-pulse bg-background-secondary rounded-2xl p-4 border border-border space-y-4">
                    <div className="h-48 bg-border/50 rounded-xl"></div>
                    <div className="h-4 bg-border/50 rounded w-3/4"></div>
                    <div className="h-3 bg-border/50 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : books.length === 0 ? (
              
              /* État Vide */
              <div className="text-center py-16 px-4 bg-background-secondary rounded-2xl border border-border space-y-4">
                <BookOpen className="w-12 h-12 text-gold mx-auto" />
                <h3 className="text-lg font-serif font-bold text-navy">Aucun ouvrage trouvé</h3>
                <p className="text-xs sm:text-sm text-foreground-muted max-w-md mx-auto">
                  Aucun résultat ne correspond à vos critères actuels. Essayez de réinitialiser les filtres ou de modifier votre recherche.
                </p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 rounded-xl bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors"
                >
                  Réinitialiser la recherche
                </button>
              </div>
            ) : (

              /* Grille de Cartes d'Ouvrages */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {books.map((book) => (
                  <article
                    key={book.id}
                    className="group bg-background-secondary rounded-2xl border border-border overflow-hidden flex flex-col hover:border-gold transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    {/* Fausse Couverture 3D Stylisée */}
                    <div className="p-6 bg-navy-dark text-white relative flex items-center justify-center min-h-[200px]">
                      <div className="text-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mx-auto text-gold">
                          {book.format_type === "audio" ? (
                            <Headphones className="w-6 h-6" />
                          ) : (
                            <FileText className="w-6 h-6" />
                          )}
                        </div>
                        <h4 className="font-serif font-bold text-xs line-clamp-2 px-2 text-white/90">
                          {book.title}
                        </h4>
                      </div>
                      
                      {/* Badge Format */}
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-navy text-gold text-[10px] font-bold uppercase tracking-wider border border-gold/30">
                        {book.format_type}
                      </span>
                    </div>

                    {/* Infos Ouvrage */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        {book.discipline_detail && (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gold block">
                            {book.discipline_detail.name}
                          </span>
                        )}
                        <h3 className="font-serif font-bold text-navy text-base leading-snug line-clamp-2 group-hover:text-gold transition-colors">
                          <Link href={`/catalog/${book.id}`}>
                            {book.title}
                          </Link>
                        </h3>
                        {book.authors_details && book.authors_details.length > 0 && (
                          <p className="text-xs text-foreground-muted font-medium">
                            Par {book.authors_details.map(a => `${a.first_name} ${a.last_name}`).join(", ")}
                          </p>
                        )}
                        {book.institution_name && (
                          <p className="text-[11px] text-navy font-semibold flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-gold" />
                            {book.institution_name}
                          </p>
                        )}
                      </div>

                      {/* CTA */}
                      <div className="pt-3 border-t border-border flex items-center justify-between">
                        <span className="text-xs font-bold text-gold">
                          Accès Institutionnel
                        </span>
                        <Link
                          href={`/catalog/${book.id}`}
                          className="px-3.5 py-1.5 rounded-lg bg-navy text-white text-xs font-semibold hover:bg-navy-hover transition-colors"
                        >
                          Consulter
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </main>
        </div>

      </div>
    </div>
  );
}
