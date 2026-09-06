# 🎧 Guide d'Intégration et d'Exploitation : Livres Audio & Lecteur Multi-Rôles (LAHAThèque)

Ce document récapitule l'architecture, les fonctionnalités et les modes d'utilisation du système de livres audio et du lecteur multi-rôles déployé sur LAHAThèque.

---

## 🏛️ 1. Architecture & Principes Directeurs

- **Formats de Streaming** : Flux HLS signé (`.m3u8`) hébergé sur Cloudflare Stream sécurisé avec token temporaire et anti-téléchargement direct.
- **Zéro Émoji & Zéro Hexadécimal en Dur** : Exclusivement les tokens de design `globals.css` (`bg-navy`, `bg-gold`, `text-gold`, `border-border`, etc.) et icônes vectorielles `lucide-react`.
- **Typographie Officielle** :
  - **Titres & En-têtes** : *Playfair Display* (`font-serif`)
  - **Corps, Boutons & Prix** : *Poppins* (`font-sans`)
- **Double Affichage** :
  1. **Mini-Lecteur Flottant Persistant** : `PersistentAudioPlayer` ancré en bas d'écran sur l'ensemble du dashboard.
  2. **Page Immersive Dédiée** : `/student/audio/[id]` et `/listen/[id]` avec la carte haute fidélité `LahathequeAudioPlayerCard`.

---

## 👥 2. Matrice des Droits et Comportements Multi-Rôles

| Rôle Utilisateur | Accès Extrait (180s) | Accès Intégral Gratuit | Achat Format Audio | Remplacement / Upload Audio |
| :--- | :---: | :---: | :---: | :---: |
| **Étudiant / Client** | Oui (Catalogue) | Si acheté / abonnement | Oui (2 500 XOF / tarif défini) | Non |
| **Maquettiste (`layout_artist`)** | Oui | **Oui (Bypass privilège)** | Non requis | **Oui (Dropzone édition)** |
| **Chef Maquettiste (`chief_layout`)** | Oui | **Oui (Bypass privilège)** | Non requis | **Oui (Dropzone validation)** |
| **Juriste (`legal_reviewer`)** | Oui | **Oui (Bypass privilège)** | Non requis | Oui (Alerte redevance) |
| **Auteur (`author`)** | Oui | **Oui (Ses propres ouvrages)** | Non requis | Consultation & Écoute |
| **Administrateur / Super Admin** | Oui | **Oui (Bypass privilège)** | Non requis | **Oui (Catalogue admin)** |

---

## 🎵 3. Parcours Utilisateurs

### A. Étudiant & Client
1. **Sur le Catalogue (`/student/catalog` & `/student/catalog/[id]`)** :
   - Badge doré « Livre Audio ».
   - Bouton « Extrait Audio (3 Min Gratuites) » permettant d'écouter sans paiement.
   - Bouton « Commander cet Ouvrage » permettant de choisir entre format numérique, papier ou audio.
2. **Sur « Ma Bibliothèque » (`/student/books`)** :
   - Filtre d'onglet : *Tous les ouvrages*, *Livres Audio*, *Mes Favoris*.
   - Double bouton sur chaque livre : **Lire** (ouvre la liseuse PDF/EPUB) et **Écouter** (lance le lecteur audio).
3. **Sur la Vue d'Ensemble (`/student`)** :
   - Bloc « Continuer ma lecture » enrichi d'un bouton direct « Écouter en audio ».
   - Bouton d'accès rapide « Livres Audio » dans *Ressources & Outils*.

### B. Maquettiste & Chef Maquettiste
1. **Écoute de Contrôle** : Bouton « Écouter l'audio » présent dans l'en-tête de la fiche de dépôt pour inspecter la piste sans barrière de paiement.
2. **Remplacement de l'Audio** :
   - Zone `AudioReplacementDropzone` avec glisser-déposer.
   - Détection automatique de la durée réelle via l'API Web Audio.
   - Barre de progression animée pendant le téléversement et l'encodage HLS.
   - Modale de confirmation avant écrasement sur Cloudflare Stream.

### C. Juriste
1. **Dans les Publications en Attente (`/legal-reviewer/publication-en-attente/[id]`)** :
   - Bouton « Écouter l'audio » pour valider la qualité du master.
   - Alerte contractuelle invitant à vérifier la clause de redevance audio avant validation de mise en ligne.

### D. Administrateur
1. **Dans le Catalogue Global (`/admin/catalog`)** :
   - Bouton casque pour écoute immédiate.
   - Bouton d'actualisation audio ouvrant la modale de remplacement `AudioReplacementDropzone`.

---

## ⚡ 4. Raccourcis Clavier du Lecteur Immersif

- **Espace** : Lecture / Pause
- **Flèche Gauche** : Recul de 15 secondes
- **Flèche Droite** : Avance de 15 secondes
- **Flèche Haut** : Augmenter le volume (+10%)
- **Flèche Bas** : Diminuer le volume (-10%)
- **M** : Muet / Rétablir le son
