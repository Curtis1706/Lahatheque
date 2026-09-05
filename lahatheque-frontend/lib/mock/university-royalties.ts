import type {
  UniversityUnitSaleRoyalty,
  UniversityBouquetUsageRoyalty,
  UniversityRoyaltiesDetailData,
} from "../types/university";

export const mockUniversityUnitSales: UniversityUnitSaleRoyalty[] = [
  {
    id: "sale-001",
    transaction_ref: "TX-UNIV-2026-081",
    book_id: "book-001",
    book_title: "Le Rôle du Système Activateur de Plasminogène en Neurobiologie",
    authors: ["Robert L. Medcalf", "Daniel A. Lawrence"],
    discipline: "Neurochirurgie",
    format: "paper",
    quantity: 15,
    unit_price: 7500,
    gross_amount: 112500,
    royalty_rate: 15,
    royalty_amount: 16875,
    currency: "XOF",
    buyer_type: "institution",
    date: "2026-03-02",
  },
  {
    id: "sale-002",
    transaction_ref: "TX-UNIV-2026-079",
    book_id: "book-002",
    book_title: "Avancées en Imagerie Cérébrale",
    authors: ["Tomohiro Sawa", "Takaaki Akaike"],
    discipline: "Imagerie médicale & Radiologie",
    format: "digital",
    quantity: 28,
    unit_price: 5000,
    gross_amount: 140000,
    royalty_rate: 15,
    royalty_amount: 21000,
    currency: "XOF",
    buyer_type: "etudiant",
    date: "2026-03-01",
  },
  {
    id: "sale-003",
    transaction_ref: "TX-UNIV-2026-072",
    book_id: "book-003",
    book_title: "Agricultural Food Consumption, Public Policy, and Farm Household Economics",
    authors: ["Hung-Hao Chang", "Pei-An Liao", "Jiun-Hao Wang"],
    discipline: "Agriculture",
    format: "paper",
    quantity: 40,
    unit_price: 7500,
    gross_amount: 300000,
    royalty_rate: 15,
    royalty_amount: 45000,
    currency: "XOF",
    buyer_type: "grossiste",
    date: "2026-02-27",
  },
  {
    id: "sale-004",
    transaction_ref: "TX-UNIV-2026-068",
    book_id: "book-001",
    book_title: "Le Rôle du Système Activateur de Plasminogène en Neurobiologie",
    authors: ["Robert L. Medcalf", "Daniel A. Lawrence"],
    discipline: "Neurochirurgie",
    format: "digital",
    quantity: 35,
    unit_price: 5000,
    gross_amount: 175000,
    royalty_rate: 15,
    royalty_amount: 26250,
    currency: "XOF",
    buyer_type: "etudiant",
    date: "2026-02-25",
  },
  {
    id: "sale-005",
    transaction_ref: "TX-UNIV-2026-061",
    book_id: "book-004",
    book_title: "Précis de Droit Foncier et Notarial Béninois",
    authors: ["Prof. Joseph Djogbénou", "Me. François KÉRÉKOU"],
    discipline: "Droit Privé",
    format: "paper",
    quantity: 25,
    unit_price: 9000,
    gross_amount: 225000,
    royalty_rate: 15,
    royalty_amount: 33750,
    currency: "XOF",
    buyer_type: "particulier",
    date: "2026-02-20",
  },
  {
    id: "sale-006",
    transaction_ref: "TX-UNIV-2026-055",
    book_id: "book-005",
    book_title: "Économétrie Appliquée aux Marchés Ouest-Africains",
    authors: ["Dr. Christian Agossa"],
    discipline: "Économie & Gestion",
    format: "digital",
    quantity: 45,
    unit_price: 4500,
    gross_amount: 202500,
    royalty_rate: 15,
    royalty_amount: 30375,
    currency: "XOF",
    buyer_type: "etudiant",
    date: "2026-02-18",
  },
  {
    id: "sale-007",
    transaction_ref: "TX-UNIV-2026-049",
    book_id: "book-002",
    book_title: "Avancées en Imagerie Cérébrale",
    authors: ["Tomohiro Sawa", "Takaaki Akaike"],
    discipline: "Imagerie médicale & Radiologie",
    format: "paper",
    quantity: 20,
    unit_price: 7500,
    gross_amount: 150000,
    royalty_rate: 15,
    royalty_amount: 22500,
    currency: "XOF",
    buyer_type: "institution",
    date: "2026-02-14",
  },
];

export const mockUniversityBouquetUsage: UniversityBouquetUsageRoyalty[] = [
  {
    id: "bq-roy-001",
    bouquet_id: "bqt-sante-01",
    bouquet_title: "Bouquet Sciences Médicales & Santé Campus",
    faculty_code: "FSS",
    period: "1er Trimestre 2026",
    books_included_count: 8, // 8 ouvrages de l'université intégrés dans ce bouquet
    total_bouquet_consultations: 18450, // 18 450 lectures totales enregistrées sur le bouquet
    university_consultations: 6450, // 6 450 consultations ciblées sur les 8 ouvrages de l'université
    consultation_share_percent: 34.96, // 34.96% de part d'audience
    bouquet_revenue_allocated: 2850000, // Quote-part d'assiette financière du bouquet
    royalty_rate: 15,
    net_royalty_amount: 427500, // 2 850 000 * 15%
    currency: "XOF",
  },
  {
    id: "bq-roy-002",
    bouquet_id: "bqt-droit-02",
    bouquet_title: "Bouquet Droit OHADA & Contentieux des Affaires",
    faculty_code: "FADESP",
    period: "1er Trimestre 2026",
    books_included_count: 12, // 12 ouvrages de l'université intégrés
    total_bouquet_consultations: 24200,
    university_consultations: 9680,
    consultation_share_percent: 40.0, // 40% de part d'usage sur le bouquet
    bouquet_revenue_allocated: 3600000,
    royalty_rate: 15,
    net_royalty_amount: 540000, // 3 600 000 * 15%
    currency: "XOF",
  },
  {
    id: "bq-roy-003",
    bouquet_id: "bqt-eco-03",
    bouquet_title: "Bouquet Économie Rurale, Agronomie & Développement",
    faculty_code: "FASEG",
    period: "1er Trimestre 2026",
    books_included_count: 5, // 5 ouvrages de l'université
    total_bouquet_consultations: 11200,
    university_consultations: 3136,
    consultation_share_percent: 28.0, // 28% d'usage
    bouquet_revenue_allocated: 1450000,
    royalty_rate: 15,
    net_royalty_amount: 217500, // 1 450 000 * 15%
    currency: "XOF",
  },
];

export function buildUniversityRoyaltiesDetailData(
  contractualRate = 15,
  currency = "XOF"
): UniversityRoyaltiesDetailData {
  const paperSales = mockUniversityUnitSales.filter((s) => s.format === "paper");
  const digitalSales = mockUniversityUnitSales.filter((s) => s.format === "digital");

  const paperGross = paperSales.reduce((acc, s) => acc + s.gross_amount, 0);
  const paperCopies = paperSales.reduce((acc, s) => acc + s.quantity, 0);
  const paperRoyalties = Math.round(paperGross * (contractualRate / 100));

  const digitalGross = digitalSales.reduce((acc, s) => acc + s.gross_amount, 0);
  const digitalLicenses = digitalSales.reduce((acc, s) => acc + s.quantity, 0);
  const digitalRoyalties = Math.round(digitalGross * (contractualRate / 100));

  const bouquetConsultations = mockUniversityBouquetUsage.reduce(
    (acc, b) => acc + b.university_consultations,
    0
  );
  const bouquetGrossAllocated = mockUniversityBouquetUsage.reduce(
    (acc, b) => acc + b.bouquet_revenue_allocated,
    0
  );
  const bouquetRoyalties = Math.round(bouquetGrossAllocated * (contractualRate / 100));

  const totalEarned = paperRoyalties + digitalRoyalties + bouquetRoyalties;
  const totalPaid = 650000;
  const availableBalance = Math.max(0, totalEarned - totalPaid);

  return {
    available_balance: availableBalance,
    total_paid: totalPaid,
    contractual_rate: contractualRate,
    currency,
    min_withdrawal_threshold: 100000,
    totals_summary: {
      paper_sales_count: paperCopies,
      paper_gross_total: paperGross,
      paper_royalties_total: paperRoyalties,
      digital_sales_count: digitalLicenses,
      digital_gross_total: digitalGross,
      digital_royalties_total: digitalRoyalties,
      bouquet_consultations_count: bouquetConsultations,
      bouquet_gross_allocated: bouquetGrossAllocated,
      bouquet_royalties_total: bouquetRoyalties,
    },
    unit_sales: mockUniversityUnitSales.map((s) => ({
      ...s,
      royalty_rate: contractualRate,
      royalty_amount: Math.round(s.gross_amount * (contractualRate / 100)),
    })),
    bouquet_royalties: mockUniversityBouquetUsage.map((b) => ({
      ...b,
      royalty_rate: contractualRate,
      net_royalty_amount: Math.round(b.bouquet_revenue_allocated * (contractualRate / 100)),
    })),
  };
}
