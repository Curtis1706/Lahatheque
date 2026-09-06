from rest_framework import serializers
from .models import GuideCategory, GuideArticle, ContactMessage

class GuideArticleSerializer(serializers.ModelSerializer):
    """Sérialiseur de consultation publique/utilisateur pour un article publié."""
    image_url_resolved = serializers.SerializerMethodField()

    class Meta:
        model = GuideArticle
        fields = [
            'id', 'category', 'title', 'content', 'video_url', 'stream_id',
            'image', 'image_url', 'image_url_resolved', 'order',
            'is_published', 'created_at', 'updated_at'
        ]

    def get_image_url_resolved(self, obj):
        if obj.image_url:
            return obj.image_url
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class GuideCategorySerializer(serializers.ModelSerializer):
    """Sérialiseur de consultation utilisateur avec ses articles publiés."""
    articles = serializers.SerializerMethodField()

    class Meta:
        model = GuideCategory
        fields = ['id', 'title', 'description', 'roles', 'order', 'is_active', 'articles', 'created_at']

    def get_articles(self, obj):
        request = self.context.get('request')
        user_role = getattr(request.user, 'role', '') if request and hasattr(request, 'user') else ''
        is_admin = user_role in ['admin', 'super_admin'] or (request and hasattr(request.user, 'is_staff') and request.user.is_staff)
        
        qs = obj.articles.all() if is_admin else obj.articles.filter(is_published=True)
        return GuideArticleSerializer(qs.order_by('order'), many=True, context=self.context).data


class AdminGuideArticleSerializer(serializers.ModelSerializer):
    """Sérialiseur complet pour la création et l'édition admin d'articles."""
    image_url_resolved = serializers.SerializerMethodField()

    class Meta:
        model = GuideArticle
        fields = [
            'id', 'category', 'title', 'content', 'video_url', 'stream_id',
            'image', 'image_url', 'image_url_resolved', 'order',
            'is_published', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_image_url_resolved(self, obj):
        if obj.image_url:
            return obj.image_url
        if obj.image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None


class AdminGuideCategorySerializer(serializers.ModelSerializer):
    """Sérialiseur complet pour la gestion admin des catégories."""
    articles = serializers.SerializerMethodField()

    class Meta:
        model = GuideCategory
        fields = ['id', 'title', 'description', 'roles', 'order', 'is_active', 'articles', 'created_at', 'updated_at']

    def get_articles(self, obj):
        qs = obj.articles.all().order_by('order')
        return AdminGuideArticleSerializer(qs, many=True, context=self.context).data


class ProfessionalContactSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    is_platform_user = serializers.SerializerMethodField()

    class Meta:
        from .models import ProfessionalContact
        model = ProfessionalContact
        fields = [
            'id', 'first_name', 'last_name', 'full_name', 'email', 'phone',
            'organization', 'role_or_title', 'category', 'category_display',
            'notes', 'created_by', 'created_by_name', 'last_contacted_at',
            'emails_sent_count', 'created_at', 'updated_at', 'is_platform_user'
        ]
        read_only_fields = ['id', 'created_by', 'last_contacted_at', 'emails_sent_count', 'created_at', 'updated_at', 'is_platform_user']

    def get_full_name(self, obj) -> str:
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_created_by_name(self, obj) -> str:
        if not obj.created_by:
            return ""
        name = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
        return name or obj.created_by.email or ""

    def get_is_platform_user(self, obj) -> bool:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        return User.objects.filter(email__iexact=obj.email).exists()


class ContactEmailDispatchSerializer(serializers.ModelSerializer):
    contact_name = serializers.SerializerMethodField()
    contact_email = serializers.CharField(source='contact.email', read_only=True)
    sender_name = serializers.SerializerMethodField()

    class Meta:
        from .models import ContactEmailDispatch
        model = ContactEmailDispatch
        fields = [
            'id', 'contact', 'contact_name', 'contact_email',
            'sender', 'sender_name', 'subject', 'body_snippet',
            'status', 'sent_at'
        ]
        read_only_fields = ['id', 'contact', 'sender', 'status', 'sent_at']

    def get_contact_name(self, obj) -> str:
        if not obj.contact:
            return ""
        return f"{obj.contact.first_name} {obj.contact.last_name}".strip()

    def get_sender_name(self, obj) -> str:
        if not obj.sender:
            return "Système"
        name = f"{obj.sender.first_name} {obj.sender.last_name}".strip()
        return name or obj.sender.email or "Utilisateur"

