"""
Script d'inspection en direct du bucket Cloudflare R2 'laha-books-production' (ou inventaire local)
pour analyser et denombrer les traductions presentes.

Rappel :
- Ne modifie aucune donnee.
- Se connecte directement avec les identifiants R2 CLOUDFLARE_R2_BOOKS_*
- Analyse les versions linguistiques presentes sous le prefixe books/ :
  * Versions originales (ex: EN/original.pdf, EN/source.epub)
  * Traductions (ex: FR/..., /FR/jobs/, etc.)
"""

import os
import re
import sys
import json
from collections import defaultdict
from typing import Dict, Any, List

import boto3
from botocore.config import Config


def get_r2_books_client(
    endpoint: str = "https://4f3c7fa9b26ef9bec6419a0c3d193a3e.r2.cloudflarestorage.com",
    access_key: str = "8ca875a254458fe5a9711e76de89342a",
    secret_key: str = "3ed1fa585405f44759f81a2151e716ab33ad93427a40f97f30b1534243fe7031",
):
    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name="auto",
        config=Config(
            signature_version="s3v4",
            s3={"addressing_style": "path"},
            connect_timeout=15,
            read_timeout=60,
            retries={"max_attempts": 3},
        ),
    )


def inspect_r2_translations(
    bucket_name: str = "laha-books-production",
    use_inventory_if_present: bool = False,
    inventory_path: str = "r2_bucket_inventory.json",
):
    print("=" * 70)
    print(f"[INSPECTION R2] Analyse des traductions dans le bucket '{bucket_name}'")
    print("=" * 70)

    files: List[Dict[str, Any]] = []

    # Option inventaire local pour comparaison ou rapidite
    if use_inventory_if_present and os.path.exists(inventory_path):
        print(f"Chargement de l'inventaire local {inventory_path}...")
        with open(inventory_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            files = data.get("files", [])
            print(f"Fichiers trouves dans l'inventaire local : {len(files)}")
    else:
        print(f"Scan en direct via API Cloudflare R2...")
        try:
            s3 = get_r2_books_client()
            paginator = s3.get_paginator("list_objects_v2")
            page_count = 0
            for page in paginator.paginate(Bucket=bucket_name, Prefix="books/"):
                page_count += 1
                for item in page.get("Contents", []):
                    files.append({"key": item["Key"], "size_bytes": item["Size"]})
                print(f"  Page {page_count} traitee... Total objets lus : {len(files)}", end="\r")
            print(f"\nScan direct termine avec succes : {len(files)} objets trouves.")
        except Exception as err:
            print(f"Erreur lors de la connexion a Cloudflare R2 : {err}")
            if os.path.exists(inventory_path):
                print(f"Repli automatique sur l'inventaire local {inventory_path}...")
                with open(inventory_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    files = data.get("files", [])
            else:
                return

    # Regex de detection d'UUID sous books/<uuid>/
    uuid_regex = re.compile(
        r"books/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/(.*)",
        re.IGNORECASE,
    )

    books_summary = defaultdict(lambda: {
        "en": [],
        "fr": [],
        "other_lang": [],
        "all_keys": []
    })

    extensions_count = defaultdict(int)
    total_translations = 0
    total_originals = 0
    books_with_translations = []

    for item in files:
        key = item.get("key", "")
        match = uuid_regex.search(key)
        if not match:
            continue

        book_uuid = match.group(1).lower()
        subpath = match.group(2)
        subpath_lower = subpath.lower()

        books_summary[book_uuid]["all_keys"].append(key)

        # Classification linguistique
        if subpath_lower.startswith("en/"):
            books_summary[book_uuid]["en"].append(key)
            total_originals += 1
        elif subpath_lower.startswith("fr/"):
            books_summary[book_uuid]["fr"].append(key)
            total_translations += 1
        else:
            # Autres patterns eventuels (ex: es/, de/, jobs/, etc.)
            books_summary[book_uuid]["other_lang"].append(key)

        ext = os.path.splitext(key)[1].lower()
        extensions_count[ext] += 1

    # Identification des livres bilingues ou possedant une traduction
    for book_uuid, info in books_summary.items():
        if info["fr"]:
            books_with_translations.append((book_uuid, info["fr"]))

    print("\n" + "=" * 70)
    print("BILAN DES OUVRAGES ET TRADUCTIONS DETECTEES DANS LE R2 DISTANT :")
    print("=" * 70)
    print(f"- Total ouvrages distincts (UUIDs)          : {len(books_summary)}")
    print(f"- Total fichiers 'EN/' (Originaux)           : {total_originals}")
    print(f"- Total fichiers 'FR/' (Traductions)         : {total_translations}")
    print(f"- Ouvrages possedant au moins 1 fichier FR   : {len(books_with_translations)}")

    print("\nRepartitions par extension :")
    for ext, count in sorted(extensions_count.items(), key=lambda x: x[1], reverse=True):
        print(f"  * {ext or '(sans extension)'}: {count} fichiers")

    if books_with_translations:
        print("\nDetail des traductions FR trouvees :")
        for b_uuid, fr_files in books_with_translations[:20]:
            print(f"  * Ouvrage {b_uuid} :")
            for f_key in fr_files:
                print(f"      - {f_key}")
        if len(books_with_translations) > 20:
            print(f"  ... et {len(books_with_translations) - 20} autres ouvrages.")
    else:
        print("\nAucune traduction (dossier /FR/ ou fichier francais) n'a ete trouvee dans ce bucket R2.")
        print("Tous les fichiers actuels sont sous l'arborescence EN/ (originaux).")

    print("=" * 70)


if __name__ == "__main__":
    # Permet de passer '--live' ou d'utiliser le fichier local
    use_inventory = "--use-inventory" in sys.argv
    inspect_r2_translations(use_inventory_if_present=use_inventory)
