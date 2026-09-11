# Data Model & State Transitions: Feature 006

**Feature**: Formulaire Contact B2B & Tunnel d'Achat E-commerce  
**Directory**: `specs/006-contact-b2b-checkout-flow`  
**Date**: 2026-09-10

---

## 1. Entités Données & Modèles Django

### 1.1 ContactMessage (`apps/communications/models.py`)

Représente une demande soumise depuis le formulaire public `/contact`.

| Champ | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUIDv4 | Primary Key | Identifiant unique du ticket |
| `name` | CharField(255) | Required | Nom et prénom du demandeur |
| `email` | EmailField | Required | Adresse e-mail du demandeur |
| `role` | CharField(50) | Choices: `university`, `publisher`, `wholesaler`, `author`, `other` | Profil officiel aligné sur `ROLE_CHOICES` |
| `subject` | CharField(255) | Required | Sujet généré incluant le profil et les besoins |
| `message` | TextField | Required | Contenu complet (téléphone, besoins cochés, message additionnel) |
| `is_processed` | BooleanField | Default=False | Statut de traitement par l'équipe administrative |
| `created_at` | DateTimeField | Auto_now_add | Horodatage de réception |

---

### 1.2 Order & LigneCommande (`apps/commerce/models.py`)

Représente la commande validée par un client authentifié (rôle `student`).

#### Order
| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | UUIDv4 | Identifiant unique de la commande |
| `user` | ForeignKey(User, null=True, blank=True) | Acheteur authentifié (ou null si vente comptoir externe) |
| `is_pos_order` | BooleanField(default=False) | Vente physique au comptoir / boutique |
| `guest_name` | CharField(255, blank=True) | Nom complet du client externe boutique |
| `guest_phone` | CharField(50, blank=True) | Numéro de téléphone du client externe (obligatoire) |
| `guest_email` | EmailField(blank=True) | E-mail du client externe (optionnel, requis si numérique) |
| `total_amount` | DecimalField | Montant total en FCFA |
| `statut_paiement` | CharField | `pending` → `paid` / `failed` / `refunded` |
| `statut_commande` | CharField | `pending` → `processing` → `completed` |
| `created_at` | DateTimeField | Horodatage de passation |

#### LigneCommande
| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | UUIDv4 | Identifiant unique de ligne |
| `commande` | ForeignKey(Order) | Commande parente |
| `ouvrage` | ForeignKey(Ouvrage) | Ouvrage commandé |
| `format_type` | CharField | Format (`paper`, `digital`, `audio`) |
| `selected_language` | CharField | Langue sélectionnée (défaut `fr`) |
| `quantity` | IntegerField | Nombre d'exemplaires |
| `unit_price` | DecimalField | Prix unitaire facturé |

---

### 1.3 PhysicalDelivery (`apps/commerce/models.py`)

Créé obligatoirement lorsqu'au moins une ligne de commande a `format_type == 'paper'`.

| Champ | Type | Contraintes | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUIDv4 | Primary Key | Identifiant unique de livraison |
| `commande` | OneToOneField(Order) | Unique | Commande associée |
| `shipping_address` | TextField | Required | Adresse physique exacte de livraison |
| `city` | CharField(100) | Required | Ville de livraison (ex: Cotonou, Porto-Novo, Parakou...) |
| `country` | CharField(2) | Default='BJ' | Code ISO pays de livraison |
| `date_livraison_souhaitee` | DateField | Nullable | Date souhaitée par le client |
| `plage_horaire_debut` | TimeField | Nullable | Début de la plage de réception souhaitée |
| `plage_horaire_fin` | TimeField | Nullable | Fin de la plage de réception souhaitée |
| `tracking_number` | CharField(100) | Blank | Numéro de suivi attribué par le gestionnaire logistique |
| `carrier_name` | CharField(100) | Blank | Nom du transporteur (coursier, agence, etc.) |
| `statut` | CharField | Choices: `en_preparation`, `expedie`, `livre` | Statut du colis |

---

### 1.4 ReadingProgress & Accès Numérique (`apps/student/models.py`)

Créé ou mis à jour pour chaque ligne avec `format_type in ('digital', 'audio')` dès que `statut_paiement == 'paid'`.

| Champ | Type | Description |
| :--- | :--- | :--- |
| `id` | UUIDv4 | Identifiant de progression |
| `user` | ForeignKey(User) | Client lecteur |
| `ouvrage` | ForeignKey(Ouvrage) | Ouvrage déverrouillé |
| `progress_percent` | IntegerField | Progression de lecture (initialisé à 0%) |
| `current_page` | IntegerField | Page courante (initialisé à 1) |
| `total_pages` | IntegerField | Nombre total de pages de l'ouvrage |
| `last_read_at` | DateTimeField | Date et heure de dernière consultation |

---

## 2. Diagramme de Transitions d'États

```
[Visiteur Catalogue / Panier]
        │
        ▼ (Arrivée sur /checkout)
  Session Authentifiée ?
        ├─ NON ──► [Panneau Option A sur /checkout]
        │                ├─ Déjà Client ? ──► Login (Saisie Identifiants) ────┐
        │                └─ Nouveau ? ──────► Register + OTP (Rôle student) ──┤
        │                                                                     │
        └─ OUI ◄──────────────────────────────────────────────────────────────┘
        │ (Panier Local Perservé à 100%)
        ▼
[Choix Paiement & Coordonnées de Livraison]
        │
        ├─ Contient du Papier ? ──► Saisie obligatoire PhysicalDelivery (Adresse, Ville, Créneau)
        └─ Numérique / Audio ? ──► Coordonnées de facturation
        │
        ▼
[Validation du Paiement (Moneroo / Mobile Money / Carte)]
        │
        ├─ Enregistrement Order + LigneCommande
        ├─ Création PhysicalDelivery (si papier) ──► Notification Gestionnaires (/manager)
        ├─ Activation ReadingProgress (si numérique/audio) ──► Disponible dans /student/books
        └─ Envoi E-mail avec Facture PDF Acquittée
```
