"""
apps/catalog/storage.py — Storage Cloudflare R2 via django-storages (S3-compatible).
"""
from django.conf import settings
from storages.backends.s3boto3 import S3Boto3Storage
from botocore.exceptions import ClientError
from botocore.client import Config


class R2MediaStorage(S3Boto3Storage):
    """
    Storage Cloudflare R2 compatible S3.
    Téléverse directement les fichiers dans le bucket Cloudflare R2 avec timeouts sécurisés.
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

    # Domaine public R2 (ex: pub-98cb000b12874eae9d7deed8a2ead6ee.r2.dev)
    custom_domain = getattr(settings, 'CLOUDFLARE_R2_PUBLIC_DOMAIN', '')

    file_overwrite = False
    default_acl = None
    querystring_auth = False
    signature_version = 's3v4'
    addressing_style = 'path'

    client_config = Config(
        signature_version='s3v4',
        s3={'addressing_style': 'path'},
        connect_timeout=5,
        read_timeout=15,
        retries={'max_attempts': 2}
    )

    # Racine du bucket : permet aux ImageField (ex: avatars/, covers/, books/) d'être à la racine
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
        Retourne l'URL publique R2 absolue.
        Format : https://{public_domain}/{name}
        """
        if self.custom_domain:
            return f"https://{self.custom_domain.rstrip('/')}/{str(name).lstrip('/')}"
        return super().url(name, parameters=parameters, expire=expire, http_method=http_method)
