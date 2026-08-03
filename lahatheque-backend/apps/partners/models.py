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

class StudentAffiliation(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='affiliations')
    institution = models.ForeignKey(Institution, on_delete=models.CASCADE)
    department = models.ForeignKey(Department, on_delete=models.CASCADE, null=True, blank=True)
    student_card_number = models.CharField(max_length=100)
    is_validated = models.BooleanField(default=False)
