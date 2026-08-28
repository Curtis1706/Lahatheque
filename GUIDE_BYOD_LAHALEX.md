# Manuel d'Intégration Complet : Liseuse Sécurisée LAHAThèque pour LAHALEX

## Diffusion Sécurisée de Documents Juridiques Distants (BYOD — Bring Your Own Document)

Ce guide détaille pas-à-pas comment intégrer le moteur de lecture sécurisée **LAHAThèque** au sein de la plateforme **LAHALEX**. Il est spécialement rédigé pour les équipes techniques et produit de LAHALEX, avec vos identifiants réels, votre charte graphique officielle et l'adresse de l'API de production active **`https://api.lahatheque.com`**.

---

## 1. Vue d'Ensemble & Principe de Fonctionnement

### 1.1 Qu'est-ce que le service de Liseuse LAHAThèque pour LAHALEX ?

LAHAThèque agit comme un **moteur de rendu et de protection DRM déporté** pour vos documents juridiques (Codes, Lois, Jurisprudence, Revues, Traités).

- **Vos fichiers PDF restent chez vous :** Vous n'avez pas besoin de télécharger manuellement vos fichiers sur LAHAThèque. Ils restent hébergés sur vos propres serveurs sécurisés (`https://lahalex.com/...` ou vos buckets cloud).
- **Zéro développement de liseuse :** Vous n'avez aucun composant lourd (lecteur PDF Canvas, flipbook 3D) à développer ou maintenir sur le frontend de LAHALEX.
- **Sécurité juridique & Anti-Fuite :** Le lecteur bloque le clic droit, l'impression, le téléchargement direct et incruste un **filigrane nominatif indélébile** (Nom du juriste, Email, Adresse IP, Date) sur chaque page en surimpression.
- **Marque blanche & Charte LAHALEX :** La liseuse adopte instantanément vos couleurs officielles (`#770D28` et `#B4AB6B`) et le nom **LAHALEX**.

---

### 1.2 Schéma du Parcours Utilisateur & Flux Technique

```
 ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                                     PARCOURS GLOBAL DU JURISTE                                   │
 └──────────────────────────────────────────────────────────────────────────────────────────────────┘
   1. Le juriste consulte une page sur https://lahalex.com et clique sur « Lire le document ».
   2. Le frontend LAHALEX appelle son propre backend (ex: GET /api/documents/123/read).
   3. Le backend LAHALEX contacte l'API LAHAThèque (https://api.lahatheque.com) en 2 sous-étapes :
        a) Obtention du token OAuth2 partenaire (si expiré).
        b) Création de la session avec l'URL du PDF et l'identité du juriste.
   4. LAHAThèque génère une URL de lecture éphémère (ex: https://lahatheque.com/read/eyJh...)
   5. Le juriste est redirigé vers cette URL : la liseuse s'ouvre avec le PDF sécurisé et filigrané.
   6. Lorsque le juriste clique sur « Quitter », il est automatiquement ramené sur https://www.lahalex.com.
```

---

## 2. Vos Identifiants Officiels & Paramètres LAHALEX

Ces identifiants sont actifs en base de données sur l'API **`https://api.lahatheque.com`** :

| Paramètre                   | Valeur Exacte                       | Rôle & Permissions                                       |
| :-------------------------- | :---------------------------------- | :------------------------------------------------------- |
| **Nom Partenaire**          | `LAHALEX`                           | Compte institutionnel enregistré                         |
| **Périmètre d'Accès**       | `VIP Illimité (Vos Fichiers Seuls)` | Liseuse dédiée à vos propres PDF distants                |
| **URL de Base de l'API**    | `https://api.lahatheque.com`        | Serveur API LAHAThèque en production                     |
| **Client ID**               | `laha_client_720575db89261298870ef529a64285dc` | Identifiant public de votre application |
| **Client Secret**           | `sec_live_...729f`                  | Clé secrète de signature (ou régénérable sur /admin/api) |
| **Plafond Requêtes / 24h**  | `Illimité (Sans quota)`             | Zéro restriction d'appels API                            |
| **Lectures Simultanées**    | `Illimité`                          | Aucune limite sur le nombre d'utilisateurs connectés     |
| **Taille Max par Document** | `500 Mo`                            | Adapté aux volumineux traités et recueils juridiques     |
| **Domaines de Redirection** | `Toutes origines acceptées (*)`     | Redirection libre vers n'importe quelle page de votre LMS |
| **Serveurs PDF Autorisés**  | `Tous hébergements acceptés (*)`    | Hébergement libre de vos PDF (vos serveurs, S3, R2, CDN) |

---

## 3. Configuration du Thème Visuel LAHALEX

La liseuse applique automatiquement la palette de votre fichier `globals.css` :

- **Couleur Principale (Barres et En-tête) :** `#770D28` (Bordeaux / Rouge LAHALEX)
- **Couleur d'Accentuation (Boutons actifs, Jauges) :** `#B4AB6B` (Doré LAHALEX)
- **Arrière-plan :** `#FAFAFA`
- **Texte :** `#1A1A1A`
- **Typographie :** SF Pro / Segoe UI / Roboto

L'objet JSON à transmettre dans chaque session est le suivant :

```json
"theme": {
  "brand_name": "LAHALEX",
  "brand_logo_url": "https://www.lahalex.com/logo.png",
  "primary_color": "#770D28",
  "accent_color": "#B4AB6B",
  "background_color": "#FAFAFA",
  "text_color": "#1A1A1A",
  "reader_mode": "double_page_flip",
  "watermark_text": "DOCUMENT OFFICIEL LAHALEX",
  "watermark_opacity": 0.18,
  "allow_download": false,
  "allow_print": false,
  "allow_copy": false
}
```

---

## 4. Implémentation Backend Étape par Étape

Pour ouvrir un document juridique dans la liseuse, votre serveur backend effectue **2 appels HTTPS successifs**.

---

### Étape 1 : Obtenir un Jeton d'Accès OAuth2 (Machine-to-Machine)

Votre serveur échange vos identifiants (`Client ID` et `Client Secret`) contre un jeton Bearer valable 10 heures (36 000 secondes).

#### Requête HTTP

```http
POST https://api.lahatheque.com/api/v1/oauth2/token/
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials&client_id=laha_client_5e5c3e06&client_secret=sec_live_xng70u4wnknofh020br
```

#### Réponse JSON (200 OK)

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 36000,
  "scope": "reader:sessions reader:byod"
}
```

> **Bonne Pratique :** Vous pouvez mettre en cache l'accès `access_token` dans votre serveur (ex: Redis ou cache Laravel/Node) pendant 9 heures afin de ne pas redemander un token à chaque lecture.

---

### Étape 2 : Créer la Session de Lecture Sécurisée

Avec le jeton `access_token`, envoyez les informations du document et de l'utilisateur connecté sur LAHALEX.

#### Requête HTTP

```http
POST https://api.lahatheque.com/api/v1/reader/sessions/
Authorization: Bearer <VOTRE_ACCESS_TOKEN>
Content-Type: application/json

{
  "source_type": "external_url",
  "document_url": "https://lahalex.com/storage/documents/code-civil-2026.pdf",
  "document_title": "Code Civil Béninois & Jurisprudence Récente",
  "document_author": "Éditions Juridiques LAHALEX",
  "external_user_ref": "USER-9481",
  "external_user_name": "Maître Jean Dupont",
  "external_user_email": "j.dupont@cabinet-associes.bj",
  "user_ip": "154.68.24.112",
  "return_url": "https://www.lahalex.com/espace-abonne",
  "ttl_seconds": 7200,
  "theme": {
    "brand_name": "LAHALEX",
    "brand_logo_url": "https://www.lahalex.com/logo.png",
    "primary_color": "#770D28",
    "accent_color": "#B4AB6B",
    "background_color": "#FAFAFA",
    "text_color": "#1A1A1A",
    "reader_mode": "double_page_flip",
    "watermark_text": "LAHALEX • ME JEAN DUPONT",
    "watermark_opacity": 0.18,
    "allow_download": false,
    "allow_print": false,
    "allow_copy": false
  },
  "permissions": {
    "allow_tts": true,
    "allow_annotations": true,
    "allow_quiz": false
  }
}
```

#### Explication Détaillée des Paramètres :

| Champ                 | Type           | Obligatoire | Description & Utilité                                                                    |
| :-------------------- | :------------- | :---------- | :--------------------------------------------------------------------------------------- |
| `source_type`         | `string`       | **Oui**     | Doit valoir `"external_url"` pour vos propres documents.                                 |
| `document_url`        | `string (URL)` | **Oui**     | L'URL HTTPS où votre PDF est téléchargeable (doit commencer par `https://lahalex.com/`). |
| `document_title`      | `string`       | **Oui**     | Le titre affiché dans la barre supérieure de la liseuse.                                 |
| `document_author`     | `string`       | Non         | Le nom de l'auteur ou de l'éditeur (ex: `"LAHALEX"`).                                    |
| `external_user_ref`   | `string`       | **Oui**     | L'identifiant unique du juriste dans votre base LAHALEX (ex: `"USER-9481"`).             |
| `external_user_name`  | `string`       | **Oui**     | Nom complet du juriste (imprimé sur le filigrane anti-capture d'écran).                  |
| `external_user_email` | `string`       | Non         | Email du juriste (traçabilité de sécurité).                                              |
| `user_ip`             | `string (IP)`  | **Oui**     | L'adresse IP réelle de l'utilisateur (ex: `"154.68.24.112"`, gravée sur le filigrane).   |
| `return_url`          | `string (URL)` | **Oui**     | L'URL vers laquelle le lecteur est renvoyé lorsqu'il clique sur « Quitter ».             |
| `ttl_seconds`         | `integer`      | Non         | Durée de validité du lien en secondes (ex: `7200` = 2 heures).                           |
| `theme`               | `object`       | Non         | Personnalisation des couleurs (`#770D28`, `#B4AB6B`) et du filigrane.                    |
| `permissions`         | `object`       | Non         | Activation de la synthèse vocale (`allow_tts`), des annotations (`allow_annotations`).   |

#### Réponse JSON (201 Created)

```json
{
  "success": true,
  "data": {
    "session_id": "9d81d234-a4f1-4c6e-9271-8899aabbccdd",
    "reader_url": "https://lahatheque.com/read/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.session_token_unique",
    "expires_at": "2026-08-19T05:36:00Z",
    "source_type": "external_url",
    "document_title": "Code Civil Béninois & Jurisprudence Récente"
  },
  "error": null
}
```

---

### Étape 3 : Redirection vers la Liseuse

Votre backend transmet l'URL contenue dans `data.reader_url` au navigateur du juriste (ou effectue une redirection HTTP 302).

- Lorsque le juriste arrive sur `https://lahatheque.com/read/...`, le lecteur démarre en mode 3D immersif ou défilement vertical.
- Le document PDF est découpé en flux sécurisé sans exposition du fichier source.
- L'utilisateur peut tourner les pages, zoomer, rechercher du texte ou écouter la lecture vocale.
- Le filigrane dynamique affiche en diagonale : `LAHALEX • ME JEAN DUPONT • 154.68.24.112`.

---

## 5. Exemples d'Intégration Complets par Langage

### 5.1 Exemple en PHP / Laravel

Créez le service `app/Services/LahalexReaderService.php` :

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Exception;

class LahalexReaderService
{
    private string $baseUrl = 'https://api.lahatheque.com';
    private string $clientId = 'laha_client_5e5c3e06';
    private string $clientSecret = 'sec_live_xng70u4wnknofh020br';

    /**
     * Récupère le jeton OAuth2 avec mise en cache automatique de 9h
     */
    public function getAccessToken(): string
    {
        return Cache::remember('lahatheque_partner_token', 32400, function () {
            $response = Http::asForm()->post("{$this->baseUrl}/api/v1/oauth2/token/", [
                'grant_type'    => 'client_credentials',
                'client_id'     => $this->clientId,
                'client_secret' => $this->clientSecret,
            ]);

            if (!$response->successful()) {
                throw new Exception("Erreur OAuth2 LAHAThèque : " . $response->body());
            }

            return $response->json()['access_token'];
        });
    }

    /**
     * Génère l'URL de lecture sécurisée pour un document juridique
     */
    public function generateReaderUrl(
        string $pdfUrl,
        string $documentTitle,
        string $userRef,
        string $userName,
        string $userEmail,
        string $userIp = '127.0.0.1'
    ): string {
        $accessToken = $this->getAccessToken();

        $payload = [
            'source_type'        => 'external_url',
            'document_url'       => $pdfUrl,
            'document_title'     => $documentTitle,
            'document_author'    => 'LAHALEX',
            'external_user_ref'  => $userRef,
            'external_user_name' => $userName,
            'external_user_email'=> $userEmail,
            'user_ip'            => $userIp,
            'return_url'         => 'https://www.lahalex.com/espace-abonne',
            'ttl_seconds'        => 7200, // 2 heures
            'theme' => [
                'brand_name'        => 'LAHALEX',
                'brand_logo_url'    => 'https://www.lahalex.com/logo.png',
                'primary_color'     => '#770D28',
                'accent_color'      => '#B4AB6B',
                'background_color'  => '#FAFAFA',
                'text_color'        => '#1A1A1A',
                'reader_mode'       => 'double_page_flip',
                'watermark_text'    => "LAHALEX • " . mb_strtoupper($userName),
                'watermark_opacity' => 0.18,
                'allow_download'    => false,
                'allow_print'       => false,
                'allow_copy'        => false,
            ],
            'permissions' => [
                'allow_tts'         => true,
                'allow_annotations' => true,
                'allow_quiz'        => false,
            ]
        ];

        $response = Http::withToken($accessToken)
            ->post("{$this->baseUrl}/api/v1/reader/sessions/", $payload);

        if (!$response->successful() || !$response->json('success')) {
            throw new Exception("Erreur création session LAHAThèque : " . $response->body());
        }

        return $response->json('data.reader_url');
    }
}
```

Dans votre contrôleur Laravel `DocumentController.php` :

```php
public function read(Request $request, Document $document, LahalexReaderService $readerService)
{
    $user = $request->user();

    $readerUrl = $readerService->generateReaderUrl(
        pdfUrl: $document->secure_pdf_url, // ex: https://lahalex.com/storage/docs/code-penal.pdf
        documentTitle: $document->title,
        userRef: (string) $user->id,
        userName: $user->name,
        userEmail: $user->email,
        userIp: $request->ip()
    );

    return redirect($readerUrl);
}
```

---

### 5.2 Exemple en Node.js / Express / TypeScript

Créez le module `lahalexReader.ts` :

```typescript
import axios from "axios";

const LAHATHÈQUE_BASE = "https://api.lahatheque.com";
const CLIENT_ID = "laha_client_5e5c3e06";
const CLIENT_SECRET = "sec_live_xng70u4wnknofh020br";

let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiresAt) {
    return cachedToken;
  }

  const params = new URLSearchParams();
  params.append("grant_type", "client_credentials");
  params.append("client_id", CLIENT_ID);
  params.append("client_secret", CLIENT_SECRET);

  const res = await axios.post(
    `${LAHATHÈQUE_BASE}/api/v1/oauth2/token/`,
    params,
    {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    },
  );

  cachedToken = res.data.access_token;
  tokenExpiresAt = now + (res.data.expires_in - 300) * 1000; // Marge de 5 minutes
  return cachedToken!;
}

export interface ReaderRequest {
  pdfUrl: string;
  documentTitle: string;
  userRef: string;
  userName: string;
  userEmail: string;
  userIp: string;
}

export async function createLahalexReaderSession(
  data: ReaderRequest,
): Promise<string> {
  const token = await getAccessToken();

  const response = await axios.post(
    `${LAHATHÈQUE_BASE}/api/v1/reader/sessions/`,
    {
      source_type: "external_url",
      document_url: data.pdfUrl,
      document_title: data.documentTitle,
      document_author: "LAHALEX",
      external_user_ref: data.userRef,
      external_user_name: data.userName,
      external_user_email: data.userEmail,
      user_ip: data.userIp,
      return_url: "https://www.lahalex.com/espace-abonne",
      ttl_seconds: 7200,
      theme: {
        brand_name: "LAHALEX",
        brand_logo_url: "https://www.lahalex.com/logo.png",
        primary_color: "#770D28",
        accent_color: "#B4AB6B",
        background_color: "#FAFAFA",
        text_color: "#1A1A1A",
        reader_mode: "double_page_flip",
        watermark_text: `LAHALEX • ${data.userName.toUpperCase()}`,
        watermark_opacity: 0.18,
        allow_download: false,
        allow_print: false,
        allow_copy: false,
      },
      permissions: {
        allow_tts: true,
        allow_annotations: true,
        allow_quiz: false,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
  );

  if (!response.data.success) {
    throw new Error(`Erreur LAHAThèque: ${response.data.error}`);
  }

  return response.data.data.reader_url;
}
```

Route Express :

```typescript
app.get("/documents/:id/read", async (req, res) => {
  try {
    const document = await getDocumentFromDb(req.params.id);
    const user = req.user;

    const readerUrl = await createLahalexReaderSession({
      pdfUrl: document.fileUrl,
      documentTitle: document.title,
      userRef: user.id,
      userName: user.fullName,
      userEmail: user.email,
      userIp: req.ip || "127.0.0.1",
    });

    res.redirect(readerUrl);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

---

### 5.3 Exemple en Python / FastAPI

```python
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.responses import RedirectResponse
import requests
import time

app = FastAPI()

LAHATHÈQUE_BASE = "https://api.lahatheque.com"
CLIENT_ID = "laha_client_5e5c3e06"
CLIENT_SECRET = "sec_live_xng70u4wnknofh020br"

token_cache = {"access_token": None, "expires_at": 0}


def get_access_token() -> str:
    now = time.time()
    if token_cache["access_token"] and now < token_cache["expires_at"]:
        return token_cache["access_token"]

    resp = requests.post(
        f"{LAHATHÈQUE_BASE}/api/v1/oauth2/token/",
        data={
            "grant_type": "client_credentials",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
        },
        timeout=10,
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=500, detail="Échec authentification LAHAThèque")

    data = resp.json()
    token_cache["access_token"] = data["access_token"]
    token_cache["expires_at"] = now + data["expires_in"] - 300
    return token_cache["access_token"]


@app.get("/documents/{document_id}/read")
def read_document(document_id: str, request: Request):
    # 1. Récupération des infos du document
    pdf_url = f"https://lahalex.com/storage/documents/{document_id}.pdf"
    doc_title = "Traité de Droit Commercial"

    # 2. Utilisateur connecté
    user_name = "Maître Jean Dupont"
    user_email = "j.dupont@cabinet.bj"
    user_ip = request.client.host

    token = get_access_token()

    # 3. Création de session LAHAThèque
    payload = {
        "source_type": "external_url",
        "document_url": pdf_url,
        "document_title": doc_title,
        "document_author": "LAHALEX",
        "external_user_ref": "USER-9481",
        "external_user_name": user_name,
        "external_user_email": user_email,
        "user_ip": user_ip,
        "return_url": "https://www.lahalex.com/espace-abonne",
        "ttl_seconds": 7200,
        "theme": {
            "brand_name": "LAHALEX",
            "brand_logo_url": "https://www.lahalex.com/logo.png",
            "primary_color": "#770D28",
            "accent_color": "#B4AB6B",
            "background_color": "#FAFAFA",
            "text_color": "#1A1A1A",
            "reader_mode": "double_page_flip",
            "watermark_text": f"LAHALEX • {user_name.upper()}",
            "watermark_opacity": 0.18,
            "allow_download": False,
            "allow_print": False,
            "allow_copy": False,
        },
        "permissions": {
            "allow_tts": True,
            "allow_annotations": True,
            "allow_quiz": False,
        },
    }

    session_resp = requests.post(
        f"{LAHATHÈQUE_BASE}/api/v1/reader/sessions/",
        json=payload,
        headers={"Authorization": f"Bearer {token}"},
        timeout=10,
    )

    if session_resp.status_code != 201 or not session_resp.json().get("success"):
        raise HTTPException(status_code=500, detail="Erreur génération liseuse")

    reader_url = session_resp.json()["data"]["reader_url"]
    return RedirectResponse(url=reader_url)
```

---

## 6. Guide de Dépannage & Erreurs Fréquentes

| Code HTTP                        | Cause Probable                       | Comment Résoudre                                                                                                                     |
| :------------------------------- | :----------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- |
| **`400 Bad Request`**            | Paramètre manquant ou invalide.      | Vérifier que `source_type: "external_url"`, `document_url`, `document_title`, `external_user_ref` et `return_url` sont tous fournis. |
| **`401 Unauthorized`**           | Jeton Bearer manquant ou expiré.     | Vérifier l'en-tête `Authorization: Bearer <token>` et réémettre l'appel OAuth2 `/api/v1/oauth2/token/`.                              |
| **`403 Forbidden` (SSRF)**       | Domaine PDF non autorisé.            | Vérifier que votre `document_url` commence bien par `https://lahalex.com/` (autorisé dans votre clé).                                |
| **`403 Forbidden` (Return URL)** | URL de redirection non autorisée.    | S'assurer que `return_url` commence par `https://www.lahalex.com/`.                                                                  |
| **`422 Unprocessable`**          | Le fichier distant est inaccessible. | Vérifier que l'URL du PDF renvoie bien un fichier PDF valide avec code HTTP `200` et en-tête `Content-Type: application/pdf`.        |

---

## 7. Contact & Support Développeur

Pour toute assistance technique ou ajustement de configuration :

- **Tableau de Bord Administrateur :** `https://lahatheque.com/admin/api`
- **Supervision des Sessions en Direct :** `https://lahatheque.com/admin/api/sessions`
- **Logs & Webhooks :** `https://lahatheque.com/admin/api/logs`
