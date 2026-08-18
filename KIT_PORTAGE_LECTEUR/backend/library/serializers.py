from django.utils import timezone
from django.db import models
from rest_framework import serializers
from .models import (
    LibraryBook, ReadingProgress, LibraryAnnotation, 
    PhysicalBook, PhysicalBookChapter, PhysicalBookResource, PhysicalBookQRToken
)
from academics.serializers import GradeLevelSerializer
from academics.models import GradeLevel
from media.stream_client import CloudflareStreamClient
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

class HybridFileField(serializers.FileField):
    """
    Un FileField qui accepte à la fois un fichier binaire physique et une URL de fichier déjà téléversé.
    Si c'est une URL/chaîne textuelle, il enregistre le chemin relatif sur R2.
    """
    def to_internal_value(self, data):
        if isinstance(data, str):
            from django.conf import settings
            public_url = getattr(settings, 'CLOUDFLARE_R2_PUBLIC_URL', '')
            if public_url and data.startswith(public_url):
                data = data.replace(public_url, '').lstrip('/')
            elif data.startswith('http://') or data.startswith('https://'):
                from urllib.parse import urlparse
                path = urlparse(data).path
                data = path.lstrip('/')
            
            # Nettoyer les préfixes media/media/ ou media/ pour éviter le doublon avec la location du Storage R2
            if data.startswith('media/media/'):
                data = data[12:]
            elif data.startswith('media/'):
                data = data[6:]
            return data
        return super().to_internal_value(data)

class HybridImageField(serializers.ImageField):
    def to_internal_value(self, data):
        if isinstance(data, str):
            from django.conf import settings
            public_url = getattr(settings, 'CLOUDFLARE_R2_PUBLIC_URL', '')
            if public_url and data.startswith(public_url):
                data = data.replace(public_url, '').lstrip('/')
            elif data.startswith('http://') or data.startswith('https://'):
                from urllib.parse import urlparse
                path = urlparse(data).path
                data = path.lstrip('/')
            
            # Nettoyer les préfixes media/media/ ou media/ pour éviter le doublon avec la location du Storage R2
            if data.startswith('media/media/'):
                data = data[12:]
            elif data.startswith('media/'):
                data = data[6:]
            return data
        return super().to_internal_value(data)

class ReadingProgressSerializer(serializers.ModelSerializer):
    is_completed = serializers.SerializerMethodField()
    progress = serializers.SerializerMethodField()

    class Meta:
        model = ReadingProgress
        fields = ['last_page', 'total_pages', 'updated_at', 'is_completed', 'progress']

    def get_is_completed(self, obj):
        return obj.total_pages > 0 and obj.last_page >= obj.total_pages

    def get_progress(self, obj):
        if obj.total_pages > 0:
            return round((obj.last_page / obj.total_pages) * 100)
        return 0

class LibraryBookSerializer(serializers.ModelSerializer):
    grade_levels = GradeLevelSerializer(many=True, read_only=True)
    progress = serializers.SerializerMethodField()
    author_name = serializers.CharField(source='author_profile.user.first_name', read_only=True)
    author_id = serializers.UUIDField(source='author_profile.id', read_only=True)
    author_profile = serializers.PrimaryKeyRelatedField(read_only=True)

    subject_label = serializers.CharField(source='subject.label', read_only=True)
    is_quiz_validated = serializers.SerializerMethodField()
    
    class Meta:
        model = LibraryBook
        fields = [
            'id', 'title', 'description', 'file', 'audio_file', 'category', 'thumbnail_url', 'cover_image', 'grade_levels', 
            'subject', 'subject_label', 'status', 'rejection_reason',
            'is_active', 'created_at', 'progress', 'author_name', 'author_id', 'author_profile',
            'is_international', 'target_countries', 'target_audiences', 'is_quiz_validated'
        ]

    def get_progress(self, obj):
        # 1. Utiliser le prefetch `to_attr` s'il existe (évite le N+1)
        progress_list = getattr(obj, 'user_reading_progress', None)
        if progress_list is not None:
            return ReadingProgressSerializer(progress_list[0]).data if progress_list else None
            
        # 2. Fallback classique
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            user = request.user
            if hasattr(user, 'parent_profile') and getattr(user.parent_profile, 'last_selected_child_id', None):
                from students.models import StudentProfile
                student = StudentProfile.objects.filter(id=user.parent_profile.last_selected_child_id).first()
                if student:
                    user = student.user
            progress = ReadingProgress.objects.filter(user=user, book=obj).first()
            if progress:
                return ReadingProgressSerializer(progress).data
        return None

    def get_is_quiz_validated(self, obj):
        # 1. Utiliser le prefetch `to_attr` s'il existe (évite le N+1)
        attempts_list = getattr(obj, 'user_quiz_attempts', None)
        if attempts_list is not None:
            return any(attempt.is_validated for attempt in attempts_list)
            
        # 2. Fallback classique
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            from .models import BookQuizAttempt
            return BookQuizAttempt.objects.filter(
                user=request.user, 
                quiz__book=obj, 
                is_validated=True
            ).exists()
        return False

class LibraryBookAdminSerializer(serializers.ModelSerializer):
    """
    Sérieliseur complet pour l'administration et les auteurs.
    """
    author_name = serializers.CharField(source='author_profile.user.first_name', read_only=True)
    grade_levels = serializers.PrimaryKeyRelatedField(many=True, queryset=GradeLevel.objects.all(), required=False)
    grade_levels_details = GradeLevelSerializer(source='grade_levels', many=True, read_only=True)
    subject_label = serializers.CharField(source='subject.label', read_only=True)
    
    file = HybridFileField(required=False, allow_null=True)
    cover_image = HybridImageField(required=False, allow_null=True)
    audio_file = HybridFileField(required=False, allow_null=True)

    class Meta:
        model = LibraryBook
        fields = [
            'id', 'title', 'description', 'file', 'audio_file', 'category', 'thumbnail_url', 'cover_image', 'grade_levels', 
            'grade_levels_details', 'subject', 'subject_label',
            'is_active', 'status', 'rejection_reason', 'author_profile', 'author_name', 
            'is_international', 'target_countries', 'target_audiences', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate_target_audiences(self, value):
        if not value:
            raise serializers.ValidationError("Vous devez sélectionner au moins un public cible.")
        for audience in value:
            if audience not in ['students', 'teachers']:
                raise serializers.ValidationError(f"Cible invalide: {audience}")
        return value

class LibraryAnnotationSerializer(serializers.ModelSerializer):
    class Meta:
        model = LibraryAnnotation
        fields = ['id', 'user', 'book', 'content', 'color', 'data', 'created_at']
        read_only_fields = ['id', 'user', 'created_at']

# --- Quiz Serializers ---

from .models import BookQuiz, BookQuestion, BookChoice, BookQuizAttempt

class BookChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookChoice
        fields = ['id', 'text'] # On ne renvoie pas is_correct à l'élève

class BookChoiceAdminSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)
    class Meta:
        model = BookChoice
        fields = ['id', 'text', 'is_correct']

class BookQuestionSerializer(serializers.ModelSerializer):
    choices = BookChoiceSerializer(many=True, read_only=True)
    
    class Meta:
        model = BookQuestion
        fields = ['id', 'text', 'order', 'points', 'choices']

class BookQuestionAdminSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False)
    choices = BookChoiceAdminSerializer(many=True)
    
    class Meta:
        model = BookQuestion
        fields = ['id', 'text', 'order', 'points', 'choices']

class BookQuizSerializer(serializers.ModelSerializer):
    questions = BookQuestionSerializer(many=True, read_only=True)
    
    class Meta:
        model = BookQuiz
        fields = ['id', 'book', 'description', 'passing_score', 'questions']

class BookQuizAdminSerializer(serializers.ModelSerializer):
    questions = BookQuestionAdminSerializer(many=True)
    
    class Meta:
        model = BookQuiz
        fields = ['id', 'book', 'description', 'passing_score', 'questions']

    def create(self, validated_data):
        questions_data = validated_data.pop('questions', [])
        quiz = BookQuiz.objects.create(**validated_data)
        for question_data in questions_data:
            choices_data = question_data.pop('choices', [])
            question = BookQuestion.objects.create(quiz=quiz, **question_data)
            for choice_data in choices_data:
                BookChoice.objects.create(question=question, **choice_data)
        return quiz

    def update(self, instance, validated_data):
        questions_data = validated_data.pop('questions', [])
        instance.description = validated_data.get('description', instance.description)
        instance.passing_score = validated_data.get('passing_score', instance.passing_score)
        instance.save()

        # Simplification: on recrée les questions pour éviter les logiques complexes de diff
        # (Optionnel: on pourrait faire un vrai diff si besoin de performance)
        instance.questions.all().delete()
        for question_data in questions_data:
            choices_data = question_data.pop('choices', [])
            question_data.pop('id', None)
            question = BookQuestion.objects.create(quiz=instance, **question_data)
            for choice_data in choices_data:
                choice_data.pop('id', None)
                BookChoice.objects.create(question=question, **choice_data)
        
        return instance

class BookQuizAttemptSerializer(serializers.ModelSerializer):
    class Meta:
        model = BookQuizAttempt
        fields = ['id', 'user', 'quiz', 'score', 'is_validated', 'answers_data', 'created_at']
        read_only_fields = ['id', 'user', 'score', 'is_validated', 'created_at']


# --- Physical Book Serializers ---

class PhysicalBookResourceSerializer(serializers.ModelSerializer):
    """Lecture seule — exposé aux élèves via le token QR."""
    final_url = serializers.SerializerMethodField()

    class Meta:
        model = PhysicalBookResource
        fields = [
            'id', 'resource_type', 'title', 'content', 'lesson', 'qcm', 'exercise',
            'file', 'file_url', 'stream_id', 'hls_url', 'final_url',
            'duration_minutes', 'page_reference', 'order'
        ]

    def get_final_url(self, obj):
        # 1. Priorité au streaming HLS (Cloudflare Stream)
        if obj.hls_url:
            return obj.hls_url
        # 2. Fichier uploadé sur R2/S3
        if obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        # 3. URL externe (YouTube, etc.)
        return obj.file_url


class PhysicalBookResourceAdminSerializer(serializers.ModelSerializer):
    """Écriture complète — utilisé par l'admin pour CRUD les ressources."""
    id = serializers.UUIDField(required=False)
    lesson_title = serializers.CharField(source='lesson.title', read_only=True)
    qcm_title = serializers.CharField(source='qcm.title', read_only=True)
    exercise_title = serializers.CharField(source='exercise.title', read_only=True)

    class Meta:
        model = PhysicalBookResource
        fields = [
            'id', 'resource_type', 'title', 'content',
            'lesson', 'lesson_title',
            'qcm', 'qcm_title',
            'exercise', 'exercise_title',
            'file', 'file_url', 'stream_id', 'hls_url',
            'duration_minutes', 'page_reference', 'order'
        ]
        read_only_fields = ['id']
    def create(self, validated_data):
        file_obj = validated_data.pop('file', None)
        res_type = validated_data.get('resource_type')
        stream_id_val = validated_data.get('stream_id')

        # Si le frontend a déjà géré l'upload Cloudflare (TUS) et a envoyé un stream_id
        if res_type == 'video' and stream_id_val and not file_obj:
            if not validated_data.get('hls_url'):
                validated_data['hls_url'] = f"https://{settings.CLOUDFLARE_STREAM_SUBDOMAIN}/{stream_id_val}/manifest/video.m3u8"
        # Rétrocompatibilité : proxy upload si le fichier est passé
        elif res_type == 'video' and file_obj:
            try:
                client = CloudflareStreamClient()
                stream_data = client.upload_file(file_obj)
                if stream_data and 'stream_id' in stream_data:
                    uid = stream_data['stream_id']
                    validated_data['stream_id'] = uid
                    validated_data['hls_url'] = stream_data.get('hls_url') or f"https://{settings.CLOUDFLARE_STREAM_SUBDOMAIN}/{uid}/manifest/video.m3u8"
                    if not validated_data.get('duration_minutes') and stream_data.get('duration'):
                        validated_data['duration_minutes'] = int(float(stream_data['duration']) / 60)
            except Exception as e:
                logger.error(f"Error uploading to Cloudflare Stream: {str(e)}")
        
        # Pour les autres types ou si pas Cloudflare, le FileField gère l'upload vers R2/S3 via Django
        if file_obj and res_type != 'video':
            validated_data['file'] = file_obj

        return super().create(validated_data)

    def update(self, instance, validated_data):
        file_obj = validated_data.pop('file', None)
        if file_obj:
            instance.file = file_obj
        return super().update(instance, validated_data)


class PhysicalBookChapterSerializer(serializers.ModelSerializer):
    """Lecture seule — exposé aux élèves."""
    resources = serializers.SerializerMethodField()
    
    class Meta:
        model = PhysicalBookChapter
        fields = ['id', 'title', 'order', 'resources']

    def get_resources(self, obj):
        import re
        resources = list(obj.resources.all())
        def get_page_num(res):
            ref = res.page_reference or ''
            match = re.search(r'\d+', ref)
            return int(match.group(0)) if match else 999999
        resources.sort(key=lambda r: (get_page_num(r), r.order))
        return PhysicalBookResourceSerializer(resources, many=True, context=self.context).data


class PhysicalBookChapterAdminSerializer(serializers.ModelSerializer):
    """Écriture complète — admin, avec ressources imbriquées."""
    id = serializers.UUIDField(required=False)
    resources = PhysicalBookResourceAdminSerializer(many=True, required=False)

    class Meta:
        model = PhysicalBookChapter
        fields = ['id', 'title', 'order', 'resources']

    def create(self, validated_data):
        resources_data = validated_data.pop('resources', [])
        chapter = PhysicalBookChapter.objects.create(**validated_data)
        for res_data in resources_data:
            res_data.pop('id', None)
            PhysicalBookResource.objects.create(chapter=chapter, **res_data)
        return chapter

    def update(self, instance, validated_data):
        resources_data = validated_data.pop('resources', None)
        instance.title = validated_data.get('title', instance.title)
        instance.order = validated_data.get('order', instance.order)
        instance.save()

        if resources_data is not None:
            instance.resources.all().delete()
            for res_data in resources_data:
                res_data.pop('id', None)
                PhysicalBookResource.objects.create(chapter=instance, **res_data)
        return instance


class PhysicalBookPublicSerializer(serializers.ModelSerializer):
    """Sérieliseur pour l'affichage initial (Cover + Header)"""
    subject_label = serializers.CharField(source='subject.label', read_only=True)
    grade_level_label = serializers.CharField(source='grade_level.label', read_only=True)

    class Meta:
        model = PhysicalBook
        fields = [
            'id', 'title', 'subject_label', 'grade_level_label', 
            'cover_image', 'publisher', 'edition_year'
        ]


class PhysicalBookDetailSerializer(serializers.ModelSerializer):
    """Sérieliseur complet avec table des matières"""
    subject_label = serializers.CharField(source='subject.label', read_only=True)
    grade_level_label = serializers.CharField(source='grade_level.label', read_only=True)
    chapters = PhysicalBookChapterSerializer(many=True, read_only=True)

    class Meta:
        model = PhysicalBook
        fields = [
            'id', 'title', 'subject_label', 'grade_level_label', 
            'cover_image', 'publisher', 'edition_year', 'isbn', 'chapters'
        ]


class QRBatchSerializer(serializers.ModelSerializer):
    """Lot de QR Codes — lecture + création."""
    tokens_activated = serializers.SerializerMethodField()
    tokens_total = serializers.SerializerMethodField()
    first_token = serializers.SerializerMethodField()

    class Meta:
        from .models import QRBatch
        model = QRBatch
        fields = ['id', 'quantity', 'notes', 'created_at', 'tokens_activated', 'tokens_total', 'first_token']
        read_only_fields = ['id', 'created_at']

    def get_tokens_activated(self, obj):
        return obj.tokens.filter(is_activated=True).count()

    def get_tokens_total(self, obj):
        return obj.tokens.count()
    
    def get_first_token(self, obj):
        if obj.quantity == 1:
            t = obj.tokens.first()
            return t.token if t else None
        return None


class PhysicalBookAdminSerializer(serializers.ModelSerializer):
    """CRUD complet admin — avec chapitres imbriqués et stats QR."""
    chapters = PhysicalBookChapterAdminSerializer(many=True, required=False)
    subject_label = serializers.CharField(source='subject.label', read_only=True)
    grade_level_label = serializers.CharField(source='grade_level.label', read_only=True)
    cover_image_url = serializers.SerializerMethodField()
    qr_stats = serializers.SerializerMethodField()

    class Meta:
        model = PhysicalBook
        fields = [
            'id', 'title', 'subject', 'subject_label',
            'grade_level', 'grade_level_label', 'country',
            'cover_image', 'cover_image_url',
            'publisher', 'edition_year', 'isbn',
            'chapters', 'qr_stats'
        ]
        read_only_fields = ['id']

    def get_cover_image_url(self, obj):
        request = self.context.get('request')
        if obj.cover_image and request:
            return request.build_absolute_uri(obj.cover_image.url)
        return None

    def get_qr_stats(self, obj):
        # Nombre d'utilisateurs uniques (via BookAccess)
        unique_readers = obj.user_accesses.count()
        # Nombre total de scans (somme des access_count de tous les tokens)
        total_scans = obj.tokens.aggregate(models.Sum('access_count'))['access_count__sum'] or 0
        # Récupérer le dernier token généré pour affichage dans l'éditeur
        latest_token_obj = obj.tokens.order_by('-created_at').first()
        
        return {
            'unique_readers': unique_readers,
            'total_scans': total_scans,
            'total_tokens': obj.tokens.count(),
            'latest_token': latest_token_obj.token if latest_token_obj else None,
        }

    def create(self, validated_data):
        chapters_data = validated_data.pop('chapters', [])
        book = PhysicalBook.objects.create(**validated_data)
        for ch_data in chapters_data:
            resources_data = ch_data.pop('resources', [])
            ch_data.pop('id', None)
            chapter = PhysicalBookChapter.objects.create(book=book, **ch_data)
            for res_data in resources_data:
                res_data.pop('id', None)
                PhysicalBookResource.objects.create(chapter=chapter, **res_data)
        return book

    def update(self, instance, validated_data):
        chapters_data = validated_data.pop('chapters', None)
        # Mise à jour des champs scalaires
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        # On ne touche pas aux chapitres lors d'un PATCH sans 'chapters'
        # (les chapitres sont gérés via leurs propres endpoints)
        return instance


from .models import ShowcaseBook

class ShowcaseBookSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShowcaseBook
        fields = ['id', 'title', 'cover_image', 'is_active', 'order', 'country', 'created_at']
        read_only_fields = ['id', 'created_at']
