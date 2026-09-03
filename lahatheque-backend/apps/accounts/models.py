"""Modèles identités, rôles et authentification (User, MFAConfig, OTP)."""
import uuid
import secrets
from datetime import timedelta
from django.conf import settings
from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager

from django.utils import timezone
from .oauth2.models import RevokedPartnerToken

ROLE_CHOICES = (
    ('student', 'Étudiant / Client Lecteur'),
    ('teacher', 'Enseignant'),
    ('university', 'Université (Établissement Partenaire)'),
    ('publisher', 'Éditeur Tiers'),
    ('author', 'Auteur'),
    ('legal_reviewer', 'Relecteur Juridique / Juriste'),
    ('layout_artist', 'Maquettiste'),
    ('chief_layout', 'Chef Maquettiste'),
    ('manager', 'Gestionnaire Stock & Livraison'),
    ('partner_api', 'Partenaire API'),
    ('wholesaler', 'Grossiste'),
    ('admin', 'Administrateur'),
    ('super_admin', 'Super Admin'),
)

class User(AbstractUser):
    objects = UserManager()
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=30, blank=True, null=True)
    country = models.CharField(max_length=2, default='BJ') # Code ISO
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='student')
    active_roles = models.JSONField(default=list, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    
    # Identité d'Auteur & Affiliation
    pen_name = models.CharField(max_length=255, blank=True, default='') # Facultatif
    university_affiliation = models.CharField(max_length=255, blank=True, default='')
    bio = models.TextField(blank=True, default='')
    institution = models.ForeignKey('partners.Institution', null=True, blank=True, on_delete=models.SET_NULL, related_name='members')
    
    # Coordonnées Financières & Versement (Droits d'Auteur / Editeur)
    bank_name = models.CharField(max_length=100, blank=True, default='')
    iban = models.CharField(max_length=50, blank=True, default='')
    swift = models.CharField(max_length=20, blank=True, default='')
    momo_number = models.CharField(max_length=30, blank=True, default='')
    
    is_suspended = models.BooleanField(default=False)
    suspension_reason = models.TextField(blank=True, default='')
    is_verified = models.BooleanField(default=False)
    session_version = models.IntegerField(default=1)
    last_active_at = models.DateTimeField(blank=True, null=True)
    mfa_enabled = models.BooleanField(default=False)
    mfa_secret = models.CharField(max_length=255, blank=True, null=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

class MFAConfig(models.Model):
    objects = models.Manager()
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='mfa_config')
    backup_codes = models.JSONField(default=list)
    last_used_at = models.DateTimeField(blank=True, null=True)

class OTP(models.Model):
    objects = models.Manager()
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='otps')
    code = models.CharField(max_length=6)
    channel = models.CharField(max_length=10, choices=[('sms', 'SMS'), ('email', 'Email')])
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField()

    def is_expired(self) -> bool:
        return timezone.now() > self.expires_at


class PasswordResetCode(models.Model):
    """Code de réinitialisation de mot de passe — 6 chiffres, valable 15 minutes, usage unique."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reset_codes')
    code = models.CharField(max_length=6, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)

    class Meta:
        db_table = 'accounts_password_reset_code'

    @classmethod
    def generate_for_user(cls, user):
        code = f"{secrets.randbelow(1000000):06d}"
        return cls.objects.create(
            user=user,
            code=code,
            expires_at=timezone.now() + timedelta(minutes=15),
        )

    def is_valid(self):
        return not self.used and timezone.now() < self.expires_at

