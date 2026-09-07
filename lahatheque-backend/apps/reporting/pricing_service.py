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


def compute_role_price(ouvrage, role: str, user=None) -> dict:
    """
    Calcule le prix net numérique, papier et audio pour un ouvrage, selon le profil acheteur.
    role : 'wholesaler' | 'author' | 'university' | 'public'
    user : Utilisateur connecté optionnel (permet la prise en compte des remises personnalisées par auteur)
    """
    config = get_platform_config()

    public_digital = float(ouvrage.price_digital or 0)
    public_paper = float(ouvrage.price_paper or 0)
    public_audio = float(getattr(ouvrage, 'price_audio', None) or 2500.0)

    # Récupération des taux pour l'auteur (avec priorité sur les remises individuelles sur-mesure)
    author_digital_pct = float(config.remise_auteur_numerique_pct)
    author_paper_pct = float(config.remise_auteur_papier_pct)
    author_audio_pct = float(getattr(config, 'remise_auteur_audio_pct', 25.0))

    if role == "author" and user:
        if getattr(user, 'custom_remise_numerique_pct', None) is not None:
            author_digital_pct = float(user.custom_remise_numerique_pct)
        if getattr(user, 'custom_remise_papier_pct', None) is not None:
            author_paper_pct = float(user.custom_remise_papier_pct)
        if getattr(user, 'custom_remise_audio_pct', None) is not None:
            author_audio_pct = float(user.custom_remise_audio_pct)

    rate_map = {
        "wholesaler": (
            float(config.remise_grossiste_numerique_pct),
            float(config.remise_grossiste_papier_pct),
            0.0,
        ),
        "author": (
            author_digital_pct,
            author_paper_pct,
            author_audio_pct,
        ),
        "university": (
            float(config.remise_campus_numerique_pct),
            float(config.remise_campus_papier_pct),
            0.0,
        ),
        "public": (0.0, 0.0, 0.0),
    }

    digital_pct, paper_pct, audio_pct = rate_map.get(role, (0.0, 0.0, 0.0))

    digital_price = round(public_digital * (1 - digital_pct / 100), 2)
    paper_price = round(public_paper * (1 - paper_pct / 100), 2)
    audio_price = round(public_audio * (1 - audio_pct / 100), 2)

    return {
        "digital_price": digital_price,
        "paper_price": paper_price,
        "audio_price": audio_price,
        "digital_discount_pct": digital_pct,
        "paper_discount_pct": paper_pct,
        "audio_discount_pct": audio_pct,
        "public_digital_price": public_digital,
        "public_paper_price": public_paper,
        "public_audio_price": public_audio,
    }
