# Plan Technique: Module 8 - Espace Administration Globale, Tarification, Supervision & Relances

**Feature Branch**: `008-administration-supervision-globale`
**Architecture**: Django 5.2 / DRF + Celery 5.4 / Redis 7 + Next.js 16 App Router + TailwindCSS
**Source Métier**: Cahier des charges LAHAThèque v3.2 (Sections 1, 4.1.1, 7, 10, 11, 12, 15, 19, 20)

---

## 1. Architecture Globale & Flux de Synchronisation Bidirectionnelle

```mermaid
graph TD
    subgraph ActeursMetier["Portails Acteurs Métiers"]
        Maquettiste["Chef Maquettiste (/chief-layout)"]
        Juriste["Juriste (/legal-reviewer)"]
        Gestionnaire["Gestionnaire Stock (/manager)"]
    end

    subgraph BackendDjango["Backend Django 5.2 / DRF"]
        ValidationEngine["BAT & Maquette Engine (apps.catalog)"]
        ContractEngine["Contracts & Rights Engine (apps.rights)"]
        StockEngine["Stock & Warehouses Engine (apps.commerce)"]
        AuditEngine["Audit & Logging (apps.reporting)"]
    end

    subgraph AdminDedicated["Pages Dédiées Admin (/admin/*)"]
        AdminBAT["/admin/validation - Super-BAT & Audit (qui/quand)"]
        AdminLegal["/admin/contracts - Approbation Contrats & Litiges"]
        AdminStock["/admin/stock - Multi-Entrepôts & Pertes/Ajustements"]
        AdminCatalog["/admin/catalog - Catalogue Global & Lecteur Souverain"]
    end

    Maquettiste -->|Dépôt / Validation BAT initial (pending_admin)| ValidationEngine
    Juriste -->|Instruction contrat / Dérogation (pending_admin)| ContractEngine
    Gestionnaire -->|Déclaration perte / Inventaire (pending_admin)| StockEngine

    ValidationEngine --> AdminBAT
    ContractEngine --> AdminLegal
    StockEngine --> AdminStock

    AdminBAT -->|Validation ou Rejet avec Motif| ValidationEngine
    AdminLegal -->|Approbation ou Rejet avec Motif| ContractEngine
    AdminStock -->|Validation passation en perte ou Rejet| StockEngine

    ValidationEngine -->|Synchronisation statut + motif| Maquettiste
    ContractEngine -->|Synchronisation statut + motif| Juriste
    StockEngine -->|Synchronisation statut + motif| Gestionnaire
  
    AdminBAT -.->|Tracé automatique| AuditEngine
    AdminLegal -.->|Tracé automatique| AuditEngine
    AdminStock -.->|Tracé automatique| AuditEngine
```

---

## 2. Endpoints Django REST Framework (`apps/reporting/admin_views.py` & `admin_urls.py`)


| Méthode    | URL                                                 | Rôle Requis           | Description                                                 |
| ------------- | ----------------------------------------------------- | ------------------------ | ------------------------------------------------------------- |
| `GET`       | `/api/v1/admin/stats/panoramic/`                    | `admin`, `super_admin` | KPI consolidés 360° (CA, consultations, ventilations)     |
| `GET/PATCH` | `/api/v1/admin/settings/global/`                    | `super_admin`          | Lecture et mise à jour de la configuration globale         |
| `GET/POST`  | `/api/v1/admin/users/`                              | `admin`, `super_admin` | Liste paginée et création manuelle d'un utilisateur       |
| `PATCH`     | `/api/v1/admin/users/{id}/toggle-status/`           | `admin`, `super_admin` | Activation, désactivation, suspension                      |
| `DELETE`    | `/api/v1/admin/users/{id}/`                         | `super_admin`          | Suppression définitive avec confirmation                   |
| `POST`      | `/api/v1/admin/users/{id}/send-email/`              | `admin`, `super_admin` | Envoi d'e-mail administratif personnalisé                  |
| `GET/PATCH` | `/api/v1/admin/catalog/pricing/`                    | `admin`, `super_admin` | Cascade tarifaire & prix spécifiques                       |
| `POST`      | `/api/v1/admin/catalog/pricing/{id}/reset-pricing/` | `admin`, `super_admin` | Réalignement en 1 clic sur le tarif par défaut            |
| `GET`       | `/api/v1/admin/validation/`                         | `admin`, `super_admin` | File des épreuves de maquette avec traçabilité qui/quand |
| `POST`      | `/api/v1/admin/validation/{id}/process/`            | `admin`, `super_admin` | Validation BAT finale ou rejet avec motif obligatoire       |
| `GET`       | `/api/v1/admin/contracts/`                          | `admin`, `super_admin` | File des contrats d'édition & accords dérogatoires        |
| `POST`      | `/api/v1/admin/contracts/{id}/process/`             | `admin`, `super_admin` | Approbation finale ou rejet motivé d'un contrat            |
| `GET`       | `/api/v1/admin/stock/`                              | `admin`, `super_admin` | Supervision globale des stocks et entrepôts multi-pays     |
| `GET`       | `/api/v1/admin/stock/movements/`                    | `admin`, `super_admin` | Flux de stock & demandes de régularisations en attente     |
| `POST`      | `/api/v1/admin/stock/movements/{id}/process/`       | `admin`, `super_admin` | Validation de perte/mise au rebut ou rejet comptable        |
| `GET/POST`  | `/api/v1/admin/stock/warehouses/`                   | `admin`, `super_admin` | Création et gestion des entrepôts régionaux              |
| `GET`       | `/api/v1/admin/royalties/payouts/`                  | `admin`, `super_admin` | File des demandes de versement de redevances                |
| `POST`      | `/api/v1/admin/royalties/payouts/{id}/process/`     | `admin`, `super_admin` | Validation (ref virement/Mobile Money) ou rejet             |
| `GET`       | `/api/v1/admin/reminders/`                          | `admin`, `super_admin` | Journal des relances automatiques                           |
| `POST`      | `/api/v1/admin/reminders/trigger-now/`              | `admin`, `super_admin` | Déclenchement forcé immédiat Celery                      |
| `GET`       | `/api/v1/admin/logs/`                               | `admin`, `super_admin` | Journaux d'audit immuables                                  |

---

## 3. Arborescence Frontend Dédiée Next.js 16 (`app/(dashboard)/admin/*`)

```
app/(dashboard)/admin/
├── page.tsx                           # Vue Panoramique 360° & KPIs
├── catalog/
│   ├── page.tsx                       # Catalogue global avec bouton "Lire l'ouvrage" (lecteur officiel)
│   ├── [id]/page.tsx                  # Fiche ouvrage détaillée & historique
│   ├── pricing/page.tsx               # Cascade tarifaire & réalignement en 1 clic
│   └── protection/page.tsx            # Paramétrage global DRM & filigrane dynamique
├── validation/
│   ├── page.tsx                       # Supervision de la chaîne de maquettisme (BAT)
│   └── [id]/page.tsx                  # Examen d'épreuve, traçabilité (qui/quand) & validation Admin
├── contracts/
│   ├── page.tsx                       # Supervision des contrats d'édition & accords dérogatoires
│   └── [id]/page.tsx                  # Fiche contrat, barèmes dérogatoires & approbation finale
├── stock/
│   ├── page.tsx                       # Supervision des entrepôts multi-pays & alertes seuils
│   ├── movements/page.tsx             # Journal des flux & validation des régularisations d'inventaire
│   └── warehouses/page.tsx            # Gestion des entrepôts régionaux (Cotonou, Dakar, Abidjan)
├── royalties/                         # Pilotage et validation des versements de redevances
├── users/                             # Annuaire multi-rôles & pages dédiées par rôle
├── reminders/                         # Moteur de relances automatiques
├── logs/                              # Journal d'audit et télémétrie de sécurité
└── settings/                          # Paramètres plateforme & passerelles
```

---

## 4. Composants UI 21st.dev & Directives UX

- **Modales d'approbation et de rejet** : Saisie obligatoire du motif de rejet en cas de refus pour information des acteurs.
- **États de chargement** : Boutons interactifs avec spinners vectoriels Lucide React et désactivation préventive.
- **Feedback visuel** : Toasts Sonner explicites avec distinction succès/erreur.
- **Zéro émoji & Zéro hexadécimal en dur** : Respect absolu de la charte Navy & Or via variables sémantiques.
- **Mobile-First** : Expérience fluide adaptée sur tablettes et smartphones.

```text
app/(dashboard)/admin/
├── layout.tsx                               # Shell Admin partagé avec Sidebar et Topbar
├── page.tsx                                 # Tableau de bord panoramique 360°
├── users/
│   └── page.tsx                             # Annuaire des utilisateurs, création & statuts
├── catalog/
│   ├── page.tsx                             # Supervision & modération du catalogue
│   ├── pricing/
│   │   └── page.tsx                         # Cascade tarifaire, prix global & prix spécifiques
│   └── protection/
│       └── page.tsx                         # Paramétrage DRM global & filigranes
├── royalties/
│   ├── page.tsx                             # Synthèse globale des redevances
│   ├── authors/
│   │   └── page.tsx                         # Demandes de versement des Auteurs & validation
│   ├── publishers/
│   │   └── page.tsx                         # Versements aux Éditeurs Tiers
│   └── universities/
│       └── page.tsx                         # Versements de la part 15% aux Universités
├── reminders/
│   └── page.tsx                             # Supervision des relances & déclenchement manuel
├── sales/
│   └── page.tsx                             # Journal consolidé des commandes et ventes
├── api/
│   └── page.tsx                             # Clés d'API partenaires & rate-limiting
├── logs/
│   └── page.tsx                             # Journaux d'audit et traçabilité immuable
├── security/
│   └── page.tsx                             # Supervision de la sécurité & alertes DRM
└── settings/
    └── page.tsx                             # Configuration globale des passerelles & services
```

---

## 5. Stratégie de Composants 21st.dev

Conformément à la règle obligatoire du workflow `/build-lahatheque-screen` :

1. **Cartes Métriques Panoramiques** : `ProgressMetricCard` et `StatCard` avec tendances colorées adaptées aux tokens `globals.css`.
2. **Graphiques & Donut Charts** : `DonutChart` pour la répartition par rôle/format et `TotalSalesChart` pour la courbe de ventes multi-pays.
3. **Tableaux avec Filtres & Pagination** : `DataTable` avec recherche instantanée, filtres déroulants et badge de statut sémantique `StatusBadge`.
4. **Modales de Validation & Confirmation** : `Dialog` et `Modal` avec focus trap, formulaires typés et états de chargement vectoriels.
5. **Timeline de Relance** : Composant de suivi visuel des étapes de relance (J+7, J+15, J+30).
