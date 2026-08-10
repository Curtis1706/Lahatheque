from rest_framework.permissions import BasePermission

class IsAnnotationOwner(BasePermission):
    """
    Permission stricte : autorise l'accès uniquement si l'annotation appartient à l'utilisateur connecté.
    """
    def has_object_permission(self, request, view, obj):
        return bool(request.user and request.user.is_authenticated and obj.user == request.user)
