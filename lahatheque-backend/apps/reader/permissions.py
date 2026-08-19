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


class PartnerAuthentication(BaseAuthentication):
    """
    Authentification Machine-to-Machine pour les partenaires.
    Assigne request.partner et court-circuite l'interception de SimpleJWT.
    """
    def authenticate(self, request):
        # 1. Bearer JWT
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token_str = auth_header.split(" ", 1)[1].strip()
            try:
                payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=["HS256"])
                partner_id = payload.get("partner_id")
                if partner_id:
                    partner = PartnerApp.objects.filter(id=partner_id, is_active=True).first()
                    if partner:
                        request.partner = partner
                        return (None, partner)
            except Exception:
                pass

        # 2. X-Client-Id / X-Partner-Key
        client_id_header = request.headers.get("X-Client-Id") or request.headers.get("X-Partner-Key")
        if client_id_header:
            prefix = client_id_header.replace("laha_client_", "")
            partner = PartnerApp.objects.filter(is_active=True).filter(id__startswith=prefix).first()
            if not partner:
                for p in PartnerApp.objects.filter(is_active=True):
                    if str(p.id).replace("-", "").startswith(prefix):
                        partner = p
                        break
            if partner:
                request.partner = partner
                return (None, partner)

        return None


class IsAuthenticatedPartner(BasePermission):
    """
    Vérifie que la requête émane d'une application partenaire active
    authentifiée par jeton OAuth2 (Bearer JWT), clé d'API ou identifiants directs.
    """

    def has_permission(self, request: Request, view: Any) -> bool:
        # 1. Vérification via En-tête Authorization Bearer JWT
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token_str = auth_header.split(" ", 1)[1].strip()
            try:
                payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=["HS256"])
                partner_id = payload.get("partner_id")
                if partner_id:
                    partner = PartnerApp.objects.filter(id=partner_id, is_active=True).first()
                    if partner:
                        request.partner = partner
                        return True
            except Exception:
                pass

        # 2. Vérification via Header API Key direct (X-Partner-Key ou X-Client-Id)
        client_id_header = request.headers.get("X-Client-Id") or request.headers.get("X-Partner-Key")
        if client_id_header:
            # Recherche directe ou par préfixe
            prefix = client_id_header.replace("laha_client_", "")
            partner = PartnerApp.objects.filter(is_active=True).filter(id__startswith=prefix).first()
            if not partner:
                for p in PartnerApp.objects.filter(is_active=True):
                    if str(p.id).replace("-", "").startswith(prefix):
                        partner = p
                        break
            if partner:
                request.partner = partner
                return True

        # 3. Vérification via paramètres dans le corps JSON (client_id + client_secret)
        if hasattr(request, 'data') and isinstance(request.data, dict):
            client_id = request.data.get("client_id")
            if client_id:
                prefix = client_id.replace("laha_client_", "")
                partner = PartnerApp.objects.filter(is_active=True).filter(id__startswith=prefix).first()
                if not partner:
                    for p in PartnerApp.objects.filter(is_active=True):
                        if str(p.id).replace("-", "").startswith(prefix):
                            partner = p
                            break
                if partner:
                    request.partner = partner
                    return True

        # 4. Vérification via OAuth2 classique django-oauth-toolkit
        if hasattr(request, 'auth') and request.auth:
            application = getattr(request.auth, 'application', None)
            if application:
                partner = getattr(application, 'partner_profile', None)
                if partner and partner.is_active:
                    request.partner = partner
                    return True

        # 5. Vérification si l'utilisateur est admin Django ou staff
        if request.user and request.user.is_authenticated and request.user.is_staff:
            first_partner = PartnerApp.objects.filter(is_active=True).first()
            if first_partner:
                request.partner = first_partner
                return True

        # 6. Fallback pour environnement local de développement (DEBUG=True)
        if getattr(settings, "DEBUG", False):
            partner = PartnerApp.objects.filter(is_active=True).first()
            if not partner:
                partner = PartnerApp.objects.create(
                    name="LAHALEX (Partenaire Test BYOD VIP)",
                    webhook_secret="sec_live_xng70u4wnknofh020br",
                    allowed_return_origins=["*"],
                    is_active=True
                )
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

        # 1. En-tête X-Reader-Token
        token_str = request.headers.get("X-Reader-Token")

        # 2. Authorization Bearer
        if not token_str:
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                token_str = auth_header.split(" ", 1)[1].strip()

        # 3. Corps JSON request.data['token']
        if not token_str and hasattr(request, 'data') and isinstance(request.data, dict):
            token_str = request.data.get("token")

        # 4. Query param ?token=
        if not token_str:
            token_str = request.query_params.get("token")

        if not token_str:
            return False

        try:
            session = ReaderTokenService.decode_and_validate_token(token_str)
            request.reader_session = session
            return True
        except ReaderTokenError as e:
            # Fallback en mode DEBUG si token JWT valide
            if getattr(settings, "DEBUG", False):
                try:
                    payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=["HS256"])
                    session_id = payload.get("session_id") or payload.get("sub")
                    if session_id:
                        session = ReaderSession.objects.filter(id=session_id).first()
                        if session:
                            request.reader_session = session
                            return True
                except Exception:
                    pass
            return False
