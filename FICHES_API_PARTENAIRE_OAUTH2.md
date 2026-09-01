# FICHES DE CORRECTION — API Partenaire (OAuth2) : Revocation Reelle + Fonctions Manquantes du CDC

**5 fiches — dans l'ordre de priorite : securite d'abord, puis les trois fonctions que le CDC attend de cette API**

---

## FICHE AD1 — La revocation de jeton doit reellement revoquer quelque chose

### Le probleme
OAuthRevokeView.post répond toujours {"status": "revoked"} sans jamais rien vérifier ni désactiver. Un jeton "révoqué" reste valide jusqu'à ses 10 heures d'expiration naturelle.

### Le principe
Les JWT sont sans état par nature — la seule façon de révoquer un jeton précis avant son expiration est une liste de révocation (denylist) vérifiée à chaque validation.

### Fichiers concernes
- lahatheque-backend/apps/accounts/oauth2/models.py (nouveau)
- lahatheque-backend/apps/accounts/oauth2/views.py
- lahatheque-backend/apps/reader/permissions.py

### Prompt Antigravity

```
CONTEXTE :
OAuthRevokeView ne vérifie et ne désactive jamais rien. Il faut ajouter un identifiant unique
(jti) à chaque jeton émis par OAuthTokenView, une table de révocation, et faire vérifier cette
table par PartnerAuthentication (apps/reader/permissions.py) à chaque validation de jeton
Bearer.

CE QU'IL FAUT FAIRE — EXACTEMENT :

### 1. Créer apps/accounts/oauth2/models.py :

import uuid
from django.db import models


class RevokedPartnerToken(models.Model):
    """Liste de révocation des jetons OAuth2 partenaires (JWT sans état par nature)."""
    jti = models.CharField(max_length=64, unique=True, db_index=True)
    partner_id = models.UUIDField(null=True, blank=True)
    revoked_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(help_text="Date d'expiration naturelle du jeton")

    class Meta:
        db_table = "oauth2_revoked_partner_token"

Générer la migration :
python manage.py makemigrations accounts

### 2. Dans apps/accounts/oauth2/views.py, méthode OAuthTokenView.post, TROUVER :

        payload = {
            "sub": f"partner_{partner.id}",
            "partner_id": str(partner.id),
            "partner_name": partner.name,
            "client_id": partner.client_id or str(partner.id),
            "scope": "reader:sessions reader:byod catalog:read",
            "type": "partner_access_token",
            "iat": now_ts,
            "exp": exp_ts,
        }

REMPLACER par :

        import uuid as uuid_lib
        jti = str(uuid_lib.uuid4())

        payload = {
            "sub": f"partner_{partner.id}",
            "partner_id": str(partner.id),
            "partner_name": partner.name,
            "client_id": partner.client_id or str(partner.id),
            "scope": "reader:sessions reader:byod catalog:read",
            "type": "partner_access_token",
            "jti": jti,
            "iat": now_ts,
            "exp": exp_ts,
        }

### 3. Réécrire entièrement OAuthRevokeView :

class OAuthRevokeView(APIView):
    """POST /api/v1/oauth2/token/revoke/ - Révocation réelle via liste de révocation (jti)."""
    permission_classes = []

    def post(self, request):
        token_str = request.data.get("token", "")
        if not token_str:
            return Response({"error": "invalid_request", "error_description": "Le paramètre token est requis."}, status=400)

        try:
            payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=["HS256"], options={"verify_exp": False})
        except Exception:
            return Response({"status": "revoked"}, status=status.HTTP_200_OK)

        jti = payload.get("jti")
        if not jti:
            return Response({"status": "revoked"}, status=status.HTTP_200_OK)

        from .models import RevokedPartnerToken
        exp_ts = payload.get("exp", 0)
        RevokedPartnerToken.objects.get_or_create(
            jti=jti,
            defaults={
                "partner_id": payload.get("partner_id"),
                "expires_at": timezone.datetime.fromtimestamp(exp_ts, tz=timezone.utc) if exp_ts else timezone.now(),
            }
        )

        return Response({"status": "revoked"}, status=status.HTTP_200_OK)

### 4. Dans apps/reader/permissions.py, PartnerAuthentication.authenticate, TROUVER :

            try:
                payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=["HS256"])
                partner_id = payload.get("partner_id")
                if partner_id:

REMPLACER par :

            try:
                payload = jwt.decode(token_str, settings.SECRET_KEY, algorithms=["HS256"])
                jti = payload.get("jti")
                if jti:
                    from apps.accounts.oauth2.models import RevokedPartnerToken
                    if RevokedPartnerToken.objects.filter(jti=jti).exists():
                        return None
                partner_id = payload.get("partner_id")
                if partner_id:

NE PAS MODIFIER le reste des trois fichiers.
```

---

## FICHE AD2 — Cle de signature dediee pour les jetons partenaires OAuth2

### Le principe
Les jetons de session Lecteur ont déjà leur propre clé dédiée (READER_JWT_SIGNING_KEY). Les jetons partenaires OAuth2 méritent le même isolement plutôt que de partager SECRET_KEY.

### Fichiers concernes
- lahatheque-backend/config/settings/base.py
- lahatheque-backend/apps/accounts/oauth2/views.py
- lahatheque-backend/apps/reader/permissions.py

### Prompt Antigravity

```
CONTEXTE :
OAuthTokenView signe ses jetons avec settings.SECRET_KEY. Les jetons partenaires OAuth2
méritent le même isolement que les jetons de session Lecteur (READER_JWT_SIGNING_KEY).

CE QU'IL FAUT FAIRE — EXACTEMENT :

### 1. Dans config/settings/base.py, à côté de READER_JWT_SIGNING_KEY, AJOUTER :

OAUTH2_PARTNER_JWT_SIGNING_KEY = env(
    "OAUTH2_PARTNER_JWT_SIGNING_KEY", default=env("READER_JWT_SIGNING_KEY", default=SECRET_KEY)
)

(adapter la syntaxe exacte selon celle déjà utilisée pour READER_JWT_SIGNING_KEY dans ce même
fichier).

### 2. Dans apps/accounts/oauth2/views.py, remplacer les occurrences de settings.SECRET_KEY
par settings.OAUTH2_PARTNER_JWT_SIGNING_KEY.

### 3. Dans apps/reader/permissions.py, PartnerAuthentication.authenticate, remplacer
settings.SECRET_KEY par settings.OAUTH2_PARTNER_JWT_SIGNING_KEY dans l'appel jwt.decode du
chemin Bearer JWT.

NE PAS MODIFIER READER_JWT_SIGNING_KEY ni son usage existant.
```

---

## FICHE AD3 — Consultation du catalogue via l'API partenaire (CDC 9.1)

### Fichier concerne
- lahatheque-backend/apps/reader/views.py
- lahatheque-backend/apps/reader/urls.py

### Prompt Antigravity

```
CONTEXTE :
Le jeton OAuth2 partenaire porte déjà le scope catalog:read, mais aucun endpoint ne l'utilise.
Le CDC (section 9.1) exige "Consultation du catalogue et recherche documentaire". Réutiliser
OuvrageBasicSerializer (apps/student/serializers.py) et IsAuthenticatedPartner déjà fonctionnels.

CE QU'IL FAUT FAIRE — EXACTEMENT :

Ajouter dans apps/reader/views.py :

class PartnerCatalogListView(APIView):
    """GET /api/v1/partner/catalog/ - Consultation du catalogue pour partenaires externes (CDC 9.1)."""
    authentication_classes = [PartnerAuthentication]
    permission_classes = [IsAuthenticatedPartner]

    def get(self, request):
        from apps.catalog.models import Ouvrage
        from apps.student.serializers import OuvrageBasicSerializer

        qs = Ouvrage.objects.filter(status='published').select_related('discipline', 'institution')

        q = request.query_params.get('q', '')
        if q:
            qs = qs.filter(title__icontains=q)

        discipline = request.query_params.get('discipline', '')
        if discipline:
            qs = qs.filter(discipline__name__icontains=discipline)

        qs = qs[:100]

        serializer = OuvrageBasicSerializer(qs, many=True, context={'request': request})
        return Response({"success": True, "data": serializer.data, "count": qs.count()})


class PartnerCatalogDetailView(APIView):
    """GET /api/v1/partner/catalog/<id>/ - Détail d'un ouvrage pour partenaires externes."""
    authentication_classes = [PartnerAuthentication]
    permission_classes = [IsAuthenticatedPartner]

    def get(self, request, id):
        from apps.catalog.models import Ouvrage
        from apps.student.serializers import OuvrageBasicSerializer

        try:
            ouvrage = Ouvrage.objects.get(id=id, status='published')
        except Ouvrage.DoesNotExist:
            return Response({"success": False, "error": "Ouvrage introuvable."}, status=404)

        serializer = OuvrageBasicSerializer(ouvrage, context={'request': request})
        return Response({"success": True, "data": serializer.data})

Ajouter les routes dans apps/reader/urls.py :
    path('partner/catalog/', PartnerCatalogListView.as_view(), name='partner-catalog-list'),
    path('partner/catalog/<str:id>/', PartnerCatalogDetailView.as_view(), name='partner-catalog-detail'),

Vérifier le préfixe exact déjà utilisé pour les routes reader avant de finaliser le chemin.
```

---

## FICHE AD4 — Verification et souscription de bouquets via l'API partenaire (CDC 9.1)

### Fichier concerne
- lahatheque-backend/apps/reader/views.py
- lahatheque-backend/apps/reader/urls.py
- lahatheque-backend/apps/reader/models.py

### Prompt Antigravity

```
CONTEXTE :
Le CDC (9.1) exige "Vérification des licences et souscription aux bouquets" via l'API
partenaire. Réutiliser BouquetOffering.get_books_queryset() déjà construite.

IMPORTANT — PRÉALABLE : le modèle PartnerApp (apps/reader/models.py) n'a actuellement AUCUN
champ reliant un partenaire à une Institution. L'ajouter d'abord :

    linked_institution = models.ForeignKey(
        'partners.Institution', null=True, blank=True, on_delete=models.SET_NULL,
        related_name='partner_apps'
    )

Générer la migration correspondante (python manage.py makemigrations reader) avant de
poursuivre — sans ce champ, les vues ci-dessous ne peuvent pas fonctionner.

CE QU'IL FAUT FAIRE — EXACTEMENT :

class PartnerBouquetsListView(APIView):
    """GET /api/v1/partner/bouquets/ - Bouquets disponibles, consultables par un partenaire externe."""
    authentication_classes = [PartnerAuthentication]
    permission_classes = [IsAuthenticatedPartner]

    def get(self, request):
        from apps.partners.models import BouquetOffering

        data = [{
            "id": str(o.id),
            "title": o.title,
            "bouquet_type": o.bouquet_type,
            "discipline": o.discipline,
            "books_count": o.books_count,
            "annual_price": float(o.annual_price),
            "currency": o.currency,
        } for o in BouquetOffering.objects.filter(is_active=True)]

        return Response({"success": True, "data": data})


class PartnerBouquetLicenseCheckView(APIView):
    """GET /api/v1/partner/bouquets/<offering_id>/check-access/?book_id=<id>"""
    authentication_classes = [PartnerAuthentication]
    permission_classes = [IsAuthenticatedPartner]

    def get(self, request, offering_id):
        from apps.partners.models import BouquetOffering, UniversityBouquetSubscription

        book_id = request.query_params.get('book_id')
        if not book_id:
            return Response({"success": False, "error": "Le paramètre book_id est requis."}, status=400)

        institution = getattr(request.partner, 'linked_institution', None)

        if not institution:
            return Response({"success": True, "data": {"has_access": False, "reason": "Aucune institution rattachée à ce partenaire."}})

        has_sub = UniversityBouquetSubscription.objects.filter(
            institution=institution, offering_id=offering_id, status='active'
        ).exists()

        if not has_sub:
            return Response({"success": True, "data": {"has_access": False, "reason": "Aucune souscription active."}})

        try:
            offering = BouquetOffering.objects.get(id=offering_id)
            has_book = offering.get_books_queryset(requesting_institution=institution).filter(id=book_id).exists()
        except BouquetOffering.DoesNotExist:
            has_book = False

        return Response({"success": True, "data": {"has_access": has_book}})

Ajouter les routes dans apps/reader/urls.py :
    path('partner/bouquets/', PartnerBouquetsListView.as_view(), name='partner-bouquets-list'),
    path('partner/bouquets/<str:offering_id>/check-access/', PartnerBouquetLicenseCheckView.as_view(), name='partner-bouquet-check-access'),
```

---

## FICHE AD5 — Statistiques d'usage via l'API partenaire (CDC 9.1)

### Fichier concerne
- lahatheque-backend/apps/reader/views.py
- lahatheque-backend/apps/reader/urls.py

### Prompt Antigravity

```
CONTEXTE :
Le CDC (9.1) exige "Achat d'ouvrages et consultation des statistiques d'usage" via l'API
partenaire. Cette fiche expose la CONSULTATION des statistiques d'usage. L'achat direct par un
partenaire externe implique un flux de paiement réel qui nécessite une décision métier avant
d'être implémenté — il n'est pas inclus ici.

CE QU'IL FAUT FAIRE — EXACTEMENT :

class PartnerUsageStatsView(APIView):
    """GET /api/v1/partner/stats/usage/ - Statistiques d'usage pour l'institution du partenaire."""
    authentication_classes = [PartnerAuthentication]
    permission_classes = [IsAuthenticatedPartner]

    def get(self, request):
        from apps.protection.models import TraceAcces
        from django.db.models import Count

        institution = getattr(request.partner, 'linked_institution', None)
        if not institution:
            return Response({"success": True, "data": {"total_consultations": 0, "top_books": []}})

        qs = TraceAcces.objects.filter(institution=institution)

        top_books = list(
            qs.values('ouvrage__title')
            .annotate(consultations=Count('id'))
            .order_by('-consultations')[:10]
        )

        return Response({
            "success": True,
            "data": {
                "total_consultations": qs.count(),
                "top_books": top_books,
            }
        })

Ajouter la route dans apps/reader/urls.py :
    path('partner/stats/usage/', PartnerUsageStatsView.as_view(), name='partner-usage-stats'),

NOTE : l'achat direct d'ouvrages via l'API partenaire reste un point ouvert nécessitant une
décision métier (facturation, mode de règlement institutionnel) — ne pas créer d'endpoint
d'achat non validé.
```

---

# RESUME — ORDRE D'EXECUTION

| Ordre | Fiche | Contenu |
|---|---|---|
| 1 | AD1 | Révocation de jeton réellement fonctionnelle (liste de révocation par jti) |
| 2 | AD2 | Clé de signature dédiée pour les jetons partenaires, isolée de SECRET_KEY |
| 3 | AD3 | Consultation du catalogue via l'API partenaire |
| 4 | AD4 | Vérification de licence et souscription de bouquets (nécessite d'abord un champ de liaison PartnerApp vers Institution) |
| 5 | AD5 | Statistiques d'usage via l'API partenaire — l'achat direct reste un point ouvert nécessitant une décision métier |

Ce qui reste hors perimetre : le SSO (SAML) reste un stub assume — son implementation reelle est un chantier a part entiere, a traiter separement si vous le jugez prioritaire.
