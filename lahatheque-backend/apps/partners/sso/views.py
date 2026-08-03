from rest_framework.views import APIView
from rest_framework.response import Response

class SAMLLoginView(APIView):
    def get(self, request):
        # TODO: Intégration djangosaml2
        return Response({"detail": "SAML login stub"})

class SAMLACSView(APIView):
    def post(self, request):
        # TODO: Traitement assertion SAML 2.0
        return Response({"detail": "SAML ACS stub"})
