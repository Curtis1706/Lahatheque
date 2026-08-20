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

export async function getAdminUsers(roleFilter?: AdminRole | string, search?: string): Promise<AdminUser[]> {
  try {
    let url = '/api/bff/auth/admin/users/?';
    if (roleFilter && roleFilter !== 'all') {
      url += `role=${roleFilter}&`;
    }
    if (search) {
      url += `q=${encodeURIComponent(search)}&`;
    }

    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      const userList = data.results || (Array.isArray(data) ? data : []);
      if (userList.length > 0) {
        return userList.map((u: any) => ({
          id: u.id,
          first_name: u.first_name || 'Utilisateur',
          last_name: u.last_name || '',
          email: u.email,
          role: u.role || 'student',
          active_roles: u.active_roles || [u.role],
          is_active: !u.is_suspended && (u.is_active !== false),
          is_verified: u.is_verified || false,
          country: u.country || 'BJ',
          phone: u.phone || '',
          avatar_url: u.avatar_url,
          institution_name: u.institution_name,
          date_joined: u.date_joined ? u.date_joined.split('T')[0] : '2026-08-01',
        }));
      }
    }
  } catch (err) {
    console.warn('[Admin Service] Fallback to mock users:', err);
  }

  // Fallback mock
  if (roleFilter && roleFilter !== "all") {
    return MOCK_ADMIN_USERS.filter((u) => u.role === roleFilter || (u.active_roles as string[]).includes(roleFilter as string));
  }
  return MOCK_ADMIN_USERS;
}

export async function createAdminUser(payload: any): Promise<{ success: boolean; data?: any; error?: string; temporary_password?: string }> {
  try {
    const res = await fetch('/api/bff/auth/admin/users/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Erreur lors de la création du compte.' };
    }
    return { success: true, data: data.user, temporary_password: data.temporary_password };
  } catch {
    return { success: false, error: 'Impossible de contacter le serveur.' };
  }
}

export async function toggleAdminUserStatus(userId: string, reason?: string): Promise<{ success: boolean; is_suspended?: boolean; error?: string }> {
  try {
    const res = await fetch(`/api/bff/auth/admin/users/${userId}/toggle-status/`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Erreur modification statut.' };
    }
    return { success: true, is_suspended: data.is_suspended };
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
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
