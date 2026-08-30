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


def extract_text_sample_from_bytes(file_bytes: bytes, file_ext: str = "pdf") -> Tuple[str, int]:
    """
    Extrait le texte intégral des 15 premières pages et des 15 dernières pages
    via PyMuPDF (fitz) pour les fichiers PDF et EPUB.
    """
    import fitz # PyMuPDF

    try:
        doc = fitz.open(stream=file_bytes, filetype=file_ext.lower().replace(".", ""))
        total_pages = len(doc)
        text_chunks = []

        pages_to_extract = set()
        # 15 premières pages
        for i in range(min(15, total_pages)):
            pages_to_extract.add(i)
        # 15 dernières pages
        for i in range(max(0, total_pages - 15), total_pages):
            pages_to_extract.add(i)

        for page_idx in sorted(pages_to_extract):
            page_text = doc[page_idx].get_text("text").strip()
            if page_text:
                text_chunks.append(f"--- PAGE {page_idx + 1} / {total_pages} ---\n{page_text}")

        full_sample = "\n\n".join(text_chunks)
        return full_sample[:100000], total_pages
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


def detect_dominant_language(text: str) -> Tuple[str, str, str]:
    """
    Détecte avec certitude statistique la langue dominante du texte basée sur les marqueurs linguistiques.
    Retourne (nom_langue, code_iso_639_2, code_pays_defaut).
    """
    text_lower = text.lower()
    words = re.findall(r'\b[a-zà-ÿ]+\b', text_lower)
    if not words:
        return "Français", "fre", "BJ"

    portuguese_words = {'o', 'a', 'os', 'as', 'um', 'uma', 'do', 'da', 'dos', 'das', 'no', 'na', 'nos', 'nas', 'em', 'para', 'por', 'com', 'não', 'são', 'como', 'mais', 'este', 'esta', 'esse', 'essa', 'isso', 'isto', 'sua', 'seu', 'suas', 'seus', 'professores', 'ensino', 'criação', 'pesquisa', 'sala', 'aula', 'identidade', 'literatura', 'trabalho', 'livro'}
    english_words = {'the', 'and', 'to', 'of', 'in', 'is', 'that', 'for', 'it', 'as', 'was', 'with', 'be', 'by', 'on', 'not', 'he', 'i', 'this', 'have', 'from', 'at', 'which', 'or', 'an', 'they', 'you', 'were', 'their', 'education', 'school', 'research', 'book'}
    spanish_words = {'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'del', 'al', 'en', 'para', 'por', 'con', 'no', 'es', 'son', 'como', 'más', 'este', 'esta', 'su', 'sus', 'investigación', 'educación', 'escuela', 'libro'}
    french_words = {'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'dans', 'pour', 'avec', 'sur', 'en', 'par', 'est', 'sont', 'comme', 'plus', 'ce', 'cette', 'ces', 'son', 'sa', 'ses', 'leur', 'leurs', 'recherche', 'enseignement', 'école', 'livre', 'ouvrage'}

    counts = {
        'Portugais': sum(1 for w in words if w in portuguese_words),
        'Anglais': sum(1 for w in words if w in english_words),
        'Espagnol': sum(1 for w in words if w in spanish_words),
        'Français': sum(1 for w in words if w in french_words),
    }

    best_lang, best_count = max(counts.items(), key=lambda item: item[1])

    if best_count >= 8:
        if best_lang == 'Portugais':
            return "Portugais", "por", "BR"
        elif best_lang == 'Anglais':
            return "Anglais", "eng", "GLOBAL"
        elif best_lang == 'Espagnol':
            return "Espagnol", "spa", "GLOBAL"
        elif best_lang == 'Français':
            return "Français", "fre", "BJ"

    return "Français", "fre", "BJ"


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

    prompt = f"""Tu es le directeur littéraire et éditeur en chef de la prestigieuse maison d'édition LAHAThèque.
Tu rédiges la quatrième de couverture (summary officiel) des livres du catalogue. Le texte doit être élégant, captivant, fluide et donner immédiatement envie d'acquérir et de lire l'ouvrage.

Analyse l'échantillon de texte suivant extrait du manuscrit "{filename}" (Nombre total de pages estimé : {total_pages}) :

=== TEXTE DU DOCUMENT (15 Premières Pages + 15 Dernières Pages) ===
{text_sample[:60000] if text_sample else f"Fichier: {filename}"}
=== FIN DU TEXTE ===

Directives éditoriales impératives :
1. Titre & Sous-titre : Détermine le titre exact et propose un sous-titre clair, prestigieux et commercialement valorisant.
2. Auteurs : Identifie tous les auteurs ou contributeurs.
3. Quatrième de couverture / Résumé (`summary`) — ADAPTATION PARFAITE AU GENRE DU LIVRE :
   Rédige une véritable 4e de couverture (exactement 2 paragraphes élégants, environ 130 à 180 mots au total), en adaptant le ton et le registre selon la nature de l'ouvrage :
   - ROMAN & FICTION LITTÉRAIRE : Ton immersif et évocateur. Présente le protagoniste, le décor, l'élément déclencheur et la tension narrative (sans jamais spoiler la fin).
   - ROMAN POLICIER / THRILLER : Ton haletant et mystérieux. Pose l'énigme, le crime ou la disparition, l'atmosphère d'investigation et la course contre la montre.
   - MANUEL SCOLAIRE & ÉDUCATIF : Ton stimulant, clair et structuré. Met en avant le niveau visé, la pédagogie progressive (cours clairs, exercices, cas pratiques) et la garantie de réussite aux examens.
   - OUVRAGE UNIVERSITAIRE, SCIENTIFIQUE OU ESSAI : Ton noble, incisif et rigoureux. Présente la problématique majeure, la thèse développée, la méthode et les bénéfices pour étudiants et spécialistes.
   - BANDE DESSINÉE, MANGA & CONTE : Ton vivant, dynamique et graphique. Met en scène le héros, sa quête et l'univers d'aventure.

   - RÈGLES DE VOCABULAIRE STRICTES : Utilise EXCLUSIVEMENT le vocabulaire du livre adapté au genre ("cet ouvrage", "ce roman", "ce polar", "ce thriller", "ce manuel", "ce guide", "ce recueil", "cette œuvre").
   - INTERDICTION ABSOLUE : Ne jamais écrire "ce travail", "ce mémoire", "cette thèse", "ce document", "cet article", "cette recherche".
   - Paragraphe 1 : L'Accroche et le Cœur du récit / sujet (sans phrase banale comme "Dans ce livre...").
   - Paragraphe 2 : Les Apports clés, l'enjeu dramatique ou pédagogique, et le public cible.
4. Genre & Discipline : Identifie la discipline officielle LAHAThèque ("Philosophie, Psychologie & Sciences Humaines", "Droit & Sciences Politiques", "Sciences Économiques & Gestion", "Médecine & Santé", "Musique, Art & Spectacle", "Littérature Africaine & Conte", "Roman & Fiction", "Manga & Bande Dessinée", "Manuel Scolaire & Pédagogie", "Sciences & Technologies", "Histoire & Civilisations", etc.).
5. Code Dewey : Détermine le code Dewey (3 chiffres, ex: 510 pour Mathématiques, 780 pour Musique, 340 pour Droit, 330 pour Économie, 610 pour Médecine, 840 pour Littérature, etc.).
6. Langue & Pays (ANALYSE LINGUISTIQUE DU MANUSCRIT OBLIGATOIRE) :
   Identifie avec précision la langue réelle du texte fourni dans l'échantillon. Ne présume JAMAIS que la langue est le Français par défaut :
   - Si le texte du livre est en Portugais (ex: 'da', 'do', 'criação', 'sala de aula', 'professores', 'ensino') -> language: "Portugais", language_code: "por", country: "BR" ou "PT".
   - Si le texte du livre est en Anglais -> language: "Anglais", language_code: "eng", country: "US" / "GB" / "GLOBAL".
   - Si le texte du livre est en Espagnol -> language: "Espagnol", language_code: "spa", country: "ES" / "GLOBAL".
   - Si le texte du livre est en Français -> language: "Français", language_code: "fre", country: "BJ" ou pays identifié.
   - Si langue nationale africaine (Fon, Yoruba, Wolof, Swahili, etc.) -> renseigner la langue exacte.
7. Code ISBN : Recherche méticuleuse d'un ISBN dans le document. S'il est absent, générer une proposition standard LAHA ("978-99919-...").
8. Suggestions académiques : Université, faculté, département et public cible.
9. Mots-clés : 6 à 10 mots-clés thématiques riches.
10. Incohérences : Anomalies éventuelles.

Renvoie STRICTEMENT un JSON valide :
{{
  "title": "Titre exact de l'ouvrage",
  "subtitle": "Sous-titre commercial et explicatif",
  "authors": ["Nom Prénom"],
  "publication_year": 2026,
  "isbn": "978-...",
  "isbn_found_in_document": true,
  "summary": "Premier paragraphe de 4e de couverture captivant...\n\nDeuxième paragraphe valorisant le contenu et le public...",
  "genre_category": "Discipline principale",
  "dewey_code": "510",
  "language": "Portugais",
  "language_code": "por",
  "country": "BR",
  "target_audience": "Enseignants, Étudiants & Professionnels",
  "institution_suggestion": "Université d'Abomey-Calavi (UAC)",
  "faculty_suggestion": "Faculté des Sciences et Techniques (FAST)",
  "department_suggestion": "Département de Mathématiques",
  "keywords": ["mot-clé 1", "mot-clé 2", "mot-clé 3", "mot-clé 4", "mot-clé 5"],
  "inconsistencies": []
}}
"""

    try:
        import time
        import openai
        print(f"[AI Service] Envoi de la requête à OpenAI gpt-4o-mini (échantillon de {len(text_sample)} caractères)...", flush=True)
        start_t = time.time()
        
        client = openai.OpenAI(api_key=api_key, timeout=30.0)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Tu es un directeur éditorial de renom. Tu rédiges de remarquables résumés de quatrième de couverture pour des livres et réponds exclusivement en JSON valide."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=2000,
            timeout=30.0
        )
        duration = time.time() - start_t
        print(f"[AI Service] Réponse OpenAI reçue avec succès en {duration:.2f}s !", flush=True)

        content = response.choices[0].message.content or "{}"
        parsed_data = json.loads(content)

        # Contrôle & Correction Linguistique Automatique
        auto_lang, auto_code, auto_country = detect_dominant_language(text_sample)
        ai_lang = str(parsed_data.get("language") or "")

        # Si les mots-clés du texte indiquent formellement une autre langue que celle renvoyée par l'IA
        if auto_lang != "Français" and ("franc" in ai_lang.lower() or not ai_lang):
            print(f"[AI Service LINGUISTIC CORRECTION] Langue corrigée : '{ai_lang}' -> '{auto_lang}' ({auto_code})", flush=True)
            parsed_data["language"] = auto_lang
            parsed_data["language_code"] = auto_code
            if parsed_data.get("country") in ("BJ", "", None):
                parsed_data["country"] = auto_country

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
        "summary": (
            f"Plongez au cœur de « {clean_name.title()} », un travail de référence en {genre} publié sur LAHAThèque.\n\n"
            f"À travers une étude rigoureuse et des analyses approfondies, cet ouvrage explore les enjeux fondamentaux de la discipline "
            f"et propose une méthodologie claire pour enrichir la réflexion et la pratique.\n\n"
            f"Une ressource essentielle conçue pour les {target.lower()}, offrant des perspectives novatrices et des clés d'application concrètes."
        ),
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
