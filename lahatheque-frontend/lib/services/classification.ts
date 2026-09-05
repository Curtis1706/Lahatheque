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

export const DEFAULT_DISCIPLINES: DisciplineItem[] = [
  { id: 1, name: "Sciences de l'éducation", code_dewey: "370", description: "Pédagogie, didactique et sciences de l'apprentissage", is_active: true },
  { id: 2, name: "Droit Public & Administration", code_dewey: "342", description: "Droit constitutionnel, administratif et finances publiques", is_active: true },
  { id: 3, name: "Droit Privé & Sciences Criminelles", code_dewey: "346", description: "Droit civil, pénal, commercial et procédure", is_active: true },
  { id: 4, name: "Sciences Économiques & Gestion", code_dewey: "330", description: "Microéconomie, macroéconomie, finance et management", is_active: true },
  { id: 5, name: "Médecine & Santé Publique", code_dewey: "610", description: "Sciences médicales, infectiologie, santé communautaire", is_active: true },
  { id: 6, name: "Neurochirurgie", code_dewey: "617.48", description: "Chirurgie du système nerveux central et périphérique", is_active: true },
  { id: 7, name: "Imagerie médicale & Radiologie", code_dewey: "616.0757", description: "Radiographie, IRM, échographie et diagnostic par imagerie", is_active: true },
  { id: 8, name: "Agriculture & Agronomie", code_dewey: "630", description: "Productions végétales, pédologie, développement rural", is_active: true },
  { id: 9, name: "Informatique & Technologies", code_dewey: "004", description: "Algorithmique, génie logiciel, réseaux et IA", is_active: true },
  { id: 10, name: "Sciences Sociales & Sociologie", code_dewey: "300", description: "Sociologie, anthropologie, sciences politiques", is_active: true },
  { id: 11, name: "Lettres & Sciences Humaines", code_dewey: "800", description: "Littérature, linguistique, langues et civilisations", is_active: true },
  { id: 12, name: "Comptabilité & Finance (SYSCOHADA)", code_dewey: "657", description: "Normes comptables OHADA, audit et contrôle de gestion", is_active: true },
];

const BASE = "/api/bff/catalog";

export async function getDisciplines(): Promise<DisciplineItem[]> {
  try {
    const res = await fetch(`${BASE}/disciplines/?all=true`, { credentials: "include", cache: "no-store" });
    if (!res.ok) return DEFAULT_DISCIPLINES;
    const json = await res.json();
    const list = Array.isArray(json) ? json : json.results || [];
    return list.length > 0 ? list : DEFAULT_DISCIPLINES;
  } catch {
    return DEFAULT_DISCIPLINES;
  }
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
