# 🎨 Règles de Design et Intégration Visuelle (Lahathèque)

Ce document rassemble les règles de style et d'intégration visuelle obligatoires pour le projet Lahathèque.

---

## 🚫 1. Interdiction des Couleurs Hexadécimales en Dur (Hex Codes)

Il est **strictement interdit** d'utiliser des codes couleur hexadécimaux directement dans les classes CSS ou les composants React/Next.js (ex: `bg-[#1B2A4E]`, `text-[#B08D42]`, `border-[#2E3F66]`).

### Pourquoi ?
* **Évolutivité** : Permet de changer la charte graphique en éditant uniquement les variables CSS dans `app/globals.css` ou `tailwind.config.js`.
* **Mode Sombre** : Permet au site de s'adapter automatiquement au thème clair/sombre grâce aux variables sémantiques.

### Ce qu'il faut faire à la place :
Utiliser exclusivement les classes de variables sémantiques configurées dans notre système de design :
* Pour la couleur Navy principale : `bg-navy`, `text-navy`, `border-navy` (correspond à `#1B2A4E`)
* Pour la couleur Navy sombre : `bg-navy-dark` (correspond à `#0F1A33`)
* Pour la couleur Navy de survol : `bg-navy-hover`, `border-navy-hover` (correspond à `#2E3F66`)
* Pour la couleur Or : `bg-gold`, `text-gold`, `border-gold` (correspond à `#B08D42`)
* Pour l'arrière-plan principal : `bg-background`
* Pour l'arrière-plan secondaire : `bg-background-secondary`
* Pour les bordures globales : `border-border`

---

# 🛠️ Rules — Frontend LAHAThèque

Ces règles sont TOUJOURS actives, sur tout écran/composant/page construit pour LAHAThèque (dashboards, catalogue connecté, lecteur, flux achat/abonnement). Elles s'appliquent même si une tâche ne les mentionne pas explicitement.

## 📐 Périmètre
- On construit uniquement le FRONT (Next.js App Router + TypeScript + Tailwind). Exclus : pages vitrine publiques marketing.
- Zéro appel réseau réel, zéro wiring vers Django. Toutes les données passent par `lib/mock/*.ts` + `lib/services/*.ts` (async, typés sur les modèles Django réels du plan de specs techniques).

## 🎨 Couleurs — règle absolue
- Aucune couleur codée en dur, jamais. Pas de `bg-[#...]`, pas de hex/rgb inline, pas de classe Tailwind de couleur choisie au hasard (`text-red-500` improvisé).
- Utilise uniquement les tokens déjà définis dans `globals.css` (variables CSS / thème Tailwind du projet).
- Si un token manquant est nécessaire (ex: nouveau badge de statut), ajoute-le dans `globals.css` d'abord, puis utilise-le. Ne jamais improviser une couleur en attendant.
- Les statuts de workflow (`pending`, `approved`, `rejected`, `in_review`…) mappent vers des tokens sémantiques existants (succès/attention/erreur/neutre), jamais vers des couleurs Tailwind par défaut.

## ✨ Sobriété Visuelle & Finitions Chic (Règle Absolue)
- **Interdiction des bordures blanches ou des dégradés artificiels par-ci par-là** (ex: `border-white/10`, `bg-gradient-to-r` improvisés sur les cartes et bannières).
- Le design doit rester extrêmement **chic, sobre et élégant** : utiliser des fonds sémantiques purs (`bg-navy`, `bg-background`, `bg-background-secondary`), des bordures subtiles uniques (`border-border`), et réserver les touches de `gold` pour les accents d'emphase nobles.

## 🧩 Composants — 21st.dev avant tout
- Avant de coder un composant UI (carte, table, stepper, drawer, dropzone, badge, form…), cherche-le via les tools MCP `21st`. N'écris jamais un composant générique from scratch sans être passé par cette recherche.
- `search` et `get_inspiration` sont gratuits et illimités — les utiliser librement et largement. `get_component` (code d'un composant) et `generate` (génération IA) sont limités par un quota quotidien — les réserver aux candidats déjà présélectionnés via les métadonnées (nom, description, preview), pas à un usage spéculatif sur chaque résultat.
- **Éviter les composants payants / Premium** : Privilégier les composants gratuits. Si un composant est payant ou nécessite un upgrade, ne pas l'utiliser et chercher une alternative gratuite.
- Si un appel `get_component`/`generate` échoue ou renvoie `locked=true`, appelle `get_usage` pour vérifier le quota restant avant de retenter.
- **Notification de Quotas** : Informer immédiatement et explicitement l'utilisateur dès que le quota de téléchargement de code source de `21st.dev` est épuisé.
- Tout composant importé de `21st.dev` est adapté avant intégration : couleurs remplacées par les tokens `globals.css`, comportement rendu mobile-first, props renommées pour matcher les types TS du projet.
- Si rien de pertinent n'est trouvé après recherche large ou si le quota est épuisé, coder à la main en s'inspirant des métadonnées (nom, description, aperçus) et le mentionner explicitement ("recherche 21st.dev effectuée, quota épuisé ou rien de pertinent, composant codé à la main").

## 📱 Mobile-first — non négociable
- Chaque écran est designé mobile (~375–390px) → tablette → desktop, jamais l'inverse.
- Breakpoints Tailwind : `sm:640 md:768 lg:1024 xl:1280`.
- Zones tactiles ≥ 44px, tables converties en cartes empilées sous `lg`.

## ♻️ Réutilisation
- Avant de réécrire un hook/composant, vérifie l'inventaire de réutilisation LahaAcademia (`useAuth`, `AuthGuard`, `usePdfReaderSecurity`, `useAnnotations`, `TiptapEditor`, `GuideViewer`). Adapter > réécrire.

## 📊 Données & specs
- Chaque champ affiché doit correspondre à un champ réel des modèles Django (plan de specs techniques). Ne jamais inventer un champ.
- Croiser systématiquement le cahier des charges métier (intention/libellés) et le plan technique (modèles/endpoints) — jamais une seule source.
- Statuts de workflow toujours traduits en français humain, jamais affichés en snake_case brut.

## ✍️ UX writing
- Français, ton direct et fonctionnel, jamais de jargon marketing dans un dashboard.
- Boutons 1–3 mots, action-first. Erreurs = quoi/pourquoi/comment corriger. États vides toujours actionnables.

## 💡 Intuitivité & expérience utilisateur (toujours actif)
- Toute action a un feedback immédiat et visible (pas de clic silencieux) : toast, changement d'état visuel, confirmation.
- Toute action destructrice (supprimer, rejeter, révoquer) passe par une modale de confirmation explicite, jamais d'exécution directe au premier clic.
- Reconnaissance plutôt que rappel : les options/actions possibles sont visibles à l'écran, pas à deviner ou à retenir d'un écran précédent.
- Cohérence stricte entre rôles proches : un même type d'action (valider, rejeter, exporter) a toujours le même libellé, la même icône, le même emplacement d'un dashboard à l'autre.
- Icônes seules toujours accompagnées d'un `title`/tooltip — jamais d'icône sans label accessible.
- Formulaires : validation inline au fur et à mesure (pas seulement au submit), messages d'erreur au plus près du champ concerné, focus automatique sur le premier champ en erreur.
- Modales : focus trap, fermeture au `Escape`, focus rendu à l'élément déclencheur à la fermeture.
- Breadcrumb visible sur toute sous-page à plus d'un niveau de profondeur.
- Recherche/filtres : état "aucun résultat" toujours distinct de l'état "chargement" et de l'état "vide par défaut" — trois messages différents, jamais confondus.

## ⏳ Chargement & feedback global (composant unique, réutilisé partout)
- Un seul système de loading est défini une fois (`components/ui/loading/*`) et réutilisé sur tout le dashboard — jamais de spinner réinventé écran par écran.
- Squelettes (skeleton) qui épousent la forme réelle du contenu final (mêmes proportions carte/table/liste) plutôt qu'un spinner générique centré — pour éviter le layout shift à l'arrivée des données.
- Transition de route/page : indicateur de chargement global cohérent (barre de progression en haut ou overlay léger), déclenché automatiquement à chaque navigation, jamais géré à la main écran par écran.
- Upload de fichier : barre de progression réelle (même simulée en mock), jamais un simple spinner sans indication d'avancement.
- Actions asynchrones sur bouton (valider, envoyer) : état de chargement inline sur le bouton lui-même (spinner + désactivation), pas de blocage de toute la page pour une action locale.
- Respecte `prefers-reduced-motion` sur toutes les animations de chargement.

## 🔑 Gestion du quota 21st.dev (protocole obligatoire)

Le quota de téléchargement de code source (`get_component` / `generate`) est limité par clé API. Le protocole suivant est **obligatoire** dès que le quota est épuisé ou proche de l'être.

### Détection du quota
- Appeler `get_usage` avant toute session intensive de recherche 21st.dev.
- Si `get_component` retourne `locked=true` ou si `get_usage` indique `0 remaining` → **NE PAS coder à la main sans avertir l'utilisateur**.

### Protocole copier-coller (quota épuisé)
Quand le quota est épuisé, appliquer **strictement ce protocole pas-à-pas** :

1. **Annoncer clairement** : "Quota 21st.dev épuisé. Je vais vous demander les codes sources un par un."
2. **Identifier la liste complète** des composants à récupérer avant de commencer (ne pas demander au fur et à mesure sans plan).
3. **Demander le premier composant** : fournir l'URL exacte du composant sur 21st.dev et demander d'y copier le code source complet depuis l'onglet "Code".
4. **Attendre** que l'utilisateur colle le code source dans le chat.
5. **Intégrer** ce composant (adaptation tokens, mobile-first, TypeScript) avant de demander le suivant.
6. **Répéter** (étapes 3→5) pour chaque composant suivant, un par un — jamais deux à la fois.
7. Si l'utilisateur change la clé API entre temps : appeler `get_usage` pour vérifier, reprendre avec `get_component` si le quota est rétabli.

### Interdiction
- Ne jamais coder un composant UI générique "à la main" comme alternative silencieuse au quota épuisé sans avoir déclenché ce protocole et l'avoir signalé explicitement à l'utilisateur.
