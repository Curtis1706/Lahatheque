# 📋 Tasks: Module 3 — Contrats, Droits d'Auteur, Pré-Édition et Relances (Espace Juriste)

**Branch**: `003-contrats-droits-juriste` | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

---

## Phase 1: Modélisation Backend Django (`apps.rights`)
- [ ] T001 [P] Implémenter les modèles `ContratLegal`, `RepartitionDroits`, `AIRoyaltySuggestion`, `PreEditionDossier`, `RelanceEmailJournal` dans `apps/rights/models.py`.
- [ ] T002 Créer et appliquer les migrations Django (`makemigrations rights` & `migrate`).
- [ ] T003 Implémenter le service d'extraction de texte de contrats (`pypdf` et `docx`) avec limite de fichier à 800 Mo.

---

## Phase 2: Endpoints REST & Vues Django (`apps.rights.views`)
- [ ] T004 Implémenter `LegalContractsListView` et `LegalContractDetailView` avec recherche plein texte FTS (`SearchVector`, `SearchQuery`).
- [ ] T005 Implémenter `LegalRoyaltiesBatchView` avec validation atomique stricte `sum(pourcentages) == 100.00%`.
- [ ] T006 Implémenter `LegalAiSuggestionsView` et `LegalAiSuggestionDecisionView` pour approuver/rejeter les suggestions IA.
- [ ] T007 Implémenter `LegalPreEditionsView` et `LegalPreEditionDetailView`.
- [ ] T008 Implémenter `LegalRelancesView` et `LegalRelanceTriggerView` pour les relances automatiques d'impayés et de rapports auteurs.
- [ ] T009 Implémenter `LegalKpisView` pour les 4 sparklines dynamiques et métriques réelles du tableau de bord.
- [ ] T010 Enregistrer tous les endpoints dans `apps/rights/urls.py`.

---

## Phase 3: Services Frontend Next.js (Élimination Totale des Mocks)
- [ ] T011 Mettre à jour `lahatheque-frontend/lib/services/legal.ts` pour supprimer tout import `mock/legal` et connecter directement les endpoints Django via le proxy BFF.
- [ ] T012 Typer strictement toutes les réponses d'API dans `lahatheque-frontend/types/legal.ts`.

---

## Phase 4: Intégration UI & Composants 21st.dev (Mobile-First)
- [ ] T013 Adapter le dashboard principal [`/legal-reviewer`](file:///e:/Lahatheque/lahatheque-frontend/app/(dashboard)/legal-reviewer/page.tsx) avec les 4 cartes KPI dynamiques 21st.dev et alertes temps réel.
- [ ] T014 Intégrer la page GED [`/legal-reviewer/contracts`](file:///e:/Lahatheque/lahatheque-frontend/app/(dashboard)/legal-reviewer/contracts/page.tsx) et recherche plein texte.
- [ ] T015 Intégrer la page de dépôt de contrat [`/legal-reviewer/contracts/new`](file:///e:/Lahatheque/lahatheque-frontend/app/(dashboard)/legal-reviewer/contracts/new/page.tsx) avec `AuthorFileDropzone` (800 Mo) et extraction automatique.
- [ ] T016 Intégrer la fiche détaillée [`/legal-reviewer/contracts/[id]`](file:///e:/Lahatheque/lahatheque-frontend/app/(dashboard)/legal-reviewer/contracts/[id]/page.tsx).
- [ ] T017 Intégrer la gestion des pré-éditions [`/legal-reviewer/pre-editions`](file:///e:/Lahatheque/lahatheque-frontend/app/(dashboard)/legal-reviewer/pre-editions/page.tsx).
- [ ] T018 Intégrer la gestion des redevances [`/legal-reviewer/redevances`](file:///e:/Lahatheque/lahatheque-frontend/app/(dashboard)/legal-reviewer/redevances/page.tsx) avec validation de somme à 100% et modale de suggestion IA.
- [ ] T019 Intégrer le journal des relances [`/legal-reviewer/relances`](file:///e:/Lahatheque/lahatheque-frontend/app/(dashboard)/legal-reviewer/relances/page.tsx) avec déclenchement d'envoi.
- [ ] T020 Créer la page officielle de profil [`/legal-reviewer/profile`](file:///e:/Lahatheque/lahatheque-frontend/app/(dashboard)/legal-reviewer/profile/page.tsx) avec modification du mot de passe réel, avatar et informations d'affiliation.

---

## Phase 5: Validation, Tests & Conformité
- [ ] T021 Exécuter `python manage.py check` (0 erreur Django).
- [ ] T022 Exécuter `npm run build` (100% des routes compilées avec succès, 0 erreur TypeScript).
- [ ] T023 Vérifier le respect des règles absolues (100% tokens CSS sémantiques, 0 hexadécimal en dur, 0 emoji, 21st.dev partout).
