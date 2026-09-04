from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.serializers import ModelSerializer
from .models import Notification


class NotificationSerializer(ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user and user.is_authenticated:
            if user.role in ['legal_reviewer', 'admin', 'super_admin']:
                try:
                    from .tasks import check_and_generate_legal_notifications
                    check_and_generate_legal_notifications(user)
                except Exception:
                    pass
            if user.role in ['manager', 'admin', 'super_admin']:
                try:
                    from .tasks import check_and_generate_stock_notifications
                    check_and_generate_stock_notifications(user)
                except Exception:
                    pass
        return Notification.objects.filter(user=user).order_by('-created_at')

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset()
        serializer = self.get_serializer(qs, many=True)
        return Response({"success": True, "data": serializer.data, "results": serializer.data})

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({"success": True, "data": {"unread_count": count}})

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        updated = Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
        return Response({"success": True, "data": {"marked_count": updated}})
