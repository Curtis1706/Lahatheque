# Plan Technique: Module 8 - Administration Globale, Tarification, Supervision et Relances

**Feature**: `008-administration-supervision-globale`  
**Architecture**: Django 5.2 / DRF + Celery Beat + Next.js 16 App Router  
**Source Métier**: Cahier des charges LAHAThèque v3.2 (Sections 1 & 15)

---

## 1. Modélisation Backend (`apps/reporting` & `apps/catalog`)

### 1.1. Modèle `ConfigurationPlateformeGlobale`
- `prix_defaut_numerique_xof` : `DecimalField(max_digits=10, decimal_places=2, default=3000.00)`
- `prix_defaut_papier_xof` : `DecimalField(max_digits=10, decimal_places=2, default=5000.00)`
- `watermark_texte_defaut` : `CharField(max_length=255, default='LAHAThèque • Document Protégé')`
- `watermark_opacite_defaut` : `FloatField(default=0.15)`
- `delai_relance_depots_jours` : `IntegerField(default=7)`
- `delai_relance_impayes_jours` : `IntegerField(default=7)`

### 1.2. Modèle `RelanceLog`
- `type_relance` : `CharField(choices=['depot_en_attente', 'facture_impayee', 'abonnement_expiration'])`
- `destinataire_email` : `EmailField()`
- `destinataire_telephone` : `CharField(max_length=30, blank=True)`
- `statut` : `CharField(choices=['envoye', 'echec', 'ouvert'], default='envoye')`
- `payload` : `JSONField(default=dict)`
- `date_envoi` : `DateTimeField(auto_now_add=True)`

---

## 2. Tâches Planifiées Celery Beat (`apps/reporting/tasks.py`)

- `task_scan_and_send_deposit_reminders` : Déclenchée chaque matin à 8h00 pour relancer les validateurs sur les maquettes en attente > 7 jours.
- `task_scan_and_send_unpaid_reminders` : Déclenchée chaque matin pour relancer les commandes impayées avec lien Mobile Money.
- `task_scan_and_send_subscription_expiry_reminders` : Déclenchée pour notifier les clients à J-15 et J-3 de la fin de leur abonnement.

---

## 3. Endpoints DRF

- `GET/PATCH /api/v1/admin/settings/global/` : Configuration tarifaire globale et switchs DRM.
- `GET /api/v1/admin/reminders/` : Liste paginée des relances avec filtres par type et statut.
- `POST /api/v1/admin/reminders/trigger-now/` : Déclenchement manuel d'une vague de relances.
- `GET /api/v1/admin/stats/panoramic/` : Agrégation consolidée des KPI (ventes, consultations, revenus).

---

## 4. Écrans Frontend (Next.js 16)

- `/admin` : Tableau de bord panoramique consolidé.
- `/admin/catalog/pricing` : Configuration du prix global et tableau des prix spécifiques par livre.
- `/admin/reminders` : Supervision des 3 flux de relances avec déclenchement manuel et indicateurs de délivrabilité.
- `/admin/settings/drm` : Configuration des paramètres DRM globaux.
