"""Modèles institutionnels (Institution, Faculty, Department, StudentAffiliation)."""
import uuid
from django.db import models
from django.conf import settings

class Institution(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50, unique=True)
    country = models.CharField(max_length=2)
    domain_name = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)

class Faculty(models.Model):
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name='faculties')
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=50)

class Department(models.Model):
    faculty = models.ForeignKey(Faculty, on_delete=models.CASCADE, related_name='departments')
    name = models.CharField(max_length=255)

from django.utils import timezone

class StudentAffiliation(models.Model):
    STATUS_CHOICES = (
        ('pending', 'En attente de validation'),
        ('approved', 'Validé'),
        ('rejected', 'Rejeté'),
        ('expired', 'Expiré'),
    )

    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='affiliations')
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, null=True, blank=True)
    student_card_number = models.CharField(max_length=100)
    carte_etudiant_image = models.ImageField(upload_to='justificatifs_scolarite/', null=True, blank=True)
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='pending')
    motif_rejet = models.TextField(blank=True, default='')
    is_validated = models.BooleanField(default=False)
    reviewed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='reviewed_affiliations')
    reviewed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.student.email} - {self.institution.name} ({self.status})"


class EtudiantInscrit(models.Model):
    """
    Liste officielle des étudiants importée par le Bibliothécaire de l'université (CSV/Excel)
    permettant la validation instantanée du statut étudiant lors de la saisie du matricule.
    """
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE, related_name='etudiants_inscrits')
    matricule = models.CharField(max_length=100, db_index=True)
    nom = models.CharField(max_length=150)
    prenom = models.CharField(max_length=150)
    faculte = models.CharField(max_length=150, blank=True, default='')
    filiere = models.CharField(max_length=150, blank=True, default='')
    annee_academique = models.CharField(max_length=20, default='2025-2026')
    is_claimed = models.BooleanField(default=False)
    claimed_by = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL, related_name='claimed_matricules')
    claimed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ('institution', 'matricule')

    def __str__(self):
        return f"{self.matricule} - {self.nom} {self.prenom} ({self.institution.code})"
