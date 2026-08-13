// ─── Services Maquettiste & Chef Maquettiste ──────────────────────────────────
// Fonctions async avec délai simulé — jamais de fetch en dur

import type {
  LayoutDeposit,
  MaquettisteKpi,
  ChefMaquettisteKpi,
  DepositFilterStatus,
} from "../types/layout-artist";

import {
  mockDeposits,
  mockMaquettisteKpis,
  mockChefMaquettisteKpis,
  mockMaquettisteUser,
} from "../mock/layout-artist";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ─── Service Maquettiste ──────────────────────────────────────────────────────

export async function getMaquettisteKpis(maquettisteId: string = mockMaquettisteUser.id): Promise<MaquettisteKpi> {
  await delay(500);
  const myDeps = mockDeposits.filter((d) => d.maquettiste_id === maquettisteId);
  return {
    draftCount: myDeps.filter((d) => d.status === "draft").length,
    pendingValidationCount: myDeps.filter((d) => d.status === "pending_validation").length,
    revisionRequestedCount: myDeps.filter((d) => d.status === "revision_requested").length,
    publishedCount: myDeps.filter((d) => d.status === "published").length,
  };
}

export async function getMyDeposits(
  maquettisteId: string = mockMaquettisteUser.id,
  filters?: { status?: DepositFilterStatus; search?: string; discipline?: string }
): Promise<LayoutDeposit[]> {
  await delay(600);
  let list = mockDeposits.filter((d) => d.maquettiste_id === maquettisteId);

  if (filters?.status && filters.status !== "all") {
    list = list.filter((d) => d.status === filters.status);
  }
  if (filters?.discipline) {
    list = list.filter((d) => d.classification.discipline === filters.discipline);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (d) =>
        d.metadata.title.toLowerCase().includes(q) ||
        d.metadata.authors.some((a) => a.toLowerCase().includes(q))
    );
  }
  return list;
}

export async function getDepositDetail(id: string): Promise<LayoutDeposit | null> {
  await delay(500);
  const found = mockDeposits.find((d) => d.id === id);
  if (!found) return null;
  return JSON.parse(JSON.stringify(found));
}

export async function createDeposit(data: Partial<LayoutDeposit>): Promise<LayoutDeposit> {
  await delay(800);
  const newDep: LayoutDeposit = {
    id: `dep-2026-${String(mockDeposits.length + 1).padStart(3, "0")}`,
    maquettiste_id: mockMaquettisteUser.id,
    maquettiste_name: mockMaquettisteUser.name,
    metadata: {
      title: data.metadata?.title || "Nouveau titre",
      authors: data.metadata?.authors || ["Auteur"],
      publication_year: data.metadata?.publication_year || 2026,
      language: data.metadata?.language || "Français",
      language_source: data.metadata?.language_source || "ai_suggested",
      summary: data.metadata?.summary || "",
      summary_source: data.metadata?.summary_source || "ai_suggested",
      isbn: data.metadata?.isbn,
    },
    classification: {
      country: data.classification?.country || "BJ",
      university: data.classification?.university || "Université d'Abomey-Calavi (UAC)",
      faculty: data.classification?.faculty || "Faculté de Droit",
      discipline: data.classification?.discipline || "Droit & Sciences Politiques",
      source: data.classification?.source || "ai_suggested",
    },
    files: {
      format: data.files?.format || "PDF",
      book_file_name: data.files?.book_file_name,
      cover_url: data.files?.cover_url,
      audio_files: data.files?.audio_files || [],
    },
    status: data.status || "draft",
    created_at: new Date().toISOString(),
    default_price: data.default_price || 12000,
  };

  mockDeposits.unshift(newDep);
  return newDep;
}

export async function updateDeposit(id: string, updates: Partial<LayoutDeposit>): Promise<LayoutDeposit | null> {
  await delay(800);
  const idx = mockDeposits.findIndex((d) => d.id === id);
  if (idx === -1) return null;

  mockDeposits[idx] = {
    ...mockDeposits[idx],
    ...updates,
    metadata: { ...mockDeposits[idx].metadata, ...updates.metadata },
    classification: { ...mockDeposits[idx].classification, ...updates.classification },
    files: { ...mockDeposits[idx].files, ...updates.files },
  };

  return mockDeposits[idx];
}

export async function submitDepositForValidation(id: string): Promise<boolean> {
  await delay(800);
  const dep = mockDeposits.find((d) => d.id === id);
  if (dep) {
    dep.status = "pending_validation";
    dep.submitted_at = new Date().toISOString();
    return true;
  }
  return false;
}

export async function simulateAiDetection(filename: string): Promise<{
  language: string;
  discipline: string;
  faculty: string;
  summary: string;
}> {
  await delay(1200);
  const lower = filename.toLowerCase();
  if (lower.includes("droit") || lower.includes("loi")) {
    return {
      language: "Français",
      discipline: "Droit & Sciences Politiques",
      faculty: "Faculté de Droit et de Science Politique (FADESP)",
      summary: "Ouvrage juridique spécialisé portant sur les textes de loi et le droit positif béninois et africain.",
    };
  }
  if (lower.includes("sante") || lower.includes("medecine")) {
    return {
      language: "Français",
      discipline: "Médecine & Santé",
      faculty: "Faculté des Sciences de la Santé (FSS)",
      summary: "Guide clinique et théorique sur les protocoles de santé publique et la médecine tropicale.",
    };
  }
  return {
    language: "Français",
    discipline: "Sciences Humaines",
    faculty: "Faculté des Lettres, Langues, Arts et Communication (FLLAC)",
    summary: "Étude académique approfondie avec analyses méthodologiques et références universitaires.",
  };
}

// ─── Service Chef Maquettiste ─────────────────────────────────────────────────

export async function getChefKpis(): Promise<ChefMaquettisteKpi> {
  await delay(500);
  const pendingCount = mockDeposits.filter((d) => d.status === "pending_validation").length;
  return {
    ...mockChefMaquettisteKpis,
    pendingValidationCount: pendingCount,
  };
}

export async function getPendingDeposits(filters?: { search?: string; discipline?: string }): Promise<LayoutDeposit[]> {
  await delay(600);
  let list = mockDeposits.filter((d) => d.status === "pending_validation");
  if (filters?.discipline) {
    list = list.filter((d) => d.classification.discipline === filters.discipline);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(
      (d) =>
        d.metadata.title.toLowerCase().includes(q) ||
        d.maquettiste_name.toLowerCase().includes(q)
    );
  }
  return list;
}

export async function getValidationHistory(): Promise<LayoutDeposit[]> {
  await delay(600);
  return mockDeposits.filter(
    (d) => d.status === "published" || d.status === "revision_requested"
  );
}

export async function validateDeposit(id: string, comment?: string): Promise<boolean> {
  await delay(1000);
  const dep = mockDeposits.find((d) => d.id === id);
  if (dep) {
    dep.status = "published";
    dep.validated_at = new Date().toISOString();
    if (comment) dep.chef_comment = comment;
    return true;
  }
  return false;
}

export async function requestRevision(id: string, comment: string): Promise<boolean> {
  await delay(1000);
  const dep = mockDeposits.find((d) => d.id === id);
  if (dep) {
    dep.status = "revision_requested";
    dep.chef_comment = comment;
    return true;
  }
  return false;
}
