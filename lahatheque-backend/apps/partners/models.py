"""Modèles institutionnels et Espace Université (Institution / UniversityProfile, Faculty, Department, StudentAffiliation, UniversityBouquetSubscription, UniversityPaperOrder, UniversityRoyaltyStatement)."""
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class Institution(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='university_profile',
        null=True,
        blank=True
    )
    name = models.CharField(max_length=255, verbose_name="Nom complet de l'établissement")
    code = models.CharField(max_length=50, unique=True, verbose_name="Code / Sigle (ex: UAC, UCAD, UNA)")
    short_name = models.CharField(max_length=50, blank=True, default="", verbose_name="Sigle court")
    country = models.CharField(max_length=10, default="BJ", verbose_name="Code Pays (BJ, SN, CI, NE, TG, GA, CD)")
    city = models.CharField(max_length=128, default="Cotonou", blank=True, verbose_name="Ville du campus")
    address = models.TextField(default="Campus d'Abomey-Calavi, Bénin", blank=True, verbose_name="Adresse géographique")
    domain_name = models.CharField(max_length=255, blank=True, default="", verbose_name="Nom de domaine web")
    
    # Responsables & Contact
    rector_name = models.CharField(max_length=128, default="", blank=True, verbose_name="Nom du Recteur / Président")
    academic_director_name = models.CharField(max_length=128, default="", blank=True, verbose_name="Directeur des Affaires Académiques / Scolarité")
    contact_email = models.EmailField(default="", blank=True, verbose_name="E-mail Officiel de Contact")
    contact_phone = models.CharField(max_length=32, default="", blank=True, verbose_name="Téléphone Officiel")
    
    # Coordonnées Financières pour Reversement des Redevances (15%)
    bank_name = models.CharField(max_length=128, blank=True, default="", verbose_name="Banque / Trésor Public")
    bank_iban = models.CharField(max_length=128, blank=True, default="", verbose_name="RIB / IBAN / Compte Trésorerie")
    bank_swift = models.CharField(max_length=32, blank=True, default="", verbose_name="Code BIC / SWIFT")
    momo_number = models.CharField(max_length=32, blank=True, default="", verbose_name="Compte Mobile Money Institutionnel")
    
    # Typologie Institutionnelle Étanche (Partenaire Ayant droit vs Cliente Souscriptrice)
    INSTITUTION_TYPE_CHOICES = (
        ('partner', 'Université Partenaire (Ayant droit)'),
        ('client', 'Université Cliente (Souscriptrice)'),
    )
    institution_type = models.CharField(
        max_length=20,
        choices=INSTITUTION_TYPE_CHOICES,
        default='client',
        db_index=True,
        verbose_name="Typologie de l'établissement"
    )

    # Contrat & Mandat
    contract_reference = models.CharField(max_length=64, default="CTR-UNIV-2025-01", verbose_name="Réf. Convention Cadre")
    royalty_rate = models.DecimalField(max_digits=5, decimal_places=2, default=15.00, null=True, blank=True, verbose_name="Taux de Redevance (%)")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["institution_type", "is_active"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.code or self.short_name})"

    # T018 : Codes des 4 universités partenaires historiques — leur statut 'partner' est inviolable.
    LOCKED_PARTNER_CODES = frozenset({'UAC', 'UP', 'UNSTIM', 'UNA'})

    def clean(self) -> None:
        """T018 : Interdit formellement de reclasser une des 4 institutions historiques en 'client'."""
        if self.code and self.code.upper() in self.LOCKED_PARTNER_CODES:
            if self.institution_type != 'partner':
                from django.core.exceptions import ValidationError
                raise ValidationError({
                    'institution_type': (
                        f"L'institution '{self.code}' fait partie des 4 universités partenaires fondatrices "
                        "(UAC, UP, UNSTIM, UNA). Son statut 'Partenaire Ayant droit' est verrouillé et ne peut "
                        "pas être modifié par voie administrative. Contactez l'équipe technique si une correction "
                        "exceptionnelle est nécessaire."
                    )
                })

    def save(self, *args, **kwargs):
        # T018 : Appliquer la validation métier avant chaque sauvegarde
        self.full_clean(exclude=['user'])  # exclude 'user' car OneToOneField peut être null
        if not self.short_name and self.code:
            self.short_name = self.code
        elif not self.code and self.short_name:
            self.code = self.short_name
        super().save(*args, **kwargs)


UniversityProfile = Institution


class Faculty(models.Model):
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name='faculties')
    name = models.CharField(max_length=255, verbose_name="Nom complet de la Faculté / UFR")
    code = models.CharField(max_length=50, verbose_name="Code / Sigle (ex: FADESP, FSS, FASEG)")
    disciplines = models.JSONField(default=list, blank=True, verbose_name="Disciplines enseignées")
    student_count = models.PositiveIntegerField(default=0, verbose_name="Nombre d'étudiants inscrits")
    dean_name = models.CharField(max_length=128, default="", blank=True, verbose_name="Nom du Doyen")
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["code"]

    def __str__(self) -> str:
        return f"{self.code} - {self.name} ({self.institution.code})"


UniversityFaculty = Faculty


class Department(models.Model):
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=255)


class StudentAffiliation(models.Model):
    STATUS_CHOICES = (
        ('pending', 'En attente de validation'),
        ('approved', 'Validé / Actif'),
        ('rejected', 'Rejeté'),
        ('suspended', 'Suspendu'),
        ('expired', 'Expiré'),
    )

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='affiliations', null=True, blank=True)
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name='student_affiliations')
    faculty = models.ForeignKey(Faculty, on_delete=models.SET_NULL, null=True, blank=True, related_name='affiliations')
    department = models.ForeignKey(Department, on_delete=models.CASCADE, null=True, blank=True)
    student_name = models.CharField(max_length=128, default="", blank=True, verbose_name="Nom & Prénom")
    student_email = models.EmailField(default="", blank=True, verbose_name="E-mail personnel")
    student_phone = models.CharField(max_length=32, default="", blank=True, verbose_name="Téléphone")
    student_card_number = models.CharField(max_length=100, db_index=True, verbose_name="Matricule Académique")
    level = models.CharField(max_length=32, default="Licence 1", verbose_name="Niveau d'étude")
    carte_etudiant_image = models.CharField(max_length=500, null=True, blank=True, verbose_name="URL justificatif / carte")
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    motif_rejet = models.TextField(blank=True, default='')
    is_validated = models.BooleanField(default=False)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='reviewed_affiliations')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.student_card_number} - {self.student_name} ({self.institution.code})"


UniversityStudentAffiliation = StudentAffiliation


class EtudiantInscrit(models.Model):
    """Liste officielle des étudiants importée par l'université (CSV/Excel) pour auto-validation."""
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name='etudiants_inscrits')
    matricule = models.CharField(max_length=100, db_index=True)
    nom = models.CharField(max_length=150)
    prenom = models.CharField(max_length=150)
    faculte = models.CharField(max_length=150, blank=True, default='')
    filiere = models.CharField(max_length=150, blank=True, default='')
    annee_academique = models.CharField(max_length=20, default='2025-2026')
    is_claimed = models.BooleanField(default=False)
    claimed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='claimed_matricules')
    claimed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('institution', 'matricule')

    def __str__(self):
        return f"{self.matricule} - {self.nom} {self.prenom} ({self.institution.code})"


class UniversityBouquetSubscription(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    offering_id = models.UUIDField(null=True, blank=True)
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name='bouquet_subscriptions')
    title = models.CharField(max_length=255, verbose_name="Titre du Bouquet")
    bouquet_type = models.CharField(
        max_length=32,
        choices=[
            ("general", "Bouquet Général (Catalogue Intégral)"),
            ("discipline", "Par Discipline"),
            ("university", "Intégral Université"),
            ("country", "Par Pays"),
            ("custom", "Personnalisé"),
        ],
        default="discipline"
    )
    faculty_code = models.CharField(max_length=32, blank=True, default="", verbose_name="Faculté associée (obsolète)")
    discipline = models.CharField(max_length=128, blank=True, default="", verbose_name="Discipline")
    books_count = models.PositiveIntegerField(default=0)
    subscription_period = models.CharField(
        max_length=10,
        choices=[('monthly', 'Mensuel (30j)'), ('annual', 'Annuel (365j)')],
        default='annual',
        verbose_name="Formule de souscription"
    )
    price_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0.00, verbose_name="Montant acquitté (XOF)")
    annual_price = models.DecimalField(max_digits=12, decimal_places=2, default=1000000.00)
    currency = models.CharField(max_length=10, default="XOF")
    status = models.CharField(max_length=20, choices=[("active", "Actif"), ("pending", "En attente"), ("expired", "Expiré")], default="active")
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(default=timezone.now)
    payment_transaction = models.ForeignKey(
        'commerce.PaymentTransaction', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='bouquet_subscriptions'
    )

    class Meta:
        ordering = ["-start_date"]

    @classmethod
    def compute_end_date(cls, existing_end_date, period: str):
        """Calcule la date d'échéance avec prolongation cumulative (décision Q2)."""
        from datetime import timedelta
        days = 30 if period == 'monthly' else 365
        today = timezone.now().date()
        base_date = existing_end_date if (existing_end_date and existing_end_date > today) else today
        return base_date + timedelta(days=days)


class UniversityPaperOrder(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name='paper_orders')
    order_number = models.CharField(max_length=64, unique=True, db_index=True)
    delivery_campus = models.CharField(max_length=255, verbose_name="Campus & Bâtiment de Faculté pour Livraison")
    contact_person = models.CharField(max_length=128, default="", blank=True, verbose_name="Réceptionnaire")
    contact_phone = models.CharField(max_length=32, default="", blank=True, verbose_name="Téléphone Réceptionnaire")
    items = models.JSONField(default=list, verbose_name="Lignes de commande [{book_id, title, quantity, unit_price}]")
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    currency = models.CharField(max_length=10, default="XOF")
    status = models.CharField(max_length=32, choices=[("pending", "En attente"), ("processing", "En préparation"), ("in_transit", "En cours de livraison"), ("delivered", "Livré"), ("cancelled", "Annulé")], default="pending")
    tracking_number = models.CharField(max_length=64, blank=True, default="")
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]


class UniversityRoyaltyStatement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name='royalty_statements')
    reference = models.CharField(max_length=64, unique=True, db_index=True)
    period = models.CharField(max_length=64, verbose_name="Période")
    total_sales_catalog = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    royalty_rate = models.DecimalField(max_digits=5, decimal_places=2, default=15.00)
    net_royalty_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    currency = models.CharField(max_length=10, default="XOF")
    status = models.CharField(max_length=20, choices=[("paid", "Réglé / Transféré"), ("pending", "En traitement"), ("available", "Disponible pour virement")], default="available")
    pdf_statement_url = models.CharField(max_length=500, blank=True, default="")
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        ordering = ["-created_at"]


class BouquetOffering(models.Model):
    """
    Bouquet documentaire proposable aux universités et clients.
    Types automatiques (discipline/university/country) : le contenu est calculé en direct.
    Type 'custom' : sélection manuelle de livres par l'Admin.
    """
    BOUQUET_TYPE_CHOICES = [
        ("general", "Bouquet Général (Catalogue Intégral)"),
        ("discipline", "Par Discipline"),
        ("university", "Intégral Université"),
        ("country", "Par Pays"),
        ("custom", "Personnalisé"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255)
    bouquet_type = models.CharField(max_length=32, choices=BOUQUET_TYPE_CHOICES, default="discipline")

    discipline = models.CharField(max_length=128, blank=True, default="")
    faculty_code = models.CharField(max_length=32, blank=True, default="")
    target_institution = models.ForeignKey(
        Institution, null=True, blank=True, on_delete=models.SET_NULL,
        related_name="bouquet_offerings_scoped",
        help_text="Obligatoire pour le type Intégral Université"
    )
    country = models.CharField(max_length=2, blank=True, default="")

    custom_books = models.ManyToManyField(
        'catalog.Ouvrage', blank=True, related_name="custom_bouquet_offerings"
    )

    monthly_price = models.DecimalField(max_digits=12, decimal_places=2, default=50000.00, verbose_name="Tarif Mensuel (XOF)")
    annual_price = models.DecimalField(max_digits=12, decimal_places=2, default=500000.00, verbose_name="Tarif Annuel (XOF)")
    currency = models.CharField(max_length=10, default="XOF")
    description = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name="bouquet_offerings_created"
    )
    created_at = models.DateTimeField(auto_now_add=True, null=True)
    updated_at = models.DateTimeField(auto_now=True, null=True)

    class Meta:
        ordering = ["title"]

    def clean(self) -> None:
        """Validation métier stricte : université obligatoire si type=university."""
        from django.core.exceptions import ValidationError
        if self.bouquet_type == "university" and not self.target_institution:
            raise ValidationError({
                'target_institution': "La sélection d'une université partenaire est obligatoire pour le type « Intégral Université »."
            })
        if self.monthly_price is not None and self.monthly_price < 0:
            raise ValidationError({'monthly_price': "Le tarif mensuel ne peut pas être négatif."})
        if self.annual_price is not None and self.annual_price < 0:
            raise ValidationError({'annual_price': "Le tarif annuel ne peut pas être négatif."})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def get_books_queryset(self, requesting_institution=None):
        """
        Calcule le contenu RÉEL du bouquet en interrogeant le catalogue en direct.
        """
        from apps.catalog.models import Ouvrage

        if self.bouquet_type == "custom":
            return self.custom_books.filter(status="published")

        qs = Ouvrage.objects.filter(status="published")

        if self.bouquet_type == "general":
            return qs
        elif self.bouquet_type == "discipline" and self.discipline:
            from django.db.models import Q
            qs = qs.filter(
                Q(discipline__name__icontains=self.discipline) |
                Q(disciplines__name__icontains=self.discipline)
            ).distinct()
        elif self.bouquet_type == "university":
            target = self.target_institution or requesting_institution
            if target:
                qs = qs.filter(institution=target)
            else:
                qs = qs.none()
        elif self.bouquet_type == "country" and self.country:
            qs = qs.filter(country=self.country)

        return qs

    @property
    def books_count(self):
        return self.get_books_queryset().count()

    def get_real_annual_price(self):
        """
        Calcule le prix annuel réel du bouquet.
        Si un tarif annuel spécifique est défini (> 0), il est prioritaire.
        Pour le Bouquet Général sans tarif personnalisé, c'est la somme exacte de tous les prix numériques du catalogue.
        """
        if self.annual_price is not None and self.annual_price > 0:
            return self.annual_price
        if self.bouquet_type == "general":
            from django.db.models import Sum
            from decimal import Decimal
            total = self.get_books_queryset().aggregate(total=Sum('price_digital'))['total']
            return total if total is not None else Decimal('0.00')
        return self.annual_price

    def get_real_monthly_price(self):
        """
        Calcule le tarif mensuel réel du bouquet.
        Si un tarif mensuel spécifique est défini (> 0), il est prioritaire.
        Sinon (pour le Bouquet Général), formule mensuelle au 1/10ème du tarif annuel.
        """
        if self.monthly_price is not None and self.monthly_price > 0:
            return self.monthly_price
        from decimal import Decimal
        annual = Decimal(str(self.get_real_annual_price()))
        return (annual / Decimal('10.0')).quantize(Decimal('0.01'))





