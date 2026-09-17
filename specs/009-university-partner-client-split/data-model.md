# Phase 1 : Modèle de Données et Schémas

**Feature** : `009-university-partner-client-split`  
**Date** : 2026-09-17  
**Statut** : Validé

---

## 1. Entités et Schéma de Base de Données

### 1.1 Modèle `Institution` (`apps.partners.models.Institution`)

```python
class Institution(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='university_profile',
        null=True,
        blank=True,
        verbose_name="Compte Modérateur Officiel"
    )
    name = models.CharField(max_length=255, verbose_name="Nom complet de l'établissement")
    code = models.CharField(max_length=50, unique=True, verbose_name="Code / Sigle (ex: UAC, UP, UNSTIM, UNA)")
    short_name = models.CharField(max_length=50, blank=True, default="", verbose_name="Sigle court")
    country = models.CharField(max_length=10, default="BJ", verbose_name="Code Pays (BJ, SN, CI, NE, TG, GA, CD)")
    city = models.CharField(max_length=128, default="Cotonou", blank=True, verbose_name="Ville du campus")
    address = models.TextField(default="Campus d'Abomey-Calavi, Bénin", blank=True, verbose_name="Adresse géographique")
    domain_name = models.CharField(max_length=255, blank=True, default="", verbose_name="Nom de domaine web")

    # Nouveau Champ Catégoriel (FR-001, FR-002, FR-003)
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

    # Responsables & Contact
    rector_name = models.CharField(max_length=128, default="", blank=True, verbose_name="Nom du Recteur / Président")
    academic_director_name = models.CharField(max_length=128, default="", blank=True, verbose_name="Directeur des Affaires Académiques / Scolarité")
    contact_email = models.EmailField(default="", blank=True, verbose_name="E-mail Officiel de Contact")
    contact_phone = models.CharField(max_length=32, default="", blank=True, verbose_name="Téléphone Officiel")

    # Coordonnées Financières pour Reversement des Redevances (Uniquement pour 'partner')
    bank_name = models.CharField(max_length=128, blank=True, default="", verbose_name="Banque / Trésor Public")
    bank_iban = models.CharField(max_length=128, blank=True, default="", verbose_name="RIB / IBAN / Compte Trésorerie")
    bank_swift = models.CharField(max_length=32, blank=True, default="", verbose_name="Code BIC / SWIFT")
    momo_number = models.CharField(max_length=32, blank=True, default="", verbose_name="Compte Mobile Money Institutionnel")

    # Contrat & Mandat
    contract_reference = models.CharField(max_length=64, default="CTR-UNIV-2026-01", verbose_name="Réf. Convention Cadre")
    royalty_rate = models.DecimalField(max_digits=5, decimal_places=2, default=15.00, null=True, blank=True, verbose_name="Taux de Redevance (%)")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["institution_type", "is_active"]),
        ]
```

### 1.2 Modèle `User` (`apps.accounts.models.User`)

```python
class User(AbstractUser):
    # Clé étrangère inverse ou accès via related_name='university_profile'
    institution = models.ForeignKey(
        'partners.Institution',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='staff_members'
    )
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='student')
    # ... autres champs d'identité
```

---

## 2. Règles de Validation et Contraintes d'Intégrité

1. **Unicité du Compte Modérateur** :
   - `Institution.user` est un `OneToOneField`. Une institution ne peut posséder qu'un seul compte modérateur officiel.
   - Si un administrateur tente de créer un utilisateur au rôle `university` en le rattachant à une institution qui a déjà un modérateur actif, la requête est rejetée avec un message explicatif : « Cette institution possède déjà un compte modérateur officiel. »
2. **Protection des 4 Universités Historiques** :
   - Les institutions possédant les codes `['UAC', 'UP', 'UNSTIM', 'UNA']` sont initialisées avec `institution_type='partner'`.
   - Dans le validateur `clean()` du modèle `Institution` et dans la vue d'administration, toute tentative de passer `institution_type` à `'client'` pour ces 4 codes lève une `ValidationError` : « Impossible de rétrograder une université partenaire historique en compte client. »
3. **Taux de Redevance** :
   - Si `institution_type == 'client'`, `royalty_rate` est forcé à `0.00` ou `null`.
   - Si `institution_type == 'partner'`, `royalty_rate` est par défaut à `15.00` (modifiable par convention).

---

## 3. Interfaces et Schémas de Réponses API

### 3.1 Endpoint `/api/v1/partners/university/kpis/`

#### Réponse pour Université Partenaire (`partner`) :
```json
{
  "success": true,
  "data": {
    "institution_name": "Université d'Abomey-Calavi",
    "institution_code": "UAC",
    "institution_type": "partner",
    "catalog_books_count": 30,
    "active_bouquets_count": 0,
    "monthly_consultations_count": 142,
    "total_royalties_available": 2550.00,
    "total_royalties_paid": 0.00,
    "audience_share_percent": 100.0,
    "currency": "XOF",
    "consultations_trend_percent": 12.5,
    "revenue_split": {
      "total_ca": 17000.00,
      "university_amount": 2550.00,
      "university_percent": 15.0,
      "laha_amount": 14450.00,
      "laha_percent": 85.0,
      "currency": "XOF"
    }
  },
  "error": null
}
```

#### Réponse pour Université Cliente (`client`) :
```json
{
  "success": true,
  "data": {
    "institution_name": "Institut Supérieur Privé Polytech",
    "institution_code": "ISPP",
    "institution_type": "client",
    "catalog_books_count": 0,
    "accessible_books_count": 85,
    "active_bouquets_count": 3,
    "monthly_consultations_count": 210,
    "total_royalties_available": 0.0,
    "total_royalties_paid": 0.0,
    "audience_share_percent": 0.0,
    "currency": "XOF",
    "consultations_trend_percent": 5.0,
    "revenue_split": null
  },
  "error": null
}
```

---

## 4. Types TypeScript Frontend (`lib/types/university.ts`)

```typescript
export type InstitutionType = "partner" | "client";

export interface UniversityKpis {
  institution_name: string;
  institution_code: string;
  institution_type: InstitutionType;
  affiliated_students_count?: number;
  active_bouquets_count: number;
  catalog_books_count?: number;
  accessible_books_count?: number;
  monthly_consultations_count: number;
  total_royalties_available: number;
  total_royalties_paid: number;
  audience_share_percent: number;
  currency: string;
  consultations_trend_percent: number;
  top_disciplines: Array<{
    name: string;
    books_count: number;
    consultations: number;
    color: string;
  }>;
  faculty_distribution: Array<{
    faculty_code: string;
    faculty_name: string;
    consultations: number;
    percent: number;
    color: string;
  }>;
  revenue_split: {
    total_ca: number;
    university_amount: number;
    university_percent: number;
    laha_amount: number;
    laha_percent: number;
    currency: string;
  } | null;
}
```
