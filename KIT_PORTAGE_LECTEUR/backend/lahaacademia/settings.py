import os
from pathlib import Path
from decouple import config
import dj_database_url
import environ

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables using django-environ
env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env', overwrite=True)


# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.1/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
# Helper pour parser les booléens de l'environnement (ex: gère "release" de Render)
def get_bool(name, default=False):
    val = config(name, default=str(default))
    return str(val).lower() in ['true', '1', 'on', 'yes', 'y']

SECRET_KEY = config('SECRET_KEY', default='django-insecure-dummy-key')
DEBUG = get_bool('DEBUG', default=False)

raw_hosts = config('ALLOWED_HOSTS', default='localhost,127.0.0.1,.onrender.com,.sslip.io,.lahaacademia.com,.lahacademia.com')
ALLOWED_HOSTS = [host.strip() for host in raw_hosts.split(',') if host.strip()]

FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:3000' if DEBUG else 'https://lahacademia.com')


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'media',                # [NEW] Gestion médias Cloudflare R2 + Stream
    'rest_framework',
    'rest_framework.authtoken',
    'django_filters',
    'corsheaders',
    'django_countries',  # Pour les champs pays avec drapeaux
    'phonenumber_field',
    'core',        # LEGACY — bridge temporaire, ne plus ajouter de logique métier ici
    'admin_panel',
    'shared',

    # ── Phase 1 : Monolithe modulaire ──────────────────────────────────────────
    'common',       # Modèles abstraits partagés (TimestampedModel, UUIDModel)
    'roles',        # Role + UserRole (remplace User.role legacy progressivement)
    'verification', # Workflow de vérification des dossiers (enseignants, auteurs)
    'academics',    # AcademicYear + PromotionPolicy (par pays + niveau)
    'students',     # StudentProfile
    'parents',      # ParentProfile + ParentStudentLink
    'teachers',     # TeacherProfile
    'authors',      # AuthorProfile
    'accounts',     # Identity / Auth JWT / /me (Phase 3)
    'rest_framework_simplejwt.token_blacklist',  # Blacklist des refresh tokens au logout
    'bookings',     # Phase 12 : Sessions Live et réservations
    'content',      # Phase 13 : Catalogue de cours et leçons
    'learning',     # Phase 13 : Parcours et progression élèves
    'django_extensions',
    'assessments',  # Phase 13 : QCM et évaluations
    'messaging',    # Phase 14 : Messagerie interne (1:1)
    'communications', # Phase 14 : Signalements et Modération sociale
    'community',    # Phase 14 : Forums et entraide
    'messaging_forum', # Nouveau : Messagerie groupée (Parents/Profs/Auteurs)
    'forum',        # Nouveau module : Entraide universelle pour enseignants Q&As
    'notifications',# Phase 15 : Alertes et préférences
    'library',      # Bibliothèque numérique
    'guided_paths', # Phase G : Moteur de parcours guidés
    'ai',           # AI Module
    'anatomy',      # 3D Anatomy explorer
    
    # ── Phase 15 : Analytics & Gamification ───────────────────────────────────
    'analytics',
    'reputation',
    'referrals',
    'qa',
    'reviews',
    'finances',     # Phase 16 : Gestion des revenus et payouts
    # ── À venir (Phases suivantes) ────────────────────────────────────────────


    'payments',   # Paiements et abonnements
    
    # ── Phase 16 : Swagger & Sécurité ─────────────────────────────────────────
    'drf_spectacular',
    'axes',

    # ── Phase 16 : Background Tasks ───────────────────────────────────────────
    'django_celery_results',
    'django_celery_beat',
]

if DEBUG:
    INSTALLED_APPS.append('debug_toolbar')

INTERNAL_IPS = [
    "127.0.0.1",
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'core.middleware.UpdateLastActivityMiddleware',
    'common.super_client_middleware.SuperClientReadOnlyMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # ── Phase 16 : Anti-Bruteforce ────────────────────────────────────────────
    'axes.middleware.AxesMiddleware',
]

if DEBUG:
    MIDDLEWARE.insert(0, 'debug_toolbar.middleware.DebugToolbarMiddleware')
    DEBUG_TOOLBAR_CONFIG = {
        "SHOW_TOOLBAR_CALLBACK": lambda request: True,
    }

AUTHENTICATION_BACKENDS = [
    'axes.backends.AxesBackend',
    'students.auth_backends.MinorAuthBackend',   # PIN court pour enfants mineurs
    'django.contrib.auth.backends.ModelBackend',
]

# ── Consentement RGPD/COPPA — Version de la politique de confidentialité ─────
# Mise à jour requise lors de tout changement de politique de confidentialité.
CONSENT_VERSION = "v1.0"

X_FRAME_OPTIONS = 'SAMEORIGIN'

ROOT_URLCONF = 'lahaacademia.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'lahaacademia.wsgi.application'


# Database
# https://docs.djangoproject.com/en/4.2/ref/settings/#databases

DATABASES = {
    'default': {
        **dj_database_url.config(
            default=env('DATABASE_URL', default='postgres://postgres:postgres@localhost:5432/lahaacademia'),
            ssl_require=True
        ),
        'CONN_MAX_AGE': 60,
        'CONN_HEALTH_CHECKS': True,
        'OPTIONS': {
            'connect_timeout': 10,
        }
    }
}





CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
 ]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-vault-password',
]

CORS_EXPOSE_HEADERS = [
    'Authorization',
]


# Password validation
# https://docs.djangoproject.com/en/4.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {
            'min_length': 8,
        }
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

AUTH_USER_MODEL = 'core.User'

# Internationalization
# https://docs.djangoproject.com/en/4.2/topics/i18n/

LANGUAGE_CODE = 'fr-fr'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/4.2/howto/static-files/

STATIC_URL = 'static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')

# Default primary key field type
# https://docs.djangoproject.com/en/4.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# REST Framework settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        # JWT en premier pour les nouveaux endpoints /api/v1/
        'core.authentication.LahaJWTAuthentication',
        # TokenAuthentication conservé pour la compat des anciens endpoints /api/ (bridge)
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    # ── Phase 16 : OpenAPI & Throttling
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        # Anon : accès public (pages d'inscription, niveaux, matières)
        'anon': '200/min' if DEBUG else '120/min',
        # Users authentifiés (admins, élèves, enseignants)
        'user': '500/min' if DEBUG else '3000/hour',
        # Endpoints de paiement / soumission (protection anti-abus)
        'payment': '5/min',
        'submission': '20/min',
        'auth': '10/min',
    },
    'EXCEPTION_HANDLER': 'core.exception_handlers.custom_exception_handler',
}

# ── Swagger / OpenAPI Settings ────────────────────────────────────────────────
SPECTACULAR_SETTINGS = {
    'TITLE': 'Lahacademia API',
    'DESCRIPTION': 'Documentation technique complète de la Plateforme LMS et Communautaire.',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
}

# ── Django Axes (Anti Bruteforce) ─────────────────────────────────────────────
AXES_FAILURE_LIMIT = 5  # Bloque après 5 échecs consécutifs
AXES_COOLOFF_TIME = 15 / 60  # Durée du blocage: 15 minutes
AXES_RESET_ON_SUCCESS = True # Remise à zéro du compteur si login réussi
AXES_LOCKOUT_PARAMETERS = ["username", "ip_address"]

# ── JWT Configuration ──────────────────────────────────────────────────────────
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME':  timedelta(minutes=5),   # Modifié pour la sécurité (réduit la fenêtre d'exposition)
    'REFRESH_TOKEN_LIFETIME': timedelta(hours=12),    # Réduit à 12h max pour forcer la reconnexion régulière
    'ROTATE_REFRESH_TOKENS':  True,     # Nouveau refresh token à chaque refresh
    'BLACKLIST_AFTER_ROTATION': False,  # Désactivé pour éviter les déconnexions dues aux requêtes concurrentes (race conditions)
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'TOKEN_REFRESH_SERIALIZER': 'core.authentication.LahaTokenRefreshSerializer',
}

# ── Sécurité des Cookies (Anti-XSS / Anti-CSRF) ───────────────────────────
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'

# En-têtes de sécurité Django (ZAP Sprint 0)
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True          # X-Content-Type-Options: nosniff
SECURE_HSTS_SECONDS = 31536000              # 1 an
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# ── SSL / Proxy (Render, Heroku, etc.) ──────────────────────────────────────
# Render fait la terminaison SSL au niveau du load balancer.
# Django reçoit les requêtes en HTTP interne → SECURE_SSL_REDIRECT causerait
# une boucle de redirection infinie (→ 500 en prod avec DEBUG=False).
# SECURE_PROXY_SSL_HEADER indique à Django de lire X-Forwarded-Proto pour
# savoir si la requête originale était HTTPS, sans déclencher de redirection.
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = not DEBUG  # Render gère l'infra, mais Django l'applique aussi en prod pour satisfaire l'audit


# CORS settings
import re

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://lahaacademia-.*\.vercel\.app$",
    r"^https?://.*\.sslip\.io$",
]

CORS_ALLOWED_ORIGINS = config(
    'CORS_ALLOWED_ORIGINS',
    default='https://lahaacademia.com,https://www.lahaacademia.com,https://lahacademia.com,https://www.lahacademia.com'
).split(',')

CORS_ALLOW_CREDENTIALS = True

CSRF_TRUSTED_ORIGINS = config(
    'CSRF_TRUSTED_ORIGINS',
    default='https://lahacademia.com,https://www.lahacademia.com,https://lahaacademia.com,https://www.lahaacademia.com,http://localhost:3000,http://127.0.0.1:3000'
).split(',')

# Retiré suite audit sécurité ZAP
# CORS_ALLOW_ALL_ORIGINS = DEBUG

# Media files (legacy local — non utilisé en prod, R2 prend le relais)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# ─────────────────────────────────────────────────────────────────────────────
# CLOUDFLARE R2 — Storage fichiers statiques (images, PDFs, documents...)
# ─────────────────────────────────────────────────────────────────────────────
CLOUDFLARE_ACCOUNT_ID       = config('CLOUDFLARE_ACCOUNT_ID', default='')
CLOUDFLARE_R2_BUCKET_NAME   = config('CLOUDFLARE_R2_BUCKET_NAME', default='lahacademia')
CLOUDFLARE_R2_ENDPOINT      = config('CLOUDFLARE_R2_ENDPOINT', default='')
CLOUDFLARE_R2_PUBLIC_URL    = config('CLOUDFLARE_R2_PUBLIC_URL', default='')
# Domaine public sans 'https://' (utilisé par S3Boto3Storage.custom_domain)
CLOUDFLARE_R2_PUBLIC_DOMAIN = CLOUDFLARE_R2_PUBLIC_URL.replace('https://', '').replace('http://', '')

# Clés d'accès R2 (compatibles S3)
AWS_ACCESS_KEY_ID     = config('CLOUDFLARE_R2_ACCESS_KEY_ID', default='')
AWS_SECRET_ACCESS_KEY = config('CLOUDFLARE_R2_SECRET_ACCESS_KEY', default='')
AWS_S3_ENDPOINT_URL   = CLOUDFLARE_R2_ENDPOINT
AWS_STORAGE_BUCKET_NAME = CLOUDFLARE_R2_BUCKET_NAME
AWS_S3_REGION_NAME    = 'auto'  # Requis pour Cloudflare R2
AWS_S3_SIGNATURE_VERSION = 's3v4'
AWS_QUERYSTRING_EXPIRE = 300  # 5 minutes — expire vite pour empêcher le partage
AWS_DEFAULT_ACL = None  # R2 n'utilise pas les ACL S3 — accès public via domaine

# ─────────────────────────────────────────────────────────────────────────────
# CLOUDFLARE STREAM — Hébergement et streaming vidéo
# ─────────────────────────────────────────────────────────────────────────────
CLOUDFLARE_STREAM_API_TOKEN      = config('CLOUDFLARE_STREAM_API_TOKEN', default='')
CLOUDFLARE_STREAM_SUBDOMAIN      = config('CLOUDFLARE_STREAM_SUBDOMAIN', default='')
CLOUDFLARE_STREAM_WEBHOOK_SECRET = config('CLOUDFLARE_STREAM_WEBHOOK_SECRET', default='')

# ─────────────────────────────────────────────────────────────────────────────
# STORAGES — R2 pour les médias, Whitenoise pour le statique
# ─────────────────────────────────────────────────────────────────────────────
STORAGES = {
    "default": {
        # [MIGRÉ] Cloudinary → Cloudflare R2
        "BACKEND": "media.r2_storage.R2MediaStorage",
    },
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    },
}

# [NEW] 100ms Live Configuration
HMS_ACCESS_KEY    = config('HMS_ACCESS_KEY', default='')
HMS_SECRET        = config('HMS_SECRET', default='')
HMS_TEMPLATE_NAME = config('HMS_TEMPLATE_NAME', default='default_video_conf')

# Configuration Email (Hostinger SMTP)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='smtp.hostinger.com')
EMAIL_PORT = config('EMAIL_PORT', default=465, cast=int)
EMAIL_USE_SSL = config('EMAIL_USE_SSL', default=True, cast=bool)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=False, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='contact@lahacademia.com')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = f"LAHACADEMIA <{EMAIL_HOST_USER}>"

# Configuration Evolution API (WhatsApp)
EVOLUTION_API_URL = os.environ.get('EVOLUTION_API_URL', 'http://localhost:8080')
EVOLUTION_API_KEY = config('EVOLUTION_API_KEY', default='')  # Ne pas démarrer le service si absent

# Configuration FasterMessage (SMS OTP)
FASTERMESSAGE_API_KEY  = config('FASTERMESSAGE_API_KEY', default='')
FASTERMESSAGE_USERNAME = config('FASTERMESSAGE_USERNAME', default='')
FASTERMESSAGE_PASSWORD = config('FASTERMESSAGE_PASSWORD', default='')
FASTERMESSAGE_SENDER   = config('FASTERMESSAGE_SENDER', default='LAHA')

# Mot de passe Vault (vidéos publiques)
# À définir OBLIGATOIREMENT en production via variable d'environnement
VAULT_PASSWORD = config('VAULT_PASSWORD', default='')

# Configuration OTP
OTP_EXPIRY_MINUTES = 5
OTP_MAX_ATTEMPTS = 3

# Configuration parrainage
REFERRAL_BONUS_POINTS = 10
REFERRAL_BONUS_CONTENT = True

# Logging configuration (Phase 16 - Industrialisation)
LOG_DIR = os.path.join(BASE_DIR, 'logs')
if not os.path.exists(LOG_DIR):
    os.makedirs(LOG_DIR)

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
        'security_file': {
            'class': 'logging.FileHandler',
            'filename': os.path.join(LOG_DIR, 'security.log'),
            'formatter': 'verbose',
        },
        'django_error_file': {
            'class': 'logging.FileHandler',
            'filename': os.path.join(LOG_DIR, 'django_errors.log'),
            'formatter': 'verbose',
            'level': 'ERROR',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'django_error_file'],
            'level': 'INFO',
            'propagate': False,
        },
        'axes.watch_login': {
            'handlers': ['console', 'security_file'],
            'level': 'INFO',
            'propagate': True,
        },
        'core': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}

# ── Celery Configuration (Phase 16) ───────────────────────────────────────────
# ── CELERY BACKGROUND TASKS ────────────────────────────────────────────────
CELERY_BROKER_URL = config('REDIS_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = 'django-db'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = TIME_ZONE

if DEBUG:
    # Forcer DRF à générer du HTML (Browsable API) pour que la toolbar puisse s'injecter
    REST_FRAMEWORK['DEFAULT_RENDERER_CLASSES'].append('rest_framework.renderers.BrowsableAPIRenderer')

# Mode synchrone pour le développement (évite d'avoir besoin de Redis en local)
CELERY_TASK_ALWAYS_EAGER = get_bool('CELERY_TASK_ALWAYS_EAGER', default=DEBUG)
CELERY_TASK_EAGER_PROPAGATES = True

# ── AI CONFIG ────────────────────────────────────────────────────────────────
# Configuration OpenAI (Chargée via django-environ)
OPENAI_API_KEY = env('OPENAI_API_KEY', default="")
AI_MODEL_FAST = "gpt-4o-mini"
AI_MODEL_SMART = "gpt-4o"

# Configuration Groq (Dépréciée)
GROQ_API_KEY = ""

# Configuration Google Gemini (En attente de quota)
GEMINI_API_KEY = config("GEMINI_API_KEY", default="")
GEMINI_MODEL = "gemini-2.0-flash-lite"

# Cache (Redis recommandé en PROD, LocMem en DEV pour éviter WinError 10061)
if DEBUG:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "laha-dev-cache",
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": config("REDIS_URL", default="redis://localhost:6379/1"),
        }
    }

# Configuration Cloudflare Stream
CLOUDFLARE_STREAM_SUBDOMAIN = config("CLOUDFLARE_STREAM_SUBDOMAIN", default="customer-ekix3ypiu6mjzeb4.cloudflarestream.com")

# ── Moneroo Configuration ────────────────────────────────────────────────────
MONEROO_SECRET_KEY = config('MONEROO_SECRET_KEY', default='')
MONEROO_PUBLIC_KEY = config('MONEROO_PUBLIC_KEY', default='')
MONEROO_API_BASE_URL = 'https://api.moneroo.io/v1'
MONEROO_WEBHOOK_SECRET = config('MONEROO_WEBHOOK_SECRET', default='')

from celery.schedules import crontab

CELERY_BEAT_SCHEDULE = {}
CELERY_BEAT_SCHEDULE.update({
    'renew-subscriptions-daily': {
        'task': 'payments.renew_expired_subscriptions',
        'schedule': crontab(hour=6, minute=0),  # Tous les jours à 6h UTC
    },
    'cleanup-pending-transactions': {
        'task': 'payments.cleanup_pending_transactions',
        'schedule': crontab(minute='*/30'),  # Toutes les 30 minutes
    },
    # Réservations : expiration des bookings non-payés après 15 min
    'cleanup-expired-pending-bookings': {
        'task': 'bookings.tasks.cleanup_expired_pending_bookings',
        'schedule': crontab(minute='*/15'),  # Toutes les 15 minutes
    },
    # Sessions : nettoyage quotidien des sessions incohérentes (vides, DRAFT, non conclues)
    'cleanup-stale-sessions': {
        'task': 'bookings.tasks.cleanup_stale_sessions',
        'schedule': crontab(hour=3, minute=0),  # Tous les jours à 3h UTC (heure creuse)
    },
})


# ── Alertes Abonnements ────────────────────────────────────────────────────────
SUBSCRIPTION_ALERT_THRESHOLD_DAYS = 7

# Augmenter la taille limite de téléversement (Upload) pour les fichiers lourds (PDF, Audio, Vidéo)
# Défini à 100 Mo (100 * 1024 * 1024)
DATA_UPLOAD_MAX_MEMORY_SIZE = 104857600
FILE_UPLOAD_MAX_MEMORY_SIZE = 104857600
