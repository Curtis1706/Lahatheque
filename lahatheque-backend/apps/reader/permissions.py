"""
Classes de permissions DRF pour l'API Lecteur Hébergé.
Garantit la sécurité d'accès des partenaires et des sessions éphémères.
"""

from typing import Any
from rest_framework.permissions import BasePermission
from rest_framework.request import Request
from .models import PartnerApp
from .tokens import ReaderTokenService, ReaderTokenError


class IsAuthenticatedPartner(BasePermission):
    """
    Vérifie que la requête émane d'une application partenaire active
    authentifiée par jeton OAuth2 ou clé d'API.
    """

    def has_permission(self, request: Request, view: Any) -> bool:
        # 1. Vérification via OAuth2 (django-oauth-toolkit)
        if hasattr(request, 'auth') and request.auth:
            application = getattr(request.auth, 'application', None)
            if application:
                partner = getattr(application, 'partner_profile', None)
                if partner and partner.is_active:
                    request.partner = partner
                    return True

        # 2. Vérification directe si l'utilisateur est admin ou staff
        if request.user and request.user.is_authenticated and request.user.is_staff:
            # Création d'un contexte partenaire fallback pour les tests admin
            first_partner = PartnerApp.objects.filter(is_active=True).first()
            if first_partner:
                request.partner = first_partner
                return True

        # 3. Vérification via Header API Key direct (X-Partner-Key)
        partner_key = request.headers.get("X-Partner-Key")
        if partner_key:
            partner = PartnerApp.objects.filter(id=partner_key, is_active=True).first()
            if partner:
                request.partner = partner
                return True

        return False


class IsValidReaderSession(BasePermission):
    """
    Vérifie que la requête porte un jeton JWT de session de lecture valide et actif.
    Injecte l'objet `reader_session` dans la requête.
    """

    def has_permission(self, request: Request, view: Any) -> bool:
        token_str = None

        # Recherche dans l'en-tête Authorization
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token_str = auth_header.split(" ", 1)[1].strip()

        # Fallback en-tête dédié X-Reader-Token
        if not token_str:
            token_str = request.headers.get("X-Reader-Token")

        # Fallback paramètre de requête ?token=
        if not token_str:
            token_str = request.query_params.get("token")

        if not token_str:
            return False

        try:
            session = ReaderTokenService.decode_and_validate_token(token_str)
            request.reader_session = session
            return True
        except ReaderTokenError:
            return False
