"""
Commande de configuration des 11 catégories officielles LAHAThèque :
1. Crée ou met à jour les 11 catégories avec leur code Dewey et description.
2. Désactive (is_active = False) toutes les autres disciplines existantes en base de données.
"""

from django.core.management.base import BaseCommand
from apps.catalog.models import Discipline


OFFICIAL_CATEGORIES = [
    {
        "name": "Sciences agricoles",
        "code_dewey": "630",
        "description": "Agronomie, productions végétales et animales, agroéconomie, sylviculture, pédologie et agroécologie.",
    },
    {
        "name": "Sciences juridiques",
        "code_dewey": "340",
        "description": "Droit privé, droit public, droit international, sciences criminelles, droit des affaires et législation comparée.",
    },
    {
        "name": "Gastronomie, hôtellerie et tourisme",
        "code_dewey": "641",
        "description": "Arts culinaires, gestion hôtelière, tourisme durable, restauration et valorisation du patrimoine gastronomique.",
    },
    {
        "name": "Histoire, géographie et patrimoine",
        "code_dewey": "900",
        "description": "Histoire générale et africaine, géographie, archéologie, muséologie et préservation du patrimoine matériel et immatériel.",
    },
    {
        "name": "Langues et linguistique",
        "code_dewey": "400",
        "description": "Linguistique générale et appliquée, langues nationales africaines, langues internationales, sociolinguistique et traduction.",
    },
    {
        "name": "Littérature, arts et culture",
        "code_dewey": "800",
        "description": "Romans, poésie, théâtre, essais littéraires, beaux-arts, musique, cinéma, arts vivants et études culturelles.",
    },
    {
        "name": "Sciences de la santé",
        "code_dewey": "610",
        "description": "Médecine humaine, pharmacie, santé publique, odontologie, épidémiologie, neurosciences et soins infirmiers.",
    },
    {
        "name": "Sciences fondamentales",
        "code_dewey": "500",
        "description": "Mathématiques, physique fondamentale, chimie, biologie cellulaire et moléculaire, sciences de la terre et de l'univers.",
    },
    {
        "name": "Sciences humaines et sociales",
        "code_dewey": "300",
        "description": "Sociologie, anthropologie, psychologie, philosophie, sciences de l'éducation, sciences politiques et communication.",
    },
    {
        "name": "Sciences technologiques et ingénierie",
        "code_dewey": "620",
        "description": "Informatique, génie civil, télécommunications, génie électrique, mécanique, énergétique et intelligence artificielle.",
    },
    {
        "name": "Économie, gestion et commerce",
        "code_dewey": "330",
        "description": "Microéconomie, macroéconomie, finance d'entreprise, comptabilité (SYSCOHADA), management, marketing et commerce international.",
    },
]


class Command(BaseCommand):
    help = "Initialise les 11 catégories officielles LAHAThèque et désactive toutes les autres."

    def handle(self, *args, **options):
        official_names = [cat["name"] for cat in OFFICIAL_CATEGORIES]

        self.stdout.write(self.style.NOTICE("Initialisation des 11 catégories officielles LAHAThèque..."))

        created_count = 0
        updated_count = 0
        for cat in OFFICIAL_CATEGORIES:
            obj, created = Discipline.objects.get_or_create(
                name=cat["name"],
                defaults={
                    "code_dewey": cat["code_dewey"],
                    "description": cat["description"],
                    "is_active": True,
                }
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"  + Créée : {cat['name']} (Dewey {cat['code_dewey']})"))
            else:
                obj.code_dewey = cat["code_dewey"]
                obj.description = cat["description"]
                obj.is_active = True
                obj.save(update_fields=["code_dewey", "description", "is_active"])
                updated_count += 1
                self.stdout.write(self.style.SUCCESS(f"  * Réactivée / Mise à jour : {cat['name']} (Dewey {cat['code_dewey']})"))

        # Désactivation de toutes les autres disciplines existantes
        deactivated = (
            Discipline.objects
            .exclude(name__in=official_names)
            .filter(is_active=True)
            .update(is_active=False)
        )

        active_count = Discipline.objects.filter(is_active=True).count()
        inactive_count = Discipline.objects.filter(is_active=False).count()

        self.stdout.write(self.style.SUCCESS(
            f"\nTerminé avec succès :\n"
            f" - {created_count} catégorie(s) créée(s)\n"
            f" - {updated_count} catégorie(s) réactivée(s)\n"
            f" - {deactivated} ancienne(s) catégorie(s) désactivée(s)\n"
            f"Total actif : {active_count} | Total inactif : {inactive_count}"
        ))
