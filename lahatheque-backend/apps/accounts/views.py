from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        # TODO: Implémenter la validation des identifiants et réponse session
        return Response({"detail": "Login stub"}, status=status.HTTP_200_OK)

class LogoutView(APIView):
    def post(self, request):
        # TODO: Invalider le cookie/session
        return Response({"detail": "Logout stub"}, status=status.HTTP_200_OK)

class MFASetupView(APIView):
    def post(self, request):
        # TODO: Générer le secret TOTP et QR code
        return Response({"detail": "MFA setup stub"})

class MFAVerifyView(APIView):
    def post(self, request):
        # TODO: Vérifier le code TOTP
        return Response({"detail": "MFA verify stub"})

class OTPRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        # TODO: Générer et envoyer l'OTP par SMS/Email
        return Response({"detail": "OTP request stub"})

class OTPVerifyView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        # TODO: Valider l'OTP
        return Response({"detail": "OTP verify stub"})
