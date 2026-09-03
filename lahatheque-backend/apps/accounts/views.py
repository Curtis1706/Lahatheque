import logging
import time
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .serializers import LoginSerializer, RegisterSerializer, UserSerializer
from .services import login as service_login, _register_user, _build_user_payload

logger = logging.getLogger(__name__)

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
            avatar_file = request.FILES.get('avatar', serializer.validated_data.get('avatar', None))
            res = _register_user(role_code=role, data=serializer.validated_data, avatar_file=avatar_file)
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


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        payload = _build_user_payload(request.user)
        return Response(payload, status=status.HTTP_200_OK)

    def patch(self, request):
        start_time = time.time()
        user = request.user
        data = request.data
        files = request.FILES

        logger.info(
            f"[DJANGO PROFILE UPDATE] Requête PATCH reçue pour l'utilisateur ID={user.id} ({user.email}, rôle={user.role}). "
            f"Champs texte: {list(data.keys())}, Fichiers: {list(files.keys())}"
        )

        try:
            if 'first_name' in data:
                user.first_name = data.get('first_name', '').strip()
            if 'last_name' in data:
                user.last_name = data.get('last_name', '').strip()
            if 'phone' in data:
                user.phone = data.get('phone', '').strip().replace(" ", "")
            if 'country' in data:
                user.country = data.get('country', 'BJ')
            if 'pen_name' in data:
                user.pen_name = data.get('pen_name', '').strip()
            if 'university_affiliation' in data:
                user.university_affiliation = data.get('university_affiliation', '').strip()
            if 'bio' in data:
                user.bio = data.get('bio', '').strip()
            if 'bank_name' in data:
                user.bank_name = data.get('bank_name', '').strip()
            if 'iban' in data:
                user.iban = data.get('iban', '').strip()
            if 'swift' in data:
                user.swift = data.get('swift', '').strip()
            if 'momo_number' in data:
                user.momo_number = data.get('momo_number', '').strip()

            # Gestion de l'upload de photo de profil
            if 'avatar' in files:
                avatar_file = files['avatar']
                storage_name = getattr(settings, 'DEFAULT_FILE_STORAGE', 'django.core.files.storage.FileSystemStorage')
                bucket_name = getattr(settings, 'CLOUDFLARE_R2_BUCKET_NAME', 'non configuré')
                public_domain = getattr(settings, 'CLOUDFLARE_R2_PUBLIC_DOMAIN', 'non configuré')
                logger.info(
                    f"[DJANGO PROFILE AVATAR] Réception avatar : nom='{avatar_file.name}', taille={avatar_file.size} octets "
                    f"({avatar_file.size / 1024:.1f} Ko), content_type='{avatar_file.content_type}'. "
                    f"Storage actif='{storage_name}', R2 Bucket='{bucket_name}', R2 Domain='{public_domain}'"
                )
                try:
                    user.avatar = avatar_file
                    user.save()
                except Exception as upload_err:
                    logger.exception(f"[DJANGO AVATAR STORAGE ERROR] Échec écriture stockage distant: {upload_err}")
                    from django.core.files.storage import FileSystemStorage
                    local_fs = FileSystemStorage()
                    saved_rel = local_fs.save(f"avatars/{avatar_file.name}", avatar_file)
                    user.avatar.name = saved_rel
                    user.save()
                    logger.warning(f"[DJANGO AVATAR FALLBACK] Avatar sauvegardé localement en secours: {saved_rel}")
            elif 'avatar' in data and not data.get('avatar'):
                logger.info(f"[DJANGO PROFILE AVATAR] Suppression de l'avatar pour l'utilisateur ID={user.id}")
                user.avatar = None
                user.save()
            else:
                user.save()

            elapsed = (time.time() - start_time) * 1000
            payload = _build_user_payload(user)
            logger.info(
                f"[DJANGO PROFILE UPDATE SUCCESS] Profil mis à jour avec succès en {elapsed:.1f}ms. "
                f"Avatar généré: '{payload.get('avatar_url')}'"
            )
            return Response({"success": True, "data": payload, "message": "Profil mis à jour avec succès."}, status=status.HTTP_200_OK)

        except Exception as e:
            elapsed = (time.time() - start_time) * 1000
            logger.exception(
                f"[DJANGO PROFILE UPDATE ERROR] Échec de l'enregistrement du profil après {elapsed:.1f}ms : {str(e)}"
            )
            return Response(
                {"success": False, "error": f"Erreur lors de l'enregistrement du profil : {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        current_password = request.data.get("current_password", "")
        new_password = request.data.get("new_password", "")
        confirm_password = request.data.get("confirm_password", "")

        if not current_password or not new_password:
            return Response({"success": False, "error": "Veuillez renseigner le mot de passe actuel et le nouveau mot de passe."}, status=status.HTTP_400_BAD_REQUEST)

        if not user.check_password(current_password):
            return Response({"success": False, "error": "Le mot de passe actuel est incorrect."}, status=status.HTTP_400_BAD_REQUEST)

        if new_password != confirm_password:
            return Response({"success": False, "error": "Le nouveau mot de passe et sa confirmation ne correspondent pas."}, status=status.HTTP_400_BAD_REQUEST)

        if len(new_password) < 8:
            return Response({"success": False, "error": "Le mot de passe doit comporter au moins 8 caractères."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({"success": True, "message": "Votre mot de passe a été modifié avec succès."}, status=status.HTTP_200_OK)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        return Response({"detail": "Déconnexion réussie"}, status=status.HTTP_200_OK)

class MFASetupView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        return Response({"detail": "MFA setup stub"})

class MFAVerifyView(APIView):
    permission_classes = [permissions.IsAuthenticated]
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


class ForgotPasswordRequestView(APIView):
    """POST /api/v1/accounts/forgot-password/ - Envoie un code de réinitialisation par email."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from .models import User, PasswordResetCode
        from apps.communications.services.email_service import send_transactional_email

        email = request.data.get("email", "").strip().lower()
        if not email:
            return Response({"success": False, "error": "Adresse email requise."}, status=400)

        user = User.objects.filter(email__iexact=email, is_active=True).first()

        if user:
            reset_code = PasswordResetCode.generate_for_user(user)
            send_transactional_email(
                email_type="password_reset_code",
                to_email=user.email,
                subject="Votre code de réinitialisation LAHAThèque",
                template_name="emails/accounts/password_reset_code.html",
                recipient_name=f"{user.first_name} {user.last_name}".strip() or user.username,
                context={"reset_code": reset_code.code, "valid_minutes": 15},
            )

        return Response({
            "success": True,
            "message": "Si cette adresse est associée à un compte, un code de réinitialisation vient d'être envoyé."
        })


class ResetPasswordConfirmView(APIView):
    """POST /api/v1/accounts/reset-password/ - Vérifie le code et change réellement le mot de passe."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from .models import User, PasswordResetCode
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError

        email = request.data.get("email", "").strip().lower()
        code = request.data.get("code", "").strip()
        new_password = request.data.get("new_password", "")

        if not (email and code and new_password):
            return Response({"success": False, "error": "Email, code et nouveau mot de passe requis."}, status=400)

        user = User.objects.filter(email__iexact=email, is_active=True).first()
        if not user:
            return Response({"success": False, "error": "Code invalide ou expiré."}, status=400)

        reset_code = PasswordResetCode.objects.filter(
            user=user, code=code
        ).order_by('-created_at').first()

        if not reset_code or not reset_code.is_valid():
            return Response({"success": False, "error": "Code invalide ou expiré."}, status=400)

        try:
            validate_password(new_password, user=user)
        except ValidationError as e:
            return Response({"success": False, "error": " ".join(e.messages)}, status=400)

        user.set_password(new_password)
        user.save(update_fields=["password"])

        reset_code.used = True
        reset_code.save(update_fields=["used"])

        return Response({"success": True, "message": "Mot de passe réinitialisé avec succès."})



