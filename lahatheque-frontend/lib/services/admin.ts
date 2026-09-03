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
  GlobalPricingConfig,
  PartnerRoyaltyConfig,
  AdminValidationProof,
  AdminContract,
  AdminStockOverview,
  AdminStockMovement,
  CountrySales,
  AdminSubscriptionItem,
} from "@/lib/types/admin";

// =========================================================================
// TABLEAU DE BORD PANORAMIQUE & ANALYTICS 360°
// =========================================================================

export async function getAdminKpis(): Promise<AdminKpi> {
  const res = await fetch('/api/bff/admin/stats/panoramic', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Erreur chargement KPIs admin: ${res.status}`);
  const json = await res.json();
  if (json?.data?.kpi) {
    return {
      ...json.data.kpi,
      salesCurve: json.data.salesCurve || [],
    };
  }
  return json.data || json;
}

export async function getRoleDistribution(): Promise<RoleDistribution[]> {
  const res = await fetch('/api/bff/admin/stats/panoramic', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Erreur chargement distribution rôles: ${res.status}`);
  const json = await res.json();
  return json?.data?.roleDistribution || json.data || [];
}

export async function getRevenueCategoryBreakdown(): Promise<RevenueCategoryBreakdown[]> {
  const res = await fetch('/api/bff/admin/stats/panoramic', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Erreur chargement répartition revenus: ${res.status}`);
  const json = await res.json();
  return json?.data?.revenueBreakdown || json.data || [];
}

// =========================================================================
// GESTION DES UTILISATEURS & ANNUAIRE MULTI-RÔLES
// =========================================================================

export async function getAdminUsers(roleFilter?: AdminRole | string, search?: string): Promise<AdminUser[]> {
  let url = '/api/bff/admin/users/?';
  if (roleFilter && roleFilter !== 'all') {
    url += `role=${roleFilter}&`;
  }
  if (search) {
    url += `q=${encodeURIComponent(search)}&`;
  }

  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Erreur annuaire utilisateurs: ${res.status}`);
  const data = await res.json();
  const userList = data.results || (Array.isArray(data) ? data : (data.data || []));
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
    avatar: u.avatar || u.avatar_url,
    organization: u.organization || u.institution_name,
    date_joined: u.date_joined ? u.date_joined.split('T')[0] : '2026-08-01',
    status: u.is_suspended ? 'suspended' : 'active',
    extra_info: u.extra_info || {},
  }));
}

export async function createAdminUser(payload: any): Promise<{ success: boolean; data?: any; error?: string; temporary_password?: string }> {
  const res = await fetch('/api/bff/admin/users/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    return { success: false, error: data.error || 'Erreur lors de la création du compte.' };
  }
  return { success: true, data: data.user, temporary_password: data.temporary_password };
}

export async function toggleAdminUserStatus(userId: string, reason?: string): Promise<{ success: boolean; is_suspended?: boolean; error?: string }> {
  const res = await fetch(`/api/bff/admin/users/${userId}/toggle-status/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { success: false, error: data.error || 'Erreur modification statut.' };
  }
  return { success: true, is_suspended: data.is_suspended };
}

export async function deleteAdminUser(userId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch(`/api/bff/admin/users/${userId}/`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!res.ok) {
    return { success: false, error: data.error || 'Erreur lors de la suppression.' };
  }
  return { success: true, message: data.message };
}

export async function sendAdminUserEmail(
  userId: string,
  subject: string,
  message: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch(`/api/bff/admin/users/${userId}/send-email/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, message }),
  });
  const data = await res.json();
  if (!res.ok) {
    return { success: false, error: data.error || 'Erreur lors de l\'envoi de l\'email.' };
  }
  return { success: true, message: data.message };
}

// =========================================================================
// CONFIGURATION GLOBALE, CASCADE TARIFAIRE & DRM
// =========================================================================

export async function getGlobalPricingConfig(): Promise<GlobalPricingConfig> {
  const res = await fetch('/api/bff/admin/settings/global', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Erreur configuration globale: ${res.status}`);
  const json = await res.json();
  return json?.data ?? json;
}

export async function updateGlobalPricingConfig(payload: Partial<GlobalPricingConfig>): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch('/api/bff/admin/settings/global', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (res.ok) {
    return { success: true, message: data.message || 'Configuration globale enregistrée avec succès.' };
  }
  return { success: false, error: data.error || 'Erreur lors de la mise à jour de la configuration.' };
}

// =========================================================================
// BARÈMES DE REDEVANCES & TAUX PARTENAIRES (ÉDITABLES PAR L'ADMIN)
// =========================================================================

export async function getPartnerRoyaltyConfigs(): Promise<PartnerRoyaltyConfig[]> {
  const res = await fetch('/api/bff/admin/royalties/payouts/partners', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Erreur taux partenaires: ${res.status}`);
  const json = await res.json();
  return json.data || json.results || [];
}

export async function updatePartnerRoyaltyRate(
  partnerId: string,
  newRate: number,
  notes?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch('/api/bff/admin/royalties/payouts/partners/rate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ partner_id: partnerId, new_rate: newRate, notes }),
  });
  const json = await res.json();
  if (res.ok && json.success !== false) {
    return { success: true, message: json.message || `Taux de redevance mis à jour à ${newRate}%.` };
  }
  return { success: false, error: json.error || 'Erreur lors de la mise à jour du taux.' };
}

// =========================================================================
// TARIFICATION DU CATALOGUE (PRIX PAR DÉFAUT VS SPÉCIFIQUE)
// =========================================================================

export async function getAdminCatalog(): Promise<AdminCatalogBook[]> {
  const res = await fetch('/api/bff/admin/catalog/pricing/', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Erreur chargement catalogue admin: ${res.status}`);
  const json = await res.json();
  const results = json?.data || json?.results || (Array.isArray(json) ? json : null);
  if (results && Array.isArray(results)) {
    return results;
  }
  return [];
}

export async function updateBookPricing(
  bookId: string,
  pricing: { price_digital?: number; price_paper?: number; title?: string; status?: string }
): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch(`/api/bff/admin/catalog/pricing/${bookId}/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(pricing),
  });
  if (res.ok) {
    const data = await res.json();
    return { success: true, message: data.message || 'Ouvrage mis à jour avec succès.' };
  }
  const errData = await res.json();
  return { success: false, error: errData.error || 'Erreur mise à jour prix.' };
}

export async function resetBookPricing(bookId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch(`/api/bff/admin/catalog/pricing/${bookId}/reset-pricing/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (res.ok) {
    return { success: true, message: data.message || 'Ouvrage réaligné sur la cascade globale.' };
  }
  return { success: false, error: data.error || 'Erreur réalignement tarif.' };
}

export async function deleteAdminCatalogBook(bookId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch(`/api/bff/admin/catalog/pricing/${bookId}/`, {
    method: 'DELETE',
  });
  const data = await res.json().catch(() => ({}));
  if (res.ok) {
    return { success: true, message: data.message || 'Ouvrage supprimé définitivement du catalogue.' };
  }
  return { success: false, error: data.error || 'Erreur lors de la suppression de l\'ouvrage.' };
}

export async function createAdminCatalogBook(formData: FormData): Promise<{ success: boolean; data?: any; error?: string }> {
  const res = await fetch('/api/bff/catalog/my-deposits/', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });
  const json = await res.json().catch(() => ({}));
  if (res.ok && (json.success !== false)) {
    return { success: true, data: json.data || json };
  }
  const errorMsg = json.error || (typeof json.details === 'object' ? JSON.stringify(json.details) : json.detail) || 'Erreur lors de la création de l\'ouvrage.';
  return { success: false, error: errorMsg };
}

export interface RoleDiscounts {
  author: { paper_pct: number; digital_pct: number };
  wholesaler: { paper_pct: number; digital_pct: number };
  university: { paper_pct: number; digital_pct: number };
}

export async function getRoleDiscounts(): Promise<RoleDiscounts | null> {
  try {
    const res = await fetch("/api/bff/admin/catalog/pricing/role-discounts/", {
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch {
    return null;
  }
}

export async function updateRoleDiscounts(data: RoleDiscounts): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch("/api/bff/admin/catalog/pricing/role-discounts/", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      return { success: true, message: json.message || "Politique tarifaire mise à jour avec succès." };
    }
    return { success: false, error: json.error || "Erreur de mise à jour de la politique tarifaire." };
  } catch {
    return { success: false, error: "Erreur de communication avec le serveur." };
  }
}

// =========================================================================
// TRANSACTIONS & VENTES
// =========================================================================

export async function getAdminSales(): Promise<AdminSale[]> {
  const res = await fetch('/api/bff/admin/sales', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Erreur chargement ventes admin: ${res.status}`);
  const json = await res.json();
  return json.data || json.results || [];
}

export async function rotatePartnerApiSecret(keyId: string): Promise<{ clientSecret: string; secretWarning: string } | null> {
  const res = await fetch(`/api/bff/partners/apps/${keyId}/rotate-secret/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Erreur lors de la régénération du secret.");
  const json = await res.json();
  return json.success ? json.data : null;
}

// =========================================================================
// REDEVANCES & VALIDATION DES VERSEMENTS (AUTEURS, ÉDITEURS, UNIVERSITÉS)
// =========================================================================

export async function getAdminRoyalties(beneficiaryType?: "author" | "publisher" | "university"): Promise<AdminRoyalty[]> {
  const res = await fetch('/api/bff/admin/royalties/payouts', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Erreur versements redevances: ${res.status}`);
  const json = await res.json();
  let list = (json.data || json.results || []) as AdminRoyalty[];
  if (beneficiaryType) {
    list = list.filter((r) => r.beneficiary_type === beneficiaryType);
  }
  return list;
}

export async function processRoyaltyPayout(
  payoutId: string,
  action: 'approve' | 'reject',
  details: { transaction_reference?: string; admin_notes?: string }
): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch(`/api/bff/admin/royalties/payouts/${payoutId}/process`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...details }),
  });
  const data = await res.json();
  if (res.ok) {
    return { success: true, message: data.message || 'Demande de versement traitée avec succès.' };
  }
  return { success: false, error: data.error || 'Erreur traitement versement.' };
}

// =========================================================================
// RELANCES AUTOMATIQUES & SUPERVISION (DÉPÔTS, IMPAYÉS, EXPIRATIONS)
// =========================================================================

export async function getAdminReminders(): Promise<AdminReminder[]> {
  const res = await fetch('/api/bff/admin/reminders', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Erreur chargement relances: ${res.status}`);
  const json = await res.json();
  return json.data || json.results || [];
}

export async function triggerAdminRemindersNow(): Promise<{ success: boolean; message?: string; data?: any; error?: string }> {
  const res = await fetch('/api/bff/admin/reminders/trigger-now', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (res.ok) {
    return { success: true, message: data.message, data: data.data };
  }
  return { success: false, error: data.error || 'Erreur exécution des relances.' };
}

export async function resendReminder(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch(`/api/bff/admin/reminders/${id}/resend/`, { method: 'POST' });
  const data = await res.json();
  if (res.ok && data.success) {
    return { success: true, message: data.message };
  }
  return { success: false, error: data.message || data.error || 'Échec de l\'envoi de la relance.' };
}

// =========================================================================
// JOURNAUX D'AUDIT & SÉCURITÉ
// =========================================================================

export async function getAdminLogs(): Promise<AdminAccessLog[]> {
  const res = await fetch('/api/bff/admin/logs', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Erreur journaux d'audit: ${res.status}`);
  const json = await res.json();
  return json.data || json.results || [];
}

// =========================================================================
// GESTION DES CLÉS API PARTENAIRES & SESSIONS
// =========================================================================

export async function getPartnerApiKeys(): Promise<PartnerApiKey[]> {
  const res = await fetch("/api/bff/partners/apps", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Erreur clés API partenaires: ${res.status}`);
  const json = await res.json();
  return json.data || json.results || [];
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

export async function updatePartnerApiKey(
  keyId: string,
  data: Partial<PartnerApiKey>
): Promise<PartnerApiKey | null> {
  const res = await fetch(`/api/bff/partners/apps/${keyId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error("Erreur lors de la mise à jour de la clé API.");
  }

  const json = await res.json();
  return json?.data || null;
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

export async function rotatePartnerApiKeySecret(keyId: string): Promise<{ clientSecret: string; secretWarning?: string } | null> {
  const res = await fetch(`/api/bff/partners/apps/${keyId}/rotate-secret/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erreur lors de la régénération du secret.");
  }

  const json = await res.json();
  if (json && json.success && json.data) {
    return json.data;
  }
  return null;
}

// =========================================================================
// SUPERVISION DES SESSIONS DE LECTURE HÉBERGÉES
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
  const res = await fetch("/api/bff/partners/sessions", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Erreur sessions lecteur: ${res.status}`);
  const json = await res.json();
  const list = json.data || json.results || [];
  return list.map((s: any) => ({
    id: s.id,
    partnerName: s.partnerName || "Partenaire API",
    sourceType: s.sourceType || "catalog_book",
    documentTitle: s.bookTitle || s.documentTitle || "Document Distant",
    userName: s.studentName || s.userName || "Étudiant",
    userEmail: s.studentEmail || s.userEmail || "",
    userIp: s.studentIp || s.userIp || "127.0.0.1",
    progressPercent: s.progressPercent || 0,
    currentPage: s.currentPage || 1,
    totalPages: s.totalPages || 1,
    readingTimeMinutes: s.durationMinutes ?? s.readingTimeMinutes ?? 0,
    quizCompleted: Boolean(s.quizScore !== null && s.quizScore !== undefined),
    quizScore: s.quizScore,
    status: s.status || "opened",
    createdAt: s.startedAt || s.createdAt || "Récemment",
    tokenDemo: s.token || s.tokenDemo || s.id,
  }));
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
// JOURNAUX D'AUDIT & REQUÊTES API
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
  const res = await fetch("/api/bff/partners/logs", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Erreur requêtes API: ${res.status}`);
  const json = await res.json();
  return json.data || json.results || [];
}

// =========================================================================
// VALIDATION MAQUETTISME & BAT ADMIN
// =========================================================================

export async function getAdminValidationProofs(): Promise<AdminValidationProof[]> {
  const res = await fetch('/api/bff/admin/validation/', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Erreur épreuves validation: ${res.status}`);
  const json = await res.json();
  return json.data || json.results || [];
}

export async function getAdminValidationProofById(id: string): Promise<AdminValidationProof> {
  const res = await fetch(`/api/bff/admin/validation/${id}/`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Erreur épreuve validation: ${res.status}`);
  const json = await res.json();
  return json.data || json;
}

export async function processAdminValidation(
  id: string,
  action: 'approve' | 'reject',
  rejection_reason?: string,
  notes?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch(`/api/bff/admin/validation/${id}/process/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, rejection_reason, notes }),
  });
  if (res.ok) {
    return await res.json();
  }
  const err = await res.json();
  return { success: false, error: err.error || 'Erreur lors du traitement de l\'épreuve.' };
}

// =========================================================================
// CONTRATS JURIDIQUES & ACCORDS DÉROGATOIRES ADMIN
// =========================================================================

export async function getAdminContracts(): Promise<AdminContract[]> {
  const res = await fetch('/api/bff/admin/contracts/', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Erreur contrats admin: ${res.status}`);
  const json = await res.json();
  return json.data || json.results || [];
}

export async function getAdminContractById(id: string): Promise<AdminContract> {
  const res = await fetch(`/api/bff/admin/contracts/${id}/`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Erreur contrat admin: ${res.status}`);
  const json = await res.json();
  return json.data || json;
}

export async function processAdminContract(
  id: string,
  action: 'approve' | 'reject',
  rejection_reason?: string,
  approved_rate?: number
): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch(`/api/bff/admin/contracts/${id}/process/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, rejection_reason, approved_rate }),
  });
  if (res.ok) {
    return await res.json();
  }
  const err = await res.json();
  return { success: false, error: err.error || 'Erreur lors du traitement du contrat.' };
}

// =========================================================================
// SUPERVISION DES STOCKS PHYSIQUES, ENTREPÔTS & PERTES
// =========================================================================

export async function getAdminStockOverview(): Promise<AdminStockOverview> {
  const res = await fetch('/api/bff/admin/stock/', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Erreur synthèse stock: ${res.status}`);
  const json = await res.json();
  return json.data || json;
}

export async function getAdminStockMovements(): Promise<AdminStockMovement[]> {
  const res = await fetch('/api/bff/admin/stock/movements/', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Erreur mouvements stock: ${res.status}`);
  const json = await res.json();
  return json.data || json.results || [];
}

export async function processAdminStockAdjustment(
  id: string,
  action: 'approve' | 'reject',
  rejection_reason?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch(`/api/bff/admin/stock/${id}/process-adjustment/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, rejection_reason }),
  });
  if (res.ok) {
    return await res.json();
  }
  const err = await res.json();
  return { success: false, error: err.error || 'Erreur lors du traitement de la régularisation.' };
}

export async function createAdminWarehouse(data: {
  name: string;
  code: string;
  country: string;
  city: string;
  manager_name: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch('/api/bff/admin/stock/warehouses', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (res.ok && json.success !== false) {
    return { success: true, message: json.message || `L'entrepôt "${data.name}" a été créé avec succès.` };
  }
  return { success: false, error: json.error || 'Erreur lors de la création de l\'entrepôt.' };
}

export interface PlatformGlobalSettings {
  id?: string;
  prix_defaut_numerique_xof: number;
  prix_defaut_papier_xof: number;
  prix_defaut_audio_xof: number;
  prix_pass_mensuel_xof: number;
  prix_pass_annuel_xof: number;
  devise_defaut: string;
  watermark_texte_defaut: string;
  watermark_opacite_defaut: number;
  restriction_impression_defaut: boolean;
  restriction_capture_defaut: boolean;
  duree_session_lecture_minutes: number;
  delai_relance_depots_jours: number;
  delai_relance_impayes_jours: number;
  delai_relance_abonnements_jours: number;
  moneroo_actif: boolean;
  stripe_actif: boolean;
  fastermessage_sms_actif: boolean;
  updated_at?: string | null;
}

export async function getPlatformGlobalSettings(): Promise<PlatformGlobalSettings | null> {
  const res = await fetch('/api/bff/admin/settings/global', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Erreur paramètres plateforme: ${res.status}`);
  const json = await res.json();
  return json?.data ?? null;
}

export async function updatePlatformGlobalSettings(
  payload: Partial<PlatformGlobalSettings>
): Promise<{ success: boolean; error?: string }> {
  const res = await fetch('/api/bff/admin/settings/global', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (res.ok) return { success: true };
  return { success: false, error: data.error || 'Erreur lors de la sauvegarde.' };
}

export async function getAdminSalesByCountry(): Promise<CountrySales[]> {
  const res = await fetch('/api/bff/admin/sales/by-country', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Erreur ventes par pays: ${res.status}`);
  const json = await res.json();
  return json.data || json.results || [];
}

export async function getAdminSubscriptions(): Promise<AdminSubscriptionItem[]> {
  const res = await fetch('/api/bff/admin/subscriptions', { cache: 'no-store' });
  if (!res.ok) throw new Error(`Erreur abonnements admin: ${res.status}`);
  const json = await res.json();
  return json.data || json.results || [];
}

// =========================================================================
// FINANCES GLOBALES & REDEVANCES AUTEURS
// =========================================================================

export interface AdminGlobalFinance {
  total_platform_revenue: number;
  breakdown: {
    student_author_orders: { total: number; count: number };
    university_orders: { total: number; count: number };
    wholesale_orders: { total: number; count: number };
  };
  credit: { outstanding_total: number; outstanding_count: number };
  subscriptions: { active_count: number };
  author_payouts: { total_processed: number; total_pending: number; pending_count: number };
}

export interface AuthorRoyaltyReportLine {
  author_id: string;
  author_name: string;
  books_count: number;
  books_sold_total: number;
  royalty_rate_percent: number;
  total_royalties_due: number;
  total_royalties_paid: number;
  total_royalties_outstanding: number;
}

export async function getAdminGlobalFinance(): Promise<AdminGlobalFinance | null> {
  const res = await fetch("/api/bff/admin/finance/global/", { credentials: "include", cache: "no-store" });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || null;
}

export async function getAuthorRoyaltiesReport(): Promise<AuthorRoyaltyReportLine[]> {
  const res = await fetch("/api/bff/admin/finance/author-royalties/", { credentials: "include", cache: "no-store" });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

// =========================================================================
// CATALOGUE DES BOUQUETS DOCUMENTAIRES (ADMIN)
// =========================================================================

export interface BouquetOfferingAdmin {
  id: string;
  title: string;
  bouquet_type: "discipline" | "faculty" | "university" | "country" | "custom";
  discipline: string;
  faculty_code: string;
  target_institution: string | null;
  country: string;
  books_count: number;
  annual_price: number;
  currency: string;
  description: string;
  is_active: boolean;
  custom_book_ids: string[];
}

export async function getBouquetOfferings(): Promise<BouquetOfferingAdmin[]> {
  const res = await fetch("/api/bff/admin/bouquet-offerings/", { credentials: "include", cache: "no-store" });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export async function createBouquetOffering(data: Partial<BouquetOfferingAdmin>): Promise<boolean> {
  const res = await fetch("/api/bff/admin/bouquet-offerings/", {
    method: "POST", credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.ok;
}

export async function updateBouquetOffering(id: string, data: Partial<BouquetOfferingAdmin>): Promise<boolean> {
  const res = await fetch(`/api/bff/admin/bouquet-offerings/${id}/`, {
    method: "PATCH", credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.ok;
}

export async function deleteBouquetOffering(id: string): Promise<boolean> {
  const res = await fetch(`/api/bff/admin/bouquet-offerings/${id}/`, {
    method: "DELETE", credentials: "include",
  });
  return res.ok;
}

// =========================================================================
// SOUMISSIONS DE MANUSCRITS PUBLICS (LEADS)
// =========================================================================

export interface ManuscriptLead {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  book_title: string;
  genre: string;
  country: string;
  summary: string;
  manuscript_file_url: string | null;
  status: "new" | "contacted" | "converted" | "rejected";
  status_display: string;
  created_at: string;
}

export async function getManuscriptLeads(statusFilter?: string): Promise<ManuscriptLead[]> {
  const params = statusFilter && statusFilter !== "all" ? `?status=${statusFilter}` : "";
  const res = await fetch(`/api/bff/rights/admin/manuscript-leads/${params}`, {
    credentials: "include", cache: "no-store",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

export async function updateManuscriptLeadStatus(id: string, status: string): Promise<boolean> {
  const res = await fetch(`/api/bff/rights/admin/manuscript-leads/${id}/`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return res.ok;
}


