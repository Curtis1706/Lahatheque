# 🏗️ Architecture Périmètre Étudiant, Commerce & Protection (LAHAThèque v3.2)

Ce document conserve les choix d'architecture validés pour le rôle Étudiant, le module e-commerce et la protection des droits.

---

## 1. Proxy BFF Générique Next.js
- Toutes les requêtes frontend authentifiées vers les endpoints v1 de Django REST passent par la route proxy unique `app/api/bff/[...path]/route.ts`.
- Le proxy attache automatiquement l'en-tête `Authorization: Bearer <token>` extrait du cookie HttpOnly `laha_access`.

## 2. Persistance des Annotations & Surlignages
- Modèle `Annotation` dans `apps/protection/models.py` (`user`, `ouvrage`, `type`, `position_data`, `selected_text`, `note_content`, `color`).
- Permission DRF `IsAnnotationOwner` dans `apps/protection/permissions.py` garantissant l'isolation stricte des notes (`request.user == obj.user`).
- Le hook frontend `useAnnotations.ts` effectue des mises à jour optimistes avec synchronisation API en tâche de fond.

## 3. Module Commerce & Paiements
- **Panier Client** : Géré exclusivement côté client via `useCart` (`context/cart-context.tsx`), sans modèle `Cart` en base Django.
- **Paiements** : Abstraction `PaymentProvider` (`apps/commerce/payment_providers.py`). La classe `MockPaymentProvider` est le fournisseur actif par défaut en développement.
- **Vérification du Stock** : L'option format Papier est masquée/bloquée si `stock_disponible <= 0`.
- **Commandes** : L'appel `POST /api/bff/commerce/orders/` crée en une transaction atomique la `Order`, ses `LigneCommande` et l'enregistrement `PhysicalDelivery` (si papier).

## 4. Octroi d'Accès de Lecture (`ReadBookView`)
L'accès au lecteur `/catalog/reader/[id]` est accordé si l'une des 3 conditions est remplie :
1. Achat individuel payé (`LigneCommande` payée pour l'ouvrage).
2. Abonnement individuel actif (`Subscription.user` actif).
3. Bouquet institutionnel actif (`Subscription.institution` actif + `StudentAffiliation.is_validated=True`).

## 5. Abonnements & Bouquets (`/subscriptions`)
- La vue `/subscriptions` vérifie `has_active_institutional_access` via `SubscriptionPlanListView`.
- Si l'étudiant est déjà couvert par un bouquet universitaire, une bannière dorée l'informe qu'il bénéficie d'un accès offert sans faire repayer.
