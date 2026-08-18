"""
media/r2_storage.py — Storage Cloudflare R2 via django-storages (S3-compatible).

Remplace SmartMediaCloudinaryStorage de common/cloudinary_storages.py.
Même interface, même préfixe media/ pour la rétrocompatibilité des chemins en base.
"""
from django.conf import settings
from storages.backends.s3boto3 import S3Boto3Storage


class R2MediaStorage(S3Boto3Storage):
    """
    Storage Cloudflare R2 compatible S3.
    URL publiques via le domaine public R2 configuré dans .env.
    """
    # Bucket et endpoint R2
    bucket_name = settings.CLOUDFLARE_R2_BUCKET_NAME
    endpoint_url = settings.CLOUDFLARE_R2_ENDPOINT
    region_name = 'auto'  # Requis pour Cloudflare R2

    # Domaine public R2 (ex: pub-04ee70fd927649918bb42c881e0db428.r2.dev)
    custom_domain = settings.CLOUDFLARE_R2_PUBLIC_DOMAIN

    # Comportement fichiers
    file_overwrite = False   # Ne pas écraser les fichiers existants
    default_acl = None       # R2 gère l'accès public via le domaine public, pas via ACL
    querystring_auth = False # URLs publiques permanentes (pas de signature temporaire)

    # Préfixe ajusté pour correspondre à la structure réelle du bucket (media/media/)
    location = 'media/media'

    def url(self, name):
        """
        Retourne l'URL publique R2.
        Format : https://{public_domain}/media/{name}
        """
        url = super().url(name)
        return url
