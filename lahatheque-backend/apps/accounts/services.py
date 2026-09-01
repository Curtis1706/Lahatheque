# type: ignore
"""
accounts/services.py (REFACTORISÉ)

Toute la logique métier d'authentification ici.
Les vues sont fines — elles orchestrent uniquement.

Design decisions :
  - JWT via djangorestframework-simplejwt (déjà dans requirements.txt)
  - Login accepte email | phone | username (multi-identifier)
  - /me agrège les profils utilisateurs et rôles actifs
  - Atomicité transactionnelle pour OTP (évite race conditions)
  - Validation stricte des entrées avant BD
  - Emails asynchrones via Celery / logging en dev
"""
import logging
import secrets
import string
from datetime import timedelta
from typing import Optional, Tuple, Any

logger = logging.getLogger(__name__)

from django.contrib.auth import get_user_model, authenticate
from django.core.exceptions import ValidationError
from django.core.validators import EmailValidator
from django.db import transaction
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
from django.conf import settings
from .models import User, OTP, MFAConfig


# ─────────────────────────────────────────────────────────────
# Exceptions métier
# ─────────────────────────────────────────────────────────────

class AuthenticationFailed(Exception):
    pass


class AccountInactive(Exception):
    pass


class AccountSuspended(Exception):
    pass


class OTPInvalid(Exception):
    pass


class OTPExpired(Exception):
    pass


class OTPRateLimited(Exception):
    pass


# ─────────────────────────────────────────────────────────────
# Helpers et Validators
# ─────────────────────────────────────────────────────────────

def _find_user(identifier: str) -> Optional[Any]:
    """
    Trouve un utilisateur par email, téléphone ou username.
    Ordre : email → phone → username.
    """
    if '@' in identifier:
        return User.objects.filter(email__iexact=identifier).first()

    phone_chars = set('0123456789+- ()')
    if all(c in phone_chars for c in identifier):
        user = User.objects.filter(phone=identifier).first()
        if not user and not identifier.startswith('+'):
            user = User.objects.filter(phone=f"+{identifier}").first()
        return user

    return User.objects.filter(username__iexact=identifier).first()


def _validate_email(email: str) -> str:
    """
    Valide et normalise un email.
    Lève ValidationError si invalide.
    Retourne l'email normalisé (minuscule, stripped).
    """
    email = email.strip().lower()
    validator = EmailValidator()
    try:
        validator(email)
    except ValidationError as e:
        raise ValidationError(f"Email invalide: {email}") from e
    return email


def _validate_otp_code(code: str) -> str:
    """
    Valide le format du code OTP avant requête BD.
    OTP doit être exactement 6 chiffres.
    Lève OTPInvalid si invalide.
    """
    if not code or not isinstance(code, str):
        raise OTPInvalid("Code OTP manquant ou format invalide.")
    
    code = code.strip()
    
    if len(code) != 6 or not code.isdigit():
        raise OTPInvalid("Code OTP invalide. Doit être exactement 6 chiffres.")
    
    return code


def _generate_jwt(user: Any) -> dict:
    """
    Génère une paire access + refresh JWT pour un utilisateur avec claims de rôles.
    """
    refresh = RefreshToken.for_user(user)
    
    # Extraire les rôles actifs pour le middleware Frontend (RBAC)
    active_roles = getattr(user, 'active_roles', None) or [user.role]
    if not active_roles:
        active_roles = [user.role]
            
    # Ajouter les rôles au token d'accès
    refresh.access_token['roles'] = list(active_roles)
    
    # Ajouter la version de session (anti multi-appareils)
    if hasattr(user, 'session_version'):
        refresh.access_token['session_version'] = user.session_version
        refresh['session_version'] = user.session_version
    
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


def _build_user_payload(user: Any) -> dict:
    """
    Construit le payload /me natif pour LAHAThèque v3.2.
    """
    active_roles = user.active_roles if getattr(user, 'active_roles', None) else [user.role]

    unread_notifications_count = 0
    try:
        from apps.reporting.models import Notification
        unread_notifications_count = Notification.objects.filter(user=user, is_read=False).count()
    except Exception:
        pass

    avatar_url = None
    if getattr(user, 'avatar', None) and bool(getattr(user.avatar, 'name', None)):
        avatar_str = str(user.avatar.name)
        if avatar_str.startswith('http'):
            avatar_url = avatar_str
        else:
            try:
                avatar_url = user.avatar.url
            except Exception:
                public_url = getattr(settings, 'CLOUDFLARE_R2_PUBLIC_URL', '') or getattr(settings, 'CLOUDFLARE_R2_PUBLIC_DOMAIN', '')
                if public_url:
                    if not public_url.startswith('http'):
                        public_url = f"https://{public_url}"
                    avatar_url = f"{public_url.rstrip('/')}/{avatar_str.lstrip('/')}"
                else:
                    avatar_url = f"/media/{avatar_str.lstrip('/')}"

    institution_name = user.institution.name if getattr(user, 'institution', None) else None
    institution_id = str(user.institution_id) if getattr(user, 'institution_id', None) else None

    date_joined_str = ""
    if hasattr(user, 'date_joined') and user.date_joined:
        try:
            date_joined_str = user.date_joined.isoformat()
        except Exception:
            date_joined_str = str(user.date_joined)

    return {
        'id':                         str(user.id),
        'email':                      user.email,
        'username':                   user.username,
        'first_name':                 user.first_name,
        'last_name':                  user.last_name,
        'role':                       user.role,
        'active_roles':               active_roles,
        'is_active':                  user.is_active,
        'is_suspended':               getattr(user, 'is_suspended', False),
        'suspension_reason':          getattr(user, 'suspension_reason', '') or '',
        'is_verified':                user.is_verified,
        'is_staff':                   user.is_staff,
        'is_superuser':               user.is_superuser,
        'country':                    getattr(user, 'country', 'BJ'),
        'phone':                      str(user.phone) if getattr(user, 'phone', None) else "",
        'avatar_url':                 avatar_url,
        'pen_name':                   getattr(user, 'pen_name', '') or '',
        'university_affiliation':     getattr(user, 'university_affiliation', '') or '',
        'bio':                        getattr(user, 'bio', '') or '',
        'bank_name':                  getattr(user, 'bank_name', '') or '',
        'iban':                       getattr(user, 'iban', '') or '',
        'swift':                      getattr(user, 'swift', '') or '',
        'momo_number':                getattr(user, 'momo_number', '') or '',
        'institution_id':             institution_id,
        'institution_name':           institution_name,
        'unread_notifications_count': unread_notifications_count,
        'date_joined':                date_joined_str,
    }


# ─────────────────────────────────────────────────────────────
# Services publics - Authentification
# ─────────────────────────────────────────────────────────────

def login(identifier: str, password: str, request=None) -> dict:
    """
    Login multi-identifier (email | phone | username) + password.
    Retourne { tokens, user }.
    Lève AuthenticationFailed ou AccountInactive.
    """
    http_request = getattr(request, '_request', request) if request is not None else None

    user_obj = _find_user(identifier)
    if user_obj is None:
        if http_request is not None:
            try:
                authenticate(request=http_request, username=identifier, password=password)
            except Exception:
                pass
        raise AuthenticationFailed("Identifiants invalides.")

    user = None
    if http_request is not None:
        try:
            user = authenticate(request=http_request, username=user_obj.email, password=password)
        except Exception as e:
            logger.warning(f"authenticate exception via Axes: {e}")
            user = None

    if user is None:
        if user_obj.check_password(password):
            user = user_obj
        else:
            raise AuthenticationFailed("Identifiants invalides.")

    if not user.is_active:
        raise AccountInactive("Ce compte est désactivé.")

    if getattr(user, 'is_suspended', False):
        reason = getattr(user, 'suspension_reason', None) or "Comportement non conforme."
        raise AccountSuspended(f"Votre compte est suspendu. Raison : {reason}")

    # Invalidation multi-appareils (Levée pour les Admins)
    if hasattr(user, 'session_version'):
        if not (user.is_superuser or user.is_staff or getattr(user, 'role', '') == 'admin'):
            current_v = int(getattr(user, 'session_version', 1) or 1)
            user.session_version = current_v + 1
            user.save(update_fields=['session_version'])

    from django.contrib.auth.models import update_last_login
    update_last_login(None, user)

    tokens = _generate_jwt(user)
    logger.info(f"Login successful for {user.email}")
    return {'tokens': tokens, 'user': _build_user_payload(user)}


def ensure_teacher_role(user: Any) -> None:
    """Stub de compatibilité pour le rôle enseignant."""
    pass

def ensure_parent_role(user: Any) -> None:
    """Stub de compatibilité pour le rôle parent."""
    pass

def _sync_teacher_onboarding(user: Any) -> None:
    """Stub de compatibilité pour l'onboarding enseignant."""
    pass


def logout(refresh_token: str) -> None:
    """
    Blackliste le refresh token (simplejwt blacklist).
    Nécessite que 'rest_framework_simplejwt.token_blacklist' soit dans INSTALLED_APPS.
    """
    try:
        token_cls: Any = RefreshToken
        token = token_cls(refresh_token)
        token.blacklist()
        logger.info("Token blacklisted successfully")
    except Exception as e:
        logger.warning(f"accounts/logout: impossible de blacklister le token: {e}")


def get_me(user: Any) -> dict:
    """Retourne le payload complet de l'utilisateur connecté."""
    return _build_user_payload(user)


def update_me(user: Any, user_data: dict, profile_data: dict) -> dict:
    """
    Met à jour les champs de base de l'utilisateur et son profil actif.
    Valide l'email avant mise à jour.
    """
    # Champs User de base
    updatable_user_fields = ['first_name', 'last_name', 'phone']
    changed = False
    for field in updatable_user_fields:
        if field in user_data:
            setattr(user, field, user_data[field])
            changed = True

    # Email : cas sensible avec validation
    if 'email' in user_data and user_data['email'] != user.email:
        validated_email = _validate_email(user_data['email'])
        
        # Vérifier l'unicité
        if User.objects.filter(email__iexact=validated_email).exclude(id=user.id).exists():
            raise ValueError("Cet email est déjà utilisé par un autre compte.")
        
        user.email = validated_email
        user.username = validated_email  # username = email (convention)
        user.is_verified = False         # re-vérification requise
        changed = True

    if changed:
        user.save()

    logger.info(f"User {user.email} profile updated")
    return _build_user_payload(user)


# ─────────────────────────────────────────────────────────────
# Services publics - OTP et Mot de passe
# ─────────────────────────────────────────────────────────────

def send_otp(identifier: str, channel: str = 'sms') -> None:
    """
    Génère et envoie un OTP à l'utilisateur.
    channel : 'sms' | 'phone' (alias de sms) | 'email' | 'whatsapp'
    
    Lève OTPRateLimited si envoi trop fréquent (< 60s).
    Atomique: évite les race conditions.
    """
    if channel == 'phone':
        channel = 'sms'

    user = _find_user(identifier)
    if user is None:
        # Sécurité : on ne révèle pas si l'email/phone existe
        logger.info(f"accounts/send_otp: identifiant introuvable '{identifier}' — silently ignored")
        return

    # Rate limiting simple : 1 OTP par minute par channel
    last_otp = OTP.objects.filter(
        user=user, channel=channel, is_verified=False
    ).order_by('-created_at').first()

    if last_otp and (timezone.now() - last_otp.created_at).total_seconds() < 60:
        raise OTPRateLimited("Veuillez attendre 60 secondes avant de demander un nouvel OTP.")

    # Générer un code à 6 chiffres
    code = ''.join(secrets.choice(string.digits) for _ in range(6))

    # Transaction atomique pour éviter les race conditions
    try:
        with transaction.atomic():
            # Révoquer les anciens OTP non vérifiés
            OTP.objects.filter(user=user, channel=channel, is_verified=False).delete()

            # Sauvegarder le nouvel OTP
            OTP.objects.create(
                user=user,
                code=code,
                channel=channel,
                expires_at=timezone.now() + timedelta(minutes=5)
            )
    except Exception as e:
        logger.error(f"accounts/send_otp: Erreur transaction pour {user.email}: {e}")
        raise

    # Envoi / log de l'OTP
    logger.info(f"[DEV OTP] Code OTP généré pour {user.email} ({channel}) : {code}")


def verify_otp(identifier: str, code: str) -> dict:
    """
    Vérifie le code OTP.
    Si valide → marque l'utilisateur comme is_verified=True et retourne JWT.
    
    Lève OTPInvalid ou OTPExpired.
    """
    # 1. Valider le format du code AVANT la requête BD
    try:
        code = _validate_otp_code(code)
    except OTPInvalid as e:
        logger.warning(f"OTP verification attempt with invalid code format for {identifier}")
        raise e

    # 2. Trouver l'utilisateur
    user = _find_user(identifier)
    if user is None:
        logger.warning(f"OTP verification failed: user {identifier} not found")
        raise OTPInvalid("Utilisateur introuvable.")

    # 3. Chercher l'OTP en BD
    otp = OTP.objects.filter(user=user, code=code, is_verified=False).first()

    if otp is None:
        logger.warning(f"OTP verification failed: invalid code for {user.email} ({code})")
        raise OTPInvalid("Code OTP invalide.")

    # 4. Vérifier l'expiration
    if otp.is_expired():
        logger.warning(f"OTP verification failed: expired code for {user.email}")
        raise OTPExpired("Code OTP expiré. Veuillez en demander un nouveau.")

    # 5. Marquer comme vérifié et mettre à jour l'utilisateur
    otp.is_verified = True
    otp.save(update_fields=['is_verified'])

    user.is_verified = True
    user.save(update_fields=['is_verified'])

    tokens = _generate_jwt(user)
    logger.info(f"OTP verification successful for {user.email}")
    return {'tokens': tokens, 'user': _build_user_payload(user)}


def request_password_reset(email: str, channel: str = 'sms') -> None:
    """
    Génère et envoie un code OTP pour réinitialiser le mot de passe.
    Par défaut utilise le SMS ; l'utilisateur peut choisir 'email'.
    """
    try:
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            return
        effective_channel = channel
        if channel == 'sms' and not getattr(user, 'phone', None):
            effective_channel = 'email'
            logger.info(f"accounts/request_password_reset: pas de téléphone pour {email}, canal basculé sur email")
        send_otp(identifier=user.email, channel=effective_channel)
    except Exception as e:
        logger.error(f"accounts/request_password_reset: erreur envoi OTP à {email}: {e}")


def reset_password_with_otp(identifier: str, code: str, new_password: str) -> None:
    """
    Réinitialise le mot de passe après vérification OTP.
    Unified password reset flow (OTP-only, pas de token Django).
    
    Lève OTPInvalid, OTPExpired ou ValueError.
    """
    # 1. Valider le format du code
    try:
        code = _validate_otp_code(code)
    except OTPInvalid as e:
        logger.warning(f"Password reset: invalid OTP code format for {identifier}")
        raise e

    # 2. Trouver l'utilisateur
    user = _find_user(identifier)
    if user is None:
        logger.warning(f"Password reset: user {identifier} not found")
        raise OTPInvalid("Utilisateur introuvable.")

    # 3. Chercher et vérifier l'OTP
    otp = OTP.objects.filter(user=user, code=code, is_verified=False).first()
    if not otp:
        logger.warning(f"Password reset: invalid OTP for {user.email}")
        raise OTPInvalid("Code OTP invalide.")

    if otp.is_expired():
        logger.warning(f"Password reset: expired OTP for {user.email}")
        raise OTPExpired("Code OTP expiré. Veuillez en demander un nouveau.")

    # 4. Valider le nouveau mot de passe
    if len(new_password) < 8:
        raise ValueError("Le mot de passe doit contenir au moins 8 caractères.")

    # 5. Mettre à jour le mot de passe (transactionnel)
    try:
        with transaction.atomic():
            user.set_password(new_password)
            user.save(update_fields=['password'])
            
            # Marquer l'OTP comme utilisé
            otp.is_verified = True
            otp.save(update_fields=['is_verified'])
        
        logger.info(f"Password reset successful for {user.email}")
    except Exception as e:
        logger.error(f"Password reset failed for {user.email}: {e}")
        raise


def change_password(user: Any, old_password: str, new_password: str) -> None:
    """Change le mot de passe d'un utilisateur authentifié."""
    if not user.check_password(old_password):
        logger.warning(f"Change password failed: incorrect old password for {user.email}")
        raise AuthenticationFailed("L'ancien mot de passe est incorrect.")

    if len(new_password) < 8:
        raise ValueError("Le nouveau mot de passe doit contenir au moins 8 caractères.")

    user.set_password(new_password)
    user.save(update_fields=['password'])
    logger.info(f"Password changed successfully for {user.email}")


# ─────────────────────────────────────────────────────────────
# Services publics - Registration
# ─────────────────────────────────────────────────────────────

def _register_user(role_code: str, data: dict, avatar_file=None) -> dict:
    """
    Factory pour créer un utilisateur de tout type.
    Regroupe la validation commune et la création de base.
    
    Crée l'utilisateur, assigne le rôle et envoie/log l'OTP.
    Retourne les tokens JWT et le payload /me.
    """
    email = _validate_email(data.get('email', ''))
    
    if User.objects.filter(email__iexact=email).exists() or User.objects.filter(username__iexact=email).exists():
        raise ValueError("Cet email est déjà utilisé.")
    
    phone = str(data.get('phone', '')).strip().replace(" ", "")
    if phone and User.objects.filter(phone=phone, is_active=True).exists():
        raise ValueError("Ce numéro de téléphone est déjà associé à un autre compte.")

    password = data.get('password', '')
    if len(password) < 8:
        raise ValueError("Le mot de passe doit contenir au moins 8 caractères.")

    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    country = data.get('country', 'BJ')
    pen_name = data.get('pen_name', '').strip()
    bio = data.get('bio', '').strip()

    try:
        with transaction.atomic():
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                phone=phone,
                role=role_code,
                active_roles=[role_code],
                country=country,
                pen_name=pen_name,
                bio=bio,
                is_verified=True if getattr(settings, 'DEBUG', False) else False,
            )

            if avatar_file:
                user.avatar = avatar_file
                user.save(update_fields=['avatar'])

            try:
                send_otp(email, channel='email')
            except Exception as otp_err:
                logger.info(f"accounts/_register_user: OTP log/send skipped: {otp_err}")

            logger.info(f"User registered: {email} ({role_code})")
    except Exception as e:
        logger.error(f"Registration failed for {email} ({role_code}): {e}")
        raise

    tokens = _generate_jwt(user)
    return {'tokens': tokens, 'user': _build_user_payload(user)}


def register_teacher(data: dict) -> dict:
    """Crée un nouvel utilisateur enseignant."""
    return _register_user(role_code='teacher', data=data)


def register_student(data: dict) -> dict:
    """Crée un utilisateur élève."""
    return _register_user(role_code='student', data=data)


def register_author(data: dict) -> dict:
    """Crée un utilisateur auteur."""
    return _register_user(role_code='author', data=data)


def register_parent(data: dict) -> dict:
    """Crée un utilisateur parent."""
    return _register_user(role_code='parent', data=data)


# ─────────────────────────────────────────────────────────────
# Services publics - Admin
# ─────────────────────────────────────────────────────────────

def admin_create_user_wizard(admin_user: Any, data: dict) -> dict:
    """
    Assistant de création d'utilisateur par un administrateur.
    
    - Génère un mot de passe aléatoire complexe
    - Crée le compte et les profils
    - Assigne le rôle
    
    Retourne les détails du nouvel utilisateur.
    """
    email = _validate_email(data.get('email', ''))
    
    if not email:
        raise ValueError("L'adresse email est obligatoire.")
        
    role_code = data.get('role', 'student')
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    phone = str(data.get('phone') or '').strip().replace(" ", "")
    country = data.get('country', 'BJ')

    if User.objects.filter(email__iexact=email).exists():
        raise ValueError("Cet email est déjà utilisé.")
    if User.objects.filter(username__iexact=email).exists():
        raise ValueError("Cet email est déjà utilisé.")

    if phone and User.objects.filter(phone=phone, is_active=True).exists():
        raise ValueError("Ce numéro de téléphone est déjà associé à un autre compte.")

    password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))

    try:
        with transaction.atomic():
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                phone=phone,
                country=country,
                role=role_code,
                is_verified=True
            )

            if role_code in ['admin', 'super_admin']:
                user.is_staff = True
                if role_code == 'super_admin':
                    user.is_superuser = True
                user.save(update_fields=['is_staff', 'is_superuser'])

            logger.info(f"admin_create_user_wizard: Utilisateur {email} ({role_code}) créé par {admin_user.email}")

            return {
                'id': str(user.id),
                'email': user.email,
                'role': role_code,
                'status': 'success',
                'message': f'Utilisateur créé avec succès pour {email}.'
            }

    except Exception as e:
        logger.error(f"admin_create_user_wizard: Échec création pour {email}: {e}", exc_info=True)
        raise e
