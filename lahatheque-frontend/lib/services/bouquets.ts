export interface ClientBouquet {
  id: string;
  title: string;
  bouquet_type: string;
  discipline: string;
  books_count: number;
  annual_price: number;
  currency: string;
  description: string;
  is_subscribed: boolean;
}

export async function getClientBouquets(): Promise<ClientBouquet[]> {
  try {
    const res = await fetch("/api/bff/commerce/bouquets/", { credentials: "include", cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch {
    return [];
  }
}

export async function subscribeToClientBouquet(offeringId: string): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const res = await fetch(`/api/bff/commerce/bouquets/${offeringId}/subscribe/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { success: false, error: json.error || "Échec de la souscription au bouquet." };
    }
    return { success: true, message: json.message || "Souscription confirmée." };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erreur réseau lors de la souscription." };
  }
}
