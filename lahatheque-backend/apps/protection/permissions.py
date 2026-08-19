from rest_framework.permissions import BasePermission

class IsAnnotationOwner(BasePermission):
    """
    Permission stricte : autorise l'accès uniquement si l'annotation appartient à l'utilisateur connecté.
    """
    def has_object_permission(self, request, view, obj):
        return bool(request.user and request.user.is_authenticated and obj.user == request.user)


class IsAdminOrStaff(BasePermission):
    """
    Autorise l'accès aux utilisateurs ayant le rôle admin, super_admin, ou le flag is_staff / is_superuser.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        user = request.user
        return bool(
            getattr(user, 'is_staff', False) or
            getattr(user, 'is_superuser', False) or
            getattr(user, 'role', '') in ('admin', 'super_admin') or
            'admin' in getattr(user, 'active_roles', [])
        )

