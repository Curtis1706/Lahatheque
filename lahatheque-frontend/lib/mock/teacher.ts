import { Course, SpecimenRequest, PrescribedBook, TeacherStats } from "../types/teacher";

export const mockPrescribedBooks: PrescribedBook[] = [
  {
    id: "book-001",
    title: "Droit Constitutionnel des États d'Afrique Francophone",
    author: "Prof. Jean-Marc Agossou",
    discipline: "Droit & Sciences Politiques",
    institution: "Université d'Abomey-Calavi (UAC)",
    format: "PDF",
    cover_bg: "bg-navy-dark",
    cover_color: "text-gold",
    isbn: "978-2-84299-101-2",
    edition_year: 2024,
    page_count: 430,
    active_readers_count: 142,
    avg_progress_percent: 68
  },
  {
    id: "book-002",
    title: "Économie du Développement et Politiques Publiques",
    author: "Dr. Amina Diallo",
    discipline: "Économie & Gestion",
    institution: "Université Cheikh Anta Diop (UCAD)",
    format: "EPUB",
    cover_bg: "bg-emerald-950",
    cover_color: "text-emerald-300",
    isbn: "978-2-84299-204-5",
    edition_year: 2023,
    page_count: 310,
    active_readers_count: 98,
    avg_progress_percent: 45
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
    isbn: "978-2-84299-309-8",
    edition_year: 2024,
    page_count: 280,
    active_readers_count: 85,
    avg_progress_percent: 78
  }
];

export const mockTeacherCourses: Course[] = [
  {
    id: "course-101",
    name: "Droit Constitutionnel I & II",
    code: "DRO101",
    student_count: 165,
    level: "Licence 1 Droit",
    recommended_books: [mockPrescribedBooks[0]]
  },
  {
    id: "course-202",
    name: "Économie & Politiques Générales",
    code: "ECO202",
    student_count: 110,
    level: "Licence 2 Économie",
    recommended_books: [mockPrescribedBooks[1]]
  },
  {
    id: "course-303",
    name: "Sécurité des Systèmes d'Information",
    code: "INF303",
    student_count: 90,
    level: "Licence 3 Informatique",
    recommended_books: [mockPrescribedBooks[2]]
  }
];

export const mockSpecimenRequests: SpecimenRequest[] = [
  {
    id: "spec-001",
    book_title: "Traité de Droit Administratif Comparé en Afrique",
    book_id: "book-109",
    author: "Prof. Mathieu Adjovi",
    discipline: "Droit & Sciences Politiques",
    requested_at: "10 mai 2026",
    status: "approved",
    reason: "Évaluation pour le cours DRO204 de Licence 2",
    cover_bg: "bg-navy-dark",
    cover_color: "text-gold"
  },
  {
    id: "spec-002",
    book_title: "Analyse Macroéconomique Approfondie",
    book_id: "book-210",
    author: "Dr. Bakary Traoré",
    discipline: "Économie & Gestion",
    requested_at: "02 mai 2026",
    status: "pending",
    reason: "Revue en vue de prescription pour le Master 1",
    cover_bg: "bg-emerald-950",
    cover_color: "text-emerald-300"
  },
  {
    id: "spec-003",
    book_title: "Algorithmique & Structures de Données Avancées",
    book_id: "book-311",
    author: "Prof. Fatou Sow",
    discipline: "Informatique & Technologies",
    requested_at: "24 avril 2026",
    status: "approved",
    reason: "Spécimen enseignant validé",
    cover_bg: "bg-slate-900",
    cover_color: "text-cyan-400"
  }
];

export const mockTeacherStats: TeacherStats = {
  total_students: 365,
  prescribed_books_count: 3,
  approved_specimens_count: 2,
  weekly_student_reading_hours: [
    { day: "Lun", hours: 14.5 },
    { day: "Mar", hours: 22.0 },
    { day: "Mer", hours: 18.5 },
    { day: "Jeu", hours: 28.0 },
    { day: "Ven", hours: 32.5 },
    { day: "Sam", hours: 12.0 },
    { day: "Dim", hours: 8.5 },
  ]
};
