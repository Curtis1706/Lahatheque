import { apiClient } from "@/lib/api-client";
import type {
  UniversityKpis,
  UniversityFacultyData,
  UniversityBouquet,
  UniversityBookCatalogItem,
  UniversityPaperOrder,
  UniversityStudentAffiliationData,
  UniversityRoyaltyStatementData,
  UniversityProfileData,
} from "../types/university";

async function bffGet<T>(url: string): Promise<T> {
  const res = await apiClient.get(url);
  return res.data?.data ?? res.data;
}
async function bffPost<T>(url: string, body: any): Promise<T> {
  const res = await apiClient.post(url, body);
  return res.data?.data ?? res.data;
}
async function bffPatch<T>(url: string, body: any): Promise<T> {
  const res = await apiClient.patch(url, body);
  return res.data?.data ?? res.data;
}
async function bffDelete<T>(url: string): Promise<T> {
  const res = await apiClient.delete(url);
  return res.data?.data ?? res.data;
}

// ─── Mock Data Réalistes (UAC, UNA, Parakou, UCAD) ───────────────────────────

export const mockUniversityKpis: UniversityKpis = {
  affiliated_students_count: 14850,
  active_bouquets_count: 6,
  monthly_consultations_count: 42180,
  total_royalties_available: 1250000,
  total_royalties_paid: 3800000,
  currency: "XOF",
  consultations_trend_percent: 14.2,
  top_disciplines: [
    { discipline: "Sciences Juridiques & Droit Privé", consultations: 16028, percent: 38 },
    { discipline: "Sciences de la Santé & Médecine", consultations: 10966, percent: 26 },
    { discipline: "Sciences Économiques & Gestion", consultations: 7592, percent: 18 },
    { discipline: "Sciences Fondamentales & Ingénierie", consultations: 5061, percent: 12 },
    { discipline: "Lettres, Langues & Sciences Humaines", consultations: 2533, percent: 6 },
  ],
  faculty_distribution: [
    { code: "FADESP", name: "Droit & Science Politique", consultations: 16028, percent: 38, color: "var(--navy)" },
    { code: "FSS", name: "Sciences de la Santé", consultations: 10966, percent: 26, color: "var(--gold)" },
    { code: "FASEG", name: "Économie & Gestion", consultations: 7592, percent: 18, color: "var(--navy-hover)" },
    { code: "FAST", name: "Sciences & Techniques", consultations: 5061, percent: 12, color: "var(--gold-dark)" },
    { code: "FLASH", name: "Lettres & Sciences Humaines", consultations: 2533, percent: 6, color: "var(--navy-light)" },
  ],
};

let mockUniversityFaculties: UniversityFacultyData[] = [
  {
    id: "fac-1",
    name: "Faculté de Droit et de Science Politique",
    code: "FADESP",
    disciplines: ["Droit Privé", "Droit Public", "Sciences Politiques", "Droit des Affaires OHADA"],
    student_count: 5200,
    dean_name: "Prof. Roch GNAHOUI",
  },
  {
    id: "fac-2",
    name: "Faculté des Sciences de la Santé",
    code: "FSS",
    disciplines: ["Médecine Générale", "Pharmacie", "Santé Publique", "Pédiatrie Tropicale"],
    student_count: 3400,
    dean_name: "Prof. Josiane KPATENON",
  },
  {
    id: "fac-3",
    name: "Faculté des Sciences Économiques et de Gestion",
    code: "FASEG",
    disciplines: ["Économie de Développement", "Finance d'Entreprise", "Audit & Contrôle de Gestion"],
    student_count: 3100,
    dean_name: "Prof. Denis ACKLASSATO",
  },
  {
    id: "fac-4",
    name: "Faculté des Sciences et Techniques",
    code: "FAST",
    disciplines: ["Mathématiques Appliquées", "Physique-Chimie", "Informatique & Réseaux"],
    student_count: 2150,
    dean_name: "Prof. Valentin WANKPO",
  },
  {
    id: "fac-5",
    name: "Faculté des Lettres, Arts et Sciences Humaines",
    code: "FLASH",
    disciplines: ["Histoire & Archéologie", "Sociologie Africaine", "Géographie & Aménagement"],
    student_count: 1000,
    dean_name: "Prof. Clarisse TOSSOU",
  },
];

let mockUniversityBouquets: UniversityBouquet[] = [
  {
    id: "bq-droit-2026",
    title: "Bouquet Droit des Affaires & Espace OHADA",
    bouquet_type: "faculty",
    faculty_code: "FADESP",
    discipline: "Droit Privé",
    books_count: 145,
    annual_price: 1200000,
    currency: "XOF",
    status: "active",
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    description: "Ensemble complet des traités juridiques, précis de jurisprudence et codes annotés de l'espace OHADA pour étudiants et enseignants.",
    sample_books: [
      { id: "b-1", title: "Traité de Droit Commercial Général OHADA", author: "Prof. Dorothé SOSSA", cover_url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80" },
      { id: "b-2", title: "Précis de Droit Administratif Béninois", author: "Prof. Victor TOPANOU", cover_url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80" },
    ],
  },
  {
    id: "bq-medecine-2026",
    title: "Bouquet Médecine Tropicale & Santé Publique",
    bouquet_type: "faculty",
    faculty_code: "FSS",
    discipline: "Médecine Générale",
    books_count: 98,
    annual_price: 1500000,
    currency: "XOF",
    status: "active",
    start_date: "2026-01-01",
    end_date: "2026-12-31",
    description: "Manuel de pathologie infectieuse, chirurgie tropicale et épidémiologie en Afrique subsaharienne.",
    sample_books: [
      { id: "b-3", title: "Cardiologie Tropicale Clinique", author: "Prof. Martin HOUENASSI", cover_url: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=400&q=80" },
    ],
  },
  {
    id: "bq-eco-2026",
    title: "Bouquet Économie Africaine & Gestion Publique",
    bouquet_type: "faculty",
    faculty_code: "FASEG",
    discipline: "Économie de Développement",
    books_count: 112,
    annual_price: 950000,
    currency: "XOF",
    status: "available",
    description: "Politiques macroéconomiques UEMOA/CEMAC, gestion budgétaire et microfinance rurale.",
    sample_books: [
      { id: "b-4", title: "Finances Publiques en Afrique Noire Francophone", author: "Prof. Félix ADISSO", cover_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80" },
    ],
  },
  {
    id: "bq-sciences-2026",
    title: "Bouquet Mathématiques & Informatique Décisionnelle",
    bouquet_type: "discipline",
    discipline: "Mathématiques Appliquées",
    books_count: 85,
    annual_price: 800000,
    currency: "XOF",
    status: "available",
    description: "Algèbre linéaire avancée, probabilités, intelligence artificielle et structures de données.",
    sample_books: [
      { id: "b-5", title: "Optimisation et Recherche Opérationnelle", author: "Prof. Mahouton NORBERT", cover_url: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=400&q=80" },
    ],
  },
];

let mockUniversityCatalog: UniversityBookCatalogItem[] = [
  {
    id: "b-1",
    title: "Traité de Droit Commercial Général OHADA",
    isbn_digital: "978-2-919876-01-2",
    isbn_print: "978-2-919876-02-9",
    authors: ["Prof. Dorothé SOSSA", "Prof. Joseph DJOGBENOU"],
    faculty_code: "FADESP",
    faculty_name: "Faculté de Droit (FADESP)",
    discipline: "Droit Privé",
    price_digital: 5000,
    price_paper: 12000,
    currency: "XOF",
    cover_url: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80",
    consultations_count: 1420,
    stock_paper_available: 120,
  },
  {
    id: "b-2",
    title: "Précis de Droit Administratif Béninois",
    isbn_digital: "978-2-919876-03-6",
    isbn_print: "978-2-919876-04-3",
    authors: ["Prof. Victor TOPANOU"],
    faculty_code: "FADESP",
    faculty_name: "Faculté de Droit (FADESP)",
    discipline: "Droit Public",
    price_digital: 4500,
    price_paper: 9500,
    currency: "XOF",
    cover_url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80",
    consultations_count: 980,
    stock_paper_available: 85,
  },
  {
    id: "b-3",
    title: "Cardiologie Tropicale Clinique",
    isbn_digital: "978-2-919876-05-0",
    isbn_print: "978-2-919876-06-7",
    authors: ["Prof. Martin HOUENASSI"],
    faculty_code: "FSS",
    faculty_name: "Sciences de la Santé (FSS)",
    discipline: "Médecine Générale",
    price_digital: 6500,
    price_paper: 15000,
    currency: "XOF",
    cover_url: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=400&q=80",
    consultations_count: 1890,
    stock_paper_available: 64,
  },
  {
    id: "b-4",
    title: "Finances Publiques en Afrique Noire Francophone",
    isbn_digital: "978-2-919876-07-4",
    isbn_print: "978-2-919876-08-1",
    authors: ["Prof. Félix ADISSO"],
    faculty_code: "FASEG",
    faculty_name: "Économie & Gestion (FASEG)",
    discipline: "Économie de Développement",
    price_digital: 4000,
    price_paper: 8500,
    currency: "XOF",
    cover_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=400&q=80",
    consultations_count: 730,
    stock_paper_available: 150,
  },
];

let mockUniversityAffiliations: UniversityStudentAffiliationData[] = [
  {
    id: "aff-101",
    student_name: "Koffi MENSAH",
    student_email: "koffimensah98@gmail.com",
    student_phone: "+229 97 12 34 56",
    matricule: "2024-UAC-10492",
    faculty_code: "FADESP",
    faculty_name: "Faculté de Droit (FADESP)",
    level: "Licence 3 Droit Privé",
    student_card_url: "/justificatifs/carte-mensah.jpg",
    status: "pending",
    created_at: "2026-08-19T10:15:00Z",
  },
  {
    id: "aff-102",
    student_name: "Amina DIOP",
    student_email: "aminadiop.senegal@yahoo.fr",
    student_phone: "+221 77 654 32 10",
    matricule: "2023-UAC-08114",
    faculty_code: "FSS",
    faculty_name: "Sciences de la Santé (FSS)",
    level: "Master 1 Pharmacie",
    student_card_url: "/justificatifs/carte-diop.jpg",
    status: "active",
    verified_at: "2026-08-10T14:30:00Z",
    created_at: "2026-08-09T09:00:00Z",
  },
  {
    id: "aff-103",
    student_name: "Boris TCHIBINDA",
    student_email: "boris.tchibinda@gmail.com",
    student_phone: "+229 95 88 77 66",
    matricule: "2024-UAC-12903",
    faculty_code: "FASEG",
    faculty_name: "Économie & Gestion (FASEG)",
    level: "Licence 2 Gestion",
    student_card_url: "/justificatifs/carte-tchibinda.jpg",
    status: "active",
    verified_at: "2026-08-15T11:20:00Z",
    created_at: "2026-08-14T16:45:00Z",
  },
  {
    id: "aff-104",
    student_name: "Chantal AGBOHOUN",
    student_email: "chantalagbohoun@gmail.com",
    student_phone: "+229 96 00 11 22",
    matricule: "2025-UAC-14002",
    faculty_code: "FAST",
    faculty_name: "Sciences et Techniques (FAST)",
    level: "Licence 1 Mathématiques",
    student_card_url: "/justificatifs/carte-agbohoun.jpg",
    status: "pending",
    created_at: "2026-08-20T08:00:00Z",
  },
];

let mockUniversityOrders: UniversityPaperOrder[] = [
  {
    id: "ord-univ-01",
    order_number: "CMD-UNIV-2026-089",
    delivery_campus: "Bibliothèque Centrale — Campus Universitaire d'Abomey-Calavi",
    contact_person: "M. SOSSOU Théophile (Conservateur en Chef)",
    contact_phone: "+229 97 33 44 55",
    items: [
      { book_id: "b-1", title: "Traité de Droit Commercial Général OHADA", quantity: 40, unit_price: 12000 },
      { book_id: "b-2", title: "Précis de Droit Administratif Béninois", quantity: 30, unit_price: 9500 },
    ],
    total_amount: 765000,
    currency: "XOF",
    status: "in_transit",
    tracking_number: "TRK-BEN-2026-0042",
    pdf_order_url: "/documents/bon-commande-089.pdf",
    created_at: "2026-08-16T09:00:00Z",
  },
  {
    id: "ord-univ-02",
    order_number: "CMD-UNIV-2026-074",
    delivery_campus: "Faculté des Sciences de la Santé (FSS) — Campus Cotonou Champ de Foire",
    contact_person: "Dr. EHOUN Constant",
    contact_phone: "+229 95 11 22 33",
    items: [
      { book_id: "b-3", title: "Cardiologie Tropicale Clinique", quantity: 25, unit_price: 15000 },
    ],
    total_amount: 375000,
    currency: "XOF",
    status: "delivered",
    tracking_number: "TRK-BEN-2026-0019",
    pdf_order_url: "/documents/bon-commande-074.pdf",
    created_at: "2026-08-01T14:30:00Z",
  },
];

let mockUniversityRoyalties: {
  available_balance: number;
  total_paid: number;
  contractual_rate: number;
  currency: string;
  min_withdrawal_threshold: number;
  statements: UniversityRoyaltyStatementData[];
} = {
  available_balance: 1250000,
  total_paid: 3800000,
  contractual_rate: 15.00,
  currency: "XOF",
  min_withdrawal_threshold: 100000,
  statements: [
    {
      id: "roy-01",
      reference: "REL-ROY-UNIV-2026-T2",
      period: "2e Trimestre 2026 (Avril - Juin)",
      total_sales_catalog: 8333333,
      royalty_rate: 15.00,
      net_royalty_amount: 1250000,
      currency: "XOF",
      status: "available",
      pdf_statement_url: "/documents/bordereau-redevance-t2.pdf",
      created_at: "2026-07-05T10:00:00Z",
    },
    {
      id: "roy-02",
      reference: "REL-ROY-UNIV-2026-T1",
      period: "1er Trimestre 2026 (Janvier - Mars)",
      total_sales_catalog: 12000000,
      royalty_rate: 15.00,
      net_royalty_amount: 1800000,
      currency: "XOF",
      status: "paid",
      pdf_statement_url: "/documents/bordereau-redevance-t1.pdf",
      created_at: "2026-04-05T10:00:00Z",
    },
    {
      id: "roy-03",
      reference: "REL-ROY-UNIV-2025-T4",
      period: "4e Trimestre 2025 (Octobre - Décembre)",
      total_sales_catalog: 13333333,
      royalty_rate: 15.00,
      net_royalty_amount: 2000000,
      currency: "XOF",
      status: "paid",
      pdf_statement_url: "/documents/bordereau-redevance-t4.pdf",
      created_at: "2026-01-05T10:00:00Z",
    },
  ],
};

let mockUniversityProfile: UniversityProfileData = {
  id: "univ-uac",
  name: "Université d'Abomey-Calavi",
  short_name: "UAC",
  country: "BJ",
  city: "Abomey-Calavi / Cotonou",
  address: "Campus Universitaire d'Abomey-Calavi, BP 526, Bénin",
  rector_name: "Prof. Félicien AVLESSI",
  academic_director_name: "Prof. Patrick HOUESSOU",
  contact_email: "rectorat@uac.bj",
  contact_phone: "+229 21 36 00 74",
  bank_name: "Trésor Public du Bénin / Ecobank Bénin",
  bank_iban: "BJ0610100100198765432100",
  bank_swift: "ECOBBJBJ",
  momo_number: "+229 97 00 00 01",
  contract_reference: "CONV-UAC-LAHA-2025-01",
  royalty_rate: 15.00,
  is_active: true,
};

// ─── Fonctions Asynchrones Connectées BFF ─────────────────────────────────────

export async function getUniversityKpis(): Promise<UniversityKpis> {
  try {
    return await bffGet<UniversityKpis>("/university/kpis/");
  } catch {
    return { ...mockUniversityKpis };
  }
}

export async function getUniversityFaculties(): Promise<UniversityFacultyData[]> {
  try {
    return await bffGet<UniversityFacultyData[]>("/university/faculties/");
  } catch {
    return [...mockUniversityFaculties];
  }
}

export async function addUniversityFaculty(faculty: Omit<UniversityFacultyData, "id">): Promise<UniversityFacultyData> {
  try {
    return await bffPost<UniversityFacultyData>("/university/faculties/", faculty);
  } catch {
    const newFac: UniversityFacultyData = {
      ...faculty,
      id: `fac-${Date.now()}`,
    };
    mockUniversityFaculties.push(newFac);
    return newFac;
  }
}

export async function deleteUniversityFaculty(id: string): Promise<boolean> {
  try {
    await bffDelete(`/university/faculties/${id}/`);
    return true;
  } catch {
    mockUniversityFaculties = mockUniversityFaculties.filter((f) => f.id !== id);
    return true;
  }
}

export async function getUniversityBouquets(): Promise<UniversityBouquet[]> {
  try {
    return await bffGet<UniversityBouquet[]>("/university/bouquets/");
  } catch {
    return [...mockUniversityBouquets];
  }
}

export async function subscribeUniversityBouquet(bouquetId: string): Promise<boolean> {
  try {
    await bffPost(`/university/bouquets/${bouquetId}/subscribe/`, {});
    return true;
  } catch {
    const bouquet = mockUniversityBouquets.find((b) => b.id === bouquetId);
    if (bouquet) {
      bouquet.status = "active";
      bouquet.start_date = new Date().toISOString().split("T")[0];
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      bouquet.end_date = nextYear.toISOString().split("T")[0];
    }
    return true;
  }
}

export async function getUniversityCatalog(): Promise<UniversityBookCatalogItem[]> {
  try {
    return await bffGet<UniversityBookCatalogItem[]>("/university/catalog/");
  } catch {
    return [...mockUniversityCatalog];
  }
}

export async function getUniversityAffiliations(): Promise<UniversityStudentAffiliationData[]> {
  try {
    return await bffGet<UniversityStudentAffiliationData[]>("/university/affiliations/");
  } catch {
    return [...mockUniversityAffiliations];
  }
}

export async function updateUniversityAffiliation(
  affiliationId: string,
  action: "approve" | "suspend"
): Promise<boolean> {
  try {
    await bffPatch(`/university/affiliations/${affiliationId}/`, { action });
    return true;
  } catch {
    const item = mockUniversityAffiliations.find((a) => a.id === affiliationId);
    if (item) {
      item.status = action === "approve" ? "active" : "suspended";
      if (action === "approve") {
        item.verified_at = new Date().toISOString();
      }
    }
    return true;
  }
}

export async function getUniversityPaperOrders(): Promise<UniversityPaperOrder[]> {
  try {
    return await bffGet<UniversityPaperOrder[]>("/university/paper-orders/");
  } catch {
    return [...mockUniversityOrders];
  }
}

export async function createUniversityPaperOrder(order: {
  delivery_campus: string;
  contact_person: string;
  contact_phone: string;
  items: { book_id: string; title: string; quantity: number; unit_price: number }[];
  total_amount: number;
}): Promise<UniversityPaperOrder> {
  try {
    return await bffPost<UniversityPaperOrder>("/university/paper-orders/", order);
  } catch {
    const newOrd: UniversityPaperOrder = {
      id: `ord-univ-${Date.now()}`,
      order_number: `CMD-UNIV-2026-${Math.floor(Math.random() * 900 + 100)}`,
      delivery_campus: order.delivery_campus,
      contact_person: order.contact_person,
      contact_phone: order.contact_phone,
      items: order.items,
      total_amount: order.total_amount,
      currency: "XOF",
      status: "processing",
      tracking_number: `TRK-BEN-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
      pdf_order_url: `/documents/bon-commande.pdf`,
      created_at: new Date().toISOString(),
    };
    mockUniversityOrders.unshift(newOrd);
    return newOrd;
  }
}

export async function getUniversityRoyalties() {
  try {
    return await bffGet<typeof mockUniversityRoyalties>("/university/royalties/");
  } catch {
    return { ...mockUniversityRoyalties };
  }
}

export async function requestUniversityRoyaltyWithdrawal(amount: number): Promise<boolean> {
  try {
    await bffPost("/university/royalties/withdraw/", { amount });
    return true;
  } catch {
    mockUniversityRoyalties.available_balance = Math.max(0, mockUniversityRoyalties.available_balance - amount);
    mockUniversityRoyalties.total_paid += amount;
    return true;
  }
}

export async function getUniversityProfile(): Promise<UniversityProfileData> {
  try {
    return await bffGet<UniversityProfileData>("/university/profile/");
  } catch {
    return { ...mockUniversityProfile };
  }
}

export async function updateUniversityProfile(updates: Partial<UniversityProfileData>): Promise<UniversityProfileData> {
  try {
    return await bffPatch<UniversityProfileData>("/university/profile/", updates);
  } catch {
    mockUniversityProfile = { ...mockUniversityProfile, ...updates };
    return { ...mockUniversityProfile };
  }
}

/**
 * Générateur & Téléchargement du Catalogue Officiel de Bouquet en Document Word / Texte.
 */
export function exportBouquetCatalogWord(bouquet: UniversityBouquet): void {
  const content = `===================================================================\n` +
    `UNIVERSITÉ D'ABOMEY-CALAVI (UAC) & LAHATHÈQUE ÉDITIONS\n` +
    `CATALOGUE OFFICIEL DU BOUQUET DOCUMENTAIRE NUMÉRIQUE\n` +
    `===================================================================\n\n` +
    `Titre du Bouquet : ${bouquet.title.toUpperCase()}\n` +
    `Faculté Associée : ${bouquet.faculty_code || 'Toutes facultés'}\n` +
    `Discipline       : ${bouquet.discipline || 'Pluridisciplinaire'}\n` +
    `Volumes Inclus   : ${bouquet.books_count} ouvrages académiques et traités\n` +
    `Période          : Du ${bouquet.start_date || '01/01/2026'} au ${bouquet.end_date || '31/12/2026'}\n` +
    `Tarif Annuel     : ${bouquet.annual_price.toLocaleString('fr-FR')} ${bouquet.currency}\n\n` +
    `-------------------------------------------------------------------\n` +
    `LISTE BIBLIOGRAPHIQUE DES OUVRAGES DU BOUQUET\n` +
    `-------------------------------------------------------------------\n\n` +
    bouquet.sample_books.map((b, i) => `${i + 1}. "${b.title}" — ${b.author} (Format : Numérique EPUB/PDF, Protection DRM Readium LCP)`).join("\n") +
    `\n\n===================================================================\n` +
    `Document généré le ${new Date().toLocaleDateString('fr-FR')} par le Portail Universitaire LAHAThèque.\n`;

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Catalogue_${bouquet.title.replace(/\s+/g, "_")}_LAHA.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
