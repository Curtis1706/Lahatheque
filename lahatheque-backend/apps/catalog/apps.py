from django.apps import AppConfig


class CatalogConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.catalog'

    def ready(self):
        """Connexion des signaux d'invalidation du cache catalogue."""
        from django.db.models.signals import post_save, post_delete

        def _on_ouvrage_changed(sender, instance, **kwargs):
            from apps.catalog.views import invalidate_catalog_cache
            invalidate_catalog_cache()

        post_save.connect(_on_ouvrage_changed, sender='catalog.Ouvrage', weak=False)
        post_delete.connect(_on_ouvrage_changed, sender='catalog.Ouvrage', weak=False)
        post_save.connect(_on_ouvrage_changed, sender='catalog.OuvrageLanguageVersion', weak=False)
        post_delete.connect(_on_ouvrage_changed, sender='catalog.OuvrageLanguageVersion', weak=False)
