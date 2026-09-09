# Guide d'Intégration Partenaire — Mode « Accès Mixte » (Catalogue LAHAThèque + Vos Propres Documents)

> **Public cible :** Développeurs et intégrateurs de plateformes complètes (LMS universitaires d'envergure, grandes écoles, écosystèmes EdTech) combinant l'accès aux manuels du catalogue officiel LAHAThèque et la diffusion sécurisée de leurs propres polycopiés et cours internes.

---

## 1. Vue d'Ensemble du Mode Mixte

Le mode d'accès **Mixte** est le niveau d'intégration le plus complet. Votre clé API bénéficie de l'ensemble des scopes :
`scope: "reader:sessions reader:byod catalog:read"`

### Deux sources de lecture unifiées :
1. **Source Catalogue (`book_id`) :** L'apprenant lit un manuel officiel publié sur LAHAThèque.
2. **Source Propre Fichier BYOD (`document_url` + `document_title`) :** L'apprenant lit un support de cours PDF interne hébergé sur vos propres serveurs (ou cloud S3).

L'interface de liseuse, la protection DRM (filigrane dynamique, blocage anti-capture), les thèmes de marque, les quiz et les Webhooks fonctionnent **de façon 100% identique** quel que soit le type de source.

---

## 2. Diagramme d'Architecture Unifié

```mermaid
flowchart TD
    A[Votre Serveur Backend LMS] -->|1. POST /api/v1/oauth2/token/| B[Jeton Bearer Scope: catalog:read + reader:byod]
    
    B --> C{Quel document diffuser ?}
    
    C -->|Manuel du Catalogue| D[Appel Catalogue GET /api/v1/partner/catalog/]
    D --> E[POST /api/v1/reader/sessions/ avec book_id + theme]
    
    C -->|Cours Interne BYOD| F[POST /api/v1/reader/sessions/ avec document_url + theme + quiz]
    
    E --> G[Liseuse Sécurisée LAHAThèque reader_url]
    F --> G
    
    G -->|Webhooks signés HMAC| H[Votre Endpoint Webhook LMS]
```

---

## 3. Personnalisation Visuelle de la Liseuse (Objet `theme`)

Quel que soit le type de document (Catalogue officiel ou fichier BYOD interne), vous pouvez injecter l'objet `theme` pour personnaliser l'interface :

### Propriétés de l'objet `theme` :

| Propriété | Type | Format / Contrainte | Rôle & Emplacement |
| :--- | :--- | :--- | :--- |
| `brand_name` | String | 2 à 50 caractères | Nom de votre établissement ou marque en haut à gauche. |
| `brand_logo_url` | String (URL HTTPS) | PNG transparent ou SVG (hauteur 28-36px) | Logo officiel remplaçant le nom textuel. |
| `primary_color` | String (HEX) | Code HEX 6 car. (ex: `"#1B2A4E"`) | Couleur de fond de la barre d'outils supérieure. |
| `accent_color` | String (HEX) | Code HEX 6 car. (ex: `"#B08D42"`) | Couleur des boutons actifs, switch 3D/Scroll, jauge et quiz. |
| `background_color` | String (HEX) | Code HEX sombre conseillé (ex: `"#0F1A33"`) | Couleur du fond entourant le document. |
| `text_color` | String (HEX) | Code HEX (ex: `"#FFFFFF"`) | Couleur du texte et des icônes de la barre d'outils. |
| `border_color` | String (HEX) | Code HEX (ex: `"#2E3F66"`) | Couleur des séparateurs de fenêtres et tiroirs. |

```json
{
  "theme": {
    "brand_name": "Université d'Abomey-Calavi",
    "brand_logo_url": "https://uac.bj/assets/logo.png",
    "primary_color": "#1B2A4E",
    "accent_color": "#B08D42",
    "background_color": "#0F1A33",
    "text_color": "#FFFFFF",
    "border_color": "#2E3F66"
  }
}
```

---

## 4. Matrice des Paramètres pour la Création de Session

Pour créer une session de lecture (`POST /api/v1/reader/sessions/`), vous transmettez :

| Champ | Type | Source Catalogue | Source Propre Fichier (BYOD) |
| :--- | :--- | :--- | :--- |
| `book_id` | String (UUID) | **Requis** | *Omettre ou `null`* |
| `document_url` | String (URL HTTPS) | *Omettre ou `null`* | **Requis** |
| `document_title` | String | *Rempli automatiquement* | **Requis** |
| `document_author` | String | *Rempli automatiquement* | Optionnel |
| `external_user_id` | String | **Requis** (Matricule étudiant) | **Requis** (Matricule étudiant) |
| `external_user_name` | String | **Requis** (Nom complet) | **Requis** (Nom complet) |
| `external_user_email` | String | **Requis** (Email) | **Requis** (Email) |
| `user_ip` | String (IP) | **Requis** (IP du lecteur) | **Requis** (IP du lecteur) |
| `return_url` | String (URL) | **Requis** | **Requis** |
| `language` | String (Code ISO 2 car.) | Optionnel (ex: `"fr"`, `"en"`) | *Ignoré* |
| `theme` | Objet | Optionnel | Optionnel |
| `quiz` | Objet | Optionnel | Optionnel |

> **Note sur le paramètre `language` :**
> Si `language` est spécifié (ex: `"en"`), la liseuse s'ouvre d'emblée dans la version linguistique demandée. Si la déclinaison linguistique demandée n'existe pas ou si le paramètre est omis, la liseuse affiche la langue originale de l'ouvrage. Dans tous les cas, l'apprenant conserve la possibilité de basculer dynamiquement entre les langues disponibles directement depuis le sélecteur de langue dans la barre d'outils de la liseuse, avec conservation fluide de son pourcentage de progression de lecture.

---

## 5. Endpoints de l'API Partenaire Mixte

### 5.1 Authentification OAuth2
* `POST /api/v1/oauth2/token/` : Obtention du jeton Bearer.
* `POST /api/v1/oauth2/token/revoke/` : Révocation immédiate d'un jeton compromis.

### 5.2 Catalogue & Abonnements
* `GET /api/v1/partner/catalog/` : Consultation et recherche documentaire multi-critères.
  - **Paramètres de requête (Query Parameters) :**
    - `q` : Recherche plein texte sur les titres, sous-titres, résumés et auteurs.
    - `discipline` : Filtrage par identifiant ou code de discipline.
    - `language` : Filtrage par langue (code ISO à 2 lettres, ex: `fr`, `en`). Ne retourne que les ouvrages disponibles dans la langue sélectionnée (en version originale ou via une déclinaison linguistique traduite).
    - `page` : Numéro de page (optionnel, entier ≥ 1).
    - `page_size` : Taille de page (optionnel, entier, ex: `20`, `50`).
  - **Absence de plafond arbitraire :** Si `page` et `page_size` sont omis, l'API retourne l'intégralité du catalogue d'ouvrages publiés en une seule requête ultra-rapide (< 20 ms via le cache Redis serveur LAHAThèque).
* `GET /api/v1/partner/catalog/{id}/` : Fiche détaillée d'un livre (avec liste des déclinaisons linguistiques disponibles).

**Structure Exhaustive de la Réponse Catalogue (200 OK) :**
```json
{
  "success": true,
  "count": 1,
  "data": [
    {
      "id": "e4a2c5b0-7d12-4e9a-9e11-8a9d12345678",
      "isbn": "978-2-919999-01-2",
      "title": "Droit Constitutionnel des États d'Afrique Francophone",
      "subtitle": "Théorie générale et régimes politiques comparés",
      "author_name": "Prof. Jean-Marc Agossou",
      "author": "Prof. Jean-Marc Agossou",
      "authors": [
        {
          "id": "uuid-auteur-1",
          "first_name": "Jean-Marc",
          "last_name": "Agossou",
          "full_name": "Jean-Marc Agossou"
        }
      ],
      "discipline_name": "Droit & Sciences Politiques",
      "publisher_name": "Éditions LAHA",
      "institution_name": "Université d'Abomey-Calavi",
      "country": "BJ",
      "format_type": "pdf",
      "page_count": 348,
      "sample_pages_count": 15,
      "publication_date": "2026-01-15",
      "language": "fr",
      "available_languages": ["fr", "en"],
      "languages": [
        {
          "code": "fr",
          "label": "Français",
          "is_original": true
        },
        {
          "code": "en",
          "label": "English",
          "is_original": false
        }
      ],
      "has_audio": false,
      "has_audio_version": false,
      "price_audio": null,
      "summary": "Ouvrage de référence sur les institutions républicaines...",
      "status": "published",
      "price_digital": 5000.0,
      "price_paper": 8500.0,
      "is_paper_available": true,
      "is_owned": false,
      "has_digital_access": false,
      "cover_url": "https://lahatheque.com/api/bff/catalog/books/e4a2c5b0-7d12-4e9a-9e11-8a9d12345678/cover/"
    }
  ]
}
```

> **Sémantique M2M des champs `is_owned` et `has_digital_access` :**
> Dans le contexte des appels partenaires Machine-to-Machine (M2M), ces deux booléens sont systématiquement positionnés à `false`. En effet, l'accès des étudiants partenaires est géré soit au niveau de votre institution (bouquets souscrits vérifiables via `/bouquets/{id}/check-access/`), soit dynamiquement lors de la génération de session (`POST /api/v1/reader/sessions/`). Ce court-circuit côté serveur neutralise les calculs lourds de droits individuels grand public, prévient les requêtes N+1 en base de données et permet de servir le catalogue en temps réel avec des performances maximales.

* `GET /api/v1/partner/bouquets/` : Liste des bouquets d'institution disponibles.
* `GET /api/v1/partner/bouquets/{offering_id}/check-access/?book_id={id}` : Contrôle des droits bouquet.
* `GET /api/v1/partner/stats/usage/` : Statistiques de consultation campus.

### 5.3 Moteur Liseuse & Sessions
* `POST /api/v1/reader/sessions/` : Création de session (soit `book_id`, soit `document_url`, avec paramètre optionnel `language`).
* `GET /api/v1/reader/sessions/{id}/` : État, progression et note d'un lecteur en temps réel.
* `DELETE /api/v1/reader/sessions/{id}/` : Interruption / révocation instantanée d'une session.

### 5.4 Haute Performance & Cache Redis Côté Serveur (Zéro Configuration Partenaire)

L'API Partenaire LAHAThèque intègre un mécanisme d'accélération par **cache Redis en mémoire géré intégralement sur les serveurs LAHAThèque**.

* **Aucun composant Redis à installer chez le partenaire :** Votre serveur applicatif (LMS, CMS, backend SaaS) effectue de simples requêtes HTTP REST standard. Il n'a aucunement besoin d'héberger, configurer ou administrer d'instance Redis.
* **Durée de mise en cache (TTL) :** Les résultats du catalogue sont mis en cache pendant **15 minutes (900 secondes)** par combinaison de filtres (`q`, `discipline`, `language`, `page`, `page_size`).
* **Invalidation automatique en temps réel :** Dès qu'un administrateur ou un chef maquettiste publie un nouvel ouvrage, dépose une nouvelle traduction ou met à jour une métadonnée sur LAHAThèque, le cache serveur est immédiatement purgé. Vos requêtes reçoivent systématiquement un catalogue à jour sans latence.
* **Performances constatées :** Grâce au préchargement relationnel (`select_related` / `prefetch_related`) et au cache Redis, le temps de réponse moyen pour un appel catalogue complet est de **10 à 25 ms**, garantissant un affichage instantané de vos bibliothèques même en période de pointe.

---

## 6. Exemple d'Intégration Complète Unifiée (Multi-Langages)

### 6.1 Python (3.10+)

```python
import time
import requests

class LahathequeUnifiedClient:
    def __init__(self, client_id: str, client_secret: str, base_url: str = "https://lahatheque.com/api/v1"):
        self.client_id = client_id
        self.client_secret = client_secret
        self.base_url = base_url
        self.token = None
        self.token_expiry = 0

    def _get_token(self) -> str:
        if not self.token or time.time() >= (self.token_expiry - 60):
            res = requests.post(f"{self.base_url}/oauth2/token/", data={
                "grant_type": "client_credentials",
                "client_id": self.client_id,
                "client_secret": self.client_secret,
            }, timeout=10)
            res.raise_for_status()
            data = res.json()
            self.token = data["access_token"]
            self.token_expiry = time.time() + data.get("expires_in", 36000)
        return self.token

    def _headers(self):
        return {
            "Authorization": f"Bearer {self._get_token()}",
            "Content-Type": "application/json"
        }

    # 1. Recherche Catalogue (accélérée par le cache Redis serveur LAHAThèque)
    def search_books(
        self,
        query: str = "",
        discipline: str = "",
        language: str = "",
        page: int = None,
        page_size: int = None
    ) -> list:
        params = {}
        if query: params["q"] = query
        if discipline: params["discipline"] = discipline
        if language: params["language"] = language
        if page is not None: params["page"] = page
        if page_size is not None: params["page_size"] = page_size

        res = requests.get(f"{self.base_url}/partner/catalog/", headers=self._headers(), params=params, timeout=10)
        res.raise_for_status()
        return res.json()["data"]

    # 2. Ouvrir un livre du Catalogue LAHAThèque (avec choix de langue optionnel)
    def open_catalog_book(
        self,
        book_id: str,
        student: dict,
        return_url: str,
        theme: dict = None,
        language: str = None
    ) -> str:
        payload = {
            "book_id": book_id,
            "external_user_id": student["id"],
            "external_user_name": student["name"],
            "external_user_email": student["email"],
            "user_ip": student["ip"],
            "return_url": return_url,
        }
        if theme: payload["theme"] = theme
        if language: payload["language"] = language

        res = requests.post(f"{self.base_url}/reader/sessions/", json=payload, headers=self._headers(), timeout=10)
        res.raise_for_status()
        return res.json()["data"]["reader_url"]

    # 3. Ouvrir votre propre document interne (BYOD)
    def open_custom_document(
        self,
        doc_url: str,
        doc_title: str,
        student: dict,
        return_url: str,
        theme: dict = None,
        quiz: dict = None
    ) -> str:
        payload = {
            "document_url": doc_url,
            "document_title": doc_title,
            "external_user_id": student["id"],
            "external_user_name": student["name"],
            "external_user_email": student["email"],
            "user_ip": student["ip"],
            "return_url": return_url,
        }
        if theme: payload["theme"] = theme
        if quiz: payload["quiz"] = quiz
            
        res = requests.post(f"{self.base_url}/reader/sessions/", json=payload, headers=self._headers(), timeout=10)
        res.raise_for_status()
        return res.json()["data"]["reader_url"]
```

---

### 6.2 TypeScript / Node.js

```typescript
import axios, { AxiosInstance } from 'axios';

export interface StudentPayload {
  id: string;
  name: string;
  email: string;
  ip: string;
}

export interface ReaderTheme {
  brand_name?: string;
  brand_logo_url?: string;
  primary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  border_color?: string;
}

export interface CatalogSearchParams {
  query?: string;
  discipline?: string;
  language?: string; // "fr" | "en"
  page?: number;
  page_size?: number;
}

export class LahathequeUnifiedSDK {
  private api: AxiosInstance;
  private token: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(
    private clientId: string,
    private clientSecret: string,
    private baseUrl: string = 'https://lahatheque.com/api/v1'
  ) {
    this.api = axios.create({ baseURL: this.baseUrl });
  }

  private async getAccessToken(): Promise<string> {
    const now = Date.now() / 1000;
    if (!this.token || now >= this.tokenExpiresAt - 60) {
      const res = await this.api.post('/oauth2/token/', new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.clientId,
        client_secret: this.clientSecret,
      }));
      this.token = res.data.access_token;
      this.tokenExpiresAt = now + (res.data.expires_in || 36000);
    }
    return this.token;
  }

  private async getAuthHeaders() {
    const token = await this.getAccessToken();
    return { Authorization: `Bearer ${token}` };
  }

  // Catalogue multi-critères avec filtre de langue et pagination optionnelle
  async searchCatalog(params: CatalogSearchParams = {}) {
    const headers = await this.getAuthHeaders();
    const queryParams: Record<string, any> = {};
    if (params.query) queryParams.q = params.query;
    if (params.discipline) queryParams.discipline = params.discipline;
    if (params.language) queryParams.language = params.language;
    if (params.page !== undefined) queryParams.page = params.page;
    if (params.page_size !== undefined) queryParams.page_size = params.page_size;

    const res = await this.api.get('/partner/catalog/', { headers, params: queryParams });
    return res.data.data;
  }

  // Ouvrir un livre du Catalogue (avec choix de langue d'ouverture optionnel)
  async openCatalogBook(
    bookId: string,
    student: StudentPayload,
    returnUrl: string,
    theme?: ReaderTheme,
    language?: string
  ): Promise<string> {
    const headers = await this.getAuthHeaders();
    const payload: Record<string, any> = {
      book_id: bookId,
      external_user_id: student.id,
      external_user_name: student.name,
      external_user_email: student.email,
      user_ip: student.ip,
      return_url: returnUrl,
    };
    if (theme) payload.theme = theme;
    if (language) payload.language = language;

    const res = await this.api.post('/reader/sessions/', payload, { headers });
    return res.data.data.reader_url;
  }

  // Ouvrir un fichier propre (BYOD)
  async openCustomPdf(
    docUrl: string,
    docTitle: string,
    student: StudentPayload,
    returnUrl: string,
    theme?: ReaderTheme,
    quizConfig?: any
  ): Promise<string> {
    const headers = await this.getAuthHeaders();
    const payload: Record<string, any> = {
      document_url: docUrl,
      document_title: docTitle,
      external_user_id: student.id,
      external_user_name: student.name,
      external_user_email: student.email,
      user_ip: student.ip,
      return_url: returnUrl,
    };
    if (theme) payload.theme = theme;
    if (quizConfig) payload.quiz = quizConfig;

    const res = await this.api.post('/reader/sessions/', payload, { headers });
    return res.data.data.reader_url;
  }
}
```

---

### 6.3 PHP / Laravel

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class LahathequeUnifiedService
{
    public function __construct(
        protected string $clientId,
        protected string $clientSecret,
        protected string $baseUrl = 'https://lahatheque.com/api/v1'
    ) {}

    protected function token(): string
    {
        return Cache::remember('laha_m2m_token', 35000, function () {
            return Http::asForm()->post("{$this->baseUrl}/oauth2/token/", [
                'grant_type' => 'client_credentials',
                'client_id' => $this->clientId,
                'client_secret' => $this->clientSecret,
            ])->throw()->json('access_token');
        });
    }

    /**
     * Recherche Catalogue avec support des filtres q, discipline, language, page, page_size.
     */
    public function searchCatalog(array $params = []): array
    {
        return Http::withToken($this->token())
            ->get("{$this->baseUrl}/partner/catalog/", $params)
            ->throw()
            ->json('data');
    }

    /**
     * Ouvre une session de lecture sur un ouvrage du catalogue avec langue optionnelle.
     */
    public function openCatalogBook(
        string $bookId,
        array $student,
        string $returnUrl,
        array $theme = [],
        ?string $language = null
    ): string {
        $payload = [
            'book_id' => $bookId,
            'external_user_id' => $student['id'],
            'external_user_name' => $student['name'],
            'external_user_email' => $student['email'],
            'user_ip' => $student['ip'],
            'return_url' => $returnUrl,
        ];
        if (!empty($theme)) $payload['theme'] = $theme;
        if (!empty($language)) $payload['language'] = $language;

        return Http::withToken($this->token())
            ->post("{$this->baseUrl}/reader/sessions/", $payload)
            ->throw()
            ->json('data.reader_url');
    }

    /**
     * Ouvre une session de lecture sur votre propre fichier PDF interne (BYOD).
     */
    public function openCustomPdf(
        string $docUrl,
        string $docTitle,
        array $student,
        string $returnUrl,
        array $theme = [],
        ?array $quiz = null
    ): string {
        $payload = [
            'document_url' => $docUrl,
            'document_title' => $docTitle,
            'external_user_id' => $student['id'],
            'external_user_name' => $student['name'],
            'external_user_email' => $student['email'],
            'user_ip' => $student['ip'],
            'return_url' => $returnUrl,
        ];
        if (!empty($theme)) $payload['theme'] = $theme;
        if ($quiz) $payload['quiz'] = $quiz;

        return Http::withToken($this->token())
            ->post("{$this->baseUrl}/reader/sessions/", $payload)
            ->throw()
            ->json('data.reader_url');
    }
}
```

---

## 7. Matrice Complète des Erreurs & Dépannage Pas-à-Pas

| Code HTTP | Message d'erreur | Pourquoi cette erreur survient | Que vérifier exactement ? | Action Corrective Immédiate |
| :--- | :--- | :--- | :--- | :--- |
| **400** | `L'URL de redirection n'est pas autorisée` | Le domaine passé dans `return_url` ne figure pas dans votre liste d'origines approuvées. | Vérifiez le protocole (`https://`), le nom de domaine exact et les sous-domaines. | Ajoutez votre domaine (ex: `https://mon-lms.com` ou `*` pour tous vos tests) dans `/admin/api`. |
| **400** | `Type de source de document manquant` | Vous n'avez envoyé ni `book_id`, ni le couple `document_url` + `document_title`. | Vérifiez les clés JSON de votre requête. | Fournissez soit un `book_id` (Catalogue), soit `document_url` + `document_title` (BYOD). |
| **400** | `unsupported_grant_type` | Le paramètre `grant_type` n'est pas `client_credentials`. | Vérifiez votre appel d'authentification POST OAuth2. | Transmettez `grant_type=client_credentials`. |
| **401** | `invalid_client` ou `Identifiants client invalides` | Le `client_id` ou le `client_secret` est erroné ou révoqué. | Vérifiez que vous n'avez pas copié le secret masqué (`sec_live_••••`). | Utilisez le bouton **Régénérer le Secret** sur votre console `/admin/api` pour copier la nouvelle clé en clair. |
| **401** | `Jeton d'authentification invalide ou expiré` | Le token Bearer a expiré (validité 10h) ou est manquant. | Vérifiez votre en-tête HTTP `Authorization: Bearer <votre_token>`. | Ré-exécutez un appel vers `/api/v1/oauth2/token/` pour renouveler votre token. |
| **403** | `Accès aux adresses privées interdit (Anti-SSRF)` | L'URL `document_url` pointe vers `localhost`, `127.0.0.1` ou une IP locale privée non routable. | Vérifiez l'URL de votre fichier PDF en mode BYOD. | Utilisez une URL HTTPS publique accessible par nos serveurs (ex: Bucket S3, Cloudflare R2, GCP Storage). |
| **404** | `Ouvrage introuvable dans le catalogue` | Le `book_id` transmis ne correspond à aucun livre publié du catalogue. | Vérifiez l'ID avec `GET /api/v1/partner/catalog/`. | Utilisez un UUID valide d'ouvrage au statut `published`. |
| **422** | `Fichier distant inaccessible ou corrompu` | En mode BYOD, le fichier distant ne peut pas être téléchargé (404, 403 S3, ou fichier non PDF). | Testez l'URL dans une fenêtre privée de votre navigateur sans cookies. | Rendez le bucket accessible en lecture ou utilisez une URL pré-signée HTTPS (presigned URL) valide au moins 2h. |
| **422** | `Fichier distant trop volumineux` | Le PDF dépasse le plafond maximal configuré pour votre compte (ex: 200 Mo). | Vérifiez la taille de votre document PDF. | Compressez votre PDF ou contactez le support pour activer le palier **VIP Illimité (500 Mo)**. |
| **429** | `Quota journalier atteint` ou `Sessions simultanées dépassées` | Votre plateforme a dépassé son quota de requêtes par 24h ou le nombre maximal d'apprenants connectés en même temps. | Lisez l'en-tête de réponse `Retry-After: <secondes>`. | Demandez à l'administrateur d'activer l'option **Accès VIP Illimité**. |
| **504** | `Gateway Timeout` | Le serveur distant hébergeant votre PDF BYOD a mis plus de 20 secondes à répondre. | Vérifiez la bande passante de votre serveur de fichiers. | Utilisez un CDN ou un stockage d'objets haute performance (Cloudflare R2, AWS S3). |

---

## 8. Webhooks & Rapprochement Automatique

Tous les événements envoyés par Webhook précisent le `source_type` (`catalog_book` ou `external_url`) ainsi que la `language` active de consultation, ce qui vous permet de tracer l'engagement linguistique et de router les résultats dans vos bases de données partenaires :

### 8.1 Événement d'Ouverture de Session (`reader.session.opened`)

Déclenché dès que l'apprenant accède au lecteur sécurisé :

```json
{
  "event": "reader.session.opened",
  "session_id": "rs_c712e4b0",
  "source_type": "catalog_book",
  "book_id": "e4a2c5b0-7d12-4e9a-9e11-8a9d12345678",
  "language": "fr",
  "external_user_ref": "ETU-8841",
  "timestamp": 1788250000
}
```

### 8.2 Événement de Complétion de Quiz (`reader.quiz.completed`)

```json
{
  "event": "reader.quiz.completed",
  "session_id": "rs_c712e4b0",
  "source_type": "external_url",
  "timestamp": 1788250000,
  "data": {
    "quiz_title": "Évaluation Module 1",
    "score_percent": 85.0,
    "passing_score_percent": 70.0,
    "is_passed": true,
    "external_user_ref": "ETU-8841",
    "answers": [
      {
        "question_id": "q1",
        "question": "Question...",
        "is_correct": true
      }
    ]
  }
}
```

---

## 9. Prise en Charge Transparente des Ouvrages EPUB

LAHAThèque supporte nativement et de manière transparente la diffusion d'ouvrages au format **EPUB** sans nécessiter aucun développement additionnel côté partenaire.

### Comment fonctionne la diffusion EPUB ?
1. **Conversion Vectorielle Côté Serveur :** Lorsqu'un ouvrage publié au format EPUB est ouvert par un étudiant dans la liseuse, le moteur backend LAHAThèque convertit automatiquement l'EPUB en document vectoriel paginé de haute fidélité.
2. **Verrou Distribué Redis & Cache R2 :** La conversion est protégée par un verrou distribué Redis (`lock:epub_convert:<id>`), empêchant toute double exécution concurrente. Le résultat converti est immédiatement sauvegardé sur Cloudflare R2 (`converted_pdfs/...`).
3. **Diffusion Streaming Sécurisée Identique :** Le document converti est ensuite servi via le même pipeline de streaming chiffré par tronçons (HTTP 206) avec filigrane dynamique personnalisé (nom, IP, horodatage) et anti-capture d'écran.
4. **Zéro Impact Partenaire :** Vos intégrations n'ont aucune différence de code à prévoir entre un livre déposé en PDF ou en EPUB : l'appel `POST /api/v1/reader/sessions/` et l'URL de lecture retournée restent rigoureusement identiques.
