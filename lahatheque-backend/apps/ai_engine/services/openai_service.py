"""
Service d'analyse et d'extraction de métadonnées de documents par Intelligence Artificielle (OpenAI + PyMuPDF).
Supporte l'ensemble des genres de la bibliothèque : Romans, Mangas, Bandes Dessinées,
Manuels Scolaires, Thèses, Ouvrages Universitaires (Droit, Économie, Médecine, Sciences, Littérature).
Conforme au format d'échange international ONIX 3.0 Release 3.0.
"""

import json
import logging
import re
from typing import Any, Dict, Optional, Tuple
from django.conf import settings

logger = logging.getLogger(__name__)


def extract_text_sample_from_bytes(file_bytes: bytes, file_ext: str = "pdf", max_pages: int = 15) -> Tuple[str, int]:
    """
    Extrait un échantillon textuel représentatif (début, sommaire, 4e de couverture)
    via PyMuPDF (fitz) pour les fichiers PDF et EPUB.
    """
    import fitz # PyMuPDF

    try:
        doc = fitz.open(stream=file_bytes, filetype=file_ext.lower().replace(".", ""))
        total_pages = len(doc)
        text_chunks = []

        # 1. Extraire les premières pages (titre, crédits, sommaire, avant-propos)
        pages_to_read = min(max_pages, total_pages)
        for i in range(pages_to_read):
            page_text = doc[i].get_text("text").strip()
            if page_text:
                text_chunks.append(f"--- PAGE {i+1} ---\n{page_text[:1500]}")

        # 2. Extraire la dernière page (souvent la 4e de couverture / résumé)
        if total_pages > pages_to_read:
            last_page_text = doc[total_pages - 1].get_text("text").strip()
            if last_page_text:
                text_chunks.append(f"--- DERNIÈRE PAGE (4e de couverture) ---\n{last_page_text[:2000]}")

        full_sample = "\n\n".join(text_chunks)
        return full_sample[:12000], total_pages
    except Exception as e:
        logger.warning(f"[AI Service] Erreur extraction PyMuPDF: {e}")
        return "", 0


def generate_laha_isbn(seed_text: str = "") -> str:
    """
    Génère un code ISBN-13 LAHA normalisé (978-99919-XXX-X-X) avec calcul exact de la clé de contrôle EAN-13.
    Préfixe officiel : 978 (GS1) + 99919 (Bénin / LAHA).
    """
    import hashlib
    import random
    prefix = "97899919"
    if seed_text:
        h = int(hashlib.md5(seed_text.encode("utf-8")).hexdigest(), 16)
        item = str(h % 9000 + 1000)
    else:
        item = str(random.randint(1000, 9999))

    digits_12 = prefix + item
    total = sum(int(d) * (1 if i % 2 == 0 else 3) for i, d in enumerate(digits_12))
    check_digit = (10 - (total % 10)) % 10

    isbn_raw = digits_12 + str(check_digit)
    return f"{isbn_raw[:3]}-{isbn_raw[3:8]}-{isbn_raw[8:11]}-{isbn_raw[11:12]}-{isbn_raw[12]}"


def generate_onix_3_xml(data: Dict[str, Any]) -> str:
    """
    Génère un bloc XML ONIX 3.0 Release 3.0 standardisé pour le livre analysé.
    """
    title = data.get("title") or "Ouvrage sans titre"
    subtitle = data.get("subtitle") or ""
    authors = data.get("authors") or ["Auteur LAHA"]
    isbn = data.get("isbn") or "9789991900000"
    summary = data.get("summary") or ""
    dewey = data.get("dewey_code") or "000"
    language = data.get("language_code") or "fre"
    genre = data.get("genre_category") or "Littérature"
    year = data.get("publication_year") or 2026

    contributors_xml = ""
    for idx, author in enumerate(authors, 1):
        contributors_xml += f"""
      <Contributor>
        <SequenceNumber>{idx}</SequenceNumber>
        <ContributorRole>A01</ContributorRole>
        <PersonName>{author}</PersonName>
      </Contributor>"""

    onix_template = f"""<?xml version="1.0" encoding="UTF-8"?>
<ONIXMessage release="3.0" xmlns="http://ns.editeur.org/onix/3.0/reference">
  <Header>
    <Sender>
      <SenderName>LAHA Editions - LAHATheque</SenderName>
      <EmailAddress>contact@lahaeditions.com</EmailAddress>
    </Sender>
    <SentDateTime>{year}0101T000000</SentDateTime>
  </Header>
  <Product>
    <RecordReference>LAHA-{isbn.replace('-', '')}</RecordReference>
    <NotificationType>03</NotificationType>
    <ProductIdentifier>
      <ProductIDType>15</ProductIDType>
      <IDValue>{isbn.replace('-', '')}</IDValue>
    </ProductIdentifier>
    <DescriptiveDetail>
      <ProductComposition>00</ProductComposition>
      <ProductForm>EB</ProductForm>
      <TitleDetail>
        <TitleType>01</TitleType>
        <TitleElement>
          <TitleElementLevel>01</TitleElementLevel>
          <TitleText>{title}</TitleText>
          {f"<Subtitle>{subtitle}</Subtitle>" if subtitle else ""}
        </TitleElement>
      </TitleDetail>{contributors_xml}
      <Language>
        <LanguageRole>01</LanguageRole>
        <LanguageCode>{language}</LanguageCode>
      </Language>
      <Subject>
        <SubjectSchemeIdentifier>10</SubjectSchemeIdentifier>
        <SubjectCode>{dewey}</SubjectCode>
        <SubjectHeadingText>{genre}</SubjectHeadingText>
      </Subject>
    </DescriptiveDetail>
    <CollateralDetail>
      <TextContent>
        <TextType>03</TextType>
        <ContentAudience>00</ContentAudience>
        <Text>{summary}</Text>
      </TextContent>
    </CollateralDetail>
    <PublishingDetail>
      <Imprint>
        <ImprintName>LAHA Editions</ImprintName>
      </Imprint>
      <Publisher>
        <PublishingRole>01</PublishingRole>
        <PublisherName>LAHA Editions</PublisherName>
      </Publisher>
      <PublishingDate>
        <PublishingDateRole>01</PublishingDateRole>
        <Date dateformat="05">{year}</Date>
      </PublishingDate>
    </PublishingDetail>
    <ProductSupply>
      <SupplyDetail>
        <Price>
          <PriceType>02</PriceType>
          <PriceAmount>5000</PriceAmount>
          <CurrencyCode>XOF</CurrencyCode>
        </Price>
      </SupplyDetail>
    </ProductSupply>
  </Product>
</ONIXMessage>"""
    return onix_template.strip()


def analyze_document_with_openai(
    text_sample: str,
    filename: str,
    total_pages: int = 0
) -> Dict[str, Any]:
    """
    Analyse un document complet (Roman, Manga, BD, Académique, Scolaire, etc.)
    avec OpenAI gpt-4o-mini pour extraire métadonnées, résumé, classification Dewey et ONIX 3.0.
    """
    api_key = getattr(settings, "OPENAI_API_KEY", None)
    if not api_key:
        print("[AI Service] ⚠️ OPENAI_API_KEY absente dans l'environnement Django -> Basculement mode heuristique", flush=True)
        logger.warning("[AI Service] OPENAI_API_KEY absente, utilisation du mode heuristique.")
        return _fallback_heuristic_analysis(filename, text_sample, total_pages)

    prompt = f"""Tu es le moteur d'intelligence artificielle expert en catalogage, analyse littéraire et classification documentaire universelle pour la bibliothèque numérique LAHAThèque (Afrique et International).
La bibliothèque contient TOUS les types d'ouvrages sans restriction :
- Romans, Nouvelles, Poésie, Théâtre, Essais littéraires
- Mangas, Bandes Dessinées, Contes et Albums Jeunesse
- Manuels Scolaires (Primaire, Collège, Lycée)
- Ouvrages Universitaires & Académiques (Droit, Économie, Gestion, Médecine, Sciences, Philosophie, Sociologie, Histoire, Informatique, Agronomie)
- Livres pratiques, Développement personnel, Art & Culture.

Analyse l'échantillon de texte suivant extrait du document "{filename}" (Nombre total de pages estimé : {total_pages}) :

=== TEXTE DU DOCUMENT ===
{text_sample[:8000] if text_sample else f"Fichier: {filename}"}
=== FIN DU TEXTE ===

Instructions détaillées :
1. Titre & Sous-titre : Détermine le titre exact de l'ouvrage et propose systématiquement un sous-titre pertinent (champ optionnel très utile pour le catalogage).
2. Auteurs : Identifie tous les auteurs, co-auteurs ou noms de plume mentionnés.
3. Résumé éditorial : Rédige un résumé accrocheur et fidèle de 2 à 3 paragraphes en français soigné, mettant en valeur l'intérêt de l'ouvrage.
4. Genre & Discipline : Identifie le genre principal (`genre_category`) parmi les disciplines officielles LAHAThèque ("Philosophie, Psychologie & Sciences Humaines", "Droit & Sciences Politiques", "Sciences Économiques & Gestion", "Médecine & Santé", "Littérature Africaine & Conte", "Roman & Fiction", "Manga & Bande Dessinée", "Manuel Scolaire & Pédagogie", "Sciences & Technologies", "Histoire & Civilisations", etc.).
5. Code Dewey : Détermine le code de classification décimale Dewey (3 chiffres, ex: 840, 741.5, 340, 330, 610, 100, 500, etc.).
6. Langue & Pays : Détecte la langue principale de rédaction ("Français", "Anglais", "Portugais", "Espagnol", "Fon", "Yoruba", "Arabe", etc.) et le pays d'ancrage principal (code ISO 2 lettres ex: "BJ", "SN", "CI", "TG", "BR", "FR", "GLOBAL").
7. Code ISBN : Cherche méticuleusement dans le texte (page de titre, page d'ours/copyright, mentions légales, 4e de couverture) si un code ISBN à 10 ou 13 chiffres est présent. Si trouvé dans le document, extrais-le fidèlement et formate-le (ex: "978-2-..."). S'il est absent du document, génère une proposition d'ISBN standard LAHA ("978-99919-...") et indique `isbn_found_in_document: false`.
8. Suggestions académiques & contextuelles :
   - `institution_suggestion` : Suggère une université ou institution de rattachement pertinente (ex: "Université d'Abomey-Calavi (UAC)", "Université de São Paulo (USP)", "Université Cheikh Anta Diop (UCAD)").
   - `faculty_suggestion` : Suggère la faculté/UFR correspondante (ex: "Faculté de Philosophie", "Faculté de Droit", "Faculté des Sciences Économiques").
   - `department_suggestion` : Suggère le département d'études spécifique (ex: "Département de Philosophie", "Département de Droit Privé", "Département de Linguistique").
   - `target_audience` : Suggère le public cible optimal (ex: "Étudiants en Licence & Master", "Chercheurs & Universitaires", "Lycéens & Candidats", "Grand Public Amateur de Philosophie").
9. Mots-clés : Propose 6 à 10 mots-clés thématiques riches et pertinents.
10. Incohérences : Détecte toute anomalie majeure entre le titre et le contenu.

Renvoie STRICTEMENT un JSON valide au format suivant :
{{
  "title": "Titre exact de l'ouvrage",
  "subtitle": "Sous-titre explicatif ou contextuel",
  "authors": ["Nom Prénom"],
  "publication_year": 2026,
  "isbn": "978-...",
  "isbn_found_in_document": true,
  "summary": "Résumé éditorial structuré...",
  "genre_category": "Discipline principale",
  "dewey_code": "100",
  "language": "Français",
  "language_code": "fre",
  "country": "BJ",
  "target_audience": "Étudiants en Licence & Master",
  "institution_suggestion": "Université d'Abomey-Calavi (UAC)",
  "faculty_suggestion": "Faculté des Lettres et Sciences Humaines",
  "department_suggestion": "Département de Philosophie",
  "keywords": ["mot-clé 1", "mot-clé 2", "mot-clé 3", "mot-clé 4", "mot-clé 5"],
  "inconsistencies": []
}}
"""

    try:
        import time
        import openai
        print(f"[AI Service] Envoi de la requête à OpenAI gpt-4o-mini (échantillon de {len(text_sample)} caractères)...", flush=True)
        start_t = time.time()
        
        client = openai.OpenAI(api_key=api_key, timeout=20.0)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Tu es un système de catalogage ONIX et d'analyse bibliographique IA rigoureux. Tu réponds exclusivement en JSON valide."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=2000,
            timeout=20.0
        )
        duration = time.time() - start_t
        print(f"[AI Service] Réponse OpenAI reçue avec succès en {duration:.2f}s !", flush=True)

        content = response.choices[0].message.content or "{}"
        parsed_data = json.loads(content)

        # Normalisation rigoureuse de l'ISBN
        isbn_val = str(parsed_data.get("isbn") or "")
        raw_digits = re.sub(r"[^\dX]", "", isbn_val)
        is_found_in_doc = bool(parsed_data.get("isbn_found_in_document", False))
        is_placeholder = "0000" in isbn_val or "..." in isbn_val or "XXX" in isbn_val

        if is_found_in_doc and not is_placeholder and (len(raw_digits) == 13 or len(raw_digits) == 10):
            parsed_data["isbn_found_in_document"] = True
            print(f"[AI Service] ISBN extrait du document : {isbn_val}", flush=True)
        else:
            # Génération dynamique d'un ISBN officiel LAHA 978-99919-XXX-X-X avec clé EAN-13
            seed = parsed_data.get("title") or filename
            parsed_data["isbn"] = generate_laha_isbn(seed)
            parsed_data["isbn_found_in_document"] = False
            print(f"[AI Service] ISBN généré (LAHA officiel) : {parsed_data['isbn']}", flush=True)

        # Générer le document ONIX 3.0 correspondant
        parsed_data["onix_3_xml"] = generate_onix_3_xml(parsed_data)
        parsed_data["page_count"] = total_pages
        print(f"[AI Service] Notice ONIX 3.0 XML générée ({len(parsed_data['onix_3_xml'])} octets).", flush=True)
        return parsed_data

    except Exception as e:
        print(f"[AI Service ERROR] Échec de l'appel OpenAI ({type(e).__name__}: {e}) -> Basculement heuristique.", flush=True)
        logger.error(f"[AI Service] Erreur appel OpenAI: {e}")
        return _fallback_heuristic_analysis(filename, text_sample, total_pages)


def _fallback_heuristic_analysis(filename: str, text_sample: str, total_pages: int) -> Dict[str, Any]:
    """Mode dégradé intelligent sans crash si l'API est injoignable."""
    clean_name = filename.replace(".pdf", "").replace(".epub", "").replace("_", " ").replace("-", " ")
    
    # 1. Recherche regex de code ISBN dans le texte
    isbn_match = re.search(r"(?:ISBN(?:-1[03])?:?\s*)(97[89][\d\s-]{10,17}\d|\d[\d\s-]{8,12}[\dX])", text_sample, re.IGNORECASE)
    isbn_found = False
    if isbn_match:
        raw_isbn = re.sub(r"[^\dX]", "", isbn_match.group(1))
        if len(raw_isbn) == 13:
            extracted_isbn = f"{raw_isbn[:3]}-{raw_isbn[3]}-{raw_isbn[4:8]}-{raw_isbn[8:12]}-{raw_isbn[12]}"
            isbn_found = True
        elif len(raw_isbn) == 10:
            extracted_isbn = f"978-{raw_isbn[0]}-{raw_isbn[1:5]}-{raw_isbn[5:9]}-{raw_isbn[9]}"
            isbn_found = True
        else:
            extracted_isbn = isbn_match.group(1).strip()
            isbn_found = True
    else:
        extracted_isbn = generate_laha_isbn(clean_name)

    # 2. Heuristique Dewey & Genre
    lower_name = (filename + " " + text_sample).lower()
    dept: Optional[str] = None
    sub_title = f"Étude et analyse critique — {clean_name.title()}" if "philosophie" in lower_name or "linguagem" in lower_name else "Manuel de référence & guide pratique"

    if any(k in lower_name for k in ["droit", "juridique", "loi", "ohada", "code", "constitution"]):
        genre = "Droit & Sciences Politiques"
        dewey = "340"
        faculty = "Faculté de Droit et de Science Politique (FADESP)"
        dept = "Département de Droit Privé et Sciences Criminelles"
        inst = "Université d'Abomey-Calavi (UAC)"
        target = "Étudiants en Droit & Praticiens Juridiques"
    elif any(k in lower_name for k in ["economie", "finance", "gestion", "uemoa", "comptabilite"]):
        genre = "Sciences Économiques & Gestion"
        dewey = "330"
        faculty = "Faculté des Sciences Économiques et de Gestion (FASEG)"
        dept = "Département d'Économie Appliquée"
        inst = "Université d'Abomey-Calavi (UAC)"
        target = "Étudiants en Sciences Économiques & Décideurs"
    elif any(k in lower_name for k in ["sante", "medecine", "clinique", "pharmacologie", "anatomie"]):
        genre = "Médecine & Santé"
        dewey = "610"
        faculty = "Faculté des Sciences de la Santé (FSS)"
        dept = "Département de Médecine et Spécialités"
        inst = "Université d'Abomey-Calavi (UAC)"
        target = "Étudiants en Médecine & Professionnels de Santé"
    elif any(k in lower_name for k in ["philosophie", "nietzsche", "linguagem", "linguistique", "socio"]):
        genre = "Philosophie, Psychologie & Sciences Humaines"
        dewey = "100"
        faculty = "Faculté des Lettres, Langues, Arts et Communication (FLLAC)"
        dept = "Département de Philosophie"
        inst = "Université d'Abomey-Calavi (UAC)"
        target = "Étudiants Universitaires & Chercheurs"
    elif any(k in lower_name for k in ["manga", "bd", "comics", "illustration", "tome"]):
        genre = "Manga & Bande Dessinée"
        dewey = "741.5"
        faculty = None
        dept = None
        inst = None
        target = "Tout Public & Passionnés de BD/Manga"
        sub_title = "Édition illustrée"
    elif any(k in lower_name for k in ["roman", "conte", "poeme", "nouvelle", "theatre", "histoire"]):
        genre = "Littérature Africaine & Conte"
        dewey = "840"
        faculty = None
        dept = None
        inst = None
        target = "Grand Public & Amateurs de Belles-Lettres"
        sub_title = "Récit et anthologie"
    else:
        genre = "Sciences Humaines & Savoirs"
        dewey = "000"
        faculty = "Faculté des Lettres, Langues, Arts et Communication (FLLAC)"
        dept = "Département des Sciences Humaines"
        inst = "Université d'Abomey-Calavi (UAC)"
        target = "Étudiants Universitaires & Chercheurs"

    data = {
        "title": clean_name.title(),
        "subtitle": sub_title,
        "authors": ["Auteur LAHA"],
        "publication_year": 2026,
        "isbn": extracted_isbn,
        "isbn_found_in_document": isbn_found,
        "summary": f"Ouvrage de référence « {clean_name.title()} » publié dans le catalogue LAHAThèque. Analyse détaillée, contextualisation rigoureuse et contenu exhaustif destiné aux lecteurs et apprenants.",
        "genre_category": genre,
        "dewey_code": dewey,
        "language": "Portugais" if ("linguagem" in lower_name or "produtora" in lower_name) else "Français",
        "language_code": "por" if ("linguagem" in lower_name or "produtora" in lower_name) else "fre",
        "country": "BJ",
        "target_audience": target,
        "institution_suggestion": inst,
        "faculty_suggestion": faculty,
        "department_suggestion": dept,
        "keywords": [genre, "Édition Numérique", "LAHAThèque", "Recherche", "Afrique"],
        "inconsistencies": [],
        "page_count": total_pages or 120,
    }
    data["onix_3_xml"] = generate_onix_3_xml(data)
    return data
