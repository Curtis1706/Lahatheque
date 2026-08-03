from rest_framework import viewsets
from .models import Institution, StudentAffiliation
from .serializers import InstitutionSerializer, StudentAffiliationSerializer

class InstitutionViewSet(viewsets.ModelViewSet):
    queryset = Institution.objects.all()
    serializer_class = InstitutionSerializer

class StudentAffiliationViewSet(viewsets.ModelViewSet):
    queryset = StudentAffiliation.objects.all()
    serializer_class = StudentAffiliationSerializer
