# Data Model: Suite « Gestion des Finances »

**Feature**: Refonte de la Suite « Gestion des Finances »
**Branch**: `003-finance-management-suite`
**Date**: 2026-09-08

## 1. Modèles Django Backend

### `apps.rights.models.PayoutRequest`
Représente une demande de décaissement ou de liquidation de droits.
```python
class PayoutRequest(models.Model):
    STATUS_CHOICES = (
        ('pending', 'En attente'),
        ('approved', 'Approuvée'),
        ('processed', 'Payée / Traitée'),
        ('rejected', 'Rejetée'),
    )
    BENEFICIARY_TYPE_CHOICES = (
        ('author', 'Auteur'),
        ('publisher', 'Éditeur Tiers'),
        ('university', 'Université Partenaire'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payout_requests')
    beneficiary_type = models.CharField(max_length=20, choices=BENEFICIARY_TYPE_CHOICES, default='author')
    amount = models.DecimalField(max_digits=12, decimal_places=2)  # Montant net dû
    gross_base_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00) # Assiette brute
    period_label = models.CharField(max_length=50, blank=True, default='') # Ex: "Août 2026"
    
    # Modalités de paiement
    payment_method = models.CharField(max_length=50, default='mobile_money')
    payment_details_masked = models.CharField(max_length=255, blank=True, default='')
    
    # Traçabilité du règlement (Obligatoire à la validation)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    transaction_reference = models.CharField(max_length=100, blank=True, null=True)
    payout_date = models.DateField(blank=True, null=True)
    receipt_file = models.FileField(upload_to='payout_receipts/%Y/%m/', blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)
    
    # Audit
    processed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='processed_payouts')
    processed_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

### `apps.commerce.models.Order` (Cycle de vie complet & Console Admin)
```python
class Order(models.Model):
    STATUT_PAIEMENT_CHOICES = (
        ('pending', 'En attente'),
        ('paid', 'Payé'),
        ('credit', 'Achat à crédit'),
        ('failed', 'Échoué'),
        ('cancelled', 'Annulé'),
        ('abandoned', 'Panier abandonné'),
        ('refunded', 'Remboursé'),
    )
    STATUT_COMMANDE_CHOICES = (
        ('pending', 'En attente'),
        ('processing', 'En traitement'),
        ('completed', 'Terminée'),
        ('cancelled', 'Annulée'),
    )
    MODE_PAIEMENT_CHOICES = (
        ('mobile_money', 'Mobile Money en ligne (Moneroo)'),
        ('momo_direct', 'Mobile Money direct (Transfert flotte)'),
        ('cash', 'Espèces au comptoir'),
        ('bank_transfer', 'Virement bancaire'),
        ('check', 'Chèque bancaire'),
        ('credit', 'Dépôt / Achat à crédit'),
    )

    # Identifiants & Acteurs
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')
    numero_commande = models.CharField(max_length=50, unique=True, blank=True, null=True)

    # Statuts & Finances
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    currency = models.ForeignKey(Currency, on_delete=models.SET_NULL, null=True, blank=True)
    statut_paiement = models.CharField(max_length=20, choices=STATUT_PAIEMENT_CHOICES, default='pending')
    statut_commande = models.CharField(max_length=20, choices=STATUT_COMMANDE_CHOICES, default='pending')
    mode_paiement = models.CharField(max_length=30, choices=MODE_PAIEMENT_CHOICES, default='mobile_money')

    # Achat à crédit / Dépôt
    is_credit_purchase = models.BooleanField(default=False)
    credit_due_date = models.DateField(blank=True, null=True)
    credit_granted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='credit_orders_granted')

    # Rapprochement & Audit
    payment_transaction = models.ForeignKey(PaymentTransaction, on_delete=models.SET_NULL, null=True, blank=True)
    manual_payment_confirmed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='manual_orders_confirmed')
    manual_payment_reference = models.CharField(max_length=150, blank=True, default='')
    abandoned_at = models.DateTimeField(blank=True, null=True)
    last_reminder_sent_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
```

---

## 2. DTO & Interfaces TypeScript Frontend

### `lib/types/admin-finance.ts`

```typescript
// =========================================================================
// VENTES & REVENUS CONSOLIDÉS (/admin/sales)
// =========================================================================

export type SaleChannel = 'b2c_individual' | 'b2b_university' | 'b2b_wholesale';
export type ItemFormat = 'digital' | 'paper' | 'audio' | 'bouquet';

export interface AdminSaleOrderItem {
  id: string;
  book_title: string;
  isbn?: string;
  format: ItemFormat;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  subtotal: number;
}

export interface AdminSaleOrder {
  id: string;
  order_reference: string;
  channel: SaleChannel;
  channel_label: string;
  buyer_name: string;
  buyer_email: string;
  buyer_role: 'student' | 'author' | 'university' | 'wholesaler' | 'client';
  payment_method: string;
  payment_status: OrderPaymentStatus;
  gross_amount: number;
  discount_total: number;
  net_amount_paid: number;
  items_count: number;
  items: AdminSaleOrderItem[];
}

export type OrderPaymentStatus = 'paid' | 'pending' | 'credit' | 'failed' | 'cancelled' | 'abandoned' | 'refunded';
export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

export interface AdminOrderRow {
  id: string;
  order_reference: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_role: string;
  channel: SaleChannel;
  total_amount: number;
  statut_paiement: OrderPaymentStatus;
  statut_paiement_display: string;
  statut_commande: OrderStatus;
  statut_commande_display: string;
  mode_paiement: string;
  mode_paiement_display: string;
  is_credit_purchase: boolean;
  credit_due_date?: string | null;
  items_count: number;
  items: AdminSaleOrderItem[];
  moneroo_id?: string | null;
  created_at: string;
  abandoned_at?: string | null;
}

// =========================================================================
// DEMANDES DE VERSEMENT (/admin/payouts)
// =========================================================================

export interface AdminPayoutRequest {
  id: string;
  beneficiary_id: string;
  beneficiary_name: string;
  beneficiary_type: 'author' | 'publisher' | 'university';
  beneficiary_email: string;
  purpose_label: string; // Ex: "Droits d'auteur - K-Nearest Neighbors"
  gross_base_amount: number;
  effective_rate_percent: number;
  net_payout_amount: number;
  payment_method: 'mobile_money' | 'bank_transfer';
  payment_details_preview: string; // Ex: "MTN MoMo: +229 97 •••• 12"
  status: 'pending' | 'approved' | 'processed' | 'rejected';
  transaction_reference?: string | null;
  payout_date?: string | null;
  receipt_file_url?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  processed_at?: string | null;
}

export interface AdminPayoutKpis {
  total_pending_amount: number;
  pending_count: number;
  total_settled_this_month: number;
  settled_this_month_count: number;
  distinct_beneficiaries_count: number;
  average_processing_time_hours: number;
}

// =========================================================================
// SYNTHÈSE DES PARTENAIRES & REDEVANCES (/admin/finance)
// =========================================================================

export interface AdminPartnerBookDetail {
  book_id: string;
  title: string;
  format: ItemFormat;
  units_or_reads_count: number;
  effective_rate_percent: number;
  gross_revenue_generated: number;
  royalties_earned: number;
}

export interface AdminPartnerRoyaltySummary {
  partner_id: string;
  partner_name: string;
  partner_type: 'author' | 'publisher' | 'university';
  books_count: number;
  total_units_sold: number;
  average_rate_percent: number;
  total_revenue_generated: number;
  total_royalties_due: number;
  total_royalties_paid: number;
  balance_outstanding: number;
  books: AdminPartnerBookDetail[];
}
```
