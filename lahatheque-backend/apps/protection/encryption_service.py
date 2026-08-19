"""
Service de chiffrement et déchiffrement AES-256-GCM pour le stockage et le cache DRM.
Conforme au standard NIST SP 800-38D (docs/drm/01-architecture-cible.md).
"""

import os
import logging
from typing import Union
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from django.conf import settings

logger = logging.getLogger(__name__)


class EncryptionService:
    """
    Service cryptographique assurant le chiffrement symétrique authentifié AES-256-GCM
    des fichiers protégés au repos et dans le cache éphémère.
    """

    @classmethod
    def _get_key(cls) -> bytes:
        """Récupère la clé de 256 bits (32 octets) depuis les paramètres."""
        raw_key = getattr(settings, "FIELD_ENCRYPTION_KEY", "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef")
        if isinstance(raw_key, str):
            if len(raw_key) == 64:  # Hex string
                try:
                    return bytes.fromhex(raw_key)
                except ValueError:
                    pass
            # Troncature ou padding à 32 octets
            key_bytes = raw_key.encode("utf-8")
            return key_bytes.ljust(32, b"0")[:32]
        return bytes(raw_key)[:32]

    @classmethod
    def encrypt(cls, data: Union[bytes, bytearray]) -> bytes:
        """
        Chiffre un flux d'octets avec AES-256-GCM.

        Structure du retour: [Nonce 12 octets] + [Ciphertext chiffré] + [Auth Tag 16 octets]

        Args:
            data: Octets clairs à chiffrer.

        Returns:
            bytes: Octets chiffrés avec nonce inclus.
        """
        if not data:
            return b""

        key = cls._get_key()
        aesgcm = AESGCM(key)
        nonce = os.urandom(12)  # Nonce de 96 bits recommandé par le NIST
        ciphertext = aesgcm.encrypt(nonce, bytes(data), None)
        return nonce + ciphertext

    @classmethod
    def decrypt(cls, encrypted_data: Union[bytes, bytearray]) -> bytes:
        """
        Déchiffre un flux d'octets chiffré par encrypt().

        Args:
            encrypted_data: Flux contenant nonce (12 o) + ciphertext + tag.

        Returns:
            bytes: Octets clairs déchiffrés.

        Raises:
            ValueError: Si les données sont corrompues ou l'intégrité compromise.
        """
        if not encrypted_data or len(encrypted_data) < 28:
            raise ValueError("Données chiffrées invalides ou trop courtes")

        key = cls._get_key()
        aesgcm = AESGCM(key)
        nonce = bytes(encrypted_data[:12])
        ciphertext = bytes(encrypted_data[12:])

        try:
            return aesgcm.decrypt(nonce, ciphertext, None)
        except Exception as e:
            logger.error(f"Échec de déchiffrement AES-256-GCM: {e}")
            raise ValueError("Échec de déchiffrement: clé invalide ou données corrompues")
