# Implementation Plan: Systeme DRM, Protection de Lecture et Ecrans Front-End

**Branch**: `006-drm-protection-lecture` | **Date**: 2026-08-18 | **Spec**: [spec.md](spec.md)

---

## 1. Summary

Implementation complète de la chaîne de sécurité DRM, du streaming Range 206, de l'adaptateur de sources agnostique et des interfaces front-end d'administration et de lecture :
- **Backend Django** : `DocumentSourceAdapter` (R2, URL externe, Upload), `WatermarkEngine` (PyMuPDF visible/invisible), `EncryptionService` (AES-256-GCM), `DerivedMaterializer`, `BookStreamView` (Range 206 RFC 7233), `TraceAccesView` (audit persistant), et `ProtectionConfigViewSet`.
- **Frontend Next.js** : Route Handler BFF `/api/bff/catalog/books/[id]/stream/route.ts`, Lecteur universel (`FlipBook.tsx` 3D + mode vertical), et écrans d'administration/éditeur conçus selon `/build-lahatheque-screen` (mobile-first, tokens CSS sémantiques).

---

## 2. Technical Stack & Dependencies

- **Backend** : Django 5.x, DRF, `PyMuPDF` (`fitz`), `cryptography` (AES-256-GCM), `requests` (téléchargement sécurisé serveur des URLs externes)
- **Frontend** : Next.js 16 (App Router), `pdfjs-dist` 3.11.174, Framer Motion, Lucide Icons, TailwindCSS
- **Règles Graphiques** : Zéro code hexadécimal en dur (`bg-navy`, `bg-gold`, `border-border`), zéro bordure verticale de sidebar, mobile-first (< 400px).
- **Format JSON unifié** : `{ "success": boolean, "data": object|array, "error": string|null }`.

---

## 3. Structure Complète des Fichiers

### Backend (`lahatheque-backend/`)
```text
apps/protection/
├── models.py                   # ProtectionConfig, TraceAcces, DerivedCacheRegistry
├── watermark.py                # WatermarkEngine réel (PyMuPDF visible + invisible)
├── access_service.py           # Vérification des droits d'accès
├── source_adapter.py           # DocumentSourceAdapter (R2, URL externe, Upload)
├── derived_materializer.py     # Gestionnaire de cache chiffré des dérivés
├── encryption_service.py       # Chiffrement AES-256-GCM
├── serializers.py              # Serializers pour ProtectionConfig et TraceAcces
├── views.py                    # TraceAccesViewSet, ProtectionConfigViewSet
└── urls.py

apps/catalog/
├── views/
│   ├── stream_views.py         # BookStreamView (Range 206)
│   └── text_views.py           # BookTextView (Profil Renforcé)
└── urls.py
```

### Frontend (`lahatheque-frontend/`)
```text
app/api/bff/catalog/books/[id]/stream/route.ts       # Route Handler BFF (Range 206)
app/catalog/reader/[id]/page.tsx                     # Lecteur connecté au flux BFF
components/library/FlipBook.tsx                      # Mode Immersion 3D
components/features/reader/ReaderSecurity.tsx        # Sécurité client (anti-copie/print)
app/(dashboard)/admin/settings/drm/page.tsx          # Écran configuration DRM globale
app/(dashboard)/admin/security/traces/page.tsx       # Écran journal d'audit TraceAcces
app/(dashboard)/publisher/catalog/[id]/protection/page.tsx # Onglet protection éditeur
```
