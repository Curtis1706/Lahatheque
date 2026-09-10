# Plan Technique d'Implémentation — Responsivité Mobile Complète des Pages Publiques & Tunnel d'Authentification

**Branch** : `005-public-pages-mobile-responsiveness`  
**Statut** : Validé  
**Date** : 2026-09-10  

---

## 1. Contexte Technique & Périmètre

### Architecture Cible
- **Frontend** : Next.js 16.3 (Turbopack, App Router, React 19, TypeScript strict, Tailwind CSS).
- **Design System** : Tokens sémantiques exclusifs (`navy`, `navy-dark`, `gold`, `border`, `background`, `background-secondary`), typographie officielle Playfair Display (titres) et Poppins (corps/menus), zéro couleur hexadécimale codée en dur (`bg-[#...]` interdit), zéro émoji (icônes Lucide React exclusives).
- **Backend & BFF** : Django 5.2 REST Framework, client unifié BFF (`app/api/bff/...`), authentification JWT HttpOnly, Redis (cache TTL 2h pour dérivés liseuse), Resend (emails transactionnels avec fallback SMTP Hostinger).

### Modules Clés Impliqués
1. **Layout Public & Navigation** : `app/(public)/layout.tsx` (Drawer mobile coulissant, search overlay, safe areas dvh, header épuré).
2. **Page d'Accueil & Composants Vitrine** : `app/(public)/page.tsx`, `components/features/about/savoir-afrique-section.tsx` (version mobile empilée), `components/features/home/panafrican-presence-section.tsx`, `components/features/home/why-choose-section.tsx`, `components/ui/partner-logo-marquee.tsx`.
3. **Tunnel d'Inscription & Authentification** : `app/(auth)/register/page.tsx` (formulaire multi-step 4 étapes avec OTP), `components/ui/otp-input.tsx` (composant 21st.dev `ruixen.ui/otpinput`), `apps/accounts/views.py`, `apps/accounts/services.py` (validation atomique sans échec au 1er essai, login direct sans OTP).
4. **Catalogue & Fiche Produit** : `app/(public)/catalog/page.tsx` (drawer filtres mobile, grille 2 colonnes), `app/(public)/catalog/[id]/page.tsx` (colonne unique, Book3D >= 200px, CTA sticky).
5. **Panier & Tunnel d'Achat** : `components/cart/cart-drawer.tsx` (`100dvh`, sticky CTA), `app/(public)/cart/page.tsx`, `app/(public)/checkout/page.tsx` (stepper compact mobile, accordéons récapitulatifs).
6. **Liseuse 3D Immersion** : `components/library/FlipBook.tsx` (mode 1 page portrait swipe sur mobile < 768px, fenêtre glissante LRU mémoire 10 pages).

---

## 2. Constitution Check (Conformité aux 12 Principes)

| Principe Constitutionnel | Statut | Justification / Mesures Prises |
|---|---|---|
| **I. Cadrage Métier & Lecture Intégrale** | **CONFORME** | Analyse intégrale des 100% des fichiers concernés, respect strict du cahier des charges. |
| **II. Traque des Non-Dits & Scalabilité** | **CONFORME** | Tolérance de 15 minutes sur les codes OTP, conservation des codes non expirés, fenêtre glissante LRU sur liseuse pour borner la RAM à 30 Mo. |
| **III. Rigueur Backend & Type Hints** | **CONFORME** | Typage PEP 8 complet sur les fonctions d'authentification et les endpoints OTP. |
| **IV. Format de Réponse API Unifié** | **CONFORME** | Format strict `{"success": bool, "data": ..., "error": ...}` respecté sur `/api/v1/accounts/otp/*` et `RegisterView`. |
| **V. Performance ORM & N+1** | **CONFORME** | Clés primaires UUID, transactions atomiques `@transaction.atomic` pour la gestion des OTPs et la création d'utilisateur. |
| **VI. Sécurité Réseau & HttpOnly** | **CONFORME** | Tokens JWT sécurisés dans des cookies HttpOnly, CORS restreint. |
| **VII. Protection DRM & Streaming** | **CONFORME** | Streaming fragmenté par Range Requests, désactivation de l'impression et du téléchargement direct. |
| **VIII. Tokens Sémantiques & Finitions Chic** | **CONFORME** | Zéro code hexadécimal en dur. Utilisation exclusive des tokens `navy`, `gold`, `border`, `background`. Typographie Playfair/Poppins. |
| **IX. Code Commenté & Documenté** | **CONFORME** | Docstrings détaillées et commentaires explicatifs sur tous les fichiers modifiés. |
| **X. Interdiction Absolue de Tout Émoji** | **CONFORME** | Zéro émoji dans le code, les templates d'email, les vues, les dashboards et la documentation. Icônes Lucide React exclusives. |
| **XI. Traçabilité & Observabilité** | **CONFORME** | Télémétrie et logs détaillés côté backend (`[REGISTER REQUEST RECEIVED]`, `[REGISTER SUCCESS]`) et frontend console logs. |
| **XII. Workflow d'Écran & Zéro Mock** | **CONFORME** | Composants issus de 21st.dev adaptés, 100% de données réelles connectées aux endpoints Django via BFF. |

---

## 3. Plan des Phases d'Exécution

### Phase 0 : Recherche & Décisions d'Architecture (`research.md`)
- Résolution complète des problématiques de synchronisation mémoire FlipBook, durée de vie du cache Redis (2h TTL), architecture du stepper multi-step et de l'OTP resilient.

### Phase 1 : Modèle de Données & Contrats d'Interface (`data-model.md`, `contracts/`, `quickstart.md`)
- Spécification des entités `User`, `OTP`, `Ouvrage`, `Order` et de leurs états respectifs.
- Définition des contrats d'interface pour l'API OTP, l'inscription, et les composants d'interface mobile.
- Guide de validation et scénarios d'acceptation de bout en bout.

### Phase 2 : Consolidation & Découpage en Tâches (`tasks.md`)
- Ordonnancement séquentiel des tâches d'intégration mobile et validation par la checklist des exigences (52 critères).
