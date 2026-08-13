// ─── Services Async Espace Université (librarian) ────────────────────────────

import type {
  UniversityBook,
  UniversityBundle,
  UniversityPaperPurchase,
  UniversityRoyaltyPayment,
  UniversityKpis,
} from "../types/librarian";

import {
  mockUniversityBooks,
  mockUniversityBundles,
  mockUniversityPaperPurchases,
  mockUniversityRoyaltyPayments,
} from "../mock/librarian";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── KPIs Université ──────────────────────────────────────────────────────────

export async function getUniversityKpis(): Promise<UniversityKpis> {
  await delay(400);
  const totalBooksCount = mockUniversityBooks.length;
  const totalConsultations = mockUniversityBooks.reduce((acc, b) => acc + b.consultations_count, 0);
  const totalDownloads = mockUniversityBooks.reduce((acc, b) => acc + b.downloads_count, 0);
  const totalAudioListens = mockUniversityBooks.reduce((acc, b) => acc + b.audio_listens_count, 0);
  const totalRevenue = mockUniversityBooks.reduce((acc, b) => acc + b.revenue_generated, 0);
  const pendingRoyalties = mockUniversityBooks.reduce((acc, b) => acc + b.royalty_15_percent, 0);

  const lastPayment = mockUniversityRoyaltyPayments[1];
  const paidRoyalties = lastPayment ? lastPayment.paid_amount : 0;
  const remainingBalance = lastPayment ? lastPayment.remaining_balance : 0;
  const activeBundlesCount = mockUniversityBundles.filter((b) => b.status === "active").length;

  return {
    totalBooksCount,
    totalConsultations,
    totalDownloads,
    totalAudioListens,
    totalRevenue,
    pendingRoyalties,
    paidRoyalties,
    remainingBalance,
    activeBundlesCount,
    institutionName: "Université d'Abomey-Calavi (UAC)",
  };
}

// ─── Catalogue Établissement par Faculté ─────────────────────────────────────

export async function getUniversityBooks(filters?: {
  search?: string;
  faculty?: string;
  discipline?: string;
}): Promise<UniversityBook[]> {
  await delay(500);
  let list = [...mockUniversityBooks];

  if (filters?.faculty && filters.faculty !== "all") {
    list = list.filter((b) => b.faculty.includes(filters.faculty!));
  }
  if (filters?.discipline && filters.discipline !== "all") {
    list = list.filter((b) => b.discipline === filters.discipline);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.isbn_digital.toLowerCase().includes(q) ||
        b.authors.some((a) => a.toLowerCase().includes(q))
    );
  }
  return list;
}

// ─── Bouquets Documentaires ──────────────────────────────────────────────────

export async function getUniversityBundles(): Promise<UniversityBundle[]> {
  await delay(400);
  return [...mockUniversityBundles];
}

export async function subscribeToBundle(bundleId: string): Promise<boolean> {
  await delay(800);
  const bundle = mockUniversityBundles.find((b) => b.id === bundleId);
  if (bundle) {
    bundle.status = "active";
    return true;
  }
  return false;
}

// ─── Achats Livres Papier ────────────────────────────────────────────────────

export async function getUniversityPaperPurchases(): Promise<UniversityPaperPurchase[]> {
  await delay(400);
  return [...mockUniversityPaperPurchases];
}

export async function createPaperOrder(
  bookTitle: string,
  copiesCount: number,
  unitPrice: number
): Promise<UniversityPaperPurchase> {
  await delay(800);
  const newOrder: UniversityPaperPurchase = {
    id: `pur-pap-${Date.now().toString().slice(-4)}`,
    reference: `CMD-PAP-UAC-2025-${Math.floor(10 + Math.random() * 90)}`,
    date: new Date().toISOString().split("T")[0],
    title: bookTitle,
    copies_count: copiesCount,
    unit_price: unitPrice,
    total_price: copiesCount * unitPrice,
    status: "pending",
  };

  mockUniversityPaperPurchases.unshift(newOrder);
  return newOrder;
}

// ─── Redevances 15% & Relevés de Paiement ────────────────────────────────────

export async function getUniversityRoyaltyPayments(): Promise<UniversityRoyaltyPayment[]> {
  await delay(400);
  return [...mockUniversityRoyaltyPayments];
}
