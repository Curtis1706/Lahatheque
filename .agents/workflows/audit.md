---
description: audit
---

# Workflow d'Audit Continu et DevSecOps — LAHAThèque

Ce document formalise la procédure d'audit et de surveillance continue de LAHAThèque. Il s'applique à chaque itération de développement (PR, livraison de module, déploiement) sur l'ensemble de la stack technique (Next.js App Router, Django REST Framework, PostgreSQL Neon, Cloudflare R2, Redis / Celery).

---

## 0. Règle Absolue et Obligatoire : Lecture Intégrale Exhaustive de Tous les Fichiers

**Principe non négociable : Zéro omission, zéro survol, zéro troncature.**

Pour tout travail d'audit, d'analyse, d'implémentation, de correction ou de revue de code :

1. **Lecture Intégrale Obligatoire (100% des lignes)** :
   - Tout fichier analysé ou modifié doit être lu et inspecté dans son intégralité absolue, de la première ligne à la dernière ligne, du premier caractère au dernier caractère.
   - Pas une seule lettre, pas un seul bloc de code, pas une seule condition ou commentaire ne doit être laissé de côté ou ignoré.
2. **Interdiction Formelle des Hypothèses et du Survol** :
   - Il est formellement interdit de présumer du contenu d'un fichier, d'ignorer des imports, des middlewares, des classes de permission, des modèles ou des fonctions sous prétexte de brièveté.
   - Toute analyse de sécurité ou d'architecture doit reposer sur la lecture intégrale et exhaustive de l'ensemble des fichiers impliqués dans la chaîne de traitement.
3. **Périmètre d'Application Universel** :
   - Cette règle s'applique impérativement à tous les types de fichiers du projet : fichiers Python (`views.py`, `models.py`, `serializers.py`, `permissions.py`, `urls.py`, `tasks.py`, `middleware.py`), fichiers TypeScript/React (`page.tsx`, `layout.tsx`, `route.ts`, hooks, services), fichiers de configuration (`settings.py`, `requirements/*.txt`, `package.json`, variables d'environnement, règles de sécurité) et fichiers de spécification technique.

---

## 1. Rôles et Disciplines d'Expertise

Ce workflow mobilise 5 disciplines complémentaires d'ingénierie et de sécurité sans mélanger leurs référentiels respectifs :

1. **Design d'API (API Design Specialist)** : Conformité OpenAPI, Design-First, conventions REST, contrats d'erreurs et idempotence.
2. **Architecture Backend (Backend Architect)** : Modélisation des données PostgreSQL/Neon, cohérence ORM, indexation, gestion des accès et isolation multi-tenant.
3. **DevSecOps** : Intégration de la sécurité dans les pipelines (SAST, SCA, scan de secrets, gates bloquants).
4. **Sécurité Applicative et Threat Intelligence (Security Analyst)** : Détection d'anomalies, modélisation des menaces, matrice MITRE ATT&CK et classification des risques.
5. **Opérations SOC et Réponse aux Incidents (NIST IR Lifecycle)** : Surveillance opérationnelle, confinement immédiat, remédiation et traçabilité d'audit.

---

## 2. La Boucle d'Audit Continu en 5 Étapes

La boucle s'exécute de façon itérative à chaque cycle de code.

```
[1. Revue du Livré] ---> [2. Scan de Sécurité] ---> [3. Détection & Triage]
         ^                                                   |
         |                                                   v
[5. Registre & Diligence] <--- [4. Correction & Gate] <------+
```

---

### Étape 1 : Revue du Livré (Déclencheur : Chaque PR / Module Terminé)

_Disciplines activées : Design d'API & Architecture Backend (Mode Contrôle)._

Contrôles obligatoires avant toute fusion :

1. **Conformité au contrat d'API** :
   - L'endpoint respecte-t-il strictement la structure unifiée `{ "success": boolean, "data": dict, "error": string | null }` ?
   - Les codes de retour HTTP reflètent-ils fidèlement le résultat (`200`, `201`, `400`, `401`, `403`, `404`, `429`) ?
   - L'idempotence des opérations d'écriture et de retry est-elle garantie ?
2. **Conformité du schéma de données (PostgreSQL / Neon)** :
   - Les clés primaires utilisent-elles systématiquement `UUIDField` ?
   - Les champs interrogés fréquemment comportent-ils des index appropriés (`db_index=True` ou `models.Index`) ?
   - Les relations multi-tenant garantissent-elles l'étanchéité stricte des données entre institutions et partenaires ?
3. **Contrôle des permissions et des rôles** :
   - Les permissions d'accès (`IsAuthenticated`, `IsAdminOrSuperAdmin`, `IsAuthenticatedPartner`, etc.) sont-elles appliquées explicitement au niveau de chaque vue ?
   - Aucun contournement (fallback silencieux, auto-création de compte ou privilège par défaut) n'est-il toléré ?

_Livrable : Liste des dérives techniques et écarts de conception par rapport aux spécifications._

---

### Étape 2 : Scan de Sécurité Applicative (Déclencheur : Chaque Build / Pré-déploiement)

_Discipline activée : DevSecOps._

Contrôles automatisés dans le pipeline CI/CD :

1. **SAST (Static Application Security Testing)** :
   - Analyse statique du code Python (Django) et TypeScript (Next.js).
   - Recherche de patterns vulnérables : injections SQL brutes, requêtes non filtrées, permissions manquantes, désérialisation non sécurisée.
2. **SCA (Software Composition Analysis)** :
   - Scan des dépendances `requirements/*.txt` et `package.json`.
   - Blocage immédiat si une CVE critique ou élevée est détectée.
3. **Détection de Secrets et Informations Sensibles** :
   - Scan de l'arbre Git pour empêcher tout commit contenant des clés Cloudflare R2, jetons Neon/Redis, ou clés secrètes Django.
4. **Gates Bloquants Automatisés** :
   - Interdiction formelle de déployer si une vulnérabilité de sévérité Critique ou Élevée est active.

_Livrable : Rapport d'analyse de vulnérabilités et statut du gate de déploiement._

---

### Étape 3 : Détection, Triage et MITRE ATT&CK (Déclencheur : Continu & Télémétrie)

_Disciplines activées : Security Analyst & SOC._

Surveillance continue des journaux d'audit (`ApiRequestLog`, logs Cloudflare, métriques Redis) :

1. **Analyse comportementale et signaux d'anomalie** :
   - Pics de requêtes inhabituels sur `/api/v1/oauth2/token/` ou `/api/v1/reader/sessions/`.
   - Échecs répétés d'authentification ou requêtes sans secret client.
   - Tentatives d'accès direct aux flux PDF contournant le streaming protégé `/api/v1/reader/sessions/stream/`.
2. **Cartographie MITRE ATT&CK** :
   - _Initial Access (T1078 - Valid Accounts)_ : Utilisation de credentials d'API compromis.
   - _Privilege Escalation (T1068 - Exploitation for Privilege Escalation)_ : Tentative d'accès administrateur via une session apprenant.
   - _Defense Evasion (T1562 - Impair Defenses)_ : Tentative de contournement du filigrane dynamique ou de l'invalidation de token.
   - _Exfiltration (T1567 - Exfiltration Over Web Service)_ : Téléchargement massif non autorisé de contenus protégés par DRM.
3. **Matrice de Priorité et Triage** :
   - **Critique** : Faille active sur le DRM Readium/LCP, contournement du filigrane, fuite de documents intégraux.
   - **Élevée** : Accès non autorisé à un dashboard réservé, faille d'authentification API partenaire.
   - **Moyenne** : Écart de politique de sécurité, absence de rate limiting sur un endpoint secondaire.
   - **Faible** : Faux positifs, erreurs de syntaxe client isolées.

_Livrable : Fiche d'incident qualifiée avec classification de gravité et TTP MITRE associée._

---

### Étape 4 : Remédiation et Durcissement (Déclencheur : Faille Moyenne ou Supérieure)

_Disciplines activées : Architecture Backend, Design d'API & DevSecOps._

Procédure de correction selon la racine du problème :

1. **Faille de Conception / Spécification** :
   - Corriger la spécification d'entrée/sortie et les sérialiseurs avant d'ajuster le code métier.
   - Réécrire la logique pour supprimer tout comportement implicite ou permissif.
2. **Faille de Pipeline / Dépendance** :
   - Mettre à jour la dépendance vulnérable ou isoler le composant défaillant.
   - Ajouter une règle SAST personnalisée pour bloquer toute réintroduction future.
3. **Incident Actif / Exploitation en Cours (Processus IR - NIST)** :
   - _Confinement (Containment)_ : Révocation immédiate des jetons compromis (`ReaderSession.status = 'revoked'`, rotation du `client_secret`).
   - _Éradication (Eradication)_ : Application du correctif de sécurité et purge des enregistrements illicites.
   - _Rétablissement (Recovery)_ : Redéploiement sécurisé et vérification sous supervision renforcée.

_Livrable : Correctif validé, tests de non-régression Pytest/Jest, et durcissement des règles de contrôle._

---

### Étape 5 : Documentation, Diligence Contractuelle et Clôture

_Discipline activée : Opérations SOC (Post-Incident Activity)._

Traçabilité et conformité juridique (Obligation de résultat de sécurité LAHA Éditions) :

1. **Entrée au Registre d'Audit LAHAThèque** :
   - Nature de l'écart / faille constatée.
   - Cause racine identifiée (ex: prototype résiduel, paramètre mal validé).
   - Mesure corrective appliquée et commit Git associé.
   - Nouvelle règle de détection ou de pipeline mise en place.
2. **Métriques d'Efficacité** :
   - Calcul du MTTD (_Mean Time to Detect_) et MTTR (_Mean Time to Remediate_).
   - Suivi du ratio de détection pré-déploiement vs post-déploiement.

_Livrable : Rapport de diligence prêt pour audit externe ou revue contractuelle._

---

## 3. Priorités Spécifiques et Points d'Attention LAHAThèque

Ces composants critiques doivent faire l'objet d'une vigilance systématique lors de chaque itération :

1. **Protection des Contenus & DRM (Readium / LCP)** :
   - Priorité Critique par défaut.
   - Aucun lien direct (URL S3/R2 publique) vers un fichier original ne doit jamais être exposé au frontend.
   - Le streaming de document doit impérativement transiter par `/api/v1/reader/sessions/stream/` avec validation stricte du jeton éphémère (`X-Reader-Token`).
2. **Endpoints Partenaires & Machine-to-Machine** :
   - Interdiction totale d'auto-provisioning de comptes ou de clés API.
   - Vérification du secret client systématiquement hashée en SHA-256 et comparée en temps constant (`verify_secret`).
   - Rejet immédiat de toute requête non authentifiée avec `401 Unauthorized` (aucun fallback sur un partenaire par défaut).
3. **Calcul et Exposition des Royalties / Catalogue** :
   - Vérification stricte des permissions d'accès par rôle (Éditeur, Libraire, Auteur, Administrateur).
   - Application rigoureuse du rate limiting pour empêcher le scraping non autorisé.
4. **Tâches Asynchrones Celery & Stockage Cloudflare R2** :
   - Vérifier que les URL signées ou fichiers temporaires manipulés par Celery sont scellés et nettoyés immédiatement après traitement.
