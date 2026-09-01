from .base import *

DEBUG = True

# Drapeau DÉDIÉ et EXPLICITE, séparé du DEBUG général de Django. Contrairement à DEBUG (qui
# gouverne aussi les pages d'erreur détaillées, etc.), celui-ci ne contrôle QUE le
# déverrouillage de test des livres, et n'existe QUE dans ce fichier dev.py — il est donc
# structurellement impossible qu'il fuite en production par simple héritage de settings.
# Mettre à False ci-dessous pour tester le contrôle d'accès réel même en développement.
DEV_UNLOCK_ALL_BOOKS = False

# Utiliser le serveur SMTP réel si le mot de passe est renseigné dans .env
if EMAIL_HOST_PASSWORD:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

CELERY_TASK_ALWAYS_EAGER = True
CELERY_TASK_EAGER_PROPAGATES = True

