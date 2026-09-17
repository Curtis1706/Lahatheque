"""Application des quotas partenaires (requêtes/jour, sessions simultanées)."""
from django.core.cache import cache
from django.utils import timezone


class PartnerQuotaError(Exception):
    pass


def check_and_increment_daily_quota(partner) -> None:
    """Verifie et incremente le compteur de requetes journalieres d'un partenaire (atomique)."""
    quotas = partner.quotas or {}
    if quotas.get("is_unlimited") or quotas.get("daily_request_limit", -1) == -1:
        return

    limit = quotas.get("daily_request_limit", 10000)
    today_key = f"partner_quota:{partner.id}:{timezone.now().strftime('%Y-%m-%d')}"

    # cache.incr() est atomique en Redis : lit et incremente en une seule operation (S-08)
    # Evite la condition de course du pattern get()/set() qui permettait de depasser le quota
    try:
        new_count = cache.incr(today_key)
    except Exception:
        # Si la cle n'existe pas encore, incr() la cree avec la valeur 1 dans Django/Redis
        # Ce bloc ne devrait jamais s'executer avec django-redis, mais on reste defensif
        new_count = 1
        cache.set(today_key, 1, timeout=86400)

    if new_count == 1:
        # Premiere requete de la journee : poser l'expiration a minuit (86400s)
        cache.expire(today_key, 86400)

    if new_count > limit:
        # Decrementer pour ne pas bloquer les requetes suivantes indefiniment
        try:
            cache.decr(today_key)
        except Exception:
            pass
        raise PartnerQuotaError(
            f"Quota journalier atteint ({limit} requetes/jour). Reessayez demain ou contactez LAHA Editions."
        )


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
