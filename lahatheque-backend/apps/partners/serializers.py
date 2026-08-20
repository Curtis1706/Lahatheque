from rest_framework import serializers
from django.conf import settings
from .models import Institution, Faculty, Department, StudentAffiliation, EtudiantInscrit

class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = '__all__'

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class InstitutionSerializer(serializers.ModelSerializer):
    faculties = FacultySerializer(many=True, read_only=True)
    students_count = serializers.SerializerMethodField()

    class Meta:
        model = Institution
        fields = ['id', 'name', 'code', 'country', 'domain_name', 'is_active', 'faculties', 'students_count']

    def get_students_count(self, obj) -> int:
        return obj.affiliations.filter(status='approved').count()


class StudentAffiliationSerializer(serializers.ModelSerializer):
    student_email = serializers.ReadOnlyField(source='student.email')
    student_name = serializers.SerializerMethodField()
    institution_name = serializers.ReadOnlyField(source='institution.name')
    carte_image_url = serializers.SerializerMethodField()

    class Meta:
        model = StudentAffiliation
        fields = [
            'id', 'student', 'student_email', 'student_name', 'institution', 
            'institution_name', 'department', 'student_card_number', 
            'carte_etudiant_image', 'carte_image_url', 'status', 
            'motif_rejet', 'is_validated', 'reviewed_by', 'reviewed_at', 'created_at'
        ]
        read_only_fields = ['id', 'status', 'is_validated', 'reviewed_by', 'reviewed_at', 'created_at']

    def get_student_name(self, obj) -> str:
        name = f"{obj.student.first_name} {obj.student.last_name}".strip()
        return name or obj.student.email

    def get_carte_image_url(self, obj) -> str | None:
        if obj.carte_etudiant_image:
            if str(obj.carte_etudiant_image).startswith('http'):
                return str(obj.carte_etudiant_image)
            public_url = getattr(settings, 'CLOUDFLARE_R2_PUBLIC_URL', 'https://pub-98cb000b12874eae9d7deed8a2ead6ee.r2.dev')
            return f"{public_url.rstrip('/')}/{str(obj.carte_etudiant_image).lstrip('/')}"
        return None


class EtudiantInscritSerializer(serializers.ModelSerializer):
    class Meta:
        model = EtudiantInscrit
        fields = '__all__'


class AffiliationClaimSerializer(serializers.Serializer):
    institution_id = serializers.UUIDField()
    matricule = serializers.CharField(max_length=100)
    carte_etudiant_image = serializers.ImageField(required=False, allow_null=True)


class AffiliationReviewSerializer(serializers.Serializer):
    action = serializers.ChoiceField(choices=['approve', 'reject'])
    motif_rejet = serializers.CharField(required=False, allow_blank=True, default='')
