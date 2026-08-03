from rest_framework import serializers
from .models import Institution, Faculty, Department, StudentAffiliation

class InstitutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institution
        fields = '__all__'

class StudentAffiliationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAffiliation
        fields = '__all__'
