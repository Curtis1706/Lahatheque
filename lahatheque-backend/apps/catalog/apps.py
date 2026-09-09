from django.apps import AppConfig


class CatalogConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.catalog'

    def ready(self):
        """Connexion du signal d'invalidation du cache catalogue au signal post_save d'Ouvrage."""
        from django.db.models.signals import post_save
        from django.core.cache import cache

        def invalidate_catalog_cache(sender, instance, **kwargs):
            """Vide tous les caches du catalogue public lors d'une modification d'ouvrage."""
            try:
                cache.clear()
            except Exception:
                pass

        post_save.connect(invalidate_catalog_cache, sender='catalog.Ouvrage', weak=False)
