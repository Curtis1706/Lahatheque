# Tasks: DRM, Protection de Lecture et Ecrans Front-End

**Branch**: `006-drm-protection-lecture` | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

---

## Phase 1: Setup & Modeles de Donnees Backend

- [x] T001 [P] Enrichir `ProtectionConfig`, `TraceAcces` et `DerivedCacheRegistry` dans `lahatheque-backend/apps/protection/models.py`
- [x] T002 Creer et appliquer les migrations Django (`makemigrations protection` et `migrate`)
- [x] T003 [P] Configurer les reglages de securite (`cryptography`, cles de chiffrement) dans `config/settings/base.py`

---

## Phase 2: Moteur de Filigrane PyMuPDF, Ingestion Agnostique et Chiffrement

- [x] T004 [P] Rediger les tests Pytest unitaires pour le filigrane dans `apps/protection/tests/test_drm_services.py`
- [x] T005 Implementer `WatermarkEngine` reel dans `apps/protection/watermark.py` (filigrane diagonal visible + tatouage invisible)
- [x] T006 Implementer `DocumentSourceAdapter` dans `apps/protection/source_adapter.py` (support R2 interne, URL externe et upload direct)
- [x] T007 Implementer `EncryptionService` et `DerivedMaterializer` dans `apps/protection/`

---

## Phase 3: Streaming Range Requests Django & BFF Next.js

- [x] T008 [P] Rediger les tests Pytest pour le streaming Range 206
- [x] T009 Implementer `BookStreamView` dans `apps/catalog/stream_views.py` (support RFC 7233 Range, verification `AccessService`, serving derive en 206 et insertion `TraceAcces`)
- [x] T010 Corriger `TraceAccesViewSet` dans `apps/protection/views.py` pour persister systematiquement les traces en base et exposer l'audit
- [x] T011 Implementer le Route Handler BFF dans `lahatheque-frontend/app/api/bff/catalog/books/[id]/stream/route.ts` relayant le cookie `laha_access` et l'en-tete Range vers Django

---

## Phase 4: Integration Front-End & Lecteur Universel

- [x] T012 Remplacer l'usage de `/api/pdf` par le flux BFF `/api/bff/catalog/books/[id]/stream/` dans `app/catalog/reader/[id]/page.tsx`
- [x] T013 Connecter `FlipBook.tsx` (mode immersion 3D) et le viewer normal vertical sur le flux Range securise
- [x] T014 Integrer le composant de securite client `ReaderSecurity.tsx` (anti-copie, anti-print, blocage clic droit, `@media print`)

---

## Phase 5: Ecrans Front-End Dashboards (Workflow /build-lahatheque-screen)

- [x] T015 [US3] Implementer l'ecran d'audit legal `TraceAcces` dans `app/(dashboard)/admin/security/traces/page.tsx` (mobile-first, tokens CSS sémantiques)
- [x] T016 [US3] Implementer l'ecran de configuration globale DRM dans `app/(dashboard)/admin/settings/drm/page.tsx`
- [x] T017 [US3] Implementer le panneau de configuration DRM par ouvrage pour l'editeur dans `app/(dashboard)/publisher/catalog/[id]/protection/page.tsx`

---

## Phase 6: Verification & Tests Pytest

- [x] T018 Verifier qu'aucun PDF brut non filigrane ne quitte le serveur et que les requetes 206 repondent en < 50 ms
- [x] T019 Executer la suite de tests Pytest (`pytest apps/protection/tests/`)
- [x] T020 Verifier la conformite stricte au format `{ "success": boolean, "data": {}, "error": null }` et l'accessibilite mobile sous 400px
