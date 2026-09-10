/**
 * Types TypeScript pour le tunnel de commande e-commerce et le checkout LAHAThèque.
 */

export type BookFormatType = "digital" | "paper" | "audio";

export type PaymentProvider = "moneroo" | "mock" | "stripe";

export interface CheckoutOrderItem {
  bookId: string;
  title: string;
  coverImage?: string;
  authorName?: string;
  price: number;
  format: BookFormatType;
  quantity: number;
  selectedLanguage?: string;
}

export interface PhysicalDeliveryPayload {
  shipping_address: string;
  city: string;
  country: string;
  recipient_phone?: string;
  date_livraison_souhaitee?: string;
  plage_horaire_debut?: string;
  plage_horaire_fin?: string;
}

export interface CheckoutOrderPayload {
  payment_provider: PaymentProvider;
  shipping_address?: string;
  city?: string;
  country?: string;
  date_livraison_souhaitee?: string;
  plage_horaire_debut?: string;
  plage_horaire_fin?: string;
  items: Array<{
    ouvrage_id: string;
    format_type: BookFormatType;
    quantity: number;
    selected_language?: string;
  }>;
}

export interface CheckoutOrderResponse {
  success?: boolean;
  order_id?: string;
  checkout_url?: string;
  status?: string;
  total_amount?: string | number;
  order?: {
    id: string;
    total_amount: string | number;
    statut_paiement: string;
    statut_commande: string;
    created_at: string;
  };
  error?: string;
}
