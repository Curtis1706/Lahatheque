"""Settings de base pour le monolithe Django LAHAThèque v3.2."""
import os
from pathlib import Path
from datetime import timedelta
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config('SECRET_KEY', default='django-insecure-lahatheque-dev-key-change-in-prod')
DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1', cast=lambda v: [s.strip() for s in v.split(',') if s.strip()])

# Applications installées
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    # Tierces parties (Sécurité & API)
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'axes',
    'drf_spectacular',
    'oauth2_provider',
    'djangosaml2',
    # Apps LAHAThèque (10 apps)
    'apps.accounts',
    'apps.partners',
    'apps.catalog',
    'apps.protection',
    'apps.publishers_portal',
    'apps.rights',
    'apps.commerce',
    'apps.ai_engine',
    'apps.audio',
    'apps.reporting',
    'apps.reader',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # Anti-Bruteforce
    'axes.middleware.AxesMiddleware',
]

AUTHENTICATION_BACKENDS = [
    'axes.backends.AxesBackend',
    'django.contrib.auth.backends.ModelBackend',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
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

AUTH_USER_MODEL = 'accounts.User'

# Base de données PostgreSQL Neon (serverless managé)
import dj_database_url

DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL', default='postgres://lahatheque_user:password@ep-sample-pooler.us-east-2.aws.neon.tech/lahatheque_db?sslmode=require'),
        conn_max_age=0, # Neon ferme les connexions inactives après 5 min
        ssl_require=True,
    )
}
DATABASES['default']['DISABLE_SERVER_SIDE_CURSORS'] = True # PgBouncer mode transaction Neon
DATABASES['default']['CONN_HEALTH_CHECKS'] = True


# Configuration REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'common.pagination.StandardResultsSetPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '200/min' if DEBUG else '10/min',
        'user': '500/min' if DEBUG else '1000/hour',
        'payment': '5/min',
        'submission': '20/min',
        'auth': '10/min',
    },
    'EXCEPTION_HANDLER': 'common.exceptions.custom_exception_handler',
}

# ── JWT Configuration (SimpleJWT) ─────────────────────────────────────────────
SIMPLE_JWT = {
    'SIGNING_KEY': config('JWT_SECRET_KEY', default=SECRET_KEY),
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=2),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# ── OAuth2 Provider Configuration (DOT) ──────────────────────────────────────
OAUTH2_PROVIDER_APPLICATION_MODEL = 'oauth2_provider.Application'
OAUTH2_PROVIDER = {
    'SCOPES': {
        'read': 'Lecture',
        'write': 'Écriture',
        'reader:sessions': 'Création et gestion des sessions de lecture',
        'reader:byod': 'Lecture de documents externes distants',
        'catalog:read': 'Consultation du catalogue',
    },
    'ACCESS_TOKEN_EXPIRE_SECONDS': 3600,
}

# ── Django Axes (Anti Bruteforce) ─────────────────────────────────────────────
AXES_FAILURE_LIMIT = 5
AXES_COOLOFF_TIME = 0.25 # 15 minutes
AXES_RESET_ON_SUCCESS = True
AXES_LOCKOUT_PARAMETERS = ["username", "ip_address"]

# ── Sécurité des Cookies (Anti-XSS / Anti-CSRF) ───────────────────────────────
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_SECURE = not DEBUG
CSRF_COOKIE_SECURE = not DEBUG
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'

# En-têtes de sécurité Django (Audit ZAP Sprint 0)
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = 31536000 # 1 an
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
X_FRAME_OPTIONS = 'SAMEORIGIN'

# SSL / Proxy (Reverse Proxy SSL Header)
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = not DEBUG

# ── FRONTEND & Domaines de Déploiement ────────────────────────────────────────
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:3000' if DEBUG else 'https://lahatheque.com')

# ── CORS Settings ─────────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.lahatheque\.com$",
    r"^https://lahatheque\.com$",
    r"^https://.*\.vercel\.app$",
    r"^https://lahatheque\.vercel\.app$",
    r"^http://localhost(:\d+)?$",
    r"^http://127\.0\.0\.1(:\d+)?$",
    r"^http://0\.0\.0\.0(:\d+)?$",
]
CORS_ALLOWED_ORIGINS = [
    "https://lahatheque.com",
    "https://lahatheque.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CSRF_TRUSTED_ORIGINS = [
    "https://lahatheque.com",
    "https://*.lahatheque.com",
    "https://lahatheque.vercel.app",
    "https://*.vercel.app",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_METHODS = ['DELETE', 'GET', 'OPTIONS', 'PATCH', 'POST', 'PUT']
CORS_ALLOW_HEADERS = [
    'accept', 'accept-encoding', 'authorization', 'content-type',
    'dnt', 'origin', 'user-agent', 'x-csrftoken', 'x-requested-with'
]
CORS_EXPOSE_HEADERS = ['Authorization']

# LCP Server & External API Configurations
LCP_SERVER_URL = config('LCP_SERVER_URL', default='http://localhost:8989')
CLOUDFLARE_R2_BUCKET_NAME = config('CLOUDFLARE_R2_BUCKET_NAME', default='lahatheque-media')
CLOUDFLARE_R2_ENDPOINT = config('CLOUDFLARE_R2_ENDPOINT', default='')
CLOUDFLARE_R2_PUBLIC_DOMAIN = config('CLOUDFLARE_R2_PUBLIC_DOMAIN', default='')

# Static & Media
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# ── DRM & Protection Configuration ───────────────────────────────────────────
FIELD_ENCRYPTION_KEY = config('FIELD_ENCRYPTION_KEY', default='0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef')
DRM_DERIVED_CACHE_DIR = config('DRM_DERIVED_CACHE_DIR', default=str(BASE_DIR / 'var' / 'drm_cache'))
DRM_DERIVED_CACHE_TTL_HOURS = config('DRM_DERIVED_CACHE_TTL_HOURS', default=24, cast=int)
DRM_WATERMARK_DEFAULT_OPACITY = 0.20
DRM_MAX_REMOTE_FILE_SIZE_MB = 200

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

