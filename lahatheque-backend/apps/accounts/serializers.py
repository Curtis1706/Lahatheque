from rest_framework import serializers
from .models import User, MFAConfig, OTP

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'role', 'active_roles', 'country', 'is_verified']

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
    role = serializers.ChoiceField(choices=['student', 'teacher', 'author', 'librarian', 'publisher', 'layout_artist', 'chief_layout', 'legal_reviewer', 'manager', 'wholesaler', 'partner_api'], default='student')

class OTPSerializer(serializers.ModelSerializer):
    class Meta:
        model = OTP
        fields = ['id', 'code', 'channel', 'expires_at']

