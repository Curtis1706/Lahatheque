from rest_framework.permissions import BasePermission

class IsChiefLayoutOrAdmin(BasePermission):
    """
    Permission pour le Chef Maquettiste, Maquettiste et Administrateurs.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        user = request.user
        allowed_roles = ('chief_layout', 'layout_artist', 'admin', 'super_admin')
        active = user.active_roles if isinstance(getattr(user, 'active_roles', None), list) else []
        return bool(user.role in allowed_roles or any(r in active for r in allowed_roles))
