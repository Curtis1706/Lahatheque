# Feature Specification: Module 13 - Espace Client, Lecteur & Étudiant (LAHAThèque v3.2)

**Feature Branch**: `013-espace-client-lecteur-abonnements`  
**Created**: 2026-08-20  
**Status**: Ready for Implementation  
**Source Métier**: Cahier des charges LAHAThèque v3.2 (Section 4.1.8 « Rôle 8 : CLIENTS (LECTEURS / ÉTUDIANTS) », Section 4.2, 4.3, 6, 7, 8 « Livres Audio », 11 « Bouquets Documentaires ») ; Architecture DRM (`docs/drm/`) ; Guide API Lecteur (`KIT_PORTAGE_LECTEUR/`) ; Workflow `/build-lahatheque-screen`.

---

## 1. Résumé Exécutif & Vision Produit

L'**Espace Client / Lecteur / Étudiant (`student`)** est le cœur grand public et universitaire de la plateforme **LAHAThèque v3.2**. Il permet à tout apprenant, étudiant, enseignant ou lecteur individuel d'accéder au savoir sans friction, de lire en ligne sous protection DRM LCP sécurisée, d'écouter des livres audio avec vitesse adaptative, d'acheter des ouvrages à l'unité (numérique, audio, livre papier avec livraison à domicile/campus), et de débloquer automatiquement les bouquets documentaires de son université partenaire via son affiliation matriculaire.

### Principes Directeurs
1. **Zéro Friction de Lecture** : Extraits gratuits lisibles instantanément en 1 clic sans inscription obligatoire préalable.
2. **Reprise de Lecture Immédiate** : Bannière dynamique de reprise instantanée affichant le livre en cours avec son pourcentage de progression et son dernier chapitre lu.
3. **Double Accès (Achats Unitaires & Bouquets Universitaires)** :
   - *Client Autonome* : Achats à l'unité (numérique EPUB/PDF, audio MP3/M4B, papier physique).
   - *Étudiant Rattaché* : Affiliation par numéro de matricule et carte étudiante permettant d'activer les bouquets documentaires souscrits et financés par son université.
4. **Lecteur Audio Moderne** : Streaming audio MP3/M4B avec vitesse réglable (0.75x, 1x, 1.25x, 1.5x, 2x), progression automatique et reprise au timecode exact.
5. **Commande Papier Intégrée** : Achat physique avec calcul automatique des frais de livraison, sélection de l'adresse et suivi en temps réel du colis par transporteur.

---

## 2. Typologie des Utilisateurs & Droits d'Accès

| Utilisateur | Modalité d'Accès | Droits sur le Catalogue | Fonctionnalités Clés |
| :--- | :--- | :--- | :--- |
| **Client Grand Public** | Auto-inscription (Email / Téléphone) | Achat unitaire, extraits gratuits, abonnements Pass | Bibliothèque personnelle, liseuse LCP, audio streaming, commandes papier |
| **Étudiant Partenaire** | Auto-inscription + Affiliation Université | Accès complet aux bouquets de son université + achats privés | Espace « Mon Université », bouquets campus, téléchargement Word officiel, liseuse illimitée |
| **Enseignant / Chercheur** | Profil certifié par l'établissement | Accès aux bouquets recherche, manuels recommandés | Recommandations de lecture, annotations privées, statistiques d'étude |

---

## 3. Parcours Utilisateur & Scénarios d'Acceptation (User Stories)

### User Story 1 : Reprise de Lecture Instantanée & Bibliothèque Numérique (P1 - MVP)
**En tant que** lecteur récurrent,  
**Je veux** retrouver instantanément le livre que j'étais en train de lire dès mon arrivée sur le dashboard,  
**Afin de** reprendre ma lecture sans perdre une seconde dans les menus.

**Scénarios d'acceptation** :
1. **Étant donné** un utilisateur ayant une lecture en cours (ex: "Droit Constitutionnel Béninois", 68%), **Quand** il ouvre `/student`, **Alors** une bannière dorée de reprise de lecture s'affiche avec la couverture, le titre, le chapitre en cours, la jauge 68% et un bouton d'action directe "Continuer la lecture".
2. **Étant donné** un clic sur "Continuer la lecture", **Quand** l'action est déclenchée, **Alors** la liseuse s'ouvre sur `/catalog/reader/[id]` avec restauration automatique de la page et du scroll exact.
3. **Étant donné** la page `/student/books`, **Quand** l'utilisateur navigue dans sa bibliothèque, **Alors** il peut basculer entre la vue Grille et la vue Liste, filtrer par format (Numérique, Audio, PDF, Bouquet) et marquer des favoris.

---

### User Story 2 : Catalogue Connecté, Extraits Gratuits & Achat en 1 Clic (P1 - MVP)
**En tant que** lecteur cherchant de nouveaux ouvrages,  
**Je veux** parcourir le catalogue avec filtres thématiques et lire un extrait gratuit immédiatement,  
**Afin de** vérifier la pertinence de l'ouvrage avant d'acheter ou de souscrire.

**Scénarios d'acceptation** :
1. **Étant donné** la page `/student/catalog`, **Quand** l'utilisateur recherche par mot-clé, discipline (Droit, Médecine, Sciences), pays (Bénin, Sénégal, Côte d'Ivoire...) ou langue, **Alors** les résultats s'actualisent instantanément sans rechargement de page.
2. **Étant donné** une fiche livre sur `/student/catalog/[id]`, **Quand** l'utilisateur clique sur "Lire un extrait gratuit", **Alors** une visionneuse modale sécurisée affiche les 15 premières pages avec filigrane de prévisualisation.
3. **Étant donné** l'achat d'un livre papier, **Quand** l'utilisateur clique sur "Commander la version papier", **Alors** une modale ergonomique permet de spécifier le nombre d'exemplaires, l'adresse de livraison et le mode de paiement (Mobile Money MTN/Moov/Orange ou Carte).

---

### User Story 3 : Lecteur Audio Adaptatif (P1 - MVP)
**En tant que** lecteur mobile / en déplacement,  
**Je veux** écouter la version audio d'un livre avec réglage de la vitesse de lecture,  
**Afin d'**apprendre en mobilité.

**Scénarios d'acceptation** :
1. **Étant donné** un livre audio dans `/student/books`, **Quand** l'utilisateur clique sur "Écouter", **Alors** le composant `AudiobookPlayerCard` démarre la lecture en streaming avec affichage du narrateur, de la durée restante et de la barre de progression.
2. **Étant donné** le sélecteur de vitesse, **Quand** l'utilisateur choisit `1.25x` ou `1.5x`, **Alors** l'audio s'ajuste instantanément sans distorsion de pitch.
3. **Étant donné** la mise en pause ou la fermeture de page, **Quand** l'utilisateur revient, **Alors** la position d'écoute est conservée à la seconde près.

---

### User Story 4 : Affiliation Universitaire & Bouquets Campus (P1 - MVP)
**En tant qu'**étudiant d'une université partenaire (UAC, UNA, Parakou...),  
**Je veux** rattacher mon compte à mon université sans avoir besoin d'une adresse email institutionnelle,  
**Afin de** bénéficier gratuitement des bouquets documentaires souscrits par mon rectorat.

**Scénarios d'acceptation** :
1. **Étant donné** la page `/student/university`, **Quand** l'étudiant sélectionne son université et sa faculté, saisit son Numéro de Matricule Académique et téléverse sa carte d'étudiant, **Alors** la demande passe au statut `en_attente_validation` avec notification visuelle.
2. **Étant donné** une affiliation validée par l'université, **Quand** l'étudiant visite `/student/university`, **Alors** la liste des bouquets documentaires de sa faculté s'affiche avec le bouton direct "Explorer le Bouquet" et le lien de téléchargement du catalogue Word officiel.

---

### User Story 5 : Suivi des Commandes Papier & Factures (P2)
**En tant qu'**acheteur de livres physiques,  
**Je veux** suivre l'expédition de mes colis papier et télécharger mes reçus/factures,  
**Afin d'**avoir une traçabilité complète de mes achats.

**Scénarios d'acceptation** :
1. **Étant donné** la page `/student/orders`, **Quand** l'utilisateur consulte son historique, **Alors** chaque commande affiche son statut de livraison (`en_preparation`, `expedie`, `livre`), le transporteur assigné, le numéro de suivi et un bouton de téléchargement de la facture PDF.

---

### User Story 6 : Abonnements Pass Lecteur & Gestion des Formules (P2)
**En tant que** lecteur régulier,  
**Je veux** souscrire ou modifier mon Pass Lecteur (Mensuel, Annuel, Famille),  
**Afin d'**accéder à un tarif avantageux et forfaitaire sur l'ensemble de la bibliothèque.

**Scénarios d'acceptation** :
1. **Étant donné** la page `/student/subscriptions`, **Quand** l'utilisateur consulte ses formules actives, **Alors** il voit la date de prochain prélèvement, le moyen de paiement enregistré, le bouton pour basculer en formule annuelle (avec réduction 2 mois offerts) ou résilier l'abonnement.

---

## 4. Arborescence & Cartographie des 8 Écrans

```
app/(dashboard)/student/
├── layout.tsx                    -> Shell authentifié (AuthGuard: student, teacher, super_client, admin)
├── page.tsx                      -> Vue d'ensemble (KPIs, reprise lecture, livres récents, audio en cours)
├── books/
│   └── page.tsx                  -> Ma Bibliothèque (Numérique, Audio, Bouquets, Filtres, Favoris)
├── catalog/
│   ├── page.tsx                  -> Catalogue & Découverte (Recherche full-text, filtres pays/discipline/langue)
│   └── [id]/
│       └── page.tsx              -> Fiche Détail Ouvrage (Extrait gratuit, achat numérique/papier, audio)
├── history/
│   └── page.tsx                  -> Historique de Lecture & Statistiques d'Étude (Heures lues, streak)
├── orders/
│   └── page.tsx                  -> Mes Achats & Commandes Papier (Suivi transporteur, bons de livraison)
├── subscriptions/
│   └── page.tsx                  -> Mes Abonnements & Pass (Pass Mensuel/Annuel/Famille, Bouquets)
├── university/
│   └── page.tsx                  -> Mon Université & Bouquets Campus (Affiliation matricule, packs faculté)
└── profile/
    └── page.tsx                  -> Mon Profil Lecteur & Préférences (Avatar, coordonnées, sécurité)
```

---

## 5. Spécifications Techniques & Modèles de Données

### Modèles Django Associés (`apps/commerce/`, `apps/catalog/`, `apps/audio/`, `apps/partners/`)
- `Ouvrage` & `OuvrageFormat` : Données bibliographiques, ISBN, formats EPUB/PDF/Papier, prix unitaire, extraits gratuits.
- `LivreAudio` & `PisteAudio` : Pistes audio MP3/M4B, narrateurs, durée, statut DRM.
- `Subscription` & `SubscriptionPlan` : Plans d'abonnements individuels (Pass Mensuel 4 900 XOF, Annuel 49 000 XOF, Famille).
- `Order` & `LigneCommande` : Commandes numériques et papier avec montants en XOF/XAF/EUR.
- `PhysicalDelivery` : Suivi colis papier (transporteur, numéro de tracking, adresse campus/domicile, statut d'expédition).
- `StudentAffiliation` : Rapprochement université/faculté par matricule et justificatif scolarité.
- `LectureHistory` & `Annotation` : Sessions de lecture, pages parcourues, temps de lecture, signets et surlignages.

---

## 6. Composants 21st.dev Identifiés & Chaîne d'Intégration

| Composant Cible | Rôle UI | Composant 21st.dev Sélectionné | Adaptation LAHAThèque |
| :--- | :--- | :--- | :--- |
| **Bannière Reprise de Lecture** | Dashboard & Bibliothèque | `ProgressCard` / `InteractiveBookProgress` | Intégration de la couverture HD, jauge dorée, lien liseuse direct |
| **Lecteur Audio Intégré** | Écoute en mobilité | `AudioPlayerControls` (21st.dev) | Vitesse adaptative (0.75x-2x), waveform subtile, fond navy |
| **Grille Catalogue avec Aperçu** | Catalogue & Fiche livre | `CatalogCardGrid` / `BookCard` | Badges de formats, prix XOF, modal d'extrait immédiat |
| **Statistiques d'Étude** | Historique de lecture | `DonutChart` / `AreaActivityChart` (21st.dev) | Heures de lecture par discipline, streak de jours consécutifs |
| **Timeline de Suivi Colis** | Commandes physiques | `OrderTrackingTimeline` | Étapes : Préparation -> Expédié -> En transit -> Livré |
| **Cartes d'Abonnement Pass** | Page Abonnements | `PricingTierCard` (21st.dev) | Comparateur Mensuel/Annuel, badge "Recommandé", bouton de paiement |

---

## 7. Critères de Qualité & Règles de Conformité

1. **Zéro Emoji (Règle Absolue)** : Utilisation exclusive des icônes vectorielles `lucide-react`.
2. **Tokens CSS Sémantiques** : `bg-navy`, `bg-gold`, `border-border`, `bg-background`, `text-foreground`. Zéro code hexadécimal en dur.
3. **Mobile-First Garanti** : Testé et parfaitement lisible sur des écrans < 400px de large (zones tactiles >= 44px).
4. **Système de Loading Unifié** : Utilisation de skeletons épousant la forme exacte des livres et des cartes pour éviter tout layout shift.
5. **Format JSON Standardisé** : `{ "success": true, "data": {...}, "error": null }`.
