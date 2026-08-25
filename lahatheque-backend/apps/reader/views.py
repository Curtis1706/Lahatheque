"""
Vues et ViewSets DRF pour l'API Lecteur Hébergé.
Gère la création de sessions, la validation de token, les quiz, la progression et le streaming protégé.
"""

from datetime import timedelta
import logging
from typing import Any, Dict, List
import uuid
from django.conf import settings
from django.db import transaction
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ViewSet

from apps.protection.models import TraceAcces
from .models import PartnerApp, PartnerEndUser, ReaderSession, ResultatQuizSession
from .permissions import IsAuthenticatedPartner, IsValidReaderSession, PartnerAuthentication
from .serializers import (
    ProgressSyncSerializer,
    QuizSubmitSerializer,
    ReaderSessionCreateSerializer,
    ReaderSessionDetailSerializer,
)
from .services.source_service import ReaderDocumentService
from .tasks import dispatch_partner_webhook_sync
from .tokens import ReaderTokenError, ReaderTokenService

logger = logging.getLogger(__name__)


def standard_response(data: Any = None, error: Any = None, status_code: int = status.HTTP_200_OK) -> Response:
    """Helper pour garantir le format de réponse unifié LAHAThèque { success, data, error }."""
    is_success = error is None and status_code < 400
    return Response(
        {
            "success": is_success,
            "data": data if data is not None else {},
            "error": str(error) if error else None
        },
        status=status_code
    )


class ReaderSessionViewSet(ViewSet):
    """
    Gestion des sessions de lecture hébergées pour les applications partenaires.
    Endpoints protégés par authentification partenaire (OAuth2 / Clé API).
    """
    authentication_classes = [PartnerAuthentication]
    permission_classes = [IsAuthenticatedPartner]

    def create(self, request: Request) -> Response:
        """
        POST /api/v1/reader/sessions/
        Crée une nouvelle session de lecture personnalisée (catalogue ou BYOD).
        """
        partner = getattr(request, 'partner', None)
        if not partner:
            partner = PartnerApp.objects.filter(is_active=True).first()
            if not partner:
                # Création automatique d'un partenaire démo par défaut si aucun n'existe
                partner = PartnerApp.objects.create(
                    name="Partenaire Standard",
                    webhook_secret="demo-secret-key-12345",
                    allowed_return_origins=["*"]
                )

        from .throttling import check_and_increment_daily_quota, check_concurrent_sessions_quota, PartnerQuotaError
        try:
            check_and_increment_daily_quota(partner)
            check_concurrent_sessions_quota(partner)
        except PartnerQuotaError as e:
            return standard_response(error=str(e), status_code=status.HTTP_429_TOO_MANY_REQUESTS)

        serializer = ReaderSessionCreateSerializer(data=request.data, context={'partner': partner})
        if not serializer.is_valid():
            return standard_response(
                error=serializer.errors,
                status_code=status.HTTP_400_BAD_REQUEST
            )

        validated_data = serializer.validated_data
        source_type = validated_data.get('source_type', 'catalog_book')
        ttl_seconds = validated_data.get('ttl_seconds', 3600)
        expires_at = timezone.now() + timedelta(seconds=ttl_seconds)

        with transaction.atomic():
            # 1. Résolution ou création de l'utilisateur partenaire
            external_user_ref = validated_data['external_user_ref']
            end_user, _ = PartnerEndUser.objects.get_or_create(
                partner=partner,
                external_ref=external_user_ref,
                defaults={
                    "display_name": validated_data.get('external_user_name', '') or external_user_ref,
                    "email": validated_data.get('external_user_email', '')
                }
            )
            # Mise à jour du nom si fourni
            if validated_data.get('external_user_name') and end_user.display_name != validated_data['external_user_name']:
                end_user.display_name = validated_data['external_user_name']
                end_user.save()

            # 2. Création de la session
            session = ReaderSession.objects.create(
                partner=partner,
                source_type=source_type,
                ouvrage=validated_data.get('validated_ouvrage'),
                custom_document_url=validated_data.get('document_url', ''),
                custom_document_title=validated_data.get('document_title', ''),
                custom_document_author=validated_data.get('document_author', ''),
                custom_audio_url=validated_data.get('audio_url', ''),
                end_user=end_user,
                token_hash="temporary_hash",
                theme=validated_data.get('theme', {}),
                quiz_config=validated_data.get('quiz', {}),
                tts_config=validated_data.get('tts_config', {}),
                permissions=validated_data.get('permissions', {}),
                metadata=validated_data.get('metadata', {}),
                return_url=validated_data['return_url'],
                expires_at=expires_at,
                status='created'
            )

            # 3. Génération du token JWT éphémère
            token_str, token_hash = ReaderTokenService.generate_token_for_session(session)
            session.token_hash = token_hash
            session.save()

        # 4. Construction de l'URL publique de lecture
        frontend_base = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
        reader_url = f"{frontend_base.rstrip('/')}/read/{token_str}"

        # 5. Déclenchement webhook asynchrone reader.session.opened (non bloquant)
        try:
            dispatch_partner_webhook_sync(
                partner_id=str(partner.id),
                event_type="reader.session.opened",
                session_id=str(session.id),
                payload_data={
                    "session_id": str(session.id),
                    "external_user_ref": end_user.external_ref,
                    "book_id": str(session.ouvrage_id) if session.ouvrage_id else None,
                    "document_title": session.ouvrage.titre if session.ouvrage else session.custom_document_title,
                    "expires_at": expires_at.isoformat()
                }
            )
        except Exception as wh_err:
            logger.warning(f"Erreur déclenchement webhook session.opened: {wh_err}")

        book_info = {
            "id": str(session.ouvrage_id) if session.ouvrage_id else str(session.id),
            "title": session.ouvrage.titre if session.ouvrage else session.custom_document_title,
            "author_name": session.ouvrage.auteur if session.ouvrage else session.custom_document_author,
            "total_pages": getattr(session.ouvrage, 'nombre_pages', 0) or 64,
            "has_audio": bool(session.custom_audio_url or getattr(session.ouvrage, 'fichier_audio', None)),
        }

        return standard_response(
            data={
                "session_id": str(session.id),
                "reader_url": reader_url,
                "expires_at": expires_at.isoformat(),
                "book": book_info,
                "status": "created"
            },
            status_code=status.HTTP_201_CREATED
        )

    def retrieve(self, request: Request, pk: str = None) -> Response:
        """
        GET /api/v1/reader/sessions/<id>/
        Polling d'état et consultation de progression d'une session.
        """
        partner = getattr(request, 'partner', None)
        qs = ReaderSession.objects.select_related('partner', 'ouvrage', 'end_user', 'quiz_result')
        if partner:
            qs = qs.filter(partner=partner)

        session = qs.filter(id=pk).first()
        if not session:
            return standard_response(error="Session de lecture introuvable", status_code=status.HTTP_404_NOT_FOUND)

        serializer = ReaderSessionDetailSerializer(session)
        return standard_response(data=serializer.data)

    def destroy(self, request: Request, pk: str = None) -> Response:
        """
        DELETE /api/v1/reader/sessions/<id>/
        Révocation immédiate d'une session de lecture.
        """
        partner = getattr(request, 'partner', None)
        qs = ReaderSession.objects.filter(id=pk)
        if partner:
            qs = qs.filter(partner=partner)

        session = qs.first()
        if not session:
            return standard_response(error="Session introuvable", status_code=status.HTTP_404_NOT_FOUND)

        session.status = 'revoked'
        session.save()

        # Émission webhook reader.session.finished
        dispatch_partner_webhook_sync(
            partner_id=str(session.partner_id),
            event_type="reader.session.finished",
            session_id=str(session.id),
            payload_data={
                "session_id": str(session.id),
                "external_user_ref": session.end_user.external_ref,
                "reason": "revoked_by_partner"
            }
        )

        return standard_response(data={"message": "Session révoquée avec succès"})


class ReaderValidateTokenView(APIView):
    """
    POST /api/v1/reader/sessions/validate-token/
    Endpoint public appelé par la page Next.js /read/[token] pour initialiser le lecteur.
    """
    authentication_classes = []
    permission_classes = []

    def post(self, request: Request) -> Response:
        token_str = request.data.get('token')
        if not token_str:
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                token_str = auth_header.split(" ", 1)[1].strip()

        if not token_str:
            return standard_response(error="Token de session manquant", status_code=status.HTTP_400_BAD_REQUEST)

        session = None
        error_msg = None

        try:
            session = ReaderTokenService.decode_and_validate_token(token_str)
        except ReaderTokenError as e:
            error_msg = str(e)
            # Fallback 1: Recherche par empreinte de token (token_hash)
            session = ReaderSession.objects.filter(token_hash=token_str).first()
            # Fallback 2: Recherche par UUID direct si format UUID valide
            if not session:
                try:
                    uuid_val = uuid.UUID(str(token_str))
                    session = ReaderSession.objects.filter(id=uuid_val).first()
                except (ValueError, TypeError, AttributeError):
                    session = None

        if not session:
            return standard_response(
                error=error_msg or "Jeton de session de lecture invalide ou introuvable.",
                status_code=status.HTTP_401_UNAUTHORIZED
            )

        # Vérification stricte du statut de révocation et d'expiration
        if session.status == 'revoked':
            return standard_response(
                error="Cette session de lecture a été révoquée par l'administrateur.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        if session.partner and not session.partner.is_active:
            return standard_response(
                error="Le compte partenaire associé à cette session a été suspendu par l'administrateur.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        # Vérification expiration
        is_expired_session = bool(session.expires_at and timezone.now() > session.expires_at)
        if is_expired_session:
            return standard_response(
                error="Cette session de lecture a expiré.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        doc_title = getattr(session.ouvrage, 'titre', None) or getattr(session.ouvrage, 'title', None) or session.custom_document_title or "Document"
        doc_author = getattr(session.ouvrage, 'auteur', None) or getattr(session.ouvrage, 'author', None) or session.custom_document_author or "Auteur"

        # Enregistrement de l'accès dans TraceAcces
        ip_addr = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', '127.0.0.1')).split(',')[0].strip()
        TraceAcces.objects.create(
            ouvrage=session.ouvrage,
            partner_id=str(session.partner_id) if hasattr(session, 'partner_id') and session.partner_id else str(session.partner.id),
            document_title=doc_title,
            ip_address=ip_addr,
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
            access_type='read_online',
            derived_hash=session.token_hash[:16] if session.token_hash else "nohash"
        )

        # Si le statut était 'created', on le passe à 'opened'
        if session.status == 'created':
            session.status = 'opened'
            session.save(update_fields=['status', 'updated_at'])

        doc_cover = getattr(session.ouvrage, 'couverture', None) or getattr(session.ouvrage, 'cover_image', None)
        doc_cover_url = doc_cover.url if (doc_cover and hasattr(doc_cover, 'url')) else None

        # Le fichier n'est JAMAIS exposé en direct. Le frontend doit appeler
        # GET /api/v1/reader/sessions/stream/ avec le token de session pour recevoir
        # le flux filigrané et tatoué (voir ReaderProtectedStreamView).
        doc_file_url = None

        response_data = {
            "session_id": str(session.id),
            "partner_name": session.partner.name,
            "source_type": session.source_type,
            "book": {
                "id": str(session.ouvrage_id) if session.ouvrage_id else str(session.id),
                "title": doc_title or "Document Sécurisé",
                "author": doc_author or "Auteur Inconnu",
                "cover_url": doc_cover_url,
                "file_url": None,  # Intentionnellement vide — utiliser stream_endpoint ci-dessous
                "stream_endpoint": "/api/v1/reader/sessions/stream/",
                "total_pages": getattr(session.ouvrage, 'nombre_pages', 0) or getattr(session.ouvrage, 'page_count', 28) or 28,
                "has_audio": bool(session.custom_audio_url or getattr(session.ouvrage, 'fichier_audio', None)),
                "audio_url": session.custom_audio_url or (session.ouvrage.fichier_audio.url if session.ouvrage and hasattr(session.ouvrage, 'fichier_audio') and session.ouvrage.fichier_audio else None),
            },
            "theme": session.theme,
            "quiz": session.quiz_config,
            "tts_config": session.tts_config,
            "permissions": session.permissions,
            "return_url": session.return_url,
            "last_page": session.last_page,
            "reading_time_seconds": session.reading_time_seconds,
            "quiz_completed": session.quiz_completed,
            "quiz_score": session.quiz_score,
            "user": {
                "name": session.end_user.display_name or "Lecteur Partenaire",
                "ref": session.end_user.external_ref,
                "email": session.end_user.email or "partenaire@univ.bj",
                "ip": ip_addr
            }
        }

        return standard_response(data=response_data)


class ReaderProgressView(APIView):
    """
    POST /api/v1/reader/sessions/progress/
    Synchronisation en temps réel de la page courante et du temps de lecture.
    """
    authentication_classes = []
    permission_classes = [IsValidReaderSession]

    def post(self, request: Request) -> Response:
        session: ReaderSession = request.reader_session
        serializer = ProgressSyncSerializer(data=request.data)
        if not serializer.is_valid():
            return standard_response(error=serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)

        current_page = serializer.validated_data['current_page']
        reading_time = serializer.validated_data.get('reading_time_seconds', 0)

        session.last_page = current_page
        session.reading_time_seconds += reading_time
        if session.status in ['created', 'opened']:
            session.status = 'in_progress'
        session.save(update_fields=['last_page', 'reading_time_seconds', 'status', 'updated_at'])

        # Émission webhook de progression
        dispatch_partner_webhook_sync(
            partner_id=str(session.partner_id),
            event_type="reader.progress.updated",
            session_id=str(session.id),
            payload_data={
                "current_page": current_page,
                "reading_time_seconds": session.reading_time_seconds,
                "external_user_ref": session.end_user.external_ref
            }
        )

        return standard_response(data={"status": "progress_saved", "current_page": current_page})


class ReaderQuizSubmitView(APIView):
    """
    POST /api/v1/reader/sessions/quiz-submit/
    Évaluation instantanée du quiz, enregistrement du résultat et notification webhook.
    """
    authentication_classes = []
    permission_classes = [IsValidReaderSession]

    def post(self, request: Request) -> Response:
        session: ReaderSession = request.reader_session
        serializer = QuizSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return standard_response(error=serializer.errors, status_code=status.HTTP_400_BAD_REQUEST)

        answers_submitted = serializer.validated_data['answers']
        quiz_config = session.quiz_config or {}
        questions_config = quiz_config.get('questions', [])

        if not questions_config:
            return standard_response(error="Aucun quiz n'est configuré pour cette session", status_code=status.HTTP_400_BAD_REQUEST)

        # Calcul du score
        correct_count = 0
        total_questions = len(questions_config)
        answers_detail = []

        # Indexation des questions par id
        q_map = {q.get('id'): q for q in questions_config}

        for ans in answers_submitted:
            q_id = ans.get('question_id')
            selected_idx = ans.get('selected_option_index')
            question_data = q_map.get(q_id)

            if question_data:
                correct_idx = question_data.get('correct_answer_index')
                is_correct = (selected_idx == correct_idx)
                if is_correct:
                    correct_count += 1

                answers_detail.append({
                    "question_id": q_id,
                    "question": question_data.get('question'),
                    "selected_option_index": selected_idx,
                    "correct_answer_index": correct_idx,
                    "is_correct": is_correct,
                    "explanation": question_data.get('explanation', '')
                })

        score_percent = round((correct_count / total_questions) * 100.0, 2) if total_questions > 0 else 0.0
        passing_score = quiz_config.get('passing_score_percent', 70.0)
        is_passed = score_percent >= passing_score

        with transaction.atomic():
            # Sauvegarde ou mise à jour du résultat
            resultat, _ = ResultatQuizSession.objects.update_or_create(
                session=session,
                defaults={
                    "quiz_title": quiz_config.get('title', 'Validation de Lecture'),
                    "score_percent": score_percent,
                    "passing_score_percent": passing_score,
                    "is_passed": is_passed,
                    "answers_detail": answers_detail
                }
            )

            session.quiz_completed = True
            session.quiz_score = score_percent
            session.save(update_fields=['quiz_completed', 'quiz_score', 'updated_at'])

        # Émission webhook reader.quiz.completed
        dispatch_partner_webhook_sync(
            partner_id=str(session.partner_id),
            event_type="reader.quiz.completed",
            session_id=str(session.id),
            payload_data={
                "quiz_title": resultat.quiz_title,
                "score_percent": score_percent,
                "passing_score_percent": passing_score,
                "is_passed": is_passed,
                "answers": answers_detail,
                "external_user_ref": session.end_user.external_ref
            }
        )

        return standard_response(data={
            "score_percent": score_percent,
            "passing_score_percent": passing_score,
            "is_passed": is_passed,
            "answers_detail": answers_detail
        })


from rest_framework.permissions import IsAuthenticated

class QuizRetrieveOrGenerateView(APIView):
    """
    GET /api/v1/reader/quizzes/?book_id=<uuid>
    Retourne le quiz existant pour un ouvrage, ou en génère un via IA si aucun n'existe.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from apps.catalog.models import Ouvrage, Quiz, QuizQuestion

        book_id = request.query_params.get('book_id')
        if not book_id:
            return Response({"success": False, "error": "book_id requis."}, status=400)

        try:
            ouvrage = Ouvrage.objects.get(id=book_id)
        except Ouvrage.DoesNotExist:
            return Response({"success": False, "error": "Ouvrage introuvable."}, status=404)

        # Chercher un quiz existant
        quiz = Quiz.objects.filter(ouvrage=ouvrage).prefetch_related('questions').first()

        if not quiz:
            # Générer via IA
            quiz = self._generate_quiz_with_ai(ouvrage, request.user)

        if not quiz:
            return Response({"success": True, "data": None})

        questions_data = []
        for q in quiz.questions.all():
            questions_data.append({
                "id": str(q.id),
                "question": q.question_text,
                "options": q.options,
                "correct_index": q.correct_index,
                "explanation": q.explanation,
            })

        return Response({
            "success": True,
            "data": {
                "id": str(quiz.id),
                "title": quiz.title,
                "description": quiz.description,
                "is_ai_generated": quiz.is_ai_generated,
                "book_id": str(ouvrage.id),
                "book_title": ouvrage.title,
                "questions": questions_data,
            }
        })

    def _generate_quiz_with_ai(self, ouvrage, user):
        """Génère un quiz de 5 QCM via OpenAI à partir du contenu de l'ouvrage."""
        from apps.catalog.models import Quiz, QuizQuestion
        import json
        import logging
        logger = logging.getLogger(__name__)

        try:
            # Extraire du texte du fichier de l'ouvrage
            text_sample = ""
            if ouvrage.file:
                try:
                    from apps.ai_engine.services.openai_service import extract_text_sample_from_bytes
                    file_bytes = ouvrage.file.read()
                    ouvrage.file.seek(0)
                    ext = ouvrage.file.name.split('.')[-1] if '.' in ouvrage.file.name else 'pdf'
                    text_sample, _ = extract_text_sample_from_bytes(file_bytes, file_ext=ext)
                except Exception as e:
                    logger.warning(f"Impossible d'extraire le texte pour quiz: {e}")

            if not text_sample:
                text_sample = f"Titre: {ouvrage.title}. Résumé: {ouvrage.summary or 'Non disponible'}."

            # Appel OpenAI
            from django.conf import settings
            import openai
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)

            prompt = f"""Tu es un professeur universitaire. Génère exactement 5 questions QCM (quiz à choix multiples) pour évaluer la compréhension de cet ouvrage.

Titre : {ouvrage.title}
Contenu (extrait) : {text_sample[:3000]}

Réponds UNIQUEMENT en JSON valide, sans markdown, sans backticks. Format exact :
[
  {{
    "question": "Texte de la question",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_index": 0,
    "explanation": "Explication courte de la bonne réponse"
  }}
]"""

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
            )
            raw = response.choices[0].message.content.strip()
            # Nettoyer le markdown si présent
            if raw.startswith("```"):
                raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
                if raw.endswith("```"):
                    raw = raw[:-3]
                raw = raw.strip()

            questions_list = json.loads(raw)

            # Créer le quiz en base
            quiz = Quiz.objects.create(
                ouvrage=ouvrage,
                title=f"Évaluation : {ouvrage.title[:80]}",
                description=f"Quiz auto-généré par l'IA LAHAThèque ({len(questions_list)} questions)",
                is_ai_generated=True,
                created_by=user,
            )

            for i, q_data in enumerate(questions_list[:5]):
                QuizQuestion.objects.create(
                    quiz=quiz,
                    question_text=q_data.get('question', ''),
                    options=q_data.get('options', []),
                    correct_index=int(q_data.get('correct_index', 0)),
                    explanation=q_data.get('explanation', ''),
                    order=i,
                )

            return quiz

        except Exception as e:
            logger.error(f"Erreur génération quiz IA: {e}", exc_info=True)
            return None


class QuizSubmitAnswersView(APIView):
    """
    POST /api/v1/reader/quizzes/<quiz_id>/submit/
    Soumet les réponses de l'étudiant et calcule le score.
    Body: { "answers": { "question_id": selected_index, ... } }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, quiz_id):
        from apps.catalog.models import Quiz

        try:
            quiz = Quiz.objects.prefetch_related('questions').get(id=quiz_id)
        except Quiz.DoesNotExist:
            return Response({"success": False, "error": "Quiz introuvable."}, status=404)

        answers = request.data.get('answers', {})
        if not answers:
            return Response({"success": False, "error": "Aucune réponse soumise."}, status=400)

        questions = list(quiz.questions.all())
        total = len(questions)
        correct = 0
        details = []

        for q in questions:
            user_answer = answers.get(str(q.id))
            is_correct = user_answer is not None and int(user_answer) == q.correct_index
            if is_correct:
                correct += 1
            details.append({
                "question_id": str(q.id),
                "question": q.question_text,
                "user_answer": user_answer,
                "correct_index": q.correct_index,
                "correct_option": q.options[q.correct_index] if q.correct_index < len(q.options) else "",
                "is_correct": is_correct,
                "explanation": q.explanation,
            })

        score_percent = (correct / total * 100) if total > 0 else 0
        passed = score_percent >= 70

        return Response({
            "success": True,
            "data": {
                "quiz_id": str(quiz.id),
                "quiz_title": quiz.title,
                "score": correct,
                "total": total,
                "score_percent": round(score_percent, 1),
                "passed": passed,
                "details": details,
            }
        })


import re
from django.http import HttpResponse
from rest_framework.renderers import BaseRenderer, JSONRenderer


class PassthroughStreamRenderer(BaseRenderer):
    """Renderer universel autorisant le streaming binaire PDF, audio et vidéo."""
    media_type = "*/*"
    format = "binary"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        return data


class ReaderProtectedStreamView(APIView):
    """
    GET /api/v1/reader/sessions/stream/
    Sert le document d'une session de lecture hébergée en flux fragmenté Range HTTP 206,
    avec filigrane et tatouage réellement appliqués dans les octets (jamais de fichier brut).
    Authentification par jeton de session (X-Reader-Token, Bearer, ou ?token=).
    """
    authentication_classes = []
    permission_classes = [IsValidReaderSession]
    renderer_classes = [PassthroughStreamRenderer, JSONRenderer]

    DEFAULT_CHUNK_SIZE = 256 * 1024

    def get(self, request: Request) -> Response:
        from apps.protection.derived_materializer import DerivedMaterializer
        from apps.protection.models import ProtectionConfig, TraceAcces

        session: ReaderSession = request.reader_session

        if not session.is_valid:
            return standard_response(
                error="Session de lecture expirée ou révoquée.",
                status_code=status.HTTP_403_FORBIDDEN
            )

        # 1. Résolution de la configuration de protection
        protection_config = None
        if session.ouvrage_id:
            protection_config = ProtectionConfig.objects.filter(ouvrage=session.ouvrage).first()

        # 2. Métadonnées utilisateur pour le filigrane nominatif
        ip = request.META.get("HTTP_X_FORWARDED_FOR", request.META.get("REMOTE_ADDR", "127.0.0.1")).split(",")[0].strip()
        user_info = {
            "nom": session.end_user.display_name or session.end_user.external_ref,
            "email": session.end_user.email or "",
            "ip": ip,
            "user_id": f"partner:{session.partner_id}:{session.end_user.external_ref}",
        }

        # 3. Matérialisation du dérivé filigrané (catalogue interne OU BYOD externe)
        try:
            if session.source_type == "catalog_book" and session.ouvrage_id:
                pdf_bytes, total_size = DerivedMaterializer.get_or_create_derived(
                    source_type="catalog_book",
                    source_reference=str(session.ouvrage_id),
                    user_info=user_info,
                    config=protection_config,
                )
            elif session.source_type == "external_url" and session.custom_document_url:
                partner_quotas = session.partner.quotas or {}
                options = {
                    "allowed_document_sources": partner_quotas.get("allowed_document_sources", []),
                    "max_file_size_mb": partner_quotas.get("max_file_size_mb", 200),
                }
                pdf_bytes, total_size = DerivedMaterializer.get_or_create_derived(
                    source_type="external_url",
                    source_reference=session.custom_document_url,
                    user_info=user_info,
                    config=protection_config,
                    options=options,
                )
            else:
                return standard_response(
                    error="Source de document non résolue pour cette session.",
                    status_code=status.HTTP_404_NOT_FOUND
                )
        except Exception as e:
            logger.error(f"[ReaderStream] Erreur matérialisation dérivé (session {session.id}): {e}")
            return standard_response(
                error="Impossible de charger le document sécurisé.",
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # 4. Traitement du Range HTTP (Support HTTP 200 complet & HTTP 206 partiel)
        range_header = request.META.get("HTTP_RANGE")
        is_range_request = bool(range_header and range_header.startswith("bytes="))

        if is_range_request:
            start_byte, end_byte = self._parse_range_header(range_header, total_size)
            if start_byte is None:
                response = HttpResponse(status=status.HTTP_416_REQUESTED_RANGE_NOT_SATISFIABLE)
                response["Content-Range"] = f"bytes */{total_size}"
                return response

            chunk_data = pdf_bytes[start_byte:end_byte + 1]
            response = HttpResponse(chunk_data, status=status.HTTP_206_PARTIAL_CONTENT, content_type="application/pdf")
            response["Content-Range"] = f"bytes {start_byte}-{end_byte}/{total_size}"
            response["Content-Length"] = str(len(chunk_data))
        else:
            chunk_data = pdf_bytes
            response = HttpResponse(chunk_data, status=status.HTTP_200_OK, content_type="application/pdf")
            response["Content-Length"] = str(total_size)

        # 5. Journalisation légale
        try:
            doc_title = session.ouvrage.titre if session.ouvrage else session.custom_document_title
            TraceAcces.objects.create(
                ouvrage=session.ouvrage,
                partner_id=str(session.partner_id),
                document_title=doc_title or "Document Partenaire",
                ip_address=ip,
                user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
                access_type="read_chunk" if is_range_request else "read_full",
                derived_hash=session.token_hash[:16] if session.token_hash else "nohash",
            )
        except Exception as log_err:
            logger.warning(f"[ReaderStream] Erreur TraceAcces: {log_err}")

        response["Accept-Ranges"] = "bytes"
        response["Cache-Control"] = "private, no-store, must-revalidate"
        response["X-Content-Type-Options"] = "nosniff"
        return response

    def _parse_range_header(self, range_header, total_size):
        if not range_header or not range_header.startswith("bytes="):
            return 0, total_size - 1

        match = re.match(r"bytes=(\d+)-(\d*)", range_header)
        if not match:
            return None, None

        start_str, end_str = match.groups()
        start = int(start_str)
        if start >= total_size:
            return None, None

        if end_str:
            end = min(int(end_str), total_size - 1)
        else:
            end = min(start + self.DEFAULT_CHUNK_SIZE - 1, total_size - 1)

        if start > end:
            return None, None

        return start, end
