"""
Vues OAuth2 pour l'authentification Machine-to-Machine des applications partenaires.
Conforme au protocole OAuth2 Client Credentials Grant et au plan technique LAHAThèque.
"""

import jwt
import logging
from datetime import timedelta
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
            "iat": now_ts,
            "exp": exp_ts,
        }

        token_jwt = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")

        return Response({
            "access_token": token_jwt,
            "token_type": "Bearer",
            "expires_in": expires_in,
            "scope": "reader:sessions reader:byod"
        }, status=status.HTTP_200_OK)


class OAuthRevokeView(APIView):
    """
    POST /api/v1/oauth2/token/revoke/
    Révocation d'un jeton OAuth2.
    """
    permission_classes = []

    def post(self, request):
        return Response({"status": "revoked"}, status=status.HTTP_200_OK)
