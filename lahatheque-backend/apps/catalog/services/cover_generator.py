"""
Service d'extraction et d'optimisation de couvertures de livres (PDF -> WebP -> Cloudflare R2).
Permet d'extraire la premiere page d'un document source pour en faire la couverture officielle du livre.

Architecture dual-bucket :
- get_r2_books_client()  : LECTURE SEULE sur laha-books-production (PDF/EPUB sources)
- get_r2_s3_client()     : LECTURE/ECRITURE sur lahatheque (couvertures, audio, uploads plateforme)
"""

import io
import logging
from typing import Any, Optional, Tuple
from botocore.config import Config
import boto3
from django.conf import settings
from PIL import Image
import fitz  # PyMuPDF

logger = logging.getLogger(__name__)


def _build_boto3_client(endpoint: str, access_key: str, secret_key: str) -> Any:
    """Helper interne : construit un client boto3 S3-compatible pour Cloudflare R2."""
    if not endpoint.startswith('http://') and not endpoint.startswith('https://'):
        endpoint = f"https://{endpoint}"
    return boto3.client(
        's3',
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name='auto',
        config=Config(
            signature_version='s3v4',
            s3={'addressing_style': 'path'},
            connect_timeout=10,
            read_timeout=60,
            retries={'max_attempts': 3}
        )
    )


def get_r2_books_client() -> Any:
    """
    Client boto3 dedie a la LECTURE des PDFs/EPUBs depuis laha-books-production.
    Utilise CLOUDFLARE_R2_BOOKS_* du .env. Ne pas utiliser pour ecrire.
    """
    account_id = getattr(settings, 'CLOUDFLARE_R2_BOOKS_ACCOUNT_ID', '4f3c7fa9b26ef9bec6419a0c3d193a3e')
    endpoint = (
        getattr(settings, 'CLOUDFLARE_R2_BOOKS_ENDPOINT', '')
        or f"https://{account_id}.r2.cloudflarestorage.com"
    )
    access_key = getattr(settings, 'CLOUDFLARE_R2_BOOKS_ACCESS_KEY_ID', '8ca875a254458fe5a9711e76de89342a')
    secret_key = getattr(
        settings, 'CLOUDFLARE_R2_BOOKS_SECRET_ACCESS_KEY',
        '3ed1fa585405f44759f81a2151e716ab33ad93427a40f97f30b1534243fe7031'
    )
    return _build_boto3_client(endpoint, access_key, secret_key)


def get_r2_s3_client() -> Any:
    """
    Client boto3 pour le bucket principal lahatheque (LECTURE + ECRITURE).
    Utilise CLOUDFLARE_R2_* du .env.
    Sert pour : couvertures generees, audio, fichiers deposes par les maquettistes, etc.
    """
    account_id = getattr(settings, 'CLOUDFLARE_ACCOUNT_ID', '6bc23b852fcac9f2e57c887c91792451')
    endpoint = (
        getattr(settings, 'CLOUDFLARE_R2_ENDPOINT', '')
        or f"https://{account_id}.r2.cloudflarestorage.com"
    )
    access_key = getattr(settings, 'CLOUDFLARE_R2_ACCESS_KEY_ID', '')
    secret_key = getattr(settings, 'CLOUDFLARE_R2_SECRET_ACCESS_KEY', '')
    return _build_boto3_client(endpoint, access_key, secret_key)



def extract_cover_image_bytes(
    pdf_bytes: bytes,
    max_width: int = 800,
    quality: int = 85
) -> bytes:
    """
    Extrait la premiere page d'un PDF via PyMuPDF (fitz), la convertit
    en image haute definition et l'optimise au format WebP.
    """
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        if len(doc) == 0:
            raise ValueError("Le document PDF ne contient aucune page.")

        page = doc[0]

        # Rendu matriciel haute resolution (2.0x pour nettete)
        zoom = 2.0
        matrix = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=matrix, alpha=False)

        # Conversion Pixmap PyMuPDF -> PIL Image
        img = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)

        # Redimensionnement proportionnel si largeur superieure a max_width
        if img.width > max_width:
            ratio = max_width / float(img.width)
            new_height = int(float(img.height) * ratio)
            img = img.resize((max_width, new_height), Image.Resampling.LANCZOS)

        # Encodage WebP optimise
        output_io = io.BytesIO()
        img.save(output_io, format="WEBP", quality=quality, method=6)
        webp_bytes = output_io.getvalue()
        output_io.close()
        doc.close()

        logger.info(
            f"[CoverGenerator] Couverture extraite avec succes : "
            f"{img.width}x{img.height}px, {len(webp_bytes)} octets"
        )
        return webp_bytes

    except Exception as e:
        logger.error(f"[CoverGenerator] Erreur lors de l'extraction de couverture: {e}")
        raise


def generate_and_upload_cover(
    pdf_bytes: bytes,
    book_uuid: str,
    s3_client: Optional[Any] = None,
    bucket_name: Optional[str] = None
) -> Tuple[str, str]:
    """
    Extrait la couverture depuis les octets PDF et la televerse vers le bucket principal lahatheque.
    Les couvertures sont TOUJOURS ecrites dans lahatheque (bucket media principal), jamais dans
    laha-books-production (lecture seule).
    Retourne un tuple (r2_key, public_url).
    """
    # Toujours ecrire dans le bucket principal lahatheque
    write_client = s3_client or get_r2_s3_client()
    target_bucket = bucket_name or getattr(settings, 'CLOUDFLARE_R2_BUCKET_NAME', 'lahatheque')

    webp_bytes = extract_cover_image_bytes(pdf_bytes)
    r2_key = f"covers/{book_uuid}/cover.webp"

    write_client.put_object(
        Bucket=target_bucket,
        Key=r2_key,
        Body=webp_bytes,
        ContentType="image/webp",
        CacheControl="public, max-age=31536000, immutable"
    )

    public_domain = getattr(settings, 'CLOUDFLARE_R2_PUBLIC_DOMAIN', '')
    if public_domain:
        public_url = f"https://{public_domain.rstrip('/')}/{r2_key}"
    else:
        public_url = f"/api/bff/catalog/books/{book_uuid}/cover/"

    logger.info(f"[CoverGenerator] Couverture televersee sur R2 (lahatheque) : {r2_key}")
    return r2_key, public_url
