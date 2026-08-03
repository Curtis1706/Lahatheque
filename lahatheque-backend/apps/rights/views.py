from rest_framework.views import APIView
from rest_framework.response import Response

class MyRoyaltyStatementsView(APIView):
    def get(self, request):
        # TODO: Relevé de redevances ventilé par ayant droit
        return Response({"statements": []})
