# Implementation Plan: Module 5 - Espace Université (Partenaire Externe)

**Feature Branch**: `005-espace-universite-bouquets-redevances`  
**Created**: 2026-08-20  
**Status**: Ready for Execution  

---

## 1. Architecture des Routes Frontend (`app/(dashboard)/university/`)

| Route | Objectif & Composants Principaux | Feedback Visuel & Intuitivité |
| :--- | :--- | :--- |
| `page.tsx` | **Vue d'ensemble Université** : 4 KPI Cards (Étudiants affiliés, Bouquets souscrits, Consultations, Redevances 15%), graphiques d'usage par faculté, raccourcis | Skeletons de chargement, chiffres animés |
| `bouquets/page.tsx` | **Gestion & Souscription de Bouquets** : Packs par discipline / faculté / université, bouton de souscription avec spinner, export Word (.docx) & PDF | Spinners sur boutons, barre de progression, toasts Sonner |
| `catalog/page.tsx` | **Catalogue de l'Université** : Ouvrages affiliés et catalogue global, filtres par faculté/discipline, prévisualisation dans la liseuse, panier papier | Bouton Liseuse, sélecteur de quantité papier |
| `stats/page.tsx` | **Statistiques d'Usage par Faculté** : Consultations, pages lues, heures de lecture, top 10 des ouvrages les plus consultés de l'établissement | Graphiques comparatifs, filtres faculté/discipline |
| `affiliations/page.tsx` | **Affiliations Étudiants (Matricule & Carte)** : Validation rapide des demandes par matricule et justificatif, recherche instantanée, filtrage par faculté | Toasts de validation, badges de statut animés |
| `purchases/page.tsx` | **Commandes Papier Institutionnelles** : Historique des bons de commande, suivi du colis par transporteur, téléchargement du bon de commande PDF | Timeline de livraison, modal de confirmation |
| `purchases/new/page.tsx` | **Passation de Commande Papier Groupée** : Sélection d'ouvrages, adresses de livraison campus, calcul automatique du devis | Validation inline, calcul temps réel |
| `royalties/page.tsx` | **Redevances 15% & Virements** : Relevés mensuels, taux contractuel fixe (15%), téléchargement des bordereaux et demande de versement bancaire/Mobile Money | Spinner de virement, seuil 100k XOF, toasts |
| `profile/page.tsx` | **Fiche Établissement & Facultés** : Édition des facultés/UFRs, coordonnées du rectorat, RIB trésorerie publique / Mobile Money, sécurité | Sauvegarde asynchrone, validation regex |

---

## 2. Composants Features Spécialisés (`components/features/university/`)

1. **`bouquet-card.tsx`** : Carte riche de bouquet documentaire avec nombre de volumes, prix annuel, badge de statut, bouton de souscription avec spinner d'attente et bouton d'export Word / PDF.
2. **`faculty-stats-chart.tsx`** : Graphique d'usage interactif ventilant consultations et heures de lecture par faculté (FADESP, FSS, FASEG, FAST, FLASH).
3. **`student-affiliation-table.tsx`** : Tableau interactif des étudiants avec matricule, carte d'étudiant, actions rapides (Approuver, Suspendre, Diplômé) et modale de confirmation.
4. **`university-royalty-card.tsx`** : Carte financière mettant en valeur le cumul des 15% de redevance, avec bouton de demande de versement bancaire/Mobile Money.
5. **`word-export-dialog.tsx`** : Modale d'exportation de catalogue de bouquet documentaire au format Word (.docx) avec options de tri.

---

## 3. Endpoints REST Django (`lahatheque-backend/apps/university_portal/`)

- `GET /api/v1/university/kpis/` : KPIs exclusifs de l'université connectée.
- `GET /api/v1/university/faculties/` & `POST /api/v1/university/faculties/` : Gestion des UFRs.
- `GET /api/v1/university/bouquets/` & `POST /api/v1/university/bouquets/subscribe/` : Bouquets & souscription.
- `GET /api/v1/university/bouquets/<pk>/export-word/` : Export Word de la liste bibliographique d'un bouquet.
- `GET /api/v1/university/catalog/` : Ouvrages du catalogue avec filtres par faculté et discipline.
- `GET /api/v1/university/stats/` : Statistiques de consultation par faculté et discipline.
- `GET /api/v1/university/affiliations/` & `PATCH /api/v1/university/affiliations/<pk>/` : Validation/Suspension des étudiants par matricule.
- `GET /api/v1/university/paper-orders/` & `POST /api/v1/university/paper-orders/` : Commandes de livres physiques.
- `GET /api/v1/university/royalties/` & `POST /api/v1/university/royalties/withdraw/` : Relevés et demandes de versement.
- `GET /api/v1/university/profile/` & `PATCH /api/v1/university/profile/` : Profil institutionnel & coordonnées bancaires.
