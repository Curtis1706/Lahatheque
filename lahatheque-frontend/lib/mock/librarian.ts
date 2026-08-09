import { StudentAffiliation, BouquetSubscription, UsageStats } from "../types/librarian";

export const mockAffiliations: StudentAffiliation[] = [
  {
    id: "aff-001",
    student_name: "Koffi GOMEZ",
    student_email: "koffi.gomez@uac.edu.bj",
    student_card_number: "UAC-2025-8849",
    faculty: "Faculté de Droit (FADESP)",
    requested_at: "2026-08-08T09:15:00Z",
    status: "pending"
  },
  {
    id: "aff-002",
    student_name: "Chantal ADJANOHOUN",
    student_email: "chantal.adjanohoun@uac.edu.bj",
    student_card_number: "UAC-2024-1029",
    faculty: "Faculté des Sciences de la Santé (FSS)",
    requested_at: "2026-08-09T08:30:00Z",
    status: "pending"
  },
  {
    id: "aff-003",
    student_name: "Idriss TOURE",
    student_email: "idriss.toure@uac.edu.bj",
    student_card_number: "UAC-2025-0048",
    faculty: "Sciences Economiques & de Gestion (FASEG)",
    requested_at: "2026-08-09T11:00:00Z",
    status: "pending"
  },
  {
    id: "aff-004",
    student_name: "Awa DIOP",
    student_email: "awa.diop@uac.edu.bj",
    student_card_number: "UAC-2025-7739",
    faculty: "Lettres, Langues & Arts (FLLAC)",
    requested_at: "2026-08-05T14:20:00Z",
    status: "approved"
  }
];

export const mockBouquets: BouquetSubscription[] = [
  {
    id: "bq-01",
    name: "Bouquet Droit & Sciences Politiques UAC",
    start_date: "2026-01-01T00:00:00Z",
    end_date: "2026-12-31T23:59:59Z",
    max_licenses: 500,
    active_licenses: 342,
    status: "active"
  },
  {
    id: "bq-02",
    name: "Bouquet Médecine & Santé Afrique",
    start_date: "2026-01-01T00:00:00Z",
    end_date: "2026-12-31T23:59:59Z",
    max_licenses: 200,
    active_licenses: 198,
    status: "active"
  }
];

export const mockUsageStats: UsageStats[] = [
  {
    discipline: "Droit & Sciences Politiques",
    views: 1240,
    downloads: 480,
    pages_read: 25400
  },
  {
    discipline: "Économie & Gestion",
    views: 890,
    downloads: 320,
    pages_read: 18200
  },
  {
    discipline: "Lettres & Langues",
    views: 450,
    downloads: 110,
    pages_read: 7800
  }
];
