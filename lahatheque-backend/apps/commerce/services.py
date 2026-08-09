import logging

logger = logging.getLogger(__name__)

def handle_payment_success(payment_tx):
    logger.info(f"[Commerce] Payment success for transaction {payment_tx.id}")

def handle_payment_failure(payment_tx):
    logger.info(f"[Commerce] Payment failure for transaction {payment_tx.id}")
