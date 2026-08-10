import { AuthorBook, AuthorSubmission, RoyaltyStatement, AuthorPurchase, AuthorStats } from "../types/author";

export const mockAuthorBooks: AuthorBook[] = [
  {
    id: "author-book-001",
    title: "Le Droit Foncier au Bénin : Enjeux et Perspectives",
    author: "Pr. Firinze DOSSOU",
    discipline: "Droit & Sciences Politiques",
    institution: "Université d'Abomey-Calavi (UAC)",
    format: "PDF",
    cover_bg: "bg-navy-dark",
    cover_color: "text-gold",
    isbn: "978-2-84299-401-0",
    edition_year: 2024,
    sales_count: 245,
    downloads_count: 580,
    total_revenue: 245000,
    currency: "FCFA",
    publication_date: "15 mars 2024",
    sales_by_format: [
      { format: "Numérique (PDF/EPUB)", percentage: 75 },
      { format: "Imprimé (Papier)", percentage: 25 }
    ],
    sales_by_country: [
      { country: "Bénin", sales: 180 },
      { country: "Togo", sales: 40 },
      { country: "Côte d'Ivoire", sales: 25 }
    ]
  },
  {
    id: "author-book-002",
    title: "Introduction aux Institutions Politiques Africaines",
    author: "Pr. Firinze DOSSOU",
    discipline: "Droit & Sciences Politiques",
    institution: "Université d'Abomey-Calavi (UAC)",
    format: "EPUB",
    cover_bg: "bg-amber-950",
    cover_color: "text-amber-300",
    isbn: "978-2-84299-402-7",
    edition_year: 2023,
    sales_count: 120,
    downloads_count: 310,
    total_revenue: 120000,
    currency: "FCFA",
    publication_date: "10 octobre 2023",
    sales_by_format: [
      { format: "Numérique (PDF/EPUB)", percentage: 80 },
      { format: "Imprimé (Papier)", percentage: 20 }
    ],
    sales_by_country: [
      { country: "Bénin", sales: 90 },
      { country: "Sénégal", sales: 30 }
    ]
  }
];

export const mockAuthorSubmissions: AuthorSubmission[] = [
  {
    id: "sub-101",
    title: "Traité d'Économétrie Appliquée aux Pays en Développement",
    summary: "Manuel synthétique présentant les méthodes économétriques avancées pour le contexte ouest-africain.",
    language: "Français",
    version_type: "brouillon",
    status: "changes_requested",
    submitted_at: "2026-08-01T10:00:00Z",
    file_name: "traite_econometrie_v2.pdf",
    cover_bg: "bg-navy-dark",
    cover_color: "text-gold",
    feedback_history: [
      {
        date: "2026-08-03",
        author_role: "Chef Maquettiste",
        message: "Veuillez vérifier les formules mathématiques au chapitre 3 et fournir la bibliographie sous format APA."
      }
    ]
  },
  {
    id: "sub-102",
    title: "La Gouvernance Financière Publique en Afrique de l'Ouest",
    summary: "Étude des réformes budgétaires et de la gestion des finances publiques dans l'espace UEMOA.",
    language: "Français",
    version_type: "preview",
    status: "under_review",
    submitted_at: "2026-08-05T14:30:00Z",
    file_name: "gouvernance_financiere_v1.docx",
    cover_bg: "bg-emerald-950",
    cover_color: "text-emerald-300"
  },
  {
    id: "sub-103",
    title: "Méthodologie de la Recherche en Sciences Sociales",
    summary: "Guide pratique pour la rédaction des mémoriaux et thèses universitaires.",
    language: "Français",
    version_type: "brouillon",
    status: "draft",
    submitted_at: "2026-08-08T16:00:00Z",
    file_name: "methodo_recherche_draft.docx",
    cover_bg: "bg-slate-900",
    cover_color: "text-cyan-400"
  }
];

export const mockRoyaltyStatements: RoyaltyStatement[] = [
  {
    id: "stmt-001",
    book_title: "Le Droit Foncier au Bénin : Enjeux et Perspectives",
    sales_count: 145,
    downloads_count: 320,
    gross_revenue: 1450000,
    royalty_rate_percent: 10,
    amount: 145000,
    currency: "FCFA",
    statement_period: "Juillet 2026",
    status: "paid",
    payout_date: "2026-08-05T09:00:00Z",
    pdf_url: "#"
  },
  {
    id: "stmt-002",
    book_title: "Introduction aux Institutions Politiques Africaines",
    sales_count: 89,
    downloads_count: 180,
    gross_revenue: 890000,
    royalty_rate_percent: 10,
    amount: 89000,
    currency: "FCFA",
    statement_period: "Juin 2026",
    status: "paid",
    payout_date: "2026-07-05T09:00:00Z",
    pdf_url: "#"
  },
  {
    id: "stmt-003",
    book_title: "Le Droit Foncier au Bénin : Enjeux et Perspectives",
    sales_count: 35,
    downloads_count: 90,
    gross_revenue: 350000,
    royalty_rate_percent: 10,
    amount: 35000,
    currency: "FCFA",
    statement_period: "Août 2026 (En cours)",
    status: "pending",
    pdf_url: "#"
  }
];

export const mockAuthorPurchases: AuthorPurchase[] = [
  {
    id: "pur-001",
    order_number: "CMD-2026-8910",
    book_title: "Droit Constitutionnel des États d'Afrique Francophone",
    author: "Prof. Jean-Marc Agossou",
    price: 3500,
    currency: "FCFA",
    purchase_date: "12 mai 2026",
    format: "PDF",
    cover_bg: "bg-navy-dark",
    cover_color: "text-gold"
  },
  {
    id: "pur-002",
    order_number: "CMD-2026-7734",
    book_title: "Économie du Développement et Politiques Publiques",
    author: "Dr. Amina Diallo",
    price: 4000,
    currency: "FCFA",
    purchase_date: "22 juin 2026",
    format: "EPUB",
    cover_bg: "bg-emerald-950",
    cover_color: "text-emerald-300"
  }
];

export const mockAuthorStats: AuthorStats = {
  total_sales: 365,
  total_revenue: 365000,
  total_downloads: 890,
  pending_payout: 35000,
  next_payout_date: "05 septembre 2026",
  monthly_sales: [
    { month: "Mar", sales: 45 },
    { month: "Avr", sales: 62 },
    { month: "Mai", sales: 58 },
    { month: "Juin", sales: 89 },
    { month: "Juil", sales: 145 },
    { month: "Août", sales: 35 }
  ]
};
