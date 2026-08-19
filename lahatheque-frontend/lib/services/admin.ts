import {
  AdminKpi,
  AdminUser,
  RoleDistribution,
  RevenueCategoryBreakdown,
  AdminCatalogBook,
  AdminSale,
  AdminRoyalty,
  AdminReminder,
  AdminAccessLog,
  AdminRole,
  PartnerApiKey,
} from "@/lib/types/admin";
import {
  MOCK_ADMIN_KPI,
  MOCK_ROLE_DISTRIBUTION,
  MOCK_REVENUE_BREAKDOWN,
  MOCK_ADMIN_USERS,
  MOCK_ADMIN_BOOKS,
  MOCK_ADMIN_SALES,
  MOCK_ADMIN_ROYALTIES,
  MOCK_ADMIN_REMINDERS,
  MOCK_ADMIN_LOGS,
} from "@/lib/mock/admin";

export async function getAdminKpis(): Promise<AdminKpi> {
  await new Promise((res) => setTimeout(res, 200));
  return MOCK_ADMIN_KPI;
}

export async function getRoleDistribution(): Promise<RoleDistribution[]> {
  await new Promise((res) => setTimeout(res, 200));
  return MOCK_ROLE_DISTRIBUTION;
}

export async function getRevenueCategoryBreakdown(): Promise<RevenueCategoryBreakdown[]> {
  await new Promise((res) => setTimeout(res, 200));
  return MOCK_REVENUE_BREAKDOWN;
}

export async function getAdminUsers(roleFilter?: AdminRole): Promise<AdminUser[]> {
  await new Promise((res) => setTimeout(res, 250));
  if (roleFilter) {
    return MOCK_ADMIN_USERS.filter((u) => u.role === roleFilter || u.active_roles.includes(roleFilter));
  }
  return MOCK_ADMIN_USERS;
}

export async function getAdminCatalog(): Promise<AdminCatalogBook[]> {
  await new Promise((res) => setTimeout(res, 250));
  return MOCK_ADMIN_BOOKS;
}

export async function getAdminSales(): Promise<AdminSale[]> {
  await new Promise((res) => setTimeout(res, 250));
  return MOCK_ADMIN_SALES;
}

export async function getAdminRoyalties(): Promise<AdminRoyalty[]> {
  await new Promise((res) => setTimeout(res, 200));
  return MOCK_ADMIN_ROYALTIES;
}

export async function getAdminReminders(): Promise<AdminReminder[]> {
  await new Promise((res) => setTimeout(res, 200));
  return MOCK_ADMIN_REMINDERS;
}

export async function getAdminLogs(): Promise<AdminAccessLog[]> {
  await new Promise((res) => setTimeout(res, 250));
  return MOCK_ADMIN_LOGS;
}

// =========================================================================
// API PARTENAIRES & GESTION DES CLÉS (CONNEXION RÉELLE DIRECTE DJANGO)
// =========================================================================

export async function getPartnerApiKeys(): Promise<PartnerApiKey[]> {
  try {
    const res = await fetch("/api/bff/partners/apps", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (error) {
    console.error("[API Service] Erreur récupération clés partenaires:", error);
  }
  return [];
}

export async function createPartnerApiKey(
  data: Omit<PartnerApiKey, "id" | "created_at" | "last_used" | "activeSessionsCount">
): Promise<PartnerApiKey> {
  const res = await fetch("/api/bff/partners/apps", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Erreur lors de la création de la clé API sur le serveur.");
  }

  const json = await res.json();
  if (json && json.success && json.data) {
    return json.data;
  }
  throw new Error(json?.error || "Réponse invalide du serveur");
}

export async function togglePartnerApiKeyStatus(keyId: string): Promise<PartnerApiKey | null> {
  const res = await fetch(`/api/bff/partners/apps/${keyId}/toggle-status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("Erreur lors de la mise à jour du statut.");
  }

  const json = await res.json();
  if (json && json.success && json.data) {
    return json.data;
  }
  return null;
}

export async function revokePartnerApiKey(keyId: string): Promise<boolean> {
  const res = await fetch(`/api/bff/partners/apps/${keyId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("Erreur lors de la suppression de la clé API.");
  }

  return true;
}

// =========================================================================
// SUPERVISION DES SESSIONS DE LECTURE HÉBERGÉES (CONNEXION RÉELLE DJANGO)
// =========================================================================

export interface PartnerReaderSessionItem {
  id: string;
  partnerName: string;
  sourceType: "catalog_book" | "external_url";
  documentTitle: string;
  userName: string;
  userEmail: string;
  userIp: string;
  progressPercent: number;
  currentPage: number;
  totalPages: number;
  readingTimeMinutes: number;
  quizCompleted: boolean;
  quizScore: number | null;
  status: "opened" | "in_progress" | "finished" | "revoked" | "expired";
  createdAt: string;
  tokenDemo: string;
}

export async function getPartnerReaderSessions(): Promise<PartnerReaderSessionItem[]> {
  try {
    const res = await fetch("/api/bff/partners/sessions", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        return json.data.map((s: any) => ({
          id: s.id,
          partnerName: s.partnerName,
          sourceType: s.sourceType,
          documentTitle: s.bookTitle || s.documentTitle || "Document Distant",
          userName: s.studentName || s.userName || "Étudiant",
          userEmail: s.studentEmail || s.userEmail || "",
          userIp: s.studentIp || s.userIp || "127.0.0.1",
          progressPercent: s.progressPercent || 0,
          currentPage: s.currentPage || 1,
          totalPages: s.totalPages || 1,
          readingTimeMinutes: s.durationMinutes || s.readingTimeMinutes || 0,
          quizCompleted: Boolean(s.quizScore !== null && s.quizScore !== undefined),
          quizScore: s.quizScore,
          status: s.status || "created",
          createdAt: s.startedAt || s.createdAt || "Récemment",
          tokenDemo: s.token || s.tokenDemo || s.id,
        }));
      }
    }
  } catch (error) {
    console.error("[API Service] Erreur récupération sessions réelles:", error);
  }
  return [];
}

export async function revokePartnerReaderSession(sessionId: string): Promise<boolean> {
  const res = await fetch(`/api/bff/partners/sessions/${sessionId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    throw new Error("Erreur lors de la révocation de la session.");
  }

  return true;
}

// =========================================================================
// JOURNAUX D'AUDIT & REQUÊTES API (CONNEXION RÉELLE DJANGO)
// =========================================================================

export interface ApiRequestLogItem {
  id: string;
  endpoint: string;
  method: string;
  status: number;
  responseTimeMs: number;
  timestamp: string;
  partner: string;
  clientIp: string;
  requestPayload: string;
  responsePayload: string;
}

export async function getPartnerApiLogs(): Promise<ApiRequestLogItem[]> {
  try {
    const res = await fetch("/api/bff/partners/logs", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (error) {
    console.error("[API Service] Erreur récupération logs réels:", error);
  }
  return [];
}
