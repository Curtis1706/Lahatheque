"""
Commande de réattribution des livres aux 11 catégories officielles LAHAThèque par IA :
1. Identifie tous les livres associés à une discipline inactive (ou tous les livres si --all).
2. Analyse par lots chaque ouvrage via OpenAI gpt-4o-mini (titre, sous-titre, résumé, mots-clés, ancienne discipline).
3. Affecte la nouvelle discipline active principale (Foreign Key).
4. Nettoie les disciplines ManyToMany pour ne conserver que les catégories actives pertinentes.
5. Invalide le cache du catalogue.

Zéro emoji, typage Python strict, gestion des exceptions et mode simulation (--dry-run).
"""

import json
import time
from typing import Any, Dict, List, Optional
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import transaction
from django.db.models import Q
from apps.catalog.models import Ouvrage, Discipline
from apps.catalog.views import invalidate_catalog_cache


OFFICIAL_CATEGORIES_NAMES = [
    "Sciences agricoles",
    "Sciences juridiques",
    "Gastronomie, hôtellerie et tourisme",
    "Histoire, géographie et patrimoine",
    "Langues et linguistique",
    "Littérature, arts et culture",
    "Sciences de la santé",
    "Sciences fondamentales",
    "Sciences humaines et sociales",
    "Sciences technologiques et ingénierie",
    "Économie, gestion et commerce",
]

CATEGORIES_DESCRIPTIONS = {
    "Sciences agricoles": "Agronomie, productions végétales et animales, agroéconomie, sylviculture, pédologie, élevage, pêche et agroécologie.",
    "Sciences juridiques": "Droit privé, droit public, droit international, sciences criminelles, droit des affaires, droit constitutionnel, administratif, pénal et civil.",
    "Gastronomie, hôtellerie et tourisme": "Arts culinaires, hôtellerie, tourisme durable, restauration, œnologie et valorisation du patrimoine gastronomique.",
    "Histoire, géographie et patrimoine": "Histoire générale et africaine, géographie, archéologie, muséologie, cartographie et préservation du patrimoine.",
    "Langues et linguistique": "Linguistique générale et appliquée, langues nationales africaines, langues internationales, traduction et sociolinguistique.",
    "Littérature, arts et culture": "Romans, poésie, théâtre, essais littéraires, beaux-arts, musique, cinéma, arts vivants et études culturelles.",
    "Sciences de la santé": "Médecine humaine, chirurgie, pédiatrie, neurosciences, pharmacie, santé publique, odontologie, épidémiologie et soins infirmiers.",
    "Sciences fondamentales": "Mathématiques, physique fondamentale, chimie, biologie cellulaire et moléculaire, génétique, sciences de la terre et de l'univers.",
    "Sciences humaines et sociales": "Sociologie, anthropologie, psychologie, philosophie, sciences de l'éducation, sciences politiques et communication.",
    "Sciences technologiques et ingénierie": "Informatique, génie civil, télécommunications, génie électrique, mécanique, énergétique, robotique et intelligence artificielle.",
    "Économie, gestion et commerce": "Microéconomie, macroéconomie, finance d'entreprise, comptabilité (SYSCOHADA), management, marketing, commerce international et fintech.",
}


class Command(BaseCommand):
    help = "Réattribue par IA les livres du catalogue vers les 11 catégories officielles LAHAThèque."

    def add_arguments(self, parser):
        parser.add_argument(
            "--all",
            action="store_true",
            help="Réanalyser et réattribuer l'intégralité des livres, même ceux ayant déjà une discipline active.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=0,
            help="Nombre maximal d'ouvrages à traiter (0 pour aucun plafond).",
        )
        parser.add_argument(
            "--batch-size",
            type=int,
            default=25,
            help="Taille des lots transmis à l'IA pour classification (défaut : 25).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simuler la classification sans modifier la base de données.",
        )

    def handle(self, *args, **options):
        process_all = options["all"]
        limit = options["limit"]
        batch_size = options["batch_size"]
        dry_run = options["dry_run"]

        self.stdout.write(self.style.NOTICE("Demarrage de la classification par IA des ouvrages LAHATheque..."))
        if dry_run:
            self.stdout.write(self.style.WARNING("Mode simulation active (DRY-RUN) : aucune ecriture en base."))

        # 1. Chargement du dictionnaire des 11 disciplines actives
        active_disciplines_map: Dict[str, Discipline] = {}
        for d in Discipline.objects.filter(is_active=True):
            active_disciplines_map[d.name.strip().lower()] = d

        if len(active_disciplines_map) < 11:
            self.stdout.write(self.style.ERROR(
                f"Erreur : Seulement {len(active_disciplines_map)} disciplines actives trouvees. "
                f"Veuillez executer 'python manage.py setup_official_disciplines' d'abord."
            ))
            return

        # 2. Identification des ouvrages a traiter
        qs = (
            Ouvrage.objects
            .select_related("discipline")
            .prefetch_related("disciplines")
            .order_by("created_at")
        )

        if not process_all:
            # Traiter les livres dont la discipline est nulle OU inactive
            qs = qs.filter(Q(discipline__isnull=True) | Q(discipline__is_active=False))

        total_to_process = qs.count()
        if limit > 0:
            total_to_process = min(total_to_process, limit)
            qs = qs[:limit]

        self.stdout.write(self.style.NOTICE(
            f"Ouvrages a classifier : {total_to_process} "
            f"({'tous' if process_all else 'disciplines inactives/non renseignees'})"
        ))

        if total_to_process == 0:
            self.stdout.write(self.style.SUCCESS("Aucun ouvrage ne necessite de reclassification."))
            return

        # 3. Traitement par lots
        books_list = list(qs)
        processed_count = 0
        success_count = 0
        category_stats: Dict[str, int] = {cat: 0 for cat in OFFICIAL_CATEGORIES_NAMES}

        import openai
        api_key = getattr(settings, "OPENAI_API_KEY", None)
        if not api_key:
            self.stdout.write(self.style.ERROR("Erreur : OPENAI_API_KEY est introuvable dans les reglages."))
            return

        client = openai.OpenAI(api_key=api_key, timeout=45.0)

        for i in range(0, len(books_list), batch_size):
            batch = books_list[i:i + batch_size]
            self.stdout.write(f"\n--- Traitement du lot {i + 1} a {i + len(batch)} sur {total_to_process} ---")

            classifications = self._classify_batch_with_openai(client, batch)

            for book in batch:
                processed_count += 1
                book_id_str = str(book.id)
                classification = classifications.get(book_id_str)

                if not classification:
                    # Repli heuristique si le livre n'a pas ete retourne dans la reponse JSON
                    classification = self._heuristic_fallback(book)

                primary_name = classification.get("primary_category", "")
                secondary_names = classification.get("secondary_categories", [])

                target_discipline = self._resolve_discipline(primary_name, active_disciplines_map)
                if not target_discipline:
                    target_discipline = active_disciplines_map.get("sciences fondamentales")

                if not target_discipline:
                    self.stdout.write(self.style.ERROR(f"Impossible de resoudre la discipline pour '{book.title}'"))
                    continue

                category_stats[target_discipline.name] = category_stats.get(target_discipline.name, 0) + 1
                previous_disc_name = book.discipline.name if book.discipline else "Aucune"

                self.stdout.write(
                    f"[{processed_count}/{total_to_process}] {book.title[:45]}... : "
                    f"{previous_disc_name} -> {self.style.SUCCESS(target_discipline.name)}"
                )

                if not dry_run:
                    with transaction.atomic():
                        book.discipline = target_discipline

                        # Résolution des disciplines secondaires
                        valid_secondary: List[Discipline] = [target_discipline]
                        for sec_name in secondary_names:
                            sec_obj = self._resolve_discipline(sec_name, active_disciplines_map)
                            if sec_obj and sec_obj.id != target_discipline.id and sec_obj not in valid_secondary:
                                valid_secondary.append(sec_obj)

                        # Nettoyage des anciennes liaisons inactives et mise a jour ManyToMany
                        book.disciplines.set(valid_secondary)
                        book.save(update_fields=["discipline", "updated_at"])

                success_count += 1

            # Pause courte entre les lots pour respecter les quotas de frequence API
            time.sleep(0.5)

        if not dry_run:
            try:
                invalidate_catalog_cache()
                self.stdout.write(self.style.SUCCESS("Cache du catalogue invalide avec succes."))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"Avertissement lors de l'invalidation du cache : {e}"))

        # 4. Rapport de synthese
        self.stdout.write(self.style.SUCCESS(
            f"\n=== Reclassification terminee ===\n"
            f"Ouvrages traites : {processed_count}\n"
            f"Ouvrages reclassifies : {success_count}\n"
            f"\nRepartition par categorie officielle :"
        ))
        for cat_name, count in sorted(category_stats.items(), key=lambda x: x[1], reverse=True):
            self.stdout.write(f" - {cat_name} : {count} livre(s)")

    def _classify_batch_with_openai(
        self, client: Any, batch: List[Ouvrage]
    ) -> Dict[str, Dict[str, Any]]:
        """Transmet un lot d'ouvrages a OpenAI gpt-4o-mini pour classification structuree."""
        categories_guide = "\n".join([
            f"- {name} : {desc}"
            for name, desc in CATEGORIES_DESCRIPTIONS.items()
        ])

        books_data = []
        for b in batch:
            prev_disc = b.discipline.name if b.discipline else ""
            summary_snip = (b.summary or "")[:350].strip()
            kw_snip = ", ".join(b.keywords[:6]) if isinstance(b.keywords, list) else ""
            books_data.append({
                "id": str(b.id),
                "title": b.title,
                "subtitle": b.subtitle or "",
                "previous_category": prev_disc,
                "summary": summary_snip,
                "keywords": kw_snip,
            })

        system_prompt = (
            "Tu es le bibliothécaire en chef et conservateur scientifique de la LAHAThèque. "
            "Ton rôle est d'attribuer avec une rigueur absolue à chaque livre sa catégorie académique "
            "parmi STRICTEMENT les 11 catégories officielles suivantes. "
            "Tu réponds exclusivement en JSON valide."
        )

        user_prompt = f"""Voici les 11 CATEGORIES OFFICIELLES de la LAHAThèque et leurs définitions :
{categories_guide}

Analyse la liste des {len(books_data)} livres ci-dessous et attribue à chacun :
1. "primary_category" : La catégorie officielle principale exacte parmi les 11.
2. "secondary_categories" : Tableau de 0 à 2 catégories secondaires pertinentes parmi les 11.

RÈGLE ABSOLUE : Les noms de catégories doivent correspondre STRICTEMENT, caractère pour caractère, aux 11 catégories ci-dessus.

Liste des livres à classifier :
{json.dumps(books_data, ensure_ascii=False, indent=2)}

Format de réponse JSON attendu :
{{
  "classifications": [
    {{
      "book_id": "identifiant_uuid",
      "primary_category": "Nom exact parmi les 11",
      "secondary_categories": ["Nom exact parmi les 11"]
    }}
  ]
}}
"""

        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.1,
                max_tokens=2500,
                timeout=45.0,
            )
            raw_text = response.choices[0].message.content or "{}"
            data = json.loads(raw_text)
            items = data.get("classifications", [])
            return {item.get("book_id"): item for item in items if isinstance(item, dict) and "book_id" in item}
        except Exception as err:
            self.stdout.write(self.style.WARNING(f"Avertissement appel OpenAI pour le lot : {err} -> Repli heuristique"))
            return {}

    def _resolve_discipline(self, name: str, active_map: Dict[str, Discipline]) -> Optional[Discipline]:
        """Résout le nom de discipline vers l'objet Discipline actif correspondant."""
        if not name:
            return None
        cleaned = name.strip().lower()
        if cleaned in active_map:
            return active_map[cleaned]

        for official_clean, obj in active_map.items():
            if official_clean in cleaned or cleaned in official_clean:
                return obj

        return None

    def _heuristic_fallback(self, book: Ouvrage) -> Dict[str, Any]:
        """Repli heuristique base sur les mots-cles, titre et ancienne categorie."""
        text = f"{book.title} {book.subtitle or ''} {book.summary or ''}".lower()
        prev = (book.discipline.name if book.discipline else "").lower()

        if any(w in text or w in prev for w in ["droit", "jurid", "loi", "constitution", "peine", "tribunal", "avocat", "penal", "justice", "notaire"]):
            return {"primary_category": "Sciences juridiques", "secondary_categories": []}
        if any(w in text or w in prev for w in ["agricol", "agronom", "plante", "recolte", "foret", "elevage", "sol", "peche", "semence", "riz", "cacao"]):
            return {"primary_category": "Sciences agricoles", "secondary_categories": []}
        if any(w in text or w in prev for w in ["sante", "medecin", "chirurg", "pediatr", "maladi", "cliniqu", "pharmaci", "tumeur", "biomedic", "neurolog"]):
            return {"primary_category": "Sciences de la santé", "secondary_categories": []}
        if any(w in text or w in prev for w in ["econom", "financ", "comptab", "gestion", "fiscal", "banque", "monnaie", "marche", "commerce", "management"]):
            return {"primary_category": "Économie, gestion et commerce", "secondary_categories": []}
        if any(w in text or w in prev for w in ["informatiq", "logiciel", "technolog", "ingenieur", "algorith", "reseau", "electron", "mecaniqu", "systeme", "controller"]):
            return {"primary_category": "Sciences technologiques et ingénierie", "secondary_categories": []}
        if any(w in text or w in prev for w in ["histoire", "geograph", "patrimoin", "archeolog", "territoire", "spatial", "siecle", "monument"]):
            return {"primary_category": "Histoire, géographie et patrimoine", "secondary_categories": []}
        if any(w in text or w in prev for w in ["linguist", "langue", "grammair", "traduct", "lexiq", "anglais", "francais", "yoruba", "fon"]):
            return {"primary_category": "Langues et linguistique", "secondary_categories": []}
        if any(w in text or w in prev for w in ["roman", "poesie", "theatre", "litterat", "recueil", "nouvelle", "conte", "art", "musique", "cinema"]):
            return {"primary_category": "Littérature, arts et culture", "secondary_categories": []}
        if any(w in text or w in prev for w in ["gastronom", "hotel", "touris", "cuisin", "restaurat", "recette", "culinaire"]):
            return {"primary_category": "Gastronomie, hôtellerie et tourisme", "secondary_categories": []}
        if any(w in text or w in prev for w in ["sociolog", "anthropolog", "psycholog", "philosoph", "education", "pedagog", "politique", "social"]):
            return {"primary_category": "Sciences humaines et sociales", "secondary_categories": []}

        return {"primary_category": "Sciences fondamentales", "secondary_categories": []}
