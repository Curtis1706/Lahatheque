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
from apps.catalog.models import Ouvrage


class WholesalerKpisView(APIView):
    permission_classes = [IsAuthenticated]

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
    permission_classes = [IsAuthenticated]

    def get(self, request):
        search_query = request.query_params.get("search", "").strip()
        discipline = request.query_params.get("discipline", "").strip()

        ouvrages = Ouvrage.objects.filter(is_published=True).select_related("discipline_detail")

        if discipline and discipline != "all":
            ouvrages = ouvrages.filter(
                Q(discipline__iexact=discipline) | Q(discipline_detail__nom__iexact=discipline)
            )

        if search_query:
            ouvrages = ouvrages.filter(
                Q(titre__icontains=search_query) |
                Q(isbn__icontains=search_query) |
                Q(auteurs__icontains=search_query)
            )

        data = []
        for o in ouvrages:
            public_p = float(o.prix_public or 5000)
            dig_p = float(o.prix_gros_numerique or int(public_p * 0.75))
            prt_p = float(o.prix_gros_papier or int(public_p * 0.70))
            
            # Stock physique disponible
            stocks = StockOuvrage.objects.filter(ouvrage=o)
            total_dispo = sum(s.quantite_disponible for s in stocks) if stocks.exists() else 0

            data.append({
                "id": str(o.id),
                "title": o.titre,
                "authors": o.auteurs if isinstance(o.auteurs, list) else [str(o.auteurs)],
                "cover_url": o.cover_image_url or "/placeholder-cover.jpg",
                "isbn_digital": o.isbn or "978-2-84129-001-1",
                "isbn_print": getattr(o, "isbn_print", o.isbn or "978-2-84129-001-2"),
                "discipline": getattr(o.discipline_detail, "nom", o.discipline or "Général"),
                "publisher_name": "LAHA Éditions",
                "digital_wholesale_price": dig_p,
                "print_wholesale_price": prt_p,
                "public_price": public_p,
                "min_quantity": 20,
                "stock_available_print": total_dispo,
                "summary": o.resume or "Ouvrage académique et professionnel de référence.",
            })

        return Response({
            "success": True,
            "data": data,
            "error": None,
        })


class WholesalerCatalogDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            o = Ouvrage.objects.get(id=pk)
            public_p = float(o.prix_public or 5000)
            dig_p = float(o.prix_gros_numerique or int(public_p * 0.75))
            prt_p = float(o.prix_gros_papier or int(public_p * 0.70))
            
            stocks = StockOuvrage.objects.filter(ouvrage=o)
            total_dispo = sum(s.quantite_disponible for s in stocks) if stocks.exists() else 0

            return Response({
                "success": True,
                "data": {
                    "id": str(o.id),
                    "title": o.titre,
                    "authors": o.auteurs if isinstance(o.auteurs, list) else [str(o.auteurs)],
                    "cover_url": o.cover_image_url or "/placeholder-cover.jpg",
                    "isbn_digital": o.isbn or "978-2-84129-001-1",
                    "isbn_print": getattr(o, "isbn_print", o.isbn or "978-2-84129-001-2"),
                    "discipline": getattr(o.discipline_detail, "nom", o.discipline or "Général"),
                    "publisher_name": "LAHA Éditions",
                    "digital_wholesale_price": dig_p,
                    "print_wholesale_price": prt_p,
                    "public_price": public_p,
                    "min_quantity": 20,
                    "stock_available_print": total_dispo,
                    "summary": o.resume or "",
                },
                "error": None,
            })
        except Ouvrage.DoesNotExist:
            return Response(
                {"success": False, "data": None, "error": "Ouvrage introuvable."},
                status=status.HTTP_404_NOT_FOUND,
            )


class WholesalerOrdersListView(APIView):
    permission_classes = [IsAuthenticated]

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
            dig_price = book.prix_gros_numerique or Decimal("3000.00")
            prt_price = book.prix_gros_papier or Decimal("3500.00")

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
                if stock:
                    stock.quantite_reservee = F('quantite_reservee') + prt_qty
                    stock.save(update_fields=['quantite_reservee'])
                    MouvementStock.objects.create(
                        stock=stock,
                        type_mouvement='adjustment',
                        quantite=prt_qty,
                        reference_document=ref,
                        motif=f"Réservation commande grossiste {comp_name}",
                        auteur=user,
                    )

            WholesaleOrderItem.objects.create(
                order=order,
                book=book,
                title=book.titre,
                authors=book.auteurs if isinstance(book.auteurs, list) else [str(book.auteurs)],
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

        return Response(
            {
                "success": True,
                "data": {
                    "id": str(order.id),
                    "reference": order.reference,
                    "total_amount": float(order.total_amount),
                    "status": order.status,
                },
                "error": None,
            },
            status=status.HTTP_201_CREATED,
        )


class WholesalerOrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            ord_obj = WholesaleOrder.objects.filter(Q(id=pk) | Q(reference=pk)).first()
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


class WholesalerOrderCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        reason = request.data.get("reason", "").strip()
        if not reason:
            return Response(
                {"success": False, "data": None, "error": "Le motif d'annulation est obligatoire."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ord_obj = WholesaleOrder.objects.filter(Q(id=pk) | Q(reference=pk)).first()
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
    permission_classes = [IsAuthenticated]

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
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        notifs = WholesaleNotification.objects.filter(
            Q(user=user) | Q(user__isnull=True)
        )[:30]

        data = [
            {
                "id": str(n.id),
                "type": n.notification_type,
                "title": n.title,
                "book_id": str(n.book_id) if n.book_id else "",
                "book_title": n.book.titre if n.book else "",
                "cover_url": n.book.cover_image_url if n.book else "/placeholder-cover.jpg",
                "description": n.description,
                "created_at": n.created_at.isoformat(),
                "is_read": n.is_read,
                "wholesale_price": float(n.wholesale_price),
            }
            for n in notifs
        ]
        return Response({"success": True, "data": data, "error": None})
