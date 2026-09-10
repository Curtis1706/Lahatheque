# Checklist des Exigences — Feature 005 : Responsivité Mobile Pages Publiques

## Navigation & Header

- [ ] **CHK001** — Le header mobile affiche logo + icône panier + icône hamburger sur une seule ligne sans débordement sur 375px.
- [ ] **CHK002** — L'icône hamburger déclenche un drawer coulissant (pas un dropdown inline) avec overlay/backdrop.
- [ ] **CHK003** — Le drawer mobile se ferme au clic sur le backdrop, au clic sur X, et à l'appui sur `Escape`.
- [ ] **CHK004** — Les liens du drawer ont une zone de toucher minimale de `py-3 px-5` (>= 44px).
- [ ] **CHK005** — L'icône de recherche est visible sur mobile et déclenche un overlay de recherche plein écran.
- [ ] **CHK006** — La navigation desktop (`hidden lg:flex`) n'est pas visible sur mobile ou tablette < lg.
- [ ] **CHK007** — Aucun scroll horizontal n'est visible dans le header sur 375px.
- [ ] **CHK008** — Le badge panier est visible et correctement positionné sur mobile.

## Page d'Accueil

- [ ] **CHK009** — Le Hero n'affiche pas d'image trop haute sur mobile (max-h adapté < 300px sur 375px).
- [ ] **CHK010** — Les boutons CTA du Hero sont en colonne unique sur mobile et pleine largeur ou auto.
- [ ] **CHK011** — La section Réassurance affiche 2 colonnes sur mobile sans overflow.
- [ ] **CHK012** — Les cartes Nouveautés sont en mode horizontal sur mobile (couverture à gauche + infos à droite).
- [ ] **CHK013** — Le skeleton de chargement des Nouveautés correspond au layout horizontal mobile.
- [ ] **CHK014** — La section SavoirAfriqueSection affiche sa VERSION MOBILE (JSX statique) sur < 768px.
- [ ] **CHK015** — Le SVG animé de SavoirAfriqueSection est masqué (`hidden`) sur < 768px.
- [ ] **CHK016** — Aucun espace blanc excessif n'est visible autour de la SavoirAfriqueSection sur mobile.
- [ ] **CHK017** — La section PanafricanPresenceSection s'adapte en colonne mobile sans débordement.
- [ ] **CHK018** — La section WhyChooseSection s'adapte en colonne mobile sans débordement.
- [ ] **CHK019** — Le PartnerLogoMarquee ne provoque pas de scroll horizontal sur la page.
- [ ] **CHK020** — Les compteurs statistiques (CountingNumber) s'affichent en grille 2×2 sur mobile.

## Catalogue

- [ ] **CHK021** — Le bouton "Filtres" est visible sur mobile (les filtres latéraux sont masqués).
- [ ] **CHK022** — Les filtres s'ouvrent dans un drawer sur mobile (pas une sidebar fixe qui déborde).
- [ ] **CHK023** — La grille catalogue est en `grid-cols-2` sur mobile.
- [ ] **CHK024** — Les cartes du catalogue sont lisibles sur 2 colonnes (titre, auteur, prix visible).
- [ ] **CHK025** — Les boutons panier/favoris sur les cartes ont des zones de toucher >= 44px.

## Fiche Produit

- [ ] **CHK026** — La fiche produit est en colonne unique sur mobile (couverture puis métadonnées).
- [ ] **CHK027** — Le Book3D sur la fiche produit a une hauteur >= 200px sur mobile.
- [ ] **CHK028** — Les onglets (Numérique/Papier/Audio) sont accessibles au toucher (>= 44px).
- [ ] **CHK029** — Le bouton "Ajouter au panier" est sticky en bas de l'écran sur mobile.
- [ ] **CHK030** — La description longue est tronquée avec un bouton "Voir plus" sur mobile.

## Panier & Checkout

- [ ] **CHK031** — Le CartDrawer utilise `h-[100dvh]` et non `h-screen`.
- [ ] **CHK032** — Le bouton "Commander" du CartDrawer est en sticky bottom.
- [ ] **CHK033** — La page panier `/cart` affiche les articles en format adapté mobile.
- [ ] **CHK034** — Les contrôles de quantité `+`/`-` ont des zones de toucher >= 44px.
- [ ] **CHK035** — La page checkout `/checkout` affiche un stepper compact sur mobile.
- [ ] **CHK036** — Le récapitulatif de commande est accessible via accordéon sur mobile.
- [ ] **CHK037** — Le bouton "Confirmer la commande" est sticky en bas sur mobile.

## Pages Éditoriales

- [ ] **CHK038** — La page `/about` s'affiche en colonne unique sans débordement sur 390px.
- [ ] **CHK039** — Le formulaire de `/contact` a des champs pleine largeur et labels au-dessus sur mobile.
- [ ] **CHK040** — La page `/pricing` affiche les grilles tarifaires en colonne unique ou scroll horizontal sur mobile.
- [ ] **CHK041** — La page `/partners` affiche les logos en grille `grid-cols-2` minimum sur mobile.
- [ ] **CHK042** — Les pages légales (`/cgu`, `/cgv`, `/legal`) ont une typographie lisible >= 14px avec padding latéral adapté.

## Composants UI Transversaux

- [ ] **CHK043** — Les modales s'affichent plein écran (ou quasi) sur mobile < 640px.
- [ ] **CHK044** — Les modales ont un contenu scrollable (`overflow-y-auto`) si trop long.
- [ ] **CHK045** — Les toasts/notifications apparaissent en bas de l'écran mobile sans être masqués par la barre système.
- [ ] **CHK046** — Les dropdowns ont des options de hauteur minimale >= 44px.

## Qualité & Standards

- [ ] **CHK047** — Aucun élément interactif ne contient uniquement `:hover` sans `@media (hover: hover)`.
- [ ] **CHK048** — Les éléments plein écran (`hero`, drawers, modales) utilisent `dvh` et non `vh`.
- [ ] **CHK049** — Aucune couleur hexadécimale en dur dans les classes Tailwind des fichiers modifiés.
- [ ] **CHK050** — Aucun emoji dans les interfaces modifiées (uniquement icônes Lucide React).
- [ ] **CHK051** — Zéro scroll horizontal sur 375px, 390px et 430px pour toutes les pages publiques.
- [ ] **CHK052** — Toutes les zones interactives ont une surface de toucher >= 44×44px.
