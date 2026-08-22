from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db import transaction

from .models import Currency, Order, LigneCommande, PhysicalDelivery, PaymentTransaction, SubscriptionPlan, Subscription
from .serializers import OrderSerializer, CreateOrderSerializer, SubscriptionPlanSerializer
from .payment_providers import get_payment_provider
from apps.catalog.models import Ouvrage

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
        date_livraison = validated.get('date_livraison_souhaitee')
        plage_debut = validated.get('plage_horaire_debut')
        plage_fin = validated.get('plage_horaire_fin')

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

            # Vérification du stock disponible pour le format papier, agrégé sur tous les entrepôts
            if format_type == 'paper':
                has_paper = True
                from django.db.models import Sum, F

                total_disponible = ouvrage.stocks_entrepots.aggregate(
                    total=Sum(F('quantite_reelle') - F('quantite_reservee'))
                )['total'] or 0

                if total_disponible < quantity:
                    return Response({
                        'error': f"Stock insuffisant pour '{ouvrage.title}' en format Papier "
                                 f"(disponible : {total_disponible}, demandé : {quantity})."
                    }, status=status.HTTP_400_BAD_REQUEST)

            unit_price = ouvrage.price if format_type == 'digital' else (ouvrage.price_paper or ouvrage.price)
            line_total = unit_price * quantity
            total_amount += line_total

            lignes_to_create.append({
                'ouvrage': ouvrage,
                'format_type': format_type,
                'unit_price': unit_price,
                'quantity': quantity
            })

        with transaction.atomic():
            commande = Order.objects.create(
                user=request.user,
                total_amount=total_amount,
                currency=currency,
                statut_paiement='pending',
                statut_commande='pending',
                type_commande=type_commande,
                mode_paiement=mode_paiement,
            )

            for l in lignes_to_create:
                LigneCommande.objects.create(
                    commande=commande,
                    ouvrage=l['ouvrage'],
                    format_type=l['format_type'],
                    unit_price=l['unit_price'],
                    quantity=l['quantity']
                )

            if has_paper and shipping_address:
                PhysicalDelivery.objects.create(
                    commande=commande,
                    shipping_address=shipping_address,
                    city=city,
                    country=country,
                    statut='en_preparation',
                    date_livraison_souhaitee=date_livraison,
                    plage_horaire_debut=plage_debut,
                    plage_horaire_fin=plage_fin,
                )

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

            provider = get_payment_provider(provider_name)
            return_url = f"{request.scheme}://{request.get_host()}/student/orders"
            payment_res = provider.initiate_payment(
                amount=total_amount,
                currency=currency.code,
                description=f"Commande LAHAThèque #{commande.id}",
                customer_email=request.user.email,
                customer_name=f"{request.user.first_name} {request.user.last_name}",
                return_url=return_url
            )

            tx = PaymentTransaction.objects.create(
                user=request.user,
                amount=total_amount,
                currency=currency,
                status=payment_res.get('status', 'pending')
            )
            commande.payment_transaction = tx

            # Si le provider est mock et immédiat, valider le paiement tout de suite
            if payment_res.get('status') == 'success':
                from .services import handle_payment_success
                handle_payment_success(tx)
            else:
                commande.save()

        return Response({
            'order_id': str(commande.id),
            'checkout_url': payment_res.get('checkout_url'),
            'status': payment_res.get('status'),
            'total_amount': str(total_amount),
            'order': OrderSerializer(commande).data
        }, status=status.HTTP_201_CREATED)

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
            return_url = f"{request.scheme}://{request.get_host()}/student/subscriptions"
            payment_res = provider.initiate_payment(
                amount=plan.price_amount,
                currency=plan.currency.code if hasattr(plan.currency, 'code') else "XOF",
                description=f"Abonnement {plan.name}",
                customer_email=request.user.email,
                customer_name=request.user.get_full_name() or request.user.email,
                return_url=return_url,
                metadata={"subscription_id": str(subscription.id)},
            )
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
