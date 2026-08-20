from rest_framework import viewsets
from .models import PublisherBookDeposit
from .serializers import PublisherBookDepositSerializer
from .permissions import IsPublisher

class SubmissionViewSet(viewsets.ModelViewSet):
    queryset = PublisherBookDeposit.objects.all()
    serializer_class = PublisherBookDepositSerializer
    permission_classes = [IsPublisher]
