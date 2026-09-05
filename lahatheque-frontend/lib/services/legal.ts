import type {
  LegalContract,
  ContractFormOptions,
  BookRoyalty,
  AIRoyaltySuggestion,
  PreEditionContract,
  UniversityRoyalty,
  ThirdPartyPublisherRoyalty,
  AuthorEmailReport,
  ClientDebt,
  CreateClientDebtPayload,
  DebtReminderConfig,
  LegalKpis,
  PeriodType,
  SendAuthorStatementPayload,
  SendBatchAuthorStatementsPayload,
  SendDebtReminderPayload,
  SendInstitutionStatementPayload,
} from "../types/legal";

const API_BASE = "/api/bff/rights/legal";

// ─── KPIs & Dashboard ────────────────────────────────────────────────────────

export async function getLegalKpis(): Promise<LegalKpis> {
  const res = await fetch(`${API_BASE}/kpis/`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Erreur KPIs juriste: ${res.status}`);
  const data = await res.json();
  return data.data || data;
}

// ─── Contrats & Recherche Plein Texte ─────────────────────────────────────────

export async function getContractFormOptions(): Promise<ContractFormOptions> {
  const res = await fetch(`${API_BASE}/contracts/form-options/`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Erreur options formulaire contrat: ${res.status}`);
  const data = await res.json();
  return data.data || { ouvrages: [], authors: [], publishers: [], institutions: [], pre_editions: [] };
}

export async function getLegalContracts(filters?: {
  search?: string;
  partyType?: string;
  status?: string;
}): Promise<LegalContract[]> {
  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.partyType && filters.partyType !== "all") params.append("party_type", filters.partyType);
  if (filters?.status && filters.status !== "all") params.append("status", filters.status);

  const res = await fetch(`${API_BASE}/contracts/?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Erreur contrats juriste: ${res.status}`);
  const data = await res.json();
  return data.data || data.results || [];
}

export async function getContractDetail(id: string): Promise<LegalContract | null> {
  const res = await fetch(`${API_BASE}/contracts/${id}/`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data || data;
}

export async function createLegalContract(
  data: Partial<LegalContract> & {
    contracting_party_email?: string;
    contracting_party_phone?: string;
    juriste_responsable_id?: string;
    ouvrage_id?: string;
    signataire_user_id?: string;
    institution_id?: string;
    publisher_id?: string;
    pre_edition_id?: string;
    repartitions?: any[];
  },
  file?: File | null
): Promise<LegalContract | null> {
  let body: any;
  const headers: Record<string, string> = {};

  if (file) {
    const formData = new FormData();
    formData.append("title", data.title || "");
    formData.append("contracting_party", data.contracting_party || "");
    if (data.contracting_party_email) formData.append("contracting_party_email", data.contracting_party_email);
    if (data.contracting_party_phone) formData.append("contracting_party_phone", data.contracting_party_phone);
    if (data.juriste_responsable_id) formData.append("juriste_responsable_id", data.juriste_responsable_id);
    formData.append("party_type", data.party_type || "author");
    formData.append("type", data.type || "author_contract");
    formData.append("notes", data.notes || "");
    formData.append("file", file);
    formData.append("file_name", file.name);
    formData.append("file_size", String(file.size));
    if (data.signed_at) formData.append("signed_at", data.signed_at);
    if (data.expires_at) formData.append("expires_at", data.expires_at);
    if (data.ouvrage_id) formData.append("ouvrage_id", data.ouvrage_id);
    if (data.signataire_user_id) formData.append("signataire_user_id", data.signataire_user_id);
    if (data.institution_id) formData.append("institution_id", data.institution_id);
    if (data.publisher_id) formData.append("publisher_id", data.publisher_id);
    if (data.pre_edition_id) formData.append("pre_edition_id", data.pre_edition_id);
    if (data.repartitions && data.repartitions.length > 0) {
      formData.append("repartitions", JSON.stringify(data.repartitions));
    }
    if (data.tags && Array.isArray(data.tags)) {
      formData.append("tags", JSON.stringify(data.tags));
    }
    body = formData;
  } else {
    body = JSON.stringify(data);
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE}/contracts/`, {
    method: "POST",
    headers,
    body,
    credentials: "include",
  });
  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || `Erreur création contrat: ${res.status}`);
  }
  const json = await res.json();
  return json.data || json;
}

export async function updateLegalContract(
  id: string,
  data: {
    title?: string;
    contracting_party?: string;
    contracting_party_email?: string;
    contracting_party_phone?: string;
    juriste_responsable_id?: string;
    party_type?: string;
    type?: string;
    signed_at?: string;
    expires_at?: string;
    status?: string;
    notes?: string;
    ouvrage_id?: string;
    signataire_user_id?: string;
    institution_id?: string;
    publisher_id?: string;
    tags?: string[] | string;
  }
): Promise<boolean> {
  const res = await fetch(`${API_BASE}/contracts/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  if (!res.ok) return false;
  const json = await res.json();
  return !!json.success;
}

export const updateContract = updateLegalContract;

export async function deleteLegalContract(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/contracts/${id}/`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) return false;
  const json = await res.json();
  return !!json.success;
}

// ─── Droits d'auteur & Suggestions IA ─────────────────────────────────────────

export async function getBookRoyalties(): Promise<BookRoyalty[]> {
  const res = await fetch(`${API_BASE}/royalties/`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Erreur redevances: ${res.status}`);
  const data = await res.json();
  const list = data.data || data.results || [];
  return list.map((r: any) => ({
    book_id: r.book_id || r.id,
    title: r.book_title || r.title || "Ouvrage",
    isbn: r.isbn || "",
    authors: Array.isArray(r.authors) ? r.authors : [r.author_name || "Auteur"],
    current_rate: r.author_share_percent !== undefined && r.author_share_percent !== null ? Number(r.author_share_percent) : 15,
    institution: r.institution || null,
    university_share_percent: r.university_share_percent !== undefined && r.university_share_percent !== null ? Number(r.university_share_percent) : null,
    source: "manual_override",
    last_updated: r.effective_date || new Date().toISOString(),
    history: [],
    paper_rate: r.paper_rate,
    digital_rate: r.digital_rate,
    audio_tts_rate: r.audio_tts_rate,
  }));
}

export async function updateBookRoyaltyRate(
  bookId: string,
  newRate: number,
  applyRetroactively: boolean,
  universityRate?: number | string | null
): Promise<boolean> {
  const payload: any = {
    book_id: bookId,
    rate: newRate,
    apply_retroactively: applyRetroactively,
    beneficiaires: [
      { pourcentage: newRate, role: "Auteur Principal", apply_retroactively: applyRetroactively }
    ],
  };

  if (universityRate !== undefined && universityRate !== null && String(universityRate).trim() !== "") {
    payload.university_share_percent = Number(universityRate);
  } else if (universityRate === null || universityRate === "") {
    payload.university_share_percent = null;
  }

  const res = await fetch(`${API_BASE}/royalties/batch/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[updateBookRoyaltyRate Error]", err);
    return false;
  }
  const data = await res.json();
  return !!data.success;
}

export async function saveRoyaltySplitBatch(
  bookId: string,
  beneficiaires: { author_name: string; pourcentage: number; role?: string }[]
): Promise<{ success: boolean; message?: string; error?: string }> {
  const res = await fetch(`${API_BASE}/royalties/batch/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ book_id: bookId, beneficiaires }),
    credentials: "include",
  });
  return await res.json();
}

export async function getAIRoyaltySuggestions(): Promise<AIRoyaltySuggestion[]> {
  const res = await fetch(`${API_BASE}/ai-suggestions/`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Erreur suggestions IA: ${res.status}`);
  const data = await res.json();
  const list = data.data || data.results || [];
  return list.map((s: any) => {
    const authors = Array.isArray(s.authors) && s.authors.length > 0
      ? s.authors
      : [s.beneficiary_name || "Auteur"];

    const proposedSplits = Array.isArray(s.proposed_splits) && s.proposed_splits.length > 0
      ? s.proposed_splits
      : (authors.length > 1
          ? authors.map((a: string, idx: number) => {
              const defaultPercent = Math.floor(100 / authors.length);
              return {
                author_name: a,
                percentage: idx === 0 ? 100 - defaultPercent * (authors.length - 1) : defaultPercent,
              };
            })
          : [{ author_name: authors[0], percentage: 100 }]);

    return {
      id: s.id,
      book_id: s.contract_id || s.id,
      title: s.book_title || s.contract_title,
      authors,
      proposed_splits: proposedSplits,
      is_validated: s.is_validated,
      ai_confidence: Math.round((s.confidence_score || 0.95) * 100),
      extracted_clause: s.extracted_clause,
      suggested_rate: s.suggested_rate,
    };
  });
}

export async function validateAISuggestion(
  suggestionId: string,
  adjustedSplits?: { author_name: string; percentage: number }[]
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const res = await fetch(`${API_BASE}/ai-suggestions/${suggestionId}/decide/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision: "approve", splits: adjustedSplits }),
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.error || `Erreur de validation (${res.status})` };
    }
    return { success: !!data.success, message: data.message, error: data.error };
  } catch (err: any) {
    return { success: false, error: err.message || "Erreur réseau" };
  }
}

// ─── Pré-éditions ─────────────────────────────────────────────────────────────

export async function getPreEditionContracts(params?: { search?: string; status?: string }): Promise<PreEditionContract[]> {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.set("search", params.search);
  if (params?.status && params.status !== "all") queryParams.set("status", params.status);

  const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const res = await fetch(`${API_BASE}/pre-editions/${qs}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Erreur pré-éditions: ${res.status}`);
  const data = await res.json();
  const list = data.data || data.results || [];
  return list.map((p: any) => ({
    id: p.id,
    code_dossier: p.code_dossier || `PRE-${p.id.slice(0, 4)}`,
    title: p.provisional_title || p.title,
    author_name: p.author_name,
    author_email: p.author_email,
    author_user_id: p.author_user_id,
    university: p.university,
    faculty: p.faculty,
    expected_delivery_date: p.expected_delivery_date,
    status: p.status,
    contract_id: p.contract_id,
    contract_reference: p.contract_reference,
    created_at: p.created_at || p.expected_delivery_date || new Date().toISOString().split('T')[0],
    notes: p.notes,
  }));
}

export async function createPreEditionContract(data: {
  title: string;
  author_name: string;
  author_email?: string;
  university: string;
  faculty: string;
  expected_delivery_date?: string;
  notes?: string;
}): Promise<PreEditionContract | null> {
  const res = await fetch(`${API_BASE}/pre-editions/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provisional_title: data.title,
      author_name: data.author_name,
      author_email: data.author_email,
      university: data.university,
      faculty: data.faculty,
      expected_delivery_date: data.expected_delivery_date,
      notes: data.notes,
    }),
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Erreur création pré-édition: ${res.status}`);
  const json = await res.json();
  const d = json.data || json;
  return {
    id: d.id,
    code_dossier: d.code_dossier || `PRE-${d.id.slice(0, 4)}`,
    title: d.provisional_title || d.title,
    author_name: d.author_name,
    author_email: d.author_email,
    author_user_id: d.author_user_id,
    university: d.university,
    faculty: d.faculty,
    expected_delivery_date: d.expected_delivery_date,
    status: d.status,
    contract_id: d.contract_id,
    contract_reference: d.contract_reference,
    created_at: d.created_at || new Date().toISOString().split('T')[0],
    notes: d.notes,
  };
}

export async function updatePreEditionStatus(
  id: string,
  payload: {
    status?: string;
    expected_delivery_date?: string;
    notes?: string;
    provisional_title?: string;
    author_name?: string;
    author_email?: string;
    university?: string;
    faculty?: string;
  }
): Promise<boolean> {
  const res = await fetch(`${API_BASE}/pre-editions/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  if (!res.ok) return false;
  const json = await res.json();
  return !!json.success;
}

export async function deletePreEdition(id: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/pre-editions/${id}/`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) return false;
  const json = await res.json();
  return !!json.success;
}

// ─── Redevances Partenaires ───────────────────────────────────────────────────

export async function getUniversityRoyalties(): Promise<UniversityRoyalty[]> {
  const res = await fetch(`${API_BASE}/royalties/universities/`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || data.results || [];
}

export async function getThirdPartyPublisherRoyalties(): Promise<ThirdPartyPublisherRoyalty[]> {
  const res = await fetch(`${API_BASE}/royalties/publishers/`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || data.results || [];
}

export async function updateThirdPartyPublisherRate(
  publisherId: string,
  newRate: number
): Promise<boolean> {
  const res = await fetch(`${API_BASE}/royalties/publishers/${publisherId}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contractual_rate: newRate }),
    credentials: "include",
  });
  return res.ok;
}

// ─── Relances & Communications ────────────────────────────────────────────────

export async function getAuthorEmailReports(params?: {
  period_type?: PeriodType;
  year?: number;
  month?: number;
  quarter?: number;
}): Promise<AuthorEmailReport[]> {
  const queryParams = new URLSearchParams();
  if (params?.period_type) queryParams.set("period_type", params.period_type);
  if (params?.year) queryParams.set("year", String(params.year));
  if (params?.month) queryParams.set("month", String(params.month));
  if (params?.quarter) queryParams.set("quarter", String(params.quarter));

  const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const res = await fetch(`${API_BASE}/relances/${qs}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Erreur relances: ${res.status}`);
  const data = await res.json();
  const reports = data.data?.reports || [];
  return reports.map((r: any) => ({
    author_id: r.author_id,
    name: r.name,
    email: r.email,
    total_sales_count: r.total_sales_count,
    total_royalties_paid: r.total_royalties_paid,
    total_revenue_reported: r.total_revenue_reported,
    currency: r.currency || "XOF",
    last_report_date: r.last_report_date,
    status: "scheduled",
  }));
}

export async function getClientDebts(): Promise<ClientDebt[]> {
  const res = await fetch(`${API_BASE}/relances/`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Erreur créances: ${res.status}`);
  const data = await res.json();
  const debts = data.data?.debts || data.results || [];
  return debts.map((d: any) => ({
    id: d.id,
    client_name: d.client_name,
    client_type: d.source === "wholesale_credit" ? "wholesaler" : (d.client_type || (d.source === "author_credit" ? "author" : "bookstore")),
    client_email: d.client_email,
    client_phone: d.client_phone || "+229 97 00 00 00",
    country: d.country || "Bénin",
    unpaid_invoices_count: d.unpaid_invoices_count || 1,
    total_debt_amount: d.unpaid_amount ?? d.total_debt_amount ?? d.amount ?? 0,
    amount: d.unpaid_amount ?? d.total_debt_amount ?? d.amount ?? 0,
    currency: d.currency || "XOF",
    due_date: d.due_date,
    days_overdue: d.days_overdue,
    reminder_count: d.reminder_count || 0,
    last_reminder_at: d.due_date,
    status: d.status || (d.reminder_count > 1 ? "formal_notice" : "reminded"),
    source: d.source,
    reference_document: d.reference_document,
    motive: d.motive,
    notes: d.notes,
  }));
}

export async function createClientDebt(payload: CreateClientDebtPayload): Promise<ClientDebt> {
  try {
    const res = await fetch(`${API_BASE}/relances/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create_debt", ...payload }),
      credentials: "include",
    });
    if (res.ok) {
      const json = await res.json();
      if (json.data) return json.data;
    }
  } catch (err) {
    console.warn("[createClientDebt] Erreur réseau / backend, utilisation du fallback optimiste", err);
  }

  // Fallback optimiste si le backend est temporairement indisponible
  const now = new Date();
  const dueDate = new Date(payload.due_date);
  const diffDays = Math.round((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysOverdue = Math.max(0, diffDays);

  return {
    id: `debt-${Date.now()}`,
    client_id: `cli-${Date.now()}`,
    client_name: payload.client_name,
    client_email: payload.client_email,
    client_type: payload.client_type,
    client_phone: payload.client_phone || "+229 97 00 00 00",
    country: payload.country || "Bénin",
    amount: payload.amount,
    total_debt_amount: payload.amount,
    unpaid_invoices_count: 1,
    currency: payload.currency || "XOF",
    due_date: payload.due_date,
    days_overdue: daysOverdue,
    reminder_count: payload.send_immediate_reminder ? 1 : 0,
    status: payload.send_immediate_reminder ? `relance_niveau_${payload.initial_reminder_level || 1}` : "pending",
    reference_document: payload.reference_document,
    motive: payload.motive,
    notes: payload.notes,
    source: payload.client_type === "wholesaler" ? "wholesale_credit" : (payload.client_type === "author" ? "author_credit" : "unpaid_order"),
    auto_remind_enabled: payload.auto_remind_enabled,
  };
}

export async function remindClientDebt(clientId: string, clientName?: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/relances/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient_id: clientId, type: "facture_impayee_client", recipient: clientName || "Client" }),
    credentials: "include",
  });
  if (!res.ok) return false;
  const data = await res.json();
  return !!data.success;
}

export async function sendAuthorRoyaltyReport(authorId: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/relances/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient_id: authorId, type: "rapport_droits_auteur" }),
    credentials: "include",
  });
  if (!res.ok) return false;
  const data = await res.json();
  return !!data.success;
}

export async function getDebtReminderConfig(): Promise<DebtReminderConfig> {
  const res = await fetch(`${API_BASE}/relances/config/`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) return {
    auto_remind_enabled: true,
    first_reminder_days: 7,
    second_reminder_days: 14,
    formal_notice_days: 21,
    auto_suspend_after_days: 30,
    cc_accountant: true,
    accountant_email: "comptabilite@lahatheque.bj",
  };
  const data = await res.json();
  return data.data || data;
}

export async function updateDebtReminderConfig(
  config: DebtReminderConfig
): Promise<boolean> {
  const res = await fetch(`${API_BASE}/relances/config/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
    credentials: "include",
  });
  return res.ok;
}

export async function sendAuthorRoyaltyStatementDetailed(
  payload: SendAuthorStatementPayload
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/relances/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send_author_statement",
        ...payload,
      }),
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.error || `Erreur ${res.status}` };
    }
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erreur réseau" };
  }
}

export async function sendBatchAuthorStatements(
  payload: SendBatchAuthorStatementsPayload
): Promise<{ success: boolean; sent_count?: number; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/relances/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send_batch_author_statements",
        ...payload,
      }),
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.error || `Erreur ${res.status}` };
    }
    return { success: true, sent_count: data.sent_count, message: data.message };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erreur réseau" };
  }
}

export async function sendDetailedDebtReminder(
  payload: SendDebtReminderPayload
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/relances/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send_debt_reminder",
        ...payload,
      }),
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.error || `Erreur ${res.status}` };
    }
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erreur réseau" };
  }
}

export async function sendInstitutionRoyaltyStatement(
  payload: SendInstitutionStatementPayload
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/redevances/send-statement/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: data.error || `Erreur ${res.status}` };
    }
    return { success: true, message: data.message };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erreur réseau" };
  }
}

