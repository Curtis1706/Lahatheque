# Tasks — Responsivité Mobile Complète des Pages Publiques

**Feature**: `005-public-pages-mobile-responsiveness`

**Total Phases**: 6 (A → F)

---

## Phase A — Infrastructure & Layout Racine

### TASK-A01 — Drawer de navigation mobile
**Fichier**: `app/(public)/layout.tsx`
**Priorité**: P1 — BLOQUANT (toutes les pages)
**Description**: Remplacer le menu mobile dropdown inline (`mobileMenuOpen && (...)`) par un vrai drawer coulissant depuis la droite.
- État : `mobileMenuOpen` → renommer en `isDrawerOpen`
- Structure : `<div className="fixed inset-0 z-[60] lg:hidden">` contenant :
  - Backdrop semi-transparent (`bg-black/30`) fermant le drawer au clic
  - Panel coulissant depuis la droite (`w-72 h-full fixed right-0 top-0 bg-background shadow-xl`)
  - Header du drawer : bouton fermeture (`X`) en haut à droite
  - Liens de navigation avec zones de toucher `py-3 px-6 text-sm font-medium border-b border-border/50`
  - Lien "Se connecter" avec séparateur visuel en bas
- Fermeture au `Escape` via `useEffect` sur `keydown`
- Animation : `transition-transform translate-x-full` → `translate-x-0`
- Blocage du scroll du body quand le drawer est ouvert (`overflow-hidden` sur `document.body`)

### TASK-A02 — Overlay de recherche mobile
**Fichier**: `app/(public)/layout.tsx`
**Priorité**: P1
**Description**: Ajouter un état `isSearchOpen` et un overlay de recherche plein écran.
- Icône `Search` visible sur mobile (`flex lg:hidden`) dans le header, à gauche du panier
- Overlay : `fixed inset-0 z-[70] bg-background flex flex-col p-4`
- Header overlay : bouton fermeture (`X`) + label "Rechercher"
- Corps : `<HeaderSearchBar />` avec `autoFocus` et pleine largeur
- Fermeture : bouton X + `Escape`

### TASK-A03 — Overflow-x guard sur le layout racine
**Fichier**: `app/(public)/layout.tsx`
**Priorité**: P1
**Description**: Ajouter `overflow-x-hidden` sur le `div` racine du layout (ligne 77) pour éliminer les scrollbars horizontales parasites. Tester que les modales `position: fixed` ne sont pas affectées.
- Avant : `<div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-200">`
- Après : `<div className="min-h-screen bg-background text-foreground flex flex-col font-sans transition-colors duration-200 overflow-x-hidden">`

### TASK-A04 — Zones de toucher & hover guards header
**Fichier**: `app/(public)/layout.tsx`
**Priorité**: P2
**Description**:
- Panier : `className="relative p-3 text-foreground ..."` (zone `p-3` = 44px avec l'icône)
- Hamburger : `className="lg:hidden p-3 text-foreground ..."` 
- Logo : garder `w-28 md:w-36` pour ne pas déborder
- Liens nav desktop : remplacer `hover:text-gold` par `[@media(hover:hover)]:hover:text-gold`

---

## Phase B — Page d'Accueil & Composants

### TASK-B01 — Hero section mobile
**Fichier**: `app/(public)/page.tsx`
**Priorité**: P1
**Description**: Ajuster l'image hero pour ne pas occuper trop d'espace sur mobile.
- Image : `max-h-[220px] sm:max-h-[320px] md:max-h-[440px] lg:max-h-[520px] xl:max-h-[620px]`
- Section hero : réduire `py-16` en `py-8 sm:py-12 lg:py-16` pour que le contenu ne soit pas trop long à scroller
- Texte hero : vérifier que `text-3xl sm:text-4xl lg:text-5xl xl:text-6xl` est bien lisible sur 375px
- Boutons CTA : déjà en `flex-col sm:flex-row` — vérifier largeur minimale sur mobile

### TASK-B02 — Grille Nouveautés en mode horizontal mobile
**Fichier**: `app/(public)/page.tsx`
**Priorité**: P1
**Description**: Transformer les cartes de livre en mode `flex-row` sur mobile pour économiser l'espace vertical.
- Structure actuelle : grille `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6` de cartes portrait
- Nouvelle structure mobile : 
  - Sur mobile (< sm) : liste verticale de cartes horizontales `flex flex-row gap-3 h-28` avec couverture fixe à gauche (~80px) et infos à droite
  - Sur sm+ : retour à la grille portrait `sm:grid sm:grid-cols-2 md:grid-cols-3`
  - Sur xl : `xl:grid-cols-3` (réduire de 6 à 3 pour des cartes plus larges et lisibles)
- Book3D dans les cartes horizontales mobiles : `width={{ sm: 70, md: 85, lg: 100, xl: 100 }}`
- Supprimer `aspect-[2/3]` sur la zone couverture en mode mobile horizontal

### TASK-B03 — Squelette de chargement adapté
**Fichier**: `app/(public)/page.tsx`
**Priorité**: P2
**Description**: Adapter le skeleton de chargement pour correspondre au nouveau layout mobile horizontal.
- Mobile : skeletons horizontaux (`flex flex-row h-28 gap-3`)
- sm+ : skeletons en grille portrait existants

### TASK-B04 — Savoir Afrique Section — Version mobile statique
**Fichier**: `components/features/about/savoir-afrique-section.tsx`
**Priorité**: P1 — CRITIQUE
**Description**: Ajouter une version mobile statique du diagramme panafricain.
- Wrapper existant : ajouter `hidden md:block` au `<figure>` du SVG animé (lignes 306-600+)
- Créer `<MobileSavoirAfriqueView />` : composant inline `block md:hidden`
  - Titre : "Un réseau mondial de savoir"
  - Centre : carte LAHAThèque avec icône `BookOpen` et badge "Afrique"
  - Liste des 6 régions partenaires avec `Globe` icon + label + flèche `ArrowRight` vers le centre
  - Layout : grille `grid-cols-1 sm:grid-cols-2 gap-3`
  - Style : `bg-background-secondary rounded-2xl border border-border p-5`
  - Tokens uniquement : `text-navy`, `text-gold`, `bg-background`, `border-border`
- Supprimer `minHeight: "360px"` du wrapper SVG (ligne 314)
- Laisser `paddingBottom: "43.75%"` pour maintenir le ratio sur desktop

### TASK-B05 — PanAfricanPresenceSection mobile
**Fichier**: `components/features/home/panafrican-presence-section.tsx`
**Priorité**: P1
**Description**: Audit complet et correction des breakpoints.
- Lire intégralement le fichier
- Identifier tous les `grid-cols-*` sans breakpoints mobiles
- Corriger pour mobile-first

### TASK-B06 — WhyChooseSection mobile
**Fichier**: `components/features/home/why-choose-section.tsx`
**Priorité**: P1
**Description**: Audit complet et correction des breakpoints.
- Lire intégralement le fichier
- Identifier tous les éléments sans adaptation mobile
- Corriger pour mobile-first, zones de toucher, overflow

### TASK-B07 — AnimatedGoldenTree mobile
**Fichier**: `components/features/home/animated-golden-tree.tsx`
**Priorité**: P2
**Description**: Si ce composant est rendu visible sur la page d'accueil, vérifier qu'il ne cause pas de débordement sur mobile. Audit du sizing et containment.

---

## Phase C — Composants UI Transversaux

### TASK-C01 — CartDrawer hauteur dvh et CTA sticky
**Fichier**: `components/cart/cart-drawer.tsx` (à localiser exactement)
**Priorité**: P1
**Description**:
- Remplacer `h-screen` / `h-[100vh]` par `h-[100dvh]`
- Bouton "Commander" / "Passer la commande" : `sticky bottom-0 bg-background border-t border-border p-4`
- Zone scrollable du drawer : `overflow-y-auto flex-1`

### TASK-C02 — PartnerLogoMarquee overflow guard
**Fichier**: `components/ui/partner-logo-marquee.tsx`
**Priorité**: P1
**Description**:
- Vérifier que le conteneur parent du marquee a `overflow-x: hidden`
- Vérifier que la largeur du marquee ne force pas un scroll de page
- Tester sur mobile (390px)

### TASK-C03 — Modales plein écran mobile
**Fichiers**: `components/ui/contact-support-dialog.tsx` + autres dialogs
**Priorité**: P2
**Description**:
- Identifier tous les composants Dialog/Modal dans `components/ui/`
- Ajouter `sm:max-w-[90vw] sm:rounded-2xl max-w-full rounded-none` pour couvrir plein écran sur mobile
- Ajouter `max-h-[100dvh] overflow-y-auto` pour scroll interne
- Bouton de fermeture accessible en haut à droite

---

## Phase D — Catalogue & Fiche Produit

### TASK-D01 — Catalogue — Filtres en drawer mobile
**Fichier**: `app/(public)/catalog/page.tsx` (ou layout catalog)
**Priorité**: P1
**Description**:
- Lire intégralement le fichier catalog pour identifier la structure actuelle des filtres
- Filtres latéraux : `hidden lg:block` sur desktop, bouton "Filtres" sur mobile
- Bouton flottant "Filtres (N)" sur mobile avec count des filtres actifs
- Drawer : coulissant depuis la gauche, plein écran mobile, avec bouton "Appliquer" en sticky bottom
- Grille catalogue : adapter en `grid-cols-2 md:grid-cols-3 lg:grid-cols-4`

### TASK-D02 — Catalogue — Cartes livres responsive
**Fichier**: `app/(public)/catalog/page.tsx`
**Priorité**: P1
**Description**:
- Cartes en `grid-cols-2` sur mobile : couverture petite, titre tronqué 1 ligne, prix lisible
- Book3D dans les cartes catalogue : adapter sizing pour grille 2 colonnes mobile
- Zones de toucher des boutons panier/favoris >= 44px

### TASK-D03 — Fiche Produit — Layout colonne mobile
**Fichier**: `app/(public)/catalog/[id]/page.tsx`
**Priorité**: P1
**Description**:
- Lire intégralement la fiche produit
- Sur mobile : `flex-col` avec Book3D centré en haut (height >= 240px), puis métadonnées, onglets, prix
- Book3D : `width={{ sm: 140, md: 160, lg: 180, xl: 200 }}` (ou équivalent) en mode fiche
- Bouton "Ajouter au panier" : `fixed bottom-0 left-0 right-0 z-30 p-4 bg-background border-t border-border` sur mobile uniquement

### TASK-D04 — Fiche Produit — Onglets formats accessibles
**Fichier**: `app/(public)/catalog/[id]/page.tsx`
**Priorité**: P2
**Description**:
- Onglets Numérique/Papier/Audio : zones de toucher >= 44px sur mobile
- Si les onglets débordent sur mobile, utiliser un scroll horizontal (`overflow-x-auto`) ou une liste déroulante

---

## Phase E — Pages Éditoriales

### TASK-E01 — Page About (/about)
**Fichier**: `app/(public)/about/page.tsx`
**Priorité**: P2
**Description**: Lire intégralement. Corriger les grilles de l'équipe, les sections mission/stats. Colonne unique sur mobile.

### TASK-E02 — Page Contact (/contact)
**Fichier**: `app/(public)/contact/page.tsx`
**Priorité**: P1 (formulaire = action)
**Description**: Lire intégralement. Formulaire pleine largeur. Labels au-dessus des champs. Bouton submit pleine largeur sur mobile. Auto-scroll vers champ en erreur.

### TASK-E03 — Page Pricing (/pricing)
**Fichier**: `app/(public)/pricing/page.tsx`
**Priorité**: P1 (conversion)
**Description**: Lire intégralement. Grilles de prix en colonne unique ou scroll horizontal. Cartes prix suffisamment larges sur mobile (>= 280px chacune).

### TASK-E04 — Page Partners (/partners)
**Fichier**: `app/(public)/partners/page.tsx`
**Priorité**: P2
**Description**: Lire intégralement. Grille logos partenaires en `grid-cols-2 sm:grid-cols-3 md:grid-cols-4`. Formulaire de partenariat adapté mobile.

### TASK-E05 — Page Universities (/universities)
**Fichier**: `app/(public)/universities/page.tsx`
**Priorité**: P2
**Description**: Lire intégralement. Grilles et cartes d'universités adaptées mobile.

### TASK-E06 — Page Prestations (/prestations)
**Fichier**: `app/(public)/prestations/page.tsx`
**Priorité**: P2
**Description**: Lire intégralement. Sections de services en colonne unique sur mobile.

### TASK-E07 — Pages Légales (cgu, cgv, legal)
**Fichiers**: `app/(public)/cgu/page.tsx`, `app/(public)/cgv/page.tsx`, `app/(public)/legal/page.tsx`
**Priorité**: P2
**Description**: Vérifier typographie lisible (>= 14px), padding latéral suffisant (`px-4 sm:px-6`), liens de navigation interne accessibles.

### TASK-E08 — Pages Authors, Guide, Subscriptions
**Fichiers**: `app/(public)/authors/page.tsx`, `app/(public)/guide/page.tsx`, `app/(public)/subscriptions/page.tsx`
**Priorité**: P2
**Description**: Audit et corrections mobiles ciblées.

---

## Phase F — Checkout & Panier

### TASK-F01 — Page Panier (/cart)
**Fichier**: `app/(public)/cart/page.tsx`
**Priorité**: P1
**Description**:
- Lire intégralement.
- Lignes d'articles : `flex flex-row gap-3` avec couverture petite (50px) + infos + contrôles
- Contrôles quantité `+`/`-` : `w-11 h-11` minimum (zones > 44px)
- Bouton "Commander" : pleine largeur sur mobile, sticky en bas si scroll
- Récapitulatif de commande : en bas de page sur mobile (pas en sidebar)

### TASK-F02 — Page Checkout (/checkout)
**Fichier**: `app/(public)/checkout/page.tsx`
**Priorité**: P1
**Description**:
- Lire intégralement.
- Stepper : sur mobile, afficher uniquement le numéro d'étape et un label court (`1. Infos`, `2. Livraison`, `3. Paiement`)
- Sections de formulaire : en accordéon sur mobile, avec expansion au tap
- Récapitulatif de commande : accordéon collapsé par défaut sur mobile, avec total visible dans le header de l'accordéon
- Bouton "Confirmer" : sticky en `fixed bottom-0` sur mobile pendant le checkout

---

## Vérification Finale

### TASK-V01 — Tests visuels systématiques
**Priorité**: P1
**Description**: Pour chaque page de la liste, capturer/vérifier sur 375px, 390px, 430px, 768px :
- [ ] `/` — Page d'accueil
- [ ] `/about` — À propos
- [ ] `/catalog` — Catalogue
- [ ] `/catalog/[id]` — Fiche produit (avec un livre réel)
- [ ] `/cart` — Panier
- [ ] `/checkout` — Checkout
- [ ] `/contact` — Contact
- [ ] `/pricing` — Tarification
- [ ] `/partners` — Partenaires
- [ ] `/universities` — Universités

### TASK-V02 — Test tunnel d'achat complet sur mobile
**Priorité**: P1
**Description**: Exécuter le flux complet : page d'accueil → catalogue → fiche produit → ajout au panier → CartDrawer → `/cart` → `/checkout`. Vérifier l'absence de blocage ou d'overflow.

### TASK-V03 — Lighthouse Mobile
**Priorité**: P2
**Description**: Lancer Lighthouse Mobile sur `/`, `/catalog`, `/catalog/[id]`. Objectif > 85/100 Performance + Accessibilité.
