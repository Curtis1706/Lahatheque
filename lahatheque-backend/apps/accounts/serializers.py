from rest_framework import serializers
from django.conf import settings
from .models import User, MFAConfig, OTP

class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    institution_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'phone', 
            'country', 'role', 'active_roles', 'avatar', 'avatar_url', 
            'pen_name', 'bio', 'institution', 'institution_name',
            'is_suspended', 'suspension_reason', 'is_verified', 
            'is_staff', 'is_superuser', 'date_joined'
        ]
        read_only_fields = ['id', 'username', 'is_staff', 'is_superuser', 'date_joined']

    def get_avatar_url(self, obj) -> str | None:
        if obj.avatar and bool(getattr(obj.avatar, 'name', None)):
            avatar_str = str(obj.avatar.name)
            if avatar_str.startswith('http'):
                return avatar_str
            try:
                return obj.avatar.url
            except Exception:
                public_url = getattr(settings, 'CLOUDFLARE_R2_PUBLIC_URL', '') or getattr(settings, 'CLOUDFLARE_R2_PUBLIC_DOMAIN', '')
                if public_url:
                    if not public_url.startswith('http'):
                        public_url = f"https://{public_url}"
                    return f"{public_url.rstrip('/')}/{avatar_str.lstrip('/')}"
                return f"/media/{avatar_str.lstrip('/')}"
        return None

    def get_institution_name(self, obj) -> str | None:
        if obj.institution:
            return obj.institution.name
        return None


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(required=False, allow_blank=True, default='')
    last_name = serializers.CharField(required=False, allow_blank=True, default='')
    phone = serializers.CharField(required=False, allow_blank=True, default='')
    country = serializers.CharField(required=False, default='BJ')
    role = serializers.ChoiceField(choices=['student', 'author'], default='student')
    pen_name = serializers.CharField(required=False, allow_blank=True, default='')
    bio = serializers.CharField(required=False, allow_blank=True, default='')


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone', 'country', 'pen_name', 'bio', 'avatar']


class AdminUserCreateSerializer(serializers.Serializer):
    email = serializers.EmailField()
    first_name = serializers.CharField(required=False, allow_blank=True, default='')
    last_name = serializers.CharField(required=False, allow_blank=True, default='')
    phone = serializers.CharField(required=False, allow_blank=True, default='')
    country = serializers.CharField(required=False, default='BJ')
    role = serializers.ChoiceField(choices=[
        'student', 'teacher', 'author', 'university', 'publisher', 
        'layout_artist', 'chief_layout', 'legal_reviewer', 'manager', 
        'wholesaler', 'partner_api', 'admin', 'super_admin'
    ])
    institution_id = serializers.UUIDField(required=False, allow_null=True)
    temporary_password = serializers.CharField(required=False, allow_blank=True)


class OTPSerializer(serializers.ModelSerializer):
    class Meta:
        model = OTP
        fields = ['id', 'code', 'channel', 'expires_at']
