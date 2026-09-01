"""Modèles pour la gestion et la révocation des jetons OAuth2 partenaires."""
import uuid
from django.db import models


class RevokedPartnerToken(models.Model):
    """Liste de révocation des jetons OAuth2 partenaires (JWT sans état par nature)."""
    objects = models.Manager()
    jti = models.CharField(max_length=64, unique=True, db_index=True)
    partner_id = models.UUIDField(null=True, blank=True)
    revoked_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(help_text="Date d'expiration naturelle du jeton")

    class Meta:
        db_table = "oauth2_revoked_partner_token"
        verbose_name = "Jeton Partenaire Révoqué"
        verbose_name_plural = "Jetons Partenaires Révoqués"

    def __str__(self) -> str:
        return f"RevokedToken {self.jti} (partner {self.partner_id})"
