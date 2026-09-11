"""Commande Django pour basculer automatiquement les commandes pending > 24h en abandoned."""
from django.core.management.base import BaseCommand
from apps.commerce.tasks import auto_mark_abandoned_orders

class Command(BaseCommand):
    help = "Bascule automatiquement les commandes non payées de plus de 24h vers le statut 'abandoned'"

    def add_arguments(self, parser):
        parser.add_argument(
            '--hours',
            type=int,
            default=24,
            help="Seuil en heures avant de considérer la commande comme abandonnée (défaut: 24)"
        )

    def handle(self, *args, **options):
        hours = options['hours']
        self.stdout.write(f"Vérification des commandes 'pending' datant de plus de {hours} heures...")
        count = auto_mark_abandoned_orders(hours_threshold=hours)
        self.stdout.write(self.style.SUCCESS(f"{count} commande(s) basculée(s) en 'abandoned'."))
