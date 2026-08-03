from django.contrib import admin
from .models import Publisher, SubmissionDraft, ValidationWorkflowStep
admin.site.register(Publisher)
admin.site.register(SubmissionDraft)
admin.site.register(ValidationWorkflowStep)
