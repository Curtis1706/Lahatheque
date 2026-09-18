from rest_framework import serializers
from .models import ProtectionConfig, TraceAcces, Annotation, GlobalDrmConfig, ForensicInvestigation

class ProtectionConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProtectionConfig
        fields = '__all__'

class TraceAccesSerializer(serializers.ModelSerializer):
    user_email = serializers.SerializerMethodField()
    user_name = serializers.SerializerMethodField()
    book_title = serializers.SerializerMethodField()
    partner_name = serializers.SerializerMethodField()
    total_pages = serializers.SerializerMethodField()
    current_page = serializers.SerializerMethodField()
    progress_percent = serializers.SerializerMethodField()
    reading_time_minutes = serializers.SerializerMethodField()
    cover_url = serializers.SerializerMethodField()

    class Meta:
        model = TraceAcces
        fields = '__all__'

    def _get_reader_session(self, obj):
        if not hasattr(obj, '_cached_session'):
            session = None
            if obj.derived_hash and obj.derived_hash != 'nohash':
                from apps.reader.models import ReaderSession
                session = ReaderSession.objects.filter(
                    token_hash__startswith=obj.derived_hash
                ).select_related('partner', 'end_user', 'ouvrage').first()
            if not session and obj.partner_id:
                from apps.reader.models import ReaderSession
                session = ReaderSession.objects.filter(
                    partner_id=obj.partner_id, ouvrage=obj.ouvrage
                ).select_related('partner', 'end_user', 'ouvrage').order_by('-created_at').first()
            obj._cached_session = session
        return obj._cached_session

    def get_partner_name(self, obj):
        session = self._get_reader_session(obj)
        if session and session.partner and session.partner.name:
            return session.partner.name
        if obj.partner_id:
            from apps.partners.models import PartnerApp
            p = PartnerApp.objects.filter(id=obj.partner_id).first()
            if p and p.name:
                return p.name
        if obj.institution and obj.institution.name:
            return obj.institution.name
        return "Accès Direct"

    def get_user_email(self, obj):
        if obj.user and obj.user.email:
            return obj.user.email
        session = self._get_reader_session(obj)
        if session and session.end_user and session.end_user.email:
            return session.end_user.email
        return "etudiant@institution.bj"

    def get_user_name(self, obj):
        if obj.user:
            name = f"{obj.user.first_name} {obj.user.last_name}".strip()
            return name or obj.user.email
        session = self._get_reader_session(obj)
        if session and session.end_user and session.end_user.display_name:
            return session.end_user.display_name
        return obj.document_title or "Lecteur Authentifié"

    def get_book_title(self, obj):
        if obj.ouvrage:
            return getattr(obj.ouvrage, 'titre', None) or getattr(obj.ouvrage, 'title', None) or obj.document_title or "Ouvrage Académique"
        return obj.document_title or "Ouvrage Académique"

    def get_total_pages(self, obj):
        if obj.ouvrage and hasattr(obj.ouvrage, 'nombre_pages') and obj.ouvrage.nombre_pages:
            return obj.ouvrage.nombre_pages
        session = self._get_reader_session(obj)
        if session and session.ouvrage and hasattr(session.ouvrage, 'nombre_pages') and session.ouvrage.nombre_pages:
            return session.ouvrage.nombre_pages
        if session and isinstance(session.metadata, dict) and session.metadata.get('total_pages'):
            try:
                return int(session.metadata['total_pages'])
            except (ValueError, TypeError):
                pass
        return 1

    def get_current_page(self, obj):
        if obj.page_number and obj.page_number > 0:
            return obj.page_number
        session = self._get_reader_session(obj)
        if session and session.last_page and session.last_page > 0:
            return session.last_page
        return 1

    def get_progress_percent(self, obj):
        total = self.get_total_pages(obj)
        current = self.get_current_page(obj)
        if total > 0:
            return min(100, int((current / total) * 100))
        return 0

    def get_reading_time_minutes(self, obj):
        session = self._get_reader_session(obj)
        if session and session.reading_time_seconds:
            return max(1, int(session.reading_time_seconds / 60))
        return 1

    def get_cover_url(self, obj):
        if obj.ouvrage:
            cover = getattr(obj.ouvrage, 'cover_url', None)
            if cover:
                return cover
            if getattr(obj.ouvrage, 'cover_image', None):
                try:
                    return obj.ouvrage.cover_image.url
                except Exception:
                    pass
            if obj.ouvrage_id:
                return f"/api/bff/catalog/books/{obj.ouvrage_id}/cover/"
        session = self._get_reader_session(obj)
        if session and session.ouvrage:
            cover = getattr(session.ouvrage, 'cover_url', None)
            if cover:
                return cover
            if getattr(session.ouvrage, 'cover_image', None):
                try:
                    return session.ouvrage.cover_image.url
                except Exception:
                    pass
            if session.ouvrage_id:
                return f"/api/bff/catalog/books/{session.ouvrage_id}/cover/"
        return ""

class AnnotationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Annotation
        fields = ['id', 'user', 'ouvrage', 'type', 'position_data', 'selected_text', 'note_content', 'color', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

class GlobalDrmConfigSerializer(serializers.ModelSerializer):
    watermark_opacity = serializers.FloatField(required=False)

    class Meta:
        model = GlobalDrmConfig
        fields = [
            'profil_default', 'watermark_template', 'watermark_laha_template',
            'watermark_laha_subtext', 'watermark_position',
            'watermark_opacity', 'invisible_watermark_enabled',
            'allow_print', 'allow_copy', 'max_devices',
            'session_duration_minutes', 'config_version', 'updated_at',
        ]
        read_only_fields = ['updated_at']


class ForensicInvestigationSerializer(serializers.ModelSerializer):
    admin_name = serializers.SerializerMethodField()
    suspect_name = serializers.SerializerMethodField()
    book_title = serializers.SerializerMethodField()

    class Meta:
        model = ForensicInvestigation
        fields = '__all__'
        read_only_fields = ['id', 'created_at']

    def get_admin_name(self, obj: ForensicInvestigation) -> str:
        if obj.admin_user:
            name = f"{obj.admin_user.first_name} {obj.admin_user.last_name}".strip()
            return name or obj.admin_user.email
        return "Administrateur"

    def get_suspect_name(self, obj: ForensicInvestigation) -> str:
        if obj.suspect_user:
            name = f"{obj.suspect_user.first_name} {obj.suspect_user.last_name}".strip()
            return name or str(obj.suspect_user.email)
        return str(obj.suspect_email or "Non identifié")

    def get_book_title(self, obj: ForensicInvestigation) -> str:
        if obj.ouvrage:
            return obj.ouvrage.title
        return ""



