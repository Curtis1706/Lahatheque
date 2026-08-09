from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .serializers import LoginSerializer, RegisterSerializer, UserSerializer
from .services import login as service_login, _register_user, _build_user_payload

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            res = service_login(
                identifier=serializer.validated_data['email'],
                password=serializer.validated_data['password'],
                request=request
            )
            return Response(res, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            role = serializer.validated_data.get('role', 'student')
            res = _register_user(role_code=role, data=serializer.validated_data)
            return Response(res, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Erreur d'inscription : {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        payload = _build_user_payload(request.user)
        return Response(payload, status=status.HTTP_200_OK)

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        return Response({"detail": "Déconnexion réussie"}, status=status.HTTP_200_OK)

class MFASetupView(APIView):
    def post(self, request):
        return Response({"detail": "MFA setup stub"})

class MFAVerifyView(APIView):
    def post(self, request):
        return Response({"detail": "MFA verify stub"})

class OTPRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        return Response({"detail": "OTP request stub"})

class OTPVerifyView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        return Response({"detail": "OTP verify stub"})

