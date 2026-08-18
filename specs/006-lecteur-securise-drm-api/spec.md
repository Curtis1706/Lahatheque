# Feature Specification: Module 6 - Lecteur Heberge Autonome, Protection DRM et API Partenaires

**Feature Branch**: `006-lecteur-securise-drm-api`  
**Created**: 2026-08-18  
**Status**: In Review  
**Source Metier**: Cahier des charges LAHATheque v3.2 - Section 6, 8, 9 ; Architecture DRM (`docs/drm/`) ; Guide API Lecteur (`KIT_PORTAGE_LECTEUR/GUIDE_API_LECTEUR.md`)

---

## 1. Resume Executif de la Fonctionnalite

Ce module represente le cœur applicatif de distribution securisee des contenus de LAHATheque :
1. **Lecteur Heberge Universel (`/read/[token]`)** : Moteur 3D FlipBook immersif realiste et mode de lecture normal vertical page par page (`@react-pdf-viewer`), toujours disponibles sur PC, tablette et mobile.
2. **Architecture DRM Proprietaire (0 € / Sans LCP)** :
   - Fichiers sources stockes chiffres en **AES-256-GCM** sur Cloudflare R2 prive.
   - Generation a la volee d'un **derive protege matérialise unique** par triplet `(utilisateur × ouvrage × version_config)` avec filigrane visible (nom, email) et tatouage invisible (ID, IP, appareil) via PyMuPDF.
   - Diffusion en flux par **Range Requests HTTP 206** via le BFF Next.js sans jamais exposer de fichier brut ni d'URL R2 au navigateur.
   - **Deux profils** : *Standard* (couche texte preservee pour TTS et annotations) et *Renforce* (pages rendues en images avec endpoint texte authentifie separe).
   - **Interdiction formelle de telechargement et d'impression**.
3. **Audio & Multimedias** : Diffusion audio securisee en flux **HLS** (`ffmpeg`) avec playlist signee par token court, et conversion automatique des documents Office (`.docx`, `.pptx`) en PDF proteges via LibreOffice headless.
4. **API Partenaire & Sessions de Lecture** : Creation de sessions par API OAuth2 Client Credentials (`POST /api/v1/reader/sessions/`) avec thematisation visuelle (couleurs d'accent, logo) et injection dynamique de Quiz de comprehension, accompagnee de Webhooks signes HMAC-SHA256 (`reader.quiz.completed`, `reader.progress.updated`).
5. **Audit Legal Immuable** : Enregistrement obligatoire de chaque consultation dans la table `TraceAcces` (utilisateur, IP, user_agent, empreinte appareil, horodatage, page lue).

---

## 2. User Scenarios & Acceptance Criteria (Prioritises)

### User Story 1 - Lecture Securisee en Flux Fragmenté Range 206 (Priorite: P1 - MVP)

En tant que Lecteur authentifie ou porteur d'un token de session valide, je veux ouvrir un livre numerique et le feuilleter de maniere fluide sans que le fichier complet ne soit jamais telechargeable dans mon navigateur.

**Scenarios d'acceptation** :
1. **Etant donne** une session valide sur `/read/[token]`, **Quand** le viewer charge le document, **Alors** les requetes Range (`bytes=0-262143`) sont relayeess par le BFF vers Django qui renvoie des reponses `206 Partial Content` avec en-tetes `Cache-Control: private, no-store`.
2. **Etant donne** le document affiche a l'ecran, **Quand** l'utilisateur regarde les pages, **Alors** un filigrane semi-transparent portant son nom et son adresse IP est incruste sur chaque page et les raccourcis clavier `Ctrl+P`, `Ctrl+S`, `Ctrl+C` et le menu contextuel droit sont neutralises.

---

### User Story 2 - Mode Immersion 3D et Navigation Universelle (Priorite: P1 - MVP)

En tant que Lecteur, je veux pouvoir basculer instantanement entre le mode immersion FlipBook 3D et le mode vertical standard, avec continuite parfaite de ma page courante et de mes annotations.

**Scenarios d'acceptation** :
1. **Etant donne** un utilisateur lisant la page 42 en mode normal, **Quand** il bascule en mode immersion 3D, **Alors** le livre 3D s'ouvre directement sur la page 42 sans rechargement lourd.

---

### User Story 3 - Integration Partenaire avec Theme et Quiz Dynamique (Priorite: P1 - MVP)

En tant qu'application partenaire (ex: LMS universitaire ou ecole), je veux generer une session de lecture personnalisee avec notre charte graphique et un quiz de 5 questions, et recevoir le score final par Webhook.

**Scenarios d'acceptation** :
1. **Etant donne** une requete `POST /api/v1/reader/sessions/` contenant un theme et un quiz, **Quand** la session est creee, **Alors** l'URL `reader_url` est retournee avec un token ephemere (TTL 15 min).
2. **Etant donne** un apprenant terminant le quiz sur le lecteur, **Quand** il valide ses reponses, **Alors** le systeme enregistre `ResultatQuizSession` et emet un Webhook signe HMAC `reader.quiz.completed` vers l'application partenaire.

---

## 3. Traque des Non-Dits et Cas Limites (Etape Clarify)

1. **Rupture de connectivite et expiration de session** : Le token de session dure 15 minutes par defaut ; un endpoint silencieux de rafraichissement (`POST /api/v1/reader/sessions/refresh/`) permet de prolonger la session tant que le lecteur est actif sans deconnecter l'utilisateur.
2. **Tentative d'acces direct a l'URL R2** : Cloudflare R2 est strictement prive ; toute tentative d'acces direct renvoie un `403 Forbidden` HTTP.
3. **Menace d'exfiltration de texte (TTS vs Securite)** :
   - En profil Standard, la couche texte est necessaire pour la synthese vocale et les surlignages. L'imputabilite est assuree par le tatouage invisible unique.
   - En profil Renforce (ouvrages tres sensibles), les pages sont rasterisees en images et le texte pour le TTS passe par un endpoint securise au compte-gouttes page par page.
4. **Idempotence des Webhooks partenaires** : Chaque envoi de Webhook integre un en-tete `X-Lahatheque-Delivery: <UUID>` et `X-Lahatheque-Signature: <HMAC-SHA256>` pour permettre la deduplication chez le partenaire.

---

## 4. Exigences Fonctionnelles (FR)

- **FR-001** : Modeles `SessionLectureSecurisee`, `ProtectionConfig`, `TraceAcces`, `ResultatQuizSession`.
- **FR-002** : Vue de streaming Django `BookStreamView` supportant la RFC 7233 (Range Requests 206).
- **FR-003** : Module de filigrane PyMuPDF `WatermarkEngine` (visible parametrable + tatouage invisible nominatif).
- **FR-004** : Pipeline HLS audio via `ffmpeg` avec playlist securisee.
- **FR-005** : Pipeline de conversion Office vers PDF via LibreOffice headless.
- **FR-006** : Moteur de quiz dynamique et dispatching de webhooks Celery avec retries exponentiels.
- **FR-007** : Persistance obligatoire dans `TraceAcces` sur chaque requete de lecture.
- **FR-008** : Format JSON unifie `{ "success": boolean, "data": object|array, "error": string|null }`.

---

## 5. Criteres de Succes Mesurables (SC)

- **SC-001** : 0 octet de PDF clair ou non filigrane accessible publiquement.
- **SC-002** : Temps de reponse des chunks Range 206 < 50 ms en cache matérialisé.
- **SC-003** : 100% des actions de lecture journalisees dans `TraceAcces`.
