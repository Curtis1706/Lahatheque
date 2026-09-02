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
