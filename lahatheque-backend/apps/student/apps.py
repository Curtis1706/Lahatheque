from django.apps import AppConfig


class StudentConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.student'
    verbose_name = 'Espace Client Lecteur / Étudiant'

    def ready(self):
        try:
            from . import signals
            signals.register_cross_model_signals()
        except Exception:
            pass
