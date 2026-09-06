# ==============================================================================
# Dockerfile Production — LAHAThèque Backend Django v3.2
# Optimisé pour déploiement VPS via Coolify / Docker Compose
# ==============================================================================

# --- Stage 1 : Builder ---
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    libxml2-dev \
    libxslt1-dev \
    zlib1g-dev \
    curl \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Installation des dépendances Python
COPY requirements.txt .
COPY requirements/ requirements/
RUN pip install --upgrade pip setuptools wheel && \
    pip install --no-cache-dir -r requirements.txt

# --- Stage 2 : Runtime Final ---
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=config.settings.production \
    PORT=8000

# Paquets d'exécution nécessaires
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libxml2 \
    libxslt1.1 \
    curl \
    tesseract-ocr \
    tesseract-ocr-fra \
    tesseract-ocr-eng \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copie des packages installés depuis le builder
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copie du code source applicatif
COPY . .

# Configuration du script d'entrée
RUN chmod +x /app/entrypoint.sh

# Création des dossiers médias et statiques
RUN mkdir -p /app/staticfiles /app/media /app/var/logs

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["gunicorn"]
