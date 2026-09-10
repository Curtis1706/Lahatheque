# Plan Technique — Responsivité Mobile Complète des Pages Publiques

## Contexte

L'audit du code source révèle les principaux goulots d'étranglement de responsivité mobile :

1. **`SavoirAfriqueSection`** (690 lignes) : Diagramme SVG animé 1600×700 mis à l'échelle via `transform: scale()`. Sur mobile, le conteneur a un `paddingBottom: "43.75%"` et un `minHeight: "360px"` qui produit un espace blanc excessif. Le SVG ne peut pas être rendu lisible sous 600px de large — une version mobile alternative est obligatoire.
2. **Grille Nouveautés** : `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6`. La grille passe de 3 à 6 colonnes sans breakpoint intermédiaire, et sur mobile les cartes `aspect-[2/3]` créent un scroll vertical très long.
3. **Mobile menu** : Un dropdown inline existe (`lg:hidden`), mais manque de polish UX (pas de backdrop, pas de fermeture au clic externe, liens trop compacts, zones de toucher < 44px).
4. **`Book3D`** : Tailles fixes `{ sm: 110, md: 115, lg: 120, xl: 112 }` — trop petites pour un affichage mobile en colonne unique.
5. **Pages éditoriales** : Non auditées — nécessitent un scan systématique.
6. **`100vh`** : Utilisé sans fallback `dvh` dans le hero et certaines modales.

---

## Architecture de la Solution

### Phase A — Infrastructure & Layout Racine

**`app/(public)/layout.tsx`**
- Transformer le menu mobile inline en drawer coulissant depuis la droite (overlay + backdrop + fermeture au clic externe + `Escape`).
- Ajouter `overflow-x: hidden` au `div` racine du layout (pas sur `body`) pour éliminer le scroll horizontal parasite sans casser les modales `position: fixed`.
- Ajouter la barre de recherche mobile en overlay plein-écran déclenché par l'icône `Search`.
- Corriger les zones de toucher du header mobile : panier (`p-3`), hamburger (`p-3`), logo (`w-28`).
- Appliquer `@media (hover: hover)` aux effets de survol des liens nav via Tailwind `[@media(hover:hover)]:hover:text-gold`.

### Phase B — Page d'Accueil + Composants Home

**`app/(public)/page.tsx`**
- **Hero** : Sur mobile, image hero avec `max-h-[260px]` (au lieu de `380px`), texte et CTA en colonne unique centrée.
- **Grille Nouveautés** : Changer `xl:grid-cols-6` en `xl:grid-cols-3`. Sur mobile, cartes en mode `flex-row` horizontal : couverture fixe à gauche (~100px), infos à droite — économise 40% d'espace vertical.
- **Compteurs** : Vérifier et adapter en `grid-cols-2 sm:grid-cols-4`.

**`components/features/about/savoir-afrique-section.tsx`**
- Ajouter détection mobile via classes CSS `hidden md:block` / `block md:hidden`.
- **Version mobile** (< 768px) : Composant JSX statique — liste des 6 régions avec icônes Lucide `Globe` et texte descriptif, sans SVG ni animation.
- **Version desktop** (>= 768px) : SVG animé existant intact.
- Supprimer `minHeight: "360px"` du wrapper du SVG animé pour éviter l'espace blanc sur les écrans intermédiaires.

**`components/features/home/panafrican-presence-section.tsx`**
- Audit et correction des breakpoints de la grille de pays.

**`components/features/home/why-choose-section.tsx`**
- Audit et correction pour mobile.

### Phase C — Composants UI Transversaux

**`components/cart/cart-drawer.tsx`**
- Utiliser `h-[100dvh]` au lieu de `h-screen`.
- CTA "Commander" en `sticky bottom-0` à l'intérieur du drawer.

**`components/ui/partner-logo-marquee.tsx`**
- S'assurer que le wrapper utilise `overflow: hidden` sans causer de scroll de page.

**Modales / Dialogs** (`components/ui/contact-support-dialog.tsx`, etc.)
- Ajouter `max-h-[100dvh] overflow-y-auto`.
- Sur mobile (< 640px) : modale en `w-full rounded-b-none` (bottom sheet) ou plein écran.

### Phase D — Catalogue & Fiche Produit

**`app/(public)/catalog/page.tsx`**
- Filtres latéraux : drawer coulissant sur mobile, sidebar fixe sur desktop.
- Grille catalogue : `grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4`.

**`app/(public)/catalog/[id]/page.tsx`**
- Layout colonne unique sur mobile : couverture, métadonnées, onglets, prix, CTA.
- `Book3D` centré, hauteur >= 200px.
- Bouton CTA sticky en `fixed bottom-0 left-0 right-0` sur mobile.

### Phase E — Pages Éditoriales

Pages : `/about`, `/contact`, `/pricing`, `/partners`, `/universities`, `/prestations`, `/subscriptions`, `/cgu`, `/cgv`, `/legal`, `/authors`, `/guide`.
- Scan rapide de chaque `page.tsx`.
- Corrections ciblées : grilles de tarification, formulaires de contact, grilles de logos.

### Phase F — Checkout & Panier

**`app/(public)/cart/page.tsx`**
- Lignes d'articles : format adapté vertical sur mobile.
- Contrôles quantité : zones de toucher >= 44px.

**`app/(public)/checkout/page.tsx`**
- Stepper compact mobile (numéros uniquement sur mobile).
- Récapitulatif de commande en accordéon sur mobile.

---

## Décisions Techniques

| Décision | Choix | Justification |
|---|---|---|
| Version mobile SavoirAfriqueSection | Composant JSX statique `hidden md:block` | Évite le SVG animé sur mobile, perf ++, accessibilité ++ |
| `vh` → `dvh` | Systématique sur hero, drawers, modales | Corrige le positionnement avec la barre d'adresse Safari/Chrome mobile |
| Drawer mobile header | Overlay coulissant depuis la droite | Convention UI mobile moderne ; le bas de l'écran est réservé aux actions |
| Grille Nouveautés mobile | Cartes en `flex-row` horizontal | Économise 40% d'espace vertical vs. cartes portrait en colonne unique |
| `@media(hover:hover)` | Classes Tailwind `[@media(hover:hover)]:hover:` | Syntaxe native Tailwind, sans CSS custom, sans JS |
| `overflow-x: hidden` | Sur le `div` racine du layout | Évite de casser les dropdowns/modales `position: fixed` |

---

## Ordre d'Exécution

Phase A → Phase B → Phase C → Phase D → Phase E → Phase F

Phases D, E, F peuvent être parallélisées une fois B et C terminées.

---

## Fichiers Modifiés

### [MODIFY] app/(public)/layout.tsx
Header drawer mobile, `overflow-x`, hover guards.

### [MODIFY] app/(public)/page.tsx
Hero, grille Nouveautés mode horizontal mobile, Book3D sizing.

### [MODIFY] components/features/about/savoir-afrique-section.tsx
Version mobile statique JSX, suppression `minHeight` problématique.

### [MODIFY] components/features/home/panafrican-presence-section.tsx
Breakpoints grille.

### [MODIFY] components/features/home/why-choose-section.tsx
Breakpoints mobile.

### [MODIFY] components/cart/cart-drawer.tsx
`dvh`, CTA sticky.

### [MODIFY] components/ui/partner-logo-marquee.tsx
Wrapper overflow guard.

### [MODIFY] components/ui/contact-support-dialog.tsx
Plein écran mobile.

### [MODIFY] app/(public)/catalog/page.tsx
Filtres drawer, grille adaptée.

### [MODIFY] app/(public)/catalog/[id]/page.tsx
Layout colonne, Book3D, CTA sticky.

### [MODIFY] app/(public)/checkout/page.tsx
Stepper compact, accordéons.

### [MODIFY] app/(public)/cart/page.tsx
Contrôles quantité, layout article.

### [MODIFY] Pages éditoriales (about, contact, pricing, partners, universities, prestations, subscriptions, cgu, cgv, legal, authors, guide)
Corrections ciblées post-audit.

---

## Plan de Vérification

- Vérification visuelle sur Chrome DevTools (375px, 390px, 430px, 768px) pour chaque page.
- Test Lighthouse Mobile sur `/`, `/catalog`, `/catalog/[id]`.
- Test fonctionnel : tunnel achat complet sur mobile.
- Vérification Safari iOS : `dvh`, safe areas, hover states.
