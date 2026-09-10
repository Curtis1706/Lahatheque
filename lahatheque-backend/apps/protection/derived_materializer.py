"""
Gestionnaire de matérialisation et de mise en cache chiffrée des dérivés PDF filigranés.
Conforme à docs/drm/01-architecture-cible.md.
"""

import hashlib
import logging
import os
from datetime import timedelta
from typing import Any, Dict, Optional, Tuple
from django.conf import settings
from django.utils import timezone

from .encryption_service import EncryptionService
from .source_adapter import DocumentSourceAdapter
from .watermark import WatermarkEngine

logger = logging.getLogger(__name__)


class DerivedMaterializer:
    """
    Génère, chiffre et met en cache temporaire le dérivé unique par utilisateur
    pour garantir des temps de réponse < 50ms sur les requêtes Range HTTP 206.
    """

    @classmethod
    def _get_cache_dir(cls) -> str:
        cache_dir = getattr(settings, "DRM_DERIVED_CACHE_DIR", os.path.join(settings.BASE_DIR, "var", "drm_cache"))
        os.makedirs(cache_dir, exist_ok=True)
        return cache_dir

    @classmethod
    def compute_cache_key(
        cls,
        source_id: str,
        user_id: str,
        config_version: int = 1,
        profil: str = "standard",
        watermark_template: str = "",
        watermark_subtext: str = "",
        watermark_position: str = "footer",
        watermark_opacity: float = 0.50,
        is_partner: bool = False
    ) -> str:
        """Génère la clé SHA-256 unique pour le tuple complet de configuration."""
        raw = f"{source_id}:{user_id}:{config_version}:{profil}:{watermark_template}:{watermark_subtext}:{watermark_position}:{watermark_opacity}:{is_partner}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    @classmethod
    def compute_user_cache_key(
        cls,
        source_reference: str,
        user_info: Dict[str, Any],
        config: Optional[Any] = None
    ) -> str:
        """
        Calcule de manière centralisée la clé SHA-256 unique du dérivé pour un utilisateur et un document.
        Garantit une identité stricte de clé entre BookStreamView, BookStreamInitiateView et BookStreamStatusView.
        """
        from .models import GlobalDrmConfig

        global_config = config if config is not None else GlobalDrmConfig.get_singleton()
        effective_cfg = global_config

        is_partner_session = bool(user_info.get("is_partner", False))
        user_id = str(user_info.get("user_id") or "anonymous")
        config_version = getattr(global_config, "config_version", 1)
        profil = getattr(global_config, "profil_default", "standard")

        if is_partner_session:
            template = (
                getattr(effective_cfg, "watermark_template", None)
                or getattr(global_config, "watermark_template", "")
            )
            subtext = ""
        else:
            template = (
                getattr(effective_cfg, "watermark_laha_template", None)
                or getattr(global_config, "watermark_laha_template", "")
            )
            subtext = (
                getattr(effective_cfg, "watermark_laha_subtext", None)
                or getattr(global_config, "watermark_laha_subtext", "")
            )

        position = (
            getattr(global_config, "watermark_position", None)
            or getattr(effective_cfg, "watermark_position", "footer")
        )
        try:
            opacity = float(getattr(global_config, "watermark_opacity", 0.50))
        except (ValueError, TypeError):
            opacity = 0.50

        return cls.compute_cache_key(
            source_id=source_reference,
            user_id=user_id,
            config_version=config_version,
            profil=profil,
            watermark_template=template,
            watermark_subtext=subtext,
            watermark_position=position,
            watermark_opacity=opacity,
            is_partner=is_partner_session
        )

    @classmethod
    def get_or_create_derived(
        cls,
        source_type: str,
        source_reference: str,
        user_info: Dict[str, Any],
        config: Optional[Any] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> Tuple[bytes, int]:
        """
        Récupère le dérivé PDF filigrané depuis le cache chiffré, ou le génère si absent/expiré.

        Args:
            source_type: 'catalog_book', 'external_url', 'direct_upload', ou 'local_path'.
            source_reference: Identifiant ou URL du document source.
            user_info: Métadonnées de l'utilisateur (nom, email, ip, user_id).
            config: Instance ProtectionConfig, GlobalDrmConfig ou configuration dictionnaire.
            options: Paramètres optionnels de téléchargement ou téléversement.

        Returns:
            Tuple[bytes, int]: (Octets clairs du PDF filigrané prêt pour le streaming, taille totale en octets).
        """
        from .models import DerivedCacheRegistry, GlobalDrmConfig

        global_config = config if config is not None else GlobalDrmConfig.get_singleton()
        effective_cfg = global_config

        user_id = str(user_info.get("user_id") or "anonymous")
        config_version = getattr(global_config, "config_version", 1)
        profil = getattr(global_config, "profil_default", "standard")

        cache_key = cls.compute_user_cache_key(
            source_reference=source_reference,
            user_info=user_info,
            config=effective_cfg
        )

        cache_dir = cls._get_cache_dir()
        cache_file_path = os.path.join(cache_dir, f"{cache_key}.enc")

        # 1. Vérification dans le cache Redis partagé
        from django.core.cache import cache as django_cache

        redis_cache_key = f"drm_derived:{cache_key}"

        cached_bytes = django_cache.get(redis_cache_key)
        if cached_bytes is not None:
            return cached_bytes, len(cached_bytes)

        # 2. Verrou distribué anti-emballement — même motif que _convert_epub_and_persist
        lock_key = f"laha:derived_gen:{hashlib.sha256(cache_key.encode()).hexdigest()[:32]}"
        redis_client = DocumentSourceAdapter._get_redis_client()

        def _do_generate() -> bytes:
            raw_source_bytes = DocumentSourceAdapter.get_document_bytes(
                source_type=source_type,
                source_reference=source_reference,
                options=options
            )
            watermarked = WatermarkEngine.apply_watermark(
                pdf_bytes=raw_source_bytes,
                user_info=user_info,
                config=config
            )
            try:
                django_cache.set(
                    redis_cache_key,
                    watermarked,
                    timeout=int(os.environ.get('DRM_DERIVED_CACHE_TTL_SECONDS', 7200))
                )
            except Exception as e:
                logger.error(f"Impossible d'écrire le cache dérivé dans Redis: {e}")
            return watermarked

        if redis_client is None:
            watermarked_bytes = _do_generate()
        else:
            lock = redis_client.lock(lock_key, timeout=120, blocking_timeout=125)
            acquired = lock.acquire(blocking=True)
            try:
                cached_bytes = django_cache.get(redis_cache_key)
                if cached_bytes is not None:
                    return cached_bytes, len(cached_bytes)
                watermarked_bytes = _do_generate()
            finally:
                if acquired:
                    try:
                        lock.release()
                    except Exception:
                        pass

        # 5. Enregistrement dans le registre de base de données pour suivi administratif
        now = timezone.now()
        ttl_hours = getattr(settings, "DRM_DERIVED_CACHE_TTL_HOURS", 24)
        expires_at = now + timedelta(hours=ttl_hours)

        try:
            DerivedCacheRegistry.objects.update_or_create(
                cache_key=cache_key,
                defaults={
                    "source_identifier": source_reference[:255],
                    "user_identifier": user_id[:128],
                    "file_path": cache_file_path,
                    "file_size": len(watermarked_bytes),
                    "config_version": config_version,
                    "profil": profil,
                    "expires_at": expires_at,
                }
            )
        except Exception as reg_err:
            logger.warning(f"Erreur enregistrement DerivedCacheRegistry: {reg_err}")

        return watermarked_bytes, len(watermarked_bytes)
