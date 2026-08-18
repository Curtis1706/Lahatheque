# Modele de Donnees: Module 7 - Assistant IA Transverse (AI Engine)

```python
"""
Modeles de donnees pour le cache des suggestions IA et l'audit des appels.
Conforme a la section C et 14 du cahier des charges.
"""

import uuid
from django.db import models


class AISuggestionCache(models.Model):
    """
    Cache des analyses semantiques et classifications pour eviter les surcouts API.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    document_hash = models.CharField(max_length=64, unique=True, db_index=True)  # SHA-256 du texte extrait
    resume_suggere = models.TextField(blank=True)
    discipline_suggeree = models.CharField(max_length=128, blank=True)
    langue_detectee = models.CharField(max_length=32, blank=True)
    pays_suggeres = models.JSONField(default=list, blank=True)
    universite_suggeree = models.CharField(max_length=128, blank=True)
    faculte_suggeree = models.CharField(max_length=128, blank=True)
    mots_cles = models.JSONField(default=list, blank=True)
    incoherences_detectees = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ai_suggestion_cache"


class AICallLog(models.Model):
    """
    Journal d'audit des appels vers les fournisseurs LLM pour suivi des couts et performances.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    provider_name = models.CharField(max_length=64, db_index=True)  # "gemini-1.5-flash", "ollama", "openai"
    action_type = models.CharField(max_length=64, db_index=True)    # "classify_document", "detect_inconsistencies"
    input_tokens = models.IntegerField(default=0)
    output_tokens = models.IntegerField(default=0)
    duree_ms = models.IntegerField(default=0)
    is_success = models.BooleanField(default=True, db_index=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "ai_call_log"
        ordering = ["-created_at"]
```
