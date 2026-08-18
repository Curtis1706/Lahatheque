# Modele de Donnees: Depot et Validation du Catalogue (Maquettiste & Chef Maquettiste)

---

## 1. Entite `OuvrageDepot` (Soumission de Maquette)

```python
class OuvrageDepot(models.Model):
    """
    Representation d'une soumission d'ouvrage deposee par un maquettiste
    en attente d'examen et validation par le Chef Maquettiste.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Metadonnees descriptives
    titre = models.CharField(max_length=255, db_index=True)
    sous_titre = models.CharField(max_length=255, blank=True)
    auteur_nom = models.CharField(max_length=255, db_index=True)
    co_auteurs = models.JSONField(default=list, blank=True)  # ["Nom Co-auteur 1", "Nom 2"]
    isbn = models.CharField(max_length=32, blank=True, db_index=True)
    edition = models.CharField(max_length=64, blank=True)
    annee_publication = models.IntegerField(null=True, blank=True)
    resume = models.TextField(blank=True)
    mots_cles = models.JSONField(default=list, blank=True)
    
    # Classification academique et territoriale
    discipline = models.CharField(max_length=128, db_index=True)
    langue = models.CharField(max_length=32, default="français", db_index=True)
    pays = models.CharField(max_length=64, db_index=True)
    faculte = models.CharField(max_length=128, blank=True)
    departement = models.CharField(max_length=128, blank=True)
    
    # Fichiers et stockage Cloudflare R2
    format_fichier = models.CharField(max_length=16, choices=[("pdf", "PDF"), ("epub", "EPUB")], default="pdf")
    fichier_numerique_path = models.CharField(max_length=512)
    couverture_path = models.CharField(max_length=512)
    nombre_pages = models.IntegerField(default=0)
    has_audio = models.BooleanField(default=False)
    
    # Statut du workflow
    STATUT_CHOICES = [
        ("en_attente", "En attente de validation"),
        ("valide", "Validé et publié"),
        ("rejete", "Rejeté pour corrections"),
    ]
    statut = models.CharField(max_length=32, choices=STATUT_CHOICES, default="en_attente", db_index=True)
    motif_rejet = models.TextField(blank=True)
    date_validation = models.DateTimeField(null=True, blank=True)
    
    # Attribution et audit
    maquettiste = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        related_name="depots_soumis"
    )
    validateur = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="depots_valides"
    )
    ouvrage_publie = models.OneToOneField(
        "catalog.Ouvrage",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="depot_source"
    )
    
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "catalog_ouvrage_depot"
        ordering = ["-created_at"]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(statut__in=["en_attente", "valide", "rejete"]),
                name="check_statut_depot_valide"
            )
        ]
```

---

## 2. Entite `FichierAudioOuvrage` (Pistes Audio Associees)

```python
class FichierAudioOuvrage(models.Model):
    """
    Pistes audio d'accompagnement ou livre audio associe au depot ou a l'ouvrage.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    depot = models.ForeignKey(
        OuvrageDepot,
        on_delete=models.CASCADE,
        related_name="pistes_audio",
        null=True,
        blank=True
    )
    ouvrage = models.ForeignKey(
        "catalog.Ouvrage",
        on_delete=models.CASCADE,
        related_name="pistes_audio",
        null=True,
        blank=True
    )
    titre_piste = models.CharField(max_length=255)
    numero_piste = models.IntegerField(default=1)
    duree_secondes = models.IntegerField(default=0)
    audio_path = models.CharField(max_length=512)
    format_audio = models.CharField(max_length=16, choices=[("mp3", "MP3"), ("m4b", "M4B")], default="mp3")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "catalog_fichier_audio"
        ordering = ["numero_piste"]
```
