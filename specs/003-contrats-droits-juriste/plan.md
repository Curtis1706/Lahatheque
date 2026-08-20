# 📐 Implementation Plan: Module 3 — Contrats, Droits d'Auteur, Pré-Édition et Relances (Espace Juriste)

**Branch**: `003-contrats-droits-juriste` | **Spec**: [spec.md](spec.md) | **Data Model**: [data-model.md](data-model.md)

---

## 1. 🏗️ Architecture Backend Django (`apps.rights` / `apps.legal`)

### A. Modèles & Base de Données
- Intégration des modèles dans `apps/rights/models.py` (ou `apps/legal/`) :
  - `ContratLegal` avec stockage chiffré Cloudflare R2 (jusqu'à 800 Mo) et index plein texte FTS (`texte_integral_index`).
  - `RepartitionDroits` avec contrainte unique `(ouvrage, beneficiaire)` et vérification de la somme à 100%.
  - `AIRoyaltySuggestion` pour les propositions d'extractions de pourcentages issues des contrats.
  - `PreEditionDossier` pour le suivi des projets éditoriaux amont.
  - `RelanceEmailJournal` pour la traçabilité des relances automatiques d'impayés et de rapports auteurs.

### B. Vues & Endpoints REST Django
1. **GED Contrats** :
   - `GET /api/v1/rights/legal/contracts/?q=&type=&status=` : Recherche FTS et filtrage.
   - `POST /api/v1/rights/legal/contracts/` : Téléversement (jusqu'à 800 Mo) et extraction automatique de texte (`pypdf`, `python-docx`).
   - `GET /api/v1/rights/legal/contracts/<uuid:id>/` : Détails du contrat, texte intégral et clauses.
   - `PATCH /api/v1/rights/legal/contracts/<uuid:id>/` : Mise à jour du statut ou des métadonnées.
2. **Répartition des Droits d'Auteur** :
   - `GET /api/v1/rights/legal/royalties/` : Grilles de répartition par ouvrage.
   - `POST /api/v1/rights/legal/royalties/batch/` : Enregistrement atomique d'une clé de répartition avec validation `sum == 100.00%`.
   - `GET /api/v1/rights/legal/ai-suggestions/` : Liste des suggestions IA en attente.
   - `POST /api/v1/rights/legal/ai-suggestions/<uuid:id>/decide/` : Validation ou rejet d'une suggestion IA.
3. **Dossiers de Pré-Édition** :
   - `GET /api/v1/rights/legal/pre-editions/` : Liste des dossiers de pré-édition.
   - `POST /api/v1/rights/legal/pre-editions/` : Création d'une fiche de pré-édition.
   - `PATCH /api/v1/rights/legal/pre-editions/<uuid:id>/` : Transition de statut et notes.
4. **Relances Automatiques & Débiteurs** :
   - `GET /api/v1/rights/legal/relances/` : Journal des relances et liste des factures impayées.
   - `POST /api/v1/rights/legal/relances/trigger/` : Déclenchement manuel ou planifié d'une vague de relances.
5. **Tableau de Bord & KPIs** :
   - `GET /api/v1/rights/legal/kpis/` : Métriques temps réel (total contrats, suggestions IA en attente, clients débiteurs, relances émises, pré-éditions actives).

---

## 2. 🖥️ Architecture Frontend Next.js 16 (`lahatheque-frontend`)

### A. Élimination Totale des Mocks (`lib/services/legal.ts`)
- Remplacement des données simulées par des appels asynchrones typés vers `/api/bff/legal/*` (avec cookies sécurisés).

### B. Composants UI (100% 21st.dev, Mobile-First, Tokens Sémantiques)
- **`AuthorFileDropzone`** (21st.dev id: 19201) : Dépôt de contrats jusqu'à 800 Mo.
- **`DataTable`** (21st.dev id: 14205) : Tableaux réactifs pour les contrats, pré-éditions, redevances et relances.
- **`ProgressMetricCard`** (21st.dev id: 4894) : 4 cartes KPI du dashboard avec sparklines.
- **`ModalConfirmation`** : Modale d'application des suggestions IA et déclenchement de relances.

### C. Pages du Tableau de Bord Juriste
1. `app/(dashboard)/legal-reviewer/page.tsx` : Dashboard principal avec KPIs et alertes.
2. `app/(dashboard)/legal-reviewer/contracts/page.tsx` : GED Contrats & recherche plein texte FTS.
3. `app/(dashboard)/legal-reviewer/contracts/new/page.tsx` : Dépôt & extraction automatique de contrat.
4. `app/(dashboard)/legal-reviewer/contracts/[id]/page.tsx` : Consultation détaillée d'un contrat.
5. `app/(dashboard)/legal-reviewer/pre-editions/page.tsx` : Fiches de pré-édition.
6. `app/(dashboard)/legal-reviewer/redevances/page.tsx` : Grille de répartition des droits et suggestions IA.
7. `app/(dashboard)/legal-reviewer/relances/page.tsx` : Journal des relances automatiques et gestion des débiteurs.
8. `app/(dashboard)/legal-reviewer/profile/page.tsx` : Profil officiel, photo, affiliation et mot de passe.

---

## 3. 🧪 Plan de Validation & Vérification
1. `python manage.py check` : 0 avertissement.
2. `npm run build` : 100% des routes compilées avec succès.
3. Validation de la somme des droits à 100% (rejet si != 100%).
4. Test de la recherche plein texte sur les contrats.
