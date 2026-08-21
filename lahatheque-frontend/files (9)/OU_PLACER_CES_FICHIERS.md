# Où placer ces fichiers dans le repo `lahatheque-frontend`

| Fichier fourni ici | Destination exacte dans le repo |
|---|---|
| `student-layout.tsx` | `app/(dashboard)/student/layout.tsx` *(nouveau fichier — n'existait pas)* |
| `student-page.tsx` | `app/(dashboard)/student/page.tsx` *(remplace le fichier existant)* |
| `student-kpi-charts.tsx` | `components/features/student/student-kpi-charts.tsx` *(remplace le fichier existant)* |
| `globals.css` | `app/globals.css` *(remplace le fichier existant — seule la fin du fichier a changé, tout le reste est identique à l'original)* |

## Étapes

1. Copier chaque fichier à l'emplacement indiqué (renommer `student-layout.tsx` → `layout.tsx`, `student-page.tsx` → `page.tsx`, etc. — ils gardent leur nom d'origine une fois dans le bon dossier).
2. `rm -rf .next` (vide le cache Next.js).
3. `npm run dev`.
4. Ouvrir `localhost:3000/student`.

## Vérification faite avant livraison
- `npx tsc --noEmit` : 0 erreur.
- Aucun autre fichier du repo modifié — le dashboard Auteur (`components/features/author/author-kpi-charts.tsx`) continue d'utiliser `activity-card.tsx` / `activity-chart-card.tsx` sans changement.
