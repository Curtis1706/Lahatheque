export interface ClientBouquet {
  id: string;
  title: string;
  bouquet_type: string;
  discipline: string;
  books_count: number;
  annual_price: number;
  monthly_price?: number;
  currency: string;
  description: string;
  is_subscribed: boolean;
  end_date?: string | null;
  subscription_period?: "monthly" | "annual" | null;
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

export async function subscribeToClientBouquet(
  offeringId: string,
  period: "monthly" | "annual" = "annual"
): Promise<{ success: boolean; error?: string; message?: string; checkout_url?: string; subscription_id?: string }> {
  try {
    const res = await fetch(`/api/bff/commerce/bouquets/${offeringId}/subscribe/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ period }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      return { success: false, error: json.error || "Échec de la souscription au bouquet." };
    }
    return {
      success: true,
      message: json.message || "Souscription initiée.",
      checkout_url: json.data?.checkout_url,
      subscription_id: json.data?.id,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || "Erreur réseau lors de la souscription." };
  }
}
