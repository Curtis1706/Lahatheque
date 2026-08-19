# Feature Specification: Systeme DRM, Protection de la Lecture et Ecrans d'Administration (LAHATheque)

**Feature Branch**: `006-drm-protection-lecture`  
**Created**: 2026-08-18  
**Status**: Ready for Implementation  
**Source Metier**: Cahier des charges LAHATheque v3.2 - Section 6, 14, 15 ; Architecture DRM (`docs/drm/01-architecture-cible.md`, `docs/drm/README.md`) ; Guide API Lecteur (`KIT_PORTAGE_LECTEUR/GUIDE_API_LECTEUR.md`) ; Workflow `/build-lahatheque-screen`

---

## 1. Resume Executif de la Fonctionnalite

Ce module implemente l'integralite du systeme de securite, de protection DRM, de diffusion en flux et les ecrans d'administration/supervision associes :

1. **Principe Cardinal de Securite** : Le fichier source en clair et non filigrane ne quitte **JAMAIS** le serveur.
2. **Architecture de Stockage Agnostique (`DocumentSourceAdapter`)** :
   - Prise en charge des livres natifs du catalogue LAHATheque (Cloudflare R2 prive / Stockage local).
   - Prise en charge des documents distants fournis par les partenaires (`external_document_url` avec token de telechargement cote serveur).
   - Prise en charge des televersements directs multiparts (`direct_upload`).
3. **Moteur Cryptographique & Filigrane Double (PyMuPDF)** :
   - *Visible* : Filigrane nominatif diagonal semi-transparent avec template parametrable (`"Document fourni pour {nom} ({email}) - IP: {ip}"`).
   - *Invisible* : Tatouage steganographique et metadonnees cryptographiques (ID utilisateur, empreinte appareil, horodatage, hash).
   - Stockage et derive en cache ephemere chiffres en **AES-256-GCM**.
4. **Diffusion en Flux Range HTTP 206 (RFC 7233)** :
   - Streaming fragmenté par blocs de 256 Kio relaye par le BFF Next.js avec injection du cookie `laha_access` (ou token de session partenaire).
5. **Deux Profils de Protection** :
   - *Profil Standard* : Couche texte preservee pour la synthese vocale TTS gratuite, les surlignages, annotations et recherche interne.
   - *Profil Renforce* (`lcp_drm_enabled`) : Pages rasterisees en images, couche texte delivree page par page de maniere authentifiee et tracee (`GET /api/v1/catalog/books/{id}/text/?page=N`).
6. **Ecrans Front-End & Dashboards associes (selon `/build-lahatheque-screen`)** :
   - **Lecteur Universel** (`app/catalog/reader/[id]/page.tsx`) : FlipBook 3D immersif + lecteur normal vertical, securite client active (anti-copie, anti-print, blocage clic droit).
   - **Lecteur Heberge Autonome** (`app/read/[token]/page.tsx`) : Layout nu sans menu, thematisation dynamique, quiz de fin.
   - **Dashboard Administrateur - Parametres DRM Globaux** (`app/(dashboard)/admin/settings/drm/page.tsx`).
   - **Dashboard Administrateur - Journal Legal TraceAcces** (`app/(dashboard)/admin/security/traces/page.tsx`).
   - **Dashboard Editeur - Configuration DRM par Ouvrage** (`app/(dashboard)/publisher/catalog/[id]/protection/page.tsx`).

---

## 2. User Scenarios & Acceptance Criteria (Prioritises)

### User Story 1 - Lecture PDF Securisee en Flux Range 206 (Priorite: P1 - MVP)

En tant qu'utilisateur connecte ou apprenant partenaire, je veux ouvrir un document protege afin de le lire de maniere fluide sans que le fichier complet ne puisse etre aspire d'un bloc.

**Scenarios d'acceptation** :
1. **Etant donne** un utilisateur authentifie via son cookie `laha_access` ou token de session, **Quand** le lecteur emet une requete Range `GET /api/bff/catalog/books/{id}/stream/` (`Range: bytes=0-262143`), **Alors** :
   - Le BFF Next.js relaie la requete vers Django `GET /api/v1/catalog/books/{id}/stream/`.
   - Django verifie les droits via `AccessService` (ou `SessionLectureSecurisee`).
   - Django sert le bloc demande en code `206 Partial Content` avec en-tetes `Accept-Ranges: bytes`, `Content-Range` et `Cache-Control: private, no-store`.
   - L'evenement est insere dans `TraceAcces`.
2. **Etant donne** une tentative d'acces direct sans droit, **Quand** la requete arrive, **Alors** le systeme bloque l'acces en `403 Forbidden`.

---

### User Story 2 - Ingestion et Protection de Documents Partenaires Externes (Priorite: P1 - MVP)

En tant que partenaire API ne stockant pas ses fichiers sur R2, je veux fournir l'URL securisee de mon document afin que LAHATheque le protege et le diffuse a mes etudiants.

**Scenarios d'acceptation** :
1. **Etant donne** une requete de session contenant `external_document_url`, **Quand** le backend LAHATheque traite la demande, **Alors** :
   - Le serveur telecharge le PDF source de maniere securisee (verification MIME et taille).
   - Le service `WatermarkEngine` applique le filigrane nominatif PyMuPDF.
   - Le derive est stocke dans le cache chiffre temporaire.
   - Le lecteur `https://lahatheque.com/read/<token>` est servi sans que l'URL d'origine ne soit jamais revelee a l'etudiant.

---

### User Story 3 - Ecrans d'Administration et Supervision DRM (Priorite: P1 - MVP)

En tant qu'Administrateur, je veux visualiser les journaux d'audit `TraceAcces` et configurer les options globales de filigrane et de profil DRM de la plateforme.

**Scenarios d'acceptation** :
1. **Etant donne** l'Administrateur sur la page `/admin/security/traces`, **Quand** il filtre par pays ou par date, **Alors** la liste des consultations affiche l'utilisateur, l'IP, le pays, l'empreinte appareil et l'ouvrage sans lenteur.
2. **Etant donne** l'Administrateur sur `/admin/settings/drm`, **Quand** il modifie le texte par defaut du filigrane, **Alors** la version de configuration s'incremente et invalide les caches de derives.

---

## 3. Exigences Fonctionnelles (FR)

- **FR-001** : `DocumentSourceAdapter` supportant catalogue R2, URL distante externe et upload direct multipart.
- **FR-002** : Modeles `ProtectionConfig` enrichi, `TraceAcces` persistant, `DerivedCacheRegistry`.
- **FR-003** : Vue Django `BookStreamView` conforme RFC 7233 (Range 206) et `BookTextView` pour profil Renforce.
- **FR-004** : `WatermarkEngine` PyMuPDF (filigrane visible + tatouage invisible).
- **FR-005** : Route Handler BFF Next.js `app/api/bff/catalog/books/[id]/stream/route.ts`.
- **FR-006** : Ecrans Front-End conformes a la charte visuelle (tokens CSS sémantiques, chic & sobre, mobile-first, zéro hex code en dur).
- **FR-007** : Format JSON unifie `{ "success": boolean, "data": object|array, "error": string|null }`.

---

## 4. Criteres de Succes Mesurables (SC)

- **SC-001** : 0 octet de PDF source brut non filigrane accessible publiquement.
- **SC-002** : Temps de service d'un fragment de 256 Kio < 50 ms sur derive en cache.
- **SC-003** : 100% des ecrans front-end testables et responsives sous 400px de large.
