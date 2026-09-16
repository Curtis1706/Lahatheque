import json
import logging
from celery import shared_task
from django.conf import settings
from django.contrib.auth import get_user_model

logger = logging.getLogger(__name__)

User = get_user_model()


@shared_task
def analyser_ouvrage_task(ouvrage_id):
    """Tâche asynchrone d'analyse de texte complet d'un ouvrage."""
    pass


@shared_task(name="ai_engine.task_generate_quiz", bind=True, max_retries=2)
def task_generate_quiz(self, ouvrage_id, user_id=None):
    """SEC-06: Génération asynchrone sécurisée d'un quiz de 5 QCM via OpenAI."""
    from apps.catalog.models import Ouvrage, Quiz, QuizQuestion

    try:
        ouvrage = Ouvrage.objects.filter(id=ouvrage_id).first()
        if not ouvrage:
            logger.warning(f"Ouvrage {ouvrage_id} introuvable pour generation quiz.")
            return None

        # Vérifier si un quiz existe déjà
        quiz = Quiz.objects.filter(ouvrage=ouvrage).first()
        if quiz:
            return str(quiz.id)

        user = None
        if user_id:
            user = User.objects.filter(id=user_id).first()

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

        import openai
        api_key = getattr(settings, 'OPENAI_API_KEY', '')
        if not api_key:
            logger.error("OPENAI_API_KEY non configuree.")
            return None

        client = openai.OpenAI(api_key=api_key)

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
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
            if raw.endswith("```"):
                raw = raw[:-3]
            raw = raw.strip()

        questions_list = json.loads(raw)

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

        logger.info(f"Quiz généré avec succès pour l'ouvrage {ouvrage.id} (Quiz: {quiz.id})")
        return str(quiz.id)

    except Exception as exc:
        logger.error(f"Erreur lors de la génération asynchrone du quiz pour {ouvrage_id}: {exc}", exc_info=True)
        raise self.retry(exc=exc, countdown=60)
