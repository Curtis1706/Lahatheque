"""
Vues OAuth2 pour l'authentification Machine-to-Machine des applications partenaires.
Conforme au protocole OAuth2 Client Credentials Grant et au plan technique LAHAThèque.
"""

import jwt
import logging
from datetime import datetime, timedelta, timezone as dt_timezone
from django.conf import settings
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from apps.reader.models import PartnerApp

logger = logging.getLogger(__name__)


from apps.reader.auth_utils import verify_secret


class OAuthTokenView(APIView):
    """
    POST /api/v1/oauth2/token/
    Échange les identifiants Client ID & Client Secret contre un jeton Bearer JWT.
    Conforme à la spécification OAuth 2.0 Client Credentials Grant (RFC 6749).
    """
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        # Récupération des paramètres (form-encoded ou JSON)
        data = request.data or request.POST
        client_id = str(data.get("client_id", "")).strip()
        client_secret = str(data.get("client_secret", "")).strip()
        grant_type = str(data.get("grant_type", "client_credentials")).strip()

        if grant_type != "client_credentials":
            return Response(
                {"error": "unsupported_grant_type", "error_description": "Seul le flux client_credentials est supporté."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not client_id or not client_secret:
            return Response(
                {"error": "invalid_request", "error_description": "Les paramètres client_id et client_secret sont obligatoires."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Recherche stricte de l'application partenaire active
        partner = PartnerApp.objects.filter(client_id=client_id, is_active=True).first()
        
        # Recherche par UUID si client_id est un UUID valide
        if not partner:
            try:
                partner = PartnerApp.objects.filter(id=client_id, is_active=True).first()
            except Exception:
                partner = None

        if not partner or not partner.client_secret_hash:
            return Response(
                {"error": "invalid_client", "error_description": "Identifiants client ou secret invalides."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Vérification cryptographique en temps constant du secret
        if not verify_secret(client_secret, partner.client_secret_hash):
            logger.warning(f"[Security] Échec d'authentification OAuth2 pour client_id={client_id[:16]}...")
            return Response(
                {"error": "invalid_client", "error_description": "Identifiants client ou secret invalides."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Génération du jeton JWT signé
        import uuid as uuid_lib
        jti = str(uuid_lib.uuid4())

        now = timezone.now()
        expires_in = 36000  # 10 heures
        exp_ts = int((now + timedelta(seconds=expires_in)).timestamp())
        now_ts = int(now.timestamp())

        payload = {
            "sub": f"partner_{partner.id}",
            "partner_id": str(partner.id),
            "partner_name": partner.name,
            "client_id": partner.client_id or str(partner.id),
            "scope": "reader:sessions reader:byod catalog:read",
            "type": "partner_access_token",
            "jti": jti,
            "iat": now_ts,
            "exp": exp_ts,
        }

        signing_key: str = str(getattr(settings, "OAUTH2_PARTNER_JWT_SIGNING_KEY", settings.SECRET_KEY))
        token_jwt = jwt.encode(payload, signing_key, algorithm="HS256")

        return Response({
            "access_token": token_jwt,
            "token_type": "Bearer",
            "expires_in": expires_in,
            "scope": "reader:sessions reader:byod catalog:read"
        }, status=status.HTTP_200_OK)


class OAuthRevokeView(APIView):
    """
    POST /api/v1/oauth2/token/revoke/
    Révocation réelle via liste de révocation (jti).
    """
    permission_classes = []
    authentication_classes = []

    def post(self, request):
        token_str = request.data.get("token", "")
        if not token_str:
            return Response(
                {"error": "invalid_request", "error_description": "Le paramètre token est requis."},
                status=status.HTTP_400_BAD_REQUEST
            )

        signing_key: str = str(getattr(settings, "OAUTH2_PARTNER_JWT_SIGNING_KEY", settings.SECRET_KEY))
        try:
            payload = jwt.decode(token_str, signing_key, algorithms=["HS256"], options={"verify_exp": False})
        except Exception:
            return Response({"status": "revoked"}, status=status.HTTP_200_OK)

        jti = payload.get("jti")
        if not jti:
            return Response({"status": "revoked"}, status=status.HTTP_200_OK)

        from .models import RevokedPartnerToken
        exp_ts = payload.get("exp", 0)
        expires_at = (
            datetime.fromtimestamp(exp_ts, tz=dt_timezone.utc)
            if exp_ts
            else timezone.now() + timedelta(hours=10)
        )

        RevokedPartnerToken.objects.get_or_create(
            jti=jti,
            defaults={
                "partner_id": payload.get("partner_id"),
                "expires_at": expires_at,
            }
        )

        return Response({"status": "revoked"}, status=status.HTTP_200_OK)
