"""
roles/selectors.py

Couche de lecture — logique de requête uniquement.
Aucune mutation ici. Utilisé par les vues et les services.
"""
from typing import Optional, TYPE_CHECKING
from django.contrib.auth import get_user_model
from django.db.models import QuerySet
from .models import Role, UserRole

if TYPE_CHECKING:
    from core.models import User
else:
    User = get_user_model()


def get_active_roles(user: 'User') -> list[str]:
    """
    Retourne la liste des codes de rôles actifs pour un utilisateur.
    Exemple: ['student', 'author']
    """
    return list(
        user.user_roles
        .filter(status=UserRole.Status.ACTIVE)
        .select_related('role')
        .values_list('role__code', flat=True)
    )


def has_active_role(user: 'User', role_code: str) -> bool:
    """
    Vérifie si un utilisateur a un rôle actif spécifique.
    Utilisé dans les permissions et les services.
    """
    return user.user_roles.filter(
        role__code=role_code,
        status=UserRole.Status.ACTIVE
    ).exists()


def is_super_client(user: Optional['User']) -> bool:
    """
    Vérifie si un utilisateur est un Super Client (rôle principal ou rôle actif).
    """
    if not user or not getattr(user, 'is_authenticated', False):
        return False
    return (
        getattr(user, 'role', '') == 'super_client'
        or has_active_role(user, 'super_client')
    )


def get_user_role(user: 'User', role_code: str) -> Optional[UserRole]:
    """
    Retourne l'instance UserRole pour un rôle donné, ou None.
    """
    return user.user_roles.filter(role__code=role_code).select_related('role').first()


def get_role_by_code(code: str) -> Optional[Role]:
    """
    Récupère un rôle système par son code.
    Lève Role.DoesNotExist si introuvable (géré par l'appelant).
    """
    return Role.objects.filter(code=code).first()


def get_pending_user_roles() -> "QuerySet[UserRole]":
    """
    Retourne tous les rôles en attente de validation admin.
    Utilisé dans le dashboard admin.
    """
    from .models import UserRole as UR
    return UR.objects.filter(status=UR.Status.PENDING).select_related('user', 'role').order_by('created_at')
