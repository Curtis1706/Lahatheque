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

        global_config = GlobalDrmConfig.get_singleton()
        effective_cfg = config or global_config

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

        cache_key = cls.compute_cache_key(
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

        cache_dir = cls._get_cache_dir()
        cache_file_path = os.path.join(cache_dir, f"{cache_key}.enc")

        # 1. Vérification dans le registre et sur le disque
        now = timezone.now()
        entry = DerivedCacheRegistry.objects.filter(cache_key=cache_key, expires_at__gt=now).first()

        if entry and os.path.exists(cache_file_path):
            try:
                with open(cache_file_path, "rb") as f:
                    encrypted_data = f.read()
                clean_bytes = EncryptionService.decrypt(encrypted_data)
                return clean_bytes, len(clean_bytes)
            except Exception as e:
                logger.warning(f"Erreur lecture cache dérivé ({cache_key}), re-génération: {e}")

        # 2. Récupération de la source via l'adaptateur universel
        raw_source_bytes = DocumentSourceAdapter.get_document_bytes(
            source_type=source_type,
            source_reference=source_reference,
            options=options
        )

        # 3. Application du filigrane PyMuPDF
        watermarked_bytes = WatermarkEngine.apply_watermark(
            pdf_bytes=raw_source_bytes,
            user_info=user_info,
            config=config
        )

        # 4. Chiffrement et persistance dans le cache éphémère
        encrypted_bytes = EncryptionService.encrypt(watermarked_bytes)
        try:
            with open(cache_file_path, "wb") as f:
                f.write(encrypted_bytes)
        except Exception as e:
            logger.error(f"Impossible d'écrire le cache dérivé sur disque: {e}")

        # 5. Enregistrement dans le registre de base de données
        ttl_hours = getattr(settings, "DRM_DERIVED_CACHE_TTL_HOURS", 24)
        expires_at = now + timedelta(hours=ttl_hours)

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

        return watermarked_bytes, len(watermarked_bytes)
