# Guide de Déploiement et Validation Rapide : Streaming Haute Performance

Ce document présente la configuration Nginx optimisée et les réglages Gunicorn recommandés pour le VPS LAHAThèque (8 vCPU AMD EPYC, 32 Go RAM, SSD NVMe 387 Go).

---

## 1. Configuration Nginx : Délégation X-Accel-Redirect

Pour libérer instantanément les workers Python (en moins de 5 ms) lors du streaming de fichiers protégés volumineux (ex: 60 Mo), Nginx prend en charge directement la distribution des fragments Range HTTP 206 depuis le disque local SSD NVMe.

### Bloc de configuration Nginx (`/etc/nginx/sites-available/lahatheque`)

Ajouter le bloc interne suivant dans la configuration de votre serveur virtuel Nginx (bloc `server` de `api.lahatheque.com` ou proxy principal) :

```nginx
# Emplacement interne pour la distribution des dérivés protégés
# Seul Django peut déclencher cette route via l'en-tête X-Accel-Redirect
location /protected_derived/ {
    internal;
    alias /var/www/lahatheque-backend/var/drm_cache/;

    # Optimisations I/O Linux Kernel pour SSD NVMe
    sendfile on;
    sendfile_max_chunk 512k;
    tcp_nopush on;
    tcp_nodelay on;

    # Gestion du cache et des fragments Range RFC 7233
    add_header Accept-Ranges bytes;
    add_header Cache-Control "private, no-store, must-revalidate";
    add_header X-Content-Type-Options "nosniff";
    add_header X-Frame-Options "SAMEORIGIN";

    # Sécurité supplémentaire
    client_max_body_size 0;
}
```

### Vérification et rechargement de Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 2. Activation dans l'environnement Django (`.env`)

Dans le fichier `.env` du backend Django en production :

```env
USE_X_ACCEL_REDIRECT=True
DRM_DERIVED_CACHE_DIR=/var/www/lahatheque-backend/var/drm_cache
DRM_DERIVED_CACHE_TTL_HOURS=24
```

---

## 3. Dimensionnement Recommandé de Gunicorn

Sur le serveur 8 vCPU / 32 Go RAM, la configuration initiale à 3 workers était insuffisante lors des pics de consultation.

### Configuration recommandée (`/etc/systemd/system/gunicorn.service`)

```bash
# Formule: (2 * vCPU) + 1 = 17 workers ou 8 workers avec 4 threads chacun
ExecStart=/var/www/lahatheque-backend/venv/bin/gunicorn \
    --workers 9 \
    --threads 4 \
    --worker-class gthread \
    --worker-connections 1000 \
    --timeout 120 \
    --keep-alive 5 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --bind 127.0.0.1:8000 \
    config.wsgi:application
```

Cette configuration permet à Django de traiter simultanément jusqu'à 36 requêtes concurrentes tout en maintenant l'utilisation mémoire sous les 4 Go de RAM.

---

## 4. Procédure de Test et Validation

### Test 1 : Requête Range partielle HTTP 206
Vérifier que le serveur renvoie bien le fragment de 128 Ko avec le code HTTP 206 :

```bash
curl -I -H "Range: bytes=0-131071" \
     -H "Cookie: laha_access=<VOTRE_TOKEN>" \
     https://api.lahatheque.com/api/v1/catalog/books/<BOOK_ID>/stream/
```

Résultat attendu :
- Code de statut : `HTTP/1.1 206 Partial Content` (ou `HTTP/2 206`)
- `Content-Range: bytes 0-131071/<TAILLE_TOTALE>`
- `Content-Length: 131072`
- `Accept-Ranges: bytes`

### Test 2 : Contrôle de la mémoire Redis
Vérifier que les gros PDF de 60 Mo ne sont plus stockés dans Redis :

```bash
redis-cli -n 1 DBSIZE
redis-cli -n 1 --bigkeys
```

Aucun objet binaire volumineux ne doit figurer dans la clé `lahatheque:drm_derived:*`.

### Test 3 : Nettoyage planifié du cache SSD (Crontab)
Le registre `DerivedCacheRegistry` expire automatiquement les dérivés après 24 heures. Un cron léger peut purger les fichiers orphelins :

```bash
# Purge quotidienne des fichiers de cache vieux de plus de 24h
0 4 * * * find /var/www/lahatheque-backend/var/drm_cache/ -type f -name "*.pdf" -mtime +1 -delete
```
