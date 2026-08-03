"""
accounts/services.py (REFACTORISÉ)

Toute la logique métier d'authentification ici.
Les vues sont fines — elles orchestrent uniquement.

Design decisions :
  - JWT via djangorestframework-simplejwt (déjà dans requirements.txt)
  - OTP réutilise le modèle core.OTP pendant la transition
  - Login accepte email | phone | username (multi-identifier)
  - /me agrège les profils via les nouvelles apps (students, teachers, etc.)
    et tombe en fallback sur core si les profils modulaires n'existent pas encore
  - Atomicité transactionnelle pour OTP (évite race conditions)
  - Validation stricte des entrées avant BD
  - Emails asynchrones via Celery
"""
import logging
import secrets
import string
from datetime import timedelta
from typing import TYPE_CHECKING, Optional, Tuple

from django.contrib.auth import get_user_model, authenticate
from django.core.exceptions import ValidationError
from django.core.validators import EmailValidator
from django.db import transaction
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from core.models import OTP
from core.services.notification import NotificationService

logger = logging.getLogger(__name__)

if TYPE_CHECKING:
    from core.models import User
else:
    User = get_user_model()


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

def _find_user(identifier: str) -> Optional['User']:
    """
    Trouve un utilisateur par email, téléphone ou username.
    Ordre : email → phone → username.
    """
    if '@' in identifier:
        return User.objects.filter(email=identifier).first()

    phone_chars = set('0123456789+- ()')
    if all(c in phone_chars for c in identifier):
        user = User.objects.filter(phone=identifier).first()
        if not user and not identifier.startswith('+'):
            user = User.objects.filter(phone=f"+{identifier}").first()
        return user

    return User.objects.filter(username=identifier).first()


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


def _get_profile_photo(user: 'User') -> Tuple[Optional[str], Optional[str]]:
    """
    Extrait la photo de profil et l'ID du profil utilisateur.
    Priorise les profils modulaires, fallback sur legacy.
    
    Retourne: (photo_url: str | None, profile_id: str | None)
    """
    # Liste des attributs à vérifier dans l'ordre de priorité
    profile_attrs = [
        'student_profile',
        'teacher_profile',
        'author_profile',
        'parent_profile',
        # Fallback legacy
        'student',
        'teacher',
        'author',
        'parent',
    ]
    
    for attr_name in profile_attrs:
        # Vérifier si l'attribut existe
        if not hasattr(user, attr_name):
            continue
        
        profile = getattr(user, attr_name, None)
        if not profile:
            continue
        
        # Tenter d'extraire la photo
        try:
            profile_photo = getattr(profile, 'profile_photo', None)
            profile_id = str(profile.id)
            
            # Si la photo existe, retourner immédiatement
            if profile_photo:
                photo_url = profile_photo.url
                if photo_url:
                    return photo_url, profile_id
            
            # Même sans photo, retourner l'ID du profil trouvé
            return None, profile_id
            
        except Exception as e:
            logger.warning(
                f"Erreur extraction photo pour {user.email} (attr={attr_name}): {e}"
            )
            continue
    
    # Aucun profil trouvé
    return None, None


def _generate_jwt(user: 'User') -> dict:
    """
    Génère une paire access + refresh JWT pour un utilisateur avec claims de rôles.
    """
    refresh = RefreshToken.for_user(user)
    
    # Extraire les rôles actifs pour le middleware Frontend (RBAC)
    active_roles = []
    try:
        active_roles = list(
            user.user_roles
            .filter(status='active')
            .select_related('role')
            .values_list('role__code', flat=True)
        )
    except Exception:
        # Fallback legacy
        legacy_role = getattr(user, 'role', None)
        if legacy_role:
            active_roles = [legacy_role]
            
    # Ajouter les rôles au token d'accès
    refresh.access_token['roles'] = active_roles
    
    # Ajouter la version de session (anti multi-appareils)
    if hasattr(user, 'session_version'):
        refresh.access_token['session_version'] = user.session_version
        refresh['session_version'] = user.session_version
    
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


def _build_user_payload(user: 'User') -> dict:
    """
    Construit le payload /me en lisant les profils modulaires (Phase 1 apps)
    avec fallback sur les profils legacy (core) pendant la transition.
    """
    # Rôles actifs depuis le nouveau système (Phase 1)
    active_roles = []
    try:
        active_roles = list(
            user.user_roles
            .filter(status='active')
            .select_related('role')
            .values_list('role__code', flat=True)
        )
    except Exception:
        # Fallback si la table user_roles n'existe pas encore (avant migration)
        if user.role:
            active_roles = [user.role]

    # 📸 Extraction robuste de la photo et du profil ID
    profile_photo, profile_id = _get_profile_photo(user)

    # Reconstruction du profil enseignant pour le frontend v1 (Pivot Dashboard)
    teacher_profile = None
    if hasattr(user, 'teacher_profile') and user.teacher_profile:
        tp = user.teacher_profile
        teacher_profile = {
            'id': str(tp.id),
            'verification_status': tp.verification_status,
            'onboarding_status': tp.onboarding_status,
            'rejection_reason': tp.rejection_reason,
            'profile_photo': tp.profile_photo.url if tp.profile_photo else None,
            'subjects': list(tp.subjects.values_list('id', flat=True)),
        }

    author_profile = None
    if hasattr(user, 'author_profile') and user.author_profile:
        ap = user.author_profile
        author_profile = {
            'id': str(ap.id),
            'content_visibility_status': ap.content_visibility_status,
            'profile_photo': ap.profile_photo.url if ap.profile_photo else None,
            'bio': ap.bio,
            'publications_count': getattr(ap, 'total_content_published', 0),
        }

    # Compteur de notifications non lues
    from notifications.selectors import get_unread_count
    unread_notifications_count = get_unread_count(user)

    # Occupation/Profession (dynamique selon le profil)
    occupation = ""
    try:
        if hasattr(user, 'parent_profile') and user.parent_profile:
            from core.models import Parent as CoreParent
            cp = CoreParent.objects.filter(user=user).first()
            occupation = cp.occupation if cp else ""
        elif hasattr(user, 'teacher_profile') and user.teacher_profile:
            occupation = user.teacher_profile.professional_title or ""
    except Exception:
        pass

    # Vérifier l'abonnement famille actif (pour les parents)
    has_active_family_subscription = False
    if user.role == 'parent':
        try:
            from django.utils import timezone as tz
            from payments.models import FamilySubscription
            today = tz.now().date()
            has_active_family_subscription = FamilySubscription.objects.filter(
                payer=user,
                status='active',
                end_date__gte=today
            ).exists()
        except Exception:
            pass

    return {
        'id':               str(user.id),
        'email':            user.email,
        'username':         user.username,
        'first_name':       user.first_name,
        'last_name':        user.last_name,
        'role':             user.role,       # legacy — conservé pour compat frontend
        'active_roles':     active_roles,    # nouveau — source de vérité Phase 1
        'is_active':        user.is_active,
        'is_verified':      user.is_verified,
        'is_staff':         user.is_staff,
        'is_superuser':     user.is_superuser,
        'profile_photo':    profile_photo,
        'profile_id':       profile_id,
        'teacher_profile':  teacher_profile,
        'author_profile':   author_profile,
        'unread_notifications_count': unread_notifications_count,
        'phone':            str(user.phone) if user.phone else "",
        'occupation':       occupation,
        'badges':           user.badges,
        'reputation_score': user.reputation_score,
        'date_joined':      user.date_joined.isoformat(),
        'has_active_family_subscription': has_active_family_subscription,
    }


def _extract_profile_data(role_code: str, data: dict) -> dict:
    """
    Extrait les données de profil spécifiques au rôle.
    """
    if role_code == 'teacher':
        return {}
    
    elif role_code == 'student':
        return {
            'date_of_birth': data.get('date_of_birth'),
            'city': data.get('city', ''),
            'school_level': data.get('school_level', 'primary'),
            'grade_level_id': data.get('grade_level'),
            'school_name': data.get('school_name', ''),
            'country': data.get('country', 'BJ'),
            'profile_photo': data.get('profile_photo'),
        }
    
    elif role_code == 'author':
        return {
            'bio': data.get('bio', ''),
            'profile_photo': data.get('profile_photo'),
        }
    
    elif role_code == 'parent':
        return {
            'occupation': data.get('occupation', ''),
        }
    
    return {}


# ─────────────────────────────────────────────────────────────
# Services publics - Authentification
# ─────────────────────────────────────────────────────────────

def login(identifier: str, password: str, request=None) -> dict:
    """
    Login multi-identifier (email | phone | username) + password.
    Retourne { tokens, user }.
    Lève AuthenticationFailed ou AccountInactive.
    """
    user_obj = _find_user(identifier)
    if user_obj is None:
        # On tente quand même authenticate pour que Axes enregistre la tentative sur l'ID inexistant (sécurité)
        authenticate(request=request, username=identifier, password=password)
        raise AuthenticationFailed("Identifiants invalides.")

    # Utiliser authenticate() de Django pour que les signaux Axes soient déclenchés
    user = authenticate(request=request, username=user_obj.username, password=password)

    if user is None:
        raise AuthenticationFailed("Identifiants invalides.")

    if not user.is_active:
        raise AccountInactive("Ce compte est désactivé.")

    if user.is_suspended:
        reason = user.suspension_reason or "Comportement non conforme."
        raise AccountSuspended(f"Votre compte est suspendu. Raison : {reason}")

    # Synchronisation Onboarding Automatique (Self-healing)
    if user.role == 'teacher':
        _sync_teacher_onboarding(user)
    elif user.role == 'parent':
        ensure_parent_role(user)

    # Invalidation multi-appareils (Levée pour les Admins)
    if hasattr(user, 'session_version'):
        if not (user.is_superuser or user.is_staff or getattr(user, 'role', '') == 'admin'):
            user.session_version += 1
            user.save(update_fields=['session_version'])

    from django.contrib.auth.models import update_last_login
    update_last_login(None, user)

    tokens = _generate_jwt(user)
    logger.info(f"Login successful for {user.email}")
    return {'tokens': tokens, 'user': _build_user_payload(user)}


def ensure_teacher_role(user: 'User') -> None:
    """
    S'assure que l'utilisateur possède :
    1. Un TeacherProfile (créé si absent)
    2. Le rôle dynamique 'teacher' actif (créé/activé si absent)
    
    C'est la fonction d'auto-réparation (self-healing) appelée lors de l'onboarding.
    """
    try:
        from teachers.models import TeacherProfile
        from roles.services import grant_role
        
        # 1. Profil
        TeacherProfile.objects.get_or_create(user=user)
        
        # 2. Rôle Dynamique
        grant_role(user=user, role_code='teacher', granted_by=user, activate_immediately=True)
        
        # 3. Synchro Onboarding Status
        _sync_teacher_onboarding(user)
        
        logger.info(f"Rôle enseignant auto-réparé/confirmé pour {user.email}")
    except Exception as e:
        logger.error(f"Échec ensure_teacher_role pour {user.email}: {e}")


def ensure_parent_role(user: 'User') -> None:
    """
    S'assure qu'un compte parent legacy possede aussi les donnees modulaires
    attendues par les permissions /api/v1/parents/.
    """
    try:
        from parents.services import ensure_parent_account

        _, report = ensure_parent_account(user)
        if any(report.get(key) for key in (
            'legacy_parent_created',
            'parent_profile_created',
            'parent_role_created',
            'legacy_links_created',
            'modular_links_created',
            'quota_adjusted',
        )):
            logger.info(f"Compte parent auto-réparé/confirmé pour {user.email}: {report}")
    except Exception as e:
        logger.error(f"Échec ensure_parent_role pour {user.email}: {e}")


def _sync_teacher_onboarding(user: 'User') -> None:
    """
    S'assure que si un prof est déjà validé dans le système (legacy ou nouveau),
    son onboarding_status est bien à 'complete'.
    IMPORTANT: Cette fonction ne doit JAMAIS auto-approuver un compte.
    """
    try:
        from teachers.models import TeacherProfile
        profile, created = TeacherProfile.objects.get_or_create(user=user)
        
        # Source de vérité pour l'approbation : Profil Modulaire OU Legacy Teacher
        is_already_approved = (
            profile.verification_status == TeacherProfile.VerificationStatus.APPROVED or
            (hasattr(user, 'teacher') and getattr(user.teacher, 'is_validated', False))
        )
        
        if is_already_approved:
            # On synchronise uniquement vers COMPLETE si ce n'est pas déjà le cas
            # Mais on ne touche JAMAIS au statut de vérification ici (source de vérité externe)
            if profile.onboarding_status != TeacherProfile.OnboardingStatus.COMPLETE:
                profile.onboarding_status = TeacherProfile.OnboardingStatus.COMPLETE
                profile.save(update_fields=['onboarding_status', 'updated_at'])
                logger.info(f"Onboarding auto-complété pour {user.email} (basé sur statut validé)")
    except Exception as e:
        logger.error(f"Erreur sync_teacher_onboarding pour {user.email}: {e}")


def logout(refresh_token: str) -> None:
    """
    Blackliste le refresh token (simplejwt blacklist).
    Nécessite que 'rest_framework_simplejwt.token_blacklist' soit dans INSTALLED_APPS.
    """
    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
        logger.info("Token blacklisted successfully")
    except Exception as e:
        logger.warning(f"accounts/logout: impossible de blacklister le token: {e}")


def get_me(user: 'User') -> dict:
    """Retourne le payload complet de l'utilisateur connecté."""
    return _build_user_payload(user)


def update_me(user: 'User', user_data: dict, profile_data: dict) -> dict:
    """
    Met à jour les champs de base de l'utilisateur et son profil actif.
    Priorité aux nouveaux profils modulaires, fallback sur core.
    
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
        user.username = validated_email  # username = email (convention legacy)
        user.is_verified = False             # re-vérification requise
        changed = True

    if changed:
        user.save()

    # Profil modulaire (Phase 1) en priorité, fallback core
    profile = None
    if hasattr(user, 'student_profile') and user.student_profile:
        profile = user.student_profile
    elif hasattr(user, 'teacher_profile') and user.teacher_profile:
        profile = user.teacher_profile
    elif hasattr(user, 'author_profile') and user.author_profile:
        profile = user.author_profile
    elif hasattr(user, 'parent_profile') and user.parent_profile:
        profile = user.parent_profile
    # Fallback legacy
    elif user.role == 'student' and hasattr(user, 'student'):
        profile = user.student
    elif user.role == 'teacher' and hasattr(user, 'teacher'):
        profile = user.teacher
    elif user.role == 'parent' and hasattr(user, 'parent'):
        profile = user.parent
    elif user.role == 'author' and hasattr(user, 'author'):
        profile = user.author

    if profile and profile_data:
        protected = {'id', 'user', 'profile_photo', 'created_at', 'updated_at'}
        for key, value in profile_data.items():
            if key not in protected and hasattr(profile, key):
                setattr(profile, key, value)
        profile.save()

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
    # 'phone' est un alias convénient pour 'sms'
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

    # Déterminer la cible de livraison selon le canal
    service = NotificationService()
    if channel == 'email':
        target = user.email
    elif channel == 'sms':
        target = str(user.phone) if user.phone else user.email
        if not user.phone:
            logger.warning(f"accounts/send_otp: pas de téléphone pour {user.email}, fallback email")
            channel = 'email'
    else:  # whatsapp
        target = str(user.phone)

    try:
        service.send_otp(target, channel, code=code)
        logger.info(f"accounts/send_otp: OTP envoyé à {target} via {channel}")
    except Exception as e:
        logger.error(f"accounts/send_otp: Erreur envoi OTP à {target}: {e}")
        raise


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
        user = User.objects.get(email=email)
        # Si l'utilisateur n'a pas de téléphone, on force l'email
        effective_channel = channel
        if channel == 'sms' and not user.phone:
            effective_channel = 'email'
            logger.info(f"accounts/request_password_reset: pas de téléphone pour {email}, canal basculé sur email")
        send_otp(identifier=user.email, channel=effective_channel)
    except User.DoesNotExist:
        pass
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


def change_password(user: 'User', old_password: str, new_password: str) -> None:
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

def _register_user(role_code: str, data: dict) -> dict:
    """
    Factory pour créer un utilisateur de tout type.
    Regroupe la validation commune et la création de base.
    
    Crée l'utilisateur, son profil spécifique, assigne le rôle et envoie l'OTP.
    Retourne les tokens JWT et le payload /me.
    """
    # Valider et normaliser l'email
    email = _validate_email(data.get('email', ''))
    
    # Vérifier l'unicité de l'email
    if User.objects.filter(email__iexact=email).exists():
        raise ValueError("Cet email est déjà utilisé.")
    if User.objects.filter(username__iexact=email).exists():
        raise ValueError("Cet email est déjà utilisé.")
    
    # Valider et normaliser le téléphone
    phone = str(data.get('phone', '')).strip().replace(" ", "")
    if phone and User.objects.filter(phone=phone, is_active=True).exists():
        raise ValueError("Ce numéro de téléphone est déjà associé à un autre compte.")

    # Valider le mot de passe
    password = data.get('password', '')
    if len(password) < 8:
        raise ValueError("Le mot de passe doit contenir au moins 8 caractères.")

    # Extraire les données communes
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    country = data.get('country', 'BJ')

    try:
        with transaction.atomic():
            # 1. Créer l'utilisateur de base
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                phone=phone,
                role=role_code,
                country=country,
            )

            # 2. Créer le profil spécifique selon le rôle
            if role_code == 'teacher':
                from teachers.models import TeacherProfile
                TeacherProfile.objects.create(user=user)
            
            elif role_code == 'student':
                from students.models import StudentProfile
                StudentProfile.objects.create(
                    user=user,
                    date_of_birth=data.get('date_of_birth'),
                    city=data.get('city', ''),
                    school_level=data.get('school_level', 'primary'),
                    grade_level_id=data.get('grade_level'),
                    school_name=data.get('school_name', ''),
                    country=country,
                    profile_photo=data.get('profile_photo'),
                )
            
            elif role_code == 'author':
                from authors.models import AuthorProfile
                AuthorProfile.objects.create(
                    user=user,
                    bio=data.get('bio', ''),
                    profile_photo=data.get('profile_photo'),
                )
            
            elif role_code == 'parent':
                from parents.services import ensure_parent_account
                ensure_parent_account(user)

            # 3. Assigner le rôle dynamique
            from roles.services import grant_role
            grant_role(user=user, role_code=role_code, granted_by=user, activate_immediately=True)

            # 4. Envoyer l'OTP initial automatiquement
            send_otp(email, channel='sms')

            logger.info(f"User registered: {email} ({role_code})")
    except Exception as e:
        logger.error(f"Registration failed for {email} ({role_code}): {e}")
        raise

    tokens = _generate_jwt(user)
    return {'tokens': tokens, 'user': _build_user_payload(user)}


def register_teacher(data: dict) -> dict:
    """Crée un nouvel utilisateur enseignant avec son TeacherProfile."""
    return _register_user(role_code='teacher', data=data)


def register_student(data: dict) -> dict:
    """Crée un utilisateur élève avec son StudentProfile."""
    return _register_user(role_code='student', data=data)


def register_author(data: dict) -> dict:
    """Crée un utilisateur auteur avec son AuthorProfile."""
    return _register_user(role_code='author', data=data)


def register_parent(data: dict) -> dict:
    """Crée un utilisateur parent avec son ParentProfile."""
    return _register_user(role_code='parent', data=data)


# ─────────────────────────────────────────────────────────────
# Services publics - Admin
# ─────────────────────────────────────────────────────────────

def admin_create_user_wizard(admin_user: 'User', data: dict) -> dict:
    """
    Assistant de création d'utilisateur par un administrateur.
    
    - Génère un mot de passe aléatoire complexe
    - Crée le compte et les profils
    - Assigne le rôle
    - Envoie un email de bienvenue (ASYNCHRONE via Celery)
    
    Retourne les détails du nouvel utilisateur.
    """
    # Valider et normaliser l'email
    email = _validate_email(data.get('email', ''))
    
    if not email:
        raise ValueError("L'adresse email est obligatoire.")
        
    role_code = data.get('role', 'student')
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    phone = str(data.get('phone') or '').strip().replace(" ", "")
    country = data.get('country', 'BJ')
    profile_data = data.get('profile_data', {})

    # Vérifier que l'email n'existe pas
    if User.objects.filter(email__iexact=email).exists():
        raise ValueError("Cet email est déjà utilisé.")
    if User.objects.filter(username__iexact=email).exists():
        raise ValueError("Cet email est déjà utilisé.")

    if phone and User.objects.filter(phone=phone, is_active=True).exists():
        raise ValueError("Ce numéro de téléphone est déjà associé à un autre compte.")

    # Générer un mot de passe complexe
    password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))

    try:
        with transaction.atomic():
            # 1. Créer l'utilisateur
            user = User.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                phone=phone,
                country=country,
                role=role_code,
                is_verified=True  # L'admin valide l'identité par défaut
            )

            # 2. Appliquer les permissions administratives si nécessaire
            if role_code in ['admin', 'super_admin']:
                user.is_staff = True
                if role_code == 'super_admin':
                    user.is_superuser = True
                user.save(update_fields=['is_staff', 'is_superuser'])

            # 3. Créer le profil spécifique
            if role_code == 'teacher':
                from teachers.models import TeacherProfile
                TeacherProfile.objects.create(
                    user=user,
                    verification_status=TeacherProfile.VerificationStatus.UNSUBMITTED,
                    onboarding_status=TeacherProfile.OnboardingStatus.NOT_STARTED
                )

            elif role_code == 'student':
                from students.models import StudentProfile
                StudentProfile.objects.create(
                    user=user,
                    date_of_birth=profile_data.get('date_of_birth'),
                    city=profile_data.get('city', ''),
                    school_level=profile_data.get('school_level', 'primary'),
                    grade_level_id=profile_data.get('grade_level'),
                    school_name=profile_data.get('school_name', ''),
                    country=country
                )

            elif role_code == 'parent':
                from parents.services import ensure_parent_account
                parent_profile, _ = ensure_parent_account(user)
                occupation = profile_data.get('occupation', '')
                if occupation and parent_profile.occupation != occupation:
                    parent_profile.occupation = occupation
                    parent_profile.save(update_fields=['occupation', 'updated_at'])

            elif role_code == 'author':
                from authors.models import AuthorProfile
                AuthorProfile.objects.create(
                    user=user,
                    bio=profile_data.get('bio', '')
                )

            # 4. Assigner le rôle dynamique
            from roles.services import grant_role
            grant_role(user=user, role_code=role_code, granted_by=admin_user, activate_immediately=True)

            logger.info(f"admin_create_user_wizard: Utilisateur {email} ({role_code}) créé par {admin_user.email}")

            # 5. Envoyer l'email de bienvenue (ASYNCHRONE via Celery)
            from accounts.tasks import send_welcome_email_async
            send_welcome_email_async.delay(
                email=email,
                first_name=first_name,
                password=password,
                role_code=role_code
            )

            return {
                'id': str(user.id),
                'email': user.email,
                'role': role_code,
                'status': 'success',
                'message': f'Utilisateur créé. Email de bienvenue en cours d\'envoi à {email}.'
            }

    except Exception as e:
        logger.error(f"admin_create_user_wizard: Échec création pour {email}: {e}", exc_info=True)
        raise e
