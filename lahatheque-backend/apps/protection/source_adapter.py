"""
Adaptateur universel d'ingestion de documents pour le moteur DRM LAHAThèque.
Supporte le catalogue interne (R2/local), les URLs distantes externes avec protection Anti-SSRF
et whitelist de serveurs partenaires (incluant sous-domaines automatiques), ainsi que les téléversements directs.
"""

import hashlib
import io
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
    def get_source_bytes(
        cls,
        source_type: str,
        source_reference: str,
        options: Optional[Dict[str, Any]] = None
    ) -> bytes:
        """Alias pour get_document_bytes."""
        return cls.get_document_bytes(source_type, source_reference, options)

    @classmethod
    def _fetch_r2_object(cls, r2_key: str) -> Optional[bytes]:
        """Télécharge un objet depuis Cloudflare R2 (bucket livres en priorité, puis bucket plateforme)."""
        from apps.catalog.services.cover_generator import get_r2_books_client, get_r2_s3_client
        # 1. Essai sur le bucket laha-books-production (lecture seule)
        try:
            s3 = get_r2_books_client()
            bucket = getattr(settings, 'CLOUDFLARE_R2_BOOKS_BUCKET_NAME', 'laha-books-production')
            resp = s3.get_object(Bucket=bucket, Key=r2_key)
            return resp['Body'].read()
        except Exception as e1:
            logger.debug(f"Objet R2 non trouvé dans bucket livres ({r2_key}): {e1}")

        # 2. Fallback sur le bucket plateforme principal (lahatheque)
        try:
            s3 = get_r2_s3_client()
            bucket = getattr(settings, 'CLOUDFLARE_R2_BUCKET_NAME', 'lahatheque')
            resp = s3.get_object(Bucket=bucket, Key=r2_key)
            return resp['Body'].read()
        except Exception as e2:
            logger.error(f"Erreur téléchargement R2 pour {r2_key}: {e2}")
        return None

    @classmethod
    def _convert_epub_bytes_to_pdf(cls, epub_data: bytes) -> Optional[bytes]:
        """Convertit un flux binaire EPUB en flux PDF vectoriel haute fidélité en mémoire vive via PyMuPDF."""
        if not epub_data:
            return None
        try:
            import fitz
            with fitz.open(stream=epub_data, filetype="epub") as doc:
                return doc.convert_to_pdf()
        except Exception as e:
            logger.error(f"Erreur conversion EPUB en PDF en mémoire: {e}")
            return None

    @classmethod
    def _upload_pdf_to_r2(cls, pdf_data: bytes, r2_key: str) -> bool:
        """
        Téléverse un flux PDF converti sur le bucket principal Cloudflare R2 (lahatheque).
        Retourne True si l'upload a réussi, False sinon.
        """
        try:
            from apps.catalog.services.cover_generator import get_r2_s3_client
            s3 = get_r2_s3_client()
            bucket = getattr(settings, 'CLOUDFLARE_R2_BUCKET_NAME', 'lahatheque')
            s3.upload_fileobj(
                io.BytesIO(pdf_data),
                bucket,
                r2_key,
                ExtraArgs={'ContentType': 'application/pdf'}
            )
            logger.info(f"PDF converti depuis EPUB téléversé avec succès sur R2 : {r2_key} ({len(pdf_data) // 1024} Ko)")
            return True
        except Exception as e:
            logger.error(f"Echec téléversement PDF converti sur R2 ({r2_key}): {e}")
            return False

    @classmethod
    def _get_redis_client(cls):
        """Retourne un client Redis depuis REDIS_URL ou None si Redis est indisponible."""
        try:
            import redis as redis_lib
            redis_url = getattr(settings, 'REDIS_URL', None)
            if not redis_url:
                return None
            client = redis_lib.from_url(redis_url, socket_connect_timeout=2, socket_timeout=5)
            client.ping()
            return client
        except Exception:
            return None

    @classmethod
    def _convert_epub_and_persist(cls, lang_version, epub_r2_key: str) -> Optional[bytes]:
        """
        Convertit un EPUB en PDF avec verrou Redis distribué anti-thundering herd.

        Comportement :
        1. Acquiert un verrou Redis sur la clé EPUB (120s max) pour éviter les conversions simultanées.
        2. Ré-vérifie r2_key_pdf en BDD après acquisition du verrou (cas où un autre process a déjà converti).
        3. Convertit l'EPUB en PDF vectoriel via PyMuPDF.
        4. Uploade le PDF sur Cloudflare R2 (bucket lahatheque) et met à jour r2_key_pdf en BDD.
        5. Libère le verrou et retourne le PDF.

        En cas d'indisponibilité Redis : conversion directe sans verrou (fallback gracieux, sans persistance R2).
        """
        lock_key = f"laha:epub_convert:{hashlib.sha256(epub_r2_key.encode()).hexdigest()[:32]}"
        redis_client = cls._get_redis_client()

        # Calcule la clé R2 du PDF converti : même chemin que l'EPUB, extension remplacée par .pdf
        pdf_r2_key = (
            epub_r2_key.rsplit('.epub', 1)[0] + '_converted.pdf'
            if epub_r2_key.lower().endswith('.epub')
            else epub_r2_key + '_converted.pdf'
        )

        def do_convert_and_persist() -> Optional[bytes]:
            """Effectue la conversion, l'upload R2 et la mise à jour BDD."""
            # Ré-vérification après acquisition du verrou (un autre process a peut-être déjà converti)
            lang_version.refresh_from_db()
            if lang_version.r2_key_pdf:
                data = cls._fetch_r2_object(lang_version.r2_key_pdf)
                if data:
                    logger.info(f"EPUB deja converti par un autre process (r2_key_pdf: {lang_version.r2_key_pdf}).")
                    return data

            # Téléchargement de l'EPUB depuis R2
            epub_data = cls._fetch_r2_object(epub_r2_key)
            if not epub_data:
                logger.error(f"Impossible de télécharger l'EPUB depuis R2: {epub_r2_key}")
                return None

            # Conversion EPUB → PDF vectoriel
            logger.info(f"Démarrage conversion EPUB -> PDF : {epub_r2_key} ({len(epub_data) // 1024} Ko)")
            pdf_data = cls._convert_epub_bytes_to_pdf(epub_data)
            if not pdf_data:
                return None
            logger.info(f"Conversion terminée : {len(pdf_data) // 1024} Ko de PDF généré.")

            # Persistance sur R2 + mise à jour BDD
            if cls._upload_pdf_to_r2(pdf_data, pdf_r2_key):
                try:
                    lang_version.r2_key_pdf = pdf_r2_key
                    lang_version.save(update_fields=['r2_key_pdf'])
                    logger.info(f"r2_key_pdf mis a jour en BDD : {pdf_r2_key}")
                except Exception as e:
                    logger.error(f"Echec mise a jour r2_key_pdf en BDD: {e}")

            return pdf_data

        if redis_client is None:
            # Fallback sans verrou si Redis est indisponible
            logger.warning("Redis indisponible - conversion EPUB sans verrou distribue (fallback gracieux).")
            epub_data = cls._fetch_r2_object(epub_r2_key)
            return cls._convert_epub_bytes_to_pdf(epub_data) if epub_data else None

        try:
            import redis as redis_lib
            lock = redis_client.lock(lock_key, timeout=120, blocking_timeout=125)
            with lock:
                return do_convert_and_persist()
        except Exception as e:
            logger.error(f"Erreur verrou Redis pour conversion EPUB ({epub_r2_key}): {e}")
            # Fallback gracieux en cas d'erreur Redis
            epub_data = cls._fetch_r2_object(epub_r2_key)
            return cls._convert_epub_bytes_to_pdf(epub_data) if epub_data else None

    @classmethod
    def _fetch_catalog_book(cls, book_id: str) -> bytes:
        """Récupère le fichier d'un ouvrage du catalogue interne LAHAThèque ou d'un dépôt éditeur/manuscrit."""
        from apps.catalog.models import Ouvrage, OuvrageLanguageVersion

        clean_book_id = book_id
        requested_lang = None
        if ":" in clean_book_id:
            clean_book_id, requested_lang = clean_book_id.split(":", 1)

        # 1. Vérification si clean_book_id est l'identifiant d'une OuvrageLanguageVersion
        lang_version = None
        try:
            lang_version = OuvrageLanguageVersion.objects.filter(id=clean_book_id).first()
        except Exception:
            pass

        if not lang_version and requested_lang:
            lang_version = OuvrageLanguageVersion.objects.filter(
                ouvrage_id=clean_book_id, language__iexact=requested_lang
            ).first()

        if lang_version:
            if lang_version.r2_key_pdf:
                data = cls._fetch_r2_object(lang_version.r2_key_pdf)
                if data:
                    return data
            if lang_version.r2_key_epub:
                pdf_data = cls._convert_epub_and_persist(lang_version, lang_version.r2_key_epub)
                if pdf_data:
                    return pdf_data

        ouvrage = None
        try:
            ouvrage = Ouvrage.objects.get(id=clean_book_id)
        except (Ouvrage.DoesNotExist, Exception):
            # Fallback sur slug ou ISBN
            ouvrage = Ouvrage.objects.filter(isbn=clean_book_id).first()

        if ouvrage:
            # Si une déclinaison linguistique R2 existe pour cet ouvrage
            if requested_lang:
                lv = OuvrageLanguageVersion.objects.filter(
                    ouvrage=ouvrage, language__iexact=requested_lang
                ).first()
                if lv:
                    if lv.r2_key_pdf:
                        data = cls._fetch_r2_object(lv.r2_key_pdf)
                        if data:
                            return data
                    if lv.r2_key_epub:
                        pdf_data = cls._convert_epub_and_persist(lv, lv.r2_key_epub)
                        if pdf_data:
                            return pdf_data

            # Le champ fichier est 'file' sur le modèle Ouvrage
            if ouvrage.file:
                try:
                    with ouvrage.file.open("rb") as f:
                        file_bytes = f.read()
                        if str(ouvrage.file.name).lower().endswith(".epub"):
                            pdf_data = cls._convert_epub_bytes_to_pdf(file_bytes)
                            if pdf_data:
                                return pdf_data
                        return file_bytes
                except Exception as e:
                    logger.error(f"Erreur lecture fichier ouvrage {book_id}: {e}")

            # Si le fichier local n'existe pas mais qu'une déclinaison R2 originale existe
            orig_lv = OuvrageLanguageVersion.objects.filter(ouvrage=ouvrage).order_by('-is_original').first()
            if orig_lv:
                if orig_lv.r2_key_pdf:
                    data = cls._fetch_r2_object(orig_lv.r2_key_pdf)
                    if data:
                        return data
                if orig_lv.r2_key_epub:
                    pdf_data = cls._convert_epub_and_persist(orig_lv, orig_lv.r2_key_epub)
                    if pdf_data:
                        return pdf_data

            # Fallback fichier physique de test
            fallback_path = os.path.join(settings.BASE_DIR, "media", f"{clean_book_id}.pdf")
            if os.path.exists(fallback_path):
                with open(fallback_path, "rb") as f:
                    return f.read()

        # Vérification si c'est un dépôt éditeur (PublisherBookDeposit)
        from apps.publishers_portal.models import PublisherBookDeposit
        deposit = None
        try:
            deposit = PublisherBookDeposit.objects.filter(id=book_id).first()
        except Exception:
            deposit = PublisherBookDeposit.objects.filter(isbn_digital=book_id).first()

        if deposit:
            if deposit.file_url:
                try:
                    if deposit.file_url.startswith("http://") or deposit.file_url.startswith("https://"):
                        return cls._fetch_external_url(deposit.file_url, options={})
                    from django.core.files.storage import default_storage
                    clean_path = deposit.file_url.lstrip("/")
                    if default_storage.exists(clean_path):
                        with default_storage.open(clean_path, "rb") as f:
                            return f.read()
                    local_fpath = os.path.join(settings.BASE_DIR, "media", clean_path)
                    if os.path.exists(local_fpath):
                        with open(local_fpath, "rb") as f:
                            return f.read()
                except Exception as e:
                    logger.error(f"Erreur récupération file_url du dépôt {book_id}: {e}")

        # Vérification si c'est une soumission de manuscrit auteur (AuthorManuscriptSubmission)
        from apps.rights.models import AuthorManuscriptSubmission
        sub = None
        try:
            sub = AuthorManuscriptSubmission.objects.filter(id=book_id).first()
        except Exception:
            sub = None

        if sub and sub.manuscript_file:
            try:
                with sub.manuscript_file.open("rb") as f:
                    return f.read()
            except Exception as e:
                logger.error(f"Erreur lecture manuscrit auteur {book_id}: {e}")

        raise DocumentSourceError(
            f"Aucun fichier source disponible pour l'ouvrage {book_id}."
        )


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
