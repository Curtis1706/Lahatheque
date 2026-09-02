"""Modèles commerciaux (Currency, SubscriptionPlan, Subscription, PaymentTransaction)."""
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone

class Currency(models.Model):
    code = models.CharField(max_length=3, unique=True) # ISO 4217: XOF, XAF, CDF, EUR, USD
    is_pegged = models.BooleanField(default=False) # True pour XOF et XAF
    peg_rate_to_eur = models.DecimalField(max_digits=12, decimal_places=6, null=True, blank=True)
    last_updated_at = models.DateTimeField(auto_now=True)

class SubscriptionPlan(models.Model):
    name = models.CharField(max_length=255)
    plan_type = models.CharField(max_length=50) # individual / institution_bouquet
    price_amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.ForeignKey(Currency, on_delete=models.PROTECT)
    duration_days = models.IntegerField(default=365)
    max_concurrent_users = models.IntegerField(default=1)

class Subscription(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    institution = models.ForeignKey('partners.Institution', null=True, blank=True, on_delete=models.SET_NULL)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)
    starts_at = models.DateTimeField()
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)

class PaymentTransaction(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    moneroo_id = models.CharField(max_length=255, null=True, blank=True, unique=True)
    stripe_payment_intent = models.CharField(max_length=255, null=True, blank=True, unique=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.ForeignKey(Currency, on_delete=models.PROTECT)
    amount_converted_xof = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=30, default='pending')
    raw_webhook_payload = models.JSONField(default=dict, blank=True)

class WebhookEvent(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'En attente'
        PROCESSED = 'processed', 'Traité'
        FAILED = 'failed', 'Échoué'

    event_id = models.CharField(max_length=255, unique=True)
    event_type = models.CharField(max_length=100)
    payload = models.JSONField(default=dict)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    error_message = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(null=True, blank=True)

class Order(models.Model):
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('paid', 'Payé'),
        ('failed', 'Échoué'),
        ('refunded', 'Remboursé'),
    ]
    ORDER_STATUS_CHOICES = [
        ('pending', 'En attente'),
        ('processing', 'En traitement'),
        ('completed', 'Terminée'),
        ('cancelled', 'Annulée'),
        ('returned', 'Retournée'),
    ]
    ORDER_TYPE_CHOICES = [
        ('rentree_scolaire', 'Rentrée scolaire'),
        ('personnel', 'Personnel'),
        ('institutionnel', 'Institutionnel'),
    ]
    PAYMENT_METHOD_CHOICES = [
        ('mobile_money', 'Mobile Money'),
        ('virement', 'Virement bancaire'),
        ('especes', 'Espèces'),
        ('carte', 'Carte bancaire'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='commandes')
    total_amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.ForeignKey(Currency, on_delete=models.PROTECT)
    statut_paiement = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    statut_commande = models.CharField(max_length=20, choices=ORDER_STATUS_CHOICES, default='pending')
    type_commande = models.CharField(
        max_length=20, choices=ORDER_TYPE_CHOICES, default='personnel'
    )
    mode_paiement = models.CharField(
        max_length=20, choices=PAYMENT_METHOD_CHOICES, default='mobile_money'
    )
    payment_transaction = models.ForeignKey(PaymentTransaction, null=True, blank=True, on_delete=models.SET_NULL, related_name='commandes')
    is_credit_purchase = models.BooleanField(default=False)
    credit_due_date = models.DateField(null=True, blank=True)
    credit_granted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='credits_accordes'
    )
    returned_at = models.DateTimeField(null=True, blank=True)
    return_reason = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

class LigneCommande(models.Model):
    FORMAT_CHOICES = [
        ('digital', 'Numérique (EPUB/PDF)'),
        ('paper', 'Livre Papier'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    commande = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='lignes')
    ouvrage = models.ForeignKey('catalog.Ouvrage', on_delete=models.CASCADE, related_name='lignes_commandes')
    format_type = models.CharField(max_length=20, choices=FORMAT_CHOICES, default='digital')
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    quantity = models.IntegerField(default=1)

class PhysicalDelivery(models.Model):
    STATUS_CHOICES = [
        ('en_preparation', 'En préparation'),
        ('expedie', 'Expédié'),
        ('livre', 'Livré'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    commande = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='livraison')
    shipping_address = models.TextField()
    city = models.CharField(max_length=100)
    country = models.CharField(max_length=2, default='BJ')
    date_livraison_souhaitee = models.DateField(null=True, blank=True)
    plage_horaire_debut = models.TimeField(null=True, blank=True)
    plage_horaire_fin = models.TimeField(null=True, blank=True)
    tracking_number = models.CharField(max_length=100, blank=True, default='')
    carrier_name = models.CharField(max_length=100, blank=True, default='')
    delivery_service = models.CharField(
        max_length=100, blank=True, default='',
        help_text="Service de livraison choisi par le Gestionnaire (ex: DHL, coursier local, retrait en agence)"
    )
    delivery_fee = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Frais de livraison définis par le Gestionnaire selon le service choisi"
    )
    statut = models.CharField(max_length=30, choices=STATUS_CHOICES, default='en_preparation')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Entrepot(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=128, db_index=True)
    code = models.CharField(max_length=32, unique=True, db_index=True) # ex: "WAR-CTN-01"
    pays = models.CharField(max_length=64, db_index=True) # Bénin, Sénégal, Côte d'Ivoire...
    ville = models.CharField(max_length=128)
    adresse = models.TextField()
    responsable_nom = models.CharField(max_length=128, blank=True, default='')
    telephone = models.CharField(max_length=32, blank=True, default='')
    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "commerce_entrepot"
        ordering = ["pays", "nom"]

    def __str__(self) -> str:
        return f"{self.nom} ({self.pays})"


class StockOuvrage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ouvrage = models.ForeignKey(
        'catalog.Ouvrage',
        on_delete=models.CASCADE,
        related_name="stocks_entrepots"
    )
    entrepot = models.ForeignKey(
        Entrepot,
        on_delete=models.CASCADE,
        related_name="stocks_ouvrages"
    )
    quantite_reelle = models.IntegerField(default=0)
    quantite_reservee = models.IntegerField(default=0)
    seuil_alerte = models.IntegerField(default=10)
    last_restock_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "commerce_stock_ouvrage"
        constraints = [
            models.UniqueConstraint(
                fields=["ouvrage", "entrepot"],
                name="unique_stock_ouvrage_par_entrepot"
            ),
        ]

    @property
    def quantite_disponible(self) -> int:
        return max(0, self.quantite_reelle - self.quantite_reservee)

    @property
    def statut(self) -> str:
        if self.quantite_disponible == 0:
            return "out_of_stock"
        if self.quantite_disponible <= self.seuil_alerte:
            return "low_stock"
        return "in_stock"


class MouvementStock(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    stock = models.ForeignKey(
        StockOuvrage,
        on_delete=models.CASCADE,
        related_name="mouvements"
    )
    TYPE_CHOICES = [
        ("restock", "Réassort fournisseur"),
        ("sale", "Sortie vente commande"),
        ("return", "Retour client / Annulation"),
        ("adjustment", "Ajustement inventaire / Avarie"),
        ("manual_exit", "Sortie manuelle"),
    ]
    type_mouvement = models.CharField(max_length=32, choices=TYPE_CHOICES, db_index=True)
    quantite = models.IntegerField()
    reference_document = models.CharField(max_length=64, blank=True, default='')
    motif = models.TextField(blank=True, default='')
    auteur = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="mouvements_stock_effectues"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "commerce_mouvement_stock"
        ordering = ["-created_at"]


# ─── Modèles Grossiste & Commandes Groupées B2B ───────────────────────────────

class WholesaleDiscountTier(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=128, verbose_name="Nom du Palier (ex: Grand Compte)")
    min_quantity = models.PositiveIntegerField(default=20, verbose_name="Quantité Minimale Requise")
    digital_discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=25.00, verbose_name="Remise Licences Numériques (%)")
    print_discount_percent = models.DecimalField(max_digits=5, decimal_places=2, default=30.00, verbose_name="Remise Exemplaires Papier (%)")
    description = models.TextField(blank=True, default="")
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "commerce_wholesale_discount_tier"
        verbose_name = "Palier de Remise Grossiste"
        verbose_name_plural = "Paliers de Remises Grossistes"

    def __str__(self) -> str:
        return f"{self.name} (Min: {self.min_quantity} ex.)"


class WholesaleProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="wholesale_profile"
    )
    company_name = models.CharField(max_length=255, verbose_name="Raison Sociale")
    trade_name = models.CharField(max_length=255, blank=True, default="", verbose_name="Nom Commercial / Enseigne")
    nif_number = models.CharField(max_length=64, blank=True, default="", verbose_name="Numéro NIF / IFU")
    rccm_number = models.CharField(max_length=64, blank=True, default="", verbose_name="Numéro RCCM")
    contact_person = models.CharField(max_length=128, verbose_name="Responsable Achats / Contact")
    contact_email = models.EmailField(verbose_name="Email Réception Factures")
    contact_phone = models.CharField(max_length=32, verbose_name="Téléphone d'Astreinte")
    country = models.CharField(max_length=10, default="BJ", verbose_name="Pays")
    city = models.CharField(max_length=128, default="Cotonou", verbose_name="Ville")
    headquarters_address = models.TextField(verbose_name="Adresse Siège Social")
    warehouse_address = models.TextField(verbose_name="Adresse Entrepôt de Réception")
    tier = models.ForeignKey(
        WholesaleDiscountTier,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="profiles",
        verbose_name="Palier Tarifaire Assigné"
    )
    payment_terms = models.CharField(
        max_length=255,
        default="Virement bancaire / Mobile Money à validation de facture proforma"
    )
    verified_partner = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "commerce_wholesale_profile"
        verbose_name = "Profil Grossiste"
        verbose_name_plural = "Profils Grossistes"

    def __str__(self) -> str:
        return f"{self.company_name} ({self.country})"


class WholesaleOrderStatus(models.TextChoices):
    PENDING = "pending", "En attente de validation"
    VALIDATED = "validated", "Validée (Proforma émise)"
    PROCESSING = "processing", "En préparation / Expédition"
    DELIVERED = "delivered", "Livrée & Licences activées"
    CANCELLED = "cancelled", "Annulée"


class WholesaleOrder(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    reference = models.CharField(max_length=64, unique=True, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="wholesale_orders"
    )
    profile = models.ForeignKey(
        WholesaleProfile,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="orders"
    )
    company_name = models.CharField(max_length=255)
    delivery_address = models.TextField()
    contact_phone = models.CharField(max_length=32)
    
    total_digital_licenses = models.PositiveIntegerField(default=0)
    total_print_copies = models.PositiveIntegerField(default=0)
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    currency = models.CharField(max_length=10, default="XOF")
    status = models.CharField(
        max_length=32,
        choices=WholesaleOrderStatus.choices,
        default=WholesaleOrderStatus.PENDING,
        db_index=True
    )
    
    carrier_name = models.CharField(max_length=128, blank=True, default="")
    tracking_number = models.CharField(max_length=128, blank=True, default="")
    invoice_url = models.CharField(max_length=500, blank=True, default="")
    cancel_reason = models.TextField(blank=True, default="")
    cancel_requested = models.BooleanField(default=False)

    # ─── Fonctionnalité Commande à Crédit / Dépôt-Vente Grossiste ───────────
    # Permet aux grossistes d'effectuer des commandes en dépôt avec paiement différé à échéance
    is_credit_purchase = models.BooleanField(default=False, verbose_name="Achat / Dépôt à Crédit Grossiste")
    credit_due_date = models.DateField(null=True, blank=True, verbose_name="Date d'échéance de paiement du crédit")
    credit_granted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="wholesale_credits_accordes",
        verbose_name="Validateur du crédit"
    )
    returned_at = models.DateTimeField(null=True, blank=True, verbose_name="Date de retour d'invendus")
    return_reason = models.TextField(blank=True, default="", verbose_name="Motif de retour des invendus")
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "commerce_wholesale_order"
        ordering = ["-created_at"]
        verbose_name = "Commande Grossiste"
        verbose_name_plural = "Commandes Grossistes"

    def __str__(self) -> str:
        return f"{self.reference} - {self.company_name} ({self.get_status_display()})"


class WholesaleOrderItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    order = models.ForeignKey(
        WholesaleOrder,
        on_delete=models.CASCADE,
        related_name="items"
    )
    book = models.ForeignKey(
        'catalog.Ouvrage',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="wholesale_order_items"
    )
    title = models.CharField(max_length=255)
    authors = models.JSONField(default=list)
    isbn = models.CharField(max_length=64, blank=True, default="")
    
    digital_licenses_qty = models.PositiveIntegerField(default=0)
    digital_unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    print_copies_qty = models.PositiveIntegerField(default=0)
    print_unit_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    
    subtotal = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)

    class Meta:
        db_table = "commerce_wholesale_order_item"
        verbose_name = "Ligne Commande Grossiste"
        verbose_name_plural = "Lignes Commandes Grossistes"


class WholesaleNotification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="wholesale_notifications"
    )
    TYPE_CHOICES = [
        ("nouveaute", "Nouveauté éditoriale"),
        ("meilleure_vente", "Meilleure vente"),
        ("reassort", "Réassort de stock"),
        ("expedition", "Expédition transporteur"),
    ]
    notification_type = models.CharField(max_length=32, choices=TYPE_CHOICES, default="nouveaute")
    title = models.CharField(max_length=255)
    description = models.TextField()
    book = models.ForeignKey(
        'catalog.Ouvrage',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="wholesale_notifications"
    )
    wholesale_price = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "commerce_wholesale_notification"
        ordering = ["-created_at"]


class ClientBouquetSubscription(models.Model):
    """Souscription directe d'un Client à un bouquet documentaire (CDC section 8)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bouquet_subscriptions'
    )
    offering_id = models.UUIDField()
    title = models.CharField(max_length=255)
    price_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    currency = models.CharField(max_length=10, default="XOF")
    status = models.CharField(
        max_length=20,
        choices=[("active", "Actif"), ("expired", "Expiré"), ("cancelled", "Annulé")],
        default="active"
    )
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]
