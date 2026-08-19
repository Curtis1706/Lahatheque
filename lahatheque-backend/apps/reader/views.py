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

        # 5. Déclenchement webhook asynchrone reader.session.opened
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

        doc_file = getattr(session.ouvrage, 'fichier_numerique', None) or getattr(session.ouvrage, 'file', None)
        doc_file_url = doc_file.url if (doc_file and hasattr(doc_file, 'url')) else (session.custom_document_url or "/api/pdf?file=PromptBreeder_Original_Paper-2309.16797v1.pdf")

        response_data = {
            "session_id": str(session.id),
            "partner_name": session.partner.name,
            "source_type": session.source_type,
            "book": {
                "id": str(session.ouvrage_id) if session.ouvrage_id else str(session.id),
                "title": doc_title or "Document Sécurisé",
                "author": doc_author or "Auteur Inconnu",
                "cover_url": doc_cover_url,
                "file_url": doc_file_url,
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
