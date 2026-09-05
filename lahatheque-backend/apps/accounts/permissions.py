from rest_framework.permissions import BasePermission

class IsRoleUser(BasePermission):
    required_role = None
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role == self.required_role or (isinstance(request.user.active_roles, list) and self.required_role in request.user.active_roles)))

class IsAuthor(IsRoleUser):
    required_role = 'author'

class IsUniversityStaff(IsRoleUser):
    required_role = 'university'

class IsAdmin(IsRoleUser):
    required_role = 'admin'

class IsSuperAdmin(IsRoleUser):
    required_role = 'super_admin'

class IsAdminOrSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        active = request.user.active_roles if isinstance(getattr(request.user, 'active_roles', None), list) else []
        return bool(
            request.user and request.user.is_authenticated
            and (request.user.role in ('admin', 'super_admin')
                 or 'admin' in active
                 or 'super_admin' in active)
        )

class IsLegalReviewerRole(IsRoleUser):
    required_role = 'legal_reviewer'

class IsWholesaler(IsRoleUser):
    required_role = 'wholesaler'

class IsManagerOrAdmin(BasePermission):
    """Autorise uniquement les Gestionnaires, Admins et Super Admins."""
    def has_permission(self, request, view):
        active = request.user.active_roles if isinstance(getattr(request.user, 'active_roles', None), list) else []
        return bool(
            request.user and request.user.is_authenticated
            and (request.user.role in ('manager', 'admin', 'super_admin')
                 or 'manager' in active
                 or 'admin' in active
                 or 'super_admin' in active)
        )


class IsAdminOrLegalReviewer(BasePermission):
    """Autorise uniquement les Administrateurs, Super Admins et Juristes."""
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        active = request.user.active_roles if isinstance(getattr(request.user, 'active_roles', None), list) else []
        role = getattr(request.user, 'role', '')
        return bool(
            role in ('admin', 'super_admin', 'legal_reviewer')
            or 'admin' in active
            or 'super_admin' in active
            or 'legal_reviewer' in active
            or getattr(request.user, 'is_staff', False)
        )


