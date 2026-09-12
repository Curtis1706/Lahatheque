#!/bin/sh
set -e

echo "==> [LAHAThèque Backend] Démarrage du conteneur..."

# Si le conteneur est configuré avec le rôle Celery
if [ "$CONTAINER_ROLE" = "celery" ] || [ "$CELERY_WORKER" = "true" ]; then
    echo "==> [LAHAThèque Backend] Lancement du Celery Worker + Beat..."
    exec celery -A config worker -B -l info --concurrency=2
fi

# Si la commande principale est gunicorn ou le serveur web, on applique les migrations et collectstatic
if [ "$1" = "gunicorn" ] || [ "$1" = "web" ]; then
    echo "==> Application des migrations Django..."
    python manage.py migrate --noinput

    echo "==> Collecte des fichiers statiques (WhiteNoise)..."
    python manage.py collectstatic --noinput

    export OMP_THREAD_LIMIT=1
    export OMP_NUM_THREADS=1

    echo "==> Lancement du serveur Gunicorn WSGI..."
    exec gunicorn config.wsgi:application \
        --bind 0.0.0.0:${PORT:-8000} \
        --workers ${GUNICORN_WORKERS:-3} \
        --threads ${GUNICORN_THREADS:-2} \
        --timeout ${GUNICORN_TIMEOUT:-300} \
        --access-logfile - \
        --error-logfile -
fi

# Pour les autres services (Celery Worker, Celery Beat, commandes custom)
exec "$@"
