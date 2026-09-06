"""
Service unifié de contrôle d'accès aux ouvrages et abonnements (AccessService).
Point d'entrée unique pour la vérification des droits individuels et institutionnels.
"""
from django.conf import settings
from apps.commerce.models import LigneCommande, Subscription
from apps.partners.models import StudentAffiliation

class AccessService:
    @staticmethod
    def check_bouquet_access(institution, book_id):
        """
        Vérifie si book_id est inclus dans un bouquet actuellement souscrit et actif par
        cette institution. Retourne la UniversityBouquetSubscription correspondante si oui,
        None sinon. Ne débloque QUE les livres réellement dans le périmètre du bouquet.
        """
        from apps.partners.models import UniversityBouquetSubscription, BouquetOffering
        from django.utils import timezone

        today = timezone.now().date()
        active_subs = UniversityBouquetSubscription.objects.filter(
            institution=institution,
            status="active",
            start_date__lte=today,
            end_date__gte=today,
        )

        for sub in active_subs:
            if not sub.offering_id:
                continue
            try:
                offering = BouquetOffering.objects.get(id=sub.offering_id, is_active=True)
            except BouquetOffering.DoesNotExist:
                continue

            if offering.get_books_queryset(requesting_institution=institution).filter(id=book_id).exists():
                return sub

        return None

    @staticmethod
    def check_user_book_access(user, book_id) -> dict:
        """
        Vérifie si un utilisateur a le droit de consulter un ouvrage donné.
        Retourne un dictionnaire avec access_granted (bool), reason (str), et stream_url.
        """
        if not user or not user.is_authenticated:
            return {"access_granted": False, "reason": "unauthenticated"}

        # Privilèges administratifs & réviseurs légaux / éditoriaux / maquettistes de plateforme
        platform_roles = ['admin', 'super_admin', 'chief_layout', 'layout_artist', 'legal_reviewer']
        is_platform_admin = (
            user.is_superuser
            or user.is_staff
            or getattr(user, 'role', '') in platform_roles
            or getattr(settings, 'DEV_UNLOCK_ALL_BOOKS', False)
        )

        if is_platform_admin:
            return {
                "access_granted": True,
                "reason": "privilege_access" if (user.is_superuser or user.is_staff) else "development_access",
                "stream_url": f"/api/v1/catalog/books/{book_id}/stream/"
            }

        # Auteur de cet ouvrage spécifique
        if getattr(user, 'role', '') == 'author':
            from apps.catalog.models import Ouvrage
            from django.db.models import Q
            is_own_book = Ouvrage.objects.filter(id=book_id).filter(
                Q(authors__user=user) | Q(created_by=user)
            ).exists()
            if is_own_book:
                return {
                    "access_granted": True,
                    "reason": "author_own_book",
                    "stream_url": f"/api/v1/catalog/books/{book_id}/stream/"
                }

        # Éditeur de cet ouvrage spécifique
        if getattr(user, 'role', '') == 'publisher':
            from apps.catalog.models import Ouvrage
            is_own_published = Ouvrage.objects.filter(id=book_id, publisher__user=user).exists()
            if is_own_published:
                return {
                    "access_granted": True,
                    "reason": "publisher_own_book",
                    "stream_url": f"/api/v1/catalog/books/{book_id}/stream/"
                }

        # Achat individuel payé ou achat à crédit accordé
        from django.db.models import Q
        has_purchased = LigneCommande.objects.filter(
            commande__user=user,
            ouvrage_id=book_id
        ).filter(
            Q(commande__statut_paiement='paid') | Q(commande__is_credit_purchase=True)
        ).exists()

        if has_purchased:
            return {
                "access_granted": True,
                "reason": "individual_purchase",
                "stream_url": f"/api/v1/catalog/books/{book_id}/stream/"
            }

        # Abonnement individuel actif
        has_subscription = Subscription.objects.filter(
            user=user,
            is_active=True
        ).exists()

        if has_subscription:
            return {
                "access_granted": True,
                "reason": "active_subscription",
                "stream_url": f"/api/v1/catalog/books/{book_id}/stream/"
            }

        # Bouquet souscrit directement par le Client (conforme CDC section 8)
        from apps.commerce.models import ClientBouquetSubscription
        from apps.partners.models import BouquetOffering
        from django.utils import timezone as tz

        today = tz.now().date()
        client_bouquets = ClientBouquetSubscription.objects.filter(
            user=user, status="active", start_date__lte=today, end_date__gte=today
        )
        for sub in client_bouquets:
            try:
                offering = BouquetOffering.objects.get(id=sub.offering_id, is_active=True)
            except BouquetOffering.DoesNotExist:
                continue
            if offering.get_books_queryset().filter(id=book_id).exists():
                return {
                    "access_granted": True,
                    "reason": "client_bouquet_subscription",
                    "stream_url": f"/api/v1/catalog/books/{book_id}/stream/"
                }

        # Abonnement institutionnel (UAC, UNA, etc.)
        student_aff = StudentAffiliation.objects.filter(student=user, is_validated=True).first()
        if student_aff and student_aff.institution:
            has_inst_sub = Subscription.objects.filter(
                institution=student_aff.institution,
                is_active=True
            ).exists()
            if has_inst_sub:
                return {
                    "access_granted": True,
                    "reason": "institutional_subscription",
                    "institution_name": student_aff.institution.name,
                    "stream_url": f"/api/v1/catalog/books/{book_id}/stream/"
                }

            # Accès via bouquet souscrit par l'université — DÉSACTIVÉ pour rester strictement
            # conforme au CDC v3.2 (le Client souscrit directement aux bouquets, section 8,
            # sans validation d'affiliation intermédiaire). Réactivable en repassant
            # ENABLE_UNIVERSITY_AFFILIATION_GATING à True dans les settings — le code métier
            # ci-dessous n'a pas besoin d'être réécrit.
            from django.conf import settings as django_settings
            if getattr(django_settings, "ENABLE_UNIVERSITY_AFFILIATION_GATING", False):
                bouquet_access = AccessService.check_bouquet_access(student_aff.institution, book_id)
                if bouquet_access:
                    return {
                        "access_granted": True,
                        "reason": "bouquet_access",
                        "institution_name": student_aff.institution.name,
                        "bouquet_subscription_id": str(bouquet_access.id),
                        "stream_url": f"/api/v1/catalog/books/{book_id}/stream/"
                    }

        return {
            "access_granted": False,
            "reason": "no_active_access",
            "error": "Achat ou abonnement requis pour consulter cet ouvrage."
        }

    @staticmethod
    def get_user_institutional_access(user) -> dict:
        """
        Détermine si un étudiant possède un accès institutionnel actif via son établissement.
        """
        if not user or not user.is_authenticated:
            return {"has_access": False, "institution_name": None}

        student_aff = StudentAffiliation.objects.filter(student=user, is_validated=True).first()
        if student_aff and student_aff.institution:
            inst_sub = Subscription.objects.filter(
                institution=student_aff.institution,
                is_active=True
            ).first()
            if inst_sub:
                return {
                    "has_access": True,
                    "institution_name": student_aff.institution.name,
                    "subscription_id": str(inst_sub.id)
                }

        return {"has_access": False, "institution_name": None}
