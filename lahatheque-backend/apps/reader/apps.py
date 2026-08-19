"""Configuration de l'application Reader pour LAHAThèque."""
from django.apps import AppConfig


class ReaderConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.reader'
    verbose_name = 'Lecteur Hébergé & API Partenaires'
