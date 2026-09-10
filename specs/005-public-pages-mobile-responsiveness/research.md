# Rapport de Recherche Technique — Feature 005 : Responsivité Mobile & Tunnel d'Authentification

## Décision 1 : Navigation Mobile & Header (Drawer Coulissant)
- **Décision** : Implémentation d'un tiroir latéral coulissant (Drawer) depuis la droite avec fond semi-transparent flouté (`backdrop-blur-sm`), fermeture par clic extérieur, bouton de fermeture `X` et touche `Escape`.
- **Raison** : Conforme aux standards UX mobiles des grandes plateformes. Préserve la lisibilité immédiate, permet d'accueillir l'arborescence complète sans surcharger le header fixe et évite tout débordement horizontal.
- **Alternatives évaluées** :
  - *Menu accordéon déroulant inline* : rejeté car il pousse le contenu principal vers le bas de manière saccadée et crée des hauteurs d'écran instables.
  - *Modale plein écran* : rejetée car trop intrusive pour une navigation rapide entre sections.

---

## Décision 2 : Composant SavoirAfriqueSection sur Smartphone (< 768px)
- **Décision** : Remplacement du diagramme SVG interactif 1600×700 par une version JSX empilée verticalement avec cartes épurées et icônes vectorielles Lucide React.
- **Raison** : Le SVG initial est conçu pour les écrans larges (> 1024px). Sur un écran de 375px à 430px, le ratio `transform: scale()` rend les textes illisibles (< 8px) et crée un espace blanc vertical parasite de plus de 300px.
- **Alternatives évaluées** :
  - *Défilement horizontal (pan/zoom)* : rejeté car enfreint l'exigence constitutionnelle de zéro scroll horizontal sur mobile.
  - *Masquage pur et simple* : rejeté car le contenu narratif et symbolique du projet doit rester accessible à 100% des utilisateurs.

---

## Décision 3 : Tunnel d'Inscription Multi-Step (4 Étapes)
- **Décision** : Découpage du formulaire en 4 étapes séquentielles : (1) Profil Lecteur/Auteur & Avatar optionnel → (2) Identité & Téléphone → (3) Email & Mot de passe → (4) Vérification OTP par e-mail ou SMS.
- **Raison** : Réduit considérablement la charge cognitive de l'utilisateur sur petit écran, diminue les abandons de formulaire et offre un retour visuel pas-à-pas avec indicateur de progression.
- **Alternatives évaluées** :
  - *Formulaire long monolithique à une page* : rejeté car l'empilement de plus de 8 champs sur mobile nécessite un défilement fastidieux et masque les erreurs de validation hors champ.

---

## Décision 4 : Résilience OTP et Éradication de l'Échec au Premier Essai
- **Décision** :
  1. Prolongation de la durée de validité à 15 minutes.
  2. Conservation active de tous les codes générés récents lors d'un renvoi (ne pas supprimer brutalement le premier code).
  3. Dès qu'un code valide est renseigné, consommation atomique de l'ensemble des OTPs de l'utilisateur (`is_verified = True`).
  4. Normalisation stricte de l'identifiant (suppression des espaces, mise en minuscule pour l'email, nettoyage des caractères de mise en forme pour le téléphone).
- **Raison** : Élimine la cause majeure d'échec dans les applications réelles : le décalage de livraison de l'email où l'utilisateur clique sur "Renvoyer" avant de recevoir le premier email, invalidant le code qu'il reçoit quelques secondes plus tard.
- **Alternatives évaluées** :
  - *Remplacement destructif immédiat (`delete()`)* : rejeté car source d'échecs fréquents et de frustration utilisateur.
  - *OTP sans expiration* : rejeté pour des raisons évidentes de sécurité.

---

## Décision 5 : Exemption Stricte d'OTP pour la Connexion (`/login`)
- **Décision** : La connexion reste strictement directe via mot de passe et génération de tokens JWT, sans demande d'OTP. L'OTP est réservé à la création de compte.
- **Raison** : Conforme aux exigences explicites du projet et aux pratiques de marché pour les bibliothèques et plateformes de lecture, où l'utilisateur connecté doit pouvoir accéder immédiatement à ses livres.
- **Alternatives évaluées** :
  - *MFA/OTP à chaque connexion* : rejeté car jugé trop lourd pour un usage quotidien de lecture et expressément refusé par la direction produit.

---

## Décision 6 : Gestion Mémoire de la Liseuse 3D FlipBook (LRU 10 Pages)
- **Décision** : Implémentation d'une fenêtre glissante LRU (Least Recently Used) bornée à 10 pages en mémoire vive navigateur. Dès qu'une page s'éloigne de ±5 pages de la position de lecture, sa mémoire Blob est explicitement libérée avec `URL.revokeObjectURL()`.
- **Raison** : Les ouvrages LAHAThèque comportent fréquemment entre 100 et 800 pages. Charger tous les canvas/images en mémoire provoquerait un crash navigateur (Out-Of-Memory) sur smartphone. Cette stratégie borne l'empreinte mémoire sous 30 Mo.
- **Alternatives évaluées** :
  - *Rendu à la volée sans aucun cache client* : rejeté car provoque des saccades lors du feuilletage arrière.
  - *Cache mémoire illimité* : rejeté en raison des risques de crash mobile.

---

## Décision 7 : Durée de Rétention (TTL) du Cache Redis Serveur
- **Décision** : Attribution d'un TTL de 2 heures (7200 secondes) pour les pages filigranées dérivées stockées dans Redis.
- **Raison** : Permet une lecture fluide et instantanée tout au long d'une session de lecture type sans risquer de saturer la mémoire vive du serveur Redis sur le long terme.
- **Alternatives évaluées** :
  - *Persistance indéfinie* : rejetée car la base Redis finirait par saturer avec des milliers d'ouvrages.
  - *Pas de cache Redis (recalcul à chaque requête de page)* : rejeté car surcharge considérablement le processeur du backend lors du streaming simultané de plusieurs utilisateurs.
