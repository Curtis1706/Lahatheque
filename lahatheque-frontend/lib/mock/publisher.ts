import { BookSubmission, PublisherStats, RoyaltyPayment, SalesTransaction } from "../types/publisher";

export const mockPublisherStats: PublisherStats = {
  total_royalties: 1245000, // En FCFA
  total_views: 4520,
  total_downloads: 1280,
  average_commission_rate: 15 // Taux de commission de la plateforme LAHAThèque (15% pour les redevances)
};

export const mockBookSubmissions: BookSubmission[] = [
  {
    id: "sub-001",
    title: "Introduction à la Microéconomie Africaine",
    subtitle: "Concepts et applications locales",
    isbn_digital: "978-2-3456-789-0",
    isbn_print: "978-2-3456-789-1",
    authors: ["Dr. Amadou DIALLO", "Pr. Koffi MENSAH"],
    price: 12000,
    currency: "FCFA",
    sales_model: "purchase",
    status: "approved",
    created_at: "2026-07-15T10:00:00Z",
    summary: "Un ouvrage de référence couvrant les spécificités des marchés ouest-africains avec des exemples réels du Bénin, du Togo et du Sénégal."
  },
  {
    id: "sub-002",
    title: "Droit Constitutionnel Comparé",
    subtitle: "Étude des cas du Bénin et de la Côte d'Ivoire",
    isbn_digital: "978-2-8765-432-0",
    isbn_print: "978-2-8765-432-1",
    authors: ["Mme. Abla ADJOVI"],
    price: 18500,
    currency: "FCFA",
    sales_model: "subscription",
    status: "pending",
    created_at: "2026-08-01T09:30:00Z",
    summary: "Analyse croisée des régimes juridiques et des réformes constitutionnelles récentes dans l'espace UEMOA."
  },
  {
    id: "sub-003",
    title: "Algorithmique Appliquée en Python",
    subtitle: "Travaux pratiques pour les universités",
    isbn_digital: "978-2-1111-222-0",
    authors: ["Pr. Sékou TOURÉ"],
    price: 9500,
    currency: "FCFA",
    sales_model: "free",
    status: "approved",
    created_at: "2026-06-10T14:20:00Z",
    summary: "Ce manuel universitaire propose une introduction progressive à l'algorithmique en s'appuyant sur le langage Python, de la syntaxe de base aux structures de données complexes."
  },
  {
    id: "sub-004",
    title: "Histoire Générale du Dahomey",
    subtitle: "Des origines à la colonisation",
    isbn_digital: "978-2-9999-888-0",
    isbn_print: "978-2-9999-888-1",
    authors: ["Dr. Justin KOUTON"],
    price: 15000,
    currency: "FCFA",
    sales_model: "purchase",
    status: "rejected",
    created_at: "2026-07-20T16:45:00Z",
    summary: "Une fresque historique documentant la constitution du royaume, son organisation administrative et sa résistance face aux troupes coloniales.",
    reject_reason: "Fichier PDF illisible ou corrompu. Veuillez soumettre à nouveau une version haute résolution."
  },
  {
    id: "sub-005",
    title: "Principes de Comptabilité Générale (SYSCOHADA)",
    subtitle: "Manuel conforme au nouveau référentiel",
    isbn_digital: "978-2-5555-444-0",
    authors: ["Pr. Marc SOW"],
    price: 14000,
    currency: "FCFA",
    sales_model: "subscription",
    status: "draft",
    created_at: "2026-08-08T11:00:00Z",
    summary: "Manuel d'apprentissage pratique de la comptabilité selon le référentiel révisé du SYSCOHADA, avec de nombreux exercices d'entraînement."
  }
];

export const mockRoyaltyPayments: RoyaltyPayment[] = [
  {
    id: "pay-101",
    amount: 500000,
    currency: "FCFA",
    status: "paid",
    payment_date: "2026-06-30T12:00:00Z",
    payment_method: "Virement Bancaire (Ecobank BJ)"
  },
  {
    id: "pay-102",
    amount: 450000,
    currency: "FCFA",
    status: "paid",
    payment_date: "2026-03-31T12:00:00Z",
    payment_method: "Virement Bancaire (Ecobank BJ)"
  },
  {
    id: "pay-103",
    amount: 295000,
    currency: "FCFA",
    status: "processing",
    payment_date: "2026-09-30T12:00:00Z",
    payment_method: "Virement Bancaire (Ecobank BJ)"
  }
];

export const mockSalesTransactions: SalesTransaction[] = [
  {
    id: "tx-201",
    book_title: "Introduction à la Microéconomie Africaine",
    transaction_date: "2026-08-05T14:30:00Z",
    type: "purchase",
    sale_price: 12000,
    royalty_earned: 10200, // 85% de redevance (15% de commission plateforme)
    currency: "FCFA"
  },
  {
    id: "tx-202",
    book_title: "Algorithmique Appliquée en Python",
    transaction_date: "2026-08-04T10:15:00Z",
    type: "subscription_share",
    sale_price: 9500,
    royalty_earned: 1425, // Rétribution proportionnelle à la lecture
    currency: "FCFA"
  },
  {
    id: "tx-203",
    book_title: "Introduction à la Microéconomie Africaine",
    transaction_date: "2026-08-03T18:00:00Z",
    type: "purchase",
    sale_price: 12000,
    royalty_earned: 10200,
    currency: "FCFA"
  },
  {
    id: "tx-204",
    book_title: "Algorithmique Appliquée en Python",
    transaction_date: "2026-08-01T09:00:00Z",
    type: "purchase",
    sale_price: 9500,
    royalty_earned: 8075,
    currency: "FCFA"
  }
];
