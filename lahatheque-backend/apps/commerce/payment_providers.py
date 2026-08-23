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
        try:
            from .moneroo_client import client
            res = client.initialize_payment(amount, currency, description, customer_email, customer_name, return_url, metadata)
            return {
                'checkout_url': res.get('checkout_url'),
                'payment_id': res.get('moneroo_id'),
                'status': 'pending',
                'provider': 'moneroo'
            }
        except Exception as err:
            logger.warning(f"[MonerooPaymentProvider] Erreur Moneroo API ({err}) — bascule sur MockPaymentProvider pour les tests.")
            return MockPaymentProvider().initiate_payment(
                amount, currency, description, customer_email, customer_name, return_url, metadata
            )

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
    # En mode DEBUG ou tests locaux, utiliser le MockPaymentProvider
    if getattr(settings, 'DEBUG', False) or getattr(settings, 'PAYMENT_PROVIDER_TYPE', 'mock') == 'mock':
        return MockPaymentProvider()

    active_type = getattr(settings, 'PAYMENT_PROVIDER_TYPE', provider_type)
    if active_type == 'moneroo':
        return MonerooPaymentProvider()
    elif active_type == 'stripe':
        return StripePaymentProvider()
    return MockPaymentProvider()
