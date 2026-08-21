# SCAFFOLDING REPORT — LAHATHÈQUE v3.2

**Date de génération** : 2026-08-03
**Emplacement Workspace** : `c:\Lahathèque`

---

## 1. Structure Backend (`lahatheque-backend/`)
Monolithe modulaire Django 5.2 découpé en 10 applications métier + package commun :
- **`apps/accounts`** : Identités, Rôles, User UUID, MFAConfig, OTP, throttling, services.
- **`apps/partners`** : Institutions, Facultés, Départements, Affiliations étudiants, SSO SAML 2.0.
- **`apps/catalog`** : Ouvrage, BookAuthor, Discipline, Domain, MetadataONIX, R2Storage, Parser ONIX 3.0.
- **`apps/protection`** : ProtectionConfig, TraceAcces, PyMuPDF Watermark & Text Extractor (`services.py`), `lcp_client.py` (HTTP vers serveur externe EDRLab).
- **`apps/publishers_portal`** : Publisher, SubmissionDraft, ValidationWorkflowStep, permissions métier.
- **`apps/rights`** : AuthorRight, RightTerritory, RoyaltyRate, RoyaltyCalculation, RoyaltyPayoutLine, validation pool 100%.
- **`apps/commerce`** : Currency (XOF/XAF/CDF), SubscriptionPlan, Subscription, PaymentTransaction, Moneroo/Stripe.
- **`apps/ai_engine`** : AiClassificationTask, abstraction AI provider, Celery tasks.
- **`apps/audio`** : AudioTrack, client Cloudflare Stream.
- **`apps/reporting`** : InstitutionAnalytics, Notifications, Tâches Celery/Resend email.
- **`common/`** : StandardResultsSetPagination, exceptions, middlewares.

---

## 2. Structure Frontend (`lahatheque-frontend/`)
Application Next.js App Router (TypeScript, Tailwind CSS) :
- **Pages Publiques (SSR/ISR)** : `/`, `/catalog`, `/catalog/[id]`
- **Authentification & BFF** : `/login`, `/register`, `/api/auth/session/route.ts` (JWT HttpOnly)
- **Middleware Global** : `lahatheque-frontend/proxy.ts` (Proxy Router Next.js 16)
- **Dashboards par rôle** : `/student`, `/teacher`, `/university`, `/publisher`, `/author`, `/legal-reviewer`, `/layout-artist`, `/admin`, `/super-admin`
- **Lecteur protégé** : `/catalog/reader/[id]` avec `usePdfReaderSecurity` et `useAnnotations`
- **Composants UI** : `GuideViewer`, `TiptapEditor`, `AuthGuard`

---

## 3. Éléments réutilisés depuis LahaAcademia (`c:\lahaacademia`)

| Fichier Source (LahaAcademia) | Emplacement Cible (LAHAThèque) | Statut |
|---|---|---|
| `backend/media/r2_storage.py` | `lahatheque-backend/apps/catalog/storage.py` | Copié / Intégré |
| `backend/core/throttling.py` | `lahatheque-backend/apps/accounts/throttling.py` | Copié / Intégré |
| `backend/accounts/services.py` | `lahatheque-backend/apps/accounts/services.py` | Copié / Intégré |
| `backend/payments/moneroo_client.py` | `lahatheque-backend/apps/commerce/moneroo_client.py` | Copié / Intégré |
| `backend/payments/webhooks.py` | `lahatheque-backend/apps/commerce/webhooks.py` | Copié / Intégré |
| `backend/media/stream_client.py` | `lahatheque-backend/apps/audio/stream_client.py` | Copié / Intégré |
| `backend/media/views.py` | `lahatheque-backend/apps/audio/views.py` | Copié / Intégré |
| `backend/notifications/services.py` | `lahatheque-backend/apps/reporting/services.py` | Copié / Intégré |
| `backend/notifications/tasks.py` | `lahatheque-backend/apps/reporting/tasks.py` | Copié / Intégré |
| `backend/Dockerfile` | `lahatheque-backend/Dockerfile` | Copié / Intégré |
| `backend/lahaacademia/settings.py` | `lahatheque-backend/config/settings/base.py` | Porté (CSP, CORS, HSTS, Axes, JWT, Proxy SSL) |
| `backend/requirements.txt` | `lahatheque-backend/requirements/base.txt` | Alignement des versions |
| `backend/core/document_views.py` (`get_pdf_text_all_pages`) | `lahatheque-backend/apps/protection/services.py` | Porté (`get_pdf_text_all_pages`) |
| `frontend/app/api/auth/session/route.ts` | `lahatheque-frontend/app/api/auth/session/route.ts` | Copié / Intégré |
| `frontend/hooks/use-auth.ts` | `lahatheque-frontend/hooks/use-auth.ts` | Copié / Intégré |
| `frontend/components/auth-guard.tsx` | `lahatheque-frontend/components/auth-guard.tsx` | Copié / Intégré |
| `frontend/middleware.ts` | `lahatheque-frontend/proxy.ts` | Converti en Proxy Router Next.js 16 |
| `frontend/app/library/view/[id]/page.tsx` | `lahatheque-frontend/app/catalog/reader/[id]/page.tsx` | Copié / Intégré |
| `frontend/app/library/view/[id]/hooks/usePdfReaderSecurity.ts` | `lahatheque-frontend/app/catalog/reader/[id]/hooks/usePdfReaderSecurity.ts` | Copié / Intégré |
| `frontend/app/library/view/[id]/hooks/useAnnotations.ts` | `lahatheque-frontend/app/catalog/reader/[id]/hooks/useAnnotations.ts` | Copié / Intégré |
| `frontend/components/ui/guide-viewer.tsx` | `lahatheque-frontend/components/ui/guide-viewer.tsx` | Copié / Intégré |
| `frontend/components/admin/tiptap-editor.tsx` | `lahatheque-frontend/components/ui/tiptap-editor.tsx` | Copié / Intégré |
| `frontend/app/(auth)/login/page.tsx` | `lahatheque-frontend/app/(auth)/login/page.tsx` | Copié / Intégré |
