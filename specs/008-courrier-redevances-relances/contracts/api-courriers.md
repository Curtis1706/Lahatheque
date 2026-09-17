# Contrats d'API : Gestion des Courriers Officiels LAHAThèque

**Feature** : `008-courrier-redevances-relances`
**Date** : 2026-09-17
**Base URL** : `/api/v1/rights/legal/courriers/`

Toutes les réponses respectent la structure unifiée obligatoire :
```json
{
  "success": true,
  "data": {},
  "error": null
}
```

---

## 1. Lister les courriers officiels

- **Méthode** : `GET`
- **Endpoint** : `/api/v1/rights/legal/courriers/`
- **Paramètres de requête (Query params)** :
  - `status` (optionnel) : `draft`, `validated`, `canceled`, `sent`
  - `category` (optionnel) : `royalty_author`, `royalty_university`, `royalty_publisher`, `debt_reminder`
  - `search` (optionnel) : Recherche textuelle sur `recipient_name`, `reference`, `subject`
  - `ordering` (optionnel) : `-created_at` par défaut
- **Réponse Succès (200 OK)** :
```json
{
  "success": true,
  "data": [
    {
      "id": "c1f7a4e2-892b-42d3-9876-123456789abc",
      "reference": "LTQ-CR-202609-0001",
      "category": "royalty_university",
      "category_label": "Redevance Université",
      "status": "draft",
      "status_label": "Brouillon",
      "recipient_type": "university",
      "recipient_id": "u-42",
      "recipient_name": "Université Nationale d'Agriculture",
      "recipient_email": "contact@una.bj",
      "period": "Septembre 2026",
      "amount": 1800.0,
      "currency": "FCFA",
      "subject": "Bordereau officiel de redevances conventionnées — Septembre 2026",
      "body_text": "Monsieur le Recteur,\n\nNous avons l'honneur de vous transmettre le décompte...",
      "has_pdf": true,
      "pdf_url": "/api/v1/rights/legal/courriers/c1f7a4e2-892b-42d3-9876-123456789abc/preview-pdf/",
      "created_at": "2026-09-17T08:30:00Z",
      "validated_at": null,
      "sent_at": null,
      "canceled_at": null
    }
  ],
  "error": null
}
```

---

## 2. Initialiser un courrier (Action "Préparer le courrier")

- **Méthode** : `POST`
- **Endpoint** : `/api/v1/rights/legal/courriers/prepare/`
- **Corps de la requête (Request Body)** :
```json
{
  "category": "royalty_university",
  "recipient_type": "university",
  "recipient_id": "u-42",
  "period_type": "monthly",
  "year": 2026,
  "month": 9,
  "quarter": null
}
```
- **Réponse Succès (201 Created)** :
```json
{
  "success": true,
  "data": {
    "id": "c1f7a4e2-892b-42d3-9876-123456789abc",
    "reference": "LTQ-CR-202609-0001",
    "status": "draft",
    "recipient_name": "Université Nationale d'Agriculture",
    "subject": "Bordereau officiel de redevances conventionnées — Septembre 2026",
    "message": "Courrier préparé en brouillon avec succès."
  },
  "error": null
}
```

---

## 3. Préparer les courriers en lot pour la période (Action "Préparer les courriers de la période")

- **Méthode** : `POST`
- **Endpoint** : `/api/v1/rights/legal/courriers/prepare-batch/`
- **Corps de la requête (Request Body)** :
```json
{
  "category": "royalty_author",
  "period_type": "monthly",
  "year": 2026,
  "month": 9
}
```
- **Réponse Succès (200 OK)** :
```json
{
  "success": true,
  "data": {
    "prepared_count": 2,
    "message": "2 courriers préparés en brouillon pour la période Septembre 2026."
  },
  "error": null
}
```

---

## 4. Prévisualiser ou télécharger le document PDF

- **Méthode** : `GET`
- **Endpoint** : `/api/v1/rights/legal/courriers/<uuid:id>/preview-pdf/`
- **Comportement** :
  - Si statut = `draft` : Génère dynamiquement le PDF à la volée avec le template `Lahatheque-PapierEntete-SansNumero.pdf` et le texte courant du brouillon.
  - Si statut = `validated` ou `sent` : Stream le fichier scellé définitif `pdf_file`.
- **En-têtes HTTP** : `Content-Type: application/pdf`, `Content-Disposition: inline; filename="courrier-LTQ-CR-202609-0001.pdf"`.

---

## 5. Mettre à jour le texte du courrier (Action "Corriger")

- **Méthode** : `PATCH`
- **Endpoint** : `/api/v1/rights/legal/courriers/<uuid:id>/`
- **Contrainte métier** : Accessible uniquement si le statut est `draft`. Erreur 400 si `validated` ou `sent`.
- **Corps de la requête (Request Body)** :
```json
{
  "subject": "Nouvel objet corrigé pour l'Université Nationale",
  "body_text": "Monsieur le Recteur,\n\nVoici le décompte actualisé intégrant les ajustements..."
}
```
- **Réponse Succès (200 OK)** :
```json
{
  "success": true,
  "data": {
    "id": "c1f7a4e2-892b-42d3-9876-123456789abc",
    "subject": "Nouvel objet corrigé pour l'Université Nationale",
    "body_text": "Monsieur le Recteur,\n\nVoici le décompte actualisé intégrant les ajustements...",
    "updated_at": "2026-09-17T08:45:00Z"
  },
  "error": null
}
```

---

## 6. Valider le courrier (Action "Valider")

- **Méthode** : `POST`
- **Endpoint** : `/api/v1/rights/legal/courriers/<uuid:id>/validate/`
- **Comportement** : Fige le texte, génère et scelle le PDF définitif sur le gabarit officiel, change le statut vers `validated`.
- **Réponse Succès (200 OK)** :
```json
{
  "success": true,
  "data": {
    "id": "c1f7a4e2-892b-42d3-9876-123456789abc",
    "status": "validated",
    "status_label": "Validé",
    "validated_at": "2026-09-17T08:50:00Z",
    "message": "Le courrier a été validé et scellé définitivement. Prêt pour l'envoi."
  },
  "error": null
}
```

---

## 7. Annuler le courrier (Action "Annuler")

- **Méthode** : `POST`
- **Endpoint** : `/api/v1/rights/legal/courriers/<uuid:id>/cancel/`
- **Contrainte métier** : Possible uniquement si statut = `draft` ou `validated`. Interdit si `sent`.
- **Réponse Succès (200 OK)** :
```json
{
  "success": true,
  "data": {
    "id": "c1f7a4e2-892b-42d3-9876-123456789abc",
    "status": "canceled",
    "status_label": "Annulé",
    "canceled_at": "2026-09-17T08:52:00Z",
    "message": "Le courrier a été annulé avec succès."
  },
  "error": null
}
```

---

## 8. Expédier le courrier par email (Action "Envoyer par email")

- **Méthode** : `POST`
- **Endpoint** : `/api/v1/rights/legal/courriers/<uuid:id>/send-email/`
- **Contrainte métier** : Possible uniquement si statut = `validated`.
- **Comportement** : Expédie l'e-mail officiel avec le corps du message rédigé et le PDF scellé en pièce jointe, horodate `sent_at`, passe le statut à `sent`.
- **Réponse Succès (200 OK)** :
```json
{
  "success": true,
  "data": {
    "id": "c1f7a4e2-892b-42d3-9876-123456789abc",
    "status": "sent",
    "status_label": "Envoyé",
    "sent_at": "2026-09-17T08:55:00Z",
    "message": "Le courrier officiel et sa pièce jointe PDF ont été envoyés avec succès à contact@una.bj."
  },
  "error": null
}
```
