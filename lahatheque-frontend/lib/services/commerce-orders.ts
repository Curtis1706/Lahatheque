/**
 * Service de création de commande multi-articles avec paiement Moneroo réel.
 * Utilise le même endpoint que /checkout (POST /api/bff/commerce/orders/).
 */

export interface OrderItemPayload {
  ouvrage_id: string;
  format_type: "digital" | "paper";
  quantity: number;
}

export interface OrderCreatePayload {
  items: OrderItemPayload[];
  payment_provider?: "moneroo" | "manual";
  type_commande: "rentree_scolaire" | "personnel" | "institutionnel";
  mode_paiement: "mobile_money" | "virement" | "especes" | "carte";
  shipping_address?: string;
  city?: string;
  country?: string;
  date_livraison_souhaitee?: string; // "YYYY-MM-DD"
  plage_horaire_debut?: string;      // "HH:MM"
  plage_horaire_fin?: string;        // "HH:MM"
  is_credit_purchase?: boolean;
  credit_due_date?: string;          // "YYYY-MM-DD"
}

export interface OrderCreateResponse {
  id: string;
  total_amount: number;
  currency: string;
  statut_paiement: string;
  statut_commande: string;
  payment_url?: string;    // Lien de paiement Moneroo si mode_paiement = mobile_money
  checkout_url?: string;   // Alias Moneroo
}

export async function createOrder(payload: OrderCreatePayload): Promise<OrderCreateResponse> {
  const body = {
    ...payload,
    payment_provider: payload.mode_paiement === "mobile_money" ? "moneroo" : "manual",
  };

  const res = await fetch("/api/bff/commerce/orders/", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Échec de la création de la commande.");
  }

  const data = await res.json();
  // Le backend peut répondre { success, data, ... } ou directement { order_id, checkout_url, ... }
  const inner = data.data || data;
  const orderObj = inner.order || inner;
  return {
    id: orderObj.id || inner.order_id || inner.id || "",
    total_amount: Number(orderObj.total_amount || inner.total_amount || 0),
    currency: typeof orderObj.currency === "string" ? orderObj.currency : inner.currency || "XOF",
    statut_paiement: orderObj.statut_paiement || inner.statut_paiement || (inner.status === "success" ? "paid" : "pending"),
    statut_commande: orderObj.statut_commande || inner.statut_commande || (inner.status === "success" ? "completed" : "pending"),
    payment_url: inner.checkout_url || inner.payment_url,
  };
}
