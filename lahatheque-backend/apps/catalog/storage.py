"""
apps/catalog/storage.py — Storage Cloudflare R2 via django-storages (S3-compatible).
"""
from django.conf import settings
from storages.backends.s3boto3 import S3Boto3Storage
from botocore.exceptions import ClientError
from botocore.client import Config


class R2MediaStorage(S3Boto3Storage):
    """
    Storage Cloudflare R2 compatible S3 (DRM-02).
    - Fichiers protégés (books, audios, manuscrits) : URLs signées temporaires HMAC (expire 3600s),
      sans custom_domain pour garantir la signature native S3/R2.
    - Fichiers publics (couvertures, avatars) : servis via le domaine public direct sans signature.
    """
    bucket_name = getattr(settings, 'CLOUDFLARE_R2_BUCKET_NAME', 'lahatheque')
    
    @property
    def endpoint_url(self):
        url = getattr(settings, 'CLOUDFLARE_R2_ENDPOINT', '')
        if url and not url.startswith('http://') and not url.startswith('https://'):
            return f"https://{url}"
        return url

    access_key = getattr(settings, 'CLOUDFLARE_R2_ACCESS_KEY_ID', '')
    secret_key = getattr(settings, 'CLOUDFLARE_R2_SECRET_ACCESS_KEY', '')
    region_name = 'auto'

    # DRM-02: custom_domain doit impérativement être None pour permettre à S3Boto3Storage
    # de générer les signatures HMAC S3/R2 (sinon super().url() court-circuite la signature)
    custom_domain = None

    file_overwrite = False
    default_acl = None
    querystring_auth = True
    querystring_expire = 3600  # 1 heure par défaut
    signature_version = 's3v4'
    addressing_style = 'path'

    client_config = Config(
        signature_version='s3v4',
        s3={'addressing_style': 'path'},
        connect_timeout=5,
        read_timeout=15,
        retries={'max_attempts': 2}
    )

    # Racine du bucket : permet aux ImageField/FileField d'être rangés par préfixe
    location = ''

    def exists(self, name):
        """
        Vérifie l'existence d'un objet en gérant les particularités de codes d'erreur de Cloudflare R2.
        """
        try:
            self.connection.meta.client.head_object(Bucket=self.bucket_name, Key=name)
            return True
        except ClientError as err:
            code = str(err.response.get('Error', {}).get('Code', ''))
            if code in ('404', 'NoSuchKey', 'NotFound', '403', 'Forbidden', 'AccessDenied'):
                return False
            raise
        except Exception:
            return False

    def url(self, name, parameters=None, expire=None, http_method=None):
        """
        DRM-02:
        - Médias publics (covers/, avatars/, previews/) : URL publique directe via CLOUDFLARE_R2_PUBLIC_DOMAIN.
        - Médias protégés (books/, audio_tracks/, manuscrits, etc.) : URL signée S3/R2 temporaire.
        """
        clean_name = str(name).lstrip('/')
        public_domain = getattr(settings, 'CLOUDFLARE_R2_PUBLIC_DOMAIN', '')

        # Préfixes expressément publics
        is_public_prefix = clean_name.startswith(('covers/', 'avatars/', 'previews/'))

        if is_public_prefix and public_domain:
            return f"https://{public_domain.rstrip('/')}/{clean_name}"

        # Fichiers protégés : génération d'URL signée temporaire avec expiration contrôlée
        token_expire = expire or self.querystring_expire
        return super().url(name, parameters=parameters, expire=token_expire, http_method=http_method)


class R2PublicMediaStorage(R2MediaStorage):
    """Storage dédié aux médias 100% publics (couvertures, avatars)."""
    querystring_auth = False
    custom_domain = getattr(settings, 'CLOUDFLARE_R2_PUBLIC_DOMAIN', '')

    def url(self, name, parameters=None, expire=None, http_method=None):
        if self.custom_domain:
            return f"https://{self.custom_domain.rstrip('/')}/{str(name).lstrip('/')}"
        return super().url(name, parameters=parameters, expire=expire, http_method=http_method)


class R2ProtectedMediaStorage(R2MediaStorage):
    """Storage dédié aux ouvrages et contenus protégés avec signature cryptographique S3/R2 obligatoire."""
    custom_domain = None
    querystring_auth = True
    querystring_expire = 3600

