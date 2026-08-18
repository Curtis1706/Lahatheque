# Implementation Plan: Administration Globale et Supervision (Super Admin)

**Branch**: `008-administration-supervision-globale` | **Spec**: [spec.md](spec.md)

---

## Technical Context

- **Application Backend**: `apps/core_admin/`
- **Agregations SQL**: Requetes optimisees avec `Count()`, `Sum()`, `Avg()`, `TruncMonth()` pour les statistiques de bord sans charger d'objets en memoire.
- **Permissions**: `IsSuperAdminUser`
- **Format JSON unifie**: `{ "success": boolean, "data": {}, "error": null }`.

---

## Tasks

- [ ] T001 Creer l'application `apps/core_admin/`
- [ ] T002 Modeles `ConfigurationPlateformeGlobale` et `TarificationPaysConfig`
- [ ] T003 Vues d'agregation des statistiques de vente, consultations et utilisateurs par pays
- [ ] T004 Vues API pour la mise a jour des parametres globaux de tarification et de DRM
- [ ] T005 Tests Pytest de restriction d'acces Super Admin (403 pour autres roles)
