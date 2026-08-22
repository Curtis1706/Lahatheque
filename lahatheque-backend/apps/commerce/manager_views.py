"""Vues BFF pour l'Espace Gestionnaire Stock & Livraison.

Périmètre : stocks papier uniquement (Entrepôt, StockOuvrage, MouvementStock, PhysicalDelivery).
Format JSON unifié : { "success": bool, "data": ..., "error": null|str }
Permission : rôle manager ou admin uniquement.
"""
import math
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from django.db.models import Sum, Q, F
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from .models import (
    Entrepot, StockOuvrage, MouvementStock,
    Order, PhysicalDelivery
)


def _is_manager_or_admin(user) -> bool:
    return user.role in ("manager", "admin", "super_admin")


class ManagerKpisView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_manager_or_admin(request.user):
            return Response({"success": False, "data": None, "error": "Accès refusé."}, status=403)

        stocks = StockOuvrage.objects.all()
        total_qty = stocks.aggregate(t=Sum("quantite_reelle"))["t"] or 0
        out_of_stock = sum(1 for s in stocks if s.statut == "out_of_stock")
        low_stock = sum(1 for s in stocks if s.statut == "low_stock")

        deliveries = PhysicalDelivery.objects.all()
        to_ship = deliveries.filter(statut="en_preparation").count()
        in_transit = deliveries.filter(statut="expedie").count()
        now = timezone.now()
        delivered_month = deliveries.filter(
            statut="livre",
            updated_at__year=now.year,
            updated_at__month=now.month
        ).count()
        delivered_week = deliveries.filter(
            statut="livre",
            updated_at__gte=now - timedelta(days=7)
        ).count()

        # Calcul des KPI timeline glissante
        months_fr = ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin",
                     "Juil", "Août", "Sept", "Oct", "Nov", "Déc"]
        timeline = []
        for i in range(3, -1, -1):
            dt = now - timedelta(days=i * 7)
            label = f"{dt.day:02d} {months_fr[dt.month - 1]}"
            count = MouvementStock.objects.filter(
                type_mouvement="restock",
                created_at__date__lte=dt.date()
            ).count()
            timeline.append({"label": label, "value": count})

        data = {
            "total_stock": total_qty,
            "out_of_stock_count": out_of_stock,
            "low_stock_count": low_stock,
            "orders_to_ship": to_ship,
            "orders_in_transit": in_transit,
            "delivered_this_month": delivered_month,
            "delivered_this_week": delivered_week,
            "timeline": timeline,
        }
        return Response({"success": True, "data": data, "error": None})


class StockListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_manager_or_admin(request.user):
            return Response({"success": False, "data": None, "error": "Accès refusé."}, status=403)

        qs = StockOuvrage.objects.select_related("ouvrage", "entrepot").all()

        # Filtres
        warehouse = request.query_params.get("warehouse")
        country = request.query_params.get("country")
        status_filter = request.query_params.get("status")
        search = request.query_params.get("search")

        if warehouse:
            qs = qs.filter(entrepot__code=warehouse)
        if country:
            qs = qs.filter(entrepot__pays__icontains=country)
        if search:
            qs = qs.filter(ouvrage__title__icontains=search)

        items = []
        for s in qs:
            item_status = s.statut
            if status_filter and status_filter != "all" and item_status != status_filter:
                continue
            items.append({
                "id": str(s.id),
                "isbn": s.ouvrage.isbn,
                "title": s.ouvrage.title,
                "cover_url": s.ouvrage.cover_url,
                "warehouse": s.entrepot.code,
                "warehouse_nom": s.entrepot.nom,
                "pays": s.entrepot.pays,
                "ville": s.entrepot.ville,
                "quantite_reelle": s.quantite_reelle,
                "quantite_reservee": s.quantite_reservee,
                "quantite_disponible": s.quantite_disponible,
                "seuil_alerte": s.seuil_alerte,
                "statut": item_status,
                "last_restock_at": s.last_restock_at.isoformat() if s.last_restock_at else None,
            })

        return Response({"success": True, "data": items, "error": None})


class StockDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if not _is_manager_or_admin(request.user):
            return Response({"success": False, "data": None, "error": "Accès refusé."}, status=403)
        try:
            s = StockOuvrage.objects.select_related("ouvrage", "entrepot").get(pk=pk)
        except StockOuvrage.DoesNotExist:
            return Response({"success": False, "data": None, "error": "Stock introuvable."}, status=404)

        mouvements = MouvementStock.objects.filter(stock=s).order_by("-created_at")[:15]
        data = {
            "id": str(s.id),
            "isbn": s.ouvrage.isbn,
            "title": s.ouvrage.title,
            "cover_url": s.ouvrage.cover_url,
            "warehouse": s.entrepot.code,
            "warehouse_nom": s.entrepot.nom,
            "pays": s.entrepot.pays,
            "ville": s.entrepot.ville,
            "quantite_reelle": s.quantite_reelle,
            "quantite_reservee": s.quantite_reservee,
            "quantite_disponible": s.quantite_disponible,
            "seuil_alerte": s.seuil_alerte,
            "statut": s.statut,
            "last_restock_at": s.last_restock_at.isoformat() if s.last_restock_at else None,
            "recent_movements": [
                {
                    "id": str(m.id),
                    "type_mouvement": m.type_mouvement,
                    "quantite": m.quantite,
                    "reference_document": m.reference_document,
                    "motif": m.motif,
                    "created_at": m.created_at.isoformat(),
                    "created_by": m.auteur.get_full_name() if m.auteur else "Système",
                }
                for m in mouvements
            ],
        }
        return Response({"success": True, "data": data, "error": None})

    def patch(self, request, pk):
        """Mise à jour du seuil d'alerte."""
        if not _is_manager_or_admin(request.user):
            return Response({"success": False, "data": None, "error": "Accès refusé."}, status=403)
        try:
            s = StockOuvrage.objects.get(pk=pk)
        except StockOuvrage.DoesNotExist:
            return Response({"success": False, "data": None, "error": "Stock introuvable."}, status=404)

        seuil = request.data.get("seuil_alerte")
        if seuil is not None:
            try:
                s.seuil_alerte = int(seuil)
                s.save(update_fields=["seuil_alerte"])
            except (ValueError, TypeError):
                return Response({"success": False, "data": None, "error": "Seuil invalide."}, status=400)

        return Response({"success": True, "data": {"seuil_alerte": s.seuil_alerte}, "error": None})


class StockRestockView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        if not _is_manager_or_admin(request.user):
            return Response({"success": False, "data": None, "error": "Accès refusé."}, status=403)

        stock_id = request.data.get("stock_id")
        ouvrage_id = request.data.get("ouvrage_id")
        quantite = request.data.get("quantite")
        reference = request.data.get("reference_document", "")

        if not quantite:
            return Response({"success": False, "data": None, "error": "quantite est requis."}, status=400)

        if not stock_id and not ouvrage_id:
            return Response({"success": False, "data": None, "error": "stock_id ou ouvrage_id est requis."}, status=400)

        try:
            qty = int(quantite)
            if qty <= 0:
                raise ValueError
        except (ValueError, TypeError):
            return Response({"success": False, "data": None, "error": "Quantité invalide."}, status=400)

        # Résolution du StockOuvrage
        s = None
        if stock_id:
            try:
                s = StockOuvrage.objects.select_for_update().get(pk=stock_id)
            except StockOuvrage.DoesNotExist:
                return Response({"success": False, "data": None, "error": "Stock introuvable."}, status=404)
        elif ouvrage_id:
            # Création automatique du StockOuvrage si inexistant
            from apps.catalog.models import Ouvrage
            try:
                ouvrage = Ouvrage.objects.get(id=ouvrage_id)
            except Ouvrage.DoesNotExist:
                return Response({"success": False, "data": None, "error": "Ouvrage introuvable."}, status=404)

            entrepot = Entrepot.objects.filter(is_active=True).first()
            if not entrepot:
                entrepot = Entrepot.objects.create(
                    nom="Entrepôt Principal LAHA Cotonou",
                    code="WAR-CTN-01",
                    pays="Bénin",
                    ville="Cotonou",
                    adresse="Siège LAHA Éditions, Cotonou",
                    is_active=True
                )

            s, created = StockOuvrage.objects.select_for_update().get_or_create(
                ouvrage=ouvrage,
                entrepot=entrepot,
                defaults={
                    'quantite_reelle': 0,
                    'quantite_reservee': 0,
                    'seuil_alerte': 10
                }
            )

        s.quantite_reelle = F("quantite_reelle") + qty
        s.last_restock_at = timezone.now()
        s.save(update_fields=["quantite_reelle", "last_restock_at"])

        MouvementStock.objects.create(
            stock=s,
            type_mouvement="restock",
            quantite=qty,
            reference_document=reference,
            auteur=request.user,
        )

        s.refresh_from_db()
        return Response({"success": True, "data": {"quantite_reelle": s.quantite_reelle, "statut": s.statut}, "error": None})


class StockManualExitView(APIView):
    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request):
        if not _is_manager_or_admin(request.user):
            return Response({"success": False, "data": None, "error": "Accès refusé."}, status=403)

        stock_id = request.data.get("stock_id")
        quantite = request.data.get("quantite")
        motif = request.data.get("motif", "")
        type_mouvement = request.data.get("type_mouvement", "manual_exit")

        if not stock_id or not quantite:
            return Response({"success": False, "data": None, "error": "stock_id et quantite sont requis."}, status=400)

        try:
            s = StockOuvrage.objects.select_for_update().get(pk=stock_id)
        except StockOuvrage.DoesNotExist:
            return Response({"success": False, "data": None, "error": "Stock introuvable."}, status=404)

        try:
            qty = int(quantite)
            if qty <= 0:
                raise ValueError
        except (ValueError, TypeError):
            return Response({"success": False, "data": None, "error": "Quantité invalide."}, status=400)

        if s.quantite_disponible < qty:
            return Response({
                "success": False,
                "data": None,
                "error": f"Stock insuffisant. Disponible : {s.quantite_disponible} exemplaire(s)."
            }, status=400)

        s.quantite_reelle = F("quantite_reelle") - qty
        s.save(update_fields=["quantite_reelle"])

        MouvementStock.objects.create(
            stock=s,
            type_mouvement=type_mouvement,
            quantite=-qty,
            motif=motif,
            auteur=request.user,
        )

        s.refresh_from_db()
        return Response({"success": True, "data": {"quantite_reelle": s.quantite_reelle, "statut": s.statut}, "error": None})


class StockMovementsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_manager_or_admin(request.user):
            return Response({"success": False, "data": None, "error": "Accès refusé."}, status=403)

        qs = MouvementStock.objects.select_related("stock__ouvrage", "stock__entrepot", "auteur").order_by("-created_at")

        stock_id = request.query_params.get("stock_id")
        if stock_id:
            qs = qs.filter(stock__id=stock_id)

        data = [
            {
                "id": str(m.id),
                "title": m.stock.ouvrage.title,
                "isbn": m.stock.ouvrage.isbn,
                "warehouse": m.stock.entrepot.code,
                "pays": m.stock.entrepot.pays,
                "type_mouvement": m.type_mouvement,
                "quantite": m.quantite,
                "reference_document": m.reference_document,
                "motif": m.motif,
                "created_at": m.created_at.isoformat(),
                "created_by": m.auteur.get_full_name() if m.auteur else "Système",
            }
            for m in qs[:100]
        ]
        return Response({"success": True, "data": data, "error": None})


class StockAlertsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_manager_or_admin(request.user):
            return Response({"success": False, "data": None, "error": "Accès refusé."}, status=403)

        stocks = StockOuvrage.objects.select_related("ouvrage", "entrepot").all()
        alerts = [
            {
                "id": str(s.id),
                "isbn": s.ouvrage.isbn,
                "title": s.ouvrage.title,
                "cover_url": s.ouvrage.cover_url,
                "warehouse": s.entrepot.code,
                "warehouse_nom": s.entrepot.nom,
                "pays": s.entrepot.pays,
                "quantite_disponible": s.quantite_disponible,
                "seuil_alerte": s.seuil_alerte,
                "statut": s.statut,
                "last_restock_at": s.last_restock_at.isoformat() if s.last_restock_at else None,
            }
            for s in stocks
            if s.statut in ("out_of_stock", "low_stock")
        ]
        return Response({"success": True, "data": alerts, "error": None})


class DeliveriesListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_manager_or_admin(request.user):
            return Response({"success": False, "data": None, "error": "Accès refusé."}, status=403)

        qs = PhysicalDelivery.objects.select_related("commande__user").all().order_by("-created_at")

        statut_filter = request.query_params.get("statut")
        if statut_filter:
            qs = qs.filter(statut=statut_filter)

        data = [
            {
                "id": str(d.id),
                "commande_id": str(d.commande_id),
                "client_nom": d.commande.user.get_full_name() if d.commande.user else "—",
                "client_email": d.commande.user.email if d.commande.user else "—",
                "shipping_address": d.shipping_address,
                "city": d.city,
                "country": d.country,
                "carrier_name": d.carrier_name,
                "tracking_number": d.tracking_number,
                "statut": d.statut,
                "created_at": d.created_at.isoformat(),
                "updated_at": d.updated_at.isoformat(),
            }
            for d in qs
        ]
        return Response({"success": True, "data": data, "error": None})


class DeliveryDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        if not _is_manager_or_admin(request.user):
            return Response({"success": False, "data": None, "error": "Accès refusé."}, status=403)
        try:
            d = PhysicalDelivery.objects.select_related("commande__user").get(pk=pk)
        except PhysicalDelivery.DoesNotExist:
            return Response({"success": False, "data": None, "error": "Livraison introuvable."}, status=404)

        lignes = d.commande.lignes.select_related('ouvrage').filter(format_type='paper')
        items = [
            {
                "id": str(l.id),
                "book_title": l.ouvrage.title,
                "isbn": l.ouvrage.isbn or "—",
                "quantity": l.quantity,
            }
            for l in lignes
        ]

        data = {
            "id": str(d.id),
            "commande_id": str(d.commande_id),
            "client_nom": d.commande.user.get_full_name() if d.commande.user else "—",
            "client_email": d.commande.user.email if d.commande.user else "—",
            "shipping_address": d.shipping_address,
            "city": d.city,
            "country": d.country,
            "carrier_name": d.carrier_name,
            "tracking_number": d.tracking_number,
            "statut": d.statut,
            "created_at": d.created_at.isoformat(),
            "updated_at": d.updated_at.isoformat(),
            "date_livraison_souhaitee": d.date_livraison_souhaitee.isoformat() if d.date_livraison_souhaitee else None,
            "plage_horaire_debut": d.plage_horaire_debut.strftime("%H:%M") if d.plage_horaire_debut else None,
            "plage_horaire_fin": d.plage_horaire_fin.strftime("%H:%M") if d.plage_horaire_fin else None,
            "items": items,
        }

        notifications_list = []
        try:
            from apps.reporting.models import Notification
            notifs = Notification.objects.filter(
                user=d.commande.user,
                resource_id=str(d.commande_id),
                notification_type__in=['order_shipped', 'order_delivered']
            ).order_by('created_at')
            for n in notifs:
                notifications_list.append({
                    "id": str(n.id),
                    "type": "shipment" if n.notification_type == "order_shipped" else "delivery",
                    "sent_at": n.created_at.isoformat(),
                    "recipient_email": d.commande.user.email if d.commande.user else "",
                })
        except Exception:
            pass
        data["notifications"] = notifications_list

        return Response({"success": True, "data": data, "error": None})

    def patch(self, request, pk):
        """Mise à jour statut, transporteur et numéro de suivi. Notifie le client et
        clôture automatiquement la commande à la livraison."""
        if not _is_manager_or_admin(request.user):
            return Response({"success": False, "data": None, "error": "Accès refusé."}, status=403)
        try:
            d = PhysicalDelivery.objects.select_related('commande__user').get(pk=pk)
        except PhysicalDelivery.DoesNotExist:
            return Response({"success": False, "data": None, "error": "Livraison introuvable."}, status=404)

        previous_statut = d.statut

        allowed = ["statut", "carrier_name", "tracking_number", "shipping_address", "city", "country"]
        for field in allowed:
            val = request.data.get(field)
            if val is not None:
                setattr(d, field, val)
        d.save()

        # Notification client + clôture de commande sur transition de statut réelle
        if d.statut != previous_statut and d.commande.user:
            from apps.reporting.services import notify_user
            from apps.reporting.models import Notification

            if d.statut == 'expedie':
                try:
                    notify_user(
                        user=d.commande.user,
                        notification_type=Notification.NotificationType.ORDER_SHIPPED,
                        title="Votre commande a été expédiée",
                        message=(
                            f"Votre commande #{str(d.commande_id)[:8]} a été expédiée"
                            + (f" via {d.carrier_name}" if d.carrier_name else "")
                            + (f" (suivi : {d.tracking_number})" if d.tracking_number else "")
                            + "."
                        ),
                        action_url="/student/orders",
                        resource_id=str(d.commande_id),
                    )
                except Exception:
                    pass

            elif d.statut == 'livre':
                d.commande.statut_commande = 'completed'
                d.commande.save(update_fields=['statut_commande'])
                try:
                    notify_user(
                        user=d.commande.user,
                        notification_type=Notification.NotificationType.ORDER_DELIVERED,
                        title="Votre commande a été livrée",
                        message=f"Votre commande #{str(d.commande_id)[:8]} a été livrée avec succès. Merci de votre confiance !",
                        action_url="/student/orders",
                        resource_id=str(d.commande_id),
                    )
                except Exception:
                    pass

        return Response({
            "success": True,
            "data": {
                "id": str(d.id),
                "statut": d.statut,
                "commande_statut": d.commande.statut_commande,
            },
            "error": None
        })


class EntrepotsListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_manager_or_admin(request.user):
            return Response({"success": False, "data": None, "error": "Accès refusé."}, status=403)

        entrepots = Entrepot.objects.filter(is_active=True).order_by("pays", "nom")
        data = [
            {
                "id": str(e.id),
                "code": e.code,
                "nom": e.nom,
                "pays": e.pays,
                "ville": e.ville,
                "adresse": e.adresse,
                "responsable_nom": e.responsable_nom,
                "telephone": e.telephone,
            }
            for e in entrepots
        ]
        return Response({"success": True, "data": data, "error": None})


class StockEscalateView(APIView):
    """Escalade une alerte de rupture vers l'administrateur."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not _is_manager_or_admin(request.user):
            return Response({"success": False, "data": None, "error": "Accès refusé."}, status=403)

        stock_id = request.data.get("stock_id")
        impact_description = request.data.get("impact_description", "")

        if not stock_id:
            return Response({"success": False, "data": None, "error": "stock_id est requis."}, status=400)

        try:
            s = StockOuvrage.objects.select_related("ouvrage", "entrepot").get(pk=stock_id)
        except StockOuvrage.DoesNotExist:
            return Response({"success": False, "data": None, "error": "Stock introuvable."}, status=404)

        # Crée un mouvement de type "adjustment" pour traçabilité
        MouvementStock.objects.create(
            stock=s,
            type_mouvement="adjustment",
            quantite=0,
            motif=f"[ESCALADE ADMIN] {impact_description}",
            auteur=request.user,
        )

        data = {
            "id": str(s.id),
            "book_title": s.ouvrage.title,
            "isbn": s.ouvrage.isbn,
            "warehouse": s.entrepot.code,
            "escalated_at": timezone.now().isoformat(),
            "impact_description": impact_description,
        }
        return Response({"success": True, "data": data, "error": None})


class ManagerReportExportView(APIView):
    """
    GET /api/v1/commerce/manager/reports/export/?type=<report_id>&format=csv&period=<period>
    Génère un export CSV réel des rapports stock/livraison du Gestionnaire (sans données financières).
    """
    permission_classes = [IsAuthenticated]

    def perform_content_negotiation(self, request, force=False):
        from rest_framework import renderers
        return (renderers.JSONRenderer(), renderers.JSONRenderer.media_type)

    def get(self, request):
        try:
            if not _is_manager_or_admin(request.user):
                return Response({"success": False, "data": None, "error": "Accès refusé."}, status=403)

            report_type = request.query_params.get("type", "stock-quantities")
            fmt = request.query_params.get("format", "csv")

            if fmt != "csv":
                return Response(
                    {"success": False, "error": f"Format '{fmt}' non encore disponible. Seul CSV est actuellement pris en charge."},
                    status=status.HTTP_501_NOT_IMPLEMENTED
                )

            import csv
            from django.http import HttpResponse

            response = HttpResponse(content_type="text/csv; charset=utf-8")
            filename = f"lahatheque_{report_type}_{timezone.now().strftime('%Y%m%d')}.csv"
            response["Content-Disposition"] = f'attachment; filename="{filename}"'
            writer = csv.writer(response)

            if report_type == "stock-quantities":
                writer.writerow(["ISBN", "Titre", "Entrepôt", "Pays", "Quantité Réelle", "Quantité Réservée", "Seuil Alerte", "Statut"])
                stocks = StockOuvrage.objects.select_related("ouvrage", "entrepot").all()
                for s in stocks:
                    writer.writerow([
                        s.ouvrage.isbn, s.ouvrage.title, s.entrepot.nom, s.entrepot.pays,
                        s.quantite_reelle, s.quantite_reservee, s.seuil_alerte, s.statut
                    ])

            elif report_type == "stock-movements":
                writer.writerow(["Date", "Ouvrage", "Entrepôt", "Type", "Quantité", "Motif", "Initié par"])
                mouvements = MouvementStock.objects.select_related("stock__ouvrage", "stock__entrepot", "auteur").order_by("-created_at")[:500]
                for m in mouvements:
                    auteur_nom = f"{m.auteur.first_name} {m.auteur.last_name}".strip() if m.auteur else "Système"
                    writer.writerow([
                        m.created_at.strftime("%Y-%m-%d %H:%M"), m.stock.ouvrage.title if m.stock and m.stock.ouvrage else "N/A",
                        m.stock.entrepot.nom if m.stock and m.stock.entrepot else "N/A",
                        m.type_mouvement, m.quantite, m.motif or m.reference_document or "", auteur_nom
                    ])

            elif report_type == "stock-alerts":
                writer.writerow(["ISBN", "Titre", "Entrepôt", "Quantité Disponible", "Seuil Alerte", "Statut"])
                stocks = StockOuvrage.objects.select_related("ouvrage", "entrepot").all()
                for s in stocks:
                    if s.statut in ("out_of_stock", "low_stock"):
                        writer.writerow([
                            s.ouvrage.isbn, s.ouvrage.title, s.entrepot.nom,
                            s.quantite_disponible, s.seuil_alerte, s.statut
                        ])

            elif report_type == "delivery-by-status":
                writer.writerow(["Référence Commande", "Client", "Statut", "Ville", "Pays", "Créée le"])
                deliveries = PhysicalDelivery.objects.select_related("commande__user").all().order_by("-created_at")[:500]
                for d in deliveries:
                    client = f"{d.commande.user.first_name} {d.commande.user.last_name}".strip() if d.commande and d.commande.user else "—"
                    writer.writerow([str(d.commande_id), client, d.statut, d.city, d.country, d.created_at.strftime("%Y-%m-%d")])

            elif report_type == "delivery-by-carrier":
                writer.writerow(["Transporteur", "Nombre de Commandes", "Statut"])
                from django.db.models import Count
                carriers = PhysicalDelivery.objects.exclude(carrier_name="").values("carrier_name", "statut").annotate(count=Count("id"))
                for c in carriers:
                    writer.writerow([c["carrier_name"], c["count"], c["statut"]])

            elif report_type == "delivery-delays":
                writer.writerow(["Référence Commande", "Créée le", "Mise à jour le", "Délai (jours)"])
                deliveries = PhysicalDelivery.objects.filter(statut="livre").order_by("-updated_at")[:500]
                for d in deliveries:
                    delay_days = (d.updated_at - d.created_at).days
                    writer.writerow([
                        str(d.commande_id), d.created_at.strftime("%Y-%m-%d"),
                        d.updated_at.strftime("%Y-%m-%d"), delay_days
                    ])

            else:
                writer.writerow(["Type de rapport non reconnu", report_type])

            return response
        except Exception as exc:
            import traceback
            print("EXCEPTION IN EXPORT GET:", type(exc), exc)
            traceback.print_exc()
            raise exc


class AvailableBooksForStockView(APIView):
    """
    GET /api/v1/commerce/manager/stock/available-books/
    Retourne tous les ouvrages publiés avec leur stock actuel par entrepôt.
    Si un ouvrage n'a pas de StockOuvrage, il est marqué comme "nouveau" (stock 0).
    Permet au gestionnaire de réassortir n'importe quel livre publié.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_manager_or_admin(request.user):
            return Response({"success": False, "error": "Accès refusé."}, status=403)

        from apps.catalog.models import Ouvrage

        search = request.query_params.get("search", "").strip()
        ouvrages = Ouvrage.objects.filter(status='published').select_related(
            'discipline', 'institution'
        ).prefetch_related('authors').order_by('title')

        if search:
            ouvrages = ouvrages.filter(title__icontains=search)

        entrepot = Entrepot.objects.filter(is_active=True).first()
        if not entrepot:
            entrepot = Entrepot.objects.first()

        result = []
        for ouvrage in ouvrages:
            stock = StockOuvrage.objects.filter(ouvrage=ouvrage, entrepot=entrepot).first() if entrepot else None

            authors_str = ""
            if ouvrage.pk:
                try:
                    authors_str = ", ".join(
                        [f"{a.first_name} {a.last_name}".strip() for a in ouvrage.authors.all()]
                    )
                except Exception:
                    pass

            result.append({
                "ouvrage_id": str(ouvrage.id),
                "stock_id": str(stock.id) if stock else None,
                "title": ouvrage.title,
                "isbn": ouvrage.isbn or "",
                "authors": authors_str,
                "cover_url": ouvrage.cover_url,
                "discipline": ouvrage.discipline.name if ouvrage.discipline else "",
                "format_type": ouvrage.format_type,
                "warehouse": entrepot.code if entrepot else "",
                "warehouse_nom": entrepot.nom if entrepot else "",
                "quantite_reelle": stock.quantite_reelle if stock else 0,
                "quantite_disponible": stock.quantite_disponible if stock else 0,
                "seuil_alerte": stock.seuil_alerte if stock else 10,
                "is_new_stock": stock is None,
            })

        return Response({"success": True, "data": result})


class InstitutionalDeliveriesView(APIView):
    """
    GET /api/v1/commerce/manager/deliveries/institutional/
    Vue fusionnée : commandes papier universités + grossistes en attente de traitement,
    invisibles autrement dans le flux de livraison standard (Order/PhysicalDelivery).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_manager_or_admin(request.user):
            return Response({"success": False, "data": None, "error": "Accès refusé."}, status=403)

        from apps.partners.models import UniversityPaperOrder
        from .models import WholesaleOrder

        results = []

        for o in UniversityPaperOrder.objects.exclude(status__in=['delivered', 'cancelled']).select_related('institution'):
            results.append({
                "id": str(o.id),
                "source": "university",
                "reference": o.order_number,
                "client_nom": o.institution.name,
                "destination": o.delivery_campus,
                "contact": f"{o.contact_person} — {o.contact_phone}",
                "items": o.items,
                "total_amount": float(o.total_amount),
                "statut": o.status,
                "tracking_number": o.tracking_number,
                "created_at": o.created_at.isoformat(),
            })

        for o in WholesaleOrder.objects.filter(total_print_copies__gt=0).exclude(
            status__in=['delivered', 'cancelled']
        ):
            results.append({
                "id": str(o.id),
                "source": "wholesaler",
                "reference": o.reference,
                "client_nom": o.company_name,
                "destination": o.delivery_address,
                "contact": o.contact_phone,
                "items": [],
                "total_amount": float(o.total_amount),
                "statut": o.status,
                "tracking_number": getattr(o, 'tracking_number', ''),
                "created_at": o.created_at.isoformat(),
            })

        results.sort(key=lambda x: x["created_at"], reverse=True)
        return Response({"success": True, "data": results, "error": None})

    def patch(self, request):
        """Met à jour le statut d'une commande université ou grossiste et notifie le client."""
        if not _is_manager_or_admin(request.user):
            return Response({"success": False, "data": None, "error": "Accès refusé."}, status=403)

        source = request.data.get("source")
        order_id = request.data.get("id")
        new_status = request.data.get("statut")
        tracking_number = request.data.get("tracking_number", "")

        if not source or not order_id or not new_status:
            return Response({"success": False, "error": "source, id et statut sont requis."}, status=400)

        from apps.partners.models import UniversityPaperOrder
        from .models import WholesaleOrder
        from apps.reporting.services import notify_user
        from apps.reporting.models import Notification

        if source == "university":
            try:
                order = UniversityPaperOrder.objects.select_related('institution__user').get(id=order_id)
            except UniversityPaperOrder.DoesNotExist:
                return Response({"success": False, "error": "Commande introuvable."}, status=404)

            order.status = new_status
            if tracking_number:
                order.tracking_number = tracking_number
            order.save()

            recipient = getattr(order.institution, 'user', None)
            if recipient and new_status in ('in_transit', 'delivered'):
                try:
                    label = "expédiée" if new_status == "in_transit" else "livrée"
                    notify_user(
                        user=recipient,
                        notification_type=Notification.NotificationType.ORDER_SHIPPED if new_status == "in_transit" else Notification.NotificationType.ORDER_DELIVERED,
                        title=f"Commande {order.order_number} {label}",
                        message=f"Votre commande de livres papier « {order.order_number} » a été {label}.",
                        action_url="/university/purchases",
                        resource_id=str(order.id),
                    )
                except Exception:
                    pass

        elif source == "wholesaler":
            try:
                order = WholesaleOrder.objects.select_related('user').get(id=order_id)
            except WholesaleOrder.DoesNotExist:
                return Response({"success": False, "error": "Commande introuvable."}, status=404)

            order.status = new_status
            order.save()

            if new_status in ('shipped', 'delivered'):
                try:
                    label = "expédiée" if new_status == "shipped" else "livrée"
                    notify_user(
                        user=order.user,
                        notification_type=Notification.NotificationType.ORDER_SHIPPED if new_status == "shipped" else Notification.NotificationType.ORDER_DELIVERED,
                        title=f"Commande {order.reference} {label}",
                        message=f"Votre commande grossiste « {order.reference} » a été {label}.",
                        action_url="/wholesaler/orders",
                        resource_id=str(order.id),
                    )
                except Exception:
                    pass
        else:
            return Response({"success": False, "error": "source invalide (university ou wholesaler)."}, status=400)

        return Response({"success": True, "data": {"id": order_id, "statut": new_status}, "error": None})

