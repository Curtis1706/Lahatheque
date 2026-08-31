from rest_framework.permissions import BasePermission

class IsPublisher(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'publisher')

class IsLegalReviewer(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'legal_reviewer')

class IsLayoutArtist(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'layout_artist')


class HasValidPublisherApiKey(BasePermission):
    """Authentification par clé API (X-Client-Id / X-Client-Secret) pour le dépôt externe."""

    def has_permission(self, request, view):
        import hashlib
        client_id = request.headers.get("X-Client-Id", "")
        client_secret = request.headers.get("X-Client-Secret", "")

        if not client_id or not client_secret:
            return False

        from .models import PublisherApiKey

        secret_hash = hashlib.sha256(client_secret.encode()).hexdigest()
        key = PublisherApiKey.objects.filter(
            client_id=client_id, client_secret_hash=secret_hash, status="active"
        ).first()

        if not key:
            return False

        request.publisher_api_key = key
        request.publisher_profile = key.publisher

        from django.utils import timezone
        key.last_used_at = timezone.now()
        key.save(update_fields=["last_used_at"])

        return True

