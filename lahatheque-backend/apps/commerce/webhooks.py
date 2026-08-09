import logging
from django.db import transaction
from django.utils import timezone
from .models import WebhookEvent, PaymentTransaction
from .services import handle_payment_success, handle_payment_failure

logger = logging.getLogger(__name__)

@transaction.atomic
def process_moneroo_webhook(event_id: str, event_type: str, payload: dict) -> WebhookEvent:
    """
    Traite un webhook Moneroo de manière idempotente et sécurisée.
    
    1. Idempotence: Vérifier si event_id a déjà été traité (sas WebhookEvent)
    2. Verrouillage: select_for_update() sur la PaymentTransaction
    3. Traitement: Dispatch vers handle_payment_success ou handle_payment_failure
    """
    # 1. Sas d'idempotence
    webhook, created = WebhookEvent.objects.select_for_update().get_or_create(
        event_id=event_id,
        defaults={
            'event_type': event_type,
            'payload': payload,
            'status': WebhookEvent.Status.PENDING
        }
    )
    
    if webhook.status == WebhookEvent.Status.PROCESSED:
        logger.info(f"Webhook {event_id} already processed, returning cached result")
        return webhook
        
    try:
        # Extraire l'ID de transaction (moneroo_id ou fallback metadata tx_id)
        moneroo_id = payload.get('data', {}).get('id')
        tx_id = payload.get('data', {}).get('metadata', {}).get('transaction_id')
        
        # 2. Verrouillage Pessimiste de la Transaction
        # On cherche par moneroo_id d'abord
        payment_tx = PaymentTransaction.objects.select_for_update().filter(moneroo_id=moneroo_id).first()
        if not payment_tx and tx_id:
            payment_tx = PaymentTransaction.objects.select_for_update().filter(id=tx_id).first()
            
        if not payment_tx:
            # Transaction inconnue de notre côté, on log mais on marque webhook comme FAILED (ou PROCESSED pour ignorer)
            raise ValueError(f"Transaction introuvable pour moneroo_id={moneroo_id} et tx_id={tx_id}")

        if payment_tx.status in [PaymentTransaction.Status.SUCCESS, PaymentTransaction.Status.FAILED, PaymentTransaction.Status.CANCELLED]:
            logger.info(f"Transaction {payment_tx.id} déjà finalisée avec statut {payment_tx.status}. Webhook ignoré.")
            webhook.status = WebhookEvent.Status.PROCESSED
            webhook.processed_at = timezone.now()
            webhook.save(update_fields=['status', 'processed_at'])
            return webhook

        # 3. Dispatch
        if event_type == 'payment.success':
            payment_tx.status = PaymentTransaction.Status.SUCCESS
            payment_tx.webhook_payload = payload
            payment_tx.save(update_fields=['status', 'webhook_payload', 'updated_at'])
            handle_payment_success(payment_tx)
            
        elif event_type in ['payment.failed', 'payment.cancelled']:
            payment_tx.status = PaymentTransaction.Status.FAILED
            payment_tx.webhook_payload = payload
            payment_tx.save(update_fields=['status', 'webhook_payload', 'updated_at'])
            handle_payment_failure(payment_tx)
        else:
            logger.warning(f"Event type non géré: {event_type}")

        # 4. Marquer comme traité
        webhook.status = WebhookEvent.Status.PROCESSED
        webhook.processed_at = timezone.now()
        webhook.save(update_fields=['status', 'processed_at'])
        
        return webhook
        
    except Exception as e:
        webhook.status = WebhookEvent.Status.FAILED
        webhook.error_message = str(e)
        webhook.save(update_fields=['status', 'error_message'])
        logger.error(f"Webhook {event_id} failed: {e}", exc_info=True)
        raise e

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions

class MonerooWebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        event_id = request.data.get('event_id') or request.data.get('id')
        event_type = request.data.get('event_type') or request.data.get('event')
        if not event_id or not event_type:
            return Response({"error": "Paramètres de webhook invalides"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            webhook = process_moneroo_webhook(event_id, event_type, request.data)
            return Response({"status": webhook.status}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class StripeWebhookView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        # Stub webhook Stripe
        return Response({"status": "received"}, status=status.HTTP_200_OK)

