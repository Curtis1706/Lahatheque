"""Vues Django pour le module Espace Grossiste (B2B)."""
import uuid
from decimal import Decimal
from django.db.models import Sum, Q
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import (
    WholesaleProfile,
    WholesaleDiscountTier,
    WholesaleOrder,
    WholesaleOrderItem,
    WholesaleOrderStatus,
    WholesaleNotification,
    StockOuvrage,
)
from apps.accounts.permissions import IsWholesaler
from apps.catalog.models import Ouvrage
from apps.reporting.pricing_service import compute_role_price


class WholesalerKpisView(APIView):
    permission_classes = [IsAuthenticated, IsWholesaler]

    def get(self, request):
        user = request.user
        orders_qs = WholesaleOrder.objects.filter(user=user)
        
        pending_count = orders_qs.filter(
            status__in=[WholesaleOrderStatus.PENDING, WholesaleOrderStatus.PROCESSING, WholesaleOrderStatus.VALIDATED]
        ).count()
        
        totals = orders_qs.exclude(status=WholesaleOrderStatus.CANCELLED).aggregate(
            total_licenses=Sum("total_digital_licenses"),
            total_print=Sum("total_print_copies"),
            total_spent=Sum("total_amount"),
        )
        
        unread_notifs = WholesaleNotification.objects.filter(
            Q(user=user) | Q(user__isnull=True),
            is_read=False
        ).count()

        return Response({
            "success": True,
            "data": {
                "pendingOrdersCount": pending_count,
                "totalLicensesPurchased": totals["total_licenses"] or 0,
                "totalPrintCopiesPurchased": totals["total_print"] or 0,
                "totalSpentAmount": float(totals["total_spent"] or 0),
                "unreadNotificationsCount": unread_notifs,
            },
            "error": None,
        })


class WholesalerCatalogListView(APIView):
    permission_classes = [IsAuthenticated, IsWholesaler]

    def get(self, request):
        search_query = request.query_params.get("search", "").strip()
        discipline = request.query_params.get("discipline", "").strip()

        ouvrages = Ouvrage.objects.filter(status="published").select_related("discipline", "publisher").prefetch_related("authors")

        if discipline and discipline != "all":
            ouvrages = ouvrages.filter(
                Q(discipline__name__iexact=discipline) | Q(discipline__name__icontains=discipline)
            )

        if search_query:
            ouvrages = ouvrages.filter(
                Q(title__icontains=search_query) |
                Q(isbn__icontains=search_query) |
                Q(authors__first_name__icontains=search_query) |
                Q(authors__last_name__icontains=search_query)
            ).distinct()

        data = []
        for o in ouvrages:
            public_digital = float(o.price_digital or 5000)
            public_paper = float(o.price_paper or 7500)
            pricing = compute_role_price(o, "wholesaler")
            dig_p = pricing["digital_price"]
            prt_p = pricing["paper_price"]
            digital_discount_pct = pricing["digital_discount_pct"]
            paper_discount_pct = pricing["paper_discount_pct"]
            
            # Stock physique disponible
            stocks = StockOuvrage.objects.filter(ouvrage=o)
            total_dispo = sum(s.quantite_disponible for s in stocks) if stocks.exists() else 0

            authors_list = [f"{a.first_name} {a.last_name}".strip() for a in o.authors.all()]
            if not authors_list and hasattr(o, "auteur") and o.auteur:
                authors_list = [o.auteur]

            data.append({
                "id": str(o.id),
                "title": o.title,
                "authors": authors_list if authors_list else ["Auteur LAHA"],
                "cover_url": o.cover_url or "/placeholder-cover.jpg",
                "isbn_digital": o.isbn or "978-2-84129-001-1",
                "isbn_print": getattr(o, "isbn_print", o.isbn or "978-2-84129-001-2"),
                "discipline": o.discipline.name if o.discipline else "Général",
                "publisher_name": o.publisher.name if o.publisher else "LAHA Éditions",
                "digital_wholesale_price": dig_p,
                "print_wholesale_price": prt_p,
                "digital_discount_pct": digital_discount_pct,
                "paper_discount_pct": paper_discount_pct,
                "public_price": public_digital,
                "public_price_paper": public_paper,
                "min_quantity": 20,
                "stock_available_print": total_dispo,
                "is_paper_available": bool(o.is_paper_available or total_dispo > 0),
                "summary": o.summary or "Ouvrage académique et professionnel de référence.",
            })

        return Response({
            "success": True,
            "data": data,
            "error": None,
        })


class WholesalerCatalogDetailView(APIView):
    permission_classes = [IsAuthenticated, IsWholesaler]

    def get(self, request, pk):
        try:
            o = Ouvrage.objects.select_related("discipline", "publisher").prefetch_related("authors").get(id=pk)
            public_digital = float(o.price_digital or 5000)
            public_paper = float(o.price_paper or 7500)
            pricing = compute_role_price(o, "wholesaler")
            dig_p = pricing["digital_price"]
            prt_p = pricing["paper_price"]
            digital_discount_pct = pricing["digital_discount_pct"]
            paper_discount_pct = pricing["paper_discount_pct"]
            
            stocks = StockOuvrage.objects.filter(ouvrage=o)
            total_dispo = sum(s.quantite_disponible for s in stocks) if stocks.exists() else 0

            authors_list = [f"{a.first_name} {a.last_name}".strip() for a in o.authors.all()]
            if not authors_list and hasattr(o, "auteur") and o.auteur:
                authors_list = [o.auteur]

            return Response({
                "success": True,
                "data": {
                    "id": str(o.id),
                    "title": o.title,
                    "authors": authors_list if authors_list else ["Auteur LAHA"],
                    "cover_url": o.cover_url or "/placeholder-cover.jpg",
                    "isbn_digital": o.isbn or "978-2-84129-001-1",
                    "isbn_print": getattr(o, "isbn_print", o.isbn or "978-2-84129-001-2"),
                    "discipline": o.discipline.name if o.discipline else "Général",
                    "publisher_name": o.publisher.name if o.publisher else "LAHA Éditions",
                    "digital_wholesale_price": dig_p,
                    "print_wholesale_price": prt_p,
                    "digital_discount_pct": digital_discount_pct,
                    "paper_discount_pct": paper_discount_pct,
                    "public_price": public_digital,
                    "public_price_paper": public_paper,
                    "min_quantity": 20,
                    "stock_available_print": total_dispo,
                    "summary": o.summary or "",
                },
                "error": None,
            })
        except Ouvrage.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Ouvrage introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )


class WholesalerOrdersListView(APIView):
    permission_classes = [IsAuthenticated, IsWholesaler]

    def get(self, request):
        user = request.user
        orders = WholesaleOrder.objects.filter(user=user).prefetch_related("items")
        data = []
        for ord_obj in orders:
            items_data = [
                {
                    "book_id": str(item.book_id),
                    "title": item.title,
                    "authors": item.authors,
                    "isbn": item.isbn,
                    "digital_licenses_qty": item.digital_licenses_qty,
                    "digital_unit_price": float(item.digital_unit_price),
                    "print_copies_qty": item.print_copies_qty,
                    "print_unit_price": float(item.print_unit_price),
                    "subtotal": float(item.subtotal),
                }
                for item in ord_obj.items.all()
            ]

            data.append({
                "id": str(ord_obj.id),
                "reference": ord_obj.reference,
                "created_at": ord_obj.created_at.isoformat(),
                "company_name": ord_obj.company_name,
                "delivery_address": ord_obj.delivery_address,
                "contact_phone": ord_obj.contact_phone,
                "items": items_data,
                "total_digital_licenses": ord_obj.total_digital_licenses,
                "total_print_copies": ord_obj.total_print_copies,
                "total_amount": float(ord_obj.total_amount),
                "currency": ord_obj.currency,
                "status": ord_obj.status,
                "carrier_name": ord_obj.carrier_name,
                "tracking_number": ord_obj.tracking_number,
                "invoice_url": ord_obj.invoice_url or f"/invoices/{ord_obj.reference}.pdf",
                "cancel_requested": ord_obj.cancel_requested,
                "cancel_reason": ord_obj.cancel_reason,
                # ─── Champs Commande à Crédit Grossiste ─────────────────────────
                "is_credit_purchase": ord_obj.is_credit_purchase,
                "credit_due_date": ord_obj.credit_due_date.isoformat() if hasattr(ord_obj.credit_due_date, "isoformat") else (str(ord_obj.credit_due_date) if ord_obj.credit_due_date else None),
                "returned_at": ord_obj.returned_at.isoformat() if hasattr(ord_obj.returned_at, "isoformat") else (str(ord_obj.returned_at) if ord_obj.returned_at else None),
                "return_reason": ord_obj.return_reason,
                "timeline": [
                    {"step": "Commande transmise", "date": ord_obj.created_at.strftime("%d/%m/%Y"), "description": "Dépôt de la commande groupée", "done": True},
                    {"step": "Validation & Proforma", "date": "-", "description": "Émission du devis proforma B2B", "done": ord_obj.status in ["validated", "processing", "delivered"]},
                    {"step": "Préparation & Expédition", "date": "-", "description": "Traitement entrepôt et transporteur", "done": ord_obj.status in ["processing", "delivered"]},
                    {"step": "Livraison & Licences", "date": "-", "description": "Livraison physique & activation des clés", "done": ord_obj.status == "delivered"},
                ]
            })

        return Response({"success": True, "data": data, "error": None})

    def post(self, request):
        user = request.user
        data = request.data
        cart_items = data.get("items", [])
        delivery_address = data.get("delivery_address", "")
        contact_phone = data.get("contact_phone", "")

        # ─── Paramètres Commande à Crédit / Dépôt Grossiste ───────────────────
        is_credit = bool(data.get("is_credit_purchase", False))
        credit_due = data.get("credit_due_date")
        if is_credit and not credit_due:
            from datetime import date, timedelta
            # Délai standard 60 jours pour réapprovisionnement grossiste
            credit_due = date.today() + timedelta(days=60)

        if not cart_items:
            return Response(
                {"success": False, "data": None, "error": "Le panier est vide."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ref = f"CMD-GROSSISTE-{timezone.now().strftime('%Y')}-{uuid.uuid4().hex[:5].upper()}"
        
        prof = getattr(user, "wholesale_profile", None)
        comp_name = prof.company_name if prof else "Librairie Partenaire"

        order = WholesaleOrder.objects.create(
            reference=ref,
            user=user,
            profile=prof,
            company_name=comp_name,
            delivery_address=delivery_address or (prof.warehouse_address if prof else "Cotonou"),
            contact_phone=contact_phone or (prof.contact_phone if prof else ""),
            currency="XOF",
            status=WholesaleOrderStatus.PENDING,
            invoice_url="",  # Facture PDF non encore disponible
            # Assignation crédit
            is_credit_purchase=is_credit,
            credit_due_date=credit_due if is_credit else None,
            credit_granted_by=user if is_credit else None,
        )

        tot_dig = 0
        tot_prt = 0
        tot_amt = Decimal("0.00")

        from django.db.models import Sum, F
        from .models import StockOuvrage, MouvementStock, WholesaleDiscountTier

        for ci in cart_items:
            book_id = ci.get("book_id")
            try:
                book = Ouvrage.objects.get(id=book_id)
            except Ouvrage.DoesNotExist:
                continue

            dig_qty = int(ci.get("digital_licenses_qty", 0))
            prt_qty = int(ci.get("print_copies_qty", 0))
            total_qty = dig_qty + prt_qty

            if total_qty <= 0:
                continue

            # Prix TOUJOURS recalculé serveur — jamais depuis le client
            pricing = compute_role_price(book, "wholesaler")
            dig_price = Decimal(str(pricing["digital_price"]))
            prt_price = Decimal(str(pricing["paper_price"]))

            # Application du palier de remise applicable selon la quantité totale
            tier = WholesaleDiscountTier.objects.filter(
                min_quantity__lte=total_qty
            ).order_by('-min_quantity').first()

            if tier:
                dig_price = dig_price * (Decimal("1.00") - tier.digital_discount_percent / Decimal("100.00"))
                prt_price = prt_price * (Decimal("1.00") - tier.print_discount_percent / Decimal("100.00"))

            # Vérification du stock papier disponible
            if prt_qty > 0:
                total_disponible = book.stocks_entrepots.aggregate(
                    total=Sum(F('quantite_reelle') - F('quantite_reservee'))
                )['total'] or 0

                is_paper_ok = bool(book.is_paper_available or total_disponible > 0)
                if not is_paper_ok:
                    order.delete()
                    return Response({
                        "success": False,
                        "data": None,
                        "error": f"« {book.title} » n'est pas disponible en version papier."
                    }, status=status.HTTP_400_BAD_REQUEST)

                if total_disponible < prt_qty:
                    order.delete()
                    return Response({
                        "success": False,
                        "data": None,
                        "error": f"Stock papier insuffisant pour « {book.title} » (disponible : {total_disponible}, demandé : {prt_qty})."
                    }, status=status.HTTP_400_BAD_REQUEST)

            subtotal = (dig_qty * dig_price) + (prt_qty * prt_price)
            tot_dig += dig_qty
            tot_prt += prt_qty
            tot_amt += subtotal

            # Réservation du stock papier
            if prt_qty > 0:
                stock = book.stocks_entrepots.filter(
                    quantite_reelle__gte=prt_qty
                ).order_by('-quantite_reelle').first()
                if not stock:
                    stock = book.stocks_entrepots.first()
                if stock:
                    stock.quantite_reservee = F('quantite_reservee') + prt_qty
                    stock.save(update_fields=['quantite_reservee'])
                    motif_label = f"Dépôt commande à crédit grossiste {comp_name}" if is_credit else f"Réservation commande grossiste {comp_name}"
                    MouvementStock.objects.create(
                        stock=stock,
                        type_mouvement='adjustment',
                        quantite=prt_qty,
                        reference_document=ref,
                        motif=motif_label,
                        auteur=user,
                    )

            authors_list = [f"{a.first_name} {a.last_name}".strip() for a in book.authors.all()]
            if not authors_list and hasattr(book, "auteur") and book.auteur:
                authors_list = [book.auteur]

            WholesaleOrderItem.objects.create(
                order=order,
                book=book,
                title=book.title,
                authors=authors_list if authors_list else ["Auteur LAHA"],
                isbn=book.isbn or "",
                digital_licenses_qty=dig_qty,
                digital_unit_price=dig_price,
                print_copies_qty=prt_qty,
                print_unit_price=prt_price,
                subtotal=subtotal,
            )

        order.total_digital_licenses = tot_dig
        order.total_print_copies = tot_prt
        order.total_amount = tot_amt
        order.save(update_fields=["total_digital_licenses", "total_print_copies", "total_amount"])

        order.refresh_from_db()

        return Response(
            {
                "success": True,
                "data": {
                    "id": str(order.id),
                    "reference": order.reference,
                    "total_amount": float(order.total_amount),
                    "status": order.status,
                    "is_credit_purchase": order.is_credit_purchase,
                    "credit_due_date": order.credit_due_date.isoformat() if hasattr(order.credit_due_date, "isoformat") else (str(order.credit_due_date) if order.credit_due_date else None),
                },
                "error": None,
            },
            status=status.HTTP_201_CREATED,
        )


class WholesalerOrderDetailView(APIView):
    permission_classes = [IsAuthenticated, IsWholesaler]

    def get(self, request, pk):
        try:
            ord_obj = WholesaleOrder.objects.filter(
                Q(id=pk) | Q(reference=pk), user=request.user
            ).first()
            if not ord_obj:
                return Response(
                    {"success": False, "data": None, "error": "Commande introuvable."},
                    status=status.HTTP_404_NOT_FOUND,
                )

            items_data = [
                {
                    "book_id": str(item.book_id),
                    "title": item.title,
                    "authors": item.authors,
                    "isbn": item.isbn,
                    "digital_licenses_qty": item.digital_licenses_qty,
                    "digital_unit_price": float(item.digital_unit_price),
                    "print_copies_qty": item.print_copies_qty,
                    "print_unit_price": float(item.print_unit_price),
                    "subtotal": float(item.subtotal),
                }
                for item in ord_obj.items.all()
            ]

            return Response({
                "success": True,
                "data": {
                    "id": str(ord_obj.id),
                    "reference": ord_obj.reference,
                    "created_at": ord_obj.created_at.isoformat(),
                    "company_name": ord_obj.company_name,
                    "delivery_address": ord_obj.delivery_address,
                    "contact_phone": ord_obj.contact_phone,
                    "items": items_data,
                    "total_digital_licenses": ord_obj.total_digital_licenses,
                    "total_print_copies": ord_obj.total_print_copies,
                    "total_amount": float(ord_obj.total_amount),
                    "currency": ord_obj.currency,
                    "status": ord_obj.status,
                    "carrier_name": ord_obj.carrier_name,
                    "tracking_number": ord_obj.tracking_number,
                    "invoice_url": ord_obj.invoice_url or f"/invoices/{ord_obj.reference}.pdf",
                    "cancel_requested": ord_obj.cancel_requested,
                    "cancel_reason": ord_obj.cancel_reason,
                    # ─── Champs Commande à Crédit Grossiste ─────────────────────
                    "is_credit_purchase": ord_obj.is_credit_purchase,
                    "credit_due_date": ord_obj.credit_due_date.isoformat() if hasattr(ord_obj.credit_due_date, "isoformat") else (str(ord_obj.credit_due_date) if ord_obj.credit_due_date else None),
                    "returned_at": ord_obj.returned_at.isoformat() if hasattr(ord_obj.returned_at, "isoformat") else (str(ord_obj.returned_at) if ord_obj.returned_at else None),
                    "return_reason": ord_obj.return_reason,
                    "timeline": [
                        {"step": "Commande transmise", "date": ord_obj.created_at.strftime("%d/%m/%Y"), "description": "Dépôt de la commande groupée", "done": True},
                        {"step": "Validation & Proforma", "date": "-", "description": "Émission du devis proforma B2B", "done": ord_obj.status in ["validated", "processing", "delivered"]},
                        {"step": "Préparation & Expédition", "date": "-", "description": "Traitement entrepôt et transporteur", "done": ord_obj.status in ["processing", "delivered"]},
                        {"step": "Livraison & Licences", "date": "-", "description": "Livraison physique & activation des clés", "done": ord_obj.status == "delivered"},
                    ]
                },
                "error": None,
            })
        except Exception as e:
            return Response({"success": False, "data": None, "error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class WholesalerOrderReturnCreditView(APIView):
    """
    POST /api/v1/commerce/wholesaler/orders/<pk>/return/
    Permet au grossiste d'enregistrer le retour d'exemplaires invendus d'une commande à crédit / dépôt.
    """
    permission_classes = [IsAuthenticated, IsWholesaler]

    def post(self, request, pk):
        reason = request.data.get("reason", "").strip() or "Retour des invendus en fin de période de dépôt"

        ord_obj = WholesaleOrder.objects.filter(
            Q(id=pk) | Q(reference=pk), user=request.user
        ).first()
        if not ord_obj:
            return Response(
                {"success": False, "data": None, "error": "Commande introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if not ord_obj.is_credit_purchase:
            return Response(
                {"success": False, "data": None, "error": "Seules les commandes à crédit / dépôt peuvent faire l'objet d'un retour d'invendus."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if ord_obj.returned_at:
            return Response(
                {"success": False, "data": None, "error": "Cette commande à crédit a déjà été marquée comme retournée."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .models import StockOuvrage, MouvementStock
        from django.db import transaction
        from django.db.models import F

        with transaction.atomic():
            for item in ord_obj.items.all():
                if item.print_copies_qty and item.print_copies_qty > 0:
                    stock = StockOuvrage.objects.filter(ouvrage_id=item.book_id).first()
                    if stock:
                        stock.quantite_reservee = F('quantite_reservee') - item.print_copies_qty
                        stock.save(update_fields=['quantite_reservee'])
                        MouvementStock.objects.create(
                            stock=stock,
                            type_mouvement='return',
                            quantite=item.print_copies_qty,
                            reference_document=f"Retour dépôt grossiste #{ord_obj.reference}",
                            motif=reason,
                            auteur=request.user,
                        )

            ord_obj.returned_at = timezone.now()
            ord_obj.return_reason = reason
            ord_obj.status = WholesaleOrderStatus.CANCELLED
            ord_obj.save(update_fields=["returned_at", "return_reason", "status", "updated_at"])

        return Response({
            "success": True,
            "message": "Retour des exemplaires invendus enregistré avec succès.",
            "data": {
                "id": str(ord_obj.id),
                "reference": ord_obj.reference,
                "status": ord_obj.status,
                "returned_at": ord_obj.returned_at.isoformat() if ord_obj.returned_at else None,
                "return_reason": ord_obj.return_reason,
            },
            "error": None,
        })


class WholesalerOrderCancelView(APIView):
    permission_classes = [IsAuthenticated, IsWholesaler]

    def post(self, request, pk):
        reason = request.data.get("reason", "").strip()
        if not reason:
            return Response(
                {"success": False, "data": None, "error": "Le motif d'annulation est obligatoire."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ord_obj = WholesaleOrder.objects.filter(
            Q(id=pk) | Q(reference=pk), user=request.user
        ).first()
        if not ord_obj:
            return Response(
                {"success": False, "data": None, "error": "Commande introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )

        if ord_obj.status == WholesaleOrderStatus.DELIVERED:
            return Response(
                {"success": False, "data": None, "error": "Une commande déjà livrée ne peut plus être annulée."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        from .models import StockOuvrage, MouvementStock
        from django.db import transaction
        from django.db.models import F

        with transaction.atomic():
            for item in ord_obj.items.all():
                if item.print_copies_qty and item.print_copies_qty > 0:
                    stock = StockOuvrage.objects.filter(ouvrage_id=item.book_id).first()
                    if stock:
                        stock.quantite_reservee = F('quantite_reservee') - item.print_copies_qty
                        stock.save(update_fields=['quantite_reservee'])
                        MouvementStock.objects.create(
                            stock=stock,
                            type_mouvement='return',
                            quantite=item.print_copies_qty,
                            reference_document=f"Annulation commande grossiste #{ord_obj.reference}",
                            motif=reason,
                            auteur=request.user,
                        )

            ord_obj.status = WholesaleOrderStatus.CANCELLED
            ord_obj.cancel_requested = True
            ord_obj.cancel_reason = reason
            ord_obj.save(update_fields=["status", "cancel_requested", "cancel_reason", "updated_at"])

        return Response({
            "success": True,
            "data": {"id": str(ord_obj.id), "status": ord_obj.status},
            "error": None,
        })


class WholesalerProfileView(APIView):
    permission_classes = [IsAuthenticated, IsWholesaler]

    def get(self, request):
        user = request.user
        prof, _ = WholesaleProfile.objects.get_or_create(
            user=user,
            defaults={
                "company_name": f"Librairie {user.first_name or 'Partenaire'} B2B",
                "contact_person": f"{user.first_name} {user.last_name}".strip() or "Responsable Achats",
                "contact_email": user.email or "contact@librairie-partenaire.com",
                "contact_phone": getattr(user, "phone", "+229 97 00 11 22"),
                "headquarters_address": "Avenue Steinmetz, Cotonou, Bénin",
                "warehouse_address": "Zone Industrielle de Ganhi, Hangar 4B, Cotonou, Bénin",
            }
        )

        tier_data = {
            "id": str(prof.tier.id) if prof.tier else "tier-grand-compte",
            "name": prof.tier.name if prof.tier else "Grand Compte Librairies Partenaires",
            "min_quantity": prof.tier.min_quantity if prof.tier else 20,
            "digital_discount_percent": float(prof.tier.digital_discount_percent) if prof.tier else 25.0,
            "print_discount_percent": float(prof.tier.print_discount_percent) if prof.tier else 30.0,
            "description": prof.tier.description if prof.tier else "Remise standard B2B dès 20 exemplaires par commande.",
        }

        return Response({
            "success": True,
            "data": {
                "company_name": prof.company_name,
                "trade_name": prof.trade_name,
                "nif_number": prof.nif_number,
                "rccm_number": prof.rccm_number,
                "contact_person": prof.contact_person,
                "contact_email": prof.contact_email,
                "contact_phone": prof.contact_phone,
                "country": prof.country,
                "city": prof.city,
                "headquarters_address": prof.headquarters_address,
                "warehouse_address": prof.warehouse_address,
                "tier": tier_data,
                "payment_terms": prof.payment_terms,
                "verified_partner": prof.verified_partner,
            },
            "error": None,
        })

    def patch(self, request):
        user = request.user
        prof, _ = WholesaleProfile.objects.get_or_create(user=user)
        data = request.data

        fields = [
            "company_name", "trade_name", "nif_number", "rccm_number",
            "contact_person", "contact_email", "contact_phone", "country",
            "city", "headquarters_address", "warehouse_address"
        ]
        for f in fields:
            if f in data:
                setattr(prof, f, data[f])

        prof.save()
        return self.get(request)


class WholesalerNotificationsListView(APIView):
    permission_classes = [IsAuthenticated, IsWholesaler]

    def get(self, request):
        from apps.catalog.models import Ouvrage
        from apps.commerce.models import LigneCommande, WholesaleOrderItem
        from django.db.models import Sum, F

        # 1. Nouvelles Parutions (ouvrages publiés triés par date la plus récente)
        recent_books = (
            Ouvrage.objects.filter(status='published')
            .select_related('discipline', 'publisher')
            .prefetch_related('authors')
            .order_by('-publication_date', '-created_at')[:24]
        )

        new_releases = []
        for b in recent_books:
            pricing = compute_role_price(b, "wholesaler")
            authors_list = [f"{a.first_name} {a.last_name}".strip() for a in b.authors.all()]
            if not authors_list and hasattr(b, "auteur") and b.auteur:
                authors_list = [b.auteur]

            pub_date = b.publication_date.isoformat() if b.publication_date else (
                b.created_at.date().isoformat() if b.created_at else "2026-01-01"
            )

            new_releases.append({
                "id": str(b.id),
                "title": b.title,
                "authors": authors_list if authors_list else ["Auteur LAHA"],
                "discipline": b.discipline.name if b.discipline else "Général",
                "cover_url": b.cover_url or "",
                "publication_date": pub_date,
                "format_type": b.format_type,
                "is_paper_available": bool(b.is_paper_available),
                "public_digital_price": float(b.price_digital),
                "public_paper_price": float(b.price_paper),
                "digital_wholesale_price": pricing["digital_price"],
                "print_wholesale_price": pricing["paper_price"],
                "digital_discount_percent": pricing["digital_discount_pct"],
                "print_discount_percent": pricing["paper_discount_pct"],
                "summary": b.summary or "",
                "isbn": b.isbn or "",
            })

        # 2. Meilleures Ventes (ouvrages publiés ordonnés par volume de ventes B2C + B2B)
        all_published = (
            Ouvrage.objects.filter(status='published')
            .select_related('discipline', 'publisher')
            .prefetch_related('authors')
        )
        scored_books = []
        for b in all_published:
            b2c = LigneCommande.objects.filter(ouvrage=b, commande__statut_paiement='paid').aggregate(t=Sum('quantity'))['t'] or 0
            b2b = WholesaleOrderItem.objects.filter(book=b).exclude(order__status='cancelled').aggregate(t=Sum(F('digital_licenses_qty') + F('print_copies_qty')))['t'] or 0
            total_sold = b2c + b2b
            pricing = compute_role_price(b, "wholesaler")
            authors_list = [f"{a.first_name} {a.last_name}".strip() for a in b.authors.all()]
            if not authors_list and hasattr(b, "auteur") and b.auteur:
                authors_list = [b.auteur]

            pub_date = b.publication_date.isoformat() if b.publication_date else (
                b.created_at.date().isoformat() if b.created_at else "2026-01-01"
            )

            scored_books.append({
                "id": str(b.id),
                "title": b.title,
                "authors": authors_list if authors_list else ["Auteur LAHA"],
                "discipline": b.discipline.name if b.discipline else "Général",
                "cover_url": b.cover_url or "",
                "publication_date": pub_date,
                "format_type": b.format_type,
                "is_paper_available": bool(b.is_paper_available),
                "public_digital_price": float(b.price_digital),
                "public_paper_price": float(b.price_paper),
                "digital_wholesale_price": pricing["digital_price"],
                "print_wholesale_price": pricing["paper_price"],
                "digital_discount_percent": pricing["digital_discount_pct"],
                "print_discount_percent": pricing["paper_discount_pct"],
                "total_sold": total_sold,
                "summary": b.summary or "",
                "isbn": b.isbn or "",
            })

        # Trier par total_sold décroissant puis date
        scored_books.sort(key=lambda x: (x["total_sold"], x["publication_date"]), reverse=True)
        best_sellers = []
        for idx, sb in enumerate(scored_books[:24], 1):
            sb["rank"] = idx
            best_sellers.append(sb)

        # 3. Liste de notifications (pour la rétrocompatibilité)
        notifications_list = []
        for nr in new_releases[:5]:
            notifications_list.append({
                "id": f"notif-new-{nr['id']}",
                "type": "nouveaute",
                "title": f"Nouvelle Parution : {nr['title']}",
                "book_id": nr["id"],
                "book_title": nr["title"],
                "cover_url": nr["cover_url"],
                "description": f"Ajouté au catalogue LAHAThèque en {nr['discipline']}. Tarif préférentiel grossiste disponible.",
                "created_at": nr["publication_date"],
                "is_read": False,
                "wholesale_price": nr["print_wholesale_price"] if nr["is_paper_available"] else nr["digital_wholesale_price"],
            })

        for bs in best_sellers[:5]:
            notifications_list.append({
                "id": f"notif-best-{bs['id']}",
                "type": "meilleure_vente",
                "title": f"Top Vente #{bs['rank']} : {bs['title']}",
                "book_id": bs["id"],
                "book_title": bs["title"],
                "cover_url": bs["cover_url"],
                "description": f"Grand succès d'édition ({bs['total_sold']} exemplaires écoulés). Recommandé pour réapprovisionnement.",
                "created_at": bs["publication_date"],
                "is_read": False,
                "wholesale_price": bs["print_wholesale_price"] if bs["is_paper_available"] else bs["digital_wholesale_price"],
            })

        return Response({
            "success": True,
            "data": {
                "new_releases": new_releases,
                "best_sellers": best_sellers,
                "notifications": notifications_list,
            },
            "error": None
        })

    def patch(self, request, pk=None):
        return Response({"success": True, "message": "Notification marquée comme lue."})
