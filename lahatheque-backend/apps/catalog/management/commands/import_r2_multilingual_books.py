"""
Commande Django d'ingestion et de synchronisation des ouvrages multilingues
depuis le bucket Cloudflare R2 (laha-books-production).

Fonctionnalites :
- Analyse de l'arborescence books/<uuid>/
- Qualification bilingue selon l'Option A (EN/ -> Original, FR/ -> Traduction)
- Echantillonnage PyMuPDF (15 premieres et 15 dernieres pages)
- Extraction documentaire IA (titre, sous-titre, auteur, discipline, code Dewey, resume 512 car.)
- Generation automatique de la couverture WebP (premiere page du PDF original)
- Creation de l'Ouvrage maitre et des enregistrements OuvrageLanguageVersion
- Configuration de la redevance par defaut de 5%
- Traitement resilient non-bloquant avec statut 'draft' en cas d'anomalie
"""

import io
import json
import logging
import os
import re
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import boto3
from botocore.config import Config
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.ai_engine.services.openai_service import (
    analyze_document_with_openai,
    extract_text_sample_from_bytes,
)
from apps.catalog.models import BookAuthor, Discipline, Ouvrage, OuvrageLanguageVersion
from apps.catalog.services.cover_generator import (
    extract_cover_image_bytes,
    generate_and_upload_cover,
    get_r2_books_client,
    get_r2_s3_client,
)
from apps.rights.models import RoyaltyRate

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Ingere et synchronise les ouvrages bilingues depuis le bucket Cloudflare R2."

    def add_arguments(self, parser):
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Nombre maximal de livres a traiter (utile pour les tests et le MVP).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simule l'ingestion sans ecrire en base de donnees ni sur R2.",
        )
        parser.add_argument(
            "--skip-cover",
            action="store_true",
            help="Ignore la generation et le televersement de couverture.",
        )
        parser.add_argument(
            "--inventory-file",
            type=str,
            default="",
            help="Chemin vers un fichier d'inventaire JSON (ex: r2_bucket_inventory.json) pour eviter de rescanner R2.",
        )
        parser.add_argument(
            "--checkpoint-file",
            type=str,
            default="import_r2_checkpoint.json",
            help="Fichier de checkpoint pour reprendre l'import apres une coupure (defaut: import_r2_checkpoint.json).",
        )

    def handle(self, *args, **options):
        limit = options.get("limit")
        dry_run = options.get("dry_run", False)
        skip_cover = options.get("skip_cover", False)
        inventory_file = options.get("inventory_file", "")
        checkpoint_file = options.get("checkpoint_file", "import_r2_checkpoint.json")

        # --- Chargement du checkpoint (reprise apres coupure) ---
        checkpoint_path = Path(checkpoint_file)
        processed_uuids: set = set()
        if checkpoint_path.exists() and not dry_run:
            try:
                with open(checkpoint_path, "r", encoding="utf-8") as f:
                    processed_uuids = set(json.load(f).get("processed", []))
                self.stdout.write(
                    self.style.NOTICE(
                        f"[Import R2] Reprise depuis checkpoint : {len(processed_uuids)} ouvrages deja traites, ignores."
                    )
                )
            except Exception as e:
                logger.warning(f"[Import R2] Impossible de lire le checkpoint {checkpoint_path}: {e}")

        def _save_checkpoint():
            if not dry_run:
                try:
                    with open(checkpoint_path, "w", encoding="utf-8") as f:
                        json.dump({"processed": list(processed_uuids)}, f)
                except Exception as e:
                    logger.warning(f"[Import R2] Impossible d'ecrire le checkpoint: {e}")

        self.stdout.write(
            self.style.NOTICE(
                f"[Import R2] Demarrage de l'ingestion multilingue (limit={limit}, dry_run={dry_run})"
            )
        )

        s3 = get_r2_books_client()
        bucket_name = getattr(settings, "CLOUDFLARE_R2_BOOKS_BUCKET_NAME", "laha-books-production")

        # 1. Regroupement des fichiers par UUID d'ouvrage
        grouped_books = self._collect_books_from_inventory_or_r2(
            s3=s3,
            bucket_name=bucket_name,
            inventory_file=inventory_file,
            limit=limit,
        )

        total_to_process = len(grouped_books)
        self.stdout.write(
            self.style.SUCCESS(
                f"[Import R2] {total_to_process} ouvrages regroupes a traiter."
            )
        )

        success_count = 0
        error_count = 0

        for index, (book_uuid_str, book_data) in enumerate(grouped_books.items(), start=1):
            # Sauter les ouvrages deja traites (reprise apres coupure)
            if book_uuid_str in processed_uuids:
                self.stdout.write(
                    f"[{index}/{total_to_process}] UUID {book_uuid_str} deja traite, ignore."
                )
                success_count += 1
                continue

            self.stdout.write(
                f"\n--- [{index}/{total_to_process}] Traitement de l'ouvrage UUID: {book_uuid_str} ---"
            )
            try:
                self._process_single_book(
                    book_uuid_str=book_uuid_str,
                    book_data=book_data,
                    s3=s3,
                    bucket_name=bucket_name,
                    dry_run=dry_run,
                    skip_cover=skip_cover,
                )
                success_count += 1
                processed_uuids.add(book_uuid_str)
                _save_checkpoint()  # Ecriture immediate apres chaque succes
            except Exception as e:
                error_count += 1
                logger.error(
                    f"[Import R2 ERREUR] Echec du traitement pour {book_uuid_str}: {e}",
                    exc_info=True,
                )
                self.stdout.write(
                    self.style.ERROR(
                        f"[Import R2 ERREUR] Echec pour {book_uuid_str}: {e}"
                    )
                )

        self.stdout.write("\n" + "=" * 60)
        self.stdout.write(
            self.style.SUCCESS(
                f"[Import R2 TERMINE] Traitement acheve : {success_count} succes, {error_count} erreurs."
            )
        )
        if checkpoint_path.exists() and not dry_run and error_count == 0:
            checkpoint_path.unlink(missing_ok=True)
            self.stdout.write("[Import R2] Checkpoint supprime (run complet reussi).")


    def _collect_books_from_inventory_or_r2(
        self,
        s3: Any,
        bucket_name: str,
        inventory_file: str,
        limit: Optional[int],
    ) -> Dict[str, Dict[str, Any]]:
        """
        Regroupe les cles R2 sous chaque UUID d'ouvrage.
        Utilise le fichier d'inventaire local s'il est disponible pour accelerer le scan.
        """
        candidate_paths = [
            inventory_file,
            os.path.join(settings.BASE_DIR, "r2_bucket_inventory.json"),
            os.path.join(settings.BASE_DIR, "..", "r2_bucket_inventory.json"),
        ]

        loaded_files: List[Dict[str, Any]] = []
        for path in candidate_paths:
            if path and os.path.exists(path):
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        loaded_files = data.get("files", [])
                        self.stdout.write(
                            f"[Import R2] Inventaire charge depuis {path} ({len(loaded_files)} fichiers)"
                        )
                        break
                except Exception as e:
                    logger.warning(f"Impossible de lire l'inventaire {path}: {e}")

        # Si pas d'inventaire local, scan en direct via paginator boto3
        if not loaded_files:
            self.stdout.write(
                f"[Import R2] Scan en direct du bucket R2 '{bucket_name}' avec prefixe 'books/'..."
            )
            paginator = s3.get_paginator("list_objects_v2")
            for page in paginator.paginate(Bucket=bucket_name, Prefix="books/"):
                for item in page.get("Contents", []):
                    loaded_files.append({"key": item["Key"], "size_bytes": item["Size"]})

        grouped: Dict[str, Dict[str, Any]] = {}

        uuid_regex = re.compile(
            r"books/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/",
            re.IGNORECASE,
        )

        for item in loaded_files:
            key = item.get("key", "")
            match = uuid_regex.search(key)
            if not match:
                continue

            book_uuid = match.group(1).lower()
            if book_uuid not in grouped:
                grouped[book_uuid] = {
                    "en_pdf": None,
                    "en_epub": None,
                    "fr_pdf": None,
                    "fr_epub": None,
                    "other_files": [],
                }

            lower_key = key.lower()
            if "/en/" in lower_key:
                if lower_key.endswith(".pdf") and not grouped[book_uuid]["en_pdf"]:
                    grouped[book_uuid]["en_pdf"] = key
                elif lower_key.endswith(".epub") and not grouped[book_uuid]["en_epub"]:
                    grouped[book_uuid]["en_epub"] = key
                else:
                    grouped[book_uuid]["other_files"].append(key)
            elif "/fr/" in lower_key:
                if lower_key.endswith(".pdf") and not grouped[book_uuid]["fr_pdf"]:
                    grouped[book_uuid]["fr_pdf"] = key
                elif lower_key.endswith(".epub") and not grouped[book_uuid]["fr_epub"]:
                    grouped[book_uuid]["fr_epub"] = key
                else:
                    grouped[book_uuid]["other_files"].append(key)
            else:
                grouped[book_uuid]["other_files"].append(key)

        # Si une limite est demandee, reduire le dictionnaire
        if limit and limit > 0:
            filtered_items = list(grouped.items())[:limit]
            grouped = dict(filtered_items)

        return grouped

    def _process_single_book(
        self,
        book_uuid_str: str,
        book_data: Dict[str, Any],
        s3: Any,
        bucket_name: str,
        dry_run: bool,
        skip_cover: bool,
    ) -> None:
        """
        Traite un ouvrage bilingue de maniere atomique et resiliente avec logs d'etapes.
        """
        book_uuid = uuid.UUID(book_uuid_str)
        en_pdf_key = book_data.get("en_pdf")
        fr_pdf_key = book_data.get("fr_pdf")
        en_epub_key = book_data.get("en_epub") or ""
        fr_epub_key = book_data.get("fr_epub") or ""

        # Identification du PDF maitre pour extraction
        primary_pdf_key = en_pdf_key or fr_pdf_key
        if not primary_pdf_key:
            self.stdout.write(
                self.style.WARNING(
                    f"[Import R2 ETAPE 1/6] Aucun fichier PDF trouve pour {book_uuid_str}, abandon."
                )
            )
            return

        self.stdout.write(
            f"[Import R2 ETAPE 1/6] Qualification bilingue (Option A) :\n"
            f"  - EN (Original) : PDF='{en_pdf_key}', EPUB='{en_epub_key}'\n"
            f"  - FR (Traduction): PDF='{fr_pdf_key}', EPUB='{fr_epub_key}'"
        )

        # ETAPE 2 : Telechargement et echantillonnage PyMuPDF (15 premieres et 15 dernieres pages)
        self.stdout.write(
            f"[Import R2 ETAPE 2/6] Telechargement partiel et echantillonnage 15p+15p depuis '{primary_pdf_key}'..."
        )

        pdf_bytes = b""
        text_sample = ""
        total_pages = 0

        try:
            resp = s3.get_object(Bucket=bucket_name, Key=primary_pdf_key)
            pdf_bytes = resp["Body"].read()
            text_sample, total_pages = extract_text_sample_from_bytes(pdf_bytes, file_ext="pdf")
            self.stdout.write(
                f"[Import R2 ETAPE 2/6] Echantillon extrait : {len(text_sample)} caracteres sur {total_pages} pages."
            )
        except Exception as e:
            logger.warning(
                f"[Import R2] Impossible de lire le PDF pour {book_uuid_str}: {e}"
            )
            self.stdout.write(
                self.style.WARNING(
                    f"[Import R2] Avertissement PDF illisible pour {book_uuid_str}: {e}. Mode degrade actif."
                )
            )

        # ETAPE 3 : Analyse documentaire IA (OpenAI + Fallback Heuristique)
        self.stdout.write(
            f"[Import R2 ETAPE 3/6] Analyse IA des métadonnées (titre, discipline, Dewey, 4e de couverture)..."
        )
        fake_filename = os.path.basename(primary_pdf_key) or f"{book_uuid_str}.pdf"
        ai_meta = analyze_document_with_openai(
            text_sample=text_sample,
            filename=fake_filename,
            total_pages=total_pages or 120,
        )

        book_title = ai_meta.get("title") or f"Ouvrage {book_uuid_str[:8]}"
        book_subtitle = ai_meta.get("subtitle") or ""
        book_isbn = ai_meta.get("isbn") or ""
        book_summary = (ai_meta.get("summary") or "")[:512]
        genre_name = ai_meta.get("genre_category") or "Sciences humaines"
        dewey_code = ai_meta.get("dewey_code") or "000"
        publisher_name = ai_meta.get("publisher_name") or "LAHA Éditions"
        authors_list = ai_meta.get("authors") or ["Auteur LAHAThèque"]

        # ETAPE 4 : Extraction couverture page 1 vers WebP et R2
        cover_url = ""
        if not skip_cover and pdf_bytes:
            self.stdout.write(
                f"[Import R2 ETAPE 4/6] Extraction couverture page 1 vers WebP..."
            )
            try:
                if not dry_run:
                    _, cover_url = generate_and_upload_cover(
                        pdf_bytes=pdf_bytes,
                        book_uuid=book_uuid_str,
                    )
                    self.stdout.write(
                        f"[Import R2 ETAPE 4/6] Couverture R2 generee avec succes : {cover_url}"
                    )
                else:
                    self.stdout.write(
                        "[Import R2 ETAPE 4/6] [DRY RUN] Couverture simulee."
                    )
            except Exception as e:
                logger.warning(
                    f"[Import R2] Echec generation couverture pour {book_uuid_str}: {e}"
                )
                self.stdout.write(
                    self.style.WARNING(
                        f"[Import R2 ETAPE 4/6] Avertissement couverture: {e}"
                    )
                )

        if dry_run:
            self.stdout.write(
                self.style.NOTICE(
                    f"[Import R2 DRY-RUN] Simulation reussie pour '{book_title}' (UUID: {book_uuid_str})."
                )
            )
            return

        # ETAPE 5 : Enregistrement de l'Ouvrage maitre et de ses declinaisons linguistiques
        self.stdout.write(
            f"[Import R2 ETAPE 5/6] Enregistrement en base de donnees (Ouvrage + OuvrageLanguageVersion)..."
        )

        with transaction.atomic():
            # Association ou creation de la discipline
            discipline_obj = Discipline.objects.filter(is_active=True, name__iexact=genre_name).first()
            if not discipline_obj:
                discipline_obj = Discipline.objects.filter(is_active=True).first()

            # Creation ou mise a jour de l'ouvrage maitre
            ouvrage, created = Ouvrage.objects.update_or_create(
                id=book_uuid,
                defaults={
                    "title": book_title,
                    "subtitle": book_subtitle,
                    "isbn": book_isbn,
                    "summary": book_summary,
                    "dewey_code": dewey_code,
                    "publisher_name": publisher_name,
                    "language": "en" if en_pdf_key else "fr",
                    "status": "published" if text_sample else "draft",
                    "price_digital": 5000.00,
                    "price_paper": 7500.00,
                    "page_count": total_pages,
                    "discipline": discipline_obj,
                    "is_paper_available": False,
                    "cover_image": f"covers/{book_uuid_str}/cover.webp" if cover_url else "",
                },
            )

            # Association des auteurs
            for author_name in authors_list:
                parts = author_name.strip().split(" ", 1)
                first_name = parts[0] if parts else "Auteur"
                last_name = parts[1] if len(parts) > 1 else "LAHA"
                author_obj, _ = BookAuthor.objects.get_or_create(
                    first_name=first_name,
                    last_name=last_name,
                )
                ouvrage.authors.add(author_obj)

            # Declinaison linguistique ANGLAISE (Original - Option A)
            if en_pdf_key or en_epub_key:
                OuvrageLanguageVersion.objects.update_or_create(
                    ouvrage=ouvrage,
                    language="en",
                    defaults={
                        "is_original": True,
                        "title": book_title,
                        "summary": book_summary,
                        "r2_key_pdf": en_pdf_key or "",
                        "r2_key_epub": en_epub_key,
                        "cover_url": cover_url,
                        "page_count": total_pages,
                        "is_paper_available": True,
                        "paper_stock": 50,
                        "translation_status": "ready",
                    },
                )
                self.stdout.write(
                    f"  - Version [EN] Originale creee / synchronisee."
                )

            # Declinaison linguistique FRANCAISE (Traduction - Option A)
            if fr_pdf_key or fr_epub_key:
                OuvrageLanguageVersion.objects.update_or_create(
                    ouvrage=ouvrage,
                    language="fr",
                    defaults={
                        "is_original": False if en_pdf_key else True,
                        "title": book_title,
                        "summary": book_summary,
                        "r2_key_pdf": fr_pdf_key or "",
                        "r2_key_epub": fr_epub_key,
                        "cover_url": cover_url,
                        "page_count": total_pages,
                        "is_paper_available": True,
                        "paper_stock": 50,
                        "translation_status": "ready",
                    },
                )
                self.stdout.write(
                    f"  - Version [FR] Traduction creee / synchronisee."
                )

            # ETAPE 6 : Attribution de la redevance par defaut de 5%
            self.stdout.write(
                f"[Import R2 ETAPE 6/6] Configuration de la redevance numerique 5% (RoyaltyRate)..."
            )
            RoyaltyRate.objects.update_or_create(
                ouvrage=ouvrage,
                defaults={
                    "author_share_percent": 0.00,
                    "publisher_share_percent": 5.00,
                    "platform_share_percent": 95.00,
                },
            )

        self.stdout.write(
            self.style.SUCCESS(
                f"[Import R2 SUCCES] Ouvrage '{book_title}' (UUID: {book_uuid_str}) importe avec succes !"
            )
        )
