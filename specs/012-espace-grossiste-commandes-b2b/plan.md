# Plan d'Architecture & Implémentation : Module 12 - Espace Grossiste B2B

**Feature Branch**: `012-espace-grossiste-commandes-b2b`  
**Created**: 2026-08-20  

---

## 1. Architecture Globale

```
lahatheque-frontend/
├── app/(dashboard)/wholesaler/
│   ├── layout.tsx                     # Guard rôle ['wholesaler', 'admin', 'super_admin']
│   ├── page.tsx                       # Vue d'ensemble & KPIs consolidés
│   ├── catalog/
│   │   └── page.tsx                   # Grille catalogue B2B + 3D covers + WholesaleCartDrawer
│   ├── orders/
│   │   ├── page.tsx                   # Tableau des commandes groupées
│   │   ├── new/
│   │   │   └── page.tsx               # Finalisation de commande groupée
│   │   └── [id]/
│   │       └── page.tsx               # Détail commande + Stepper + Proforma + Suivi
│   ├── notifications/
│   │   └── page.tsx                   # Alertes réapprovisionnement & Nouveautés
│   └── profile/
│       └── page.tsx                   # Profil entreprise, NIF, RCCM, entrepôt & sécurité
├── components/features/wholesaler/
│   ├── wholesale-cart-drawer.tsx      # Panier latéral interactif
│   ├── cancel-order-modal.tsx         # Modale d'annulation avec motif obligatoire
│   └── wholesale-order-stepper.tsx    # Stepper dynamique d'avancement B2B
├── lib/
│   ├── types/wholesaler.ts            # Interfaces TypeScript
│   ├── mock/wholesaler.ts             # Données mockées réalistes
│   └── services/wholesaler.ts         # Services async connectés au BFF
```

---

## 2. Intégration BFF & API

- Préfixe des routes BFF : `/api/bff/commerce/wholesaler/`
- Endpoints couverts :
  - `GET /kpis/` : Statistiques clés du grossiste.
  - `GET /catalog/` : Liste des livres avec tarifs de gros et seuils minimaux.
  - `GET /orders/` : Historique des commandes B2B.
  - `GET /orders/<id>/` : Fiche détaillée de commande.
  - `POST /orders/` : Création atomique d'une commande groupée.
  - `POST /orders/<id>/cancel/` : Demande d'annulation avec motif.
  - `GET /notifications/` : Alertes et notifications.
  - `PATCH /profile/` : Mise à jour du profil d'entreprise.

---

## 3. Composants UI & Règles de Design

1. **Charte Visuelle Chic & Sobre** :
   - Fond sémantique `bg-background` et `bg-background-secondary`.
   - Couleurs de marque `bg-navy`, `text-navy`, `border-navy` et touches d'accent `text-gold`, `bg-gold`.
   - Zéro code couleur hexadécimal en dur (`bg-[#...]` interdit).
   - Zéro emoji dans l'ensemble des écrans et composants (icônes Lucide React exclusives).
2. **Mobile-First & Touch Targets** :
   - Cibles tactiles $\ge$ 44px.
   - Tables converties en cartes empilées sur mobile (`< lg`).
   - Panier drawer entièrement utilisable sur mobile (< 400px).
3. **Moteur 3D de Couverture** :
   - Intégration de `BookCover3D` sur le catalogue grossiste et les fiches de commande.
