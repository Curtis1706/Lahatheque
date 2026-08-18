// ─── Services Espace Juriste (legal_reviewer) ──────────────────────────────
// Fonctions async avec délai simulé — jamais de fetch en dur

import type {
  LegalContract,
  BookRoyalty,
  AIRoyaltySuggestion,
  PreEditionContract,
  UniversityRoyalty,
  ThirdPartyPublisherRoyalty,
  AuthorEmailReport,
  ClientDebt,
  DebtReminderConfig,
  LegalKpis,
} from "../types/legal";

import {
  mockContracts,
  mockBookRoyalties,
  mockAIRoyaltySuggestions,
  mockPreEditionContracts,
  mockUniversityRoyalties,
  mockThirdPartyPublisherRoyalties,
  mockAuthorEmailReports,
  mockClientDebts,
  mockDebtConfig,
  mockLegalKpis,
  mockLegalUser,
} from "../mock/legal";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── KPIs ─────────────────────────────────────────────────────────────────────

export async function getLegalKpis(): Promise<LegalKpis> {
  await delay(500);
  return {
    totalContracts: mockContracts.length,
    pendingAiSuggestions: mockAIRoyaltySuggestions.filter((s) => !s.is_validated).length,
    clientsInDebt: mockClientDebts.length,
    authorRemindersSent: mockAuthorEmailReports.length,
    activePreEditions: mockPreEditionContracts.filter((p) => p.status === "en_attente_depot").length,
  };
}

// ─── Contrats ─────────────────────────────────────────────────────────────────

export async function getLegalContracts(filters?: {
  search?: string;
  partyType?: string;
  status?: string;
}): Promise<LegalContract[]> {
  await delay(600);
  let list = [...mockContracts];

  if (filters?.partyType && filters.partyType !== "all") {
    list = list.filter((c) => c.party_type === filters.partyType);
  }
  if (filters?.status && filters.status !== "all") {
    list = list.filter((c) => c.status === filters.status);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.reference.toLowerCase().includes(q) ||
        c.contracting_party.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
    );
  }
  return list;
}

export async function getContractDetail(id: string): Promise<LegalContract | null> {
  await delay(500);
  const found = mockContracts.find((c) => c.id === id);
  if (!found) return null;
  return JSON.parse(JSON.stringify(found));
}

export async function createLegalContract(data: Partial<LegalContract>): Promise<LegalContract> {
  await delay(800);
  const newContract: LegalContract = {
    id: `ctr-2026-${String(mockContracts.length + 1).padStart(3, "0")}`,
    reference: `CTR-JUR-${Date.now().toString().slice(-4)}`,
    title: data.title || "Nouveau Contrat",
    contracting_party: data.contracting_party || "Partie Contractante",
    party_type: data.party_type || "author",
    type: data.type || "author_contract",
    signed_at: data.signed_at || new Date().toISOString(),
    expires_at: data.expires_at,
    file_url: data.file_url || "/PromptBreeder_Original_Paper-2309.16797v1.pdf",
    file_name: data.file_name || "Contrat_Legal_Signed.pdf",
    file_size: data.file_size || 2500000,
    tags: data.tags || ["contrat"],
    status: "active",
    notes: data.notes,
  };

  mockContracts.unshift(newContract);
  return newContract;
}

// ─── Droits d'auteur & Suggestions IA ─────────────────────────────────────────

export async function getBookRoyalties(): Promise<BookRoyalty[]> {
  await delay(600);
  return [...mockBookRoyalties];
}

export async function updateBookRoyaltyRate(
  bookId: string,
  newRate: number,
  applyRetroactively: boolean
): Promise<boolean> {
  await delay(800);
  const item = mockBookRoyalties.find((b) => b.book_id === bookId);
  if (item) {
    item.current_rate = newRate;
    item.source = "manual_override";
    item.last_updated = new Date().toISOString();
    item.history.unshift({
      date: new Date().toISOString(),
      rate: newRate,
      changed_by: mockLegalUser.name,
      applied_retroactively: applyRetroactively,
    });
    return true;
  }
  return false;
}

export async function getAIRoyaltySuggestions(): Promise<AIRoyaltySuggestion[]> {
  await delay(600);
  return mockAIRoyaltySuggestions.filter((s) => !s.is_validated);
}

export async function validateAISuggestion(
  suggestionId: string,
  adjustedSplits?: { author_name: string; percentage: number }[]
): Promise<boolean> {
  await delay(800);
  const sug = mockAIRoyaltySuggestions.find((s) => s.id === suggestionId);
  if (sug) {
    sug.is_validated = true;
    if (adjustedSplits) {
      sug.proposed_splits = adjustedSplits;
    }
    return true;
  }
  return false;
}

// ─── Pré-éditions ─────────────────────────────────────────────────────────────

export async function getPreEditionContracts(): Promise<PreEditionContract[]> {
  await delay(600);
  return [...mockPreEditionContracts];
}

export async function createPreEditionContract(data: {
  title: string;
  author_name: string;
  university: string;
  faculty: string;
}): Promise<PreEditionContract> {
  await delay(800);
  const newPre: PreEditionContract = {
    id: `pre-${String(mockPreEditionContracts.length + 1).padStart(2, "0")}`,
    title: data.title,
    author_name: data.author_name,
    university: data.university,
    faculty: data.faculty,
    status: "en_attente_depot",
    created_at: new Date().toISOString(),
  };

  mockPreEditionContracts.unshift(newPre);
  return newPre;
}

// ─── Redevances ───────────────────────────────────────────────────────────────

export async function getUniversityRoyalties(): Promise<UniversityRoyalty[]> {
  await delay(600);
  return [...mockUniversityRoyalties];
}

export async function getThirdPartyPublisherRoyalties(): Promise<ThirdPartyPublisherRoyalty[]> {
  await delay(600);
  return [...mockThirdPartyPublisherRoyalties];
}

export async function updateThirdPartyPublisherRate(
  publisherId: string,
  newRate: number
): Promise<boolean> {
  await delay(800);
  const pub = mockThirdPartyPublisherRoyalties.find((p) => p.publisher_id === publisherId);
  if (pub) {
    pub.contractual_rate = newRate;
    pub.amount_due = (pub.total_sales * newRate) / 100;
    pub.last_updated = new Date().toISOString();
    return true;
  }
  return false;
}

// ─── Relances & Communications ────────────────────────────────────────────────

export async function getAuthorEmailReports(): Promise<AuthorEmailReport[]> {
  await delay(600);
  return [...mockAuthorEmailReports];
}

export async function getClientDebts(): Promise<ClientDebt[]> {
  await delay(600);
  return [...mockClientDebts];
}

export async function remindClientDebt(debtId: string): Promise<boolean> {
  await delay(800);
  const debt = mockClientDebts.find((d) => d.id === debtId);
  if (debt) {
    debt.status = "reminded";
    debt.reminder_count += 1;
    debt.last_reminder_at = new Date().toISOString();
    return true;
  }
  return false;
}

export async function getDebtReminderConfig(): Promise<DebtReminderConfig> {
  await delay(400);
  return { ...mockDebtConfig };
}

export async function updateDebtReminderConfig(
  config: DebtReminderConfig
): Promise<boolean> {
  await delay(600);
  Object.assign(mockDebtConfig, config);
  return true;
}
