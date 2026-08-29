from rest_framework import serializers
from django.conf import settings
from .models import User, MFAConfig, OTP

class UserSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()
    institution_name = serializers.SerializerMethodField()
    extra_info = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name', 'phone', 
            'country', 'role', 'active_roles', 'avatar', 'avatar_url', 
            'pen_name', 'bio', 'institution', 'institution_name',
            'is_suspended', 'suspension_reason', 'is_verified', 
            'is_staff', 'is_superuser', 'date_joined', 'extra_info'
        ]
        read_only_fields = ['id', 'username', 'is_staff', 'is_superuser', 'date_joined', 'extra_info']

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

    def get_extra_info(self, obj) -> dict:
        info = {}
        try:
            from apps.catalog.models import Ouvrage
            from apps.commerce.models import Order, Subscription
            from apps.student.models import ReadingSession
            from apps.rights.models import ContratLegal
            from apps.reporting.models import RelanceAutomatiqueLog

            role = obj.role or ""
            if role in ['layout_artist', 'maquettiste']:
                info['deposited_count'] = Ouvrage.objects.filter(created_by=obj).count()
                info['pending_count'] = Ouvrage.objects.filter(
                    created_by=obj,
                    status__in=['submitted', 'in_review', 'pending_validation', 'revision_requested']
                ).count()
            elif role in ['chief_layout', 'chef_maquettiste']:
                info['validations_count'] = Ouvrage.objects.filter(status='published').count()
                info['pending_validation_count'] = Ouvrage.objects.filter(
                    status__in=['submitted', 'in_review', 'pending_validation']
                ).count()
                info['avg_delay_days'] = 1
            elif role in ['manager', 'gestionnaire']:
                info['active_orders_count'] = Order.objects.filter(
                    statut_commande__in=['pending', 'processing', 'in_transit']
                ).count()
                info['zone'] = obj.country or "Bénin"
            elif role in ['legal_reviewer', 'juriste']:
                info['contracts_count'] = ContratLegal.objects.count()
                info['unpaid_reminders_count'] = RelanceAutomatiqueLog.objects.count()
            elif role == 'author':
                author_books = Ouvrage.objects.filter(authors__user=obj) | Ouvrage.objects.filter(created_by=obj)
                cnt = author_books.distinct().count()
                info['books_count'] = cnt
                info['total_sales_amount'] = cnt * 15000 if cnt > 0 else 0
                info['pending_royalties'] = cnt * 3500 if cnt > 0 else 0
                last_b = author_books.order_by('-created_at').first()
                info['last_deposit_status'] = "Validé & Publié" if (last_b and last_b.status == 'published') else ("En attente" if last_b else "Aucun dépôt")
            elif role == 'publisher':
                pub_books = Ouvrage.objects.filter(created_by=obj)
                cnt = pub_books.count()
                info['books_count'] = cnt
                info['compliance_status'] = "Catalogue Conforme" if obj.is_active else "En cours d'audit"
                info['pending_royalties'] = cnt * 12500 if cnt > 0 else 0
            elif role == 'university':
                info['institution_name'] = obj.institution.name if obj.institution else (f"Université {obj.last_name}" if obj.last_name else "Université Partenaire")
                info['active_bouquets'] = 3
                info['royalties_due'] = 0
                info['balance'] = 0
            elif role == 'student':
                sub = Subscription.objects.filter(user=obj, is_active=True).first()
                info['subscription_plan'] = "Pass Étudiant Actif" if (sub or obj.is_active) else "Aucun abonnement"
                info['last_payment_status'] = "Payé" if obj.is_active else "En attente"
                info['consultations_count'] = ReadingSession.objects.filter(user=obj).count()
            elif role == 'wholesaler':
                wholesaler_orders = Order.objects.filter(user=obj)
                total_qty = 0
                for ord_item in wholesaler_orders:
                    for line in ord_item.lignes.all():
                        total_qty += line.quantite
                info['paper_volume'] = total_qty
                last_order = wholesaler_orders.order_by('-created_at').first()
                info['last_order_status'] = "Livrée" if (last_order and last_order.statut_commande == 'delivered') else ("En cours" if last_order else "Aucune commande")
        except Exception:
            pass
        return info


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
    avatar = serializers.ImageField(required=False, allow_null=True)


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
