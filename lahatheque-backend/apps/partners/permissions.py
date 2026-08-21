from rest_framework.permissions import BasePermission

class IsUniversity(BasePermission):
    """Permission accordée aux comptes Université Partenaire et Administrateurs."""
    def has_permission(self, request, view):
        return bool(
            request.user 
            and request.user.is_authenticated 
            and request.user.role in ['university', 'admin', 'super_admin']
        )
