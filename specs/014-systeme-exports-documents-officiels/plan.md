# Implementation Plan: Module 14 - Système Universel d'Exportation & Documents Officiels

**Feature**: `014-systeme-exports-documents-officiels`  
**Stack**: Next.js App Router, TypeScript, jsPDF & jsPDF-AutoTable (ou Moteur Vectoriel Canvas/Blob haute performance), UTF-8 BOM CSV/Excel generator, Word XML Document Engine.

---

## 1. Architecture Technique & Moteur Unifié `lib/services/export-service.ts`

Nous centralisons toute la logique de génération et d'exportation dans un service unifié réutilisable par l'ensemble des 14 boutons de la plateforme :

```
lib/services/export-service.ts
 ├── generateOfficialPdf(options: OfficialPdfOptions): Promise<void>
 │    ├── Dessin vectoriel de l'en-tête officiel LAHAThèque (Logo, IFU, RCCM, Coordonnées)
 │    ├── Cartouche bénéficiaire / client / partenaire
 │    ├── Grille de données stylisée (Titres Navy, Totaux Gold, zébrage subtil)
 │    ├── Signature électronique, mention légale et QR Code de vérification
 │    └── Pagination dynamique "Page X sur Y"
 │
 ├── generateCsvExport<T>(data: T[], filename: string, columnMap: Record<keyof T, string>): void
 │    ├── Insertion du BOM UTF-8 (\uFEFF) pour compatibilité Excel absolue
 │    ├── Échappement des caractères spéciaux, virgules et sauts de ligne
 │    └── Déclenchement automatique du téléchargement Blob
 │
 ├── generateExcelExport(sheets: ExcelSheet[], filename: string): void
 │    └── Format XML Spreadsheet / CSV enrichi multi-colonnes
 │
 └── generateWordDocument(options: WordDocumentOptions): void
      ├── En-tête HTML-Word standard (.doc / .docx compatible)
      ├── Tableaux de bibliographies avec styles typographiques intégrés
      └── Téléchargement direct avec MIME type application/msword
```

---

## 2. Découpage des Tâches par Écran

1. **Service Core** :
   - Création de `lahatheque-frontend/lib/services/export-service.ts` avec typage strict et gestion des 4 formats (PDF, CSV, Excel, Word).
   - Intégration des métadonnées légales et de l'en-tête institutionnel LAHAThèque.

2. **Raccordement Espace Admin (`/admin`)** :
   - [`app/(dashboard)/admin/reports/page.tsx`](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/admin/reports/page.tsx) : Brancher l'export PDF exécutif, CSV données réelles et Excel.
   - [`app/(dashboard)/admin/sales/page.tsx`](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/admin/sales/page.tsx) : Brancher « Exporter le Journal » (CSV/XLSX).
   - [`app/(dashboard)/admin/security/traces/page.tsx`](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/admin/security/traces/page.tsx) : Brancher « Exporter Audit (CSV) ».
   - [`app/(dashboard)/admin/royalties/page.tsx`](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/admin/royalties/page.tsx) : Brancher la génération de bordereaux consolidés.

3. **Raccordement Espace Manager & Logistique (`/manager`)** :
   - [`app/(dashboard)/manager/reports/page.tsx`](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/manager/reports/page.tsx) : Remplacer les toasts temporaires par la génération réelle des rapports PDF et CSV/Excel de stocks et livraisons.

4. **Raccordement Espace Chef Maquettiste (`/chief-layout`)** :
   - [`app/(dashboard)/chief-layout/history/page.tsx`](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/chief-layout/history/page.tsx) : Raccorder l'export CSV de l'historique de validation BAT.

5. **Raccordement Espace Universités & Enseignants (`/university`)** :
   - [`app/(dashboard)/university/royalties/page.tsx`](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/university/royalties/page.tsx) : Brancher le téléchargement du relevé trimestriel officiel PDF.
   - [`components/features/university/bouquet-card.tsx`](file:///e:/Lahatheque/lahatheque-frontend/components/features/university/bouquet-card.tsx) & [`app/(dashboard)/student/university/page.tsx`](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/student/university/page.tsx) : Brancher la génération de bibliographie Word (.doc/.docx).

6. **Raccordement Espace Auteurs & Éditeurs (`/author`, `/publisher`)** :
   - [`app/(dashboard)/author/royalties/page.tsx`](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/author/royalties/page.tsx) & [`app/(dashboard)/publisher/royalties/page.tsx`](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/publisher/royalties/page.tsx) : Brancher le téléchargement du bordereau officiel de redevances PDF certifié.

7. **Raccordement Espace Étudiants & Grossistes (`/student`, `/wholesaler`)** :
   - [`app/(dashboard)/student/orders/page.tsx`](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/student/orders/page.tsx) & [`components/student/orders/OrderDetailModal.tsx`](file:///e:/Lahatheque/lahatheque-frontend/components/student/orders/OrderDetailModal.tsx) : Brancher le téléchargement de la facture PDF officielle.
   - [`app/(dashboard)/wholesaler/orders/[id]/page.tsx`](file:///e:/Lahatheque/lahatheque-frontend/app/%28dashboard%29/wholesaler/orders/%5Bid%5D/page.tsx) : Brancher le téléchargement du bon de commande / facture proforma grossiste B2B.

8. **Validation & Compilation** :
   - `pnpm build` obligatoire avec vérification de 0 régression TypeScript.
