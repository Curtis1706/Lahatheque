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

