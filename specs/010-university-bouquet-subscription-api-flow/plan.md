# Implementation Plan: Flux de Souscription Bouquet (Universités & Clients), Tarification Bipériodique et Délivrance de Clés API

**Branch**: `010-university-bouquet-subscription-api-flow` | **Date**: 2026-09-17 | **Spec**: [spec.md](./spec.md)

**Input**: Spécification validée de la fonctionnalité 010 intégrant l'administration des bouquets (suppression de faculty, modal preview livres, double tarif mensuel/annuel), le parcours souscription université avec paiement Moneroo, l'écran de délivrance des clés API avec guide PDF, la facturation et notifications, et l'espace client lecteur B2C avec onglet bibliothèque.

---

## Summary

Cette fonctionnalité met en place le cycle complet de commercialisation et de distribution des bouquets documentaires académiques :
1. **Administration des bouquets** : Nettoyage du type obsolète « Par Faculté », obligation de sélection d'université pour « Intégral Université » avec décompte temps réel et modale scrollable détaillée des livres, et intégration du double tarif (mensuel et annuel) en Francs CFA (XOF) dans la base et sur `/admin/catalog/bouquets`.
2. **Souscription B2B (Universités Clientes)** : Choix de la formule (mensuelle 30j ou annuelle 365j), paiement en ligne sécurisé via la passerelle Moneroo, activation de la souscription et attribution/mise à jour d'une clé API unique cumulée (`PartnerApp`) en mode Catalogue Seul avec palier VIP Illimité.
3. **Écran de succès post-paiement B2B** : Affichage unique du secret client en clair avec bouton de copie, téléchargement d'un fichier `.txt` avec variables `.env`, et téléchargement du Guide d'Implémentation officiel au format PDF généré selon la charte LAHAThèque (logo vectoriel, Navy/Or, Playfair Display/Poppins).
4. **Facturation & Notifications** : Génération d'une facture PDF acquittée horodatée, envoi d'emails transactionnels avec la facture en pièce jointe mentionnant la date d'échéance, et programmation de relances préventives (J-7 annuel, J-3 mensuel).
5. **Souscription B2C (Clients Particuliers)** : Souscription mensuelle ou annuelle sans clé API, injection automatique des ouvrages dans la bibliothèque `/student/books` au sein d'un onglet dédié « Bouquets en cours », tout en garantissant la souveraineté des 12 mois de licence pour tout livre acheté individuellement.

---

## Technical Context

- **Langage / Backend** : Python 3.10+, Django 5.x, Django REST Framework.
- **Frontend** : Next.js 14 (App Router), React 18, TypeScript strict, TailwindCSS.
- **Base de données & ORM** : PostgreSQL, indexation B-Tree sur les statuts et dates d'expiration, `select_related()` / `prefetch_related()` obligatoires contre requêtes N+1.
- **Passerelle de Paiement** : Moneroo API v1 (`apps/commerce/moneroo_client.py`), webhooks HMAC-SHA256 idempotents (`WebhookEvent`).
- **Moteur PDF** : WeasyPrint / ReportLab backend avec templates HTML/CSS personnalisés, polices Google Fonts et assets vectoriels.
- **Authentification & Permissions** : Cookies de session `HttpOnly`, authentification machine-to-machine OAuth2 Client Credentials (`django-oauth-toolkit`).
- **Design & Charte Graphique** : Tokens sémantiques CSS (`bg-navy`, `bg-gold`, `text-navy`, `border-border`), zéro code hexadécimal en dur, typographie Playfair Display & Poppins, zéro émoji, mobile-first dès 375px.

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe Fondamental | Évaluation & Mesure Prise | Statut |
|---|---|---|
| **I. Cadrage Métier & Lecture Intégrale** | Lecture exhaustive de 100% des fichiers concernés (`models.py`, `webhooks.py`, `bouquets/page.tsx`, `books/page.tsx`, etc.). Aucune supposition. | **CONFORME** |
| **II. Traque des Non-Dits & Scalabilité** | Clarifications validées : clé unique cumulée, prolongation cumulative, filtrage granulaire par bouquet, préavis automatiques, et règle des 12 mois. | **CONFORME** |
| **III. Rigueur Backend & Typage Statique** | Respect absolu de PEP 8 et Type Hints obligatoires sur toutes les signatures de fonctions, méthodes et serializers. | **CONFORME** |
| **IV. Format de Réponse API Unifié** | Toutes les routes renvoient strictement `{ "success": true, "data": ..., "error": null }`. | **CONFORME** |
| **V. Performance ORM & Anti-N+1** | Utilisation systématique de `select_related()` et `prefetch_related()` sur l'aperçu des livres et les requêtes catalogue. | **CONFORME** |
| **VI. Sécurité Réseau & HttpOnly** | Tokens de session web en cookies `HttpOnly`, machine-to-machine via OAuth2 Client Credentials, secrets clients hachés en SHA-256. | **CONFORME** |
| **VII. Protection DRM** | Les livres accessibles via bouquets respectent la protection anti-téléchargement et le filigrane nominatif de la liseuse. | **CONFORME** |
| **VIII. Tokens Sémantiques & Typographie** | Interdiction formelle des hexadécimaux en dur. Polices Playfair Display et Poppins. Zéro bordure blanche artificielle. | **CONFORME** |
| **X. Interdiction Absolue des Émojis** | Zéro émoji dans le code, la console, les modales et les templates de factures/guides PDF. Uniquement des icônes vectorielles Lucide React. | **CONFORME** |
| **XI. Traçabilité & Console Logs Granulaires** | Logs structurés balisés avec horodatage ISO (`[BOUQUET ADMIN]`, `[MONEROO CHECKOUT]`, `[API CREDENTIALS]`, `[STUDENT LIBRARY]`). | **CONFORME** |
| **XII. Workflow /build-lahatheque-screen & 21st.dev** | Conception des composants d'écrans selon le protocole mobile-first et recherche sur 21st.dev. | **CONFORME** |
| **XIII. Persistance Mémoire Obligatoire** | Synchronisation exhaustive de chaque avancée dans `.specify/memory/project_memory.md`. | **CONFORME** |

---

## Project Structure

### Documentation (cette fonctionnalité)

```text
specs/010-university-bouquet-subscription-api-flow/
├── spec.md              # Spécification fonctionnelle validée avec 6 clarifications
├── checklists/
│   └── requirements.md  # Checklist qualité des exigences (100% validée)
├── research.md          # Recherche technique & décisions d'architecture (Phase 0)
├── data-model.md        # Modélisation des données & transitions d'états (Phase 1)
├── quickstart.md        # Guide de validation et scénarios pas-à-pas (Phase 1)
├── contracts/           # Schémas de contrats d'API (JSON Schema)
│   ├── bouquet-admin.contract.json
│   ├── university-subscription.contract.json
│   └── client-subscription.contract.json
└── plan.md              # Ce plan d'implémentation
```

### Source Code (Emplacement réel dans le dépôt)

```text
lahatheque-backend/
├── apps/partners/
│   ├── models.py                   # BouquetOffering (monthly_price, remove faculty, target_institution), UniversityBouquetSubscription (period)
│   ├── views.py                    # InstitutionBooksPreviewView
│   ├── university_views.py         # UniversityBouquetSubscribeView (support monthly/annual, Moneroo checkout)
│   ├── serializers.py              # BouquetOfferingSerializer, SubscriptionSerializer
│   └── migrations/                 # Migration Django pour monthly_price et suppression faculty
├── apps/commerce/
│   ├── models.py                   # ClientBouquetSubscription (period, end_date)
│   ├── views.py                    # ClientBouquetSubscribeView (support monthly/annual)
│   ├── webhooks.py                 # handle_bouquet_payment_success (création/update PartnerApp, activation)
│   └── services.py                 # Calcul d'échéances et réconciliation
├── apps/reader/
│   ├── models.py                   # PartnerApp (relation restricted_bouquets M2M)
│   └── views.py                    # PartnerCatalogView (filtrage granulaire sur bouquets actifs)
├── apps/reporting/
│   ├── pdf_service.py              # Générateur PDF du Guide d'Implémentation et factures acquittées
│   ├── tasks.py                    # Tâche Celery quotidienne d'expiration et alertes J-7 / J-3
│   └── templates/reports/          # Templates HTML/CSS pour guide PDF et factures
└── apps/protection/
    └── access_service.py           # Moteur souverain d'accès liseuse (12 mois achat vs bouquet temporaire)

lahatheque-frontend/
├── app/(dashboard)/admin/catalog/bouquets/
│   └── page.tsx                    # Suppression faculty, sélection obligatoire univ, preview modal, double tarif, colonne Tarif Mensuel
├── app/(dashboard)/admin/api/
│   └── page.tsx                    # Affichage des applications créées avec bouquets associés et statut VIP
├── app/(dashboard)/university/bouquets/
│   ├── page.tsx                    # Sélecteur Mensuel/Annuel et déclenchement Moneroo
│   └── success/page.tsx            # Écran de succès post-paiement, affichage clés, download txt/env, download guide PDF
├── app/(dashboard)/student/bouquets/
│   └── page.tsx                    # Réactivation page souscription client B2C (mensuel/annuel)
├── app/(dashboard)/student/books/
│   └── page.tsx                    # Onglet « Bouquets en cours » avec badge expiration et cohabitation avec livres achetés
├── components/features/bouquets/
│   ├── bouquet-books-preview-modal.tsx  # Modale scrollable avec cartes de livres et couvertures
│   └── bouquet-subscriptions-drawer.tsx # Volet de suivi des abonnements par bouquet pour l'admin
├── lib/services/
│   ├── admin.ts                    # Services API d'administration des bouquets
│   ├── university.ts               # Services souscription bouquet université
│   ├── bouquets.ts                 # Services souscription client B2C
│   └── student.ts                  # Services bibliothèque avec livres de bouquets
└── lib/types/
    ├── admin.ts                    # Types TypeScript alignés sur les modèles Django
    └── catalog.ts                  # Types pour aperçu des livres
```

---

## Complexity Tracking

Aucune dérogation constitutionnelle requise. L'ensemble des développements s'intègre harmonieusement dans l'architecture existante Django / Next.js.
