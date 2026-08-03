from rest_framework.views import APIView
from rest_framework.response import Response

class OAuthTokenView(APIView):
    def post(self, request):
        # TODO: Déléguer à django-oauth-toolkit
        return Response({"detail": "OAuth token stub"})

class OAuthRevokeView(APIView):
    def post(self, request):
        # TODO: Révocation token OAuth2
        return Response({"detail": "OAuth revoke stub"})
