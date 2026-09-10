# Guide de Validation Rapide — Feature 005 : Responsivité Mobile & Inscription OTP

Ce guide décrit les scénarios de test exécutables pour valider de bout en bout les fonctionnalités de la Feature 005.

---

## Scénario 1 : Navigation Mobile & Header Épuré (Viewport 375px)

### Objectif
Vérifier l'absence de scroll horizontal, l'ergonomie du tiroir de navigation et des zones tactiles >= 44px.

### Procédure de Test
1. Ouvrir Chrome DevTools en émulation mobile (iPhone SE 375×667 ou iPhone 14 390×844).
2. Naviguer sur `http://localhost:3000/`.
3. Vérifier que la barre de navigation affiche uniquement : le logo, l'icône panier avec badge, et l'icône hamburger.
4. Cliquer sur l'icône hamburger : le Drawer doit s'ouvrir de façon fluide depuis la droite avec un fond semi-transparent.
5. Tester la fermeture au clic sur le fond flouté, sur le bouton `X`, ou via la touche `Escape`.
6. Vérifier qu'aucun défilement horizontal de page (`document.documentElement.scrollWidth > window.innerWidth`) n'apparaît.

---

## Scénario 2 : Inscription Multi-Step & Validation OTP Résiliente

### Objectif
Vérifier le parcours 4 étapes, l'envoi de l'OTP, le composant de saisie 21st.dev et l'auto-connexion directe sans passage par `/login`.

### Procédure de Test
1. Ouvrir `http://localhost:3000/register`.
2. **Étape 1 (Profil)** : Sélectionner "Lecteur" ou "Auteur", téléverser ou ignorer la photo, cliquer sur "Continuer".
3. **Étape 2 (Identité)** : Saisir Prénom, Nom et Téléphone.
4. **Étape 3 (Sécurité)** : Saisir Email et Mot de passe (>= 8 caractères), cliquer sur "Créer mon compte".
5. **Étape 4 (Vérification OTP)** :
   - L'écran affiche les 6 slots interactifs du composant 21st.dev.
   - Saisir ou coller un code reçu. Les cases avancent automatiquement et le retour arrière permet de corriger.
   - Dès la saisie du 6ème chiffre, la validation se déclenche automatiquement.
   - La validation réussit au premier essai.
   - L'utilisateur est automatiquement connecté et redirigé vers son espace dédié (`/student` ou `/author`).

---

## Scénario 3 : Connexion Directe sans OTP (`/login`)

### Objectif
Garantir que la connexion classique ne demande jamais d'OTP, ni pour les nouveaux ni pour les anciens comptes.

### Procédure de Test
1. Ouvrir `http://localhost:3000/login`.
2. Saisir les identifiants d'un utilisateur existant ou nouvellement créé.
3. Cliquer sur "Se connecter".
4. **Résultat attendu** : Connexion immédiate avec stockage des tokens JWT dans les cookies sécurisés, sans aucune étape ou invite OTP, et redirection vers le dashboard.

---

## Scénario 4 : Liseuse 3D FlipBook sur Mobile (< 768px)

### Objectif
Vérifier que la liseuse bascule en mode 1 page portrait avec gestuelle tactile swipe et libération mémoire LRU.

### Procédure de Test
1. Ouvrir un livre en mode lecture sur mobile.
2. Vérifier que la liseuse affiche une seule page plein écran portrait, parfaitement lisible.
3. Tourner plusieurs pages : l'empreinte mémoire reste plafonnée sous 30 Mo grâce au cache glissant LRU de 10 pages (`URL.revokeObjectURL`).
