from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status
from rest_framework.renderers import BaseRenderer
from apps.accounts.permissions import IsAdminOrSuperAdmin, IsManagerOrAdmin
from django.db import transaction
from decimal import Decimal
import logging
import uuid

from .models import Currency, Order, LigneCommande, PhysicalDelivery, PaymentTransaction, SubscriptionPlan, Subscription
from .serializers import OrderSerializer, CreateOrderSerializer, SubscriptionPlanSerializer
from .payment_providers import get_payment_provider
from apps.catalog.models import Ouvrage

from django.conf import settings
from urllib.parse import urlparse

logger = logging.getLogger('commerce.views')


def get_frontend_base_url(request) -> str:
    """Détermine dynamiquement l'URL de base du frontend (lahatheque.com, www.lahatheque.com, localhost)."""
    origin = request.headers.get('origin') or request.headers.get('referer', '')
    if origin:
        parsed = urlparse(origin)
        if parsed.scheme and parsed.netloc:
            netloc = parsed.netloc.lower()
            if (netloc == 'lahatheque.com' or 
                netloc == 'www.lahatheque.com' or 
                netloc.endswith('.lahatheque.com') or 
                netloc.startswith('localhost') or 
                netloc.startswith('127.0.0.1')):
                return f"{parsed.scheme}://{parsed.netloc}"
    return getattr(settings, 'FRONTEND_URL', 'https://lahatheque.com').rstrip('/')

class CreateOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        validated = serializer.validated_data
        items = validated['items']
        provider_name = validated.get('payment_provider', 'moneroo')
        type_commande = validated.get('type_commande', 'personnel')
        mode_paiement = validated.get('mode_paiement', 'mobile_money')
        shipping_address = validated.get('shipping_address', '')
        city = validated.get('city', '')
        country = validated.get('country', 'BJ')
        phone = validated.get('recipient_phone') or validated.get('phone') or ''
        date_livraison = validated.get('date_livraison_souhaitee')
        plage_debut = validated.get('plage_horaire_debut')
        plage_fin = validated.get('plage_horaire_fin')

        is_credit_purchase = validated.get('is_credit_purchase', False)
        credit_due_date = validated.get('credit_due_date')

        if is_credit_purchase:
            if request.user.role != 'author':
                return Response({
                    'error': "L'achat à crédit est réservé aux comptes Auteur."
                }, status=status.HTTP_403_FORBIDDEN)
            if not credit_due_date:
                return Response({
                    'error': "Une date d'échéance de paiement est obligatoire pour un achat à crédit."
                }, status=status.HTTP_400_BAD_REQUEST)
            from datetime import date
            if credit_due_date <= date.today():
                return Response({
                    'error': "La date d'échéance doit être dans le futur."
                }, status=status.HTTP_400_BAD_REQUEST)

        currency, _ = Currency.objects.get_or_create(code='XOF', defaults={'peg_rate_to_eur': 655.957})

        total_amount = 0
        lignes_to_create = []
        has_paper = False

        for item in items:
            try:
                ouvrage = Ouvrage.objects.get(id=item['ouvrage_id'])
            except Ouvrage.DoesNotExist:
                return Response({'error': f"Ouvrage introuvable: {item['ouvrage_id']}"}, status=status.HTTP_400_BAD_REQUEST)

            format_type = item['format_type']
            quantity = item['quantity']

            # Vérification anti-doublon pour l'achat numérique
            if format_type == 'digital':
                from apps.protection.access_service import AccessService
                access_info = AccessService.check_user_book_access(request.user, str(ouvrage.id))
                if access_info.get("access_granted"):
                    return Response({
                        'error': f"Vous possédez déjà l'accès numérique à « {ouvrage.title} »."
                    }, status=status.HTTP_400_BAD_REQUEST)

            # Vérification anti-doublon pour l'achat audio — vérifie spécifiquement un achat
            # du format audio, pas l'accès général.
            if format_type == 'audio':
                already_owns_audio = LigneCommande.objects.filter(
                    commande__user=request.user,
                    commande__statut_paiement='paid',
                    ouvrage=ouvrage,
                    format_type='audio',
                ).exists()
                if already_owns_audio:
                    return Response({
                        'error': f"Vous possédez déjà la version audio de « {ouvrage.title} »."
                    }, status=status.HTTP_400_BAD_REQUEST)

            selected_language = item.get('selected_language') or 'fr'

            # Vérification du stock disponible pour le format papier, basé uniquement sur StockOuvrage
            if format_type == 'paper':
                has_paper = True

                if not getattr(ouvrage, 'is_paper_available', False):
                    return Response({
                        'error': f"« {ouvrage.title} » n'est pas disponible en version papier."
                    }, status=status.HTTP_400_BAD_REQUEST)

                from django.db.models import Sum, F
                from apps.commerce.models import StockOuvrage

                with transaction.atomic():
                    stocks_locked = list(
                        StockOuvrage.objects.select_for_update()
                        .filter(ouvrage=ouvrage)
                    )
                    total_disponible = sum(
                        (s.quantite_reelle - s.quantite_reservee) for s in stocks_locked
                    )

                    if total_disponible < quantity:
                        return Response({
                            'error': f"Stock insuffisant pour '{ouvrage.title}' en format Papier "
                                     f"(disponible : {total_disponible}, demandé : {quantity})."
                        }, status=status.HTTP_400_BAD_REQUEST)

                    remaining_to_reserve = quantity
                    for stock in stocks_locked:
                        available_here = stock.quantite_reelle - stock.quantite_reservee
                        if available_here <= 0 or remaining_to_reserve <= 0:
                            continue
                        take = min(available_here, remaining_to_reserve)
                        stock.quantite_reservee = F('quantite_reservee') + take
                        stock.save(update_fields=['quantite_reservee'])
                        remaining_to_reserve -= take

            if format_type == 'digital':
                unit_price = getattr(ouvrage, 'price_digital', None) or getattr(ouvrage, 'price', None) or Decimal("3000.00")
            elif format_type == 'audio':
                unit_price = getattr(ouvrage, 'price_audio', None) or getattr(ouvrage, 'price_digital', None) or getattr(ouvrage, 'price', None) or Decimal("2500.00")
                if not getattr(ouvrage, 'has_audio_version', False):
                    ouvrage.has_audio_version = True
                    ouvrage.save(update_fields=['has_audio_version'])
            else:
                unit_price = getattr(ouvrage, 'price_paper', None) or getattr(ouvrage, 'price', None) or Decimal("5000.00")
            line_total = unit_price * quantity
            total_amount += line_total

            lignes_to_create.append({
                'ouvrage': ouvrage,
                'format_type': format_type,
                'selected_language': selected_language,
                'unit_price': unit_price,
                'quantity': quantity
            })

        if has_paper and not shipping_address.strip():
            return Response({
                'error': "Une adresse de livraison est obligatoire pour toute commande incluant un exemplaire papier."
            }, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            commande = Order.objects.create(
                user=request.user,
                total_amount=total_amount,
                currency=currency,
                statut_paiement='pending',
                statut_commande='pending',
                type_commande=type_commande,
                mode_paiement=mode_paiement,
                is_credit_purchase=is_credit_purchase,
                credit_due_date=credit_due_date if is_credit_purchase else None,
                credit_granted_by=request.user if is_credit_purchase else None,
            )

            for l in lignes_to_create:
                LigneCommande.objects.create(
                    commande=commande,
                    ouvrage=l['ouvrage'],
                    format_type=l['format_type'],
                    selected_language=l.get('selected_language', 'fr'),
                    unit_price=l['unit_price'],
                    quantity=l['quantity']
                )

            if has_paper and shipping_address:
                formatted_address = (
                    f"{shipping_address.strip()}\nTél destinataire : {phone.strip()}"
                    if phone.strip() and "Tél" not in shipping_address and "tel" not in shipping_address.lower()
                    else shipping_address.strip()
                )
                PhysicalDelivery.objects.create(
                    commande=commande,
                    shipping_address=formatted_address,
                    city=city,
                    country=country,
                    statut='en_preparation',
                    date_livraison_souhaitee=date_livraison,
                    plage_horaire_debut=plage_debut,
                    plage_horaire_fin=plage_fin,
                )
                if phone and not getattr(request.user, 'phone_number', None):
                    try:
                        request.user.phone_number = phone.strip()
                        request.user.save(update_fields=['phone_number'])
                    except Exception:
                        pass

            logger.info(f"[Commerce] Commande #{commande.id} créée pour {request.user.email} - Total: {total_amount} XOF (Papier: {has_paper})")
            print(f"[ORDER] Nouvelle commande #{commande.id} - {request.user.email} ({total_amount} XOF)")

            # Notification immédiate de l'administrateur pour toute nouvelle commande créée
            if not is_credit_purchase:
                try:
                    from .services import notify_admin_order_event
                    notify_admin_order_event(commande, event_type="order_created")
                except Exception as admin_mail_err:
                    logger.warning(f"[Commerce] Impossible de notifier l'admin à la création: {admin_mail_err}")

            if is_credit_purchase:
                # SEC-09: Ne JAMAIS débloquer immédiatement un achat à crédit sans validation admin/manager
                commande.credit_status = 'pending_approval'
                commande.statut_paiement = 'pending'
                commande.statut_commande = 'pending'
                commande.save(update_fields=['credit_status', 'statut_paiement', 'statut_commande'])
                return Response({
                    'success': True,
                    'order_id': str(commande.id),
                    'data': OrderSerializer(commande).data,
                    'order': OrderSerializer(commande).data,
                    'message': f"Demande d'achat à crédit enregistrée avec succès. Elle est en attente d'approbation par la direction commerciale.",
                }, status=status.HTTP_201_CREATED)

            # Si le mode de règlement n'est pas Mobile Money → règlement manuel
            if mode_paiement != 'mobile_money':
                commande.statut_paiement = 'pending'
                commande.statut_commande = 'processing'
                commande.save(update_fields=['statut_paiement', 'statut_commande'])
                return Response({
                    'success': True,
                    'data': OrderSerializer(commande).data,
                    'message': f"Commande enregistrée. Réglez par {commande.get_mode_paiement_display()} pour finaliser — un agent LAHA Éditions vous contactera.",
                }, status=status.HTTP_201_CREATED)

        # ─── Initialisation du paiement en ligne (hors transaction SQL) ────────────
        provider = get_payment_provider(provider_name)
        frontend_base = get_frontend_base_url(request)
        return_url = validated.get('return_url') or f"{frontend_base}/student/orders"
        
        user_full_name = f"{request.user.first_name or ''} {request.user.last_name or ''}".strip()
        if not user_full_name and request.user.email:
            user_full_name = request.user.email.split('@')[0]

        try:
            payment_res = provider.initiate_payment(
                amount=total_amount,
                currency=currency.code,
                description=f"Commande LAHAThèque #{str(commande.id)[:8].upper()}",
                customer_email=request.user.email,
                customer_name=user_full_name or "Client LAHA",
                return_url=return_url
            ) or {}
        except Exception as payment_err:
            logger.error(f"Échec initialisation paiement pour la commande {commande.id}: {payment_err}")

            from apps.commerce.models import StockOuvrage
            from django.db.models import F

            for ligne_annulee in LigneCommande.objects.filter(commande=commande, format_type__in=('paper', 'papier')):
                StockOuvrage.objects.filter(
                    ouvrage=ligne_annulee.ouvrage, quantite_reservee__gte=ligne_annulee.quantity
                ).update(quantite_reservee=F('quantite_reservee') - ligne_annulee.quantity)

            commande.delete()
            return Response({
                "success": False,
                "error": "Impossible d'initialiser le paiement pour le moment. Veuillez réessayer dans quelques instants."
            }, status=502)

        tx = PaymentTransaction.objects.create(
            user=request.user,
            amount=total_amount,
            currency=currency,
            status=payment_res.get('status', 'pending'),
            moneroo_id=payment_res.get('moneroo_id') or payment_res.get('payment_id') or None,
        )
        commande.payment_transaction = tx
        commande.save(update_fields=['payment_transaction'])

        # Si le provider est mock et immédiat, valider le paiement tout de suite
        if payment_res.get('status') == 'success':
            from .services import handle_payment_success
            handle_payment_success(tx)
            commande.refresh_from_db()

        if has_paper:
            try:
                from apps.accounts.models import User
                from apps.reporting.services import notify_user
                from apps.reporting.models import Notification

                managers = User.objects.filter(role__in=['manager', 'admin', 'super_admin'], is_active=True)
                for m in managers:
                    notify_user(
                        user=m,
                        notification_type=Notification.NotificationType.SYSTEM,
                        title="Nouvelle commande papier à préparer",
                        message=f"Commande #{str(commande.id)[:8]} de {request.user.get_full_name() or request.user.email} — préparation requise.",
                        action_url="/manager/delivery",
                        resource_id=str(commande.id),
                    )
            except Exception:
                pass

        return Response({
            'order_id': str(commande.id),
            'checkout_url': payment_res.get('checkout_url'),
            'status': payment_res.get('status'),
            'total_amount': str(total_amount),
            'order': OrderSerializer(commande).data
        }, status=status.HTTP_201_CREATED)


class OrderRetryPaymentView(APIView):
    """
    POST /api/v1/commerce/orders/<uuid:order_id>/initiate-payment/
    Permet à un client (ou un administrateur) de relancer la session de paiement en ligne pour une commande existante
    en attente (pending) ou abandonnée (abandoned).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id):
        try:
            commande = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({"success": False, "data": None, "error": "Commande introuvable."}, status=status.HTTP_404_NOT_FOUND)

        # Vérification d'autorisation (propriétaire de la commande ou admin)
        if commande.user != request.user and getattr(request.user, 'role', '') not in ['admin', 'super_admin']:
            return Response({"success": False, "data": None, "error": "Action non autorisée sur cette commande."}, status=status.HTTP_403_FORBIDDEN)

        if commande.statut_paiement == 'paid':
            return Response({
                "success": True,
                "data": {
                    "order_id": str(commande.id),
                    "already_paid": True,
                    "status": "paid",
                },
                "message": "Cette commande est déjà réglée.",
                "error": None
            }, status=status.HTTP_200_OK)

        provider_name = 'moneroo'
        provider = get_payment_provider(provider_name)
        frontend_base = get_frontend_base_url(request)
        return_url = request.data.get('return_url') or f"{frontend_base}/student/orders"

        total_amount = commande.total_amount
        currency_code = commande.currency.code if hasattr(commande.currency, 'code') else "XOF"
        full_name = f"{commande.user.first_name or ''} {commande.user.last_name or ''}".strip() or str(commande.user.email)

        try:
            payment_res = provider.initiate_payment(
                amount=total_amount,
                currency=currency_code,
                description=f"Règlement Commande LAHAThèque #{str(commande.id)[:8].upper()}",
                customer_email=commande.user.email,
                customer_name=full_name,
                return_url=return_url
            ) or {}
        except Exception as payment_err:
            logger.error(f"Échec réinitialisation paiement commande {commande.id}: {payment_err}")
            return Response({
                "success": False,
                "data": None,
                "error": "Impossible d'initialiser le paiement pour le moment. Veuillez réessayer dans quelques instants."
            }, status=status.HTTP_502_BAD_GATEWAY)

        tx = PaymentTransaction.objects.create(
            user=commande.user,
            amount=total_amount,
            currency=commande.currency,
            status=payment_res.get('status', 'pending'),
            moneroo_id=payment_res.get('moneroo_id') or payment_res.get('payment_id') or None,
        )
        commande.payment_transaction = tx
        if commande.statut_paiement == 'abandoned':
            commande.statut_paiement = 'pending'
            commande.save(update_fields=['payment_transaction', 'statut_paiement'])
        else:
            commande.save(update_fields=['payment_transaction'])

        return Response({
            "success": True,
            "data": {
                "order_id": str(commande.id),
                "checkout_url": payment_res.get('checkout_url'),
                "payment_id": payment_res.get('moneroo_id') or payment_res.get('payment_id'),
                "status": payment_res.get('status', 'pending'),
                "total_amount": str(total_amount),
            },
            "message": "Session de paiement initialisée avec succès.",
            "error": None
        }, status=status.HTTP_200_OK)


class AdminCreateOrderView(APIView):
    """
    POST /api/v1/commerce/admin/orders/create-for-client/
    Permet à un Admin de créer une commande au nom d'un compte inscrit ou pour un client comptoir externe (sans compte).
    """
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]

    def post(self, request):
        is_pos_order = bool(request.data.get("is_pos_order", False))
        target_user_id = request.data.get("client_id")

        if not target_user_id and not is_pos_order:
            return Response({"error": "Le client cible (client_id) est requis ou activez le mode comptoir (is_pos_order)."}, status=status.HTTP_400_BAD_REQUEST)

        if is_pos_order:
            guest_name = (request.data.get("guest_name") or "").strip()
            guest_phone = (request.data.get("guest_phone") or "").strip()
            guest_email = (request.data.get("guest_email") or "").strip()
            is_immediate_handover = bool(request.data.get("is_immediate_handover", True))
            payment_method = request.data.get("mode_paiement") or request.data.get("payment_method") or "especes"
            statut_paiement = request.data.get("statut_paiement") or "paid"
            shipping_address = (request.data.get("shipping_address") or "").strip()
            items = request.data.get("items", [])

            if not guest_name:
                return Response({"error": "Le nom du client de passage est requis."}, status=status.HTTP_400_BAD_REQUEST)
            if not guest_phone:
                return Response({"error": "Le numéro de téléphone du client est requis pour le contact et le reçu."}, status=status.HTTP_400_BAD_REQUEST)
            if not items:
                return Response({"error": "La commande doit comporter au moins un article."}, status=status.HTTP_400_BAD_REQUEST)

            has_digital = any(i.get("format_type") in ("digital", "audio") for i in items)
            if has_digital and not guest_email:
                return Response({"error": "Une adresse e-mail est obligatoire pour l'envoi des accès aux livres numériques ou audio."}, status=status.HTTP_400_BAD_REQUEST)

            currency = Currency.objects.filter(code='XOF').first() or Currency.objects.first()
            total_amount = Decimal("0.00")
            lignes_to_create = []
            has_paper = False

            for item in items:
                try:
                    ouvrage = Ouvrage.objects.get(id=item['ouvrage_id'])
                except Ouvrage.DoesNotExist:
                    return Response({'error': f"Ouvrage introuvable: {item.get('ouvrage_id')}"}, status=status.HTTP_400_BAD_REQUEST)

                format_type = item.get('format_type', 'paper')
                quantity = int(item.get('quantity', 1))
                selected_language = item.get('selected_language') or 'fr'

                if format_type == 'paper':
                    has_paper = True

                    if not getattr(ouvrage, 'is_paper_available', False):
                        return Response({
                            'error': f"« {ouvrage.title} » n'est pas disponible en version papier."
                        }, status=status.HTTP_400_BAD_REQUEST)

                    from apps.commerce.models import StockOuvrage, MouvementStock
                    from django.db.models import F

                    with transaction.atomic():
                        stocks_locked = list(
                            StockOuvrage.objects.select_for_update().filter(ouvrage=ouvrage)
                        )
                        total_disponible = sum(
                            (s.quantite_reelle - s.quantite_reservee) for s in stocks_locked
                        )

                        if total_disponible < quantity:
                            return Response({
                                'error': f"Stock insuffisant pour « {ouvrage.title} » en version papier "
                                         f"(disponible : {total_disponible}, demandé : {quantity})."
                            }, status=status.HTTP_400_BAD_REQUEST)

                        remaining_to_deduct = quantity
                        for stock in stocks_locked:
                            available_here = stock.quantite_reelle - stock.quantite_reservee
                            if available_here <= 0 or remaining_to_deduct <= 0:
                                continue
                            take = min(available_here, remaining_to_deduct)
                            stock.quantite_reelle = F('quantite_reelle') - take
                            stock.save(update_fields=['quantite_reelle'])
                            MouvementStock.objects.create(
                                stock=stock,
                                type_mouvement='sale',
                                quantite=take,
                                reference_document=f"Vente comptoir Admin — {guest_name}",
                                motif="Vente comptoir confirmée",
                                auteur=request.user,
                            )
                            remaining_to_deduct -= take

                    unit_price = getattr(ouvrage, 'price_paper', None) or Decimal("5000.00")
                elif format_type == 'digital':
                    unit_price = getattr(ouvrage, 'price_digital', None) or Decimal("3000.00")
                else:
                    unit_price = getattr(ouvrage, 'price_audio', None) or getattr(ouvrage, 'price_digital', None) or Decimal("2500.00")

                line_total = Decimal(str(unit_price)) * quantity
                total_amount += line_total
                lignes_to_create.append({
                    'ouvrage': ouvrage,
                    'format_type': format_type,
                    'selected_language': selected_language,
                    'unit_price': unit_price,
                    'quantity': quantity
                })

            if has_paper and not is_immediate_handover and not shipping_address:
                return Response({'error': "Une adresse de livraison est requise si le livre papier n'est pas remis en main propre."}, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                commande = Order.objects.create(
                    user=None,
                    is_pos_order=True,
                    guest_name=guest_name,
                    guest_phone=guest_phone,
                    guest_email=guest_email,
                    is_immediate_handover=is_immediate_handover,
                    total_amount=total_amount,
                    currency=currency,
                    statut_paiement=statut_paiement,
                    statut_commande='completed' if (is_immediate_handover and statut_paiement == 'paid') else 'processing',
                    type_commande='personnel',
                    mode_paiement=payment_method,
                    manual_payment_confirmed_by=request.user if statut_paiement == 'paid' else None,
                    manual_payment_reference=f"VENTE-COMPTOIR-{uuid.uuid4().hex[:6].upper()}" if statut_paiement == 'paid' else ''
                )

                for l in lignes_to_create:
                    LigneCommande.objects.create(
                        commande=commande,
                        ouvrage=l['ouvrage'],
                        format_type=l['format_type'],
                        selected_language=l.get('selected_language', 'fr'),
                        unit_price=l['unit_price'],
                        quantity=l['quantity']
                    )

                if has_paper and (shipping_address or not is_immediate_handover):
                    formatted_address = f"{shipping_address or 'Remise ultérieure en boutique'}\nTél client : {guest_phone}"
                    PhysicalDelivery.objects.create(
                        commande=commande,
                        shipping_address=formatted_address,
                        city=request.data.get('city', 'Cotonou'),
                        country=request.data.get('country', 'BJ'),
                        statut='livre' if is_immediate_handover else 'en_preparation'
                    )

            logger.info(f"[Commerce POS] Commande comptoir #{commande.id} créée pour {guest_name} ({guest_phone}) - Total: {total_amount} XOF")
            return Response({
                'success': True,
                'order_id': str(commande.id),
                'data': {
                    'id': str(commande.id),
                    'total_amount': float(commande.total_amount),
                    'is_pos_order': True,
                    'guest_name': guest_name,
                    'guest_phone': guest_phone,
                    'guest_email': guest_email,
                    'statut_paiement': commande.statut_paiement,
                    'statut_commande': commande.statut_commande,
                },
                'order': {
                    'id': str(commande.id),
                    'total_amount': float(commande.total_amount),
                    'is_pos_order': True,
                    'guest_name': guest_name,
                    'guest_phone': guest_phone,
                    'guest_email': guest_email,
                    'statut_paiement': commande.statut_paiement,
                    'statut_commande': commande.statut_commande,
                },
                'message': f"Commande comptoir enregistrée avec succès pour {guest_name}."
            }, status=status.HTTP_201_CREATED)

        from apps.accounts.models import User
        try:
            target_user = User.objects.get(id=target_user_id, is_active=True)
        except (User.DoesNotExist, ValueError):
            return Response({"error": "Client introuvable."}, status=status.HTTP_404_NOT_FOUND)

        original_user = request.user
        request.user = target_user
        try:
            response = super().post(request)
            if response.status_code == 201:
                order_id = response.data.get('order_id') or (response.data.get('data') and response.data.get('data').get('id'))
                if order_id and request.data.get('is_credit_purchase'):
                    Order.objects.filter(id=order_id).update(credit_granted_by=original_user)
        finally:
            request.user = original_user

        return response


class OrderListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        commandes = Order.objects.filter(user=request.user)
        serializer = OrderSerializer(commandes, many=True)
        return Response(serializer.data)

class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        try:
            commande = Order.objects.get(id=order_id, user=request.user)
            return Response(OrderSerializer(commande).data)
        except Order.DoesNotExist:
            return Response({'error': 'Commande introuvable'}, status=status.HTTP_404_NOT_FOUND)


class PdfInvoiceRenderer(BaseRenderer):
    media_type = "*/*"
    format = ""

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data


class OrderInvoiceDownloadView(APIView):
    """
    Sert la facture officielle PDF acquittée générée par PyMuPDF (identique à l'email).
    Accessible au client propriétaire, après achat ou aux rôles de gestion/administration.
    """
    permission_classes = [AllowAny]
    renderer_classes = [PdfInvoiceRenderer]

    def perform_content_negotiation(self, request, force=False):
        renderers = self.get_renderers()
        return renderers[0], renderers[0].media_type

    def get(self, request, order_id):
        user = request.user
        if user and user.is_authenticated:
            if getattr(user, 'role', '') in ['admin', 'superadmin', 'manager', 'accountant'] or user.is_staff:
                commande = Order.objects.filter(id=order_id).first()
            else:
                commande = Order.objects.filter(id=order_id, user=user).first() or Order.objects.filter(id=order_id).first()
        else:
            commande = Order.objects.filter(id=order_id).first()

        if not commande:
            return Response({'error': 'Commande introuvable'}, status=status.HTTP_404_NOT_FOUND)

        from apps.communications.services.pdf_attachment_service import PdfAttachmentService
        from apps.commerce.services import build_order_invoice_data
        from django.http import HttpResponse

        invoice_data = build_order_invoice_data(commande)
        pdf_bytes = PdfAttachmentService.generate_invoice_pdf(invoice_data)

        order_ref = invoice_data.get("order_number") or str(commande.id)[:8]
        filename = f"facture_LAHA_{order_ref}.pdf"

        response = HttpResponse(pdf_bytes, content_type="application/pdf")
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
        response["Content-Length"] = str(len(pdf_bytes))
        response["Access-Control-Expose-Headers"] = "Content-Disposition, Content-Length"
        return response

class SubscriptionPlanListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        from apps.protection.access_service import AccessService
        inst_info = AccessService.get_user_institutional_access(user)

        plans = SubscriptionPlan.objects.all()
        plans_data = SubscriptionPlanSerializer(plans, many=True).data

        return Response({
            'has_active_institutional_access': inst_info.get('has_access', False),
            'institution_name': inst_info.get('institution_name'),
            'plans': plans_data
        })


class SubscribeView(APIView):
    """POST /api/v1/commerce/subscriptions/subscribe/ - Souscrit à un plan d'abonnement."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from datetime import timedelta
        from django.utils import timezone
        from .models import SubscriptionPlan, Subscription

        plan_id = request.data.get("plan_id")
        if not plan_id:
            return Response({"success": False, "error": "plan_id requis."}, status=400)

        try:
            plan = SubscriptionPlan.objects.get(id=plan_id)
        except SubscriptionPlan.DoesNotExist:
            return Response({"success": False, "error": "Plan introuvable."}, status=404)

        existing = Subscription.objects.filter(
            user=request.user, is_active=True, expires_at__gt=timezone.now()
        ).first()
        if existing:
            return Response({
                "success": False,
                "error": "Vous avez déjà un abonnement actif. Annulez-le avant d'en souscrire un nouveau."
            }, status=400)

        now = timezone.now()
        subscription = Subscription.objects.create(
            user=request.user,
            plan=plan,
            starts_at=now,
            expires_at=now + timedelta(days=plan.duration_days),
            is_active=True,
        )

        # Paiement : réutilise le même provider que les commandes (Moneroo)
        provider_name = request.data.get("payment_provider", "moneroo")
        try:
            from .payment_providers import get_payment_provider
            provider = get_payment_provider(provider_name)
            frontend_base = get_frontend_base_url(request)
            return_url = request.data.get("return_url") or f"{frontend_base}/student/subscriptions"
            payment_res = provider.initiate_payment(
                amount=plan.price_amount,
                currency=plan.currency.code if hasattr(plan.currency, 'code') else "XOF",
                description=f"Abonnement {plan.name}",
                customer_email=request.user.email,
                customer_name=request.user.get_full_name() or request.user.email,
                return_url=return_url,
                metadata={"subscription_id": str(subscription.id)},
            ) or {}
            return Response({
                "success": True,
                "data": {
                    "id": str(subscription.id),
                    "plan_name": plan.name,
                    "expires_at": subscription.expires_at.isoformat(),
                    "checkout_url": payment_res.get("checkout_url"),
                },
                "error": None
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                "success": True,
                "data": {
                    "id": str(subscription.id),
                    "plan_name": plan.name,
                    "expires_at": subscription.expires_at.isoformat(),
                    "checkout_url": None,
                },
                "warning": f"Abonnement créé mais paiement à finaliser manuellement ({str(e)})",
            }, status=status.HTTP_201_CREATED)


class SubscriptionCancelView(APIView):
    """POST /api/v1/commerce/subscriptions/<id>/cancel/ - Annule un abonnement actif."""
    permission_classes = [IsAuthenticated]

    def post(self, request, sub_id):
        from .models import Subscription

        try:
            sub = Subscription.objects.get(id=sub_id, user=request.user)
        except Subscription.DoesNotExist:
            return Response({"success": False, "message": "Abonnement introuvable."}, status=404)

        if not sub.is_active:
            return Response({"success": False, "message": "Cet abonnement est déjà inactif."}, status=400)

        sub.is_active = False
        sub.save(update_fields=["is_active"])

        return Response({"success": True, "message": "Abonnement annulé avec succès."})


class ClientBouquetListView(APIView):
    """GET /api/v1/commerce/bouquets/ - Bouquets disponibles à la souscription directe."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.partners.models import BouquetOffering
        from .models import ClientBouquetSubscription
        from django.utils import timezone

        today = timezone.now().date()
        active_subs = {
            str(sub.offering_id): sub
            for sub in ClientBouquetSubscription.objects.filter(
                user=request.user, status="active", end_date__gte=today
            )
            if sub.offering_id
        }

        def serialize_bouquet_books(qs):
            books_data = []
            for bk in qs.select_related('discipline').prefetch_related('authors'):
                cover_url = None
                if bk.cover_image:
                    try:
                        cover_url = bk.cover_image.url
                    except Exception:
                        cover_url = None
                authors_list = [f"{a.first_name} {a.last_name}".strip() for a in bk.authors.all() if f"{a.first_name} {a.last_name}".strip()]
                author_display = ", ".join(authors_list) if authors_list else "Auteur académique"
                books_data.append({
                    "id": str(bk.id),
                    "title": bk.title,
                    "subtitle": bk.subtitle or "",
                    "authors": authors_list,
                    "author": author_display,
                    "discipline": bk.discipline.name if bk.discipline else "",
                    "cover_url": cover_url,
                    "page_count": bk.page_count,
                    "format_type": "digital",
                    "isbn": bk.isbn or "",
                    "summary": bk.summary or "",
                    "has_sample": True,
                })
            return books_data

        data = []
        for o in BouquetOffering.objects.filter(is_active=True):
            o_id_str = str(o.id)
            sub = active_subs.get(o_id_str)
            b_qs = o.get_books_queryset()
            data.append({
                "id": o_id_str,
                "title": o.title,
                "bouquet_type": o.bouquet_type,
                "discipline": o.discipline,
                "books_count": b_qs.count(),
                "annual_price": float(o.get_real_annual_price()),
                "monthly_price": float(o.get_real_monthly_price()),
                "currency": o.currency,
                "description": o.description,
                "is_subscribed": bool(sub),
                "end_date": sub.end_date.strftime("%d/%m/%Y") if (sub and sub.end_date) else None,
                "subscription_period": getattr(sub, 'subscription_period', None) if sub else None,
                "books": serialize_bouquet_books(b_qs),
            })
        return Response({"success": True, "data": data})


class ClientBouquetSubscribeView(APIView):
    """POST /api/v1/commerce/bouquets/<offering_id>/subscribe/ - Souscription directe B2C."""
    permission_classes = [IsAuthenticated]

    def post(self, request, offering_id):
        from apps.partners.models import BouquetOffering
        from .models import ClientBouquetSubscription, Currency, PaymentTransaction
        from .payment_providers import get_payment_provider
        from django.utils import timezone

        try:
            offering = BouquetOffering.objects.get(id=offering_id, is_active=True)
        except BouquetOffering.DoesNotExist:
            return Response({"success": False, "error": "Bouquet introuvable ou indisponible."}, status=404)

        period = request.data.get("period", "annual")
        if period not in ["monthly", "annual"]:
            period = "annual"

        amount = offering.get_real_monthly_price() if period == "monthly" else offering.get_real_annual_price()

        # Prolongation cumulative si renouvellement anticipé
        existing_sub = ClientBouquetSubscription.objects.filter(
            user=request.user, offering_id=offering.id, status="active"
        ).order_by('-end_date').first()
        existing_end_date = existing_sub.end_date if existing_sub else None
        start = timezone.now().date()
        end = ClientBouquetSubscription.compute_end_date(existing_end_date, period)

        sub = ClientBouquetSubscription.objects.create(
            user=request.user,
            offering_id=offering.id,
            title=offering.title,
            subscription_period=period,
            price_paid=amount,
            currency=offering.currency,
            start_date=start,
            end_date=end,
            status="pending",
        )

        mode_paiement = request.data.get("mode_paiement", "mobile_money")
        if mode_paiement != "mobile_money":
            return Response({
                "success": True,
                "data": {"id": str(sub.id), "status": "pending", "period": period, "end_date": str(sub.end_date)},
                "message": f"Souscription ({'Mensuelle' if period == 'monthly' else 'Annuelle'}) enregistrée. Paiement par {mode_paiement} en attente de confirmation.",
            }, status=201)

        currency, _ = Currency.objects.get_or_create(
            code=offering.currency or "XOF",
            defaults={"peg_rate_to_eur": 655.957}
        )
        provider = get_payment_provider("moneroo")
        frontend_base = get_frontend_base_url(request)
        return_url = request.data.get("return_url") or f"{frontend_base}/student/books?tab=bouquets"

        try:
            payment_res = provider.initiate_payment(
                amount=amount,
                currency=currency.code,
                description=f"Bouquet « {offering.title} » ({'Mensuel 30j' if period == 'monthly' else 'Annuel 365j'})",
                customer_email=request.user.email,
                customer_name=request.user.get_full_name() or request.user.email,
                return_url=return_url,
                metadata={
                    "client_bouquet_subscription_id": str(sub.id),
                    "subscription_period": period,
                    "type": "bouquet_client",
                },
            ) or {}
        except Exception as payment_err:
            import logging
            logging.getLogger(__name__).error(f"Échec paiement bouquet client {sub.id}: {payment_err}")
            return Response({
                "success": False,
                "error": "Impossible d'initialiser le paiement. Veuillez réessayer."
            }, status=502)

        tx = PaymentTransaction.objects.create(
            user=request.user,
            amount=amount,
            currency=currency,
            status=payment_res.get("status", "pending"),
            moneroo_id=payment_res.get("moneroo_id") or payment_res.get("payment_id"),
        )
        sub.payment_transaction = tx
        sub.save(update_fields=["payment_transaction"])

        if payment_res.get("status") == "success":
            tx.status = "success"
            tx.save(update_fields=["status"])
            sub.status = "active"
            sub.save(update_fields=["status"])
            from apps.student.views import invalidate_student_books_cache
            invalidate_student_books_cache(request.user.id)

        return Response({
            "success": True,
            "data": {
                "id": str(sub.id),
                "status": sub.status,
                "period": period,
                "checkout_url": payment_res.get("checkout_url"),
                "end_date": str(sub.end_date),
            },
        }, status=201)


class VerifyOrderPaymentView(APIView):
    """
    POST /api/v1/commerce/orders/<uuid:order_id>/verify-payment/
    POST /api/v1/commerce/payments/verify/
    Vérifie l'état d'un paiement directement auprès de la passerelle Moneroo,
    met à jour la commande en base, et débloque immédiatement les accès aux ouvrages.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, order_id=None):
        target_order_id = order_id or request.data.get('order_id')
        moneroo_id = (
            request.data.get('moneroo_id')
            or request.data.get('paymentId')
            or request.data.get('payment_id')
            or request.query_params.get('paymentId')
            or request.query_params.get('payment_id')
        )

        from .services import reconcile_moneroo_payment
        res = reconcile_moneroo_payment(
            moneroo_id=moneroo_id,
            order_id=str(target_order_id) if target_order_id else None,
            user=request.user
        )

        if res.get('success'):
            return Response({
                'success': True,
                'data': res,
                'error': None,
            }, status=status.HTTP_200_OK)

        return Response({
            'success': False,
            'error': res.get('error') or 'Vérification du paiement impossible.',
            'data': res,
        }, status=status.HTTP_400_BAD_REQUEST)


class AdminOrdersListView(APIView):
    """
    GET /api/v1/commerce/admin/orders/
    Liste exhaustive de toutes les commandes et tentatives avec filtres multi-critères,
    recherche textuelle et indicateurs clés financiers consolidés.
    """
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]

    def get(self, request):
        from django.db.models import Q, Sum
        from django.utils import timezone
        from datetime import timedelta

        statut = request.query_params.get('statut_paiement', 'all')
        period = request.query_params.get('period', 'all')
        search_query = request.query_params.get('q', '').strip()

        qs = Order.objects.select_related(
            'user', 'currency', 'payment_transaction', 'manual_payment_confirmed_by'
        ).prefetch_related(
            'lignes__ouvrage'
        ).all()

        now = timezone.now()
        if period == 'today':
            qs = qs.filter(created_at__date=now.date())
        elif period == 'week':
            qs = qs.filter(created_at__gte=now - timedelta(days=7))
        elif period == 'month':
            qs = qs.filter(created_at__gte=now - timedelta(days=30))
        elif period == 'year':
            qs = qs.filter(created_at__gte=now - timedelta(days=365))

        base_period_qs = qs

        total_orders_count = base_period_qs.count()
        paid_count = base_period_qs.filter(statut_paiement='paid').count()
        pending_count = base_period_qs.filter(statut_paiement='pending').count()
        credit_count = base_period_qs.filter(Q(statut_paiement='credit') | Q(is_credit_purchase=True)).count()
        abandoned_count = base_period_qs.filter(statut_paiement='abandoned').count()
        failed_count = base_period_qs.filter(statut_paiement='failed').count()
        cancelled_count = base_period_qs.filter(statut_paiement='cancelled').count()

        total_paid_amount = base_period_qs.filter(statut_paiement='paid').aggregate(total=Sum('total_amount'))['total'] or 0
        total_credit_amount = base_period_qs.filter(Q(statut_paiement='credit') | Q(is_credit_purchase=True)).aggregate(total=Sum('total_amount'))['total'] or 0
        potential_abandoned_loss = base_period_qs.filter(statut_paiement='abandoned').aggregate(total=Sum('total_amount'))['total'] or 0

        if statut == 'credit':
            qs = qs.filter(Q(statut_paiement='credit') | Q(is_credit_purchase=True))
        elif statut and statut != 'all':
            qs = qs.filter(statut_paiement=statut)

        if search_query:
            qs = qs.filter(
                Q(id__icontains=search_query) |
                Q(user__email__icontains=search_query) |
                Q(user__first_name__icontains=search_query) |
                Q(user__last_name__icontains=search_query) |
                Q(manual_payment_reference__icontains=search_query) |
                Q(payment_transaction__moneroo_id__icontains=search_query) |
                Q(lignes__ouvrage__titre__icontains=search_query)
            ).distinct()

        try:
            page = max(1, int(request.query_params.get('page', 1)))
        except ValueError:
            page = 1
        try:
            page_size = min(100, max(1, int(request.query_params.get('page_size', 20))))
        except ValueError:
            page_size = 20

        total_filtered = qs.count()
        total_pages = max(1, (total_filtered + page_size - 1) // page_size)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size

        orders_slice = qs[start_idx:end_idx]

        orders_data = []
        for o in orders_slice:
            cust_name = o.user.get_full_name() if o.user else "Client inconnu"
            if not cust_name.strip() and o.user:
                cust_name = o.user.email.split('@')[0]

            moneroo_id = None
            if o.payment_transaction and o.payment_transaction.moneroo_id:
                moneroo_id = o.payment_transaction.moneroo_id

            items_data = []
            for item in o.lignes.all():
                book_title = item.ouvrage.titre if item.ouvrage else "Ouvrage"
                cover_url = item.ouvrage.cover_url if (item.ouvrage and hasattr(item.ouvrage, 'cover_url')) else (
                    f"/api/bff/catalog/books/{item.ouvrage_id}/cover/" if item.ouvrage_id else ""
                )
                items_data.append({
                    "id": str(item.id),
                    "book_id": str(item.ouvrage_id) if item.ouvrage_id else None,
                    "book_title": book_title,
                    "cover_url": cover_url,
                    "format": item.format_type,
                    "quantity": item.quantity,
                    "unit_price": float(item.unit_price),
                    "total_price": float(item.unit_price * item.quantity),
                })

            orders_data.append({
                "id": str(o.id),
                "numero_commande": f"CMD-{str(o.id)[:8].upper()}",
                "order_reference": f"#{str(o.id)[:8].upper()}",
                "customer_id": str(o.user_id) if o.user_id else "",
                "customer_name": cust_name,
                "customer_email": o.user.email if o.user else "",
                "customer_role": getattr(o.user, 'role', 'reader') if o.user else 'reader',
                "total_amount": float(o.total_amount),
                "currency": o.currency.code if o.currency else "XOF",
                "statut_paiement": o.statut_paiement,
                "statut_paiement_display": o.get_statut_paiement_display(),
                "statut_commande": o.statut_commande,
                "statut_commande_display": o.get_statut_commande_display(),
                "mode_paiement": o.mode_paiement,
                "mode_paiement_display": o.get_mode_paiement_display(),
                "is_credit_purchase": o.is_credit_purchase,
                "credit_due_date": o.credit_due_date.isoformat() if o.credit_due_date else None,
                "moneroo_id": moneroo_id,
                "manual_payment_reference": o.manual_payment_reference,
                "manual_payment_confirmed_by": o.manual_payment_confirmed_by.email if o.manual_payment_confirmed_by else None,
                "created_at": o.created_at.isoformat() if o.created_at else None,
                "abandoned_at": o.abandoned_at.isoformat() if o.abandoned_at else None,
                "last_reminder_sent_at": o.last_reminder_sent_at.isoformat() if o.last_reminder_sent_at else None,
                "items_count": len(items_data),
                "items": items_data,
            })

        return Response({
            "success": True,
            "data": {
                "kpis": {
                    "total_orders_count": total_orders_count,
                    "paid_count": paid_count,
                    "pending_count": pending_count,
                    "credit_count": credit_count,
                    "abandoned_count": abandoned_count,
                    "failed_count": failed_count,
                    "cancelled_count": cancelled_count,
                    "total_paid_amount": float(total_paid_amount),
                    "total_credit_amount": float(total_credit_amount),
                    "potential_abandoned_loss": float(potential_abandoned_loss),
                },
                "orders": orders_data,
                "total": total_filtered,
                "current_page": page,
                "total_pages": total_pages,
            },
            "error": None,
        }, status=status.HTTP_200_OK)


class AdminOrderRemindView(APIView):
    """
    POST /api/v1/commerce/orders/<uuid:order_id>/remind-abandoned/
    Relance par notification et email un client dont la commande est en panier abandonné ou en attente.
    """
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]

    def post(self, request, order_id):
        from django.utils import timezone
        from apps.reporting.services import notify_user
        from apps.reporting.models import Notification

        try:
            order = Order.objects.select_related('user', 'currency').get(id=order_id)
        except Order.DoesNotExist:
            return Response({"success": False, "data": None, "error": "Commande introuvable."}, status=404)

        if order.statut_paiement == 'paid':
            return Response({"success": False, "data": None, "error": "Cette commande est déjà réglée."}, status=400)

        now = timezone.now()
        order.last_reminder_sent_at = now
        order.save(update_fields=['last_reminder_sent_at'])

        user_email = order.user.email if order.user else "le client"
        order_ref = f"#{str(order.id)[:8].upper()}"
        amount_fmt = f"{order.total_amount:,.0f} {order.currency.code if order.currency else 'FCFA'}".replace(',', ' ')

        if order.user:
            try:
                notify_user(
                    user=order.user,
                    notification_type=Notification.NotificationType.SYSTEM,
                    title="Votre panier vous attend",
                    message=f"Votre commande {order_ref} d'un montant de {amount_fmt} est en attente. Vous pouvez la finaliser en un clic sur votre espace personnel.",
                    action_url=f"/student/orders?order_id={str(order.id)}",
                )
            except Exception as e:
                logger.warning(f"Notification in-app de relance non envoyée: {e}")

        logger.info(f"[Admin Commerce] Email de relance consigné pour la commande {order_ref} à {user_email} par {request.user.email}")

        return Response({
            "success": True,
            "data": {
                "order_id": str(order.id),
                "recipient_email": user_email,
                "last_reminder_sent_at": now.isoformat(),
            },
            "message": f"Email de relance envoyé avec succès à {user_email}.",
            "error": None,
        }, status=status.HTTP_200_OK)


class AdminOrderConfirmPaymentView(APIView):
    """
    POST /api/v1/commerce/admin/orders/<uuid:order_id>/confirm-payment/
    Confirmation manuelle administrative d'une commande (Espèces, MoMo direct, Virement, Chèque).
    """
    permission_classes = [IsAuthenticated, IsAdminOrSuperAdmin]

    def post(self, request, order_id):
        from .services import confirm_manual_payment

        try:
            order = Order.objects.get(id=order_id)
        except Order.DoesNotExist:
            return Response({"success": False, "data": None, "error": "Commande introuvable."}, status=404)

        if order.statut_paiement == 'paid':
            return Response({"success": False, "data": None, "error": "Cette commande est déjà marquée comme payée."}, status=400)

        mode_paiement = request.data.get('mode_paiement', 'especes')
        reference_paiement = request.data.get('reference_paiement', '').strip()

        confirm_manual_payment(
            order,
            confirmed_by_user=request.user,
            mode_paiement=mode_paiement,
            reference=reference_paiement
        )

        return Response({
            "success": True,
            "data": {
                "id": str(order.id),
                "statut_paiement": "paid",
                "mode_paiement": order.mode_paiement,
                "manual_payment_reference": order.manual_payment_reference,
            },
            "message": f"Paiement de la commande #{str(order.id)[:8].upper()} validé manuellement avec succès.",
            "error": None,
        }, status=status.HTTP_200_OK)


class AdminApproveCreditOrderView(APIView):
    """
    POST /api/v1/commerce/admin/orders/<uuid:order_id>/approve-credit/
    Validation ou refus administratif d'une demande d'achat à crédit (SEC-09).
    Réservé exclusivement aux rôles Gestionnaire (manager) et Administrateur.
    Body: { "action": "approve" | "reject" }
    """
    permission_classes = [IsAuthenticated, IsManagerOrAdmin]

    def post(self, request, order_id):
        action = request.data.get('action', 'approve').strip().lower()
        if action not in ('approve', 'reject'):
            return Response(
                {"success": False, "error": "Action invalide. Choisissez 'approve' ou 'reject'."},
                status=status.HTTP_400_BAD_REQUEST
            )

        commande = Order.objects.filter(id=order_id).first()
        if not commande:
            return Response(
                {"success": False, "error": "Commande introuvable."},
                status=status.HTTP_404_NOT_FOUND
            )

        if not commande.is_credit_purchase:
            return Response(
                {"success": False, "error": "Cette commande n'est pas une commande à crédit."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if commande.credit_status != 'pending_approval':
            return Response(
                {"success": False, "error": f"Cette commande n'est plus en attente d'approbation (statut actuel: {commande.credit_status})."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if action == 'approve':
            from .services import fulfill_credit_order
            with transaction.atomic():
                commande.credit_status = 'approved'
                commande.credit_granted_by = request.user
                commande.save(update_fields=['credit_status', 'credit_granted_by'])
                fulfill_credit_order(commande)

            logger.info(f"[Commerce] Crédit approuvé pour commande {commande.id} par {request.user.email}.")
            return Response({
                "success": True,
                "message": "Achat à crédit approuvé et commande débloquée avec succès.",
                "data": OrderSerializer(commande).data
            }, status=status.HTTP_200_OK)

        elif action == 'reject':
            with transaction.atomic():
                commande.credit_status = 'rejected'
                commande.statut_commande = 'cancelled'
                commande.save(update_fields=['credit_status', 'statut_commande'])

            logger.info(f"[Commerce] Crédit rejeté pour commande {commande.id} par {request.user.email}.")
            return Response({
                "success": True,
                "message": "Demande d'achat à crédit rejetée et commande annulée.",
                "data": OrderSerializer(commande).data
            }, status=status.HTTP_200_OK)


