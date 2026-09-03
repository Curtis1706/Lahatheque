export interface DisciplineItem {
  id: number;
  name: string;
  code_dewey: string;
  description: string;
  is_active?: boolean;
}

export interface DomainItem {
  id: number;
  discipline: number;
  discipline_name: string;
  name: string;
  is_active?: boolean;
}

const BASE = "/api/bff/catalog";

export async function getDisciplines(): Promise<DisciplineItem[]> {
  const res = await fetch(`${BASE}/disciplines/?all=true`, { credentials: "include", cache: "no-store" });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json) ? json : json.results || [];
}

export async function createDiscipline(data: {
  name: string;
  code_dewey?: string;
  description?: string;
  is_active?: boolean;
}): Promise<DisciplineItem | null> {
  const res = await fetch(`${BASE}/disciplines/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || errData.name?.[0] || "Erreur création discipline.");
  }
  return await res.json();
}

export async function updateDiscipline(
  id: number,
  data: Partial<{ name: string; code_dewey: string; description: string; is_active: boolean }>
): Promise<DisciplineItem | null> {
  const res = await fetch(`${BASE}/disciplines/${id}/`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || errData.name?.[0] || "Erreur modification discipline.");
  }
  return await res.json();
}

export async function deleteDiscipline(id: number): Promise<void> {
  const res = await fetch(`${BASE}/disciplines/${id}/`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erreur suppression discipline.");
  }
}

export async function getDomains(disciplineId?: number): Promise<DomainItem[]> {
  const params = disciplineId ? `?discipline=${disciplineId}` : "";
  const res = await fetch(`${BASE}/domains/${params}`, { credentials: "include", cache: "no-store" });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json) ? json : json.results || [];
}

export async function createDomain(data: { discipline: number; name: string; is_active?: boolean }): Promise<DomainItem | null> {
  const res = await fetch(`${BASE}/domains/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || errData.name?.[0] || "Erreur création sous-catégorie.");
  }
  return await res.json();
}

export async function updateDomain(
  id: number,
  data: Partial<{ name: string; is_active: boolean }>
): Promise<DomainItem | null> {
  const res = await fetch(`${BASE}/domains/${id}/`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || errData.name?.[0] || "Erreur modification sous-catégorie.");
  }
  return await res.json();
}

export async function deleteDomain(id: number): Promise<void> {
  const res = await fetch(`${BASE}/domains/${id}/`, { method: "DELETE", credentials: "include" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erreur suppression sous-catégorie.");
  }
}
