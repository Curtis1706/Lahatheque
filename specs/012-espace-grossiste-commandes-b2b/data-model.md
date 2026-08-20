# Data Model: Module 12 - Espace Grossiste & Commandes Groupées B2B

**Feature Branch**: `012-espace-grossiste-commandes-b2b`  
**Created**: 2026-08-20  

---

## 1. Modèles Django Backend (`apps/commerce/models.py`)

### 1.1. Modèle `WholesaleProfile` (Profil Grossiste / Entreprise B2B)

```python
class WholesaleProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wholesale_profile"
    )
    company_name = models.CharField(max_length=255, verbose_name="Raison Sociale / Librairie")
    nif_number = models.CharField(max_length=50, blank=True, verbose_name="Numéro NIF / IFU")
    rccm_number = models.CharField(max_length=50, blank=True, verbose_name="Numéro RCCM")
    contact_person = models.CharField(max_length=150, verbose_name="Responsable Approvisionnement")
    phone_number = models.CharField(max_length=30, verbose_name="Téléphone de Contact / Astreinte")
    country = models.CharField(max_length=10, default="BJ", verbose_name="Pays Principal")
    warehouse_address = models.TextField(verbose_name="Adresse Entrepôt / Point de Livraison")
    discount_tier_override = models.ForeignKey(
        'WholesaleDiscountTier',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name="Palier de remise personnalisé"
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Profil Grossiste"
        verbose_name_plural = "Profils Grossistes"
```

### 1.2. Modèle `WholesaleDiscountTier` (Paliers de Remises Dégressives)

```python
class WholesaleDiscountTier(models.Model):
    name = models.CharField(max_length=100, verbose_name="Nom du Palier (ex: Volume Standard, Grand Compte)")
    min_quantity = models.PositiveIntegerField(default=20, verbose_name="Quantité Minimale Requise")
    digital_discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=25.00, verbose_name="Remise Licences Numériques (%)")
    print_discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=30.00, verbose_name="Remise Exemplaires Papier (%)")
    is_default = models.BooleanField(default=False)

    class Meta:
        verbose_name = "Palier de Remise Grossiste"
        verbose_name_plural = "Paliers de Remises Grossistes"
```

### 1.3. Modèle `WholesaleOrder` (Commande Groupée B2B)

```python
class WholesaleOrderStatus(models.TextChoices):
    PENDING = "pending", "En attente de validation"
    VALIDATED = "validated", "Validée (Proforma émise)"
    PROCESSING = "processing", "En préparation / Expédition"
    DELIVERED = "delivered", "Livrée & Licences activées"
    CANCELLED = "cancelled", "Annulée"

class WholesaleOrder(models.Model):
    reference = models.CharField(max_length=50, unique=True, verbose_name="Référence Commande")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="wholesale_orders")
    profile = models.ForeignKey(WholesaleProfile, on_delete=models.PROTECT, related_name="orders")
    status = models.CharField(max_length=30, choices=WholesaleOrderStatus.choices, default=WholesaleOrderStatus.PENDING)
    
    delivery_address = models.TextField(verbose_name="Adresse de Livraison des Cartons")
    contact_phone = models.CharField(max_length=30, verbose_name="Téléphone de Réception")
    
    total_digital_licenses = models.PositiveIntegerField(default=0)
    total_print_copies = models.PositiveIntegerField(default=0)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, verbose_name="Montant Total HT (XOF)")
    currency = models.CharField(max_length=10, default="XOF")
    
    carrier_name = models.CharField(max_length=100, blank=True, null=True, verbose_name="Transporteur Assigné")
    tracking_number = models.CharField(max_length=100, blank=True, null=True, verbose_name="Numéro de Suivi Colis")
    
    proforma_pdf_url = models.CharField(max_length=500, blank=True, null=True)
    cancel_reason = models.TextField(blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Commande Grossiste"
        verbose_name_plural = "Commandes Grossistes"
```

### 1.4. Modèle `WholesaleOrderItem` (Ligne de Commande B2B)

```python
class WholesaleOrderItem(models.Model):
    order = models.ForeignKey(WholesaleOrder, on_delete=models.CASCADE, related_name="items")
    book = models.ForeignKey('catalog.Ouvrage', on_delete=models.PROTECT)
    
    digital_licenses_qty = models.PositiveIntegerField(default=0)
    digital_unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    print_copies_qty = models.PositiveIntegerField(default=0)
    print_unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    subtotal = models.DecimalField(max_digits=14, decimal_places=2)

    class Meta:
        verbose_name = "Ligne de Commande Grossiste"
        verbose_name_plural = "Lignes de Commandes Grossistes"
```

---

## 2. Modèles TypeScript Frontend (`lib/types/wholesaler.ts`)

```typescript
export type WholesalerOrderStatus =
  | "pending"     // En attente de validation
  | "validated"   // Validée par l'administrateur
  | "processing"  // En préparation / expédition
  | "delivered"   // Livrée / licences activées
  | "cancelled";  // Annulée

export interface WholesalerBookItem {
  id: string;
  title: string;
  authors: string[];
  cover_url: string;
  isbn_digital: string;
  isbn_print?: string;
  discipline: string;
  publisher_name: string;
  digital_wholesale_price: number; // En Franc CFA (XOF)
  print_wholesale_price: number;   // En Franc CFA (XOF)
  public_price: number;
  min_quantity: number;
  stock_available_print: number;
  sample_excerpt_url?: string;
  summary: string;
}

export interface WholesalerCartItem {
  book_id: string;
  book: WholesalerBookItem;
  digital_licenses_qty: number;
  print_copies_qty: number;
}

export interface WholesalerOrderItem {
  book_id: string;
  title: string;
  authors: string[];
  isbn: string;
  digital_licenses_qty: number;
  digital_unit_price: number;
  print_copies_qty: number;
  print_unit_price: number;
  subtotal: number;
}

export interface WholesalerOrder {
  id: string;
  reference: string;
  created_at: string;
  company_name: string;
  delivery_address: string;
  contact_phone: string;
  items: WholesalerOrderItem[];
  total_digital_licenses: number;
  total_print_copies: number;
  total_amount: number;
  currency: string;
  status: WholesalerOrderStatus;
  invoice_url?: string;
  carrier_name?: string;
  tracking_number?: string;
  cancel_reason?: string;
  cancel_requested?: boolean;
  timeline: {
    step: string;
    date: string;
    description: string;
    done: boolean;
  }[];
}

export interface WholesalerNotification {
  id: string;
  type: "nouveaute" | "meilleure_vente";
  title: string;
  book_id: string;
  book_title: string;
  cover_url: string;
  description: string;
  created_at: string;
  is_read: boolean;
  wholesale_price: number;
}

export interface WholesalerKpis {
  pendingOrdersCount: number;
  totalLicensesPurchased: number;
  totalPrintCopiesPurchased: number;
  totalSpentAmount: number;
  unreadNotificationsCount: number;
}
```
