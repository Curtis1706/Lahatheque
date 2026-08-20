"""
Vues DRF pour l'Assistant IA Transverse LAHAThèque.
Endpoint d'analyse et d'extraction de métadonnées automatique, classification Dewey & ONIX 3.0.
"""

import logging
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .services.openai_service import (
    extract_text_sample_from_bytes,
    analyze_document_with_openai,
)

logger = logging.getLogger(__name__)


class ExtractBookMetadataAIView(APIView):
    """
    POST /api/v1/ai/extract-metadata/
    Analyse un fichier PDF/EPUB téléversé ou un nom de fichier pour extraire
    les métadonnées, le résumé, la classification Dewey, la faculté et générer le document ONIX 3.0.
    """
    permission_classes = [permissions.AllowAny]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get("file") or request.FILES.get("document")
        filename = request.data.get("filename", "")

        text_sample = ""
        total_pages = 0

        if file_obj:
            filename = filename or file_obj.name
            file_bytes = file_obj.read()
            ext = filename.split(".")[-1] if "." in filename else "pdf"
            text_sample, total_pages = extract_text_sample_from_bytes(file_bytes, file_ext=ext)
        elif request.data.get("text"):
            text_sample = request.data.get("text")
            total_pages = int(request.data.get("page_count", 0))

        if not filename and not text_sample:
            return Response(
                {"success": False, "error": "Veuillez fournir un fichier PDF/EPUB ou un texte à analyser."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            ai_results = analyze_document_with_openai(
                text_sample=text_sample,
                filename=filename,
                total_pages=total_pages
            )

            return Response({
                "success": True,
                "message": "Métadonnées et notice ONIX 3.0 extraites avec succès par l'Assistant IA.",
                "data": ai_results
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"[AI View Error] {e}")
            return Response(
                {"success": False, "error": f"Erreur lors du traitement IA : {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CheckMetadataConsistencyAIView(APIView):
    """
    POST /api/v1/ai/check-consistency/
    Contrôle qualité des métadonnées (détection d'incohérences entre titre, discipline, faculté).
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        title = request.data.get("title", "")
        discipline = request.data.get("discipline", "")
        summary = request.data.get("summary", "")

        inconsistencies = []
        if title and discipline:
            lower_title = title.lower()
            if "droit" in lower_title and "Santé" in discipline:
                inconsistencies.append("Attention : Le titre suggère un ouvrage juridique mais la discipline sélectionnée est Santé/Médecine.")
            elif "manga" in lower_title and "Droit" in discipline:
                inconsistencies.append("Incohérence détectée : Bande dessinée / Manga classé en Droit.")

        return Response({
            "success": True,
            "has_inconsistencies": len(inconsistencies) > 0,
            "inconsistencies": inconsistencies
        })
