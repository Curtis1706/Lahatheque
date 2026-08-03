import requests
import hmac
import hashlib
from django.conf import settings
import logging

logger = logging.getLogger('payments.moneroo')

class MonerooAPIError(Exception):
    """Exception levée pour les erreurs d'API Moneroo"""
    pass

class MonerooTimeoutError(Exception):
    """Exception levée en cas de timeout avec Moneroo"""
    pass

class MonerooClient:
    MAX_RETRIES = 3
    TIMEOUT = 10

    def __init__(self):
        self.secret_key = settings.MONEROO_SECRET_KEY
        self.public_key = settings.MONEROO_PUBLIC_KEY
        self.base_url = settings.MONEROO_API_BASE_URL
        self.webhook_secret = settings.MONEROO_WEBHOOK_SECRET

    @property
    def headers(self):
        return {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json"
        }

    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """Vérification HMAC-SHA256 de la signature du webhook."""
        if not self.webhook_secret:
            logger.warning("MONEROO_WEBHOOK_SECRET n'est pas configuré.")
            return False

        expected = hmac.new(
            self.webhook_secret.encode('utf-8'), 
            payload, 
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(expected, signature)

    def initialize_payment(self, amount, currency, description, customer_email, customer_name, return_url, metadata=None):
        """Initialise un paiement sur Moneroo avec retry logic."""
        if currency != 'XOF':
            raise ValueError(f"Devise non supportée : {currency}. Seul le XOF est accepté.")

        url = f"{self.base_url}/payments/initialize"
        payload = {
            "amount": float(amount),
            "currency": currency,
            "description": description,
            "customer": {
                "email": customer_email,
                "first_name": customer_name.split(' ')[0] if customer_name else '',
                "last_name": ' '.join(customer_name.split(' ')[1:]) if customer_name and ' ' in customer_name else ''
            },
            "return_url": return_url,
            "metadata": metadata or {}
        }

        import time
        for attempt in range(self.MAX_RETRIES):
            try:
                response = requests.post(url, json=payload, headers=self.headers, timeout=self.TIMEOUT)
                if response.status_code in [200, 201]:
                    data = response.json()
                    return {
                        'checkout_url': data.get('data', {}).get('checkout_url'),
                        'moneroo_id': data.get('data', {}).get('id'),
                        'payment_ref': data.get('data', {}).get('reference')
                    }
                else:
                    logger.error(f"Moneroo API Error {response.status_code}: {response.text}")
                    if attempt == self.MAX_RETRIES - 1:
                        raise MonerooAPIError(f"Erreur Moneroo: {response.text}")
            except requests.exceptions.Timeout:
                logger.warning(f"Timeout avec Moneroo (tentative {attempt+1}/{self.MAX_RETRIES})")
                if attempt == self.MAX_RETRIES - 1:
                    raise MonerooTimeoutError("Moneroo est indisponible actuellement (Timeout).")
            except requests.exceptions.RequestException as e:
                logger.error(f"Request Exception avec Moneroo: {str(e)}")
                if attempt == self.MAX_RETRIES - 1:
                    raise MonerooAPIError(f"Erreur de connexion Moneroo: {str(e)}")
            
            # Backoff exponentiel (1s, 2s, 4s...)
            time.sleep(2 ** attempt)

    def verify_transaction(self, moneroo_id: str):
        """Vérifie le statut d'une transaction directement auprès de Moneroo."""
        url = f"{self.base_url}/payments/{moneroo_id}/verify"
        import time
        for attempt in range(self.MAX_RETRIES):
            try:
                response = requests.get(url, headers=self.headers, timeout=self.TIMEOUT)
                if response.status_code in [200, 201]:
                    data = response.json()
                    return data.get('data', {})
                else:
                    logger.error(f"Moneroo Verify API Error {response.status_code}: {response.text}")
                    if attempt == self.MAX_RETRIES - 1:
                        raise MonerooAPIError(f"Erreur Moneroo: {response.text}")
            except requests.exceptions.Timeout:
                logger.warning(f"Timeout avec Moneroo (tentative {attempt+1}/{self.MAX_RETRIES})")
                if attempt == self.MAX_RETRIES - 1:
                    raise MonerooTimeoutError("Moneroo est indisponible actuellement (Timeout).")
            except requests.exceptions.RequestException as e:
                logger.error(f"Request Exception avec Moneroo: {str(e)}")
                if attempt == self.MAX_RETRIES - 1:
                    raise MonerooAPIError(f"Erreur de connexion Moneroo: {str(e)}")
            
            time.sleep(2 ** attempt)
        return None

client = MonerooClient()
