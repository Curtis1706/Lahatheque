import { LegalContract, PreEditionItem, ClientDebt } from "../types/legal";

export const mockLegalContracts: LegalContract[] = [
  {
    id: "ctr-001",
    reference: "CTR-2026-FADESP-009",
    book_title: "Le Droit Foncier au Bénin : Enjeux et Perspectives",
    author_name: "Marc-Aurèle DE SOUZA",
    royalty_rate: 10,
    signed_at: "2026-05-10T11:00:00Z",
    contract_file: "droit_foncier_signed.pdf",
    status: "active"
  },
  {
    id: "ctr-002",
    reference: "CTR-2025-FADESP-048",
    book_title: "Introduction aux Institutions Politiques Africaines",
    author_name: "Marc-Aurèle DE SOUZA",
    royalty_rate: 12,
    signed_at: "2025-10-12T14:00:00Z",
    contract_file: "institutions_africaines_signed.pdf",
    status: "active"
  },
  {
    id: "ctr-003",
    reference: "CTR-2026-FLASH-112",
    book_title: "Histoire de l'Afrique de l'Ouest Précoloniale",
    author_name: "Pr. Amadou Diallo",
    royalty_rate: 8,
    signed_at: "2026-02-18T09:00:00Z",
    contract_file: "histoire_ao_signed.pdf",
    status: "active"
  }
];

export const mockPreEditions: PreEditionItem[] = [
  {
    id: "pre-101",
    title: "Manuel de Droit Constitutionnel Comparé",
    author_name: "Pr. Koffi Mensah",
    university: "Université de Lomé",
    faculty: "Faculté de Droit (FDD)",
    created_at: "2026-08-01T15:00:00Z"
  },
  {
    id: "pre-102",
    title: "Traité de Macroéconomie Monétaire",
    author_name: "Dr. Eliane Toba",
    university: "Université d'Abomey-Calavi (UAC)",
    faculty: "FASEG",
    created_at: "2026-08-06T11:00:00Z"
  }
];

export const mockClientDebts: ClientDebt[] = [
  {
    id: "debt-201",
    client_name: "Librairie Notre-Dame (Cotonou)",
    client_email: "notredame.lib@yahoo.fr",
    amount: 450000,
    currency: "FCFA",
    due_date: "2026-07-20T17:00:00Z",
    status: "pending"
  },
  {
    id: "debt-202",
    client_name: "Grossiste Documentaire Universitaire (Dakar)",
    client_email: "contact@gdu-dakar.sn",
    amount: 1200000,
    currency: "FCFA",
    due_date: "2026-07-05T17:00:00Z",
    status: "pending"
  },
  {
    id: "debt-203",
    client_name: "Université UNA (Moundou)",
    client_email: "academique@una-moundou.org",
    amount: 850000,
    currency: "FCFA",
    due_date: "2026-07-30T17:00:00Z",
    status: "reminded"
  }
];
