from rest_framework.permissions import BasePermission


class IsLayoutArtistOrAbove(BasePermission):
    """
    Permission pour les Maquettistes, Chef Maquettistes et Administrateurs.
    Utilisée pour les opérations de dépôt et consultation de ses propres ouvrages.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        allowed_roles = ('layout_artist', 'chief_layout', 'admin', 'super_admin')
        user = request.user
        active = user.active_roles if isinstance(getattr(user, 'active_roles', None), list) else []
        return bool(user.role in allowed_roles or any(r in active for r in allowed_roles))


class IsChiefLayoutOnly(BasePermission):
    """
    Permission STRICTEMENT réservée au Chef Maquettiste et aux Administrateurs.
    Utilisée pour les actions de validation et de rejet des dépôts.
    Un simple maquettiste NE PEUT PAS valider ou rejeter.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        chief_roles = ('chief_layout', 'admin', 'super_admin')
        user = request.user
        active = user.active_roles if isinstance(getattr(user, 'active_roles', None), list) else []
        return bool(user.role in chief_roles or any(r in chief_roles for r in active))


class IsManagerOrAdmin(BasePermission):
    """Gestion du référentiel disciplines/catégories — réservé Gestionnaire et Admin."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        allowed_roles = ('manager', 'admin', 'super_admin')
        user = request.user
        active = user.active_roles if isinstance(getattr(user, 'active_roles', None), list) else []
        return bool(user.role in allowed_roles or any(r in active for r in allowed_roles))
