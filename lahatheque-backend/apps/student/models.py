"""Modèles de données pour l'Espace Client Lecteur / Étudiant."""
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class ReadingProgress(models.Model):
    """Progression de lecture d'un utilisateur sur un ouvrage donné."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reading_progress'
    )
    ouvrage = models.ForeignKey(
        'catalog.Ouvrage',
        on_delete=models.CASCADE,
        related_name='reading_progress'
    )
    progress_percent = models.IntegerField(default=0)
    current_page = models.IntegerField(default=1)
    total_pages = models.IntegerField(default=0)
    last_read_chapter = models.CharField(max_length=255, blank=True, default='')
    last_read_at = models.DateTimeField(auto_now=True)
    is_completed = models.BooleanField(default=False)
    is_favorite = models.BooleanField(default=False)

    class Meta:
        db_table = 'student_reading_progress'
        unique_together = ('user', 'ouvrage')
        ordering = ['-last_read_at']
        verbose_name = 'Progression de Lecture'
        verbose_name_plural = 'Progressions de Lecture'

    def __str__(self) -> str:
        return f"{self.user.email} - {self.ouvrage.title} ({self.progress_percent}%)"


class ReadingSession(models.Model):
    """Session de lecture individuelle (une plage de temps continue)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reading_sessions'
    )
    ouvrage = models.ForeignKey(
        'catalog.Ouvrage',
        on_delete=models.CASCADE,
        related_name='reading_sessions'
    )
    duration_seconds = models.IntegerField(default=0)
    pages_read = models.IntegerField(default=0)
    session_date = models.DateField(default=timezone.now)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'student_reading_session'
        ordering = ['-session_date', '-created_at']
        verbose_name = 'Session de Lecture'
        verbose_name_plural = 'Sessions de Lecture'

    def __str__(self) -> str:
        mins = self.duration_seconds // 60
        return f"{self.user.email} - {self.ouvrage.title} - {mins}min le {self.session_date}"
