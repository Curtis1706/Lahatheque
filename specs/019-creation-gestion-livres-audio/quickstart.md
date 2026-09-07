# Quickstart & Guide de Validation de bout en bout

**Feature**: `019-creation-gestion-livres-audio`  
**Date**: 2026-09-07  
**Status**: Completed

Ce guide décrit les scénarios de test et de validation de bout en bout pour s'assurer que le Studio Audio, le workflow multi-rôles, la commande multi-formats et la reprise de lecture fonctionnent parfaitement.

---

## 1. Prérequis & Environnement de Test

- Backend Django opérationnel sur `http://127.0.0.1:8000`
- Frontend Next.js opérationnel sur `http://localhost:3000`
- Comptes de test disponibles :
  - **Maquettiste** : `aristide.maquettiste@lahatheque.bj`
  - **Chef Maquettiste** : `chef.maquettiste@lahatheque.bj`
  - **Juriste** : `juriste@lahatheque.bj`
  - **Admin** : `admin@lahatheque.bj`
  - **Étudiant / Lecteur** : `etudiant@lahatheque.bj`

---

## 2. Scénario 1 : Création avec Rattachement à un Livre Existant (Maquettiste)

1. Se connecter en tant que Maquettiste (`aristide.maquettiste@lahatheque.bj`).
2. Ouvrir la barre latérale et cliquer sur **Audio > Créer audio** (`/layout-artist/audio/new`).
3. Choisir le mode **« Rattacher à un livre existant »**.
4. Sélectionner un ouvrage existant dans la liste déroulante (ex: un ouvrage juridique).
   - **Validation attendue** : La couverture, le titre, les auteurs et la discipline s'affichent automatiquement et sont verrouillés.
5. Saisir le prix audio (ex: `2500` XOF).
6. Dans la colonne **Voix Homme**, déposer un fichier MP3 pour le **Livre complet**.
7. Cliquer sur **+ Ajouter** sous Chapitres, saisir "Chapitre 1", et joindre un fichier MP3 court.
   - **Validation attendue** : La jauge d'upload s'exécute, la durée est calculée.
8. Cliquer sur **« Enregistrer le livre audio »**.
   - **Validation attendue** : Message de confirmation toast, redirection vers `/layout-artist/audio` avec statut `pending_chief_review`.

---

## 3. Scénario 2 : Revue et Validation Technique (Chef Maquettiste)

1. Se connecter en tant que Chef Maquettiste.
2. Naviguer vers **Livres audio** (`/chief-layout/audio`).
3. Repérer la ligne du livre audio créé au scénario 1.
4. Cliquer sur **« Examiner »** :
   - Tester la lecture directe des pistes audio déposées.
   - Cliquer sur **« Valider techniquement »**.
   - **Validation attendue** : Le statut passe à `pending_legal_review`.

---

## 4. Scénario 3 : Revue Juridique & Publication (Juriste)

1. Se connecter en tant que Juriste.
2. Accéder à **Livres audio** (`/legal-reviewer/audio`).
3. Vérifier les quotes-parts d'auteurs (`taux_audio_tts`).
4. Cliquer sur **« Valider & Publier au Catalogue »**.
   - **Validation attendue** : Le livre audio passe au statut `published`.

---

## 5. Scénario 4 : Commande Combinée Multi-Formats (Étudiant)

1. Se connecter en tant qu'Étudiant (`/student/catalog`).
2. Rechercher l'ouvrage publié.
   - **Validation attendue** : Le badge « Livre Audio » apparaît avec l'icône écouteurs dorée.
3. Cliquer sur **« Extrait »** :
   - **Validation attendue** : La modale `SampleChoiceModal` s'ouvre, proposant « Lire le livre » ou « Écouter l'audio ».
4. Cliquer sur **« Commander »** :
   - **Validation attendue** : La modale permet de cocher à la fois **Format Numérique** et **Livre Audio**.
5. Valider la commande :
   - **Validation attendue** : Les deux formats sont débloqués. Le bouton sur la fiche devient « Lire » et « Écouter ».

---

## 6. Scénario 5 : Reprise d'Écoute sur la Vue d'Ensemble

1. Cliquer sur **« Écouter »** :
   - Redirection immédiate vers `/listen/[id]`.
   - Laisser jouer 15 secondes.
2. Cliquer sur le menu **« Vue d'ensemble »** (`/student`) :
   - Le mini-lecteur audio flottant continue de jouer en bas à droite.
   - Sur la page d'accueil de l'étudiant, le widget **« Écoutes en cours »** affiche l'ouvrage, le temps écoulé et le bouton **« Reprendre »**.
3. Cliquer sur **« Reprendre »** :
   - Redirection immédiate vers `/listen/[id]` au moment précis de l'écoute.
