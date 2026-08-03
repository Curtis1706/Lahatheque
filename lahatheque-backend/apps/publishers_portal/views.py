from rest_framework import viewsets
from .models import SubmissionDraft, ValidationWorkflowStep
from .serializers import SubmissionDraftSerializer
from .permissions import IsPublisher

class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = SubmissionDraft.objects.all()
    serializer_class = SubmissionDraftSerializer
    permission_classes = [IsPublisher]
