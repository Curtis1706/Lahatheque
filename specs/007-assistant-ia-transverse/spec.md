# Feature Specification: Module 7 - Assistant Intelligence Artificielle Transverse

**Feature Branch**: `007-assistant-ia-transverse`  
**Created**: 2026-08-18  
**Status**: In Review  
**Source Metier**: Cahier des charges LAHATheque v3.2 - Section C et Section 14 (Assistant IA Transverse)

---

## 1. Resume Executif de la Fonctionnalite

Fournir une couche transverse d'Intelligence Artificielle au service de tous les metiers de LAHATheque :
1. **Extraction et Classification Automatique** : Analyse du texte des ouvrages pour suggerer le resume, la discipline academique, la langue, le ou les pays de rattachement, l'universite et la faculte.
2. **Controle Qualite et Detection d'Incoherences** : Identification automatique des anomalies de metadonnees (incoherence entre titre et discipline, faculte erronee, mot-cle suspect).
3. **Structuration des Bouquets Documentaires et Export Word (`.docx`)** : Regroupement automatique des catalogues par discipline, universite, faculte ou pays et generation d'exports Word enrichis et pagines.
4. **Resilience et Haute Disponibilite** : Mode degrade transparent garantissant qu'aucune panne d'API externe (LLM) ne bloque l'experience utilisateur.

---

## 2. User Scenarios & Acceptance Criteria (Prioritises)

### User Story 1 - Classification Automatique et Suggestion de Resume (Priorite: P1 - MVP)

En tant que Maquettiste ou Editeur tiers, je veux qu'a l'envoi d'un fichier PDF, l'assistant IA me propose instantanement un resume de 3 paragraphes, la discipline majeure et la langue du livre.

**Scenarios d'acceptation** :
1. **Etant donne** un document PDF televerse, **Quand** le service `classify` est appele, **Alors** il renvoie un objet JSON contenant `resume`, `discipline`, `langue`, `pays` et `mots_cles`.
2. **Etant donne** un document deja analyse dont le hash SHA-256 est present en cache, **Quand** il est re-soumis, **Alors** la reponse est servie depuis le cache local en moins de 10 ms sans appel API LLM externe.

---

### User Story 2 - Detection d'Incoherences de Metadonnees (Priorite: P2)

En tant que Validateur LAHA ou Chef Maquettiste, je veux voir apparaitre des avertissements non bloquants si l'IA detecte une contradiction evidente dans la notice d'un livre.

**Scenarios d'acceptation** :
1. **Etant donne** un ouvrage classe en "Droit" dont le contenu traite de "Microbiologie", **Quand** l'analyse de coherence tourne, **Alors** un flag `incoherence_detectee` est leve avec l'explication detaillee.

---

### User Story 3 - Generation d'un Export Word (`.docx`) de Bouquet Documentaire (Priorite: P1 - MVP)

En tant qu'Universite ou Administrateur, je veux telecharger un fichier Word professionnel listant l'integralite des ouvrages disponibles dans un bouquet specifique (ex: "Bouquet Medecine 2026").

**Scenarios d'acceptation** :
1. **Etant donne** un bouquet selectionne, **Quand** l'utilisateur clique sur "Export Word", **Alors** un document `.docx` propre est genere avec page de garde, sommaire, notices, couvertures et liens de lecture.

---

## 3. Traque des Non-Dits et Cas Limites (Etape Clarify)

1. **Extraction de texte securisee** : Limiter l'extraction aux 50 premieres pages ou aux sections cles (table des matieres, introduction, 4e de couverture) pour minimiser la consommation de tokens et le temps de calcul.
2. **Fallback / Mode degrade** : Si le connecteur LLM renvoie un timeout ou une erreur 429/500, le service renvoie des suggestions vides ou heuristiques simples sans generer d'erreur HTTP 500 pour le client.
3. **Respect de la confidentialite** : Les textes envoyes a l'API IA ne doivent pas etre conserves pour l'entrainement de modeles publics.

---

## 4. Exigences Fonctionnelles (FR)

- **FR-001** : Modeles `AISuggestionCache`, `AICallLog`.
- **FR-002** : Service `TextExtractorService` avec extraction ciblee (50 premieres pages).
- **FR-003** : Service `ClassificationService` avec mise en cache SHA-256 des resultats.
- **FR-004** : Service `DocxExportService` avec la bibliotheque `python-docx`.
- **FR-005** : Format JSON unifie `{ "success": boolean, "data": object|array, "error": string|null }`.

---

## 5. Criteres de Succes Mesurables (SC)

- **SC-001** : Reponse IA < 3 secondes pour un nouveau PDF, < 20 ms si en cache.
- **SC-002** : 100% de continuite de service meme en cas d'indisponibilite du fournisseur LLM externe.
