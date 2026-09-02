from rest_framework import serializers
from .models import GuideItem, ContactMessage

class GuideItemSerializer(serializers.ModelSerializer):
    target_role_display = serializers.CharField(source='get_target_role_display', read_only=True)
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = GuideItem
        fields = [
            'id',
            'target_role',
            'target_role_display',
            'category_label',
            'title',
            'summary',
            'icon_name',
            'image_url',
            'video_url',
            'content',
            'steps',
            'faq',
            'order',
            'is_published',
            'created_by',
            'created_by_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'created_by']

    def get_created_by_name(self, obj) -> str:
        if obj.created_by:
            name = f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
            return name or obj.created_by.email
        return "Administrateur"
