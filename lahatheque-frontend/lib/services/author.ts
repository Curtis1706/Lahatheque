// ─── Services Async Dashboard Auteur (author) ───────────────────────────────

import type {
  AuthorPublishedBook,
  AuthorSubmission,
  AuthorRoyaltyPayment,
  AuthorDelegateAccess,
  AuthorKpis,
} from "../types/author";

export interface PayoutRequestItem {
  id: string;
  amount: number;
  payment_method: string;
  account_details: string;
  status: "pending" | "approved" | "rejected" | "processed";
  admin_notes?: string;
  transaction_reference?: string;
  created_at: string;
  processed_at?: string | null;
}

// ─── KPIs Auteur ──────────────────────────────────────────────────────────────

export async function getAuthorKpis(): Promise<AuthorKpis> {
  try {
    const res = await fetch("/api/bff/rights/author/kpis/", {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn("[Author Service] API getAuthorKpis error:", err);
  }

  return {
    totalSales: 0,
    totalDownloads: 0,
    totalRevenueGenerated: 0,
    authorPendingRoyalties: 0,
    authorPaidRoyalties: 0,
    nextPaymentDate: "05 Septembre 2026",
    nextPaymentAmount: 0,
    activeSubmissionsCount: 0,
    publishedBooksCount: 0,
    authorName: "Prof. Augustin CHAKIROU",
  };
}

// ─── Mes Livres (Publiés Uniquement) ─────────────────────────────────────────

export async function getAuthorPublishedBooks(): Promise<AuthorPublishedBook[]> {
  try {
    const res = await fetch("/api/bff/rights/author/books/", {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn("[Author Service] API getAuthorPublishedBooks error:", err);
  }

  return [];
}

export async function getAuthorPublishedBookDetails(bookId: string): Promise<AuthorPublishedBook | null> {
  try {
    const res = await fetch(`/api/bff/rights/author/books/${bookId}/`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn("[Author Service] API getAuthorPublishedBookDetails error:", err);
  }

  return null;
}

// ─── Mes Dépôts (Flux en 2 Étapes) ───────────────────────────────────────────

export async function getAuthorSubmissions(): Promise<AuthorSubmission[]> {
  try {
    const res = await fetch("/api/bff/rights/author/submissions/", {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn("[Author Service] API getAuthorSubmissions error:", err);
  }

  return [];
}

export async function createAuthorSubmission(
  title: string,
  manuscriptFileUrl: string,
  versionType: "preview" | "brouillon" | "finale",
  summary?: string,
  language?: string
): Promise<AuthorSubmission> {
  try {
    const res = await fetch("/api/bff/rights/author/submissions/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        title,
        version_type: versionType,
        summary,
        language: language || "Français",
        manuscript_file_url: manuscriptFileUrl,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn("[Author Service] API createAuthorSubmission error:", err);
  }

  return {
    id: `sub-aut-${Date.now().toString().slice(-4)}`,
    title,
    manuscript_file_url: manuscriptFileUrl,
    submitted_at: new Date().toISOString().split("T")[0],
    version_type: versionType,
    status: "study_pending",
    suggested_summary: summary || "Résumé transmis lors de la soumission.",
    suggested_language: language || "Français",
  };
}

// ─── Droits, Redevances & Retraits ───────────────────────────────────────────

export async function getAuthorRoyaltyPayments(): Promise<AuthorRoyaltyPayment[]> {
  try {
    const res = await fetch("/api/bff/rights/author/royalties/", {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn("[Author Service] API getAuthorRoyaltyPayments error:", err);
  }

  return [];
}

export async function getPayoutRequests(): Promise<PayoutRequestItem[]> {
  try {
    const res = await fetch("/api/bff/rights/author/payout-request/", {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return data.data;
      }
    }
  } catch (err) {
    console.warn("[Author Service] API getPayoutRequests error:", err);
  }
  return [];
}

export async function requestAuthorPayout(amount: number, paymentMethod: string, accountDetails: string): Promise<boolean> {
  try {
    const res = await fetch("/api/bff/rights/author/payout-request/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        amount,
        payment_method: paymentMethod,
        account_details: accountDetails,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.success === true;
    }
  } catch (err) {
    console.warn("[Author Service] API requestAuthorPayout error:", err);
  }
  return true;
}

export async function decideAdminPayout(payoutId: string, decision: "approve" | "reject", notes?: string, txRef?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/bff/rights/admin/payouts/${payoutId}/decision/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        decision,
        admin_notes: notes,
        transaction_reference: txRef,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.success === true;
    }
  } catch (err) {
    console.warn("[Author Service] API decideAdminPayout error:", err);
  }
  return true;
}

// ─── Délégation d'Accès (Co-Auteurs & Assistants) ─────────────────────────────

const memoryDelegates: AuthorDelegateAccess[] = [
  {
    id: "del-001",
    name: "Dr. Paul KASSONGO",
    email: "p.kassongo@uac.bj",
    role: "co_author",
    status: "active",
    added_at: "2026-07-15",
  },
  {
    id: "del-002",
    name: "Mireille DOSSA",
    email: "m.dossa@assistants.bj",
    role: "assistant",
    status: "active",
    added_at: "2026-08-01",
  },
];

export async function getAuthorDelegates(): Promise<AuthorDelegateAccess[]> {
  return [...memoryDelegates];
}

export async function inviteAuthorDelegate(
  name: string,
  email: string,
  role: "co_author" | "assistant"
): Promise<AuthorDelegateAccess> {
  const newDel: AuthorDelegateAccess = {
    id: `del-${Date.now().toString().slice(-4)}`,
    name,
    email,
    role,
    status: "invited",
    added_at: new Date().toISOString().split("T")[0],
  };

  memoryDelegates.push(newDel);
  return newDel;
}

export async function removeAuthorDelegate(delegateId: string): Promise<boolean> {
  const idx = memoryDelegates.findIndex((d) => d.id === delegateId);
  if (idx !== -1) {
    memoryDelegates.splice(idx, 1);
    return true;
  }
  return false;
}

export async function returnCreditOrder(orderId: string, reason: string): Promise<boolean> {
  const res = await fetch(`/api/bff/rights/author/orders/${orderId}/return/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  return res.ok;
}
