// ─── Services Async Dashboard Client (Lecteur / Étudiant) ───────────────────

import type {
  ClientBookAccess,
  ClientSubscription,
  ClientOrder,
  ClientUniversityAffiliation,
  ClientOverviewKpis,
} from "../types/student";

import {
  mockClientBooks,
  mockClientSubscriptions,
  mockClientOrders,
  mockClientAffiliation,
} from "../mock/student";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Vue d'ensemble KPIs ───────────────────────────────────────────────────────

export async function getClientOverviewKpis(): Promise<ClientOverviewKpis> {
  await delay(400);
  const totalBooksInLibrary = mockClientBooks.length;
  const currentReadingBook = mockClientBooks.reduce((prev, curr) =>
    (curr.progress_percent > prev.progress_percent ? curr : prev), mockClientBooks[0]);

  const activeSub = mockClientSubscriptions.find((s) => s.status === "active");
  const activeSubscriptionStatus = activeSub ? activeSub.name : "Aucun abonnement actif";
  const unpaidOrders = mockClientOrders.filter((o) => o.status === "pending").length;
  const hasUniversityAffiliation = mockClientAffiliation.status === "approved";

  return {
    totalBooksInLibrary,
    currentReadingBook,
    activeSubscriptionStatus,
    unpaidOrdersCount: unpaidOrders,
    hasUniversityAffiliation,
    institutionName: mockClientAffiliation.university_name,
  };
}

// ─── Ma Bibliothèque & Extraits ──────────────────────────────────────────────

export async function getClientLibraryBooks(filterAccessType?: string): Promise<ClientBookAccess[]> {
  await delay(400);
  let list = [...mockClientBooks];
  if (filterAccessType && filterAccessType !== "all") {
    list = list.filter((b) => b.access_type === filterAccessType);
  }
  return list;
}

export async function getClientBookDetails(bookId: string): Promise<ClientBookAccess | null> {
  await delay(300);
  return mockClientBooks.find((b) => b.id === bookId) || mockClientBooks[0];
}

// ─── Commandes & Achats Papier ───────────────────────────────────────────────

export async function getClientOrders(): Promise<ClientOrder[]> {
  await delay(400);
  return [...mockClientOrders];
}

export async function orderPaperCopy(
  bookId: string,
  bookTitle: string,
  unitPrice: number,
  shippingAddress: string
): Promise<ClientOrder> {
  await delay(800);
  const newOrder: ClientOrder = {
    id: `ord-cli-${Date.now().toString().slice(-4)}`,
    reference: `CMD-PAP-2025-${Math.floor(10 + Math.random() * 90)}`,
    date: new Date().toISOString().split("T")[0],
    book_title: `Exemplaire Papier : ${bookTitle}`,
    format: "paper",
    copies_count: 1,
    unit_price: unitPrice,
    total_price: unitPrice,
    status: "pending",
    invoice_url: "/invoices/FAC-PAP-NEW.pdf",
    shipping_address: shippingAddress,
  };

  mockClientOrders.unshift(newOrder);
  return newOrder;
}

// ─── Abonnements ─────────────────────────────────────────────────────────────

export async function getClientSubscriptions(): Promise<ClientSubscription[]> {
  await delay(400);
  return [...mockClientSubscriptions];
}

export async function cancelClientSubscription(subId: string): Promise<boolean> {
  await delay(600);
  const sub = mockClientSubscriptions.find((s) => s.id === subId);
  if (sub) {
    sub.auto_renew = false;
    return true;
  }
  return false;
}

// ─── Affiliation Universitaire Optionnelle ────────────────────────────────────

export async function getClientUniversityAffiliation(): Promise<ClientUniversityAffiliation> {
  await delay(300);
  return { ...mockClientAffiliation };
}

export async function submitUniversityAffiliation(
  universityName: string,
  facultyName: string,
  cardNumber: string,
  proofDocumentUrl: string
): Promise<ClientUniversityAffiliation> {
  await delay(800);
  mockClientAffiliation.university_name = universityName;
  mockClientAffiliation.faculty_name = facultyName;
  mockClientAffiliation.student_card_number = cardNumber;
  mockClientAffiliation.proof_document_url = proofDocumentUrl;
  mockClientAffiliation.status = "pending";
  mockClientAffiliation.requested_at = new Date().toISOString().split("T")[0];

  return { ...mockClientAffiliation };
}
