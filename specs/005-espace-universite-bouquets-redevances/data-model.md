# Data Model: Module 5 - Espace Université (Partenaire Externe)

## 1. Modèles Backend Django (`apps/university_portal/models.py`)

```python
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class UniversityProfile(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="university_profile", null=True, blank=True)
    name = models.CharField(max_length=255, verbose_name="Nom de l'Université (ex: Université d'Abomey-Calavi)")
    short_name = models.CharField(max_length=32, verbose_name="Sigle / Acronyme (ex: UAC, UCAD, UNA)")
    country = models.CharField(max_length=10, default="BJ", verbose_name="Code Pays (BJ, SN, CI, NE, TG, GA, CD)")
    city = models.CharField(max_length=128, default="Cotonou", verbose_name="Ville du Campus Principal")
    address = models.TextField(default="Campus d'Abomey-Calavi, Bénin", blank=True, verbose_name="Adresse Géographique du Siège")
    
    # Responsables de l'Établissement
    rector_name = models.CharField(max_length=128, default="", blank=True, verbose_name="Nom du Recteur / Président")
    academic_director_name = models.CharField(max_length=128, default="", blank=True, verbose_name="Directeur des Affaires Académiques / Scolarité")
    contact_email = models.EmailField(default="", blank=True, verbose_name="E-mail Officiel de Contact")
    contact_phone = models.CharField(max_length=32, default="", blank=True, verbose_name="Téléphone Officiel")
    
    # Coordonnées Financières pour Reversement des Redevances (15%)
    bank_name = models.CharField(max_length=128, blank=True, default="", verbose_name="Banque / Trésor Public")
    bank_iban = models.CharField(max_length=128, blank=True, default="", verbose_name="RIB / IBAN / Compte Trésorerie")
    bank_swift = models.CharField(max_length=32, blank=True, default="", verbose_name="Code BIC / SWIFT")
    momo_number = models.CharField(max_length=32, blank=True, default="", verbose_name="Compte Mobile Money Institutionnel")
    
    # Contrat & Mandat
    contract_reference = models.CharField(max_length=64, default="CTR-UNIV-2025-01", verbose_name="Réf. Convention Cadre")
    royalty_rate = models.DecimalField(max_digits=5, decimal_places=2, default=15.00, verbose_name="Taux de Redevance (%)")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "university_profile"
        ordering = ["name"]

    def __str__(self) -> str:
        return f"{self.name} ({self.short_name})"


class UniversityFaculty(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    university = models.ForeignKey(UniversityProfile, on_delete=models.CASCADE, related_name="faculties")
    name = models.CharField(max_length=255, verbose_name="Nom complet de la Faculté / UFR (ex: Faculté de Droit et de Science Politique)")
    code = models.CharField(max_length=32, verbose_name="Code / Sigle (ex: FADESP, FSS, FASEG, FAST, FLASH)")
    disciplines = models.JSONField(default=list, blank=True, verbose_name="Disciplines enseignées")
    student_count = models.PositiveIntegerField(default=0, verbose_name="Nombre d'étudiants inscrits")
    dean_name = models.CharField(max_length=128, default="", blank=True, verbose_name="Nom du Doyen")

    class Meta:
        db_table = "university_faculty"
        ordering = ["code"]


class UniversityBouquetSubscription(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    university = models.ForeignKey(UniversityProfile, on_delete=models.CASCADE, related_name="bouquet_subscriptions")
    title = models.CharField(max_length=255, verbose_name="Titre du Bouquet")
    bouquet_type = models.CharField(max_length=32, choices=[("discipline", "Par Discipline"), ("faculty", "Par Faculté"), ("university", "Intégral Université"), ("custom", "Personnalisé")])
    faculty_code = models.CharField(max_length=32, blank=True, default="", verbose_name="Faculté associée si applicable")
    books_count = models.PositiveIntegerField(default=0)
    annual_price = models.DecimalField(max_digits=12, decimal_places=2, default=1000000.00)
    currency = models.CharField(max_length=10, default="XOF")
    status = models.CharField(max_length=20, choices=[("active", "Actif"), ("pending", "En attente"), ("expired", "Expiré")], default="active")
    start_date = models.DateField(default=timezone.now)
    end_date = models.DateField()
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "university_bouquet_subscription"
        ordering = ["-start_date"]


class UniversityPaperOrder(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    university = models.ForeignKey(UniversityProfile, on_delete=models.CASCADE, related_name="paper_orders")
    order_number = models.CharField(max_length=64, unique=True, db_index=True)
    delivery_campus = models.CharField(max_length=255, verbose_name="Campus & Bâtiment de Faculté pour la Livraison")
    contact_person = models.CharField(max_length=128, default="", verbose_name="Réceptionnaire sur le Campus")
    contact_phone = models.CharField(max_length=32, default="", verbose_name="Téléphone Réceptionnaire")
    items = models.JSONField(default=list, verbose_name="Lignes de commande [{book_id, title, quantity, unit_price}]")
    total_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    currency = models.CharField(max_length=10, default="XOF")
    status = models.CharField(max_length=32, choices=[("pending", "En attente"), ("processing", "En préparation"), ("in_transit", "En cours de livraison"), ("delivered", "Livré"), ("cancelled", "Annulé")], default="pending")
    tracking_number = models.CharField(max_length=64, blank=True, default="")
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "university_paper_order"
        ordering = ["-created_at"]


class UniversityStudentAffiliation(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    university = models.ForeignKey(UniversityProfile, on_delete=models.CASCADE, related_name="student_affiliations")
    student_name = models.CharField(max_length=128, verbose_name="Nom & Prénom de l'Étudiant")
    student_email = models.EmailField(verbose_name="E-mail de l'étudiant (Gmail/Yahoo/etc.)")
    student_phone = models.CharField(max_length=32, default="", blank=True, verbose_name="Téléphone de l'étudiant")
    matricule = models.CharField(max_length=64, db_index=True, verbose_name="Numéro de Matricule Académique")
    faculty_code = models.CharField(max_length=32, verbose_name="Code de la Faculté (FADESP, FSS, etc.)")
    level = models.CharField(max_length=32, default="Licence 1", verbose_name="Niveau d'Étude")
    student_card_url = models.CharField(max_length=500, blank=True, default="", verbose_name="Justificatif / Carte d'Étudiant")
    status = models.CharField(max_length=20, choices=[("active", "Affilié & Actif"), ("pending", "En attente de validation"), ("suspended", "Suspendu"), ("graduated", "Diplômé")], default="pending")
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "university_student_affiliation"
        ordering = ["-created_at"]


class UniversityRoyaltyStatement(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    university = models.ForeignKey(UniversityProfile, on_delete=models.CASCADE, related_name="royalty_statements")
    reference = models.CharField(max_length=64, unique=True, db_index=True)
    period = models.CharField(max_length=64, verbose_name="Période (ex: 3e Trimestre 2025)")
    total_sales_catalog = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    royalty_rate = models.DecimalField(max_digits=5, decimal_places=2, default=15.00)
    net_royalty_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0.00)
    currency = models.CharField(max_length=10, default="XOF")
    status = models.CharField(max_length=20, choices=[("paid", "Réglé / Transféré"), ("pending", "En traitement"), ("available", "Disponible pour virement")], default="available")
    pdf_statement_url = models.CharField(max_length=500, blank=True, default="")
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "university_royalty_statement"
        ordering = ["-created_at"]
```

---

## 2. Interfaces TypeScript Frontend (`lib/types/university.ts`)

```typescript
export interface UniversityKpis {
  affiliated_students_count: number;
  active_bouquets_count: number;
  monthly_consultations_count: number;
  total_royalties_available: number;
  total_royalties_paid: number;
  currency: string;
  top_disciplines: { discipline: string; consultations: number; percent: number }[];
  consultations_trend_percent: number;
}

export interface UniversityFacultyData {
  id: string;
  name: string;
  code: string;
  disciplines: string[];
  student_count: number;
  dean_name: string;
}

export interface UniversityBouquet {
  id: string;
  title: string;
  bouquet_type: "discipline" | "faculty" | "university" | "custom";
  faculty_code?: string;
  discipline?: string;
  books_count: number;
  annual_price: number;
  currency: string;
  status: "active" | "pending" | "expired" | "available";
  start_date?: string;
  end_date?: string;
  description: string;
  sample_books: { id: string; title: string; author: string; cover_url?: string }[];
}

export interface UniversityBookCatalogItem {
  id: string;
  title: string;
  isbn_digital: string;
  isbn_print: string;
  authors: string[];
  faculty_code: string;
  discipline: string;
  price_digital: number;
  price_paper: number;
  currency: string;
  cover_url?: string;
  consultations_count: number;
  stock_paper_available: number;
}

export interface UniversityPaperOrderItem {
  book_id: string;
  title: string;
  quantity: number;
  unit_price: number;
}

export interface UniversityPaperOrder {
  id: string;
  order_number: string;
  delivery_campus: string;
  contact_person: string;
  contact_phone: string;
  items: UniversityPaperOrderItem[];
  total_amount: number;
  currency: string;
  status: "pending" | "processing" | "in_transit" | "delivered" | "cancelled";
  tracking_number?: string;
  pdf_order_url?: string;
  created_at: string;
}

export interface UniversityStudentAffiliationData {
  id: string;
  student_name: string;
  student_email: string;
  student_phone?: string;
  matricule: string;
  faculty_code: string;
  faculty_name: string;
  level: string;
  student_card_url?: string;
  status: "active" | "pending" | "suspended" | "graduated";
  verified_at?: string;
  created_at: string;
}

export interface UniversityRoyaltyStatementData {
  id: string;
  reference: string;
  period: string;
  total_sales_catalog: number;
  royalty_rate: number;
  net_royalty_amount: number;
  currency: string;
  status: "paid" | "pending" | "available";
  pdf_statement_url?: string;
  created_at: string;
}

export interface UniversityProfileData {
  id: string;
  name: string;
  short_name: string;
  country: string;
  city: string;
  address: string;
  rector_name: string;
  academic_director_name: string;
  contact_email: string;
  contact_phone: string;
  bank_name: string;
  bank_iban: string;
  bank_swift: string;
  momo_number: string;
  contract_reference: string;
  royalty_rate: number;
  is_active: boolean;
  faculties: UniversityFacultyData[];
}
```
