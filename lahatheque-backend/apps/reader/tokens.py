"""
Gestionnaire de tokens JWT éphémères pour les sessions de lecture hébergées.
Conforme à specs/009-api-lecteur-heberge/ et aux règles de sécurité LAHAThèque.
"""

import hashlib
import logging
from typing import Any, Dict, Optional, Tuple
import jwt
from django.conf import settings
from django.utils import timezone
from .models import ReaderSession

logger = logging.getLogger(__name__)


class ReaderTokenError(Exception):
    """Exception levée en cas d'erreur de décodage ou de validation de token."""
    pass


class ReaderTokenService:
    """Service d'encodage, de signature et de validation des jetons de session."""

    ALGORITHM = "HS256"

    @classmethod
    def generate_token_for_session(cls, session: ReaderSession) -> Tuple[str, str]:
        """
        Génère un token JWT signé pour une ReaderSession et calcule son empreinte SHA-256.

        Args:
            session: L'instance ReaderSession pour laquelle générer le jeton.

        Returns:
            Tuple[str, str]: (token_jwt, token_hash_sha256)
        """
        now_ts = int(timezone.now().timestamp())
        exp_ts = int(session.expires_at.timestamp())

        doc_title = session.ouvrage.titre if session.ouvrage else session.custom_document_title
        doc_author = session.ouvrage.auteur if session.ouvrage else session.custom_document_author

        payload: Dict[str, Any] = {
            "sub": str(session.id),
            "session_id": str(session.id),
            "partner_id": str(session.partner_id),
            "partner_name": session.partner.name,
            "user_ref": session.end_user.external_ref,
            "user_name": session.end_user.display_name,
            "user_email": session.end_user.email,
            "source_type": session.source_type,
            "book_id": str(session.ouvrage_id) if session.ouvrage_id else None,
            "document_title": doc_title,
            "document_author": doc_author,
            "return_url": session.return_url,
            "permissions": session.permissions,
            "iat": now_ts,
            "exp": exp_ts,
        }

        token_str = jwt.encode(payload, settings.READER_JWT_SIGNING_KEY, algorithm=cls.ALGORITHM)
        token_hash = hashlib.sha256(token_str.encode("utf-8")).hexdigest()

        return token_str, token_hash

    @classmethod
    def decode_and_validate_token(cls, token_str: str) -> ReaderSession:
        """
        Décode un token JWT, vérifie sa signature, son expiration et retrouve la session en base.

        Args:
            token_str: La chaîne JWT reçue.

        Returns:
            ReaderSession: L'instance de session valide avec relations pré-chargées.

        Raises:
            ReaderTokenError: Si le token est invalide, expiré ou révoqué.
        """
        if not token_str:
            raise ReaderTokenError("Token de session manquant")

        try:
            payload = jwt.decode(token_str, settings.READER_JWT_SIGNING_KEY, algorithms=[cls.ALGORITHM])
        except jwt.ExpiredSignatureError:
            raise ReaderTokenError("La session de lecture a expiré")
        except jwt.InvalidTokenError as e:
            raise ReaderTokenError(f"Jeton de session invalide: {str(e)}")

        session_id = payload.get("session_id")
        if not session_id:
            raise ReaderTokenError("Identifiant de session manquant dans le token")

        token_hash = hashlib.sha256(token_str.encode("utf-8")).hexdigest()

        session = ReaderSession.objects.select_related(
            'partner', 'ouvrage', 'end_user'
        ).filter(id=session_id).first()

        if not session:
            raise ReaderTokenError("Session de lecture introuvable")

        if session.token_hash != token_hash:
            raise ReaderTokenError("Empreinte de session invalide ou révoquée")

        if not session.is_valid:
            raise ReaderTokenError(f"Session inactive ou révoquée (Statut: {session.status})")

        return session
