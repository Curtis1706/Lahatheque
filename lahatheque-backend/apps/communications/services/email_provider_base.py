"""
Interface abstraite pour les fournisseurs d'envoi d'e-mails LAHAThèque (Provider Pattern).
Définit le contrat strict respecté par Resend et SMTP.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Optional, Union, Dict, Any


@dataclass
class EmailAttachment:
    """
    Structure normalisée pour les pièces jointes d'e-mails (Factures PDF, Bordereaux, Reçus).
    """
    filename: str
    content: bytes
    content_type: str = "application/pdf"


@dataclass
class EmailSendResult:
    """
    Résultat normalisé d'un envoi d'email.
    """
    success: bool
    provider: str
    message_id: str = ""
    error: Optional[str] = None
    status_code: Optional[int] = None
    raw_response: Dict[str, Any] = field(default_factory=dict)


class EmailProviderBase(ABC):
    """
    Classe de base abstraite que tout fournisseur de messagerie (Resend, SMTP, etc.) doit implémenter.
    """

    @abstractmethod
    def send_email(
        self,
        to_email: Union[str, List[str]],
        subject: str,
        html_content: str,
        text_content: Optional[str] = None,
        from_email: Optional[str] = None,
        reply_to: Optional[Union[str, List[str]]] = None,
        attachments: Optional[List[EmailAttachment]] = None,
        tags: Optional[Dict[str, str]] = None,
    ) -> EmailSendResult:
        """
        Envoie un e-mail au(x) destinataire(s) spécifié(s).

        Args:
            to_email: Adresse email ou liste d'adresses destinataires.
            subject: Objet de l'e-mail.
            html_content: Corps du message au format HTML.
            text_content: Version texte brut alternative pour les clients sans support HTML.
            from_email: Adresse d'expédition (si None, utilise la valeur par défaut du système).
            reply_to: Adresse de réponse optionnelle.
            attachments: Liste de pièces jointes (fichiers binaires avec nom et type MIME).
            tags: Métadonnées de catégorisation.

        Returns:
            EmailSendResult: Résultat standardisé avec statut, message ID et éventuelle erreur.
        """
        pass
