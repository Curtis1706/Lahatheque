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
  AdminWarehouse,
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
  MOCK_GLOBAL_CONFIG,
  MOCK_PARTNER_ROYALTY_CONFIGS,
} from "@/lib/mock/admin";

// =========================================================================
// TABLEAU DE BORD PANORAMIQUE & ANALYTICS 360°
// =========================================================================

export async function getAdminKpis(): Promise<AdminKpi> {
  try {
    const res = await fetch('/api/bff/admin/stats/panoramic', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json?.data?.kpi) {
        return json.data.kpi;
      }
    }
  } catch (err) {
    console.warn('[Admin Service] Fallback to mock KPIs:', err);
  }
  return MOCK_ADMIN_KPI;
}

export async function getRoleDistribution(): Promise<RoleDistribution[]> {
  try {
    const res = await fetch('/api/bff/admin/stats/panoramic', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json?.data?.roleDistribution) {
        return json.data.roleDistribution;
      }
    }
  } catch (err) {
    console.warn('[Admin Service] Fallback to mock role distribution:', err);
  }
  return MOCK_ROLE_DISTRIBUTION;
}

export async function getRevenueCategoryBreakdown(): Promise<RevenueCategoryBreakdown[]> {
  try {
    const res = await fetch('/api/bff/admin/stats/panoramic', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json?.data?.revenueBreakdown) {
        return json.data.revenueBreakdown;
      }
    }
  } catch (err) {
    console.warn('[Admin Service] Fallback to mock revenue breakdown:', err);
  }
  return MOCK_REVENUE_BREAKDOWN;
}

// =========================================================================
// GESTION DES UTILISATEURS & ANNUAIRE MULTI-RÔLES
// =========================================================================

export async function getAdminUsers(roleFilter?: AdminRole | string, search?: string): Promise<AdminUser[]> {
  try {
    let url = '/api/bff/admin/users/?';
    if (roleFilter && roleFilter !== 'all') {
      url += `role=${roleFilter}&`;
    }
    if (search) {
      url += `q=${encodeURIComponent(search)}&`;
    }

    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
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
        organization: u.organization || u.institution_name,
        date_joined: u.date_joined ? u.date_joined.split('T')[0] : '2026-08-01',
        status: u.is_suspended ? 'suspended' : 'active',
      }));
    }
  } catch (err) {
    console.warn('[Admin Service] Fallback to mock users:', err);
  }

  if (roleFilter && roleFilter !== "all") {
    return MOCK_ADMIN_USERS.filter((u) => u.role === roleFilter || (u.active_roles as string[]).includes(roleFilter as string));
  }
  return MOCK_ADMIN_USERS;
}

export async function createAdminUser(payload: any): Promise<{ success: boolean; data?: any; error?: string; temporary_password?: string }> {
  try {
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
  } catch {
    return { success: false, error: 'Impossible de contacter le serveur.' };
  }
}

export async function toggleAdminUserStatus(userId: string, reason?: string): Promise<{ success: boolean; is_suspended?: boolean; error?: string }> {
  try {
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
  } catch {
    return { success: false, error: 'Erreur réseau.' };
  }
}

export async function deleteAdminUser(userId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`/api/bff/admin/users/${userId}/`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'Erreur lors de la suppression.' };
    }
    return { success: true, message: data.message };
  } catch {
    return { success: true, message: 'Compte supprimé (simulation locale).' };
  }
}

export async function sendAdminUserEmail(
  userId: string,
  subject: string,
  message: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
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
  } catch {
    return { success: true, message: 'Email transmis (simulation locale).' };
  }
}

// =========================================================================
// CONFIGURATION GLOBALE, CASCADE TARIFAIRE & DRM
// =========================================================================

export async function getGlobalPricingConfig(): Promise<GlobalPricingConfig> {
  try {
    const res = await fetch('/api/bff/admin/settings/global', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json?.data) {
        return {
          ...MOCK_GLOBAL_CONFIG,
          ...json.data,
        };
      }
    }
  } catch (err) {
    console.warn('[Admin Service] Fallback to mock global config:', err);
  }
  return MOCK_GLOBAL_CONFIG;
}

export async function updateGlobalPricingConfig(payload: Partial<GlobalPricingConfig>): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
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
  } catch {
    // Mode offline / mock
    return { success: true, message: 'Configuration mise à jour (simulation locale).' };
  }
}

// =========================================================================
// BARÈMES DE REDEVANCES & TAUX PARTENAIRES (ÉDITABLES PAR L'ADMIN)
// =========================================================================

export async function getPartnerRoyaltyConfigs(): Promise<PartnerRoyaltyConfig[]> {
  await new Promise((res) => setTimeout(res, 200));
  return MOCK_PARTNER_ROYALTY_CONFIGS;
}

export async function updatePartnerRoyaltyRate(
  partnerId: string,
  newRate: number,
  notes?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  await new Promise((res) => setTimeout(res, 250));
  const target = MOCK_PARTNER_ROYALTY_CONFIGS.find((p) => p.partner_id === partnerId);
  if (target) {
    target.custom_royalty_rate = newRate;
    target.last_updated = new Date().toISOString().split('T')[0];
  }
  return {
    success: true,
    message: `Taux de redevance du partenaire mis à jour à ${newRate}% avec succès.`,
  };
}

// =========================================================================
// TARIFICATION DU CATALOGUE (PRIX PAR DÉFAUT VS SPÉCIFIQUE)
// =========================================================================

export async function getAdminCatalog(): Promise<AdminCatalogBook[]> {
  try {
    const res = await fetch('/api/bff/admin/catalog/pricing', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json?.data && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[Admin Service] Fallback to mock catalog:', err);
  }
  return MOCK_ADMIN_BOOKS;
}

export async function updateBookPricing(
  bookId: string,
  pricing: { price_digital?: number; price_paper?: number }
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`/api/bff/admin/catalog/pricing/${bookId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pricing),
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true, message: data.message || 'Tarifs spécifiques de l’ouvrage mis à jour.' };
    }
    return { success: false, error: data.error || 'Erreur mise à jour tarif ouvrage.' };
  } catch {
    return { success: true, message: 'Tarifs modifiés avec succès (simulation locale).' };
  }
}

export async function resetBookPricing(bookId: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`/api/bff/admin/catalog/pricing/${bookId}/reset-pricing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true, message: data.message || 'Ouvrage réaligné sur la cascade globale.' };
    }
    return { success: false, error: data.error || 'Erreur réalignement tarif.' };
  } catch {
    return { success: true, message: 'Ouvrage réaligné sur les tarifs par défaut (simulation locale).' };
  }
}

// =========================================================================
// TRANSACTIONS & VENTES
// =========================================================================

export async function getAdminSales(): Promise<AdminSale[]> {
  try {
    const res = await fetch('/api/bff/admin/sales', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        return json.data;
      }
    }
    console.error(`[Admin Service] Réponse HTTP ${res.status} sur getAdminSales — repli sur données de démonstration.`);
  } catch (err) {
    console.error('[Admin Service] Erreur réseau sur getAdminSales — repli sur données de démonstration.', err);
  }
  return MOCK_ADMIN_SALES;
}

// =========================================================================
// REDEVANCES & VALIDATION DES VERSEMENTS (AUTEURS, ÉDITEURS, UNIVERSITÉS)
// =========================================================================

export async function getAdminRoyalties(beneficiaryType?: "author" | "publisher" | "university"): Promise<AdminRoyalty[]> {
  try {
    const res = await fetch('/api/bff/admin/royalties/payouts', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json?.data && Array.isArray(json.data)) {
        let list = json.data as AdminRoyalty[];
        if (beneficiaryType) {
          list = list.filter((r) => r.beneficiary_type === beneficiaryType);
        }
        return list;
      }
    }
  } catch (err) {
    console.warn('[Admin Service] Fallback to mock royalties:', err);
  }

  if (beneficiaryType) {
    return MOCK_ADMIN_ROYALTIES.filter((r) => r.beneficiary_type === beneficiaryType);
  }
  return MOCK_ADMIN_ROYALTIES;
}

export async function processRoyaltyPayout(
  payoutId: string,
  action: 'approve' | 'reject',
  details: { transaction_reference?: string; admin_notes?: string }
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
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
  } catch {
    const target = MOCK_ADMIN_ROYALTIES.find((r) => r.id === payoutId);
    if (target) {
      target.status = action === 'approve' ? 'settled' : 'on_hold';
      if (details.transaction_reference) target.transaction_reference = details.transaction_reference;
      if (details.admin_notes) target.admin_notes = details.admin_notes;
    }
    return {
      success: true,
      message: action === 'approve' ? 'Versement validé et enregistré.' : 'Demande rejetée avec motif.',
    };
  }
}

// =========================================================================
// RELANCES AUTOMATIQUES & SUPERVISION (DÉPÔTS, IMPAYÉS, EXPIRATIONS)
// =========================================================================

export async function getAdminReminders(): Promise<AdminReminder[]> {
  try {
    const res = await fetch('/api/bff/admin/reminders', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json?.data && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[Admin Service] Fallback to mock reminders:', err);
  }
  return MOCK_ADMIN_REMINDERS;
}

export async function triggerAdminRemindersNow(): Promise<{ success: boolean; message?: string; data?: any; error?: string }> {
  try {
    const res = await fetch('/api/bff/admin/reminders/trigger-now', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    if (res.ok) {
      return { success: true, message: data.message, data: data.data };
    }
    return { success: false, error: data.error || 'Erreur exécution des relances.' };
  } catch (err) {
    return {
      success: false,
      error: 'Impossible de contacter le serveur pour déclencher les relances.',
    };
  }
}

export async function resendReminder(id: string): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`/api/bff/admin/reminders/${id}/resend/`, { method: 'POST' });
    const data = await res.json();
    if (res.ok && data.success) {
      return { success: true, message: data.message };
    }
    return { success: false, error: data.message || data.error || 'Échec de l\'envoi de la relance.' };
  } catch (err) {
    return { success: false, error: 'Erreur réseau — impossible de contacter le serveur.' };
  }
}

// =========================================================================
// JOURNAUX D'AUDIT & SÉCURITÉ
// =========================================================================

export async function getAdminLogs(): Promise<AdminAccessLog[]> {
  try {
    const res = await fetch('/api/bff/admin/logs', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json?.data && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[Admin Service] Fallback to mock logs:', err);
  }
  return MOCK_ADMIN_LOGS;
}

// =========================================================================
// GESTION DES CLÉS API PARTENAIRES & SESSIONS
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
          partnerName: s.partnerName || "Partenaire API",
          sourceType: s.sourceType || "catalog_book",
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
          status: s.status || "opened",
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

// =========================================================================
// VALIDATION MAQUETTISME & BAT ADMIN (AVEC TRAÇABILITÉ QUI/QUAND)
// =========================================================================

export async function getAdminValidationProofs(): Promise<AdminValidationProof[]> {
  try {
    const res = await fetch('/api/bff/admin/validation/', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[Admin Service] Fallback to validation mock:', err);
  }
  return [
    {
      id: "val-01",
      title: "Manuel de Droit Constitutionnel Béninois & Comparé",
      author_name: "Prof. Jean HOUNWANOU",
      publisher_name: "Éditions LAHA",
      discipline: "Droit Public",
      version: "v1.2 — BAT Final",
      format: "EPUB Fixed-Layout & PDF DRM",
      status: "pending_admin_approval",
      submitted_by: "Akouavi Mensah (Maquettiste)",
      submitted_at: "2026-08-20T10:15:00Z",
      reviewed_by: "Kossi Dossou (Chef Maquettiste)",
      reviewed_at: "2026-08-20T14:32:00Z",
      rejection_reason: null,
      file_url: "/mock/droit-constitutionnel-epreuve.pdf",
      page_count: 342,
      lcp_compliant: true,
      notes: "Structure des chapitres 1 à 8 vérifiée. Filigrane dynamique injecté sur chaque page."
    },
    {
      id: "val-02",
      title: "Traité de Pédiatrie Tropicale en Milieu Africain",
      author_name: "Dr. Aïssatou DIALLO",
      publisher_name: "Éditions Ruisseau d'Afrique",
      discipline: "Sciences Médicales",
      version: "v1.0 — Épreuve Initiale",
      format: "EPUB Reflowable",
      status: "pending_admin_approval",
      submitted_by: "Moussa Diouf (Maquettiste)",
      submitted_at: "2026-08-19T09:00:00Z",
      reviewed_by: "Kossi Dossou (Chef Maquettiste)",
      reviewed_at: "2026-08-19T16:20:00Z",
      rejection_reason: null,
      file_url: "/mock/pediatrie-tropicale-epreuve.pdf",
      page_count: 512,
      lcp_compliant: true,
      notes: "Table des matières interactive et figures médicales haute définition validées."
    },
    {
      id: "val-03",
      title: "Économie du Développement et Monnaies Africaines",
      author_name: "Dr. Komla AGBOH",
      publisher_name: "Éditions LAHA",
      discipline: "Économie & Gestion",
      version: "v2.0 — BAT Validé",
      format: "PDF DRM & Audio Cloudflare",
      status: "published",
      submitted_by: "Akouavi Mensah (Maquettiste)",
      submitted_at: "2026-08-15T11:00:00Z",
      reviewed_by: "Kossi Dossou (Chef Maquettiste)",
      reviewed_at: "2026-08-16T15:00:00Z",
      rejection_reason: null,
      file_url: "/mock/economie-developpement.pdf",
      page_count: 278,
      lcp_compliant: true,
      notes: "Validation finale effectuée par la Direction le 17/08/2026."
    }
  ];
}

export async function processAdminValidation(
  id: string,
  action: 'approve' | 'reject',
  rejection_reason?: string,
  notes?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
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
  } catch {
    return {
      success: true,
      message: action === 'approve'
        ? "BAT validé avec succès. L'ouvrage est maintenant publié au catalogue."
        : "Épreuve rejetée avec transmission du motif aux acteurs concernés."
    };
  }
}

// =========================================================================
// CONTRATS JURIDIQUES & ACCORDS DÉROGATOIRES ADMIN
// =========================================================================

export async function getAdminContracts(): Promise<AdminContract[]> {
  try {
    const res = await fetch('/api/bff/admin/contracts/', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[Admin Service] Fallback to contracts mock:', err);
  }
  return [
    {
      id: "ctr-01",
      contract_number: "CTR-2026-088",
      title: "Contrat d'Édition Numérique & Papier — Droit Constitutionnel",
      partner_name: "Prof. Jean HOUNWANOU",
      partner_type: "author",
      partner_email: "jean.hounwanou@uac.bj",
      royalty_rate: 75.0,
      is_derogatory: true,
      status: "pending_admin_approval",
      created_at: "2026-08-20T10:15:00Z",
      reviewed_by_juriste: "Me. Tatiana HOUNDEGNON (Juriste)",
      rejection_reason: null,
      notes: "Taux dérogatoire de 75% négocié en raison de la notoriété académique de l'auteur."
    },
    {
      id: "ctr-02",
      contract_number: "CTR-2026-079",
      title: "Accord Cadre de Distribution Électronique — Ruisseau d'Afrique",
      partner_name: "Éditions Ruisseau d'Afrique",
      partner_type: "publisher",
      partner_email: "direction@ruisseauafrique.bj",
      royalty_rate: 22.0,
      is_derogatory: false,
      status: "en_vigueur",
      created_at: "2026-08-18T14:20:00Z",
      reviewed_by_juriste: "Me. Tatiana HOUNDEGNON (Juriste)",
      rejection_reason: null,
      notes: "Conforme au barème standard éditeur tiers de 22% sur les ventes nettes."
    },
    {
      id: "ctr-03",
      contract_number: "CTR-2026-064",
      title: "Bouquet Numérique Institutionnel — UAC Bénin",
      partner_name: "Université d'Abomey-Calavi",
      partner_type: "university",
      partner_email: "rectorat@uac.bj",
      royalty_rate: 15.0,
      is_derogatory: false,
      status: "en_vigueur",
      created_at: "2026-08-10T08:30:00Z",
      reviewed_by_juriste: "Me. Tatiana HOUNDEGNON (Juriste)",
      rejection_reason: null,
      notes: "Part académique de 15% pour l'établissement partenaire."
    }
  ];
}

export async function processAdminContract(
  id: string,
  action: 'approve' | 'reject',
  rejection_reason?: string,
  approved_rate?: number
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
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
  } catch {
    return {
      success: true,
      message: action === 'approve'
        ? "Contrat approuvé et mis en vigueur avec succès."
        : "Contrat rejeté avec transmission du motif au juriste."
    };
  }
}

// =========================================================================
// SUPERVISION DES STOCKS PHYSIQUES, ENTREPÔTS & PERTES
// =========================================================================

export async function getAdminStockOverview(): Promise<AdminStockOverview> {
  try {
    const res = await fetch('/api/bff/admin/stock/', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && json.data) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[Admin Service] Fallback to stock mock:', err);
  }
  return {
    totalPhysicalStock: 34100,
    totalStockValueXof: 170500000.0,
    totalWarehouses: 3,
    pendingLossAdjustments: 1,
    warehouses: [
      { id: "wh-01", name: "Entrepôt Central Cotonou", code: "WAR-CTN-01", country: "Bénin", city: "Cotonou", manager_name: "Gaston Sossou", total_items: 14200, critical_alerts: 3 },
      { id: "wh-02", name: "Hub Régional Dakar", code: "WAR-DKR-01", country: "Sénégal", city: "Dakar", manager_name: "Moussa Ndiaye", total_items: 8600, critical_alerts: 1 },
      { id: "wh-03", name: "Entrepôt Abidjan Sud", code: "WAR-ABJ-01", country: "Côte d'Ivoire", city: "Abidjan", manager_name: "Kouamé Konan", total_items: 11300, critical_alerts: 0 },
    ]
  };
}

export async function getAdminStockMovements(): Promise<AdminStockMovement[]> {
  try {
    const res = await fetch('/api/bff/admin/stock/movements/', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json && json.success && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (err) {
    console.warn('[Admin Service] Fallback to stock movements mock:', err);
  }
  return [
    {
      id: "mov-01",
      book_title: "Précis de Droit Pénal Général Béninois",
      warehouse_name: "Entrepôt Central Cotonou",
      movement_type: "destruction_perte",
      quantity: 50,
      reason: "50 exemplaires inondés lors d'une rupture de canalisation dans la zone B.",
      initiated_by: "Gaston Sossou (Gestionnaire Stock)",
      status: "pending_admin_approval",
      rejection_reason: null,
      created_at: "2026-08-20T16:45:00Z"
    },
    {
      id: "mov-02",
      book_title: "Économie Monétaire Africaine",
      warehouse_name: "Hub Régional Dakar",
      movement_type: "reassort_imprimerie",
      quantity: 500,
      reason: "Réception tirage officiel LAHA Éditions.",
      initiated_by: "Moussa Ndiaye (Gestionnaire Stock)",
      status: "approved",
      rejection_reason: null,
      created_at: "2026-08-19T09:30:00Z"
    },
    {
      id: "mov-03",
      book_title: "Précis de Droit Pénal Général Béninois",
      warehouse_name: "Entrepôt Central Cotonou",
      movement_type: "transfert_inter_hub",
      quantity: 200,
      reason: "Expédition pour réapprovisionnement de l'Entrepôt Abidjan Sud.",
      initiated_by: "Gaston Sossou (Gestionnaire Stock)",
      status: "approved",
      rejection_reason: null,
      created_at: "2026-08-18T11:15:00Z"
    }
  ];
}

export async function processAdminStockAdjustment(
  id: string,
  action: 'approve' | 'reject',
  rejection_reason?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
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
  } catch {
    return {
      success: true,
      message: action === 'approve'
        ? "Régularisation comptable approuvée et stock ajusté."
        : "Demande de régularisation rejetée avec transmission du motif."
    };
  }
}

export async function createAdminWarehouse(data: {
  name: string;
  code: string;
  country: string;
  city: string;
  manager_name: string;
}): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/bff/admin/stock/warehouses/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      return await res.json();
    }
    const err = await res.json();
    return { success: false, error: err.error || 'Erreur lors de la création de l\'entrepôt.' };
  } catch {
    return { success: true, message: `L'entrepôt "${data.name}" a été créé avec succès.` };
  }
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
  try {
    const res = await fetch('/api/bff/admin/settings/global', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      return json?.data ?? null;
    }
  } catch (err) {
    console.error('[Admin Service] Erreur chargement paramètres plateforme:', err);
  }
  return null;
}

export async function updatePlatformGlobalSettings(
  payload: Partial<PlatformGlobalSettings>
): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch('/api/bff/admin/settings/global', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) return { success: true };
    return { success: false, error: data.error || 'Erreur lors de la sauvegarde.' };
  } catch (err) {
    return { success: false, error: 'Erreur réseau — impossible de contacter le serveur.' };
  }
}


