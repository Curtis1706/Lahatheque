from rest_framework import serializers
from .models import AuthorRight, RoyaltyCalculation, RoyaltyPayoutLine, ContratLegal

class AuthorRightSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuthorRight
        fields = '__all__'

    def validate(self, attrs):
        # TODO: Valider que la somme des pool_share_percent = 100.00%
        return attrs

class RoyaltyCalculationSerializer(serializers.ModelSerializer):
    class Meta:
        model = RoyaltyCalculation
        fields = '__all__'


class LegalContractSerializer(serializers.ModelSerializer):
    """
    Sérialiseur haute fidélité pour les contrats légaux avec enrichissement plein texte,
    statut d'indexation OCR et snippets contextuels.
    """
    reference = serializers.CharField(source="numero_contrat", read_only=True)
    title = serializers.CharField(source="titre")
    signed_at = serializers.DateField(source="date_signature", required=False, allow_null=True)
    expires_at = serializers.DateField(source="date_expiration", required=False, allow_null=True)
    snippet_highlight = serializers.SerializerMethodField()
    relevance_rank = serializers.SerializerMethodField()
    extracted_text_preview = serializers.SerializerMethodField()

    class Meta:
        model = ContratLegal
        fields = [
            "id",
            "reference",
            "numero_contrat",
            "title",
            "titre",
            "contracting_party",
            "contracting_party_email",
            "contracting_party_phone",
            "type_contrat",
            "status",
            "indexing_status",
            "ocr_engine_used",
            "ocr_confidence_score",
            "indexed_at",
            "signed_at",
            "expires_at",
            "file_name",
            "file_size",
            "tags",
            "notes",
            "snippet_highlight",
            "relevance_rank",
            "extracted_text_preview",
        ]

    def get_snippet_highlight(self, obj) -> str:
        snippet = getattr(obj, "snippet_highlight", None)
        if snippet:
            return snippet
        search_query = self.context.get("search_query", "")
        if search_query and obj.texte_integral_index:
            from .services.search_service import generate_snippet_highlight
            return generate_snippet_highlight(obj.texte_integral_index, search_query)
        return ""

    def get_relevance_rank(self, obj) -> float:
        rank = getattr(obj, "rank", None)
        return round(float(rank), 3) if rank is not None else 0.0

    def get_extracted_text_preview(self, obj) -> str:
        if obj.texte_integral_index:
            return obj.texte_integral_index[:300].strip()
        return ""


class CourrierOfficielSerializer(serializers.ModelSerializer):
    """
    Sérialiseur complet pour les courriers officiels de redevances et relances.
    Fournit les libellés de statuts, catégories et l'URL de prévisualisation PDF.
    """
    category_label = serializers.CharField(read_only=True)
    status_label = serializers.CharField(read_only=True)
    has_pdf = serializers.SerializerMethodField()
    pdf_url = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        from .models import CourrierOfficiel
        model = CourrierOfficiel
        fields = [
            "id",
            "reference",
            "category",
            "category_label",
            "status",
            "status_label",
            "recipient_type",
            "recipient_id",
            "recipient_name",
            "recipient_email",
            "period",
            "amount",
            "currency",
            "subject",
            "body_text",
            "has_pdf",
            "pdf_url",
            "created_at",
            "updated_at",
            "validated_at",
            "sent_at",
            "canceled_at",
            "created_by_name",
        ]
        read_only_fields = [
            "id",
            "reference",
            "category_label",
            "status_label",
            "created_at",
            "updated_at",
            "validated_at",
            "sent_at",
            "canceled_at",
            "created_by_name",
        ]

    def get_has_pdf(self, obj) -> bool:
        # En mode brouillon, le PDF est généré dynamiquement à la volée
        # En mode validé/envoyé, le fichier scellé existe
        return True

    def get_pdf_url(self, obj) -> str:
        return f"/api/v1/rights/legal/courriers/{obj.id}/preview-pdf/"

    def get_created_by_name(self, obj) -> str:
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.email
        return "Service Juridique"
