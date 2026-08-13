// ─── Données Mocks pour le Dashboard Auteur (author) ─────────────────────────

import type {
  AuthorPublishedBook,
  AuthorSubmission,
  AuthorRoyaltyPayment,
  AuthorDelegateAccess,
} from "../types/author";

export const mockAuthorPublishedBooks: AuthorPublishedBook[] = [
  {
    id: "pub-book-01",
    title: "Traité de Droit Administratif Général en Afrique",
    cover_url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
    published_at: "2024-03-15",
    sales_count: 1420,
    downloads_count: 2850,
    total_revenue_generated: 14100000,
    author_royalty_share_amount: 2115000, // Part propre 15%
    author_percentage_rate: 15,
    format_breakdown: { digital: 940, paper: 380, audio: 100 },
    country_breakdown: [
      { country: "Bénin", sales: 750 },
      { country: "Sénégal", sales: 320 },
      { country: "Togo", sales: 200 },
      { country: "Côte d'Ivoire", sales: 150 },
    ],
    isbn_digital: "978-2-01-398010-4",
    isbn_print: "978-2-01-398011-1",
    discipline: "Droit Public & Administration",
  },
  {
    id: "pub-book-02",
    title: "Introduction aux Institutions Politiques Béninoises",
    cover_url: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&q=80",
    published_at: "2023-10-10",
    sales_count: 890,
    downloads_count: 1640,
    total_revenue_generated: 8900000,
    author_royalty_share_amount: 1335000, // Part propre 15%
    author_percentage_rate: 15,
    format_breakdown: { digital: 600, paper: 290, audio: 0 },
    country_breakdown: [
      { country: "Bénin", sales: 650 },
      { country: "Niger", sales: 140 },
      { country: "Togo", sales: 100 },
    ],
    isbn_digital: "978-2-01-398020-3",
    discipline: "Science Politique",
  },
];

export const mockAuthorSubmissions: AuthorSubmission[] = [
  {
    id: "sub-aut-001",
    title: "Contentieux Constitutionnel et Protection des Droits Fondamentaux",
    manuscript_file_url: "/manuscripts/contentieux-constitutionnel-v2.pdf",
    submitted_at: "2025-07-28",
    version_type: "brouillon",
    status: "study_pending",
    suggested_summary: "Analyse comparée de la jurisprudence de la Cour Constitutionnelle du Bénin et du Sénégal.",
    suggested_language: "Français",
  },
  {
    id: "sub-aut-002",
    title: "Théorie Générale des Obligations en Droit Comparé Africain",
    manuscript_file_url: "/manuscripts/theorie-obligations-preview.epub",
    submitted_at: "2025-06-15",
    version_type: "preview",
    status: "accepted",
    review_notes: "Manuscrit accepté par le comité éditorial. Transmis au Maquettiste pour préparation catalogue.",
    suggested_summary: "Étude doctrinale de la théorie des contrats et de la responsabilité civile.",
    suggested_language: "Français",
  },
  {
    id: "sub-aut-003",
    title: "Guide de Rédaction des Mémoires de Master en Droit",
    manuscript_file_url: "/manuscripts/guide-redaction-master.pdf",
    submitted_at: "2025-05-10",
    version_type: "finale",
    status: "correction_requested",
    review_notes: "Veuillez réviser le chapitre 3 concernant les normes bibliographiques APA 7.",
    suggested_summary: "Méthodologie pratique de recherche et de rédaction juridique pour étudiants de Master.",
    suggested_language: "Français",
  },
];

export const mockAuthorRoyaltyPayments: AuthorRoyaltyPayment[] = [
  {
    id: "pay-aut-2025-q2",
    period: "Deuxième Trimestre 2025 (Q2)",
    total_sales_count: 580,
    gross_revenue: 5800000,
    author_percentage_rate: 15,
    author_earned_amount: 870000,
    status: "paid",
    payment_date: "2025-07-05",
    receipt_url: "/invoices/REL-AUT-Q2-2025.pdf",
  },
  {
    id: "pay-aut-2025-q3",
    period: "Troisième Trimestre 2025 (Q3 - En cours)",
    total_sales_count: 640,
    gross_revenue: 6400000,
    author_percentage_rate: 15,
    author_earned_amount: 960000,
    status: "pending",
    payment_date: "2025-10-05",
    receipt_url: "/invoices/REL-AUT-Q3-2025.pdf",
  },
];

export const mockAuthorDelegates: AuthorDelegateAccess[] = [
  {
    id: "del-01",
    name: "Dr. Honoré ZINSOU",
    email: "honore.zinsou@uac.bj",
    role: "co_author",
    status: "active",
    added_at: "2025-01-10",
  },
  {
    id: "del-02",
    name: "Aïchatou DIALLO",
    email: "aichatou.assistant@gmail.com",
    role: "assistant",
    status: "active",
    added_at: "2025-04-12",
  },
];
