"""
Adaptateur universel d'ingestion de documents pour le moteur DRM LAHAThèque.
Supporte le catalogue interne (R2/local), les URLs distantes externes avec protection Anti-SSRF
et whitelist de serveurs partenaires (incluant sous-domaines automatiques), ainsi que les téléversements directs.
"""

import ipaddress
import logging
import os
import socket
from urllib.parse import urlparse
from typing import Any, Dict, List, Optional
import requests
from django.conf import settings

logger = logging.getLogger(__name__)


class DocumentSourceError(Exception):
    """Exception levée en cas d'erreur de récupération d'un document source."""
    pass


class DocumentSourceAdapter:
    """
    Adaptateur responsable de la récupération et de la normalisation du flux
    d'octets d'un document quelle que soit sa provenance (Catalogue ou BYOD externe).
    """

    MAX_BYTES_DEFAULT = getattr(settings, "DRM_MAX_REMOTE_FILE_SIZE_MB", 200) * 1024 * 1024

    @classmethod
    def get_document_bytes(
        cls,
        source_type: str,
        source_reference: str,
        options: Optional[Dict[str, Any]] = None
    ) -> bytes:
        """
        Récupère le binaire d'un document selon son type de source.

        Args:
            source_type: 'catalog_book', 'external_url', 'direct_upload', ou 'local_path'.
            source_reference: Identifiant catalogue, URL distante ou chemin de fichier.
            options: Paramètres optionnels (en-têtes HTTP, whitelist sources, max_bytes).

        Returns:
            bytes: Contenu binaire brut du document PDF.

        Raises:
            DocumentSourceError: En cas d'échec de lecture ou de non-conformité.
        """
        options = options or {}

        if source_type == "catalog_book":
            return cls._fetch_catalog_book(source_reference)
        elif source_type == "external_url":
            return cls._fetch_external_url(source_reference, options)
        elif source_type == "direct_upload":
            return cls._fetch_direct_upload(options)
        elif source_type == "local_path":
            return cls._fetch_local_path(source_reference)
        else:
            raise DocumentSourceError(f"Type de source de document inconnu: '{source_type}'")

    @classmethod
    def _fetch_catalog_book(cls, book_id: str) -> bytes:
        """Récupère le fichier d'un ouvrage du catalogue interne LAHAThèque."""
        from apps.catalog.models import Ouvrage

        ouvrage = None
        try:
            ouvrage = Ouvrage.objects.get(id=book_id)
        except (Ouvrage.DoesNotExist, Exception):
            # Fallback sur slug si book_id n'est pas un UUID valide
            ouvrage = Ouvrage.objects.filter(isbn=book_id).first()

        if not ouvrage:
            raise DocumentSourceError(f"Ouvrage introuvable dans le catalogue: {book_id}")

        # Le champ fichier est 'file' sur le modèle Ouvrage
        if ouvrage.file:
            try:
                with ouvrage.file.open("rb") as f:
                    return f.read()
            except Exception as e:
                logger.error(f"Erreur lecture fichier ouvrage {book_id}: {e}")

        # Fallback fichier physique de test
        fallback_path = os.path.join(settings.BASE_DIR, "media", f"{book_id}.pdf")
        if os.path.exists(fallback_path):
            with open(fallback_path, "rb") as f:
                return f.read()

        raise DocumentSourceError(f"Aucun fichier disponible pour l'ouvrage {book_id}")


    @classmethod
    def _validate_ssrf_and_whitelist(cls, url: str, options: Dict[str, Any]) -> None:
        """
        Validation stricte Anti-SSRF et vérification de la whitelist des serveurs sources.
        Supporte automatiquement les sous-domaines (ex: 'uac.bj' englobe 'cours.uac.bj' et 'storage.uac.bj').
        """
        parsed = urlparse(url)
        scheme = parsed.scheme.lower()

        if scheme not in ("http", "https"):
            raise DocumentSourceError(f"Protocole non supporté: '{scheme}' (seul HTTPS/HTTP est autorisé)")

        hostname = parsed.hostname
        if not hostname:
            raise DocumentSourceError(f"Nom d'hôte manquant dans l'URL: {url}")

        hostname_lower = hostname.lower()

        # Blocage des noms d'hôtes localhost évidents (sauf en DEBUG de développement)
        blocked_hosts = {"localhost", "127.0.0.1", "0.0.0.0", "::1", "169.254.169.254"}
        if hostname_lower in blocked_hosts and not getattr(settings, "DEBUG", False):
            raise DocumentSourceError("Accès aux adresses loopback et métadonnées interdit (Anti-SSRF).")

        # Résolution DNS pour vérifier les adresses IP privées (désactivé en mode DEBUG de développement)
        if not getattr(settings, "DEBUG", False):
            try:
                ip_info = socket.getaddrinfo(hostname, None)
                for item in ip_info:
                    ip_str = item[4][0]
                    ip_obj = ipaddress.ip_address(ip_str)
                    if ip_obj.is_private or ip_obj.is_loopback or ip_obj.is_reserved or ip_obj.is_link_local:
                        raise DocumentSourceError(
                            f"L'adresse IP cible ({ip_str}) est privée ou réservée. Requête bloquée par la sécurité Anti-SSRF."
                        )
            except socket.gaierror:
                raise DocumentSourceError(f"Impossible de résoudre le domaine distant: {hostname}")

        # Vérification de la whitelist configurée pour le partenaire
        allowed_sources: List[str] = options.get("allowed_document_sources", [])
        if allowed_sources and "*" not in allowed_sources:
            matched = False
            for src in allowed_sources:
                src_clean = src.strip().rstrip("/")
                if not src_clean:
                    continue

                # 1. Correspondance de préfixe direct d'URL (ex: 'https://s3.amazonaws.com/uac-bucket/')
                if url.startswith(src_clean):
                    matched = True
                    break

                # 2. Extraction du domaine source (enlève http://, https://, *. )
                src_domain = src_clean
                if "://" in src_domain:
                    src_parsed = urlparse(src_domain)
                    src_domain = src_parsed.hostname or src_domain
                if src_domain.startswith("*."):
                    src_domain = src_domain[2:]
                src_domain = src_domain.split("/")[0].lower()

                # 3. Correspondance de domaine exact ou de sous-domaine (ex: 'uac.bj' englobe 'cours.uac.bj')
                if hostname_lower == src_domain or hostname_lower.endswith("." + src_domain):
                    matched = True
                    break

            if not matched:
                raise DocumentSourceError(
                    f"Le domaine distant '{hostname}' n'est pas dans la liste des serveurs de stockage approuvés ({allowed_sources})."
                )

    @classmethod
    def _fetch_external_url(cls, url: str, options: Dict[str, Any]) -> bytes:
        """
        Télécharge de manière sécurisée un PDF depuis une URL distante partenaire
        avec protection Anti-SSRF, whitelist et limitation de débit/taille.
        """
        cls._validate_ssrf_and_whitelist(url, options)

        max_mb = options.get("max_file_size_mb")
        max_bytes = (max_mb * 1024 * 1024) if max_mb and max_mb > 0 else cls.MAX_BYTES_DEFAULT

        headers = {"User-Agent": "LAHATheque-DRM-SecureFetcher/3.2"}
        if options.get("auth_header"):
            headers["Authorization"] = options["auth_header"]

        try:
            response = requests.get(url, headers=headers, stream=True, timeout=15)
            response.raise_for_status()

            # Vérification de l'en-tête Content-Length
            content_length = response.headers.get("Content-Length")
            if content_length and int(content_length) > max_bytes:
                raise DocumentSourceError(
                    f"Le fichier distant dépasse la taille maximale autorisée ({max_bytes // 1024 // 1024} Mo)"
                )

            content = bytearray()
            for chunk in response.iter_content(chunk_size=65536):
                content.extend(chunk)
                if len(content) > max_bytes:
                    raise DocumentSourceError(
                        f"Fichier distant trop volumineux (dépasse {max_bytes // 1024 // 1024} Mo)"
                    )

            # Vérification basique du header PDF
            if not content.startswith(b"%PDF-"):
                logger.warning(f"Le fichier distant ({url}) n'a pas la signature '%PDF-', conversion ou streaming toléré.")

            return bytes(content)

        except requests.RequestException as e:
            logger.error(f"Échec du téléchargement distant ({url}): {e}")
            raise DocumentSourceError(f"Impossible de récupérer le document distant: {str(e)}")

    @classmethod
    def _fetch_direct_upload(cls, options: Dict[str, Any]) -> bytes:
        """Extrait les octets d'un téléversement direct en mémoire."""
        file_obj = options.get("file_obj") or options.get("uploaded_file")
        if not file_obj:
            raise DocumentSourceError("Aucun objet de fichier fourni pour le téléversement direct")

        if hasattr(file_obj, "read"):
            file_obj.seek(0)
            return file_obj.read()
        elif isinstance(file_obj, (bytes, bytearray)):
            return bytes(file_obj)
        else:
            raise DocumentSourceError("Format de fichier téléversé non supporté")

    @classmethod
    def _fetch_local_path(cls, path: str) -> bytes:
        """Lit un fichier PDF depuis le système de fichiers local."""
        if not os.path.exists(path):
            raise DocumentSourceError(f"Fichier local introuvable: {path}")

        try:
            with open(path, "rb") as f:
                return f.read()
        except Exception as e:
            raise DocumentSourceError(f"Erreur de lecture du fichier local ({path}): {str(e)}")
