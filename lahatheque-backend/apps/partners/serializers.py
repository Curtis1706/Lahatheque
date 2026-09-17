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
        fields = ['id', 'name', 'code', 'short_name', 'country', 'domain_name', 'institution_type', 'royalty_rate', 'is_active', 'faculties', 'students_count']

    def get_students_count(self, obj) -> int:
        if hasattr(obj, 'student_affiliations'):
            return obj.student_affiliations.filter(status='approved').count()
        return 0


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


class BouquetOfferingSerializer(serializers.ModelSerializer):
    books_count = serializers.ReadOnlyField()
    monthly_price = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    annual_price = serializers.DecimalField(max_digits=12, decimal_places=2, required=True)
    target_institution_name = serializers.ReadOnlyField(source='target_institution.name', default=None)

    class Meta:
        from .models import BouquetOffering
        model = BouquetOffering
        fields = [
            'id', 'title', 'bouquet_type', 'discipline', 'faculty_code',
            'target_institution', 'target_institution_name', 'country',
            'books_count', 'monthly_price', 'annual_price', 'currency',
            'description', 'is_active', 'created_at', 'updated_at'
        ]

    def validate(self, attrs):
        bouquet_type = attrs.get('bouquet_type', getattr(self.instance, 'bouquet_type', None))
        target_inst = attrs.get('target_institution', getattr(self.instance, 'target_institution', None))
        if bouquet_type == 'university' and not target_inst:
            raise serializers.ValidationError({
                'target_institution': "La sélection d'une université partenaire est obligatoire pour le type « Intégral Université »."
            })
        if bouquet_type == 'faculty':
            raise serializers.ValidationError({
                'bouquet_type': "Le type « Par Faculté » est obsolète et a été retiré. Veuillez utiliser « Intégral Université » ou « Par Discipline »."
            })
        m_price = attrs.get('monthly_price')
        if m_price is not None and m_price < 0:
            raise serializers.ValidationError({'monthly_price': "Le tarif mensuel ne peut pas être négatif."})
        a_price = attrs.get('annual_price')
        if a_price is not None and a_price < 0:
            raise serializers.ValidationError({'annual_price': "Le tarif annuel ne peut pas être négatif."})
        return attrs
