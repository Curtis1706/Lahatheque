export interface CountryItem {
  id: number;
  code: string; // ISO 2 (ex: BJ)
  name: string; // Bénin
  phone_code: string; // +229
  currency: string; // FCFA
  is_active: boolean;
  created_at?: string;
}

export const AFRICAN_COUNTRIES_PRESET = [
  { code: "BJ", name: "Bénin", phone_code: "+229", currency: "FCFA" },
  { code: "CI", name: "Côte d'Ivoire", phone_code: "+225", currency: "FCFA" },
  { code: "SN", name: "Sénégal", phone_code: "+221", currency: "FCFA" },
  { code: "TG", name: "Togo", phone_code: "+228", currency: "FCFA" },
  { code: "BF", name: "Burkina Faso", phone_code: "+226", currency: "FCFA" },
  { code: "ML", name: "Mali", phone_code: "+223", currency: "FCFA" },
  { code: "NE", name: "Niger", phone_code: "+227", currency: "FCFA" },
  { code: "GN", name: "Guinée", phone_code: "+224", currency: "GNF" },
  { code: "CM", name: "Cameroun", phone_code: "+237", currency: "FCFA" },
  { code: "GA", name: "Gabon", phone_code: "+241", currency: "FCFA" },
  { code: "CG", name: "Congo", phone_code: "+242", currency: "FCFA" },
  { code: "CD", name: "RD Congo", phone_code: "+243", currency: "USD" },
  { code: "TD", name: "Tchad", phone_code: "+235", currency: "FCFA" },
  { code: "CF", name: "République Centrafricaine", phone_code: "+236", currency: "FCFA" },
  { code: "GQ", name: "Guinée Équatoriale", phone_code: "+240", currency: "FCFA" },
  { code: "GH", name: "Ghana", phone_code: "+233", currency: "GHS" },
  { code: "NG", name: "Nigeria", phone_code: "+234", currency: "NGN" },
  { code: "RW", name: "Rwanda", phone_code: "+250", currency: "RWF" },
  { code: "BI", name: "Burundi", phone_code: "+257", currency: "BIF" },
  { code: "DJ", name: "Djibouti", phone_code: "+253", currency: "DJF" },
  { code: "MG", name: "Madagascar", phone_code: "+261", currency: "MGA" },
  { code: "MU", name: "Maurice", phone_code: "+230", currency: "MUR" },
  { code: "KM", name: "Comores", phone_code: "+269", currency: "KMF" },
  { code: "SC", name: "Seychelles", phone_code: "+248", currency: "SCR" },
  { code: "MR", name: "Mauritanie", phone_code: "+222", currency: "MRU" },
  { code: "MA", name: "Maroc", phone_code: "+212", currency: "MAD" },
  { code: "TN", name: "Tunisie", phone_code: "+216", currency: "TND" },
  { code: "DZ", name: "Algérie", phone_code: "+213", currency: "DZD" },
  { code: "EG", name: "Égypte", phone_code: "+20", currency: "EGP" },
  { code: "KE", name: "Kenya", phone_code: "+254", currency: "KES" },
  { code: "UG", name: "Ouganda", phone_code: "+256", currency: "UGX" },
  { code: "TZ", name: "Tanzanie", phone_code: "+255", currency: "TZS" },
  { code: "ET", name: "Éthiopie", phone_code: "+251", currency: "ETB" },
  { code: "ZA", name: "Afrique du Sud", phone_code: "+27", currency: "ZAR" },
  { code: "AO", name: "Angola", phone_code: "+244", currency: "AOA" },
  { code: "MZ", name: "Mozambique", phone_code: "+258", currency: "MZN" },
  { code: "GW", name: "Guinée-Bissau", phone_code: "+245", currency: "FCFA" },
  { code: "CV", name: "Cap-Vert", phone_code: "+238", currency: "CVE" },
  { code: "ST", name: "Sao Tomé-et-Principe", phone_code: "+239", currency: "STN" },
  { code: "SL", name: "Sierra Leone", phone_code: "+232", currency: "SLE" },
  { code: "LR", name: "Libéria", phone_code: "+231", currency: "LRD" },
  { code: "GM", name: "Gambie", phone_code: "+220", currency: "GMD" },
  { code: "ZW", name: "Zimbabwe", phone_code: "+263", currency: "USD" },
  { code: "ZM", name: "Zambie", phone_code: "+260", currency: "ZMW" },
  { code: "MW", name: "Malawi", phone_code: "+265", currency: "MWK" },
  { code: "BW", name: "Botswana", phone_code: "+267", currency: "BWP" },
  { code: "NA", name: "Namibie", phone_code: "+264", currency: "NAD" },
];

const BASE = "/api/bff/catalog";

export async function getCountries(activeOnly = false): Promise<CountryItem[]> {
  try {
    const params = activeOnly ? "?active_only=true" : "";
    const res = await fetch(`${BASE}/countries/${params}`, { credentials: "include", cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return Array.isArray(json) ? json : json.results || [];
  } catch {
    return [];
  }
}

export async function createCountry(data: {
  code: string;
  name: string;
  phone_code?: string;
  currency?: string;
  is_active?: boolean;
}): Promise<CountryItem | null> {
  const res = await fetch(`${BASE}/countries/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || errData.code?.[0] || errData.name?.[0] || "Erreur création pays.");
  }
  return await res.json();
}

export async function updateCountry(
  id: number,
  data: Partial<{ code: string; name: string; phone_code: string; currency: string; is_active: boolean }>
): Promise<CountryItem | null> {
  const res = await fetch(`${BASE}/countries/${id}/`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Erreur modification pays.");
  }
  return await res.json();
}

export async function deleteCountry(id: number): Promise<void> {
  const res = await fetch(`${BASE}/countries/${id}/`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Erreur suppression pays.");
  }
}
