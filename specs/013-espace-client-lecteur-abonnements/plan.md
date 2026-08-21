# Implementation Plan: Module 13 - Espace Client, Lecteur & Étudiant (LAHAThèque v3.2)

**Feature Branch**: `013-espace-client-lecteur-abonnements`  
**Created**: 2026-08-20  
**Status**: Ready for Implementation  
**Source Métier**: Cahier des charges LAHAThèque v3.2 (Section 4.1.8, 4.2, 4.3, 6, 7, 8, 11) ; Workflow `/build-lahatheque-screen`

---

## 1. Architecture des Écrans Frontend (`app/(dashboard)/student/`)

| Route | Objectif & Composants Principaux | Feedback Visuel & Intuitivité |
| :--- | :--- | :--- |
| `page.tsx` | **Vue d'ensemble Client/Lecteur** : Bannière de reprise de lecture immédiate, 4 KPIs réactifs (Livres en bibliothèque, Abonnement actif, Commandes en cours, Université affiliée), carrousel des lectures récentes, lecteur audio rapide | Skeletons de chargement, jauge de lecture animée, bouton Liseuse direct |
| `books/page.tsx` | **Ma Bibliothèque** : Liste complète des ouvrages acquis (achats, abonnements, bouquets université), lecteur audio intégré `AudiobookPlayerCard`, filtres par format (EPUB, PDF, Audio), favoris, bascule Grille / Liste | Filtrage instantané, bascule fluide, cartes riches |
| `catalog/page.tsx` | **Catalogue & Découverte** : Moteur de recherche full-text, filtres par discipline, langue, pays et université, tags d'extraits gratuits, boutons d'action rapide (Lire un extrait, Ajouter au panier, Commander papier) | Badges de formats, modale d'extrait gratuit, toasts |
| `catalog/[id]/page.tsx` | **Fiche Détail Ouvrage** : Couverture haute résolution, métadonnées bibliographiques (ISBN, auteurs, édition, langue, pays), résumé IA, visionneuse d'extrait gratuit sans inscription obligatoire, sélecteur de format d'achat | Boutons d'achat différenciés (Numérique vs Papier), audio player preview |
| `history/page.tsx` | **Historique de Lecture & Stats d'Étude** : Graphique d'activité de lecture (heures hebdomadaires, streak de jours consécutifs), répartition par discipline (`DonutChart` 21st.dev), liste chronologique des sessions de lecture | Chiffres clés animés, timeline détaillée, badges |
| `orders/page.tsx` | **Mes Achats & Commandes Papier** : Tableau des commandes numériques et physiques, statut de livraison (`en_preparation`, `expedie`, `livre`), timeline transporteur avec numéro de suivi, téléchargement de facture PDF | Timeline visuelle, modal de reçu/facture |
| `subscriptions/page.tsx` | **Mes Abonnements & Pass** : Formules Pass Lecteur (Mensuel 4 900 XOF, Annuel 49 000 XOF, Famille), bouquets documentaires débloqués par l'université, gestion du renouvellement automatique et des moyens de paiement | Comparateur de formules, toasts de confirmation, badge "Économisez 2 mois" |
| `university/page.tsx` | **Mon Université & Bouquets Campus** : Statut de l'affiliation étudiante (Matricule académique, justificatif de scolarité), liste des bouquets documentaires offerts par l'université de rattachement, export Word officiel | Formulaire de demande d'affiliation avec dropzone, aperçu des packs faculté |
| `profile/page.tsx` | **Mon Profil Lecteur & Paramètres** : Modification de l'avatar, coordonnées (téléphone, pays), préférences de lecture (thème sombre/clair, police dyslexique), mot de passe et sessions actives | Validation inline, sauvegarde asynchrone |

---

## 2. Composants Features Spécialisés (`components/features/student/`)

1. **`BookCard`** : Carte d'ouvrage complète avec couverture visible, badges de formats (PDF, EPUB, Audio), indicateur de progression de lecture, favoris et menu d'actions.
2. **`BookListItem`** : Version ligne compacte pour la vue Liste de la bibliothèque avec barre de progression fine.
3. **`AudiobookPlayerCard`** : Lecteur audio streaming intégré avec vitesse réglable (0.75x, 1x, 1.25x, 1.5x, 2x), timeline de progression et contrôles avance/retour 15s.
4. **`BookSampleModal`** : Visionneuse d'extrait gratuit (15 premières pages) avec filigrane de prévisualisation et blocage clic droit.
5. **`PaperOrderModal`** : Modale d'achat de livre physique papier avec saisie d'adresse, calcul des frais de port et sélection du mode de règlement.
6. **`StudentKpiCharts`** : Graphiques d'activité et de répartition par discipline basés sur les composants interactifs 21st.dev (`DonutChart`).
7. **`ViewToggle`** : Sélecteur ergonomique vue Grille / vue Liste avec mémorisation des préférences.
8. **`AffiliationRequestCard`** : Formulaire de soumission de matricule académique et carte d'étudiant pour les étudiants partenaires.

---

## 3. Plan d'Implémentation Étape par Étape

### Phase 1 : Données Mockées Typées & Services (`lib/types/student.ts`, `lib/services/student.ts`, `lib/mock/student.ts`)
- Vérifier et enrichir les interfaces TypeScript pour couvrir tous les cas d'usage (extraits, audio, historique, abonnements, commandes papier, affiliation).
- Créer un mock complet avec des données africaines réalistes (UAC, UNA, Parakou, ouvrages en Droit/Médecine/Sciences, devises XOF/XAF).
- Développer des services asynchrones robustes avec gestion des erreurs et simulation réseau.

### Phase 2 : Composants Features 21st.dev & UI Mobile-First
- Perfectionner les composants dans `components/features/student/` pour assurer une intégration sans faille avec les tokens `globals.css`.
- Garantir le responsive design strict sous 400px de large (boutons >= 44px, disposition mobile en colonne unique).

### Phase 3 : Harmonisation & Intégration des 8 Écrans (`app/(dashboard)/student/`)
- Mettre à jour et sublimer chaque écran avec un design chic, sobre et épuré.
- Intégrer les bannières de reprise de lecture, les filtres instantanés et le lecteur audio adaptatif.
- Connecter le bouton liseuse à `/catalog/reader/[id]`.

### Phase 4 : Contrôle Qualité, TypeScript & Production Build
- `npx tsc --noEmit --skipLibCheck` -> 0 erreur TypeScript.
- `npm run build` -> Compilation et prérendu réussis de toutes les routes Next.js.
