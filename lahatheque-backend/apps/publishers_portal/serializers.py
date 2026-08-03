from rest_framework import serializers
from .models import Publisher, SubmissionDraft, ValidationWorkflowStep

class PublisherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Publisher
        fields = '__all__'

class SubmissionDraftSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubmissionDraft
        fields = '__all__'
