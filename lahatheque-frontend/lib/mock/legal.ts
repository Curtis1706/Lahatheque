// ─── Mock Data — Dashboard Juriste (legal_reviewer) ─────────────────────────

import type {
  LegalContract,
  BookRoyalty,
  AIRoyaltySuggestion,
  PreEditionContract,
  UniversityRoyalty,
  ThirdPartyPublisherRoyalty,
  AuthorEmailReport,
  ClientDebt,
  DebtReminderConfig,
  LegalKpis,
} from "../types/legal";

export const mockLegalUser = {
  id: "user-juriste-01",
  name: "Me. François KÉRÉKOU",
  role: "legal_reviewer",
};

export const mockContracts: LegalContract[] = [
  {
    id: "ctr-2026-001",
    reference: "CTR-UAC-2026-01",
    title: "Convention Cadre d'Édition et Diffusion Universitaire — UAC",
    contracting_party: "Université d'Abomey-Calavi (UAC)",
    party_type: "university",
    type: "university_agreement",
    signed_at: "2025-01-15T10:00:00Z",
    expires_at: "2030-01-15T10:00:00Z",
    file_url: "/mock/contracts/convention-uac.pdf",
    file_name: "Convention_Cadre_UAC_LAHA_2025.pdf",
    file_size: 4500000,
    tags: ["convention", "uac", "droit", "redevance 15%"],
    status: "active",
    notes: "Fixe le taux institutionnel à 15% sur toutes les publications de la FADESP, FSS et FASEG.",
    amendments: [
      {
        id: "am-01",
        title: "Avenant N°1 — Extension aux publications FSS",
        date: "2025-06-20",
        file_url: "/mock/contracts/avenant-1-fss.pdf",
      },
    ],
  },
  {
    id: "ctr-2026-002",
    reference: "CTR-AUT-2026-14",
    title: "Contrat d'Édition Exclusive — Prof. Joseph DJOGBÉNOU",
    contracting_party: "Prof. Joseph DJOGBÉNOU",
    party_type: "author",
    type: "author_contract",
    signed_at: "2026-02-10T14:30:00Z",
    expires_at: "2031-02-10T14:30:00Z",
    file_url: "/mock/contracts/contrat-djogbenou.pdf",
    file_name: "Contrat_Edition_Djogbenou_Droit_Obligations.pdf",
    file_size: 2800000,
    tags: ["auteur", "droit prive", "djogbenou", "18%"],
    status: "active",
    linked_book_id: "dep-2026-001",
    linked_book_title: "Droit des Obligations en Afrique de l'Ouest",
    notes: "Taux de droits d'auteur négocié à 18% sur les ventes papier et numériques.",
  },
  {
    id: "ctr-2026-003",
    reference: "CTR-PUB-2025-08",
    title: "Accord de Co-Édition et Rediffusion — Éditions Hachette",
    contracting_party: "Éditions Hachette Afrique",
    party_type: "publisher",
    type: "publisher_partnership",
    signed_at: "2025-09-01T09:00:00Z",
    file_url: "/mock/contracts/partenariat-hachette.pdf",
    file_name: "Accord_Coedition_Hachette_LAHA.pdf",
    file_size: 6100000,
    tags: ["editeur tiers", "hachette", "coedition", "22%"],
    status: "active",
    notes: "Taux contractuel négocié à 22% sur le chiffre d'affaires net.",
  },
  {
    id: "ctr-2026-004",
    reference: "CTR-PRE-2026-03",
    title: "Contrat de Pré-Édition — Traité de Cardiologie Tropicale",
    contracting_party: "Dr. Marc SANOU",
    party_type: "author",
    type: "pre_edition",
    signed_at: "2026-04-05T11:00:00Z",
    file_url: "/mock/contracts/pre-edition-cardiologie.pdf",
    file_name: "Pre_Edition_Cardiologie_Sanou.pdf",
    file_size: 1900000,
    tags: ["pre-edition", "medecine", "fss"],
    status: "pending_signature",
    notes: "Pré-enregistrement en attente de soumission de la maquette finale par le Maquettiste.",
  },
];

export const mockBookRoyalties: BookRoyalty[] = [
  {
    book_id: "book-001",
    title: "Droit des Obligations en Afrique de l'Ouest",
    authors: ["Prof. Joseph DJOGBÉNOU"],
    current_rate: 18,
    source: "manual_override",
    isbn: "978-2-37050-010-5",
    last_updated: "2026-02-10T14:30:00Z",
    history: [
      {
        date: "2026-02-10T14:30:00Z",
        rate: 18,
        changed_by: "Me. François KÉRÉKOU",
        applied_retroactively: false,
      },
      {
        date: "2025-01-01T00:00:00Z",
        rate: 15,
        changed_by: "IA System",
        applied_retroactively: false,
      },
    ],
  },
  {
    book_id: "book-002",
    title: "Manuel de Santé Publique et Épidémiologie",
    authors: ["Dr. Clarisse AGBOTO", "Dr. Roch SOSSOU"],
    current_rate: 16,
    source: "ai_suggested",
    isbn: "978-2-37050-011-2",
    last_updated: "2026-03-01T10:00:00Z",
    history: [
      {
        date: "2026-03-01T10:00:00Z",
        rate: 16,
        changed_by: "IA System",
        applied_retroactively: false,
      },
    ],
  },
];

export const mockAIRoyaltySuggestions: AIRoyaltySuggestion[] = [
  {
    id: "sug-01",
    book_id: "book-003",
    title: "Finances Publiques et Comptabilité de l'État",
    authors: ["Prof. Augustin CHAKIROU", "Dr. Fatou DIOP"],
    proposed_splits: [
      { author_name: "Prof. Augustin CHAKIROU", percentage: 60 },
      { author_name: "Dr. Fatou DIOP", percentage: 40 },
    ],
    is_validated: false,
    ai_confidence: 94,
  },
  {
    id: "sug-02",
    book_id: "book-004",
    title: "Histoire du Droit Constitutionnel Béninois",
    authors: ["Prof. Théodore HOLO", "Dr. Alain DOSSA"],
    proposed_splits: [
      { author_name: "Prof. Théodore HOLO", percentage: 70 },
      { author_name: "Dr. Alain DOSSA", percentage: 30 },
    ],
    is_validated: false,
    ai_confidence: 88,
  },
];

export const mockPreEditionContracts: PreEditionContract[] = [
  {
    id: "pre-01",
    title: "Manuel de Pharmacologie et Thérapeutique",
    author_name: "Prof. Victorien DOUGNON",
    university: "Université d'Abomey-Calavi (UAC)",
    faculty: "Faculté des Sciences de la Santé (FSS)",
    status: "en_attente_depot",
    created_at: "2026-07-15T09:00:00Z",
  },
  {
    id: "pre-02",
    title: "Introduction à la Micro-Économie Africaine",
    author_name: "Dr. Pascaline KPADONOU",
    university: "Université de Parakou (UP)",
    faculty: "Faculté des Sciences Économiques (FASEG)",
    status: "depot_lie",
    linked_book_id: "book-005",
    created_at: "2026-06-01T11:00:00Z",
  },
];

export const mockUniversityRoyalties: UniversityRoyalty[] = [
  {
    university_id: "univ-uac",
    name: "Université d'Abomey-Calavi (UAC)",
    country: "Bénin",
    fixed_rate_percentage: 15,
    total_sales_generated: 45000000,
    amount_due: 6750000,
    currency: "XOF",
    status: "up_to_date",
    contract_reference: "CTR-UAC-2026-01",
  },
  {
    university_id: "univ-up",
    name: "Université de Parakou (UP)",
    country: "Bénin",
    fixed_rate_percentage: 15,
    total_sales_generated: 28000000,
    amount_due: 4200000,
    currency: "XOF",
    status: "pending_transfer",
    contract_reference: "CTR-UP-2025-04",
  },
];

export const mockThirdPartyPublisherRoyalties: ThirdPartyPublisherRoyalty[] = [
  {
    publisher_id: "pub-hachette",
    name: "Éditions Hachette Afrique",
    contractual_rate: 22,
    total_sales: 18500000,
    amount_due: 4070000,
    currency: "XOF",
    last_updated: "2026-01-10T00:00:00Z",
    contract_reference: "CTR-PUB-2025-08",
  },
  {
    publisher_id: "pub-lharmattan",
    name: "L'Harmattan Bénin",
    contractual_rate: 20,
    total_sales: 12000000,
    amount_due: 2400000,
    currency: "XOF",
    last_updated: "2025-11-15T00:00:00Z",
    contract_reference: "CTR-PUB-2024-12",
  },
];

export const mockAuthorEmailReports: AuthorEmailReport[] = [
  {
    author_id: "aut-djogbenou",
    name: "Prof. Joseph DJOGBÉNOU",
    email: "joseph.djogbenou@uac.bj",
    last_report_date: "2026-07-31T00:00:00Z",
    next_report_date: "2026-08-31T00:00:00Z",
    total_sales_count: 340,
    total_royalties_paid: 1850000,
    status: "scheduled",
  },
  {
    author_id: "aut-agboto",
    name: "Dr. Clarisse AGBOTO",
    email: "clarisse.agboto@fss.uac.bj",
    last_report_date: "2026-07-31T00:00:00Z",
    next_report_date: "2026-08-31T00:00:00Z",
    total_sales_count: 210,
    total_royalties_paid: 1120000,
    status: "sent",
  },
];

export const mockClientDebts: ClientDebt[] = [
  {
    id: "debt-01",
    client_id: "cli-lib-parakou",
    client_name: "Librairie Centrale de Parakou",
    client_email: "contact@librairieparakou.bj",
    amount: 350000,
    currency: "XOF",
    due_date: "2026-07-01",
    days_overdue: 43,
    reminder_count: 2,
    last_reminder_at: "2026-08-01T10:00:00Z",
    status: "reminded",
  },
  {
    id: "debt-02",
    client_id: "cli-univ-porto",
    client_name: "Institut Supérieur Porto-Novo",
    client_email: "comptabilite@is-portonovo.bj",
    amount: 720000,
    currency: "XOF",
    due_date: "2026-06-15",
    days_overdue: 59,
    reminder_count: 3,
    last_reminder_at: "2026-08-08T14:00:00Z",
    status: "final_notice",
  },
];

export const mockDebtConfig: DebtReminderConfig = {
  min_amount_threshold: 50000,
  days_before_first_reminder: 7,
  max_reminders_count: 3,
  frequency_days: 10,
};

export const mockLegalKpis: LegalKpis = {
  totalContracts: 4,
  pendingAiSuggestions: 2,
  clientsInDebt: 2,
  authorRemindersSent: 2,
  activePreEditions: 2,
};
