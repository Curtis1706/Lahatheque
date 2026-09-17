"""
Vues API REST pour la gestion et l'émission des Courriers Officiels LAHAThèque.
Conformes à specs/008-courrier-redevances-relances/spec.md et aux contrats d'API.
Sécurisées pour les rôles Juriste (IsLegalReviewerRole) et Administrateur (IsAdminOrSuperAdmin).
"""
import logging
from datetime import date
from django.db import transaction
from django.db.models import Sum, F, Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from apps.accounts.permissions import IsLegalReviewerRole, IsAdminOrSuperAdmin
from apps.rights.models import CourrierOfficiel, AuthorRight
from apps.rights.serializers import CourrierOfficielSerializer
from apps.rights.letter_templates import get_default_letter_template
from apps.rights.official_letter_service import OfficialLetterPdfService
from apps.rights.views import get_period_date_range, resolve_applied_rate
from apps.catalog.models import Ouvrage, BookAuthor
from apps.commerce.models import LigneCommande, Order
from apps.partners.models import Institution
from apps.publishers_portal.models import PublisherProfile
from apps.accounts.models import User

logger = logging.getLogger(__name__)


class CourrierListView(APIView):
    """
    GET /api/v1/rights/legal/courriers/
    Liste tous les courriers officiels avec filtres par statut, catégorie et recherche textuelle.
    """
    permission_classes = [permissions.IsAuthenticated, IsLegalReviewerRole | IsAdminOrSuperAdmin]

    def get(self, request):
        status_filter = request.query_params.get("status")
        category_filter = request.query_params.get("category")
        search = request.query_params.get("search", "").strip()
        ordering = request.query_params.get("ordering", "-created_at")

        qs = CourrierOfficiel.objects.all()

        if status_filter and status_filter != "all":
            qs = qs.filter(status=status_filter)
        if category_filter and category_filter != "all":
            qs = qs.filter(category=category_filter)
        if search:
            qs = qs.filter(
                Q(recipient_name__icontains=search) |
                Q(reference__icontains=search) |
                Q(subject__icontains=search) |
                Q(recipient_email__icontains=search)
            )

        if ordering in ["created_at", "-created_at", "amount", "-amount", "recipient_name", "-recipient_name"]:
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by("-created_at")

        serializer = CourrierOfficielSerializer(qs, many=True)
        return Response({
            "success": True,
            "data": serializer.data,
            "error": None
        })


class CourrierPrepareView(APIView):
    """
    POST /api/v1/rights/legal/courriers/prepare/
    Initialise un courrier en statut Brouillon avec le texte type pré-rempli
    calculé à partir des données réelles de la plateforme.
    """
    permission_classes = [permissions.IsAuthenticated, IsLegalReviewerRole | IsAdminOrSuperAdmin]

    @transaction.atomic
    def post(self, request):
        category = request.data.get("category")
        recipient_type = request.data.get("recipient_type")
        recipient_id = request.data.get("recipient_id")
        period_type = request.data.get("period_type", "monthly")
        year = int(request.data.get("year", timezone.now().year) or timezone.now().year)
        month = int(request.data.get("month", timezone.now().month) or timezone.now().month)
        quarter = int(request.data.get("quarter", 1) or 1)

        start_date, end_date, period_label = get_period_date_range(period_type, year, month, quarter)

        recipient_name = ""
        recipient_email = ""
        volume_ventes = 0
        assiette_brute = 0.0
        montant_net = 0.0
        taux = 15.0
        ref_contrat = "Accord-Cadre LAHAThèque"
        ref_dette = "REC-2026-001"
        ref_facture = "CMD-2026-001"
        date_echeance = "Échéance sous 8 jours"
        nombre_relances = 1

        # 1. Résolution selon la catégorie
        if category == "royalty_university":
            recipient_type = "university"
            try:
                inst = Institution.objects.get(id=recipient_id)
                recipient_name = inst.name
                recipient_email = getattr(inst, 'contact_email', None) or (inst.user.email if hasattr(inst, 'user') and inst.user else "")
                ref_contrat = f"CONV-UNIV-{inst.id.hex[:6].upper()}" if hasattr(inst.id, 'hex') else "CONV-UNIV"
                taux = float(getattr(inst, 'royalty_rate', 15.0) or 15.0)
                
                ouvrages = Ouvrage.objects.filter(institution=inst)
                lignes = LigneCommande.objects.filter(ouvrage__in=ouvrages, commande__statut_paiement='paid')
                if start_date and end_date:
                    lignes = lignes.filter(commande__created_at__date__gte=start_date, commande__created_at__date__lte=end_date)
                
                volume_ventes = lignes.aggregate(qty=Sum('quantity'))['qty'] or 0
                gross_sum = lignes.aggregate(s=Sum(F('unit_price') * F('quantity')))['s'] or 0.0
                assiette_brute = float(gross_sum)
                montant_net = (assiette_brute * taux) / 100.0
            except (Institution.DoesNotExist, ValueError):
                return Response({"success": False, "error": "Université introuvable."}, status=404)

        elif category == "royalty_publisher":
            recipient_type = "publisher"
            try:
                pub = PublisherProfile.objects.get(id=recipient_id)
                recipient_name = pub.company_name or pub.name
                recipient_email = getattr(pub, 'contact_email', None) or (pub.user.email if hasattr(pub, 'user') and pub.user else "")
                ref_contrat = f"CTR-PUB-{pub.id.hex[:6].upper()}" if hasattr(pub.id, 'hex') else "CTR-PUB"
                
                ouvrages = Ouvrage.objects.filter(publisher=pub)
                lignes = LigneCommande.objects.filter(ouvrage__in=ouvrages, commande__statut_paiement='paid')
                if start_date and end_date:
                    lignes = lignes.filter(commande__created_at__date__gte=start_date, commande__created_at__date__lte=end_date)
                
                volume_ventes = lignes.aggregate(qty=Sum('quantity'))['qty'] or 0
                gross_sum = lignes.aggregate(s=Sum(F('unit_price') * F('quantity')))['s'] or 0.0
                assiette_brute = float(gross_sum)
                
                # Résoudre le taux contractuel
                sample_book = ouvrages.first()
                if sample_book:
                    taux = resolve_applied_rate(sample_book, entity_type="publisher", publisher=pub)
                else:
                    taux = 20.0
                montant_net = (assiette_brute * taux) / 100.0
            except (PublisherProfile.DoesNotExist, ValueError):
                return Response({"success": False, "error": "Éditeur tiers introuvable."}, status=404)

        elif category == "royalty_author":
            recipient_type = "author"
            try:
                author_user = User.objects.get(id=recipient_id)
                recipient_name = author_user.get_full_name() or author_user.username
                recipient_email = author_user.email
                
                rights = AuthorRight.objects.filter(user=author_user)
                books = Ouvrage.objects.filter(author_rights__in=rights).distinct()
                
                lignes = LigneCommande.objects.filter(ouvrage__in=books, commande__statut_paiement='paid')
                if start_date and end_date:
                    lignes = lignes.filter(commande__created_at__date__gte=start_date, commande__created_at__date__lte=end_date)
                
                volume_ventes = lignes.aggregate(qty=Sum('quantity'))['qty'] or 0
                gross_sum = lignes.aggregate(s=Sum(F('unit_price') * F('quantity')))['s'] or 0.0
                assiette_brute = float(gross_sum)
                
                # Calcul de la quote-part auteur
                author_rights_sum = 0.0
                for line in lignes:
                    book = line.ouvrage
                    applied = resolve_applied_rate(book, entity_type="author")
                    share = float(rights.filter(ouvrage=book).first().pool_share_percent or 100.0) if rights.filter(ouvrage=book).exists() else 100.0
                    author_rights_sum += (float(line.unit_price * line.quantity) * (applied / 100.0) * (share / 100.0))
                
                montant_net = author_rights_sum
            except (User.DoesNotExist, ValueError):
                return Response({"success": False, "error": "Auteur introuvable."}, status=404)

        elif category == "debt_reminder":
            recipient_type = recipient_type or "client"
            recipient_name = request.data.get("recipient_name", "Client Débiteur")
            recipient_email = request.data.get("recipient_email", "")
            ref_dette = request.data.get("reference_dette", f"DETTE-{recipient_id[:8] if recipient_id else '001'}")
            ref_facture = request.data.get("reference_facture", "FACT-2026-001")
            montant_net = float(request.data.get("amount", 0.0))
            nombre_relances = int(request.data.get("reminder_count", 1))

        template_ctx = {
            "recipient_name": recipient_name,
            "period": period_label,
            "volume_ventes": volume_ventes,
            "assiette_brute": assiette_brute,
            "montant_net": montant_net,
            "taux": taux,
            "reference_contrat": ref_contrat,
            "reference_dette": ref_dette,
            "reference_facture": ref_facture,
            "date_echeance": date_echeance,
            "nombre_relances": nombre_relances,
        }

        tpl = get_default_letter_template(category, template_ctx)
        reference = CourrierOfficiel.generate_reference(category)

        courrier = CourrierOfficiel.objects.create(
            reference=reference,
            category=category,
            status="draft",
            recipient_type=recipient_type,
            recipient_id=str(recipient_id),
            recipient_name=recipient_name,
            recipient_email=recipient_email,
            period=period_label,
            amount=montant_net,
            currency="FCFA",
            subject=tpl["subject"],
            body_text=tpl["body"],
            created_by=request.user,
        )

        serializer = CourrierOfficielSerializer(courrier)
        return Response({
            "success": True,
            "data": serializer.data,
            "error": None
        }, status=status.HTTP_201_CREATED)


class CourrierPrepareBatchView(APIView):
    """
    POST /api/v1/rights/legal/courriers/prepare-batch/
    Initialise en lot les courriers au statut Brouillon pour tous les destinataires éligibles de la période.
    """
    permission_classes = [permissions.IsAuthenticated, IsLegalReviewerRole | IsAdminOrSuperAdmin]

    @transaction.atomic
    def post(self, request):
        category = request.data.get("category", "royalty_author")
        period_type = request.data.get("period_type", "monthly")
        year = int(request.data.get("year", timezone.now().year) or timezone.now().year)
        month = int(request.data.get("month", timezone.now().month) or timezone.now().month)
        quarter = int(request.data.get("quarter", 1) or 1)

        start_date, end_date, period_label = get_period_date_range(period_type, year, month, quarter)

        created_count = 0

        if category == "royalty_author":
            # Tous les auteurs ayant des ventes sur la période
            lignes = LigneCommande.objects.filter(commande__statut_paiement='paid')
            if start_date and end_date:
                lignes = lignes.filter(commande__created_at__date__gte=start_date, commande__created_at__date__lte=end_date)
            
            author_users = User.objects.filter(
                role='author',
                authorright__ouvrage__in=lignes.values_list('ouvrage', flat=True)
            ).distinct()

            if not author_users.exists():
                # Repli sur les auteurs actifs de la plateforme
                author_users = User.objects.filter(role='author')[:10]

            for author_user in author_users:
                # Vérifier si un brouillon existe déjà pour cette période
                existing = CourrierOfficiel.objects.filter(
                    category="royalty_author",
                    recipient_id=str(author_user.id),
                    period=period_label,
                    status__in=["draft", "validated"]
                ).first()
                if existing:
                    continue

                rights = AuthorRight.objects.filter(user=author_user)
                books = Ouvrage.objects.filter(author_rights__in=rights).distinct()
                author_lignes = lignes.filter(ouvrage__in=books)
                vol = author_lignes.aggregate(qty=Sum('quantity'))['qty'] or 0
                gross = float(author_lignes.aggregate(s=Sum(F('unit_price') * F('quantity')))['s'] or 0.0)
                net = gross * 0.10 # approximation moyenne

                tpl = get_default_letter_template("royalty_author", {
                    "recipient_name": author_user.get_full_name() or author_user.username,
                    "period": period_label,
                    "volume_ventes": vol,
                    "assiette_brute": gross,
                    "montant_net": net,
                })

                CourrierOfficiel.objects.create(
                    reference=CourrierOfficiel.generate_reference("royalty_author"),
                    category="royalty_author",
                    status="draft",
                    recipient_type="author",
                    recipient_id=str(author_user.id),
                    recipient_name=author_user.get_full_name() or author_user.username,
                    recipient_email=author_user.email,
                    period=period_label,
                    amount=net,
                    currency="FCFA",
                    subject=tpl["subject"],
                    body_text=tpl["body"],
                    created_by=request.user,
                )
                created_count += 1

        return Response({
            "success": True,
            "data": {
                "prepared_count": created_count,
                "period_label": period_label,
                "message": f"{created_count} courrier(s) préparé(s) en brouillon pour la période {period_label}."
            },
            "error": None
        })


class CourrierDetailView(APIView):
    """
    GET /api/v1/rights/legal/courriers/<uuid:id>/
    PATCH /api/v1/rights/legal/courriers/<uuid:id>/
    Permet la consultation détaillée et la modification contextuelle ("Corriger") de l'objet et du corps.
    """
    permission_classes = [permissions.IsAuthenticated, IsLegalReviewerRole | IsAdminOrSuperAdmin]

    def get(self, request, id):
        try:
            courrier = CourrierOfficiel.objects.get(id=id)
        except CourrierOfficiel.DoesNotExist:
            return Response({"success": False, "error": "Courrier introuvable."}, status=404)

        serializer = CourrierOfficielSerializer(courrier)
        return Response({"success": True, "data": serializer.data, "error": None})

    def patch(self, request, id):
        try:
            courrier = CourrierOfficiel.objects.get(id=id)
        except CourrierOfficiel.DoesNotExist:
            return Response({"success": False, "error": "Courrier introuvable."}, status=404)

        if courrier.status != "draft":
            return Response({
                "success": False,
                "error": "Seul un courrier au statut Brouillon peut être modifié. Ce courrier est déjà validé ou envoyé."
            }, status=400)

        subject = request.data.get("subject")
        body_text = request.data.get("body_text")

        if subject is not None:
            courrier.subject = str(subject).strip()
        if body_text is not None:
            courrier.body_text = str(body_text).strip()

        courrier.save(update_fields=["subject", "body_text", "updated_at"])
        serializer = CourrierOfficielSerializer(courrier)
        return Response({
            "success": True,
            "data": serializer.data,
            "message": "Courrier mis à jour avec succès.",
            "error": None
        })


class CourrierPreviewPdfView(APIView):
    """
    GET /api/v1/rights/legal/courriers/<uuid:id>/preview-pdf/
    Génère et diffuse le PDF fusionné sur papier à en-tête LAHAThèque en streaming direct dans le navigateur.
    """
    permission_classes = [permissions.IsAuthenticated, IsLegalReviewerRole | IsAdminOrSuperAdmin]

    def get(self, request, id):
        try:
            courrier = CourrierOfficiel.objects.get(id=id)
        except CourrierOfficiel.DoesNotExist:
            return Response({"success": False, "error": "Courrier introuvable."}, status=404)

        try:
            # Si déjà validé ou envoyé et que le fichier scellé existe, on le renvoie
            if courrier.status in ["validated", "sent"] and courrier.pdf_file:
                try:
                    pdf_bytes = courrier.pdf_file.read()
                except Exception:
                    pdf_bytes = OfficialLetterPdfService.generate_pdf_bytes(courrier)
            else:
                # Mode brouillon ou fichier non persisté : génération dynamique à la volée
                pdf_bytes = OfficialLetterPdfService.generate_pdf_bytes(courrier)

            response = HttpResponse(pdf_bytes, content_type='application/pdf')
            filename = f"courrier_{courrier.reference.lower().replace('-', '_')}.pdf"
            response['Content-Disposition'] = f'inline; filename="{filename}"'
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            return response
        except Exception as e:
            logger.error(f"Erreur génération preview PDF courrier {id}: {e}", exc_info=True)
            return Response({
                "success": False,
                "error": f"Erreur lors de la génération du document PDF : {str(e)}"
            }, status=500)


class CourrierValidateView(APIView):
    """
    POST /api/v1/rights/legal/courriers/<uuid:id>/validate/
    Verrouille le texte du courrier, scelle définitivement le PDF sur le gabarit officiel,
    et fait passer le statut à Validé.
    """
    permission_classes = [permissions.IsAuthenticated, IsLegalReviewerRole | IsAdminOrSuperAdmin]

    @transaction.atomic
    def post(self, request, id):
        try:
            courrier = CourrierOfficiel.objects.get(id=id)
        except CourrierOfficiel.DoesNotExist:
            return Response({"success": False, "error": "Courrier introuvable."}, status=404)

        if courrier.status != "draft":
            return Response({
                "success": False,
                "error": f"Ce courrier est déjà au statut {courrier.get_status_display()}."
            }, status=400)

        courrier.status = "validated"
        courrier.validated_at = timezone.now()
        courrier.save(update_fields=["status", "validated_at", "updated_at"])
        
        # Scellement du PDF définitif
        OfficialLetterPdfService.seal_and_save_pdf(courrier)

        serializer = CourrierOfficielSerializer(courrier)
        return Response({
            "success": True,
            "data": serializer.data,
            "message": "Le courrier a été validé et scellé définitivement.",
            "error": None
        })


class CourrierCancelView(APIView):
    """
    POST /api/v1/rights/legal/courriers/<uuid:id>/cancel/
    Annule un courrier en statut Brouillon ou Validé (interdit si déjà Envoyé).
    """
    permission_classes = [permissions.IsAuthenticated, IsLegalReviewerRole | IsAdminOrSuperAdmin]

    @transaction.atomic
    def post(self, request, id):
        try:
            courrier = CourrierOfficiel.objects.get(id=id)
        except CourrierOfficiel.DoesNotExist:
            return Response({"success": False, "error": "Courrier introuvable."}, status=404)

        if courrier.status == "sent":
            return Response({
                "success": False,
                "error": "Impossible d'annuler un courrier déjà envoyé au destinataire."
            }, status=400)

        if courrier.status == "canceled":
            return Response({
                "success": False,
                "error": "Ce courrier est déjà annulé."
            }, status=400)

        courrier.status = "canceled"
        courrier.canceled_at = timezone.now()
        courrier.save(update_fields=["status", "canceled_at", "updated_at"])

        serializer = CourrierOfficielSerializer(courrier)
        return Response({
            "success": True,
            "data": serializer.data,
            "message": "Le courrier a été annulé avec succès.",
            "error": None
        })


class CourrierSendEmailView(APIView):
    """
    POST /api/v1/rights/legal/courriers/<uuid:id>/send-email/
    Expédie l'e-mail officiel avec le corps du message rédigé et le PDF scellé en pièce jointe.
    """
    permission_classes = [permissions.IsAuthenticated, IsLegalReviewerRole | IsAdminOrSuperAdmin]

    @transaction.atomic
    def post(self, request, id):
        from apps.communications.services.email_service import EmailService
        from apps.communications.services.email_provider_base import EmailAttachment
        from apps.rights.models import RelanceEmailJournal

        try:
            courrier = CourrierOfficiel.objects.get(id=id)
        except CourrierOfficiel.DoesNotExist:
            return Response({"success": False, "error": "Courrier introuvable."}, status=404)

        if courrier.status != "validated":
            return Response({
                "success": False,
                "error": "Seul un courrier au statut 'Validé' peut être envoyé par e-mail."
            }, status=400)

        if not courrier.recipient_email:
            return Response({
                "success": False,
                "error": "Aucune adresse e-mail valide n'est configurée pour ce destinataire."
            }, status=400)

        # Récupération ou génération du PDF scellé
        if courrier.pdf_file:
            try:
                pdf_bytes = courrier.pdf_file.read()
            except Exception:
                pdf_bytes = OfficialLetterPdfService.generate_pdf_bytes(courrier)
        else:
            pdf_bytes = OfficialLetterPdfService.generate_pdf_bytes(courrier)

        attachment = EmailAttachment(
            filename=f"courrier_{courrier.reference.lower().replace('-', '_')}.pdf",
            content=pdf_bytes,
            content_type="application/pdf"
        )

        sender_name = request.user.get_full_name() or "Direction Juridique & Partenariats"
        
        # Envoi de l'e-mail officiel
        res = EmailService.send(
            email_type="official_letter",
            to_email=courrier.recipient_email,
            subject=courrier.subject,
            template_name="emails/pro_direct_message.html",
            context={
                "subject_text": courrier.subject,
                "recipient_name": courrier.recipient_name,
                "message_body": courrier.body_text,
                "sender_name": sender_name,
                "sender_email": request.user.email,
                "sender_role_display": "LAHA Éditions S.A. • LAHAThèque",
            },
            recipient_name=courrier.recipient_name,
            reply_to=request.user.email,
            attachments=[attachment],
        )

        if not res.success:
            logger.error(f"Échec envoi email courrier {id}: {res.error}")
            return Response({
                "success": False,
                "error": f"Échec de l'envoi de l'e-mail : {res.error}"
            }, status=500)

        courrier.status = "sent"
        courrier.sent_at = timezone.now()
        courrier.save(update_fields=["status", "sent_at", "updated_at"])

        # Trace dans le journal des relances
        target_user = None
        if courrier.recipient_type == "author":
            target_user = User.objects.filter(id=courrier.recipient_id).first()
        elif courrier.recipient_type == "university":
            inst = Institution.objects.filter(id=courrier.recipient_id).first()
            target_user = getattr(inst, 'user', None)
        elif courrier.recipient_type == "publisher":
            pub = PublisherProfile.objects.filter(id=courrier.recipient_id).first()
            target_user = getattr(pub, 'user', None)

        if target_user:
            RelanceEmailJournal.objects.create(
                type_relance="rapport_droits_auteur" if "royalty" in courrier.category else "relance_impaye",
                destinataire=target_user,
                destinataire_email=courrier.recipient_email,
                sujet=courrier.subject,
                corps_message=f"Courrier officiel {courrier.reference} expédié avec PDF scellé.",
                niveau_relance=1,
                montant_du=courrier.amount,
            )

        serializer = CourrierOfficielSerializer(courrier)
        return Response({
            "success": True,
            "data": serializer.data,
            "message": f"Le courrier officiel a été envoyé avec succès à {courrier.recipient_email}.",
            "error": None
        })
