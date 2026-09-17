"""
Commande Django de correction en masse de l'année de parution des ouvrages.

Objectif : corriger publication_date pour les 1 601 ouvrages dont l'année est
NULL ou incorrecte (valeur 2026 issue de l'import R2 initial).

Stratégie d'extraction (0 coût IA par défaut) :
1. Lecture des 15 premières et 15 dernières pages du PDF depuis Cloudflare R2.
2. Application de extract_publication_year_from_text (regex pure, 0 token IA).
3. Si --force-ai est activé et que la regex échoue : appel OpenAI minimal.
4. Mise à jour de publication_date = date(année_trouvée, 1, 1).

Usage :
    python manage.py fix_publication_dates
    python manage.py fix_publication_dates --dry-run
    python manage.py fix_publication_dates --limit 20
    python manage.py fix_publication_dates --force-ai
    python manage.py fix_publication_dates --all --status all
"""

import datetime
import logging
import re
from typing import Optional, Tuple

from django.core.management.base import BaseCommand
from django.db.models import Q

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = (
        "Corrige publication_date des ouvrages dont l'annee est NULL ou >= 2026, "
        "en lisant le PDF depuis Cloudflare R2 (via OuvrageLanguageVersion ou file) "
        "et en analysant avec l'IA les 15 premieres et 15 dernieres pages extraites."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Simule la correction sans ecrire en base de donnees.",
        )
        parser.add_argument(
            "--limit",
            type=int,
            default=None,
            help="Nombre maximal d'ouvrages a traiter.",
        )
        parser.add_argument(
            "--no-ai",
            action="store_true",
            help="Desactive l'appel IA et utilise uniquement la regex (0 token consomme).",
        )
        parser.add_argument(
            "--all",
            action="store_true",
            help="Traite tous les ouvrages (y compris ceux avec une annee deja renseignee).",
        )
        parser.add_argument(
            "--min-year",
            type=int,
            default=1500,
            help="Annee minimale consideree valide (defaut: 1500, aucune contrainte moderne arbitraire).",
        )
        parser.add_argument(
            "--status",
            type=str,
            default="published",
            help="Filtre par statut d'ouvrage (defaut: published). 'all' pour ignorer.",
        )

    def handle(self, *args, **options):
        from apps.catalog.models import Ouvrage
        from apps.ai_engine.services.openai_service import (
            extract_text_sample_from_bytes,
            extract_publication_year_from_text,
        )
        from apps.catalog.services.cover_generator import get_r2_books_client
        from django.conf import settings

        dry_run: bool = options["dry_run"]
        limit: Optional[int] = options.get("limit")
        no_ai: bool = options["no_ai"]
        treat_all: bool = options["all"]
        min_year: int = options["min_year"]
        status_filter: str = options.get("status", "published")
        current_year = datetime.date.today().year

        self.stdout.write(
            self.style.NOTICE(
                f"\n[fix_publication_dates] Demarrage\n"
                f"  dry_run   = {dry_run}\n"
                f"  limit     = {limit or 'illimite'}\n"
                f"  use_ai    = {not no_ai}\n"
                f"  all       = {treat_all}\n"
                f"  min_year  = {min_year}\n"
                f"  status    = {status_filter}\n"
            )
        )

        # --- Construction de la requete de selection ---
        if treat_all:
            qs = Ouvrage.objects.all()
        else:
            # Cible : publication_date NULL ou annee >= 2026 (incorrecte issue de l'import)
            qs = Ouvrage.objects.filter(
                Q(publication_date__isnull=True) |
                Q(publication_date__year__gte=2026)
            )

        if status_filter != "all":
            qs = qs.filter(status=status_filter)

        # Les ouvrages importes via R2 ont leurs fichiers dans OuvrageLanguageVersion (r2_key_pdf),
        # tandis que les ouvrages locaux utilisent le champ 'file'.
        qs = qs.filter(
            (Q(file__isnull=False) & ~Q(file="")) |
            (Q(language_versions__r2_key_pdf__isnull=False) & ~Q(language_versions__r2_key_pdf=""))
        ).distinct().order_by("created_at")

        total_candidates = qs.count()
        candidates = list(qs[:limit] if limit else qs)

        self.stdout.write(
            f"[fix_publication_dates] {total_candidates} ouvrages candidats trouves. "
            f"Traitement de {len(candidates)} ouvrage(s).\n"
        )

        if not candidates:
            self.stdout.write(self.style.SUCCESS("[fix_publication_dates] Rien a corriger."))
            return

        # --- Initialisation du client Cloudflare R2 ---
        try:
            s3 = get_r2_books_client()
            bucket_name = getattr(settings, "CLOUDFLARE_R2_BOOKS_BUCKET_NAME", "laha-books-production")
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"[fix_publication_dates] Client R2 inaccessible : {e}"))
            return

        # --- Compteurs ---
        fixed_ai = 0
        fixed_regex = 0
        already_ok = 0
        no_file = 0
        no_year = 0
        errors = 0

        for idx, ouvrage in enumerate(candidates, start=1):
            prefix = f"[{idx}/{len(candidates)}]"
            self.stdout.write(
                f"\n{prefix} {ouvrage.title[:70]!r}\n"
                f"  pub_date actuelle : {ouvrage.publication_date}"
            )

            # 1. Recuperation de la cle R2 du PDF (priorite a la version originale)
            file_key = ""
            orig_lv = (
                ouvrage.language_versions.filter(r2_key_pdf__isnull=False)
                .exclude(r2_key_pdf="")
                .order_by("-is_original")
                .first()
            )
            if orig_lv and orig_lv.r2_key_pdf:
                file_key = orig_lv.r2_key_pdf
            elif ouvrage.file and ouvrage.file.name:
                file_key = str(ouvrage.file.name)

            if not file_key:
                self.stdout.write("  -> Pas de fichier R2 associe. Ignore.")
                no_file += 1
                continue

            self.stdout.write(f"  -> Cle R2 : {file_key}")

            # 2. Lecture du PDF depuis R2 et echantillonnage distinct (15 premieres et 15 dernieres pages)
            front_text = ""
            back_text = ""
            total_pages = 0
            try:
                resp = s3.get_object(Bucket=bucket_name, Key=file_key)
                pdf_bytes = resp["Body"].read()
                front_text, back_text, total_pages = self._extract_front_and_back_pages(pdf_bytes)
                self.stdout.write(
                    f"  -> Echantillonnage : {total_pages} pages au total. "
                    f"15 premieres ({len(front_text)} car.) + 15 dernieres ({len(back_text)} car.)."
                )
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"  -> Erreur lecture R2 ({file_key}): {e}"))
                errors += 1
                continue

            combined_sample = (front_text + "\n\n" + back_text).strip()
            if not combined_sample:
                self.stdout.write("  -> Echantillon de texte vide (PDF non indexable ou sans texte). Ignore.")
                no_year += 1
                continue

            # 3. Extraction par IA (prioritaire et systematique comme dans l'import R2)
            detected_year: Optional[int] = None
            ai_reason: str = ""
            method = "none"

            if not no_ai:
                self.stdout.write("  -> Analyse IA des 15 premieres et 15 dernieres pages...")
                detected_year, ai_reason = self._extract_year_via_ai(
                    front_text=front_text,
                    back_text=back_text,
                    filename=file_key,
                    min_year=min_year,
                    current_year=current_year,
                )
                if detected_year and min_year <= detected_year <= current_year:
                    method = "openai"
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"  -> Annee detectee par IA : {detected_year}"
                            + (f" ({ai_reason})" if ai_reason else "")
                        )
                    )
                else:
                    detected_year = None

            # 4. Fallback regex si l'IA echoue ou est desactivee
            if not detected_year:
                detected_year = extract_publication_year_from_text(
                    combined_sample, filename=file_key, min_year=min_year
                )
                if detected_year and min_year <= detected_year <= current_year:
                    method = "regex"
                    self.stdout.write(f"  -> Annee detectee par fallback regex : {detected_year}")
                else:
                    detected_year = None

            if not detected_year:
                self.stdout.write("  -> Aucune annee inscrite dans les 15 premieres et 15 dernieres pages. Ignore.")
                no_year += 1
                continue

            new_pub_date = datetime.date(detected_year, 1, 1)

            if ouvrage.publication_date == new_pub_date:
                self.stdout.write(f"  -> Deja correct ({new_pub_date}). Ignore.")
                already_ok += 1
                continue

            self.stdout.write(
                f"  -> Correction : {ouvrage.publication_date} -> {new_pub_date} (via {method})"
            )

            if not dry_run:
                try:
                    ouvrage.publication_date = new_pub_date
                    ouvrage.save(update_fields=["publication_date"])
                    if method == "openai":
                        fixed_ai += 1
                    else:
                        fixed_regex += 1
                    self.stdout.write(self.style.SUCCESS("  -> Sauvegarde en base effectuee."))
                except Exception as e:
                    errors += 1
                    self.stdout.write(self.style.ERROR(f"  -> Erreur sauvegarde : {e}"))
            else:
                self.stdout.write(self.style.NOTICE("  -> [DRY-RUN] Simulation reussie (non persiste)."))
                if method == "openai":
                    fixed_ai += 1
                else:
                    fixed_regex += 1

        # --- Rapport final ---
        self.stdout.write("\n" + "=" * 65)
        self.stdout.write(
            self.style.SUCCESS(
                f"[fix_publication_dates] Rapport final :\n"
                f"  Candidats trouves             : {total_candidates}\n"
                f"  Traites                       : {len(candidates)}\n"
                f"  Corriges par IA (OpenAI)      : {fixed_ai}\n"
                f"  Corriges par regex (fallback) : {fixed_regex}\n"
                f"  Deja corrects                 : {already_ok}\n"
                f"  Fichier R2 absent             : {no_file}\n"
                f"  Annee non detectable          : {no_year}\n"
                f"  Erreurs techniques            : {errors}\n"
                f"  Mode DRY-RUN                  : {'OUI' if dry_run else 'NON'}"
            )
        )

    @staticmethod
    def _sanitize_text(text: str) -> str:
        """Nettoie les octets nuls, surrogates et caracteres de controle du PDF."""
        if not text:
            return ""
        cleaned = text.replace("\x00", " ")
        cleaned = cleaned.encode("utf-8", "ignore").decode("utf-8", "ignore")
        return re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", " ", cleaned)

    def _extract_front_and_back_pages(self, pdf_bytes: bytes) -> Tuple[str, str, int]:
        """
        Extrait separement les 15 premieres pages et les 15 dernieres pages
        via PyMuPDF, garantissant qu'aucune section n'ecrase ou ne tronque l'autre.
        """
        import fitz

        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        total_pages = len(doc)

        front_chunks = []
        first_limit = min(15, total_pages)
        for i in range(first_limit):
            page_text = doc[i].get_text("text").strip()
            if page_text:
                front_chunks.append(f"--- PAGE {i + 1} / {total_pages} ---\n{page_text}")

        back_chunks = []
        if total_pages > 15:
            start_back = max(15, total_pages - 15)
            for i in range(start_back, total_pages):
                page_text = doc[i].get_text("text").strip()
                if page_text:
                    back_chunks.append(f"--- PAGE {i + 1} / {total_pages} ---\n{page_text}")

        front_str = self._sanitize_text("\n\n".join(front_chunks)[:30000])
        back_str = self._sanitize_text("\n\n".join(back_chunks)[:30000])
        return front_str, back_str, total_pages

    def _extract_year_via_ai(
        self,
        front_text: str,
        back_text: str,
        filename: str,
        min_year: int = 1500,
        current_year: int = 2026,
    ) -> Tuple[Optional[int], str]:
        """
        Analyse l'extrait des 15 premieres et 15 dernieres pages avec OpenAI gpt-4o-mini
        pour extraire l'annee reelle de parution inscrite dans le livre lui-meme.
        """
        try:
            from django.conf import settings
            import openai
            import json

            api_key = getattr(settings, "OPENAI_API_KEY", None)
            if not api_key:
                logger.warning("[fix_publication_dates] OPENAI_API_KEY non configuree.")
                return None, ""

            client = openai.OpenAI(api_key=api_key, timeout=30.0)

            clean_filename = filename.replace("\\", "/").split("/")[-1]

            prompt = (
                f"Tu es un expert archiviste et bibliothecaire de la plateforme LAHATheque.\n"
                f"Ton unique mission est d'examiner le texte extrait de ce livre pour trouver l'annee "
                f"de parution, d'edition, de copyright ou de publication qui est explicitement ecrite "
                f"dans le livre lui-meme.\n\n"
                f"Document : '{clean_filename}'\n\n"
                f"Sources prioritaires a inspecter :\n"
                f"1. Mentions legales ou copyright (ex: '© 2018', 'Copyright 1995', 'First published 2004')\n"
                f"2. Page de titre ou faux-titre (ex: 'Paris, 1923', 'Londres, 1888')\n"
                f"3. Notice bibliographique ou catalogage CIP de la bibliotheque nationale\n"
                f"4. Depot legal (ex: 'Depot legal 1984', 'Depot legal : 4e trimestre 2012')\n"
                f"5. Acheve d'imprimer ou colophon en fin d'ouvrage (ex: 'Acheve d'imprimer en mai 1976')\n"
                f"6. Preface ou avant-propos date par l'auteur si aucune autre date n'est presente\n\n"
                f"Directives absolues :\n"
                f"- Recherche l'annee REELLEMENT ECRITE dans le texte fourni.\n"
                f"- N'impose AUCUNE restriction temporelle moderne : les livres anciens (du 19e, du 20e siecle, avant 1960...) "
                f"sont parfaitement valides s'ils indiquent cette date.\n"
                f"- Ne retiens PAS une annee dans le futur (apres {current_year}).\n"
                f"- Si ABSOLUMENT AUCUNE annee n'est ecrite dans les pages fournies, renvoie null. Ne devine pas et n'invente rien.\n\n"
                f"=== 15 PREMIERES PAGES DU LIVRE ===\n"
                f"{front_text if front_text else '(Aucun texte extrait des premieres pages)'}\n"
                f"=== FIN DES 15 PREMIERES PAGES ===\n\n"
                f"=== 15 DERNIERES PAGES DU LIVRE ===\n"
                f"{back_text if back_text else '(Aucun texte extrait des dernieres pages)'}\n"
                f"=== FIN DES 15 DERNIERES PAGES ===\n\n"
                f"Reponds STRICTEMENT en JSON valide avec ces cles :\n"
                f"{{\"publication_year\": <entier_4_chiffres_ou_null>, \"source\": \"<texte_exact_trouve_ou_null>\", \"reason\": \"<courte_explication>\"}}"
            )

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Tu es un expert bibliothecaire. Tu identifies l'annee de parution "
                            "exacte inscrite dans un livre a partir de ses pages liminaires et finales. "
                            "Reponds exclusivement en JSON valide."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.0,
                max_tokens=100,
                timeout=30.0,
            )

            content = response.choices[0].message.content or "{}"
            data = json.loads(content)
            year_val = data.get("publication_year")
            source_val = str(data.get("source") or data.get("reason") or "")
            if year_val:
                parsed_year = int(year_val)
                if min_year <= parsed_year <= current_year:
                    return parsed_year, source_val
        except Exception as e:
            err_msg = f"{type(e).__name__}: {e}"
            if hasattr(e, "response") and hasattr(e.response, "text"):
                err_msg += f" (reponse API: {e.response.text})"
            logger.warning(f"[fix_publication_dates AI] Echec pour '{filename}': {err_msg}")
            self.stdout.write(self.style.WARNING(f"  -> Avertissement IA ({filename}): {err_msg}"))
        return None, ""
