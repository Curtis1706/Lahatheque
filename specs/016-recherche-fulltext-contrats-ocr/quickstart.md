# Guide de Validation Rapide : Recherche Full-Text & OCR Contrats

**Feature** : `016-recherche-fulltext-contrats-ocr`
**Date** : 2026-09-06

---

## 1. Prérequis

- Serveur backend Django opérationnel avec base PostgreSQL.
- Frontend Next.js lancé sur le port standard (`localhost:3000`).
- Compte utilisateur avec rôle `legal_reviewer` ou `admin`.

---

## 2. Scénarios de Validation de Bout en Bout

### Scénario 1 : Recherche dans un PDF Natif (Texte informatique)

1. Se connecter à l'espace juriste : `/legal-reviewer/contracts`.
2. Déposer un nouveau contrat PDF contenant la phrase : *"Clause de cession exclusive pour le territoire béninois"*.
3. Constater que la fiche contrat est créée immédiatement (< 500ms) avec l'état `Indexé`.
4. Dans la barre de recherche, taper : `"territoire béninois"`.
5. **Résultat attendu** : Le contrat apparaît immédiatement en première position avec l'extrait contextuel en surbrillance.

---

### Scénario 2 : Recherche dans un Contrat Scanné (Image / Scan papier sans texte)

1. Déposer un PDF scanné (pur fichier image / photo sans texte sélectionnable) contenant le nom d'un doyen ou un sigle universitaire (ex: *"UNSTIM"*).
2. Constater que la fiche contrat est créée avec l'état `Analyse OCR en cours`.
3. Le worker d'arrière-plan extrait le texte sans aucun ralentissement sur l'interface.
4. Dans la barre de recherche, taper : `"UNSTIM"`.
5. **Résultat attendu** : Le contrat scanné ressort correctement parmi les résultats dès la fin de l'analyse OCR.

---

### Scénario 3 : Absence de Ralentissement & Zéro Blocage Interface

1. Téléverser un document lourd de plusieurs mégaoctets.
2. Naviguer simultanément sur les autres onglets du dashboard (Redevances, Relances, Contacts).
3. **Résultat attendu** : Aucune latence ressentie, les requêtes du dashboard s'exécutent en moins de 100ms.
