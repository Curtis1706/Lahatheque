from django.core.exceptions import ValidationError
from django.db.models import Sum

def validate_author_rights_pool(ouvrage):
    total = ouvrage.author_rights.aggregate(Sum('pool_share_percent'))['pool_share_percent__sum'] or 0
    if abs(total - 100.00) > 0.01:
        raise ValidationError(f"La somme des parts d'auteurs ({total}%) doit égaler 100.00%.")
