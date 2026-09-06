# Quickstart: Livres Audio et Lecteur Multi-Rôles

**Feature**: `017-livres-audio-lecteur-multi-roles`
**Date**: 2026-09-07

## Scénarios de Validation End-to-End

### Scénario 1 : Consultation du Catalogue et Extrait Audio (Étudiant non-acheteur)
1. Se connecter avec un compte étudiant (ex: `client_x3@test.bj`).
2. Accéder au catalogue étudiant `/student/catalog`.
3. Vérifier la présence du badge « Livre Audio » sur les ouvrages dotés de pistes audio.
4. Cliquer sur le bouton « Écouter l'extrait » :
   - Le mini-lecteur persistant s'ouvre en bas d'écran ou la vue immersive se déclenche.
   - Le flux HLS se lance avec le titre, les auteurs et la couverture.
   - Un badge doré discret « Extrait gratuit (max 3:00) » est visible.
   - À 3 minutes (180s), la lecture s'interrompt avec une invite proposant d'acheter la version audio.

### Scénario 2 : Achat et Écoute Complète dans « Ma Bibliothèque »
1. Ouvrir la modale de commande sur l'ouvrage audio.
2. Sélectionner le format « Audio » (prix affiché en XOF).
3. Valider la commande via le fournisseur de paiement (mock/CinetPay).
4. Accéder à « Ma Bibliothèque » `/student/library`.
5. Constater la présence des deux boutons sur la carte du livre :
   - Bouton « Lire » (ouvre le lecteur PDF / 3D Flipbook).
   - Bouton « Écouter » (démarre l'écoute complète sans coupure des 3 minutes).
6. Naviguer vers une autre page (ex: `/student/orders`) et vérifier que l'audio continue de jouer dans le mini-lecteur persistant sans interruption.

### Scénario 3 : Accès Libre et Contrôle Qualité (Chef Maquettiste & Admin)
1. Se connecter en tant que Chef Maquettiste ou Administrateur.
2. Accéder à la fiche de validation d'un ouvrage `/chief-layout/validation/[id]` ou au catalogue `/admin/catalog`.
3. Cliquer sur le bouton d'écoute : la piste audio se lance immédiatement sans contrôle d'achat commercial.
4. Dans le formulaire d'édition de l'ouvrage, sélectionner « Remplacer le fichier audio », déposer un nouveau fichier MP3 et soumettre.
5. Vérifier que la nouvelle piste audio remplace l'ancienne, que la durée est actualisée et que la pré-écoute joue le nouveau fichier.
