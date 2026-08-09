import { StudentBookAccess, StudentReadingHistory, StudentStudyStats } from "../types/student";

export const mockBorrowedBooks: StudentBookAccess[] = [
  {
    id: "book-001",
    title: "Droit Constitutionnel des États d'Afrique Francophone",
    author: "Prof. Jean-Marc Agossou",
    discipline: "Droit & Sciences Politiques",
    institution: "Université d'Abomey-Calavi (UAC)",
    format: "PDF",
    cover_bg: "bg-navy-dark",
    cover_color: "text-gold",
    cover_pattern: "scales",
    progress_percent: 68,
    last_read_chapter: "Chapitre 4 : La Séparation des Pouvoirs et Régimes Politiques",
    last_read_at: "Aujourd'hui à 14:30",
    expiresInDays: 14,
    isbn: "978-2-84299-101-2",
    edition_year: 2024,
    page_count: 430,
    is_favorite: true,
    is_recommended: true,
    course_code: "DRO101",
    course_name: "Droit Constitutionnel I"
  },
  {
    id: "book-002",
    title: "Économie du Développement et Politiques Publiques en Afrique",
    author: "Dr. Amina Diallo",
    discipline: "Économie & Gestion",
    institution: "Université Cheikh Anta Diop (UCAD)",
    format: "EPUB",
    cover_bg: "bg-emerald-950",
    cover_color: "text-emerald-300",
    cover_pattern: "grid",
    progress_percent: 32,
    last_read_chapter: "Chapitre 2 : Modèles Macroéconomiques Régionaux",
    last_read_at: "Hier à 18:15",
    expiresInDays: 28,
    isbn: "978-2-84299-204-5",
    edition_year: 2023,
    page_count: 310,
    is_favorite: false,
    is_recommended: true,
    course_code: "ECO202",
    course_name: "Économie du Développement"
  },
  {
    id: "book-003",
    title: "Introduction à la Cybersécurité et Protection des Données",
    author: "Prof. Kossi Mensah",
    discipline: "Informatique & Technologies",
    institution: "Université de Lomé (UL)",
    format: "PDF",
    cover_bg: "bg-slate-900",
    cover_color: "text-cyan-400",
    cover_pattern: "dots",
    progress_percent: 85,
    last_read_chapter: "Chapitre 7 : Cryptographie et Normes ISO 27001",
    last_read_at: "Il y a 3 jours",
    expiresInDays: 7,
    isbn: "978-2-84299-309-8",
    edition_year: 2024,
    page_count: 280,
    is_favorite: true,
    is_recommended: false
  },
  {
    id: "book-004",
    title: "Méthodologie de la Recherche en Sciences Sociales",
    author: "Dr. Chantal Adjanohoun",
    discipline: "Sociologie & Philosophie",
    institution: "Université d'Abomey-Calavi (UAC)",
    format: "EPUB",
    cover_bg: "bg-amber-950",
    cover_color: "text-amber-300",
    cover_pattern: "waves",
    progress_percent: 15,
    last_read_chapter: "Chapitre 1 : Formuler une Problématique",
    last_read_at: "Il y a 5 jours",
    expiresInDays: 21,
    isbn: "978-2-84299-412-1",
    edition_year: 2022,
    page_count: 245,
    is_favorite: false,
    is_recommended: true,
    course_code: "SOC105",
    course_name: "Méthodologie Universitaire"
  }
];

export const mockFavoriteBooks: StudentBookAccess[] = [
  mockBorrowedBooks[0],
  mockBorrowedBooks[2],
  {
    id: "book-005",
    title: "Précis de Droit des Obligations et des Contrats",
    author: "Prof. Yao Kouassi",
    discipline: "Droit & Sciences Politiques",
    institution: "Université Félix Houphouët-Boigny",
    format: "Audio",
    cover_bg: "bg-purple-950",
    cover_color: "text-purple-300",
    cover_pattern: "scales",
    progress_percent: 40,
    isbn: "978-2-84299-550-9",
    edition_year: 2023,
    page_count: 520,
    is_favorite: true
  }
];

export const mockReadingHistory: StudentReadingHistory[] = [
  {
    id: "hist-01",
    book_id: "book-001",
    book_title: "Droit Constitutionnel des États d'Afrique Francophone",
    chapter_title: "Chapitre 4 : La Séparation des Pouvoirs",
    read_at: "Aujourd'hui à 14:30",
    notes_count: 3
  },
  {
    id: "hist-02",
    book_id: "book-002",
    book_title: "Économie du Développement et Politiques Publiques en Afrique",
    chapter_title: "Chapitre 2 : Modèles Macroéconomiques",
    read_at: "Hier à 18:15",
    notes_count: 1
  },
  {
    id: "hist-03",
    book_id: "book-003",
    book_title: "Introduction à la Cybersécurité et Protection des Données",
    chapter_title: "Chapitre 7 : Cryptographie",
    read_at: "Il y a 3 jours",
    notes_count: 5
  }
];

export const mockStudyStats: StudentStudyStats = {
  weekly_hours: 18.5,
  daily_activity: [
    { day: "Lun", hours: 2.5 },
    { day: "Mar", hours: 4.0 },
    { day: "Mer", hours: 1.5 },
    { day: "Jeu", hours: 3.5 },
    { day: "Ven", hours: 4.5 },
    { day: "Sam", hours: 2.0 },
    { day: "Dim", hours: 0.5 },
  ],
  overall_progress: 64,
  discipline_breakdown: [
    { name: "Droit", percentage: 50, color: "bg-navy" },
    { name: "Économie", percentage: 30, color: "bg-emerald-700" },
    { name: "Informatique", percentage: 20, color: "bg-cyan-700" },
  ],
  current_streak_days: 12,
};


