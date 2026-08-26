"""Calcul centralisé des prix par profil acheteur — source unique de vérité tarifaire."""
from decimal import Decimal
from django.core.cache import cache


def get_platform_config():
    from .models import ConfigurationPlateformeGlobale

    config = cache.get("platform_config_singleton")
    if config is None:
        config = ConfigurationPlateformeGlobale.objects.first()
        if not config:
            config = ConfigurationPlateformeGlobale.objects.create()
        cache.set("platform_config_singleton", config, timeout=60)
    return config


def invalidate_platform_config_cache():
    cache.delete("platform_config_singleton")


def compute_role_price(ouvrage, role: str) -> dict:
    """
    Calcule le prix net numérique et papier pour un ouvrage, selon le profil acheteur.
    role : 'wholesaler' | 'author' | 'university' | 'public'
    """
    config = get_platform_config()

    public_digital = float(ouvrage.price_digital or 0)
    public_paper = float(ouvrage.price_paper or 0)

    rate_map = {
        "wholesaler": (
            float(config.remise_grossiste_numerique_pct),
            float(config.remise_grossiste_papier_pct),
        ),
        "author": (
            float(config.remise_auteur_numerique_pct),
            float(config.remise_auteur_papier_pct),
        ),
        "university": (
            float(config.remise_campus_numerique_pct),
            float(config.remise_campus_papier_pct),
        ),
        "public": (0.0, 0.0),
    }

    digital_pct, paper_pct = rate_map.get(role, (0.0, 0.0))

    digital_price = round(public_digital * (1 - digital_pct / 100), 2)
    paper_price = round(public_paper * (1 - paper_pct / 100), 2)

    return {
        "digital_price": digital_price,
        "paper_price": paper_price,
        "digital_discount_pct": digital_pct,
        "paper_discount_pct": paper_pct,
        "public_digital_price": public_digital,
        "public_paper_price": public_paper,
    }
