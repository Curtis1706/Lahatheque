# Quickstart & Validation Guide: Répartition Dynamique des Redevances sur Bouquets Documentaires

**Feature**: `002-bouquet-royalties-distribution`
**Date**: 2026-09-08

Ce guide décrit les scénarios de test et de validation de bout en bout pour vérifier le bon fonctionnement de la répartition des redevances bouquets sans aucune donnée mockée.

---

## 1. Prérequis d'Environnement

1. Backend Django actif (`http://127.0.0.1:8000`) avec les migrations appliquées.
2. Frontend Next.js actif (`http://localhost:3000`).
3. Données de base initialisées (au moins 2 universités partenaires avec ouvrages et abonnements bouquets actifs).

---

## 2. Scénarios de Validation de Bout en Bout

### Scénario 1 : Vérification de l'API de Distribution Réelle (Backend)

Exécuter la requête suivante pour tester la génération du payload dynamique de répartition :

```bash
python manage.py test apps.reporting.tests.test_bouquet_revenue_distribution
```

**Résultat attendu** :
* Tous les tests unitaires et d'intégration passent avec succès.
* Le total des parts d'usage (`total_usage_percentage`) est strictement égal à 100.00%.
* Le taux conventionné reflète fidèlement la cascade : Taux Institution > Taux Global Admin.

---

### Scénario 2 : Validation de l'Espace Université (Frontend)

1. Se connecter avec le compte démo universitaire :
   - **E-mail** : `universite@lahatheque.com`
   - **Mot de passe** : `123456`
2. Naviguer vers l'URL : `/university/royalties`.
3. Vérifier :
   - L'onglet **« Redevances Bouquets (Prorata Consultations) »** est bien visible et cliquable.
   - Les cartes de bouquets documentaires souscrits s'affichent sans mention de facultés.
   - Cliquer sur le bouton **« Répartition & Redevances »** pour ouvrir la modale.
   - Le diagramme circulaire vectoriel (camembert) s'affiche avec les pourcentages d'audience réels.
   - Le graphique en barres horizontales affiche les redevances calculées en monnaie locale (XOF).
   - L'Université connectée est mise en valeur dans les graphiques.

---

### Scénario 3 : Validation de l'Espace Administration (Frontend)

1. Se connecter avec le compte administrateur :
   - **E-mail** : `admin@lahatheque.com`
   - **Mot de passe** : `admin123` (ou mot de passe configuré)
2. Naviguer vers `/admin/royalties/universities`.
3. Dans la section *« Répartition des Bouquets par Université Partenaire »*, cliquer sur **« Répartition & Statistiques »** sur un bouquet.
4. Vérifier :
   - Le camembert affiche 100 % de l'usage ventilé entre toutes les universités contributrices (Option A).
   - Les barres horizontales affichent les montants nets dus pour chaque université.
   - Le total des redevances et la part résiduelle revenant à la plateforme LAHA sont clairement distingués.

---

### Scénario 4 : Test de Dynamisme du Taux

1. Dans l'espace administration, modifier le taux général des universités partenaires (ex: passer de 15% à 20%).
2. Rafraîchir la page des redevances de l'université.
3. Vérifier que les barres de redevances et les montants nets dans le tableau recalculent immédiatement la valeur avec 20% au lieu de 15%.
