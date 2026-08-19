"""
Service d'ingestion et d'adaptation des sources de documents pour les sessions de lecture.
Fait le pont entre les sessions Reader et le moteur DRM (DocumentSourceAdapter)
en appliquant les quotas et les whitelists Anti-SSRF configurés par l'administrateur.
"""

import logging
from typing import Any, Dict, Optional
from apps.protection.source_adapter import DocumentSourceAdapter, DocumentSourceError
from ..models import ReaderSession

logger = logging.getLogger(__name__)


class ReaderDocumentService:
    """Service de résolution et de récupération du flux de document d'une session."""

    @classmethod
    def get_document_bytes_for_session(cls, session: ReaderSession) -> bytes:
        """
        Récupère le binaire PDF du document associé à une session de lecture
        en appliquant les politiques BYOD et Anti-SSRF du partenaire.

        Args:
            session: L'instance ReaderSession active.

        Returns:
            bytes: Contenu binaire PDF brut avant application du filigrane dynamique.

        Raises:
            DocumentSourceError: En cas d'échec de récupération ou de non-conformité.
        """
        if session.source_type == "catalog_book" and session.ouvrage_id:
            return DocumentSourceAdapter.get_document_bytes(
                source_type="catalog_book",
                source_reference=str(session.ouvrage_id)
            )
        elif session.source_type == "external_url" and session.custom_document_url:
            partner_quotas = session.partner.quotas or {}
            options: Dict[str, Any] = {
                "partner_id": str(session.partner_id),
                "allowed_document_sources": partner_quotas.get("allowed_document_sources", []),
                "max_file_size_mb": partner_quotas.get("max_file_size_mb", 200),
            }
            return DocumentSourceAdapter.get_document_bytes(
                source_type="external_url",
                source_reference=session.custom_document_url,
                options=options
            )
        else:
            raise DocumentSourceError(
                f"Source de document non résolue pour la session {session.id} (type: {session.source_type})"
            )
