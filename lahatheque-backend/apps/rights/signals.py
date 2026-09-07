"""
Signaux Django pour la garantie automatique et permanente des droits d'auteur.
Dès qu'un contrat, une clé de répartition ou un ouvrage est sauvegardé,
les liaisons AuthorRight et BookAuthor.user sont synchronisées automatiquement.
"""
from django.db.models.signals import post_save
from django.dispatch import receiver
from apps.rights.models import ContratLegal, RepartitionDroits
from apps.catalog.models import Ouvrage, BookAuthor
from apps.rights.services.reconciliation_service import (
    reconcile_author_rights_for_ouvrage,
    reconcile_author_rights_for_author,
)


@receiver(post_save, sender=ContratLegal)
def on_contrat_saved(sender, instance, created, **kwargs):
    """
    Dès qu'un contrat légal est enregistré ou modifié,
    synchronise immédiatement les droits de l'ouvrage associé.
    """
    if instance.ouvrage:
        reconcile_author_rights_for_ouvrage(instance.ouvrage)
    if instance.signataire_user:
        reconcile_author_rights_for_author(instance.signataire_user)


@receiver(post_save, sender=RepartitionDroits)
def on_repartition_saved(sender, instance, created, **kwargs):
    """
    Dès qu'une clé de répartition de droits est enregistrée ou modifiée,
    synchronise immédiatement les AuthorRight.
    """
    if instance.ouvrage:
        reconcile_author_rights_for_ouvrage(instance.ouvrage)
    if instance.beneficiaire:
        reconcile_author_rights_for_author(instance.beneficiaire)


@receiver(post_save, sender=Ouvrage)
def on_ouvrage_saved(sender, instance, created, **kwargs):
    """
    Dès qu'un ouvrage passe en validation juridique ou est publié,
    garantit que tous ses auteurs ont leur AuthorRight.
    """
    if instance.status in ['published', 'pending_legal_approval']:
        reconcile_author_rights_for_ouvrage(instance)


@receiver(post_save, sender=BookAuthor)
def on_book_author_saved(sender, instance, created, **kwargs):
    """
    Dès qu'un BookAuthor est enregistré ou rattaché à un utilisateur,
    synchronise tous les ouvrages auxquels il est lié.
    """
    for o in instance.ouvrages.all():
        reconcile_author_rights_for_ouvrage(o)
