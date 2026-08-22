"""Utilitaires de génération et vérification des identifiants API partenaires."""
import hashlib
import hmac
import secrets


def generate_client_id() -> str:
    """Génère un identifiant client public complet et unique."""
    return f"laha_client_{secrets.token_hex(16)}"


def generate_client_secret() -> str:
    """Génère un secret client en clair (à afficher UNE SEULE FOIS à la création)."""
    return f"sec_live_{secrets.token_hex(32)}"


def hash_secret(secret: str) -> str:
    """Calcule l'empreinte SHA-256 d'un secret pour stockage."""
    return hashlib.sha256(secret.encode("utf-8")).hexdigest()


def verify_secret(provided_secret: str, stored_hash: str) -> bool:
    """Vérifie un secret fourni contre son empreinte stockée, en temps constant."""
    if not provided_secret or not stored_hash:
        return False
    provided_hash = hash_secret(provided_secret)
    return hmac.compare_digest(provided_hash, stored_hash)
