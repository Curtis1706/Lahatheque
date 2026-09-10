"""
Commande Django d'ingestion et de synchronisation différentielle des ouvrages multilingues
depuis le bucket Cloudflare R2 (laha-books-production).

Fonctionnalites et Optimisations :
- Analyse DIFFERENTIELLE prealable contre la base de donnees PostgreSQL.
- Seuls les NOUVEAUX ouvrages (absents de la DB) declenchent l'analyse IA OpenAI (gpt-4o-mini).
- Les ouvrages deja presents en base sont automatiquement ignores (0 consommation de tokens IA).
- Si une nouvelle traduction (FR/EN) ou un nouveau fichier arrive pour un livre existant,
  seul l'enregistrement OuvrageLanguageVersion est mis a jour SANS AUCUN APPEL A L'IA.
- Qualification bilingue selon l'Option A (EN/ -> Original, FR/ -> Traduction).
- Echantillonnage PyMuPDF (15 premieres et 15 dernieres pages).
- Generation automatique de la couverture WebP pour les nouveaux livres.
- Creation de l'Ouvrage maitre et des enregistrements OuvrageLanguageVersion.
- Configuration de la redevance par defaut de 5% (RoyaltyRate).
- Traitement resilient non-bloquant avec logs clairs sans aucun emoji.
"""

import io
import json
import logging
import os
import re
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

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
    help = (
        "Ingere et synchronise les ouvrages bilingues depuis le bucket Cloudflare R2 "
        "en effectuant une analyse differentielle prealable pour preserver la cle OpenAI."
    )

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
            "--force-reanalyze",
            action="store_true",
            help="Force la re-analyse IA meme si le livre existe deja en base (a utiliser avec prudence).",
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
            help="Fichier de checkpoint optionnel (defaut: import_r2_checkpoint.json).",
        )

    def handle(self, *args, **options):
        limit = options.get("limit")
        dry_run = options.get("dry_run", False)
        skip_cover = options.get("skip_cover", False)
        force_reanalyze = options.get("force_reanalyze", False)
        inventory_file = options.get("inventory_file", "")
        checkpoint_file = options.get("checkpoint_file", "import_r2_checkpoint.json")

        self.stdout.write(
            self.style.NOTICE(
                f"[Import R2] Demarrage de la synchronisation differentielle multilingue "
                f"(limit={limit}, dry_run={dry_run}, force_reanalyze={force_reanalyze})"
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

        total_inventoried = len(grouped_books)
        self.stdout.write(
            self.style.NOTICE(
                f"[Import R2] {total_inventoried} ouvrages detectes dans l'inventaire R2."
            )
        )

        # 2. ANALYSE DIFFERENTIELLE : Comparaison avec l'etat reel en base de donnees
        already_synced, to_sync_translations, to_ingest_new = self._analyze_differential(
            grouped_books=grouped_books,
            force_reanalyze=force_reanalyze,
        )

        self.stdout.write("=" * 65)
        self.stdout.write("[Import R2 ANALYSE DIFFERENTIELLE PREALABLE]")
        self.stdout.write(f"  - Total ouvrages inventories sur R2         : {total_inventoried}")
        self.stdout.write(
            self.style.SUCCESS(
                f"  - Ouvrages deja en base et a jour (ignores)   : {len(already_synced)} (0 appel IA)"
            )
        )
        self.stdout.write(
            self.style.WARNING(
                f"  - Ouvrages avec traductions a synchroniser    : {len(to_sync_translations)} (0 appel IA)"
            )
        )
        self.stdout.write(
            self.style.NOTICE(
                f"  - Nouveaux ouvrages a ingerer                 : {len(to_ingest_new)} (Analyse IA requise)"
            )
        )
        self.stdout.write("=" * 65)

        # Si aucun nouveau livre et aucune traduction a matcher, terminer immediatement
        if not to_sync_translations and not to_ingest_new:
            self.stdout.write(
                self.style.SUCCESS(
                    "[Import R2] Catalogue parfaitement synchronise avec la base de donnees. "
                    "Aucune action requise, aucun token OpenAI consomme."
                )
            )
            return

        # 3. Traitement des nouvelles traductions pour les livres existants (0 APPEL IA)
        translations_success = 0
        translations_errors = 0
        if to_sync_translations:
            self.stdout.write(
                self.style.NOTICE(
                    f"\n[Import R2] Debut de la synchronisation de {len(to_sync_translations)} traductions "
                    f"pour ouvrages existants (sans appel IA)..."
                )
            )
            for idx, (b_uuid, diff_info) in enumerate(to_sync_translations.items(), start=1):
                try:
                    self._sync_translations_for_existing_book(
                        book_uuid_str=b_uuid,
                        diff_info=diff_info,
                        dry_run=dry_run,
                    )
                    translations_success += 1
                except Exception as e:
                    translations_errors += 1
                    logger.error(
                        f"[Import R2 ERREUR] Echec synchro traduction pour {b_uuid}: {e}",
                        exc_info=True,
                    )
                    self.stdout.write(
                        self.style.ERROR(
                            f"[Import R2 ERREUR] Echec synchro traduction pour {b_uuid}: {e}"
                        )
                    )

        # 4. Traitement des NOUVEAUX ouvrages absents de la base (Analyse IA)
        new_books_success = 0
        new_books_errors = 0
        if to_ingest_new:
            self.stdout.write(
                self.style.NOTICE(
                    f"\n[Import R2] Debut de l'ingestion de {len(to_ingest_new)} nouveaux ouvrages..."
                )
            )
            total_new = len(to_ingest_new)
            for idx, b_uuid in enumerate(to_ingest_new, start=1):
                b_data = grouped_books[b_uuid]
                self.stdout.write(
                    f"\n--- [{idx}/{total_new}] Ingestion nouveau livre UUID: {b_uuid} ---"
                )
                try:
                    self._process_single_book(
                        book_uuid_str=b_uuid,
                        book_data=b_data,
                        s3=s3,
                        bucket_name=bucket_name,
                        dry_run=dry_run,
                        skip_cover=skip_cover,
                    )
                    new_books_success += 1
                except Exception as e:
                    new_books_errors += 1
                    logger.error(
                        f"[Import R2 ERREUR] Echec ingestion pour {b_uuid}: {e}",
                        exc_info=True,
                    )
                    self.stdout.write(
                        self.style.ERROR(
                            f"[Import R2 ERREUR] Echec pour {b_uuid}: {e}"
                        )
                    )

        self.stdout.write("\n" + "=" * 65)
        self.stdout.write(
            self.style.SUCCESS(
                f"[Import R2 TERMINE] Resultat de la synchronisation differentielle :\n"
                f"  - Ouvrages deja a jour ignores          : {len(already_synced)}\n"
                f"  - Traductions synchronisees (sans IA)   : {translations_success} succes, {translations_errors} erreurs\n"
                f"  - Nouveaux ouvrages ingeres (avec IA)   : {new_books_success} succes, {new_books_errors} erreurs"
            )
        )

    def _analyze_differential(
        self,
        grouped_books: Dict[str, Dict[str, Any]],
        force_reanalyze: bool = False,
    ) -> Tuple[List[str], Dict[str, Dict[str, Any]], List[str]]:
        """
        Compare en une seule passe memoire l'inventaire R2 avec les enregistrements PostgreSQL.
        Retourne :
        1. already_synced : liste des UUIDs deja complets et a jour en base.
        2. to_sync_translations : dict des UUIDs existants ayant une nouvelle langue ou un fichier complete.
        3. to_ingest_new : liste des UUIDs totalement absents de la base (nouveaux livres).
        """
        # 1. Ensemble de tous les UUIDs d'ouvrages presents en base
        existing_ouvrage_ids: Set[str] = set(
            str(uid).lower()
            for uid in Ouvrage.objects.values_list("id", flat=True)
        )

        # 2. Cartographie des versions linguistiques existantes par ouvrage
        existing_versions: Dict[str, Dict[str, Dict[str, str]]] = {}
        for item in OuvrageLanguageVersion.objects.values(
            "ouvrage_id", "language", "r2_key_pdf", "r2_key_epub"
        ):
            b_id = str(item["ouvrage_id"]).lower()
            if b_id not in existing_versions:
                existing_versions[b_id] = {}
            existing_versions[b_id][item["language"]] = {
                "r2_key_pdf": item["r2_key_pdf"] or "",
                "r2_key_epub": item["r2_key_epub"] or "",
            }

        already_synced: List[str] = []
        to_sync_translations: Dict[str, Dict[str, Any]] = {}
        to_ingest_new: List[str] = []

        for book_uuid_str, book_data in grouped_books.items():
            uuid_key = book_uuid_str.lower()

            # Si re-analyse forcee demandee explicitement par l'administrateur
            if force_reanalyze:
                to_ingest_new.append(book_uuid_str)
                continue

            # Cas A : L'ouvrage n'existe pas du tout en base -> Nouveau livre
            if uuid_key not in existing_ouvrage_ids:
                to_ingest_new.append(book_uuid_str)
                continue

            # Cas B : L'ouvrage existe deja en base -> Verifier s'il a de nouveaux fichiers / langues
            db_versions = existing_versions.get(uuid_key, {})
            en_pdf = book_data.get("en_pdf") or ""
            en_epub = book_data.get("en_epub") or ""
            fr_pdf = book_data.get("fr_pdf") or ""
            fr_epub = book_data.get("fr_epub") or ""

            has_new_en = False
            if en_pdf or en_epub:
                if "en" not in db_versions:
                    has_new_en = True
                else:
                    curr_en = db_versions["en"]
                    if en_pdf and not curr_en.get("r2_key_pdf"):
                        has_new_en = True
                    if en_epub and not curr_en.get("r2_key_epub"):
                        has_new_en = True

            has_new_fr = False
            if fr_pdf or fr_epub:
                if "fr" not in db_versions:
                    has_new_fr = True
                else:
                    curr_fr = db_versions["fr"]
                    if fr_pdf and not curr_fr.get("r2_key_pdf"):
                        has_new_fr = True
                    if fr_epub and not curr_fr.get("r2_key_epub"):
                        has_new_fr = True

            if has_new_en or has_new_fr:
                to_sync_translations[book_uuid_str] = {
                    "has_new_en": has_new_en,
                    "has_new_fr": has_new_fr,
                    "book_data": book_data,
                }
            else:
                already_synced.append(book_uuid_str)

        return already_synced, to_sync_translations, to_ingest_new

    def _sync_translations_for_existing_book(
        self,
        book_uuid_str: str,
        diff_info: Dict[str, Any],
        dry_run: bool = False,
    ) -> None:
        """
        Rattache ou met a jour les versions linguistiques pour un ouvrage deja existant
        SANS AUCUN APPEL A L'IA OPENAI.
        """
        book_uuid = uuid.UUID(book_uuid_str)
        ouvrage = Ouvrage.objects.filter(id=book_uuid).first()
        if not ouvrage:
            return

        book_data = diff_info.get("book_data", {})
        en_pdf_key = book_data.get("en_pdf") or ""
        fr_pdf_key = book_data.get("fr_pdf") or ""
        en_epub_key = book_data.get("en_epub") or ""
        fr_epub_key = book_data.get("fr_epub") or ""

        if dry_run:
            self.stdout.write(
                self.style.NOTICE(
                    f"[Import R2 DRY-RUN] Mise a jour des traductions simulee pour '{ouvrage.title}' "
                    f"(UUID: {book_uuid_str})."
                )
            )
            return

        cover_url = getattr(ouvrage, "cover_url", "")

        with transaction.atomic():
            if diff_info.get("has_new_en") and (en_pdf_key or en_epub_key):
                OuvrageLanguageVersion.objects.update_or_create(
                    ouvrage=ouvrage,
                    language="en",
                    defaults={
                        "is_original": True,
                        "title": ouvrage.title,
                        "summary": ouvrage.summary,
                        "r2_key_pdf": en_pdf_key,
                        "r2_key_epub": en_epub_key,
                        "cover_url": cover_url,
                        "page_count": ouvrage.page_count,
                        "is_paper_available": True,
                        "paper_stock": 50,
                        "translation_status": "ready",
                    },
                )
                self.stdout.write(
                    f"[Import R2 SYNCHRO] Version [EN] associee a l'ouvrage existant '{ouvrage.title}' (0 appel IA)."
                )

            if diff_info.get("has_new_fr") and (fr_pdf_key or fr_epub_key):
                OuvrageLanguageVersion.objects.update_or_create(
                    ouvrage=ouvrage,
                    language="fr",
                    defaults={
                        "is_original": False if en_pdf_key else True,
                        "title": ouvrage.title,
                        "summary": ouvrage.summary,
                        "r2_key_pdf": fr_pdf_key,
                        "r2_key_epub": fr_epub_key,
                        "cover_url": cover_url,
                        "page_count": ouvrage.page_count,
                        "is_paper_available": True,
                        "paper_stock": 50,
                        "translation_status": "ready",
                    },
                )
                self.stdout.write(
                    f"[Import R2 SYNCHRO] Version [FR] associee a l'ouvrage existant '{ouvrage.title}' (0 appel IA)."
                )

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
        Traite un NOUVEL ouvrage de maniere atomique et resiliente avec logs d'etapes.
        Effectue l'echantillonnage, l'analyse IA OpenAI et la creation de l'Ouvrage maitre.
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
