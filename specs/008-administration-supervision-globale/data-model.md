# Modele de Donnees: Module 8 - Administration Globale (Administrateur)

```python
"""
Modeles de donnees pour la configuration de la plateforme, la tarification
multi-pays et la supervision globale. Conforme aux sections 1 et 15 du cahier des charges.
"""

import uuid
from decimal import Decimal
from django.db import models


class ConfigurationPlateformeGlobale(models.Model):
    """
    Parametres generaux de la plateforme LAHATheque et regles DRM globales.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Tarification par defaut
    prix_defaut_numerique = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("5000.00"))
    devise_defaut = models.CharField(max_length=8, default="XOF")  # Franc CFA par défaut
    
    # DRM et Securite
    watermark_texte_defaut = models.CharField(max_length=255, default="LAHAThèque - Document Protégé")
    watermark_opacite_defaut = models.DecimalField(max_digits=3, decimal_places=2, default=Decimal("0.20"))
    restriction_telechargement_defaut = models.BooleanField(default=True)
    restriction_impression_defaut = models.BooleanField(default=True)
    duree_session_lecture_minutes = models.IntegerField(default=15)
    
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "core_platform_config"


class TarificationPaysConfig(models.Model):
    """
    Surcharge tarifaire et devise par pays africain de deploiement.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    pays = models.CharField(max_length=64, unique=True, db_index=True)  # "Bénin", "Sénégal", "Côte d'Ivoire", "Gabon", "RDC"...
    devise = models.CharField(max_length=8, default="XOF", db_index=True)  # XOF, XAF, CDF, GNF, USD
    multiplicateur_prix = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal("1.00"))
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        db_table = "core_tarification_pays_config"
        ordering = ["pays"]
```
