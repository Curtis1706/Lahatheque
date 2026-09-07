"""
Service de réconciliation automatique et permanente des droits d'auteur (AuthorRight).
Garantit le rattachement systématique entre Ouvrage, BookAuthor, ContratLegal, RepartitionDroits et User.
"""
import logging
from django.db import models

logger = logging.getLogger(__name__)


def reconcile_author_rights_for_ouvrage(ouvrage):
    """
    Réconcilie et consolide automatiquement tous les droits d'auteur pour un ouvrage donné.
    Crée les AuthorRight manquants, lie les BookAuthor aux User réels, et vérifie RoyaltyRate.
    """
    if not ouvrage:
        return

    try:
        from apps.rights.models import AuthorRight, ContratLegal, RepartitionDroits, RoyaltyRate
        from apps.accounts.models import User
        from apps.catalog.models import BookAuthor

        # 1. Rattachement BookAuthor -> User via nom/prénom ou email si manquant
        for ba in ouvrage.authors.all():
            if not ba.user and (ba.first_name or ba.last_name):
                matched_user = User.objects.filter(
                    role='author',
                    first_name__iexact=ba.first_name.strip(),
                    last_name__iexact=ba.last_name.strip()
                ).first()
                if not matched_user and ba.email:
                    matched_user = User.objects.filter(email__iexact=ba.email.strip()).first()
                if matched_user:
                    ba.user = matched_user
                    ba.save(update_fields=['user'])

            if ba.user:
                AuthorRight.objects.get_or_create(
                    ouvrage=ouvrage,
                    user=ba.user,
                    defaults={
                        'author': ba,
                        'role': 'auteur_principal',
                        'pool_share_percent': 100.0,
                    }
                )

        # 2. Consolidation via ContratLegal
        contrats = ContratLegal.objects.filter(ouvrage=ouvrage)
        for c in contrats:
            signataire = c.signataire_user
            if not signataire and c.contracting_party_email:
                signataire = User.objects.filter(email__iexact=c.contracting_party_email.strip()).first()
            if not signataire and c.contracting_party:
                parts = c.contracting_party.strip().split()
                if len(parts) >= 2:
                    signataire = User.objects.filter(
                        role='author',
                        first_name__iexact=parts[0],
                        last_name__iexact=" ".join(parts[1:])
                    ).first()

            if signataire:
                ba = ouvrage.authors.filter(
                    models.Q(user=signataire) |
                    models.Q(first_name__iexact=signataire.first_name, last_name__iexact=signataire.last_name)
                ).first()
                if ba and not ba.user:
                    ba.user = signataire
                    ba.save(update_fields=['user'])

                AuthorRight.objects.get_or_create(
                    ouvrage=ouvrage,
                    user=signataire,
                    defaults={
                        'author': ba,
                        'role': 'auteur_principal',
                        'pool_share_percent': 100.0,
                    }
                )

        # 3. Consolidation via RepartitionDroits
        repartitions = RepartitionDroits.objects.filter(ouvrage=ouvrage).select_related('beneficiaire')
        for rep in repartitions:
            if rep.beneficiaire:
                ba = ouvrage.authors.filter(
                    models.Q(user=rep.beneficiaire) |
                    models.Q(first_name__iexact=rep.beneficiaire.first_name, last_name__iexact=rep.beneficiaire.last_name)
                ).first()
                if ba and not ba.user:
                    ba.user = rep.beneficiaire
                    ba.save(update_fields=['user'])

                AuthorRight.objects.get_or_create(
                    ouvrage=ouvrage,
                    user=rep.beneficiaire,
                    defaults={
                        'author': ba,
                        'role': rep.role_libelle or 'auteur_principal',
                        'pool_share_percent': rep.pourcentage or 100.0,
                    }
                )

        # 4. Garantie de présence du RoyaltyRate
        if not RoyaltyRate.objects.filter(ouvrage=ouvrage).exists():
            RoyaltyRate.objects.create(
                ouvrage=ouvrage,
                author_share_percent=15.00,
                publisher_share_percent=0.00,
                platform_share_percent=85.00,
            )

    except Exception as exc:
        logger.warning(f"[reconcile_author_rights_for_ouvrage] Erreur sur ouvrage {getattr(ouvrage, 'id', None)}: {exc}")


def reconcile_author_rights_for_author(author):
    """
    Réconcilie et consolide automatiquement tous les droits pour un auteur utilisateur spécifique.
    """
    if not author or not getattr(author, 'id', None):
        return

    try:
        from apps.rights.models import ContratLegal, RepartitionDroits
        from apps.catalog.models import Ouvrage

        # Ouvrages par contrats
        contrat_ouvrages = Ouvrage.objects.filter(
            contrats__in=ContratLegal.objects.filter(
                models.Q(signataire_user=author) | models.Q(contracting_party_email__iexact=author.email)
            )
        )
        for o in contrat_ouvrages:
            reconcile_author_rights_for_ouvrage(o)

        # Ouvrages par répartition
        repart_ouvrages = Ouvrage.objects.filter(
            repartitions_droits__in=RepartitionDroits.objects.filter(beneficiaire=author)
        )
        for o in repart_ouvrages:
            reconcile_author_rights_for_ouvrage(o)

        # Ouvrages par auteurs
        authored_ouvrages = Ouvrage.objects.filter(
            models.Q(authors__user=author) |
            (models.Q(authors__first_name__iexact=author.first_name) & models.Q(authors__last_name__iexact=author.last_name))
        )
        for o in authored_ouvrages:
            reconcile_author_rights_for_ouvrage(o)

    except Exception as exc:
        logger.warning(f"[reconcile_author_rights_for_author] Erreur sur auteur {getattr(author, 'id', None)}: {exc}")
