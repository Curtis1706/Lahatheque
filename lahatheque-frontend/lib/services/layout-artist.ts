// ─── Services Maquettiste & Chef Maquettiste ──────────────────────────────────
// Connecté au backend Django via BFF Proxy (/api/bff/catalog/deposits/...)

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

// ─── Service Maquettiste ──────────────────────────────────────────────────────

export async function getMaquettisteKpis(maquettisteId: string = mockMaquettisteUser.id): Promise<MaquettisteKpi> {
  try {
    const res = await fetch("/api/bff/catalog/deposits/kpis/", {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return {
          draftCount: data.data.draftCount ?? 0,
          pendingValidationCount: data.data.pendingValidationCount ?? 0,
          revisionRequestedCount: data.data.revisionRequestedCount ?? 0,
          publishedCount: data.data.validatedCount ?? 0,
          timelines: data.data.timelines,
        };
      }
    }
  } catch (err) {
    console.warn("[Layout Service] API getMaquettisteKpis fallback:", err);
  }

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
  try {
    const params = new URLSearchParams();
    if (filters?.status && filters.status !== "all") {
      params.append("status", filters.status === "pending_validation" ? "submitted" : filters.status);
    }
    if (filters?.discipline) {
      params.append("discipline", filters.discipline);
    }
    const res = await fetch(`/api/bff/catalog/deposits/?${params.toString()}`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      const results = Array.isArray(data) ? data : data.results || data.data;
      if (Array.isArray(results) && results.length > 0) {
        return results.map((b: any) => ({
          id: String(b.id),
          maquettiste_id: maquettisteId,
          maquettiste_name: b.authors_names || "Maquettiste",
          metadata: {
            title: b.title || "Sans titre",
            authors: b.authors_names ? b.authors_names.split(",") : ["Auteur LAHA"],
            publication_year: b.publication_date ? new Date(b.publication_date).getFullYear() : 2026,
            language: b.language || "Français",
            language_source: "manual_override",
            summary: b.summary || "",
            summary_source: "manual_override",
            isbn: b.isbn || "",
          },
          classification: {
            country: "BJ",
            university: b.institution_name || "Université d'Abomey-Calavi (UAC)",
            faculty: b.faculty_name || "",
            discipline: b.discipline_name || "Général",
            source: "manual_override",
          },
          files: {
            format: (b.format_type || "pdf").toUpperCase() as "PDF" | "EPUB",
            book_file_name: b.title,
            cover_url: b.cover_image,
          },
          status: b.status === "published" ? "published" : b.status === "rejected" ? "revision_requested" : "pending_validation",
          created_at: b.created_at || new Date().toISOString(),
          default_price: Number(b.price_raw) || 5000,
        }));
      }
    }
  } catch (err) {
    console.warn("[Layout Service] API getMyDeposits fallback:", err);
  }

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
  try {
    const res = await fetch(`/api/bff/catalog/deposits/${id}/`, {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (res.ok) {
      const b = await res.json();
      if (b && b.id) {
        return {
          id: String(b.id),
          maquettiste_id: mockMaquettisteUser.id,
          maquettiste_name: b.authors_names || "Maquettiste",
          metadata: {
            title: b.title || "Sans titre",
            authors: b.authors_names ? b.authors_names.split(",") : ["Auteur LAHA"],
            publication_year: b.publication_date ? new Date(b.publication_date).getFullYear() : 2026,
            language: b.language || "Français",
            language_source: "manual_override",
            summary: b.summary || "",
            summary_source: "manual_override",
            isbn: b.isbn || "",
          },
          classification: {
            country: "BJ",
            university: b.institution_name || "Université d'Abomey-Calavi (UAC)",
            faculty: b.faculty_name || "",
            discipline: b.discipline_name || "Général",
            source: "manual_override",
          },
          files: {
            format: (b.format_type || "pdf").toUpperCase() as "PDF" | "EPUB",
            book_file_name: b.title,
            cover_url: b.cover_image,
          },
          status: b.status === "published" ? "published" : b.status === "rejected" ? "revision_requested" : "pending_validation",
          created_at: b.created_at || new Date().toISOString(),
          default_price: Number(b.price_raw) || 5000,
        };
      }
    }
  } catch (err) {
    console.warn("[Layout Service] API getDepositDetail fallback:", err);
  }

  const found = mockDeposits.find((d) => d.id === id);
  if (!found) return null;
  return JSON.parse(JSON.stringify(found));
}

export async function createDeposit(data: Partial<LayoutDeposit>): Promise<LayoutDeposit> {
  try {
    const res = await fetch("/api/bff/catalog/deposits/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: data.metadata?.title || "Nouveau Titre",
        authors_names: data.metadata?.authors ? data.metadata.authors.join(", ") : "Auteur LAHA",
        isbn: data.metadata?.isbn || "",
        summary: data.metadata?.summary || "",
        language: data.metadata?.language || "Français",
        format_type: (data.files?.format || "pdf").toLowerCase(),
        price_raw: data.default_price || 5000,
      }),
    });
    if (res.ok) {
      const respData = await res.json();
      if (respData.data) {
        return {
          id: String(respData.data.id),
          maquettiste_id: mockMaquettisteUser.id,
          maquettiste_name: mockMaquettisteUser.name,
          metadata: data.metadata as any,
          classification: data.classification as any,
          files: data.files as any,
          status: "pending_validation",
          created_at: new Date().toISOString(),
          default_price: data.default_price || 5000,
        };
      }
    }
  } catch (err) {
    console.warn("[Layout Service] API createDeposit fallback:", err);
  }

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
  const dep = mockDeposits.find((d) => d.id === id);
  if (dep) {
    dep.status = "pending_validation";
    dep.submitted_at = new Date().toISOString();
    return true;
  }
  return false;
}

// ─── Service Chef Maquettiste ─────────────────────────────────────────────────

export async function getChefKpis(): Promise<ChefMaquettisteKpi> {
  try {
    const res = await fetch("/api/bff/catalog/deposits/chef-kpis/", {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        return {
          pendingValidationCount: data.data.pendingValidationCount ?? 0,
          validatedThisMonth: data.data.totalPublished ?? 0,
          revisionRequestedThisMonth: data.data.rejectedCount ?? 0,
          averageProcessingTimeHours: Number(data.data.averageValidationHours) || 4.5,
          timelines: data.data.timelines,
        };
      }
    }
  } catch (err) {
    console.warn("[Layout Service] API getChefKpis fallback:", err);
  }

  const pendingCount = mockDeposits.filter((d) => d.status === "pending_validation").length;
  return {
    ...mockChefMaquettisteKpis,
    pendingValidationCount: pendingCount,
  };
}

export async function getPendingDeposits(filters?: { search?: string; discipline?: string }): Promise<LayoutDeposit[]> {
  try {
    const res = await fetch("/api/bff/catalog/deposits/?status=submitted", {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      const results = Array.isArray(data) ? data : data.results || data.data;
      if (Array.isArray(results) && results.length > 0) {
        return results.map((b: any) => ({
          id: String(b.id),
          maquettiste_id: mockMaquettisteUser.id,
          maquettiste_name: b.authors_names || "Maquettiste",
          metadata: {
            title: b.title || "Sans titre",
            authors: b.authors_names ? b.authors_names.split(",") : ["Auteur LAHA"],
            publication_year: b.publication_date ? new Date(b.publication_date).getFullYear() : 2026,
            language: b.language || "Français",
            language_source: "manual_override",
            summary: b.summary || "",
            summary_source: "manual_override",
            isbn: b.isbn || "",
          },
          classification: {
            country: "BJ",
            university: b.institution_name || "Université d'Abomey-Calavi (UAC)",
            faculty: b.faculty_name || "",
            discipline: b.discipline_name || "Général",
            source: "manual_override",
          },
          files: {
            format: (b.format_type || "pdf").toUpperCase() as "PDF" | "EPUB",
            book_file_name: b.title,
            cover_url: b.cover_image,
          },
          status: "pending_validation",
          created_at: b.created_at || new Date().toISOString(),
          default_price: Number(b.price_raw) || 5000,
        }));
      }
    }
  } catch (err) {
    console.warn("[Layout Service] API getPendingDeposits fallback:", err);
  }

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
  try {
    const res = await fetch("/api/bff/catalog/deposits/", {
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      const results = Array.isArray(data) ? data : data.results || data.data;
      if (Array.isArray(results) && results.length > 0) {
        return results
          .filter((b: any) => b.status === "published" || b.status === "rejected")
          .map((b: any) => ({
            id: String(b.id),
            maquettiste_id: mockMaquettisteUser.id,
            maquettiste_name: b.authors_names || "Maquettiste",
            metadata: {
              title: b.title || "Sans titre",
              authors: b.authors_names ? b.authors_names.split(",") : ["Auteur LAHA"],
              publication_year: b.publication_date ? new Date(b.publication_date).getFullYear() : 2026,
              language: b.language || "Français",
              language_source: "manual_override",
              summary: b.summary || "",
              summary_source: "manual_override",
              isbn: b.isbn || "",
            },
            classification: {
              country: "BJ",
              university: b.institution_name || "Université d'Abomey-Calavi (UAC)",
              faculty: b.faculty_name || "",
              discipline: b.discipline_name || "Général",
              source: "manual_override",
            },
            files: {
              format: (b.format_type || "pdf").toUpperCase() as "PDF" | "EPUB",
              book_file_name: b.title,
              cover_url: b.cover_image,
            },
            status: b.status === "published" ? "published" : "revision_requested",
            created_at: b.created_at || new Date().toISOString(),
            default_price: Number(b.price_raw) || 5000,
          }));
      }
    }
  } catch (err) {
    console.warn("[Layout Service] API getValidationHistory fallback:", err);
  }

  return mockDeposits.filter(
    (d) => d.status === "published" || d.status === "revision_requested"
  );
}

export async function validateDeposit(id: string, comment?: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/bff/catalog/deposits/${id}/validate/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment }),
    });
    if (res.ok) {
      return true;
    }
  } catch (err) {
    console.warn("[Layout Service] API validate fallback to mock:", err);
  }

  const dep = mockDeposits.find((d) => d.id === id);
  if (dep) {
    dep.status = "published";
    dep.validated_at = new Date().toISOString();
    if (comment) dep.chef_comment = comment;
    return true;
  }
  return true;
}

export async function requestRevision(id: string, comment: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/bff/catalog/deposits/${id}/reject/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ motif_rejet: comment }),
    });
    if (res.ok) {
      return true;
    }
  } catch (err) {
    console.warn("[Layout Service] API reject fallback to mock:", err);
  }

  const dep = mockDeposits.find((d) => d.id === id);
  if (dep) {
    dep.status = "revision_requested";
    dep.chef_comment = comment;
    return true;
  }
  return true;
}
