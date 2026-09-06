# Modèle de Données : Recherche Full-Text & OCR Contrats

**Feature** : `016-recherche-fulltext-contrats-ocr`
**Date** : 2026-09-06

---

## 1. Extension du Modèle `ContratLegal`

Table existante : `rights_contratlegal` dans [`apps/rights/models.py`](file:///e:/Lahatheque/lahatheque-backend/apps/rights/models.py).

### Nouveaux Champs & Modifications

| Champ | Type Django | Null / Blank | Description & Règle |
| :--- | :--- | :--- | :--- |
| `texte_integral_index` | `models.TextField` | `blank=True, default=""` | Texte extrait complet (natif ou issu de l'OCR). |
| `indexing_status` | `models.CharField(max_length=24)` | `default="pending"` | Valeurs : `"pending"`, `"processing"`, `"indexed"`, `"failed"`. |
| `ocr_engine_used` | `models.CharField(max_length=32)` | `blank=True, default=""` | Moteur utilisé : `"pymupdf_native"`, `"tesseract_ocr"`, `"ai_vision"`. |
| `ocr_confidence_score` | `models.DecimalField(max_digits=4, decimal_places=2)` | `null=True, blank=True` | Score de confiance optique moyen (0.00 à 1.00). |
| `indexed_at` | `models.DateTimeField` | `null=True, blank=True` | Date et heure de finalisation de l'indexation. |

---

## 2. États & Transitions du Cycle de Vie d'Indexation

```text
[Dépôt du Fichier]
        │
        ▼
   (pending) ───[Texte natif suffisant > 50 car.]───► (indexed) [Instantané < 300ms]
        │
   [Scan détecté < 50 car.]
        │
        ▼
  (processing)  (Tâche de fond OCR en streaming)
        │
        ├───[Reconnaissance réussie]──────────────► (indexed)
        │
        └───[Échec ou fichier illisible]──────────► (failed) [Alerte discrète, document reste consultable]
```

---

## 3. Indexation PostgreSQL Full-Text Search (Index GIN)

```python
from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVectorField

# Ajout dans class Meta de ContratLegal:
indexes = [
    GinIndex(
        fields=['search_vector'],
        name='contrat_fts_gin_idx'
    ),
    models.Index(fields=['indexing_status']),
]
```
