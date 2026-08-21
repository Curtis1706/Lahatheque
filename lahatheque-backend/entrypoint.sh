#!/bin/sh
set -e

echo "==> [LAHAThèque Backend] Démarrage du conteneur..."

# Si la commande principale est gunicorn ou le serveur web, on applique les migrations et collectstatic
if [ "$1" = "gunicorn" ] || [ "$1" = "web" ]; then
    echo "==> Application des migrations Django..."
    python manage.py migrate --noinput

    echo "==> Collecte des fichiers statiques (WhiteNoise)..."
    python manage.py collectstatic --noinput

    echo "==> Lancement du serveur Gunicorn WSGI..."
    exec gunicorn config.wsgi:application \
        --bind 0.0.0.0:${PORT:-8000} \
        --workers ${GUNICORN_WORKERS:-3} \
        --threads ${GUNICORN_THREADS:-2} \
        --timeout ${GUNICORN_TIMEOUT:-120} \
        --access-logfile - \
        --error-logfile -
fi

# Pour les autres services (Celery Worker, Celery Beat, commandes custom)
exec "$@"
