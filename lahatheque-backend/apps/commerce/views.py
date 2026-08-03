from rest_framework.views import APIView
from rest_framework.response import Response

class CheckoutView(APIView):
    def post(self, request):
        # TODO: Initialisation de paiement Moneroo/Stripe
        return Response({"checkout_url": "https://example.com/pay"})
