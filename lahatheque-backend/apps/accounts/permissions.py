from rest_framework.permissions import BasePermission

class IsRoleUser(BasePermission):
    required_role = None
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and (request.user.role == self.required_role or self.required_role in request.user.active_roles))
