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
        quantite = request.data.get("quantite")
        reference = request.data.get("reference_document", "")

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
        }
        return Response({"success": True, "data": data, "error": None})

    def patch(self, request, pk):
        """Mise à jour statut, transporteur et numéro de suivi."""
        if not _is_manager_or_admin(request.user):
            return Response({"success": False, "data": None, "error": "Accès refusé."}, status=403)
        try:
            d = PhysicalDelivery.objects.get(pk=pk)
        except PhysicalDelivery.DoesNotExist:
            return Response({"success": False, "data": None, "error": "Livraison introuvable."}, status=404)

        allowed = ["statut", "carrier_name", "tracking_number", "shipping_address", "city", "country"]
        for field in allowed:
            val = request.data.get(field)
            if val is not None:
                setattr(d, field, val)
        d.save()

        return Response({"success": True, "data": {"id": str(d.id), "statut": d.statut}, "error": None})


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

        # Crée un mouvement de type "escalade" pour traçabilité
        MouvementStock.objects.create(
            stock=s,
            type_mouvement="correction",
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

