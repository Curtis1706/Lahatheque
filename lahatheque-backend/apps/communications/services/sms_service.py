"""
Service d'expédition de SMS via l'API FasterMessage pour LAHAThèque.
Gère l'authentification par identifiants (username/password) et l'expédition de messages transactionnels (OTP).
"""

import logging
from typing import Any, Dict, Optional
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

FASTERMESSAGE_API_URL = "https://api.fastermessage.com/v1/sms/send"


def send_sms_via_fastermessage(
    phone_number: str,
    message: str,
    sender: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Expédie un SMS transactionnel via la passerelle FasterMessage.
    
    Format numéro attendu : international sans le '+' (ex: 2290197554953).
    Retourne un dictionnaire {success: bool, data: dict, error: str | None}.
    """
    username = getattr(settings, "FASTERMESSAGE_USERNAME", "")
    password = getattr(settings, "FASTERMESSAGE_PASSWORD", "")
    effective_sender = sender or getattr(settings, "FASTERMESSAGE_SENDER", "LAHA")

    if not username or not password:
        err_msg = "Identifiants FasterMessage non configures dans settings (FASTERMESSAGE_USERNAME/PASSWORD manquants)."
        logger.warning(f"[FASTERMESSAGE] {err_msg}")
        return {"success": False, "data": None, "error": err_msg}

    # Nettoyage et normalisation du numéro de téléphone
    clean_phone = phone_number.replace("+", "").replace(" ", "").strip()
    # Si le numéro commence sans indicatif pays et fait 8 ou 10 chiffres pour le Bénin
    if not clean_phone.startswith("229") and len(clean_phone) in (8, 10):
        clean_phone = f"229{clean_phone}"

    payload = {
        "username": username,
        "password": password,
        "from": effective_sender[:11],  # Limité à 11 caractères alphanumériques
        "to": clean_phone,
        "text": message,
    }

    logger.info(f"[FASTERMESSAGE] Expédition SMS vers {clean_phone} via {effective_sender}...")

    try:
        response = requests.post(
            FASTERMESSAGE_API_URL,
            json=payload,
            timeout=10,
        )

        try:
            resp_data = response.json()
        except Exception:
            resp_data = {"raw": response.text}

        if response.status_code in (200, 201) and resp_data.get("status") is not False:
            logger.info(f"[FASTERMESSAGE SUCCES] SMS délivré vers {clean_phone} | Réponse: {resp_data}")
            return {
                "success": True,
                "data": resp_data,
                "error": None,
            }

        # Détection précise des erreurs FasterMessage
        error_code = resp_data.get("code", f"HTTP_{response.status_code}")
        description = resp_data.get("description", response.text)

        if response.status_code == 402 or error_code == "INSUFFICIENT_BALANCE":
            error_label = "Solde de crédits SMS insuffisant sur le compte FasterMessage (Code 402)."
        elif response.status_code == 401 or error_code == "AUTHENTICATION_FAILED":
            error_label = "Échec d'authentification auprès de FasterMessage (Identifiants invalides)."
        else:
            error_label = f"Erreur FasterMessage [{error_code}] : {description}"

        logger.error(f"[FASTERMESSAGE ERREUR] {error_label} pour {clean_phone}")
        return {
            "success": False,
            "data": resp_data,
            "error": error_label,
        }

    except requests.Timeout:
        err_msg = "Délai d'attente dépassé (10s) lors de l'appel à l'API FasterMessage."
        logger.error(f"[FASTERMESSAGE TIMEOUT] {err_msg}")
        return {"success": False, "data": None, "error": err_msg}
    except Exception as exc:
        err_msg = f"Exception réseau lors de l'expédition SMS FasterMessage : {exc}"
        logger.error(f"[FASTERMESSAGE EXCEPTION] {err_msg}")
        return {"success": False, "data": None, "error": err_msg}
