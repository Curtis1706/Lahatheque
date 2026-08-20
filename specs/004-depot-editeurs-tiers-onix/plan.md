# Technical Plan: Module 4 - Espace Éditeur Tiers & Synchronisation ONIX

**Feature Branch**: `004-depot-editeurs-tiers-onix`  
**Created**: 2026-08-20  
**Stack**: Next.js 15+ (App Router), TypeScript Strict, Tailwind CSS, Django 5.x REST Framework  
**Règles Visuelles**: `.agents/AGENTS.md` (Zéro émoji, Lucide React, tokens sémantiques `bg-navy`, `bg-gold`, `border-border`, feedback d'attente animé sur 100% des actions).

---

## 1. Arborescence Frontend des Routes & Pages (`app/(dashboard)/publisher/`)

```
app/(dashboard)/publisher/
├── layout.tsx                     # AuthGuard(requiredRoles: ["publisher", "admin", "super_admin"])
├── page.tsx                       # Vue d'ensemble : 4 KPI Cards, raccourcis, parutions récentes
├── catalog/
│   ├── page.tsx                   # Catalogue éditeur : recherche, filtre discipline/statut, BookCover3D
│   ├── [id]/
│   │   └── page.tsx               # Détail d'un ouvrage : métadonnées, timeline 5 étapes, stats de lecture
│   ├── new/
│   │   └── page.tsx               # Formulaire multi-étapes de dépôt unitaire (fichiers, métadonnées, DRM)
│   └── batch/
│       └── page.tsx               # Import de catalogue en masse (ONIX 3.0 / CSV / ZIP) avec rapport syntaxique
├── submissions/
│   └── page.tsx                   # Suivi direct des dépôts et circuit de validation par l'équipe LAHA
├── royalties/
│   └── page.tsx                   # Ventes, taux contractuel de redevances, bordereaux PDF & demande de virement
├── stats/
│   └── page.tsx                   # Statistiques détaillées de consultation, téléchargements et lectorat
├── api/
│   └── page.tsx                   # Clés API REST : génération Client ID/Secret, rotation et documentation
├── logs/
│   └── page.tsx                   # Traçabilité & Audit DRM : logs d'accès, watermarking, géolocalisation
└── profile/
    └── page.tsx                   # Profil Maison d'Édition, Mandat, Coordonnées Bancaires & Sécurité
```

---

## 2. Composants Features & 21st.dev MCP (`components/features/publisher/`)

| Composant | Rôle & Interaction | Source / Inspiration |
| :--- | :--- | :--- |
| `ValidationTimeline` | Stepper 5 étapes (Dépôt -> Auto Check -> Examen LAHA -> Notification -> Publication) | 21st.dev `[id: 7710]` *Order History* |
| `FileDropzone` | Zone de glisser-déposer avec barre de progression simulée et vérification d'extension | 21st.dev `[id: 1042]` *Dropzone Upload* |
| `OnixReportViewer` | Carte détaillée de diagnostic ONIX avec badges vert/rouge ligne par ligne | 21st.dev `[id: 1109]` *Diagnostic Table* |
| `ApiKeyGeneratorModal` | Modale de génération de clé avec bouton copier dans presse-papier et avertissement | 21st.dev `[id: 8840]` *API Key Modal* |
| `RevokeApiKeyModal` | Modale de confirmation explicite avant révocation définitive d'une clé API | Composant Modal système |
| `WithdrawDepositModal` | Modale de confirmation avant retrait ou archivage d'un manuscrit déposé | Composant Modal système |
| `BookCover3D` | Rendu 3D de la couverture avec tranche de livre réaliste et reflets | `components/ui/book-cover-3d.tsx` |

---

## 3. Matrice d'Intuitivité & Retours Visuels Systématiques

Pour garantir une expérience produit de haut niveau, **aucun clic ne doit rester silencieux** :

1. **États de Chargement (Loading)** :
   - Toute page ou vue de données affiche un **Skeleton** épousant fidèlement les proportions du tableau ou de la grille finale.
   - Jamais de spinner générique centré qui déforme le layout.
2. **Actions Asynchrones sur Boutons (Submitting / Saving)** :
   - Le bouton déclencheur passe immédiatement en état `disabled={loading}`.
   - Affichage d'un spinner vectoriel rotatif Lucide (`w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin`).
   - Le libellé change si pertinent (ex: *Enregistrement en cours...*).
3. **Notifications Toasts (Sonner)** :
   - Succès : `toast.success("Message explicite et clair")`.
   - Erreur : `toast.error("Explication du problème + action corrective")`.
   - Info : `toast.info("Copie effectuée / Action enregistrée")`.
4. **Actions Destructrices** :
   - Modale de confirmation obligatoire (Révocation de clé, Retrait de dépôt).
   - Bouton de confirmation en rouge sémantique (`bg-rose-600 hover:bg-rose-700 text-white`).

---

## 4. Endpoints Django Backend & Mapping BFF Next.js

| Méthode | Route BFF Next.js | Endpoint Django Backend | Rôle |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/bff/publishers/kpis/` | `/api/v1/publishers/kpis/` | KPIs globaux (ouvrages, validations, revenus, redevances) |
| `GET` | `/api/bff/publishers/catalog/` | `/api/v1/publishers/catalog/` | Liste filtrée des ouvrages de l'éditeur |
| `GET` | `/api/bff/publishers/catalog/<pk>/` | `/api/v1/publishers/catalog/<pk>/` | Fiche détaillée d'un ouvrage et de sa timeline |
| `POST` | `/api/bff/publishers/deposits/` | `/api/v1/publishers/deposits/` | Dépôt unitaire d'un nouvel ouvrage |
| `POST` | `/api/bff/publishers/deposits/batch/` | `/api/v1/publishers/deposits/batch/` | Téléversement d'un lot ONIX 3.0 / ZIP / CSV |
| `GET` | `/api/bff/publishers/royalties/` | `/api/v1/publishers/royalties/` | Relevés de redevances et bordereaux de règlement |
| `POST` | `/api/bff/publishers/royalties/withdraw/` | `/api/v1/publishers/royalties/withdraw/` | Demande de virement des redevances échues |
| `GET` | `/api/bff/publishers/api-keys/` | `/api/v1/publishers/api-keys/` | Liste des clés API du partenaire |
| `POST` | `/api/bff/publishers/api-keys/` | `/api/v1/publishers/api-keys/` | Création d'une clé API |
| `DELETE` | `/api/bff/publishers/api-keys/<pk>/` | `/api/v1/publishers/api-keys/<pk>/` | Révocation d'une clé API |
| `GET` | `/api/bff/publishers/audit-logs/` | `/api/v1/publishers/audit-logs/` | Journal des accès et traces DRM |
| `GET` | `/api/bff/publishers/profile/` | `/api/v1/publishers/profile/` | Profil entreprise, NIF, RCCM, banque, mandat |
| `PATCH` | `/api/bff/publishers/profile/` | `/api/v1/publishers/profile/` | Mise à jour des coordonnées entreprise |

---

## 5. Plan de Vérification & Tests

1. **Vérification TypeScript** : `npx tsc --noEmit --skipLibCheck` doit retourner 0 erreur.
2. **Audit Visuel** :
   - Zéro code hexadécimal en dur dans les classes CSS.
   - Zéro émoji dans l'ensemble des fichiers `.tsx` et `.ts`.
   - Adaptation mobile-first vérifiée sous 400px de large.
