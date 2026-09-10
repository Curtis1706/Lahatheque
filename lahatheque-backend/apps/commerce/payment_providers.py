from abc import ABC, abstractmethod
import uuid
import logging

logger = logging.getLogger('payments.provider')

class PaymentProvider(ABC):
    @abstractmethod
    def initiate_payment(self, amount, currency, description, customer_email, customer_name, return_url, metadata=None):
        pass

    @abstractmethod
    def get_status(self, payment_id: str):
        pass

class MockPaymentProvider(PaymentProvider):
    """
    Fournisseur de paiement simulé pour dev / tests.
    Simule une transaction immédiatement réussie sans dépendance réseau.
    """
    def initiate_payment(self, amount, currency, description, customer_email, customer_name, return_url, metadata=None):
        mock_id = f"mock_pay_{uuid.uuid4().hex[:12]}"
        logger.info(f"[MockPaymentProvider] Initiating payment {mock_id} for {customer_email} ({amount} {currency})")
        return {
            'checkout_url': None,
            'payment_id': mock_id,
            'status': 'success',
            'provider': 'mock'
        }

    def get_status(self, payment_id: str):
        return {
            'status': 'success',
            'payment_id': payment_id,
            'provider': 'mock'
        }

class MonerooPaymentProvider(PaymentProvider):
    def initiate_payment(self, amount, currency, description, customer_email, customer_name, return_url, metadata=None):
        from .moneroo_client import client
        try:
            res = client.initialize_payment(amount, currency, description, customer_email, customer_name, return_url, metadata)
        except Exception as err:
            logger.error(f"[MonerooPaymentProvider] Échec réel de l'appel à l'API Moneroo: {err}")
            raise

        moneroo_id = res.get('moneroo_id') or res.get('id') or res.get('data', {}).get('id')
        checkout_url = res.get('checkout_url') or res.get('data', {}).get('checkout_url')

        if not checkout_url:
            logger.error(f"[MonerooPaymentProvider] Réponse Moneroo sans checkout_url exploitable: {res}")
            raise ValueError("Moneroo n'a pas renvoyé d'URL de paiement valide.")

        return {
            'checkout_url': checkout_url,
            'payment_id': moneroo_id,
            'moneroo_id': moneroo_id,
            'status': 'pending',
            'provider': 'moneroo'
        }

    def get_status(self, payment_id: str):
        from .moneroo_client import client
        return client.verify_transaction(payment_id)

class StripePaymentProvider(PaymentProvider):
    def initiate_payment(self, amount, currency, description, customer_email, customer_name, return_url, metadata=None):
        from .stripe_client import StripeClient
        client = StripeClient()
        res = client.create_payment_intent(amount, currency)
        return {
            'checkout_url': return_url,
            'payment_id': res.get('client_secret'),
            'status': 'pending',
            'provider': 'stripe'
        }

    def get_status(self, payment_id: str):
        return {'status': 'success', 'payment_id': payment_id, 'provider': 'stripe'}

def get_payment_provider(provider_type: str = 'mock') -> PaymentProvider:
    from django.conf import settings

    is_debug = getattr(settings, 'DEBUG', False)
    active_type = getattr(settings, 'PAYMENT_PROVIDER_TYPE', 'mock')

    if not is_debug and active_type == 'mock':
        logger.critical(
            "[SÉCURITÉ PAIEMENT] PAYMENT_PROVIDER_TYPE non configuré en production "
            "(DEBUG=False) — les paiements seraient traités par le fournisseur fictif. "
            "Vérifier immédiatement la variable d'environnement PAYMENT_PROVIDER_TYPE."
        )

    if is_debug or active_type == 'mock':
        return MockPaymentProvider()

    if active_type == 'moneroo':
        return MonerooPaymentProvider()
    elif active_type == 'stripe':
        return StripePaymentProvider()
    return MockPaymentProvider()
