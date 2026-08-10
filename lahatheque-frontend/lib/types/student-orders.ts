export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';
export type FormatType = 'digital' | 'paper';
export type PhysicalDeliveryStatus = 'en_preparation' | 'expedie' | 'livre';

export interface OrderItem {
  id: string;
  ouvrage: string;
  ouvrage_title: string;
  ouvrage_cover?: string;
  format_type: FormatType;
  unit_price: number | string;
  quantity: number;
}

export interface PhysicalDelivery {
  id: string;
  shipping_address: string;
  city: string;
  country: string;
  tracking_number?: string;
  carrier_name?: string;
  statut: PhysicalDeliveryStatus;
  updated_at?: string;
}

export interface StudentOrder {
  id: string;
  total_amount: number | string;
  currency?: string;
  statut_paiement: PaymentStatus;
  statut_commande: OrderStatus;
  lignes: OrderItem[];
  livraison?: PhysicalDelivery;
  created_at: string;
}

export type OrderFormatFilter = 'all' | 'digital' | 'paper';
export type OrderStatusFilter = 'all' | 'in_progress' | 'completed' | 'failed_cancelled';
