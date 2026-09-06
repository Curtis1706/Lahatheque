# Research: Livres Audio et Lecteur Multi-Rôles

**Feature**: `017-livres-audio-lecteur-multi-roles`
**Date**: 2026-09-07

## 1. Règle de l'Extrait Audio Gratuit (Free Preview)

### Decision
L'extrait gratuit est fixé à **180 secondes (3 minutes)** sur la première piste audio du livre. 

### Rationale
- Standard de l'industrie du livre audio (Audible, Storytel, Kobo) : 3 minutes permettent à l'auditeur d'apprécier la voix du narrateur, le rythme et la qualité sonore sans déprécier la valeur commerciale de l'œuvre.
- Pour les ouvrages courts, si la durée totale est inférieure à 3 minutes, l'extrait est plafonné à 50% de la durée.
- Côté frontend et backend : l'API `AudioStreamSessionView` fournit un paramètre `preview_mode: true` et `preview_limit_seconds: 180` quand l'utilisateur n'a pas acheté l'audio et n'est pas exempté de restriction. Le lecteur audio affiche un badge doré discret « Extrait gratuit (3:00) » et bloque la lecture au-delà de 180 secondes en affichant une invite d'achat claire.

### Alternatives Considered
- *Pourcentage de 10%* : Rejeté car sur un livre de 10 heures, un extrait de 60 minutes est commercialement trop long, et sur un livre court de 10 minutes, 1 minute est trop courte.
- *Premier chapitre entier* : Rejeté car les durées de chapitres varient énormément (certains chapitres 1 font 45 minutes).

---

## 2. Architecture de Lecture Audio : Double Affichage (Mini-lecteur Persistant + Page Dédiée)

### Decision
Mise en place d'un **AudioPlayerContext** global dans le frontend (`components/features/audio/audio-player-context.tsx`) gérant :
1. Un **Mini-lecteur persistant flottant** (`PersistentAudioPlayer.tsx`) fixé en bas de page pour continuer l'écoute en naviguant librement sur le catalogue, la bibliothèque ou les commandes.
2. Une **Page immersive dédiée** (`/student/audio/[id]`) et route universelle (`/listen/[id]`) avec la carte `LahathequeAudioPlayerCard` reprenant la structure `SpotifyCard` adaptée aux couleurs LAHAThèque (Navy, Gold, Playfair Display/Poppins, sans émoji).
3. Un bouton d'agrandissement/réduction fluide entre le mini-lecteur et la vue immersive.

### Rationale
- Écouter un livre audio est une tâche de fond longue (30 min à 5 h). Forcer l'utilisateur à rester sur une page fixe casserait la navigation et l'achat simultané d'autres ouvrages.
- L'approche mini-lecteur persistant + vue dédiée offre le meilleur standard UX moderne (similaire à Spotify, Apple Music, Audible).

### Alternatives Considered
- *Page dédiée unique sans lecteur persistant* : Rejeté car toute navigation vers une autre page couperait le son brutalement.
- *Modale simple* : Rejeté car masque l'écran et empêche la navigation multitâche.

---

## 3. Gestion des Rôles et Permissions d'Écoute (Bypass Commercial)

### Decision
Dans `apps/audio/views.py` (`AudioStreamSessionView`), les rôles suivants accèdent directement au flux audio complet sans exiger de commande payée (`LigneCommande`) ni d'abonnement bouquet :
- `admin`, `super_admin` : supervision plateforme et contrôle qualité.
- `chief_layout`, `layout_artist` : vérification technique et validation maquette.
- `legal_reviewer` : contrôle contractuel.
- `author` : écoute illimitée sur ses propres ouvrages (`ouvrage.authors.filter(user=request.user)`).
- Utilisateur avec rôle `student` ou `client` : extrait de 3 minutes si non acheté, ou accès complet si commande payée ou bouquet institutionnel couvrant l'ouvrage.

### Rationale
Les équipes internes et les auteurs ont besoin de pré-écouter le master sans passer par un flux de paiement fictif ou contourner le système par des fichiers bruts non sécurisés.

---

## 4. Téléversement et Remplacement d'Audio (Édition d'Ouvrage)

### Decision
Le formulaire d'édition d'ouvrage (pour Maquettiste, Chef Maquettiste et Administrateur) gère à la fois :
1. L'ajout initial d'un fichier audio (MP3, M4A, M4B) si le livre n'avait pas d'audio.
2. Le **remplacement** transparent du fichier audio existant via `POST /api/bff/audio/tracks/upload/` avec le paramètre `replace: true` et `ouvrage_id`.
3. Le backend supprime l'ancienne piste Cloudflare Stream ou la remplace par la nouvelle référence `stream_id`, recalcule `duration_seconds`, active `has_audio_version = True`, et journalise l'opération dans `TraceAcces` / logs administratifs.
4. Si le contrat de l'ouvrage est actif et n'a pas de taux audio renseigné, l'alerte automatique des juristes est déclenchée.

### Rationale
Permet de corriger un problème d'enregistrement ou de mastering sans altérer les commandes des clients ni l'identifiant de l'ouvrage.

---

## 5. Adaptation Graphique du Composant Audio (`LahathequeAudioPlayerCard`)

### Decision
Le composant sera codé dans `components/features/audio/lahatheque-audio-player-card.tsx` :
- **Variables CSS sémantiques** : `bg-navy`, `bg-navy-dark`, `border-border`, `text-gold`, `bg-gold`, `hover:bg-gold-hover`. Aucune couleur hexadécimale en dur.
- **Typographie** : `Playfair Display` pour le titre de l'ouvrage, `Poppins` pour les auteurs, la durée, le volume et les menus.
- **Icônes Lucide React** : `Play`, `Pause`, `SkipBack`, `SkipForward`, `Volume2`, `VolumeX`, `Maximize2`, `Minimize2`, `BookOpen`, `Headphones`, `Sparkles`. Zéro émoji.
- **Onde sonore animée** : animée lors de la lecture (`isPlaying`) avec barres dorées discrètes.
- **Contrôles riches** : reprise automatique à la seconde exacte (`AudioListeningProgressView`), vitesse de lecture réglable (0.75x, 1x, 1.25x, 1.5x, 2x), saut rapide -15s / +15s.
