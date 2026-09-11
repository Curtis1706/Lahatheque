# Implementation Plan: Formulaire Contact B2B & Tunnel d'Achat E-commerce

**Branch**: `006-contact-b2b-checkout-flow` | **Date**: 2026-09-10 | **Spec**: [spec.md](file:///e:/Lahatheque/specs/006-contact-b2b-checkout-flow/spec.md)

**Input**: Feature specification from `specs/006-contact-b2b-checkout-flow/spec.md`

---

## Summary

Cette fonctionnalité harmonise l'acquisition B2B et la conversion e-commerce de LAHAThèque en réalisant :
1. **Un formulaire de contact B2B rénové (`/contact`)** aligné sur les rôles réels de la base de données (`university`, `publisher`, `wholesaler`, `author`, `other`), avec une grille/combobox de besoins enrichie des options institutionnelles ("Demande de partenariat", "Commande en gros", "Intégration API"), un guidage épuré pour l'option "Autre", et un routage e-mail fiable notifiant simultanément `lahaeditions1@gmail.com`, `firinzegbenitodossou@gmail.com` et `alhtdharry7@gmail.com`.
2. **Un tunnel de commande e-commerce standardisé (`/cart`, `/checkout`)** permettant aux visiteurs non connectés d'alimenter un panier persistant localement, de s'identifier au checkout via un panneau intégré à double onglet (Connexion directe ou Inscription rapide avec OTP, rôle `student`), ou via `/login?redirect=/checkout` sans perte de panier ni écran blanc.
3. **Une gestion multi-formats étanche & traçable** : 
   - Filtrage strict du format papier sur le catalogue (`/catalog`) basé sur `is_paper_available=True` de l'ouvrage maître (sans recours erroné à `price_paper > 0`).
   - Disponibilité papier fiable sur la page de détail (`/catalog/[slug]`) pilotée par l'autorisation éditoriale de l'ouvrage maître avec sélection de langue.
   - Collecte et enregistrement des coordonnées complètes de livraison (adresse, ville, pays, téléphone du destinataire pour le livreur) dans `PhysicalDelivery` reliée à `Order` pour l'espace d'administration (`/admin/orders`, `/manager/delivery`).
   - Déverrouillage instantané des formats numériques et audio dans la bibliothèque de l'espace client (`/student/books`).

---

## Technical Context

**Language/Version**: Python 3.12 (Django 5.2 / DRF) backend, TypeScript 5.x (Next.js 16.3 App Router) frontend  
**Primary Dependencies**: React 19, Lucide React (zéro émoji), Sonner (toasts), Tailwind CSS, Resend/SMTP pour les e-mails  
**Storage**: PostgreSQL 16 (modèles `ContactMessage`, `Order`, `LigneCommande`, `PhysicalDelivery`, `ReadingProgress`)  
**Testing**: Tests d'intégration API Django (`test_send_all_emails.py`, `apps/communications/tests`), validation de build Next.js (`npm run build`)  
**Target Platform**: Web responsive mobile-first (iPhone 375/390px, tablettes, desktop)  
**Project Type**: Web Application Fullstack (BFF Next.js proxying to Django REST API)  
**Performance Goals**: Temps de réponse API contact < 300ms, chargement checkout < 500ms, zéro layout shift  
**Constraints**: Tokens sémantiques obligatoires (`navy`, `gold`, `border`), typographie Playfair/Poppins, zéro code hexadécimal en dur, cookies `HttpOnly` pour les JWT  
**Scale/Scope**: Plateforme nationale et sous-régionale (UEMOA/CEDEAO) avec gestion multi-devises (FCFA par défaut)

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Principe I (Cadrage Métier & Lecture Intégrale Exhaustive)** : Modèles et vues Django inspectés à 100% (`apps/accounts/models.py`, `apps/communications/views.py`, `apps/commerce/models.py`, `apps/commerce/views.py`, `apps/catalog/views.py`).
- [x] **Principe III & IV (Backend DRF & Format Unifié)** : Type hints stricts et réponses au format `{ "success": true, "data": {}, "error": null }`.
- [x] **Principe VI (Sécurité & Cookies HttpOnly)** : Authentification sans token dans le JSON ; cookies sécurisés transmis au proxy BFF.
- [x] **Principe VIII (Intégration Frontend & Finitions Nobles)** : Zéro couleur hexadécimale en dur, classes sémantiques (`bg-navy`, `text-gold`, `border-border`), polices Google Playfair Display (titres) & Poppins (corps/boutons), **zéro émoji**.
- [x] **Principe XI (Traçabilité & Console Logs Systématiques)** : Logs détaillés et balisés `[CONTACT FORM]` et `[CHECKOUT FLOW]` dans les DevTools.
- [x] **Principe XIII (Persistance Mémoire)** : Synchronisation continue dans `.specify/memory/project_memory.md`.

---

## Project Structure

### Documentation (this feature)

```text
specs/006-contact-b2b-checkout-flow/
├── spec.md              # Spécification fonctionnelle validée
├── checklists/
│   └── requirements.md  # Checklist qualité des exigences
├── plan.md              # Plan d'implémentation technique (ce document)
├── research.md          # Décisions d'architecture Phase 0
├── data-model.md        # Modèles de données & transitions Phase 1
├── quickstart.md        # Guide de validation et scénarios de test
└── contracts/           # Contrats JSON Schema
    ├── contact-submission.json
    └── checkout-order-payload.json
```

### Source Code

```text
lahatheque-backend/
├── apps/
│   ├── communications/
│   │   ├── views.py         # ADMIN_NOTIFICATION_EMAILS corrigé (alhtdharry7@gmail.com) + gestion rôles
│   │   └── models.py        # ContactMessage avec rôle BD
│   ├── catalog/
│   │   └── views.py         # Filtre format=paper corrigé (strictement is_paper_available=True)
│   └── commerce/
│       ├── serializers.py   # CreateOrderSerializer avec options de provider mock/moneroo
│       ├── views.py         # CreateOrderView, enregistrement PhysicalDelivery complet
│       └── services.py      # Déverrouillage d'accès et notifications logistiques
lahatheque-frontend/
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx     # Prise en charge ?redirect= pour éviter l'écran blanc et le détour dashboard
│   └── (public)/
│       ├── contact/
│       │   └── page.tsx     # Formulaire B2B avec profils BD, combobox besoins, logs
│       ├── catalog/
│       │   └── page.tsx     # Filtre format papier public
│       └── checkout/
│           └── page.tsx     # Tunnel e-commerce avec téléphone livraison et panneau Option A
├── components/
│   ├── catalog/
│   │   └── book-action-buttons.tsx # Bouton papier réactivé selon book.is_paper_available
│   └── checkout/
│       └── checkout-auth-panel.tsx # Panneau intégré Connexion / Inscription rapide avec OTP
└── context/
    └── cart-context.tsx     # Persistance locale du panier
```

---

## Complexity Tracking

> **Aucune violation constitutionnelle. Toutes les exigences sont conformes aux principes du projet.**

| Violation | Why Needed | Simpler Alternative Rejected Because |
| :--- | :--- | :--- |
| *Aucune* | *N/A* | *N/A* |
