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
  created_at: string;
  payment_method: string;
  payment_status: 'paid' | 'pending' | 'failed' | 'refunded';
  gross_amount: number;
  discount_total: number;
  net_amount_paid: number;
  items_count: number;
  items: AdminSaleOrderItem[];
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
