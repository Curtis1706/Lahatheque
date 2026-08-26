"""Sérialiseurs pour l'Espace Client Lecteur / Étudiant."""
from rest_framework import serializers
from apps.catalog.models import Ouvrage, BookAuthor
from apps.commerce.models import Order, LigneCommande, PhysicalDelivery
from apps.partners.models import StudentAffiliation, UniversityBouquetSubscription, Institution
from .models import ReadingProgress, ReadingSession


class AuthorNameSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = BookAuthor
        fields = ['id', 'first_name', 'last_name', 'full_name']

    def get_full_name(self, obj) -> str:
        return f"{obj.first_name} {obj.last_name}".strip()


class OuvrageBasicSerializer(serializers.ModelSerializer):
    """Sérialiseur compact d'un ouvrage pour la bibliothèque / catalogue student."""
    authors = AuthorNameSerializer(many=True, read_only=True)
    discipline_name = serializers.CharField(source='discipline.name', read_only=True, default='')
    publisher_name = serializers.CharField(source='publisher.name', read_only=True, default='')
    institution_name = serializers.CharField(source='institution.name', read_only=True, default='')
    cover_url = serializers.SerializerMethodField()
    is_owned = serializers.SerializerMethodField()
    has_digital_access = serializers.SerializerMethodField()
    author_discounted_digital_price = serializers.SerializerMethodField()
    author_discounted_paper_price = serializers.SerializerMethodField()

    class Meta:
        model = Ouvrage
        fields = [
            'id', 'isbn', 'title', 'subtitle', 'authors',
            'discipline_name', 'publisher_name', 'institution_name',
            'country', 'format_type', 'page_count', 'publication_date',
            'language', 'summary', 'status', 'price_digital', 'price_paper',
            'is_paper_available', 'cover_url', 'is_owned', 'has_digital_access',
            'author_discounted_digital_price', 'author_discounted_paper_price',
        ]

    def get_cover_url(self, obj) -> str:
        return obj.cover_url or ''

    def get_is_owned(self, obj) -> bool:
        request = self.context.get('request')
        if request and request.user and request.user.is_authenticated:
            return ReadingProgress.objects.filter(user=request.user, ouvrage=obj).exists()
        return False

    def get_has_digital_access(self, obj) -> bool:
        return self.get_is_owned(obj)

    def get_author_discounted_digital_price(self, obj):
        request = self.context.get('request')
        if request and getattr(request.user, 'role', None) == 'author':
            from apps.reporting.pricing_service import compute_role_price
            return compute_role_price(obj, "author")["digital_price"]
        return None

    def get_author_discounted_paper_price(self, obj):
        request = self.context.get('request')
        if request and getattr(request.user, 'role', None) == 'author':
            from apps.reporting.pricing_service import compute_role_price
            return compute_role_price(obj, "author")["paper_price"]
        return None


class ReadingProgressSerializer(serializers.ModelSerializer):
    ouvrage = OuvrageBasicSerializer(read_only=True)
    ouvrage_id = serializers.UUIDField(write_only=True)

    class Meta:
        model = ReadingProgress
        fields = [
            'id', 'ouvrage', 'ouvrage_id',
            'progress_percent', 'current_page', 'total_pages',
            'last_read_chapter', 'last_read_at', 'is_completed', 'is_favorite',
        ]
        read_only_fields = ['id', 'last_read_at']

    def validate_ouvrage_id(self, value):
        try:
            Ouvrage.objects.get(id=value)
        except Ouvrage.DoesNotExist:
            raise serializers.ValidationError("Ouvrage introuvable.")
        return value


class UpdateReadingProgressSerializer(serializers.Serializer):
    ouvrage_id = serializers.UUIDField()
    progress_percent = serializers.IntegerField(min_value=0, max_value=100)
    current_page = serializers.IntegerField(min_value=0, required=False, default=0)
    total_pages = serializers.IntegerField(min_value=0, required=False, default=0)
    last_read_chapter = serializers.CharField(required=False, allow_blank=True, default='')
    duration_seconds = serializers.IntegerField(min_value=0, required=False, default=0)
    pages_read = serializers.IntegerField(min_value=0, required=False, default=0)


class PhysicalDeliverySerializer(serializers.ModelSerializer):
    statut_display = serializers.SerializerMethodField()

    class Meta:
        model = PhysicalDelivery
        fields = [
            'id', 'shipping_address', 'city', 'country',
            'tracking_number', 'carrier_name', 'statut', 'statut_display', 'updated_at'
        ]

    def get_statut_display(self, obj) -> str:
        mapping = {
            'en_preparation': 'En préparation',
            'expedie': 'Expédié',
            'livre': 'Livré',
        }
        return mapping.get(obj.statut, obj.statut)


class LigneCommandeStudentSerializer(serializers.ModelSerializer):
    ouvrage_title = serializers.CharField(source='ouvrage.title', read_only=True)
    ouvrage_cover_url = serializers.SerializerMethodField()
    format_display = serializers.SerializerMethodField()
    discipline_name = serializers.SerializerMethodField()
    author_name = serializers.SerializerMethodField()

    class Meta:
        model = LigneCommande
        fields = [
            'id', 'ouvrage', 'ouvrage_title', 'ouvrage_cover_url',
            'discipline_name', 'author_name',
            'format_type', 'format_display', 'unit_price', 'quantity'
        ]

    def get_ouvrage_cover_url(self, obj) -> str:
        return obj.ouvrage.cover_url or '' if obj.ouvrage else ''

    def get_format_display(self, obj) -> str:
        return 'Numérique (EPUB/PDF)' if obj.format_type == 'digital' else 'Livre Papier'

    def get_discipline_name(self, obj) -> str:
        if obj.ouvrage and getattr(obj.ouvrage, 'discipline', None):
            return obj.ouvrage.discipline.name or ''
        return ''

    def get_author_name(self, obj) -> str:
        if not obj.ouvrage:
            return ''
        if hasattr(obj.ouvrage, 'authors'):
            authors = obj.ouvrage.authors.all()
            if authors.exists():
                return ', '.join([f"{a.first_name} {a.last_name}".strip() or a.full_name for a in authors])
        return getattr(obj.ouvrage, 'auteur', '') or ''


class OrderStudentSerializer(serializers.ModelSerializer):
    lignes = LigneCommandeStudentSerializer(many=True, read_only=True)
    livraison = PhysicalDeliverySerializer(read_only=True)
    statut_paiement_display = serializers.SerializerMethodField()
    statut_commande_display = serializers.SerializerMethodField()
    mode_paiement_display = serializers.SerializerMethodField()
    type_commande_display = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id', 'total_amount', 'currency',
            'statut_paiement', 'statut_paiement_display',
            'statut_commande', 'statut_commande_display',
            'mode_paiement', 'mode_paiement_display',
            'type_commande', 'type_commande_display',
            'is_credit_purchase', 'credit_due_date',
            'returned_at', 'return_reason',
            'lignes', 'livraison', 'created_at', 'updated_at',
        ]

    def get_statut_paiement_display(self, obj) -> str:
        mapping = {
            'pending': 'En attente de paiement',
            'paid': 'Payé',
            'failed': 'Échoué',
            'refunded': 'Remboursé',
        }
        return mapping.get(obj.statut_paiement, obj.statut_paiement)

    def get_statut_commande_display(self, obj) -> str:
        mapping = {
            'pending': 'En attente',
            'processing': 'En traitement',
            'completed': 'Terminée',
            'cancelled': 'Annulée',
            'returned': 'Retournée',
        }
        return mapping.get(obj.statut_commande, obj.statut_commande)

    def get_mode_paiement_display(self, obj) -> str:
        mapping = {
            'mobile_money': 'Mobile Money',
            'virement': 'Virement bancaire',
            'especes': 'Espèces',
            'carte': 'Carte bancaire',
        }
        return mapping.get(obj.mode_paiement, obj.mode_paiement or 'Mobile Money')

    def get_type_commande_display(self, obj) -> str:
        mapping = {
            'rentree_scolaire': 'Rentrée scolaire',
            'personnel': 'Personnel',
            'institutionnel': 'Institutionnel',
        }
        return mapping.get(obj.type_commande, obj.type_commande or 'Personnel')


class BouquetSerializer(serializers.ModelSerializer):
    class Meta:
        model = UniversityBouquetSubscription
        fields = [
            'id', 'title', 'bouquet_type', 'faculty_code',
            'discipline', 'books_count', 'status', 'start_date', 'end_date',
        ]


class InstitutionBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institution
        fields = ['id', 'name', 'code', 'short_name', 'country', 'city']


class AffiliationStudentSerializer(serializers.ModelSerializer):
    institution_detail = InstitutionBasicSerializer(source='institution', read_only=True)
    status_display = serializers.SerializerMethodField()
    bouquets = serializers.SerializerMethodField()

    class Meta:
        model = StudentAffiliation
        fields = [
            'id', 'institution', 'institution_detail',
            'student_card_number', 'level', 'status', 'status_display',
            'motif_rejet', 'is_validated', 'created_at',
            'bouquets',
        ]

    def get_status_display(self, obj) -> str:
        mapping = {
            'pending': 'En attente de validation',
            'approved': 'Validé — Accès Actif',
            'rejected': 'Rejeté',
            'suspended': 'Suspendu',
            'expired': 'Expiré',
        }
        return mapping.get(obj.status, obj.status)

    def get_bouquets(self, obj):
        if obj.status != 'approved' or not obj.institution:
            return []
        bouquets = UniversityBouquetSubscription.objects.filter(
            institution=obj.institution,
            status='active'
        )
        return BouquetSerializer(bouquets, many=True).data


class CreateAffiliationSerializer(serializers.Serializer):
    institution_id = serializers.UUIDField()
    student_card_number = serializers.CharField(max_length=100)
    level = serializers.CharField(max_length=32, required=False, default='Licence 1')
    carte_etudiant_image = serializers.CharField(required=False, allow_blank=True)
