"""
Classes de permissions DRF pour l'API Lecteur Hébergé.
Garantit la sécurité d'accès des partenaires et des sessions éphémères.
"""

from typing import Any
import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from .models import PartnerApp, ReaderSession
from .tokens import ReaderTokenService, ReaderTokenError
from .auth_utils import verify_secret


def _authenticate_by_client_credentials(request) -> PartnerApp | None:
    """
    Authentifie un partenaire par client_id + client_secret.
    Cherche les identifiants UNIQUEMENT dans les en-tetes HTTP (X-Client-Id / X-Client-Secret).
    L'acceptation dans le corps JSON est supprimee car les corps de requete sont souvent
    journalises en clair par les outils APM et proxies. (S-09)
    """
    client_id = (
        request.headers.get("X-Client-Id")
        or request.META.get("HTTP_X_CLIENT_ID")
        or (request.headers.get("x-client-id") if hasattr(request, "headers") else None)
    )
    client_secret = (
        request.headers.get("X-Client-Secret")
        or request.META.get("HTTP_X_CLIENT_SECRET")
        or (request.headers.get("x-client-secret") if hasattr(request, "headers") else None)
    )
    # client_id et client_secret depuis le body JSON supprimes (S-09) :
    # les credentials ne doivent transiter que par les en-tetes HTTP.

    if not client_id or not client_secret:
        return None

    client_id = str(client_id).strip()
    client_secret = str(client_secret).strip()

    partner = PartnerApp.objects.filter(client_id=client_id, is_active=True).first()
    if not partner:
        try:
            partner = PartnerApp.objects.filter(id=client_id, is_active=True).first()
        except Exception:
            partner = None

    if not partner or not partner.client_secret_hash:
        return None

    if not verify_secret(client_secret, partner.client_secret_hash):
        return None

    return partner


class PartnerAuthentication(BaseAuthentication):
    """
    Authentification Machine-to-Machine pour les partenaires.
    Deux méthodes supportées : Bearer JWT signé, ou client_id + client_secret.
    Le secret est TOUJOURS requis — plus aucune authentification par client_id seul.
    """
    def authenticate(self, request):
        # 1. Bearer JWT (émis côté serveur pour les intégrations OAuth2)
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token_str = auth_header.split(" ", 1)[1].strip()
            signing_key: str = str(getattr(settings, "OAUTH2_PARTNER_JWT_SIGNING_KEY", settings.SECRET_KEY))
            try:
                payload = jwt.decode(token_str, signing_key, algorithms=["HS256"])
                jti = payload.get("jti")
                if jti:
                    from apps.accounts.oauth2.models import RevokedPartnerToken
                    if RevokedPartnerToken.objects.filter(jti=jti).exists():
                        return None

                partner_id = payload.get("partner_id")
                if partner_id:
                    partner = PartnerApp.objects.filter(id=partner_id, is_active=True).first()
                    if partner:
                        request.partner = partner
                        if hasattr(request, "_request"):
                            request._request.partner = partner
                        return (None, partner)
            except jwt.InvalidTokenError:
                pass  # Token JWT invalide : comportement attendu, on passe au fallback
            except Exception as jwt_err:
                import logging as _logging
                _logging.getLogger(__name__).warning(
                    f"[PartnerAuthentication] Erreur inattendue lors de la verification JWT: {jwt_err}"
                )

        # 2. client_id + client_secret (headers ou body)
        partner = _authenticate_by_client_credentials(request)
        if partner:
            request.partner = partner
            if hasattr(request, "_request"):
                request._request.partner = partner
            return (None, partner)

        return None


class IsAuthenticatedPartner(BasePermission):
    """
    Vérifie que la requête émane d'une application partenaire active,
    authentifiée par jeton Bearer JWT OU par client_id + client_secret vérifiés.
    Aucun chemin d'authentification ne bypass la vérification du secret.
    """

    def has_permission(self, request: Request, view: Any) -> bool:
        # 1. Bearer JWT
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token_str = auth_header.split(" ", 1)[1].strip()
            signing_key: str = str(getattr(settings, "OAUTH2_PARTNER_JWT_SIGNING_KEY", settings.SECRET_KEY))
            try:
                payload = jwt.decode(token_str, signing_key, algorithms=["HS256"])
                jti = payload.get("jti")
                if jti:
                    from apps.accounts.oauth2.models import RevokedPartnerToken
                    if RevokedPartnerToken.objects.filter(jti=jti).exists():
                        return False

                partner_id = payload.get("partner_id")
                if partner_id:
                    partner = PartnerApp.objects.filter(id=partner_id, is_active=True).first()
                    if partner:
                        request.partner = partner
                        if hasattr(request, "_request"):
                            request._request.partner = partner
                        return True
            except jwt.InvalidTokenError:
                pass  # Token JWT invalide : comportement attendu, on passe au fallback
            except Exception as jwt_err:
                import logging as _logging
                _logging.getLogger(__name__).warning(
                    f"[IsAuthenticatedPartner] Erreur inattendue lors de la verification JWT: {jwt_err}"
                )

        # 2. client_id + client_secret — SEUL chemin d'authentification directe
        partner = _authenticate_by_client_credentials(request)
        if partner:
            request.partner = partner
            if hasattr(request, "_request"):
                request._request.partner = partner
            return True

        return False


class IsValidReaderSession(BasePermission):
    """
    Vérifie que la requête porte un jeton JWT de session de lecture valide et actif.
    Injecte l'objet `reader_session` et `partner` dans la requête.
    """

    def has_permission(self, request: Request, view: Any) -> bool:
        token_str = request.headers.get("X-Reader-Token")

        if not token_str:
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                token_str = auth_header.split(" ", 1)[1].strip()

        if not token_str and hasattr(request, 'data') and isinstance(request.data, dict):
            token_str = request.data.get("token")

        if not token_str:
            token_str = (
                request.query_params.get("token")
                if hasattr(request, "query_params")
                else getattr(request, "GET", {}).get("token")
            )

        if not token_str:
            return False

        try:
            session = ReaderTokenService.decode_and_validate_token(token_str)
            # Contrôle anti-partage : vérification de l'empreinte de terminal liée
            if isinstance(session.metadata, dict) and session.metadata.get("device_binding_hash"):
                import hashlib
                expected_hash = session.metadata["device_binding_hash"]
                session_cookie_key = f"laha_reader_bind_{session.id}"
                query_dict = getattr(request, "query_params", None) or getattr(request, "GET", {})
                incoming_device_token = (
                    request.headers.get("X-Reader-Device-Token")
                    or request.COOKIES.get(session_cookie_key)
                    or request.COOKIES.get("laha_reader_bind")
                    or (request.data.get("device_binding_token") if hasattr(request, "data") and isinstance(request.data, dict) else None)
                    or query_dict.get("device_token")
                )
                if not incoming_device_token:
                    return False
                calc_hash = hashlib.sha256(str(incoming_device_token).strip().encode("utf-8")).hexdigest()
                if calc_hash != expected_hash:
                    return False

            request.reader_session = session
            request.partner = session.partner
            if hasattr(request, "_request"):
                request._request.reader_session = session
                request._request.partner = session.partner
            return True
        except ReaderTokenError:
            return False
