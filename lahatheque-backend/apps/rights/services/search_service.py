"""
Service de recherche plein texte hybride (PostgreSQL FTS + Substring/Trigramme)
pour les contrats légaux et la base documentaire de LAHAThèque.
Conçu pour la haute performance et le zéro ralentissement.
"""
import re
import logging
from typing import List, Dict, Any, Optional
from django.db.models import Q, QuerySet

logger = logging.getLogger(__name__)


def search_legal_contracts(
    queryset: QuerySet,
    search_query: str = "",
    party_type: str = "all",
    status_filter: str = "all",
    indexing_status: str = "all",
) -> QuerySet:
    """
    Filtre et classe un queryset de ContratLegal par pertinence plein texte.
    Combine PostgreSQL SearchRank avec un fallback par sous-chaînes pour les sigles et acronymes.
    """
    qs = queryset

    # 1. Filtre par type de partie
    if party_type and party_type != "all":
        qs = qs.filter(type_contrat=party_type)

    # 2. Filtre par statut juridique
    if status_filter and status_filter != "all":
        qs = qs.filter(status=status_filter)

    # 3. Filtre par état d'indexation
    if indexing_status and indexing_status != "all":
        qs = qs.filter(indexing_status=indexing_status)

    search_query = (search_query or "").strip()
    if not search_query:
        return qs.order_by("-created_at")

    # Cache 60s des résultats pour requêtes fréquentes
    from django.core.cache import cache
    import hashlib

    cache_key = f"fts_contracts_{hashlib.md5(f'{search_query.lower()}:{party_type}:{status_filter}:{indexing_status}'.encode()).hexdigest()}"
    cached_ids = cache.get(cache_key)
    if cached_ids is not None and isinstance(cached_ids, list):
        # Préservation de l'ordre de pertinence du cache
        from django.db.models import Case, When
        order_preserved = Case(*[When(id=pk, then=pos) for pos, pk in enumerate(cached_ids)])
        return qs.filter(id__in=cached_ids).order_by(order_preserved)

    # Tentative de recherche FTS PostgreSQL optimisée
    try:
        from django.contrib.postgres.search import SearchVector, SearchQuery, SearchRank

        vector = (
            SearchVector("titre", weight="A")
            + SearchVector("contracting_party", weight="A")
            + SearchVector("numero_contrat", weight="B")
            + SearchVector("texte_integral_index", weight="C")
        )
        pg_query = SearchQuery(search_query, config="french")

        # Recherche hybride : Match FTS OU Correspondance textuelle directe (pour acronymes / sigles / numéros)
        fts_matches = qs.annotate(rank=SearchRank(vector, pg_query)).filter(
            Q(rank__gte=0.01)
            | Q(texte_integral_index__icontains=search_query)
            | Q(contracting_party__icontains=search_query)
            | Q(numero_contrat__icontains=search_query)
            | Q(titre__icontains=search_query)
        ).order_by("-rank", "-created_at")

        # Sauvegarde en cache des 100 premiers identifiants pour 60 secondes
        try:
            ids_list = list(fts_matches.values_list("id", flat=True)[:100])
            cache.set(cache_key, ids_list, timeout=60)
        except Exception:
            pass

        return fts_matches

    except Exception as pg_err:
        logger.warning(f"[SearchService] Fallback FTS standard activé: {pg_err}")
        # Fallback pour SQLite ou si PostgreSQL FTS n'est pas disponible
        fallback_matches = qs.filter(
            Q(texte_integral_index__icontains=search_query)
            | Q(contracting_party__icontains=search_query)
            | Q(numero_contrat__icontains=search_query)
            | Q(titre__icontains=search_query)
            | Q(notes__icontains=search_query)
        ).order_by("-created_at")

        try:
            ids_list = list(fallback_matches.values_list("id", flat=True)[:100])
            cache.set(cache_key, ids_list, timeout=60)
        except Exception:
            pass

        return fallback_matches


def generate_snippet_highlight(text: str, search_query: str, max_chars: int = 240) -> str:
    """
    Extrait un snippet contextuel autour du mot-clé recherché
    avec mise en valeur HTML soignée (<mark> ou <strong>).
    """
    if not text or not search_query:
        return (text or "")[:max_chars]

    query_clean = search_query.strip()
    if not query_clean:
        return text[:max_chars]

    # Recherche de la première occurrence du mot
    pattern = re.compile(re.escape(query_clean), re.IGNORECASE)
    match = pattern.search(text)

    if not match:
        # Si le mot exact n'est pas trouvé, chercher les mots individuels
        words = query_clean.split()
        for w in words:
            if len(w) >= 3:
                sub_match = re.search(re.escape(w), text, re.IGNORECASE)
                if sub_match:
                    match = sub_match
                    break

    if not match:
        return text[:max_chars].strip() + ("..." if len(text) > max_chars else "")

    start_idx = max(0, match.start() - 80)
    end_idx = min(len(text), match.end() + 140)

    prefix = "..." if start_idx > 0 else ""
    suffix = "..." if end_idx < len(text) else ""

    snippet_raw = text[start_idx:end_idx].strip()
    # Mise en valeur des termes
    snippet_highlighted = pattern.sub(
        lambda m: f"<strong class='text-gold font-bold'>{m.group(0)}</strong>",
        snippet_raw
    )

    return f"{prefix} {snippet_highlighted} {suffix}".strip()
