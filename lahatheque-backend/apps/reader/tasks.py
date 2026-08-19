"""
Tâches asynchrones Celery pour l'émission des webhooks signés HMAC-SHA256 aux partenaires.
Conforme aux principes de sécurité et de résilience LAHAThèque (idempotence, retries exponentiels).
"""

import hmac
import hashlib
import json
import logging
import time
import uuid
from typing import Any, Dict, Optional
import requests
from django.utils import timezone
from .models import PartnerApp, ReaderSession, WebhookLog

logger = logging.getLogger(__name__)


def compute_webhook_signature(secret: str, timestamp: int, payload_str: str) -> str:
    """Calcule la signature HMAC-SHA256 au format standardisé t=...,v1=..."""
    signature_payload = f"t={timestamp}.{payload_str}".encode("utf-8")
    sig_hex = hmac.new(secret.encode("utf-8"), signature_payload, hashlib.sha256).hexdigest()
    return f"t={timestamp},v1={sig_hex}"


def dispatch_partner_webhook_sync(
    partner_id: str,
    event_type: str,
    payload_data: Dict[str, Any],
    session_id: Optional[str] = None
) -> bool:
    """
    Envoie de manière synchrone ou différée un événement webhook signé à un partenaire.
    Journalise l'opération dans WebhookLog.
    """
    partner = PartnerApp.objects.filter(id=partner_id).first()
    if not partner or not partner.webhook_url:
        logger.info(f"Pas de webhook_url configurée pour le partenaire {partner_id}")
        return False

    session = ReaderSession.objects.filter(id=session_id).first() if session_id else None

    delivery_id = f"del_{uuid.uuid4().hex}"
    timestamp = int(timezone.now().timestamp())

    full_payload = {
        "event_id": f"evt_{uuid.uuid4().hex[:12]}",
        "type": event_type,
        "timestamp": timezone.now().isoformat(),
        "session_id": str(session_id) if session_id else None,
        "data": payload_data,
        "metadata": session.metadata if session else {}
    }

    payload_str = json.dumps(full_payload, separators=(',', ':'))
    signature_header = compute_webhook_signature(partner.webhook_secret, timestamp, payload_str)

    headers = {
        "Content-Type": "application/json",
        "User-Agent": "LAHATheque-Webhook-Dispatcher/3.2",
        "X-Lahatheque-Event": event_type,
        "X-Lahatheque-Delivery": delivery_id,
        "X-Lahatheque-Signature": signature_header,
    }

    status_code = None
    response_body = ""
    is_success = False

    try:
        resp = requests.post(partner.webhook_url, data=payload_str, headers=headers, timeout=10)
        status_code = resp.status_code
        response_body = resp.text[:2000]
        is_success = 200 <= status_code < 300
    except Exception as e:
        response_body = f"Erreur réseau webhook: {str(e)}"
        logger.warning(f"Échec envoi webhook {event_type} à {partner.name}: {e}")

    WebhookLog.objects.create(
        partner=partner,
        session=session,
        event_type=event_type,
        delivery_id=delivery_id,
        payload_json=payload_str,
        status_code=status_code,
        response_body=response_body,
        attempt_count=1,
        is_success=is_success
    )

    return is_success
