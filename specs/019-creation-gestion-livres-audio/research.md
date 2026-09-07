# Phase 0: Research & Technical Decisions — Création et Gestion des Livres Audio Multi-Rôles

**Feature**: `019-creation-gestion-livres-audio`  
**Date**: 2026-09-07  
**Status**: Completed

---

## 1. Architecture du Studio Audio : Rattachement vs Création Autonome

### Decision
Permettre un commutateur de mode ergonomique sur la page `/audio/new` :
1. **Mode « Rattacher à un livre existant » (Recommandé par défaut)** : Un sélecteur d'ouvrages (`DisciplineCombobox` / `BookSearchSelect`) interroge l'API catalogue. Dès qu'un livre numérique ou papier est sélectionné, ses attributs (`title`, `authors`, `cover_image`, `description`, `discipline`, `country`) sont instantanément réutilisés et pré-remplis en lecture seule. L'utilisateur n'a plus qu'à fixer le prix audio (XOF / EUR) et à déposer les pistes.
2. **Mode « Création autonome (Pure Audio) »** : Permet de créer un livre audio sans livre imprimé ou PDF préexistant. Les champs titre, auteur, pays, catégorie, niveau d'étude, description et téléversement de couverture sont alors éditables.

### Rationale
- Répond exactement à l'exigence de l'utilisateur : *"tu as la possibilité de choisir un livre numérique ou papier et d'y rattacher une version audio, là utilises directement le book cover le titre et toutes les autres infos du livre en question plutôt que d'ajouter couverture et faire tout ça là"*.
- Évite la duplication de fichiers de couverture et d'enregistrements en base de données.
- Préserve la rétrocompatibilité pour les livres audio indépendants.

### Alternatives Rejetées
- *Forcer la création d'un PDF d'abord* : Inadapté aux productions purement orales / podcasts académiques.
- *Dupliquer systématiquement les couvertures et textes* : Redondance de stockage et risque de désynchronisation en cas de mise à jour du livre principal.

---

## 2. Modèle de Données Pistes Audio & Double Voix (Homme / Femme)

### Decision
Faire évoluer le modèle `AudioTrack` (`apps/audio/models.py`) pour prendre en charge :
- `voice_gender` : `models.CharField(max_length=10, choices=[('male', 'Voix Homme'), ('female', 'Voix Femme')], default='male')`
- `track_type` : `models.CharField(max_length=20, choices=[('full', 'Livre complet'), ('chapter', 'Chapitre')], default='chapter')`
- `chapter_number` : `models.IntegerField(default=1)` (valeur 0 pour le livre complet)
- `title` : `models.CharField(max_length=255)` (ex: "Livre complet - Voix masculine" ou "Chapitre 1 : Introduction")
- `stream_id` / `file_key` : Clé de stockage sur Cloudflare R2 ou UID Cloudflare Stream
- `duration_seconds` : Durée acoustique précise en secondes
- `file_size_bytes` : Taille du fichier audio
- `bitrate_kbps` : Débit d'encodage (128 kbps recommandé pour l'audio parlé)

### Rationale
- Reproduit à 100% l'ergonomie de référence de LAHA Éditions (colonnes Voix Homme et Voix Femme avec livre complet + chapitres découpés).
- Permet à l'auditeur de basculer instantanément entre la voix masculine et la voix féminine dans le lecteur audio `/listen/[id]`.
- Permet l'écoute continue du livre complet ou la navigation ciblée par chapitres.

---

## 3. Stockage et Téléversement Haute Performance (Cloudflare R2)

### Decision
1. **Téléversement Direct Cloudflare R2 via Presigned URLs** :
   - Endpoint `POST /api/v1/audio/upload-url/` générant une URL présignée S3/R2 `PUT`.
   - Le navigateur téléverse directement le fichier MP3/AAC/WAV vers Cloudflare R2 avec barre de progression temps réel (zéro charge mémoire sur le serveur Django/Next.js).
2. **Fallback Multipart Standard** :
   - Endpoint `POST /api/v1/audio/tracks/upload/` pour environnements de test ou sans accès R2 direct.
3. **Calcul de Durée et Métadonnées** :
   - Côté frontend : extraction de la durée via un élément `Audio` éphémère (`loadedmetadata`) avant l'envoi.
   - Côté backend : vérification et consolidation de la durée réelle avec `mutagen` lors de la finalisation.

---

## 4. Workflow de Validation Multi-Rôles

### Decision
Cycle d'approbation éditorial structuré :
```text
[Maquettiste] Dépose pistes audio -> Statut: pending_chief_review
         │
         ▼
[Chef Maquettiste] Contrôle acoustique, validation des chapitres
         ├─► Rejet avec motif textuel -> Statut: rejected
         └─► Approbation technique -> Statut: pending_legal_review
                  │
                  ▼
         [Juriste] Vérification des contrats & taux_audio_tts
                  ├─► Rejet avec motif -> Statut: rejected
                  └─► Approbation juridique -> Statut: published
                           ▲
                           │
                  [Administrateur]
            (Supervision, validation directe,
             publication ou dépublication en 1 clic)
```

### Rationale
- Respecte scrupuleusement la séparation des responsabilités éditoriales de LAHAThèque.
- Chaque rôle dispose de sa page de gestion filtrée sur les tâches lui incombant.

---

## 5. Commande Multi-Formats Non Exclusive (Papier + Numérique + Audio)

### Decision
1. **Refonte de la Modale de Commande (`UnifiedBookOrderModal`) et du Panier (`WholesaleCartDrawer`)** :
   - Remplacement des boutons radio exclusifs par des cases à cocher indépendantes :
     - `[x] Format Numérique` (Lecture DRM immédiate)
     - `[x] Format Livre Audio` (Écoute streaming HD immédiate)
     - `[x] Format Livre Papier` (Impression et livraison physique avec adresse)
   - L'acheteur peut cocher 1, 2 ou les 3 formats en une seule fois.
   - Calcul dynamique du total panier : `Total = (Numérique ? P_num : 0) + (Audio ? P_audio : 0) + (Papier ? P_papier * Qté : 0)`.
2. **Création de Commandes Backend (`apps/commerce/models.py`)** :
   - Création de lignes de commande distinctes par format au sein de la même transaction.
   - Génération immédiate des droits d'accès (`UserBookAccess` / `TraceAcces`) pour les formats dématérialisés (audio et numérique).
   - Génération de l'ordre d'expédition logistique pour le papier.

---

## 6. Suivi de Progression d'Écoute sur la Vue d'Ensemble Étudiant

### Decision
1. **Persistance en base de données** :
   - `AudioListeningSession` enregistre périodiquement (toutes les 10 secondes) : `duration_listened_seconds`, `completion_percent`, `audio_track_id`, `last_listened_at`.
2. **Composant UI Tableau de Bord (`components/features/student/recent-audio-widget.tsx`)** :
   - Affiché sur `/student` aux côtés des lectures en cours.
   - Affiche : Pochette, Titre, Narrateur/Voix, Titre du chapitre en cours, jauge de progression dorée, et bouton « Reprendre l'écoute ».
   - Clic sur « Reprendre l'écoute » : redirection directe vers `/listen/[id]` avec reprise à la seconde exacte.
