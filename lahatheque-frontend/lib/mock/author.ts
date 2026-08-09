import { AuthorSubmission, RoyaltyStatement, AuthorContract } from "../types/author";

export const mockAuthorSubmissions: AuthorSubmission[] = [
  {
    id: "sub-101",
    title: "Traité d'Économétrie Appliquée aux Pays en Développement",
    discipline: "Économie & Gestion",
    status: "under_review",
    submitted_at: "2026-08-01T10:00:00Z",
    file_name: "traite_econometrie_v2.pdf"
  },
  {
    id: "sub-102",
    title: "Le Droit Foncier au Bénin : Enjeux et Perspectives",
    discipline: "Droit & Sciences Politiques",
    status: "approved",
    submitted_at: "2026-07-15T14:30:00Z",
    file_name: "droit_foncier_benin.epub"
  },
  {
    id: "sub-103",
    title: "Méthodologie de la Recherche en Sciences Sociales",
    discipline: "Lettres, Langues & Arts",
    status: "draft",
    submitted_at: "2026-08-08T16:00:00Z",
    file_name: "methodo_recherche_draft.pdf"
  }
];

export const mockRoyaltyStatements: RoyaltyStatement[] = [
  {
    id: "stmt-001",
    book_title: "Le Droit Foncier au Bénin : Enjeux et Perspectives",
    sales_count: 145,
    downloads_count: 320,
    amount: 145000,
    currency: "FCFA",
    statement_period: "Juillet 2026",
    status: "paid",
    payout_date: "2026-08-05T09:00:00Z"
  },
  {
    id: "stmt-002",
    book_title: "Introduction aux Institutions Politiques Africaines",
    sales_count: 89,
    downloads_count: 180,
    amount: 89000,
    currency: "FCFA",
    statement_period: "Juin 2026",
    status: "paid",
    payout_date: "2026-07-05T09:00:00Z"
  },
  {
    id: "stmt-003",
    book_title: "Le Droit Foncier au Bénin : Enjeux et Perspectives",
    sales_count: 24,
    downloads_count: 50,
    amount: 24000,
    currency: "FCFA",
    statement_period: "Août 2026 (En cours)",
    status: "pending"
  }
];

export const mockAuthorContracts: AuthorContract[] = [
  {
    id: "ctr-201",
    reference: "CTR-2026-FADESP-009",
    book_title: "Le Droit Foncier au Bénin : Enjeux et Perspectives",
    royalty_rate: 10,
    signed_at: "2026-05-10T11:00:00Z",
    contract_file: "/contracts/droit_foncier_signed.pdf"
  },
  {
    id: "ctr-202",
    reference: "CTR-2025-FADESP-048",
    book_title: "Introduction aux Institutions Politiques Africaines",
    royalty_rate: 12,
    signed_at: "2025-10-12T14:00:00Z",
    contract_file: "/contracts/institutions_africaines_signed.pdf"
  }
];
