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

Instructions :
1. Détermine le titre exact et le sous-titre éventuel.
2. Identifie les auteurs ou le nom de plume.
3. Rédige un résumé accrocheur et fidèle de 2 à 3 paragraphes en français soigné.
4. Identifie le genre principal (`genre_category`) parmi : "Roman & Fiction", "Manga & Bande Dessinée", "Littérature Africaine", "Jeunesse & Contes", "Manuel Scolaire", "Droit & Sciences Politiques", "Sciences Économiques & Gestion", "Médecine & Santé", "Sciences & Technologies", "Histoire & Civilisations", "Philosophie & Sciences Humaines", "Développement Personnel", "Arts & Culture", etc.
5. Détermine le code Dewey (3 chiffres, ex: 840, 741.5, 340, 330, 610, 500, etc.).
6. Détecte la langue ("Français", "Anglais", "Fon", "Yoruba", "Wolof", etc.).
7. Détecte le pays d'ancrage principal (code 2 lettres ex: "BJ", "SN", "CI", "TG", "NE", "CD", "FR", "GLOBAL").
8. Si et seulement si c'est un ouvrage académique/universitaire, suggère l'université de rattachement (ex: "Université d'Abomey-Calavi (UAC)", "Université Cheikh Anta Diop (UCAD)", "Université Félix Houphouët-Boigny (UFHB)", "Université de Parakou (UP)") et la Faculté. Si c'est un roman, manga ou jeunesse grand public, mets `null`.
9. Détecte les mots-clés (5 à 8 tags).
10. Détecte toute incohérence manifeste (ex: titre juridique mais contenu de bande dessinée).

Renvoie STRICTEMENT un JSON valide au format suivant :
{{
  "title": "Titre du livre",
  "subtitle": "Sous-titre ou vide",
  "authors": ["Prénom Nom"],
  "publication_year": 2026,
  "isbn": "978-99919-...",
  "summary": "Résumé de 2 à 3 paragraphes...",
  "genre_category": "Nom du genre",
  "dewey_code": "840",
  "language": "Français",
  "language_code": "fre",
  "country": "BJ",
  "target_audience": "Grand Public ou Étudiants ou Lycéens",
  "institution_suggestion": "Université d'Abomey-Calavi (UAC)" ou null,
  "faculty_suggestion": "Faculté de Droit..." ou null,
  "keywords": ["mot-clé 1", "mot-clé 2"],
  "inconsistencies": []
}}
"""

    try:
        import openai
        client = openai.OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Tu es un système de catalogage ONIX et d'analyse bibliographique IA rigoureux. Tu réponds exclusivement en JSON valide."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=2000
        )

        content = response.choices[0].message.content or "{}"
        parsed_data = json.loads(content)

        # Générer le document ONIX 3.0 correspondant
        parsed_data["onix_3_xml"] = generate_onix_3_xml(parsed_data)
        parsed_data["page_count"] = total_pages
        return parsed_data

    except Exception as e:
        logger.error(f"[AI Service] Erreur appel OpenAI: {e}")
        return _fallback_heuristic_analysis(filename, text_sample, total_pages)


def _fallback_heuristic_analysis(filename: str, text_sample: str, total_pages: int) -> Dict[str, Any]:
    """Mode dégradé intelligent sans crash si l'API est injoignable."""
    clean_name = filename.replace(".pdf", "").replace(".epub", "").replace("_", " ").replace("-", " ")
    
    # Heuristique Dewey & Genre
    lower_name = (filename + " " + text_sample).lower()
    if any(k in lower_name for k in ["droit", "juridique", "loi", "ohada", "code", "constitution"]):
        genre = "Droit & Sciences Politiques"
        dewey = "340"
        faculty = "Faculté de Droit et de Science Politique (FADESP)"
        inst = "Université d'Abomey-Calavi (UAC)"
    elif any(k in lower_name for k in ["economie", "finance", "gestion", "uemoa", "comptabilite"]):
        genre = "Sciences Économiques & Gestion"
        dewey = "330"
        faculty = "Faculté des Sciences Économiques et de Gestion (FASEG)"
        inst = "Université d'Abomey-Calavi (UAC)"
    elif any(k in lower_name for k in ["sante", "medecine", "clinique", "pharmacologie", "anatomie"]):
        genre = "Médecine & Santé"
        dewey = "610"
        faculty = "Faculté des Sciences de la Santé (FSS)"
        inst = "Université d'Abomey-Calavi (UAC)"
    elif any(k in lower_name for k in ["manga", "bd", "comics", "illustration", "tome"]):
        genre = "Manga & Bande Dessinée"
        dewey = "741.5"
        faculty = None
        inst = None
    elif any(k in lower_name for k in ["roman", "conte", "poeme", "nouvelle", "theatre", "histoire"]):
        genre = "Littérature & Fiction"
        dewey = "840"
        faculty = None
        inst = None
    else:
        genre = "Sciences Humaines & Savoirs"
        dewey = "000"
        faculty = "Faculté des Lettres, Langues, Arts et Communication (FLLAC)"
        inst = "Université d'Abomey-Calavi (UAC)"

    data = {
        "title": clean_name.title(),
        "subtitle": "",
        "authors": ["Auteur LAHA"],
        "publication_year": 2026,
        "isbn": f"978-99919-{abs(hash(clean_name)) % 900 + 100}-1",
        "summary": f"Ouvrage de référence « {clean_name.title()} » publié dans le catalogue LAHAThèque. Analyse détaillée et contenu exhaustif destiné aux lecteurs et étudiants.",
        "genre_category": genre,
        "dewey_code": dewey,
        "language": "Français",
        "language_code": "fre",
        "country": "BJ",
        "target_audience": "Grand Public" if not inst else "Étudiants Universitaires",
        "institution_suggestion": inst,
        "faculty_suggestion": faculty,
        "keywords": [genre, "Édition Numérique", "LAHAThèque", "Afrique"],
        "inconsistencies": [],
        "page_count": total_pages or 120,
    }
    data["onix_3_xml"] = generate_onix_3_xml(data)
    return data
