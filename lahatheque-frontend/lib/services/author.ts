// ─── Services Async Dashboard Auteur (author) ───────────────────────────────

import type {
  AuthorPublishedBook,
  AuthorSubmission,
  AuthorRoyaltyPayment,
  AuthorDelegateAccess,
  AuthorKpis,
} from "../types/author";

import {
  mockAuthorPublishedBooks,
  mockAuthorSubmissions,
  mockAuthorRoyaltyPayments,
  mockAuthorDelegates,
} from "../mock/author";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── KPIs Auteur ──────────────────────────────────────────────────────────────

export async function getAuthorKpis(): Promise<AuthorKpis> {
  await delay(400);
  const totalSales = mockAuthorPublishedBooks.reduce((acc, b) => acc + b.sales_count, 0);
  const totalDownloads = mockAuthorPublishedBooks.reduce((acc, b) => acc + b.downloads_count, 0);
  const totalRevenueGenerated = mockAuthorPublishedBooks.reduce((acc, b) => acc + b.total_revenue_generated, 0);
  
  const authorPaidRoyalties = mockAuthorRoyaltyPayments
    .filter((p) => p.status === "paid")
    .reduce((acc, p) => acc + p.author_earned_amount, 0);

  const authorPendingRoyalties = mockAuthorRoyaltyPayments
    .filter((p) => p.status === "pending")
    .reduce((acc, p) => acc + p.author_earned_amount, 0);

  const activeSubmissionsCount = mockAuthorSubmissions.filter((s) => s.status !== "published").length;
  const publishedBooksCount = mockAuthorPublishedBooks.length;

  return {
    totalSales,
    totalDownloads,
    totalRevenueGenerated,
    authorPendingRoyalties,
    authorPaidRoyalties,
    nextPaymentDate: "05 Octobre 2025",
    nextPaymentAmount: authorPendingRoyalties,
    activeSubmissionsCount,
    publishedBooksCount,
    authorName: "Prof. Augustin CHAKIROU",
  };
}

// ─── Mes Livres (Publiés Uniquement) ─────────────────────────────────────────

export async function getAuthorPublishedBooks(): Promise<AuthorPublishedBook[]> {
  await delay(400);
  return [...mockAuthorPublishedBooks];
}

export async function getAuthorPublishedBookDetails(bookId: string): Promise<AuthorPublishedBook | null> {
  await delay(300);
  return mockAuthorPublishedBooks.find((b) => b.id === bookId) || mockAuthorPublishedBooks[0];
}

// ─── Mes Dépôts (Flux en 2 Étapes) ───────────────────────────────────────────

export async function getAuthorSubmissions(): Promise<AuthorSubmission[]> {
  await delay(400);
  return [...mockAuthorSubmissions];
}

export async function createAuthorSubmission(
  title: string,
  manuscriptFileUrl: string,
  versionType: "preview" | "brouillon" | "finale",
  summary?: string,
  language?: string
): Promise<AuthorSubmission> {
  await delay(800);
  const newSub: AuthorSubmission = {
    id: `sub-aut-${Date.now().toString().slice(-4)}`,
    title,
    manuscript_file_url: manuscriptFileUrl,
    submitted_at: new Date().toISOString().split("T")[0],
    version_type: versionType,
    status: "study_pending",
    suggested_summary: summary || "Résumé transmis lors de la soumission.",
    suggested_language: language || "Français",
  };

  mockAuthorSubmissions.unshift(newSub);
  return newSub;
}

// ─── Droits & Paiements (Rétribution Propre) ─────────────────────────────────

export async function getAuthorRoyaltyPayments(): Promise<AuthorRoyaltyPayment[]> {
  await delay(400);
  return [...mockAuthorRoyaltyPayments];
}

// ─── Délégation d'Accès (Co-Auteurs & Assistants) ─────────────────────────────

export async function getAuthorDelegates(): Promise<AuthorDelegateAccess[]> {
  await delay(300);
  return [...mockAuthorDelegates];
}

export async function inviteAuthorDelegate(
  name: string,
  email: string,
  role: "co_author" | "assistant"
): Promise<AuthorDelegateAccess> {
  await delay(600);
  const newDel: AuthorDelegateAccess = {
    id: `del-${Date.now().toString().slice(-4)}`,
    name,
    email,
    role,
    status: "invited",
    added_at: new Date().toISOString().split("T")[0],
  };

  mockAuthorDelegates.push(newDel);
  return newDel;
}

export async function removeAuthorDelegate(delegateId: string): Promise<boolean> {
  await delay(400);
  const idx = mockAuthorDelegates.findIndex((d) => d.id === delegateId);
  if (idx !== -1) {
    mockAuthorDelegates.splice(idx, 1);
    return true;
  }
  return false;
}
