"""Application des quotas partenaires (requêtes/jour, sessions simultanées)."""
from django.core.cache import cache
from django.utils import timezone


class PartnerQuotaError(Exception):
    pass


def check_and_increment_daily_quota(partner) -> None:
    """Vérifie et incrémente le compteur de requêtes journalières d'un partenaire."""
    quotas = partner.quotas or {}
    if quotas.get("is_unlimited") or quotas.get("daily_request_limit", -1) == -1:
        return

    limit = quotas.get("daily_request_limit", 10000)
    today_key = f"partner_quota:{partner.id}:{timezone.now().strftime('%Y-%m-%d')}"

    current = cache.get(today_key, 0)
    if current >= limit:
        raise PartnerQuotaError(
            f"Quota journalier atteint ({limit} requêtes/jour). Réessayez demain ou contactez LAHA Éditions."
        )

    cache.set(today_key, current + 1, timeout=86400)


def check_concurrent_sessions_quota(partner) -> None:
    """Vérifie que le partenaire n'a pas dépassé son nombre de sessions simultanées autorisées."""
    from .models import ReaderSession

    quotas = partner.quotas or {}
    if quotas.get("is_unlimited") or quotas.get("concurrent_sessions_limit", -1) == -1:
        return

    limit = quotas.get("concurrent_sessions_limit", 200)
    active_count = ReaderSession.objects.filter(
        partner=partner,
        status__in=["created", "opened", "in_progress"],
        expires_at__gt=timezone.now(),
    ).count()

    if active_count >= limit:
        raise PartnerQuotaError(
            f"Limite de sessions simultanées atteinte ({limit}). Fermez des sessions actives avant d'en créer de nouvelles."
        )
