# ─────────────────────────────────────────────────────────────
# Dockerfile pour déploiement production sur Render
# Backend Django + Gunicorn + WhiteNoise (fichiers statiques)
# ─────────────────────────────────────────────────────────────

# Stage 1 - Builder
FROM python:3.11-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    gcc \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2 - Production
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copier les dépendances installées
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

COPY . .

RUN DATABASE_URL=postgres://none:none@localhost:5432/none python manage.py collectstatic --noinput

EXPOSE $PORT

CMD ["gunicorn", "lahaacademia.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--timeout", "600"]
