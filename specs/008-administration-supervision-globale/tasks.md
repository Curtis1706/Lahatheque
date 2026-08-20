# Tasks: Module 8 - Administration Globale, Tarification, Supervision et Relances

**Feature**: `008-administration-supervision-globale`  
**Status**: Ready for Implementation  
**Dependencies**: Django 5.2, Celery 5.6 / Redis 7, Next.js 16 App Router

---

## Phase 1 : Modèles & Tâches Asynchrones (Django & Celery)

- [ ] **T-801** : Créer le modèle `ConfigurationPlateformeGlobale` dans `apps/reporting/models.py` (prix global numérique et papier, paramètres watermark, délais de relance).
- [ ] **T-802** : Créer le modèle `RelanceLog` pour tracer chaque email/SMS de relance automatique émis.
- [ ] **T-803** : Implémenter les 3 tâches Celery Beat (`task_scan_and_send_deposit_reminders`, `task_scan_and_send_unpaid_reminders`, `task_scan_and_send_subscription_expiry_reminders`).
- [ ] **T-804** : Exécuter `python manage.py makemigrations` et `python manage.py migrate`.

---

## Phase 2 : Endpoints DRF & Logique Tarifaire

- [ ] **T-805** : Implémenter `AdminGlobalConfigViewSet` (`GET /api/v1/admin/settings/global/`, `PATCH`) gérant la cascade tarifaire.
- [ ] **T-806** : Implémenter `AdminRemindersViewSet` (`GET /api/v1/admin/reminders/`, `POST /api/v1/admin/reminders/trigger-now/`).
- [ ] **T-807** : Implémenter la vue consolidée des statistiques panoramiques `AdminPanoramicStatsView` (`GET /api/v1/admin/stats/panoramic/`).

---

## Phase 3 : Intégration Frontend (Next.js 16)

- [ ] **T-808** : Connecter la page `/admin/catalog/pricing` pour ajuster le prix global et les prix spécifiques par ouvrage.
- [ ] **T-809** : Connecter la page `/admin/reminders` avec affichage des relances en attente et bouton de déclenchement immédiat.
- [ ] **T-810** : Connecter la page `/admin/settings/drm` pour modifier le texte de filigrane et les restrictions d'impression globales.
- [ ] **T-811** : Valider le respect strict de la charte sémantique sans couleur hexadécimale en dur et la compilation sans erreur `npm run build`.
