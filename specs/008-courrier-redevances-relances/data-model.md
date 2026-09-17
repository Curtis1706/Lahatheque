# Phase 1 : Modèle de Données & Cycle de Vie (Courriers Officiels LAHAThèque)

**Feature** : `008-courrier-redevances-relances`
**Date** : 2026-09-17
**Auteur** : Antigravity (Product Experience Partner)

---

## 1. Entité Principale : `CourrierOfficiel`

Le modèle est hébergé dans `apps/rights/models.py`.

### Attributs et Spécifications SQL

| Champ | Type Django | Null / Blank | Description & Contraintes |
|---|---|---|---|
| `id` | `UUIDField(primary_key=True, default=uuid.uuid4, editable=False)` | Non | Identifiant universel unique |
| `category` | `CharField(max_length=40, choices=CATEGORY_CHOICES, db_index=True)` | Non | `royalty_author`, `royalty_university`, `royalty_publisher`, `debt_reminder`, `other` |
| `status` | `CharField(max_length=20, choices=STATUS_CHOICES, default='draft', db_index=True)` | Non | `draft`, `validated`, `canceled`, `sent` |
| `recipient_type` | `CharField(max_length=30, choices=RECIPIENT_TYPE_CHOICES)` | Non | `author`, `university`, `publisher`, `client` |
| `recipient_id` | `CharField(max_length=100, blank=True, default='')` | Oui | UUID ou identifiant de l'ayant-droit/institution |
| `recipient_name` | `CharField(max_length=255)` | Non | Nom complet de l'entité destinataire |
| `recipient_email` | `EmailField()` | Non | Adresse e-mail officielle de notification |
| `reference` | `CharField(max_length=100, unique=True, db_index=True)` | Non | Référence de registre (ex: `LTQ-CR-202609-0012`) |
| `period` | `CharField(max_length=100, blank=True, default='')` | Oui | Période comptable (ex: `Septembre 2026`) |
| `amount` | `DecimalField(max_digits=14, decimal_places=2, default=0.0)` | Non | Montant total des redevances ou de l'impayé |
| `currency` | `CharField(max_length=10, default='FCFA')` | Non | Devise monétaire (exclusivement `FCFA`) |
| `subject` | `CharField(max_length=255)` | Non | Objet officiel du courrier |
| `body_text` | `TextField()` | Non | Corps complet rédigé et personnalisable |
| `pdf_file` | `FileField(upload_to='courriers_officiels/%Y/%m/', null=True, blank=True)` | Oui | Fichier PDF scellé généré à la validation |
| `created_by` | `ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)` | Oui | Agent juriste ou admin créateur |
| `created_at` | `DateTimeField(auto_now_add=True, db_index=True)` | Non | Date de création du brouillon |
| `updated_at` | `DateTimeField(auto_now=True)` | Non | Date de dernière mise à jour |
| `validated_at` | `DateTimeField(null=True, blank=True)` | Oui | Horodatage du passage en statut Validé |
| `sent_at` | `DateTimeField(null=True, blank=True)` | Oui | Horodatage effectif d'envoi par email |
| `canceled_at` | `DateTimeField(null=True, blank=True)` | Oui | Horodatage de l'annulation |

---

## 2. Machine à États (State Transitions)

Le cycle de vie du courrier officiel suit un graphe de transition déterministe et irréversible :

```
             ┌────────────────────────────────────────┐
             │                                        │
             ▼                                        │
      [ 1. Brouillon ] ──(Corriger / Sauvegarder)─────┘
             │
             ├──(Valider)─────────────────────────────┐
             │                                        │
             ├──(Annuler)───────┐                     ▼
             │                  │              [ 2. Validé ]
             ▼                  │                     │
      [ 3. Annulé ] ◄───────────┴──(Annuler)──────────┤
                                                      │
                                                      ├──(Envoyer par email)
                                                      ▼
                                               [ 4. Envoyé ]
```

### Règles de Transition :
1. **`draft` (Brouillon)** :
   - Statut initial par défaut lors de la préparation.
   - Le texte (`subject`, `body_text`) est librement modifiable via la modale "Corriger".
   - La prévisualisation PDF est disponible en streaming temps réel.
   - Transitions possibles : vers `validated` (via Valider) ou vers `canceled` (via Annuler).
2. **`validated` (Validé)** :
   - Déclenché par l'action "Valider".
   - Le texte est irrévocablement verrouillé. Le PDF scellé final est généré sur le papier à en-tête officiel et archivé sur stockage persistant.
   - Les actions "Corriger" et "Valider" disparaissent.
   - Transitions possibles : vers `sent` (via Envoyer par email) ou vers `canceled` (via Annuler).
3. **`sent` (Envoyé)** :
   - Déclenché par l'action "Envoyer par email".
   - Le corps du message rédigé est expédié au destinataire avec le PDF scellé en pièce jointe.
   - `sent_at` est horodaté.
   - **Aucune transition ultérieure n'est autorisée** (immuable, non annulable, non modifiable).
4. **`canceled` (Annulé)** :
   - Déclenché par l'action "Annuler" depuis l'état `draft` ou `validated`.
   - Le document est neutralisé, `canceled_at` est horodaté.
   - Reste présent dans la DataTable pour l'audit et l'historique administratif. Aucune transition sortante.

---

## 3. Matrice des Actions dans la DataTable

| Statut du Courrier | Action "PDF" | Action "Corriger" | Action "Valider" | Action "Annuler" | Action "Envoyer par email" |
|---|---|---|---|---|---|
| **Brouillon** | Visible (Streaming direct) | Visible (Modale d'édition) | Visible (Modale confirmation) | Visible (Modale avertissement) | Masqué |
| **Validé** | Visible (Téléchargement scellé) | Masqué | Masqué | Visible (Modale avertissement) | Visible (Action principale) |
| **Envoyé** | Visible (Téléchargement scellé) | Masqué | Masqué | Masqué | Masqué (Badge "Envoyé le...") |
| **Annulé** | Visible (Marqué Annulé) | Masqué | Masqué | Masqué | Masqué |
