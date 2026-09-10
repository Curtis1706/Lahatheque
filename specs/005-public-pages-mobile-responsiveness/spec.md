# Feature Specification: Responsivité Mobile Complète des Pages Publiques

**Feature Branch**: `005-public-pages-mobile-responsiveness`

**Created**: 2026-09-10

**Status**: Draft

---

## Clarifications

### Session 2026-09-10

- Q: Comment gérer les sections animées / composants graphiques complexes (SVG animé `SavoirAfriqueSection`) sur mobile ? → A: Adaptation mobile-first obligatoire. Le diagramme SVG animé bascule vers une version simplifiée empilée verticalement sur mobile (< 768px). Aucune section ne peut être masquée — tout le contenu reste accessible.

---

## User Scenarios & Testing

### User Story 1 — Navigation Mobile & Header Responsive (Priority: P1 — MVP)

En tant que visiteur LAHAThèque sur smartphone (375-430px), je veux pouvoir naviguer facilement entre les pages publiques via un header mobile avec logo, icône panier et menu hamburger, accéder aux sous-menus et à la barre de recherche sans zoomer ni scroller horizontalement.

**Why this priority**: Le header est présent sur toutes les pages publiques. Un header cassé sur mobile est rédhibitoire pour 100% des visiteurs mobiles.

**Acceptance Scenarios**:
1. **Given** un visiteur mobile (375-430px), **When** il ouvre la page d'accueil, **Then** le header affiche logo + icône panier + icône hamburger en ligne unique sans débordement.
2. **Given** un visiteur mobile, **When** il tape sur l'icône hamburger, **Then** un drawer de navigation s'ouvre avec tous les liens (zone minimale 44px).
3. **Given** un visiteur mobile, **When** il tape sur l'icône de recherche, **Then** la barre de recherche s'ouvre en overlay plein écran au-dessus du clavier virtuel.
4. **Given** un visiteur mobile avec encoche, **When** il navigue, **Then** le contenu respecte les safe areas iOS/Android.
5. **Given** un visiteur tablette (768-1024px), **When** il navigue, **Then** le header bascule vers la navigation desktop avec menus déroulants.

---

### User Story 2 — Page d'Accueil Mobile (Priority: P1)

En tant que visiteur mobile, je veux consulter la page d'accueil complète (Hero, Nouveautés, Vision/Savoir Afrique, Compteurs, Présence Panafricaine, Partenaires, Pourquoi Choisir) de façon lisible et scrollable verticalement sans overflow horizontal.

**Acceptance Scenarios**:
1. **Given** un visiteur mobile (390px), **When** il charge la page, **Then** le Hero affiche titre, sous-titre et CTA en colonne unique centrée.
2. **Given** un visiteur mobile, **When** il atteint la section Nouveautés, **Then** les cartes s'affichent en 1 colonne (mobile), 2 colonnes (sm), 3 colonnes (md/lg).
3. **Given** un visiteur mobile, **When** il atteint la section SavoirAfriqueSection, **Then** le SVG est remplacé par une version verticale empilée lisible.
4. **Given** un visiteur mobile, **When** il atteint les compteurs statistiques, **Then** ils s'affichent en grille 2x2 centrée.
5. **Given** un visiteur mobile, **When** il atteint la section Partenaires (marquee), **Then** le défilement horizontal animé fonctionne sans scroll de page horizontal.

---

### User Story 3 — Catalogue & Fiche Produit Mobile (Priority: P1)

En tant qu'utilisateur mobile, je veux parcourir le catalogue avec filtres accessibles via drawer, consulter la liste de livres en cartes adaptées, et ouvrir une fiche produit avec toutes les informations lisibles et le bouton d'achat accessible.

**Acceptance Scenarios**:
1. **Given** un visiteur mobile sur `/catalog`, **When** il tape sur "Filtres", **Then** un drawer s'ouvre avec les filtres accessibles au toucher.
2. **Given** un visiteur mobile, **When** les filtres sont fermés, **Then** la liste s'affiche en 1-2 colonnes avec cartes lisibles sans zoom.
3. **Given** un visiteur mobile sur `/catalog/[id]`, **When** il charge la page, **Then** le Book3D est centré et proportionné, les onglets formats sont accessibles, le bouton CTA est sticky en bas.
4. **Given** un visiteur mobile, **When** il consulte la description longue, **Then** elle est tronquée avec un bouton "Voir plus".

---

### User Story 4 — Pages de Contenu Éditorial Mobile (Priority: P2)

En tant que visiteur mobile, je veux lire les pages éditoriales (About, Contact, CGU, CGV, Mentions Légales, Partenaires, Universités, Prestations, Tarification) en colonne unique, typographie lisible, formulaires fonctionnels au toucher.

**Acceptance Scenarios**:
1. **Given** un visiteur mobile sur `/about`, **When** il scroller, **Then** toutes les sections sont en colonne unique sans débordement.
2. **Given** un visiteur mobile sur `/contact`, **When** il remplit le formulaire, **Then** les champs sont pleine largeur, le clavier ne masque pas le champ actif, le bouton d'envoi est accessible.
3. **Given** un visiteur mobile sur `/pricing`, **When** il consulte les grilles tarifaires, **Then** les cartes de prix s'empilent verticalement.
4. **Given** un visiteur mobile sur `/universities` ou `/partners`, **When** il scroller, **Then** les logos/grilles s'adaptent en 2-3 colonnes max sur mobile.

---

### User Story 5 — Panier & Tunnel d'Achat Mobile (Priority: P1)

En tant qu'utilisateur mobile, je veux accéder au CartDrawer, consulter mon panier et compléter le checkout avec une expérience fluide, des champs accessibles et un récapitulatif lisible avant validation.

**Acceptance Scenarios**:
1. **Given** un utilisateur mobile, **When** il ouvre le CartDrawer, **Then** il couvre 90-100% de la hauteur visible (dvh), les articles sont en colonne unique, le bouton "Commander" est sticky en bas.
2. **Given** un utilisateur mobile sur `/cart`, **When** il consulte son panier, **Then** les lignes d'articles sont lisibles, les contrôles quantité ont des zones ≥ 44px.
3. **Given** un utilisateur mobile sur `/checkout`, **When** il remplit ses informations, **Then** les sections s'affichent en colonne unique avec stepper compact, et le récapitulatif est en accordéon.

---

### User Story 6 — Composants UI Transversaux Mobile (Priority: P1)

En tant que visiteur mobile, je veux que tous les composants UI réutilisables (modales, toasts, drawers, accordéons, badges, cartes, breadcrumbs) fonctionnent correctement sur mobile.

**Acceptance Scenarios**:
1. **Given** un utilisateur mobile, **When** une modale s'ouvre, **Then** elle est plein écran (< 640px) avec overlay de fermeture accessible et contenu scrollable.
2. **Given** un utilisateur mobile, **When** un toast s'affiche, **Then** il apparaît en bas de l'écran avec zone de fermeture ≥ 44px.
3. **Given** un utilisateur mobile, **When** un dropdown s'ouvre, **Then** la liste est scrollable avec éléments de hauteur minimale 44px.
4. **Given** un utilisateur mobile, **When** il navigue sur une page avec breadcrumb, **Then** le breadcrumb reste sur une ligne avec ellipsis sur les labels intermédiaires.

---

## Edge Cases

- **Diagramme SVG Animé sur petit écran** : Sur < 375px, la hauteur calculée peut devenir illisible. Basculer vers une liste empilée avec icônes sur mobile.
- **Overflow causé par le padding-bottom ratio** : `paddingBottom: "43.75%"` avec `minHeight: "360px"` cause un espace blanc excessif sur mobile. Supprimer ou réduire `minHeight` sur mobile.
- **Clavier virtuel et positions fixes** : Les éléments `position: fixed` ne se repositionnent pas correctement quand le clavier virtuel apparaît. Utiliser `dvh` en remplacement de `vh`.
- **Hover states sur tactile** : Les effets `:hover` persistent sur les appareils tactiles. Conditionner à `@media (hover: hover)`.
- **Book3D tailles fixes** : Sur mobile en colonne unique, le livre doit être plus grand (200-240px) pour être visuellement impactant.
- **Grille 6 colonnes** : `xl:grid-cols-6` sans breakpoints mobiles inférieurs rend les cartes invisibles. Sur mobile, cartes en layout horizontal ou 1 colonne.
- **Scrollbar horizontale parasite** : Appliquer `overflow-x: hidden` sur le layout racine avec précaution pour ne pas masquer les drawers/modales légitimes.

---

## Requirements

### Functional Requirements

- **FR-001**: L'ensemble des pages publiques LAHAThèque (`/`, `/about`, `/catalog`, `/catalog/[id]`, `/cart`, `/checkout`, `/contact`, `/cgu`, `/cgv`, `/legal`, `/partners`, `/universities`, `/pricing`, `/prestations`, `/subscriptions`, `/authors`, `/guide`, `/preview`) DOIT être lisible sans scroll horizontal sur 375-430px.
- **FR-002**: Le header (`app/(public)/layout.tsx`) DOIT afficher sur mobile logo + icône panier + hamburger, avec drawer de navigation pour les sous-menus. La navigation desktop DOIT être masquée sous `lg:`.
- **FR-003**: `SavoirAfriqueSection` DOIT afficher sur mobile (< 768px) une version simplifiée verticale — liste empilée des continents + texte narratif — remplaçant le SVG animé complexe.
- **FR-004**: La grille de nouveautés DOIT afficher sur mobile des cartes en format horizontal (couverture 40% | infos 60%) ou en 1 colonne avec hauteur réduite.
- **FR-005**: Tous les éléments interactifs DOIVENT avoir une zone de toucher minimale de 44×44px.
- **FR-006**: Le `CartDrawer` DOIT couvrir 90-100% de la hauteur visible en utilisant `dvh`, avec le bouton d'action sticky en bas.
- **FR-007**: Les formulaires sur pages publiques DOIVENT avoir tous les champs en pleine largeur sur mobile, labels au-dessus des champs, auto-scroll vers le champ en erreur.
- **FR-008**: Le composant `Book3D` DOIT adapter sa taille au contexte mobile : minimum 200px de hauteur en fiche produit mobile.
- **FR-009**: Les modales DOIVENT s'afficher en plein écran sur mobile (< 640px) avec bouton de fermeture en haut et contenu scrollable.
- **FR-010**: La fiche produit `/catalog/[id]` DOIT s'afficher en colonne unique sur mobile (couverture, métadonnées, onglets, prix, CTA sticky en bas).
- **FR-011**: Le checkout `/checkout` DOIT afficher un stepper compact mobile avec sections en accordéon et récapitulatif via accordéon.
- **FR-012**: Les pages tarifaires et institutionnelles DOIVENT afficher leurs grilles en colonne unique sur mobile.
- **FR-013**: `PartnerLogoMarquee`, `CountingNumber`, `PanafricanPresenceSection`, `WhyChooseSection` DOIVENT être validés sans débordement horizontal ni espace blanc excessif sur mobile.
- **FR-014**: Les effets `:hover` DOIVENT être conditionnés à `@media (hover: hover)`.
- **FR-015**: Les éléments utilisant `100vh` DOIVENT utiliser `100dvh` pour les interfaces mobiles.

### Key Entities

- **Page Publique** : Toute route sous `app/(public)/` et son layout.
- **Composant Public** : Tout composant dans `components/features/home/`, `components/features/about/`, `components/ui/`.
- **Breakpoint Mobile** : Largeur ≤ 640px (Tailwind `sm:`).
- **Breakpoint Tablette** : 641-1023px (Tailwind `md:`/`lg:`).
- **Zone de Toucher** : Surface ≥ 44×44px sur les éléments interactifs.

---

## Success Criteria

- **SC-001**: Zéro scroll horizontal sur l'ensemble des 17+ pages publiques sur 375px, 390px et 430px.
- **SC-002**: 100% des zones interactives ont une surface de toucher ≥ 44×44px.
- **SC-003**: Score Lighthouse Mobile > 85/100 sur la page d'accueil, catalogue et fiche produit.
- **SC-004**: Aucune section de contenu n'est masquée sur mobile.
- **SC-005**: `SavoirAfriqueSection` est lisible et compréhensible sur 390px sans zoom ni scroll horizontal.
- **SC-006**: Le tunnel d'achat complet peut être complété de bout en bout sur mobile.
- **SC-007**: LCP page d'accueil mobile < 2,5 secondes sur 4G standard.
- **SC-008**: Aucun bug critique sur Safari iOS 16+ et Chrome Android 110+ sur les 8 pages principales.

---

## Assumptions

- La correction s'applique exclusivement aux pages publiques (`app/(public)/`), pas aux dashboards authentifiés.
- Le système de design (tokens `navy`, `gold`, `background`, `border`, Playfair Display / Poppins) reste identique.
- TailwindCSS est utilisé pour toute la responsivité. Pas de CSS custom inline sans justification.
- Les composants existants sont adaptés (pas remplacés).
- Priorité : pages les plus visitées (accueil, catalogue, fiche produit, checkout) avant les pages éditoriales secondaires.
- Navigateurs cibles : Safari iOS 16+, Chrome Android 110+, Samsung Internet. Navigateurs anciens hors scope.
