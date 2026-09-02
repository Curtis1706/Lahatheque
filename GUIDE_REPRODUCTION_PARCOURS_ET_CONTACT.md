# Architecture et Guide de Reproduction : Moteur de Parcours Guides, Guide d'Utilisation Multi-Roles et Widget Contact

Ce document constitue la specification technique et fonctionnelle complete pour reproduire dans un autre projet :
1. Le Moteur de Parcours Pedagogiques Guides (Creation Admin/Prof, Moderation, Progression, Lecteur Multi-ressources).
2. La matrice des fonctionnalites et des ecrans visibles par chaque role utilisateur (Admin, Enseignant, Eleve, Parent, Super-Client).
3. Le Systeme de Guide d'Utilisation integre par role (GuideViewer).
4. Le Systeme de Contact Support integre aux Sidebars et a la navigation mobile.

---

## Sommaire

- [1. Fonctionnement Global et Cycle de Vie des Parcours Guides](#1-fonctionnement-global-et-cycle-de-vie-des-parcours-guides)
  - [1.1. Schema Conceptuel d'un Parcours](#11-schema-conceptuel-dun-parcours)
  - [1.2. Cycle de Vie et Workflow de Moderation](#12-cycle-de-vie-et-workflow-de-moderation)
- [2. Matrice Detaillee des Dashboards par Role](#2-matrice-detaillee-des-dashboards-par-role)
  - [2.1. Role Administrateur (Admin)](#21-role-administrateur-admin)
  - [2.2. Role Enseignant (Teacher)](#22-role-enseignant-teacher)
  - [2.3. Role Eleve (Student)](#23-role-eleve-student)
  - [2.4. Role Parent](#24-role-parent)
  - [2.5. Role Super Client / Etablissement](#25-role-super-client--etablissement)
- [3. Backend Django : Modeles, Logique Metier et API](#3-backend-django--modeles-logique-metier-et-api)
  - [3.1. Modeles de donnees (models.py)](#31-modeles-de-donnees-modelspy)
  - [3.2. Services de progression (services.py)](#32-services-de-progression-servicespy)
  - [3.3. Serialiseurs DRF (serializers.py)](#33-serialiseurs-drf-serializerspy)
  - [3.4. Vues API (api_views.py)](#34-vues-api-api_viewspy)
  - [3.5. Routage (urls.py)](#35-routage-urlspy)
- [4. Frontend Next.js : Composants de Creation et de Consultation](#4-frontend-nextjs--composants-de-creation-et-de-consultation)
  - [4.1. Formulaire de Creation/Edition Admin et Prof (GuidedPathForm.tsx)](#41-formulaire-de-creationedition-admin-et-prof-guidedpathformtsx)
  - [4.2. Carte de Parcours (GuidedPathCard.tsx)](#42-carte-de-parcours-guidedpathcardtsx)
  - [4.3. Carte d'Activite Modulaire (LessonCard.tsx)](#43-carte-dactivite-modulaire-lessoncardtsx)
  - [4.4. Lecteur de Parcours Structure (structured/page.tsx)](#44-lecteur-de-parcours-structure-structuredpagetsx)
- [5. Systeme de Guide d'Utilisation Integre (GuideViewer.tsx)](#5-systeme-de-guide-dutilisation-integre-guideviewertsx)
- [6. Systeme de Contact Support (Sidebar et Navigation Mobile)](#6-systeme-de-contact-support-sidebar-et-navigation-mobile)
  - [6.1. Modale de Contact (ContactSupportDialog.tsx)](#61-modale-de-contact-contactsupportdialogtsx)
  - [6.2. Decouplage par CustomEvent](#62-decouplage-par-customevent)
  - [6.3. Endpoint Backend d'Envoi d'Email](#63-endpoint-backend-denvoi-demail)

---

# 1. Fonctionnement Global et Cycle de Vie des Parcours Guides

## 1.1. Schema Conceptuel d'un Parcours

Un Parcours Guide (Guided Path) est un programme pedagogique complet organise selon la hierarchie suivante :

```
[Parcours Guide : Titre, Niveau Scolaire, Pays, Recompenses XP, Heures Estimees]
  |-- Video / PDF de Presentation + Livres Recommandes Associes
  |
  |-- Situation 1 (ex: "Situation d'Apprentissage 1 : Geometrie dans l'espace")
  |     |-- Sequence 1 (ex: "Lecon 1 : Proprietes du cylindre")
  |     |     |-- Objectifs Pedagogiques (Format HTML/Markdown)
  |     |     |-- Videos explicatives
  |     |     |-- Supports de cours PDF
  |     |     |-- Fiche de synthese PDF
  |     |     |-- Exercices interactifs autocorriges
  |     |     |-- Devoir maison a rendre (avec date limite calculee)
  |     |     |-- Examen blanc chronometre
  |     |-- Sequence 2
  |
  |-- Situation 2
  |     |-- Sequence 1
  |     |-- Sequence 2
  |
  |-- Examen Blanc Final (Mock Exam global cloturant l'ensemble du parcours)
```

## 1.2. Cycle de Vie et Workflow de Moderation

1. **Creation par l'Admin** :
   - L'admin remplit le formulaire de creation (titre, objectif, niveau, pays, duree, XP, situations, sequences, association des medias).
   - Le parcours est cree avec `approval_status = 'approved'`.
   - L'admin peut le publier immediatement (`is_published = True`).

2. **Creation par l'Enseignant (Professeur)** :
   - L'enseignant concoit son parcours depuis son espace dedie.
   - A la creation, le parcours recoit automatiquement `approval_status = 'pending'` et `is_published = False`.
   - Le professeur clique sur "Soumettre pour validation" (`POST /api/v1/teacher/guided-paths/<id>/submit-for-review/`).

3. **Validation / Rejet par l'Administrateur** :
   - L'administrateur visualise les parcours en attente dans son onglet de moderation.
   - Option A : L'admin clique sur **Approuver** (`POST /api/v1/admin/guided-paths/<id>/approve/`). Le parcours passe a `approved` et devient publie (`is_published = True`).
   - Option B : L'admin clique sur **Refuser** avec une note explicative (`POST /api/v1/admin/guided-paths/<id>/reject/`). Le statut devient `rejected` et le professeur recoit la note `approval_note` pour corriger son contenu.

4. **Consommation par l'Eleve** :
   - L'eleve consulte son catalogue (filtre automatiquement selon sa classe / niveau).
   - Lorsqu'il clique sur "Commencer le parcours", une inscription automatique (`GuidedPathEnrollment`) est generee.
   - L'eleve consulte les videos, lit les cours, effectue les exercices interactifs et clique sur "Marquer comme termine" pour valider chaque sequence.
   - Le backend recalcule le taux de progression global (`progress_percentage = (sequences_terminees / total_sequences) * 100`).
   - A 100%, le parcours est marque comme termine et les recompenses XP sont attribuees.

---

# 2. Matrice Detaillee des Dashboards par Role

Voici ce que chaque role voit et peut faire sur sa section dediee :

## 2.1. Role Administrateur (Admin)
- **Emplacement** : `/dashboard/admin/content/guided-paths`
- **Metriques cles affichees en haut de page** :
  - Nombre total de parcours actifs
  - Nombre total d'eleves inscrits
  - Taux moyen de completion global (%)
  - Total des points XP distribuables
- **Outils de gestion** :
  - Moteur de recherche instantane par titre ou objectif.
  - Filtre par niveau scolaire (ex: 6eme, 3eme, Terminale).
  - Bouton "Nouveau Parcours" ouvrant le `GuidedPathForm`.
  - Actions sur chaque carte : "Editer", "Supprimer", "Reordonner les sequences".
  - Onglet de moderation des soumissions professeurs : boutons "Approuver" et "Refuser avec motif".

## 2.2. Role Enseignant (Teacher)
- **Emplacement** : `/dashboard/teacher/guided-paths`
- **Ce qu'il voit** :
  - Liste de ses propres parcours crees (un professeur ne peut pas modifier les parcours des autres).
  - Badges de statut :
    - *Brouillon* (non soumis)
    - *En attente de validation* (soumis a l'admin)
    - *Approuve / Publie* (visible par les eleves)
    - *Refuse* (avec affichage du message de correction de l'admin)
  - Bouton "Nouveau Parcours" avec le formulaire de creation complet.
  - Bouton "Soumettre pour validation" des que le parcours contient au moins une situation et une sequence.

## 2.3. Role Eleve (Student)
- **Emplacement** : `/dashboard/student/guided-paths` et `/dashboard/student/guided-paths/[id]/structured`
- **Ce qu'il voit** :
  - Grille des parcours adaptes a son niveau d'etude officiel.
  - Filtres par matiere / objectif.
  - Cartes avec barre de progression personnalisee (0% a 100%), duree estimee et gain de points XP.
  - Lecteur plein ecran immersif :
    - Volet lateral pliable : Arborescence des situations et lecons avec puces d'etat (Verte si validee, Doree si en cours, Grise si a venir).
    - Section de presentation : Video introductive, PDF de cadrage, liste des manuels recommandes.
    - Zone principale : Titre de la sequence, objectifs pedagogiques, cartes cliquables pour chaque activite (videos Cloudflare, lecteur PDF integre, exercices interactifs, devoirs a rendre, examen chronometre).
    - Bouton "Marquer comme termine" pour valider la sequence.

## 2.4. Role Parent
- **Emplacement** : `/dashboard/parent/suivi`
- **Ce qu'il voit** :
  - Selecteur d'enfant (si plusieurs enfants rattachés au compte famille).
  - Liste des parcours dans lesquels l'enfant selectionne est inscrit.
  - Pourcentage d'avancement de chaque parcours.
  - Derniere sequence validee et date de completion.
  - Devoirs maison a rendre avec indicateur de date limite.

## 2.5. Role Super Client / Etablissement
- **Emplacement** : `/dashboard/super_client/guided-paths`
- **Ce qu'il voit** :
  - Vue catalogue transversal multi-pays (Benin, Cote d'Ivoire, Senegal, etc.).
  - Selecteur de pays et de niveau scolaire sans restriction.
  - Possibilite de consulter et d'auditer l'integralite du contenu pedagogique de chaque parcours sans bloquage de progression.

---

# 3. Backend Django : Modeles, Logique Metier et API

## 3.1. Modeles de donnees (models.py)

Fichier : `backend/guided_paths/models.py`

```python
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone

class UUIDTimestampedModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class GuidedPath(UUIDTimestampedModel):
    class ApprovalStatus(models.TextChoices):
        APPROVED = 'approved', 'Approuve'
        PENDING  = 'pending',  'En attente de validation admin'
        REJECTED = 'rejected', 'Refuse'

    title = models.CharField(max_length=255)
    description = models.TextField()
    objective = models.CharField(max_length=255, help_text="Objectif clair (ex: Reussir le BEPC)")
    grade_level = models.ForeignKey("academics.GradeLevel", on_delete=models.SET_NULL, null=True, related_name="guided_paths")
    country = models.CharField(max_length=2, default='BJ')
    estimated_duration_hours = models.PositiveIntegerField(default=0)
    xp_reward = models.PositiveIntegerField(default=500)
    thumbnail_url = models.URLField(blank=True)
    is_published = models.BooleanField(default=False)
    lesson_label = models.CharField(max_length=50, default='Sequence', help_text="Ex: Sequence, Lecon, Etape")

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='authored_paths')
    approval_status = models.CharField(max_length=20, choices=ApprovalStatus.choices, default=ApprovalStatus.APPROVED)
    approval_note = models.TextField(blank=True)

    presentation_video = models.ForeignKey("content.Lesson", on_delete=models.SET_NULL, null=True, blank=True, related_name="presentation_for_paths")
    presentation_pdf = models.ForeignKey("library.LibraryBook", on_delete=models.SET_NULL, null=True, blank=True, related_name="pdf_presentation_for_paths")
    associated_books = models.ManyToManyField("library.LibraryBook", blank=True, related_name="associated_to_paths")
    final_mock_exam = models.ForeignKey("assessments.MockExam", on_delete=models.SET_NULL, null=True, blank=True, related_name="final_for_paths")

    class Meta:
        db_table = 'guided_paths'
        ordering = ['-created_at']

    def __str__(self):
        return self.title


class GuidedPathSituation(UUIDTimestampedModel):
    path = models.ForeignKey(GuidedPath, on_delete=models.CASCADE, related_name='situations')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'guided_path_situations'
        ordering = ['order']


class GuidedPathStructuredLesson(UUIDTimestampedModel):
    situation = models.ForeignKey(GuidedPathSituation, on_delete=models.CASCADE, related_name='structured_lessons')
    title = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)
    objectives = models.TextField(blank=True, help_text="Format HTML ou Markdown")

    videos = models.ManyToManyField("content.Lesson", through="GuidedPathStructuredLessonVideo", related_name="curriculum_videos", blank=True)
    pdf_supports = models.ManyToManyField("library.LibraryBook", through="GuidedPathStructuredLessonPDF", related_name="curriculum_pdf_supports", blank=True)
    summary_sheet = models.ForeignKey("library.LibraryBook", on_delete=models.SET_NULL, null=True, blank=True, related_name="curriculum_summary_sheets")
    interactive_exercises = models.ManyToManyField("assessments.Exercise", through="GuidedPathStructuredLessonExercise", related_name="curriculum_exercises_m2m", blank=True)
    homework_assignment = models.ForeignKey("assessments.Assignment", on_delete=models.SET_NULL, null=True, blank=True, related_name="curriculum_homeworks")
    homework_deadline_days = models.PositiveIntegerField(null=True, blank=True)
    mock_exam = models.ForeignKey("assessments.MockExam", on_delete=models.SET_NULL, null=True, blank=True, related_name="lesson_mock_exams")

    class Meta:
        db_table = 'guided_path_structured_lessons'
        ordering = ['order']


# Tables M2M ordonnees
class GuidedPathStructuredLessonVideo(UUIDTimestampedModel):
    lesson = models.ForeignKey(GuidedPathStructuredLesson, on_delete=models.CASCADE)
    video = models.ForeignKey("content.Lesson", on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=0)
    class Meta:
        db_table = 'guided_path_structured_lesson_videos'
        ordering = ['order']
        unique_together = ('lesson', 'video')

class GuidedPathStructuredLessonPDF(UUIDTimestampedModel):
    lesson = models.ForeignKey(GuidedPathStructuredLesson, on_delete=models.CASCADE)
    pdf = models.ForeignKey("library.LibraryBook", on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=0)
    class Meta:
        db_table = 'guided_path_structured_lesson_pdfs'
        ordering = ['order']
        unique_together = ('lesson', 'pdf')

class GuidedPathStructuredLessonExercise(UUIDTimestampedModel):
    lesson = models.ForeignKey(GuidedPathStructuredLesson, on_delete=models.CASCADE)
    exercise = models.ForeignKey("assessments.Exercise", on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=0)
    class Meta:
        db_table = 'guided_path_structured_lesson_exercises'
        ordering = ['order']
        unique_together = ('lesson', 'exercise')


# Suivi Progression
class GuidedPathEnrollment(UUIDTimestampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="path_enrollments")
    path = models.ForeignKey(GuidedPath, on_delete=models.CASCADE, related_name="enrollments")
    progress_percentage = models.FloatField(default=0.0)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'guided_path_enrollments'
        unique_together = ('user', 'path')


class StructuredLessonProgress(UUIDTimestampedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    lesson = models.ForeignKey(GuidedPathStructuredLesson, on_delete=models.CASCADE, related_name="user_progress")
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'guided_path_structured_lesson_progress'
        unique_together = ('user', 'lesson')
```

---

## 3.2. Services de progression (services.py)

Fichier : `backend/guided_paths/services.py`

```python
from django.db import transaction
from django.utils import timezone
from .models import GuidedPath, GuidedPathEnrollment, GuidedPathStructuredLesson, StructuredLessonProgress

@transaction.atomic
def enroll_in_path(user, path: GuidedPath) -> GuidedPathEnrollment:
    enrollment, _ = GuidedPathEnrollment.objects.get_or_create(user=user, path=path)
    return enrollment

@transaction.atomic
def recalculate_path_progress(user, path: GuidedPath):
    total_lessons = GuidedPathStructuredLesson.objects.filter(situation__path=path).count()
    if total_lessons == 0:
        return

    completed_lessons = StructuredLessonProgress.objects.filter(
        user=user,
        lesson__situation__path=path,
        is_completed=True
    ).count()

    percentage = round((completed_lessons / total_lessons) * 100, 2)
    enrollment, _ = GuidedPathEnrollment.objects.get_or_create(user=user, path=path)
    enrollment.progress_percentage = percentage

    if percentage >= 100 and not enrollment.is_completed:
        enrollment.is_completed = True
        enrollment.completed_at = timezone.now()
        
    enrollment.save()
```

---

## 3.3. Serialiseurs DRF (serializers.py)

Fichier : `backend/guided_paths/serializers.py`

```python
from rest_framework import serializers
from django.db import transaction
from .models import (
    GuidedPath, GuidedPathSituation, GuidedPathStructuredLesson,
    GuidedPathStructuredLessonVideo, GuidedPathStructuredLessonPDF,
    GuidedPathStructuredLessonExercise, GuidedPathEnrollment, StructuredLessonProgress
)

class AdminGuidedPathStructuredLessonSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False, allow_null=True)
    video_ids = serializers.ListField(child=serializers.UUIDField(), required=False, allow_empty=True)
    pdf_ids = serializers.ListField(child=serializers.UUIDField(), required=False, allow_empty=True)
    exercise_ids = serializers.ListField(child=serializers.UUIDField(), required=False, allow_empty=True)

    class Meta:
        model = GuidedPathStructuredLesson
        fields = [
            'id', 'title', 'order', 'objectives',
            'video_ids', 'pdf_ids', 'exercise_ids',
            'summary_sheet', 'homework_assignment', 'homework_deadline_days', 'mock_exam'
        ]

class AdminGuidedPathSituationSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(required=False, allow_null=True)
    structured_lessons = AdminGuidedPathStructuredLessonSerializer(many=True, required=False)

    class Meta:
        model = GuidedPathSituation
        fields = ['id', 'title', 'description', 'order', 'structured_lessons']

class AdminGuidedPathSerializer(serializers.ModelSerializer):
    situations = AdminGuidedPathSituationSerializer(many=True, required=False)
    enrollments_count = serializers.IntegerField(source='enrollments.count', read_only=True)
    completion_rate = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = GuidedPath
        fields = [
            'id', 'title', 'description', 'objective', 'country', 'grade_level',
            'estimated_duration_hours', 'xp_reward', 'thumbnail_url',
            'is_published', 'lesson_label', 'approval_status', 'approval_note',
            'presentation_video', 'presentation_pdf', 'associated_books',
            'final_mock_exam', 'situations', 'enrollments_count', 'completion_rate', 'created_by_name'
        ]

    def get_completion_rate(self, obj):
        total = obj.enrollments.count()
        if total == 0:
            return 0
        completed = obj.enrollments.filter(is_completed=True).count()
        return round((completed / total) * 100, 1)

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip() or obj.created_by.email
        return None

    @transaction.atomic
    def create(self, validated_data):
        situations_data = validated_data.pop('situations', [])
        associated_books = validated_data.pop('associated_books', [])
        path = GuidedPath.objects.create(**validated_data)
        if associated_books:
            path.associated_books.set(associated_books)

        for sit_data in situations_data:
            lessons_data = sit_data.pop('structured_lessons', [])
            situation = GuidedPathSituation.objects.create(path=path, **sit_data)
            for les_data in lessons_data:
                video_ids = les_data.pop('video_ids', [])
                pdf_ids = les_data.pop('pdf_ids', [])
                exercise_ids = les_data.pop('exercise_ids', [])
                lesson = GuidedPathStructuredLesson.objects.create(situation=situation, **les_data)
                
                for i, vid in enumerate(video_ids):
                    GuidedPathStructuredLessonVideo.objects.create(lesson=lesson, video_id=vid, order=i)
                for i, pid in enumerate(pdf_ids):
                    GuidedPathStructuredLessonPDF.objects.create(lesson=lesson, pdf_id=pid, order=i)
                for i, eid in enumerate(exercise_ids):
                    GuidedPathStructuredLessonExercise.objects.create(lesson=lesson, exercise_id=eid, order=i)
        return path
```

---

## 3.4. Vues API (api_views.py)

Fichier : `backend/guided_paths/api_views.py`

```python
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import GuidedPath, GuidedPathStructuredLesson, StructuredLessonProgress
from .serializers import AdminGuidedPathSerializer, GuidedPathSerializer, GuidedPathListSerializer
from .services import enroll_in_path, recalculate_path_progress

class IsTeacher(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and hasattr(request.user, 'teacher_profile')

class TeacherGuidedPathViewSet(viewsets.ModelViewSet):
    """Espace Professeur : CRUD de ses propres parcours (soumission a modération)."""
    serializer_class = AdminGuidedPathSerializer
    permission_classes = [IsTeacher]

    def get_queryset(self):
        return GuidedPath.objects.filter(created_by=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            approval_status=GuidedPath.ApprovalStatus.PENDING,
            is_published=False
        )

    @action(detail=True, methods=['post'], url_path='submit-for-review')
    def submit_for_review(self, request, pk=None):
        path = self.get_object()
        path.approval_status = GuidedPath.ApprovalStatus.PENDING
        path.save()
        return Response({'status': 'submitted', 'approval_status': path.approval_status})


class AdminGuidedPathViewSet(viewsets.ModelViewSet):
    """Espace Administrateur : Gestion globale, validation et rejet des parcours."""
    queryset = GuidedPath.objects.all().order_by('-created_at')
    serializer_class = AdminGuidedPathSerializer
    permission_classes = [permissions.IsAdminUser]

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            approval_status=GuidedPath.ApprovalStatus.APPROVED
        )

    @action(detail=True, methods=['post'], url_path='approve')
    def approve(self, request, pk=None):
        path = self.get_object()
        path.approval_status = GuidedPath.ApprovalStatus.APPROVED
        path.approval_note = request.data.get('note', '')
        path.is_published = True
        path.save()
        return Response({'status': 'approved', 'is_published': True})

    @action(detail=True, methods=['post'], url_path='reject')
    def reject(self, request, pk=None):
        note = request.data.get('note')
        if not note:
            return Response({'error': 'Une note explicative est requise.'}, status=400)
        path = self.get_object()
        path.approval_status = GuidedPath.ApprovalStatus.REJECTED
        path.approval_note = note
        path.is_published = False
        path.save()
        return Response({'status': 'rejected', 'note': note})


class GuidedPathViewSet(viewsets.ReadOnlyModelViewSet):
    """Espace Eleve : Consultation et progression."""
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'list':
            return GuidedPathListSerializer
        return GuidedPathSerializer

    def get_queryset(self):
        qs = GuidedPath.objects.filter(is_published=True, approval_status=GuidedPath.ApprovalStatus.APPROVED)
        user = self.request.user
        if hasattr(user, 'student_profile') and user.student_profile.grade_level:
            qs = qs.filter(grade_level=user.student_profile.grade_level)
        return qs

    @action(detail=True, methods=['post'], url_path='enroll')
    def enroll(self, request, pk=None):
        path = self.get_object()
        enrollment = enroll_in_path(request.user, path)
        return Response({'status': 'enrolled', 'progress': enrollment.progress_percentage})

    @action(detail=False, methods=['post'], url_path='complete-structured-lesson/(?P<lesson_id>[^/.]+)')
    def complete_structured_lesson(self, request, lesson_id=None):
        lesson = get_object_or_404(GuidedPathStructuredLesson, id=lesson_id)
        StructuredLessonProgress.objects.get_or_create(user=request.user, lesson=lesson, defaults={'is_completed': True})
        recalculate_path_progress(request.user, lesson.situation.path)
        return Response({'status': 'completed'})
```

---

## 3.5. Routage (urls.py)

```python
# backend/lahaacademia/urls.py
urlpatterns = [
    path('api/v1/guided-paths/', include('guided_paths.urls')),
    path('api/v1/teacher/guided-paths/', include('guided_paths.teacher_urls')),
    path('api/v1/admin/guided-paths/', include('guided_paths.admin_urls')),
]
```

---

# 4. Frontend Next.js : Composants de Creation et de Consultation

## 4.1. Formulaire de Creation/Edition Admin et Prof (GuidedPathForm.tsx)

Fichier : `frontend/components/admin/GuidedPathForm.tsx`

Permet a l'Admin et au Professeur de configurer :
- Titre, description, objectif, niveau scolaire, pays, XP et duree.
- Video et PDF d'introduction + Livres associes.
- Construction des Situations et sous-sequences avec selection modale des ressources (videos Cloudflare, PDFs, exercices, devoirs, examens).

```tsx
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Video, FileText, Zap, BookOpen, Timer } from "lucide-react"

interface GuidedPathFormProps {
  initialData?: any
  onSubmit: (data: any) => void
  loading?: boolean
}

export function GuidedPathForm({ initialData, onSubmit, loading }: GuidedPathFormProps) {
  const [title, setTitle] = useState(initialData?.title || "")
  const [objective, setObjective] = useState(initialData?.objective || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [gradeLevel, setGradeLevel] = useState(initialData?.grade_level || "")
  const [estimatedHours, setEstimatedHours] = useState(initialData?.estimated_duration_hours || 10)
  const [xpReward, setXpReward] = useState(initialData?.xp_reward || 500)
  const [lessonLabel, setLessonLabel] = useState(initialData?.lesson_label || "Sequence")
  const [isPublished, setIsPublished] = useState(initialData?.is_published || false)

  const [situations, setSituations] = useState<any[]>(initialData?.situations || [
    { title: "Situation 1", description: "", structured_lessons: [{ title: "Sequence 1", objectives: "", video_ids: [], pdf_ids: [], exercise_ids: [] }] }
  ])

  const addSituation = () => {
    setSituations(prev => [
      ...prev,
      { title: `Situation ${prev.length + 1}`, description: "", structured_lessons: [{ title: "Sequence 1", objectives: "", video_ids: [], pdf_ids: [], exercise_ids: [] }] }
    ])
  }

  const addLesson = (situationIdx: number) => {
    setSituations(prev => {
      const copy = [...prev]
      copy[situationIdx].structured_lessons.push({
        title: `Sequence ${copy[situationIdx].structured_lessons.length + 1}`,
        objectives: "",
        video_ids: [],
        pdf_ids: [],
        exercise_ids: []
      })
      return copy
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      title,
      objective,
      description,
      grade_level: gradeLevel,
      estimated_duration_hours: Number(estimatedHours),
      xp_reward: Number(xpReward),
      lesson_label: lessonLabel,
      is_published: isPublished,
      situations
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto p-6 bg-card border border-border rounded-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Titre du parcours</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label>Objectif pedagogique</Label>
          <Input value={objective} onChange={(e) => setObjective(e.target.value)} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} required />
      </div>

      {/* Situations Builder */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Situations et Sequences</h3>
          <Button type="button" onClick={addSituation} variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" /> Ajouter une Situation
          </Button>
        </div>

        {situations.map((sit, sIdx) => (
          <div key={sIdx} className="p-6 border border-border rounded-2xl bg-muted/30 space-y-4">
            <Input 
              value={sit.title} 
              onChange={(e) => {
                const copy = [...situations]
                copy[sIdx].title = e.target.value
                setSituations(copy)
              }} 
              placeholder="Titre de la situation"
              className="font-bold text-base"
            />

            <div className="pl-4 border-l-2 border-border space-y-4">
              {sit.structured_lessons.map((les: any, lIdx: number) => (
                <div key={lIdx} className="p-4 bg-background border border-border rounded-xl space-y-2">
                  <Input 
                    value={les.title} 
                    onChange={(e) => {
                      const copy = [...situations]
                      copy[sIdx].structured_lessons[lIdx].title = e.target.value
                      setSituations(copy)
                    }} 
                    placeholder="Titre de la sequence"
                  />
                  <Textarea 
                    value={les.objectives} 
                    onChange={(e) => {
                      const copy = [...situations]
                      copy[sIdx].structured_lessons[lIdx].objectives = e.target.value
                      setSituations(copy)
                    }} 
                    placeholder="Objectifs de la sequence (HTML ou texte)"
                    rows={2}
                  />
                </div>
              ))}
              <Button type="button" onClick={() => addLesson(sIdx)} variant="ghost" size="sm">
                <Plus className="mr-1 h-3 w-3" /> Ajouter une sequence
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button type="submit" disabled={loading} className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-black font-bold text-sm uppercase tracking-widest">
        {loading ? "Enregistrement..." : "Enregistrer le parcours"}
      </Button>
    </form>
  )
}
```

---

## 4.2. Carte de Parcours (GuidedPathCard.tsx)
Voir la section 2.1 du guide pour le code complet de la carte avec barre de progression animee (Framer Motion).

## 4.3. Carte d'Activite Modulaire (LessonCard.tsx)
Voir la section 2.2 pour le composant d'affichage des medias (video, pdf, exercices, devoirs, examens).

## 4.4. Lecteur de Parcours Structure (structured/page.tsx)
Voir la section 2.4 pour l'interface complete de lecture avec volet lateral repliable et indicateurs d'etat.

---

# 5. Systeme de Guide d'Utilisation Integre (GuideViewer.tsx)

Fichier : `frontend/components/ui/guide-viewer.tsx`

Ce composant est concu pour fournir a chaque role (`student`, `teacher`, `parent`, `admin`) une documentation vivante directement integree dans leur interface :
- **Table des matieres interactive** : Navigation par categories et articles.
- **Support des medias** : Integration de videos explicatives Cloudflare et d'images.
- **Rendu riche du contenu** : Prise en charge des contenus HTML Tiptap et Markdown avec styling adapte.

```tsx
"use client"

import { useState, useEffect } from "react"
import { Search, ChevronDown, BookOpen, Play, List } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface GuideArticle {
  id: number
  title: string
  content: string
  content_type: "html" | "markdown"
  video_url: string | null
  order: number
}

interface GuideCategory {
  id: number
  title: string
  articles: GuideArticle[]
}

export function GuideViewer({ role, roleTitle }: { role: string; roleTitle: string }) {
  const [categories, setCategories] = useState<GuideCategory[]>([])
  const [activeArticleId, setActiveArticleId] = useState<number | null>(null)
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch(`/api/v1/guides/?role=${role}`)
      .then(res => res.json())
      .then(data => {
        setCategories(data)
        if (data.length > 0 && data[0].articles.length > 0) {
          setActiveArticleId(data[0].articles[0].id)
        }
      })
      .catch(console.error)
  }, [role])

  const allArticles = categories.flatMap(c => c.articles)
  const activeArticle = allArticles.find(a => a.id === activeArticleId)

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[80vh] p-6 max-w-7xl mx-auto">
      {/* Sommaire lateral */}
      <aside className="w-full lg:w-72 space-y-4">
        <h2 className="text-lg font-black uppercase text-amber-500">Guide {roleTitle}</h2>
        <nav className="space-y-4">
          {categories.map(cat => (
            <div key={cat.id} className="space-y-1">
              <p className="text-xs font-bold text-muted-foreground uppercase">{cat.title}</p>
              <ul className="space-y-1 pl-2">
                {cat.articles.map(art => (
                  <li key={art.id}>
                    <button
                      onClick={() => setActiveArticleId(art.id)}
                      className={`text-left text-sm w-full p-2 rounded-lg transition-colors ${
                        activeArticleId === art.id ? "bg-amber-500/10 text-amber-500 font-bold" : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {art.title}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Contenu de l'article actif */}
      <main className="flex-1 bg-card border border-border p-8 rounded-3xl shadow-sm">
        {activeArticle ? (
          <article className="space-y-6">
            <h1 className="text-3xl font-black">{activeArticle.title}</h1>
            {activeArticle.video_url && (
              <div className="aspect-video bg-black rounded-2xl overflow-hidden">
                <video src={activeArticle.video_url} controls className="w-full h-full object-cover" />
              </div>
            )}
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeArticle.content}</ReactMarkdown>
            </div>
          </article>
        ) : (
          <p className="text-muted-foreground">Selectionnez un article dans le sommaire.</p>
        )}
      </main>
    </div>
  )
}
```

---

# 6. Systeme de Contact Support (Sidebar et Navigation Mobile)

## 6.1. Modale de Contact (ContactSupportDialog.tsx)

Fichier : `frontend/components/ui/contact-support-dialog.tsx`

Modale bi-mode proposant le choix entre email et WhatsApp/telephone, avec envoi direct au backend Django.

```tsx
import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Mail, Phone, ArrowLeft, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export function ContactSupportDialog({ open, onOpenChange, user }: { open: boolean; onOpenChange: (o: boolean) => void; user?: any }) {
  const [mode, setMode] = useState<'options' | 'form'>('options')
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setMode('options')
      setSubject("")
      setMessage("")
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!subject.trim() || !message.trim()) {
      toast.error("Veuillez remplir tous les champs")
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/v1/communications/contact/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : 'Utilisateur',
          email: user?.email || 'contact@utilisateur.com',
          subject,
          message
        })
      })
      if (res.ok) {
        toast.success("Message envoye avec succes !")
        onOpenChange(false)
      } else {
        toast.error("Erreur lors de l'envoi du message.")
      }
    } catch {
      toast.error("Erreur de connexion.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {mode === 'options' ? (
          <>
            <DialogHeader>
              <DialogTitle>Nous contacter</DialogTitle>
              <DialogDescription>Besoin d'aide ? Choisissez un canal de contact.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <button onClick={() => setMode('form')} className="flex items-center p-3 rounded-2xl border w-full hover:bg-muted/50 transition-colors">
                <div className="bg-primary/10 p-2.5 rounded-xl mr-3"><Mail className="h-5 w-5 text-primary" /></div>
                <div className="text-left"><p className="font-semibold text-sm">Par email</p><p className="text-xs text-muted-foreground">Formulaire d'assistance</p></div>
              </button>
              <div className="flex items-center p-3 rounded-2xl border w-full">
                <div className="bg-amber-500/10 p-2.5 rounded-xl mr-3"><Phone className="h-5 w-5 text-amber-500" /></div>
                <div className="text-left"><p className="font-semibold text-sm">WhatsApp / Telephone</p><p className="text-xs text-muted-foreground select-all">+229 01 00 00 00 00</p></div>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="flex flex-row items-center space-x-2 space-y-0">
              <Button variant="ghost" size="icon" className="h-8 w-8 mr-2 -ml-2" onClick={() => setMode('options')}><ArrowLeft className="h-4 w-4" /></Button>
              <div><DialogTitle>Envoyer un message</DialogTitle><DialogDescription>Decrivez votre demande</DialogDescription></div>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <Input placeholder="Sujet" value={subject} onChange={(e) => setSubject(e.target.value)} required />
              <Textarea placeholder="Votre message..." value={message} onChange={(e) => setMessage(e.target.value)} rows={4} required />
              <Button type="submit" disabled={loading} className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold">
                {loading ? "Envoi..." : "Envoyer"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

---

## 6.2. Decouplage par CustomEvent

- **Dans la Sidebar principale** :
```tsx
useEffect(() => {
  const handleOpen = () => setIsContactOpen(true)
  window.addEventListener('app-open-contact', handleOpen)
  return () => window.removeEventListener('app-open-contact', handleOpen)
}, [])
```

- **Dans n'importe quel composant (ex: BottomNav Mobile)** :
```tsx
const openContactModal = () => {
  window.dispatchEvent(new CustomEvent('app-open-contact'))
}
```

---

## 6.3. Endpoint Backend d'Envoi d'Email

Fichier : `backend/communications/views.py`

```python
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.core.mail import send_mail
from django.conf import settings

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def submit_contact_view(request):
    name = request.data.get('name')
    email = request.data.get('email')
    subject = request.data.get('subject')
    message = request.data.get('message')

    if not all([name, email, subject, message]):
        return Response({'error': 'Tous les champs sont obligatoires.'}, status=400)

    html_body = f"""
    <h3>Nouveau message de contact</h3>
    <p><strong>Nom :</strong> {name}</p>
    <p><strong>Email :</strong> {email}</p>
    <p><strong>Sujet :</strong> {subject}</p>
    <hr />
    <p>{message}</p>
    """

    try:
        send_mail(
            subject=f"[Support] {subject}",
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'contact@votreprojet.com',
            recipient_list=["support@votreprojet.com"],
            html_message=html_body,
            fail_silently=False
        )
        return Response({'status': 'success', 'message': 'Message envoye avec succes.'}, status=200)
    except Exception as e:
        return Response({'error': str(e)}, status=500)
```
