# FICHES DE CORRECTION — Relation Auteur ↔ Ouvrages (version finale)

**8 fiches — Remplace entierement les fiches H1-H6 precedentes**

---

## Ce qui a change par rapport aux fiches precedentes

- La liaison a un compte auteur existant est optionnelle partout — jamais bloquante, jamais obligatoire. Un livre peut etre publie avec un simple nom d'auteur en texte, sans compte associe.
- Le mecanisme de revendication (H2) est abandonne — inutile si la liaison est capturee des la source, des deux cotes.
- Nouvelle decouverte a corriger en premier : le module Pre-edition du Juriste (LegalPreEditionsListView) est entierement factice — memes symptomes que le depot de manuscrit auteur (GET code en dur, POST qui ne sauvegarde rien). Il faut le rendre reel avant de pouvoir s'en servir comme point d'ancrage.

---

## FICHE I1 — Rendre le module Pre-edition du Juriste reellement persistant

### Le probleme
LegalPreEditionsListView renvoie deux dossiers codes en dur en GET, et POST construit une reponse de succes sans jamais appeler PreEditionDossier.objects.create(...). Le modele existe deja en base mais n'est jamais utilise.

### Fichier concerne
- lahatheque-backend/apps/rights/views.py

### Prompt Antigravity

```
CONTEXTE :
Backend Django LAHAThèque. LegalPreEditionsListView (apps/rights/views.py) est entièrement
mock alors que le modèle PreEditionDossier existe déjà et fonctionne (apps/rights/models.py) :
id, code_dossier, titre_previsionnel, auteur_nom, universite_nom, faculte_nom,
date_prevue_remise, status, notes_juridiques, contrat (FK ContratLegal nullable).

CE QU'IL FAUT FAIRE — EXACTEMENT :

Reecrire entierement la classe LegalPreEditionsListView dans apps/rights/views.py par :

class LegalPreEditionsListView(APIView):
    """GET/POST /api/v1/rights/legal/pre-editions/ - Dossiers de pré-édition RÉELS."""
    permission_classes = [permissions.IsAuthenticated, IsLegalReviewerRole]

    def get(self, request):
        from .models import PreEditionDossier

        dossiers = PreEditionDossier.objects.all().select_related('contrat').order_by('-created_at')
        data = [{
            "id": str(d.id),
            "code_dossier": d.code_dossier,
            "provisional_title": d.titre_previsionnel,
            "author_name": d.auteur_nom,
            "university": d.universite_nom,
            "faculty": d.faculte_nom,
            "expected_delivery_date": d.date_prevue_remise.isoformat() if d.date_prevue_remise else None,
            "status": d.status,
            "contract_reference": d.contrat.numero_contrat if d.contrat else None,
            "notes": d.notes_juridiques,
        } for d in dossiers]
        return Response({"success": True, "data": data})

    def post(self, request):
        from .models import PreEditionDossier
        import uuid as uuid_lib

        title = request.data.get("provisional_title", "").strip()
        author = request.data.get("author_name", "").strip()
        university = request.data.get("university", "")
        faculty = request.data.get("faculty", "")
        delivery_date = request.data.get("expected_delivery_date") or None
        notes = request.data.get("notes", "")

        if not title or not author:
            return Response({"success": False, "error": "Le titre prévisionnel et l'auteur sont obligatoires."}, status=400)

        code = f"PRE-{timezone.now().year}-{uuid_lib.uuid4().hex[:4].upper()}"

        dossier = PreEditionDossier.objects.create(
            code_dossier=code,
            titre_previsionnel=title,
            auteur_nom=author,
            universite_nom=university,
            faculte_nom=faculty,
            date_prevue_remise=delivery_date,
            notes_juridiques=notes,
            status="en_attente_depot",
        )

        return Response({
            "success": True,
            "message": "Fiche de pré-édition créée.",
            "data": {
                "id": str(dossier.id),
                "code_dossier": dossier.code_dossier,
                "provisional_title": dossier.titre_previsionnel,
                "author_name": dossier.auteur_nom,
                "university": dossier.universite_nom,
                "faculty": dossier.faculte_nom,
                "expected_delivery_date": dossier.date_prevue_remise.isoformat() if dossier.date_prevue_remise else None,
                "status": dossier.status,
                "notes": dossier.notes_juridiques,
            }
        }, status=201)

Verifier que timezone est importe en haut du fichier (from django.utils import timezone).

NE PAS MODIFIER LegalRelancesListView ni les autres vues dans cette fiche.
```

---

## FICHE I2 — Email optionnel sur la pre-edition, liaison automatique non bloquante

### Fichiers concernes
- lahatheque-backend/apps/rights/models.py
- lahatheque-backend/apps/rights/views.py (LegalPreEditionsListView.post)

### Prompt Antigravity

```
CONTEXTE :
Ajouter un champ email optionnel sur PreEditionDossier. Si renseigné et qu'il correspond à un
compte User avec role='author', lier automatiquement — SANS jamais bloquer la création du
dossier si l'email est absent, invalide, ou ne correspond à personne.

CE QU'IL FAUT FAIRE — EXACTEMENT :

### 1. Dans apps/rights/models.py, classe PreEditionDossier, AJOUTER après auteur_nom :

    auteur_email = models.EmailField(blank=True, default='')
    auteur_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True,
        on_delete=models.SET_NULL, related_name='pre_editions_liees'
    )

Générer la migration :
python manage.py makemigrations rights

### 2. Dans apps/rights/views.py, méthode LegalPreEditionsListView.post (Fiche I1), TROUVER :

        delivery_date = request.data.get("expected_delivery_date") or None
        notes = request.data.get("notes", "")

AJOUTER juste après :

        author_email = request.data.get("author_email", "").strip()
        linked_user = None
        if author_email:
            from apps.accounts.models import User
            linked_user = User.objects.filter(email__iexact=author_email, role='author').first()

TROUVER ensuite la création du dossier et REMPLACER par (ajout de auteur_email et auteur_user) :

        dossier = PreEditionDossier.objects.create(
            code_dossier=code,
            titre_previsionnel=title,
            auteur_nom=author,
            auteur_email=author_email,
            auteur_user=linked_user,
            universite_nom=university,
            faculte_nom=faculty,
            date_prevue_remise=delivery_date,
            notes_juridiques=notes,
            status="en_attente_depot",
        )

NE PAS MODIFIER le GET de cette vue dans cette fiche.
```

---

## FICHE I3 — Liaison optionnelle Ouvrage vers Dossier de pre-edition au depot

### Le probleme
Aucun lien technique n'existe entre PreEditionDossier et Ouvrage. Le maquettiste ne peut jamais rattacher son depot a une fiche deja enregistree par le Juriste, meme quand elle existe.

### Fichiers concernes
- lahatheque-backend/apps/catalog/models.py
- lahatheque-backend/apps/catalog/serializers.py

### Prompt Antigravity

```
CONTEXTE :
Ajouter un champ optionnel sur Ouvrage permettant de le rattacher à un PreEditionDossier
existant. Si un dossier est sélectionné par le maquettiste ET que ce dossier a un auteur_user
renseigné (Fiche I2), le BookAuthor créé pour ce dépôt hérite automatiquement de ce lien. Ce
rattachement reste ENTIÈREMENT OPTIONNEL.

CE QU'IL FAUT FAIRE — EXACTEMENT :

### 1. Dans apps/catalog/models.py, classe Ouvrage, AJOUTER :

    pre_edition_dossier = models.ForeignKey(
        'rights.PreEditionDossier', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='ouvrages'
    )

Générer la migration :
python manage.py makemigrations catalog

### 2. Dans apps/catalog/serializers.py, OuvrageCreateSerializer

AJOUTER un champ optionnel :
    pre_edition_dossier_id = serializers.CharField(required=False, allow_blank=True, default='')

Dans la méthode create(), AJOUTER avant le bloc de résolution des auteurs (issu de la fiche
appliquée précédemment — recherche par email) :

        dossier = None
        dossier_id = validated_data.pop('pre_edition_dossier_id', '')
        if dossier_id:
            from apps.rights.models import PreEditionDossier
            dossier = PreEditionDossier.objects.filter(id=dossier_id).first()

Dans la création de l'Ouvrage (Ouvrage.objects.create(...)), AJOUTER le paramètre :
            pre_edition_dossier=dossier,

Dans la boucle de création des BookAuthor, APRÈS ouvrage.authors.add(author_obj), AJOUTER :

                if dossier and dossier.auteur_user and not author_obj.user:
                    author_obj.user = dossier.auteur_user
                    author_obj.email = dossier.auteur_email or author_obj.email
                    author_obj.save(update_fields=['user', 'email'])

À la fin de la méthode create(), après la sauvegarde finale de l'ouvrage, AJOUTER :

        if dossier and dossier.status == 'en_attente_depot':
            dossier.status = 'maquette_en_cours'
            dossier.save(update_fields=['status'])

NE PAS MODIFIER le reste de la méthode.
```

---

## FICHE I4 — Endpoint de recherche des dossiers de pre-edition pour le Maquettiste

### Le probleme
Le maquettiste a besoin de rechercher un dossier de pré-édition par titre pour le rattacher (Fiche I3), mais aucun endpoint accessible aux Maquettistes n'existe.

### Fichiers concernes
- lahatheque-backend/apps/catalog/views.py
- lahatheque-backend/apps/catalog/urls.py

### Prompt Antigravity

```
CONTEXTE :
Ajouter un endpoint de recherche léger, accessible aux Maquettistes, listant les dossiers de
pré-édition en attente de dépôt pour leur permettre de rattacher leur dépôt (Fiche I3). Lecture
seule, champs minimaux — pas d'accès aux données juridiques sensibles réservées au Juriste.

CE QU'IL FAUT FAIRE — EXACTEMENT :

Ajouter à la fin de apps/catalog/views.py :

class PreEditionSearchView(APIView):
    """GET /api/v1/catalog/pre-editions/search/?q=... - Recherche pour rattachement au dépôt."""
    permission_classes = [permissions.IsAuthenticated, IsLayoutArtistOrAbove]

    def get(self, request):
        from apps.rights.models import PreEditionDossier

        query = request.query_params.get('q', '').strip()
        dossiers = PreEditionDossier.objects.filter(
            status__in=['en_attente_depot', 'maquette_en_cours']
        )
        if query:
            dossiers = dossiers.filter(titre_previsionnel__icontains=query)

        results = [{
            "id": str(d.id),
            "code_dossier": d.code_dossier,
            "titre_previsionnel": d.titre_previsionnel,
            "auteur_nom": d.auteur_nom,
            "universite_nom": d.universite_nom,
            "faculte_nom": d.faculte_nom,
        } for d in dossiers[:15]]

        return Response({"success": True, "data": results})

Ajouter la route dans apps/catalog/urls.py :

    path('pre-editions/search/', PreEditionSearchView.as_view(), name='pre-edition-search'),

Et l'import correspondant depuis views.py en haut du fichier urls.py.
```

---

## FICHE I5 — Depot de manuscrit Auteur reellement persistant

### Fichiers concernes
- lahatheque-backend/apps/rights/models.py
- lahatheque-backend/apps/rights/views.py

### Prompt Antigravity

```
CONTEXTE :
AuthorSubmissionsView (apps/rights/views.py) est entièrement mock : GET renvoie une liste
codée en dur, POST construit une réponse de succès sans jamais persister le manuscrit.

CE QU'IL FAUT FAIRE — EXACTEMENT :

### 1. Ajouter le modèle dans apps/rights/models.py, à la fin du fichier :

class AuthorManuscriptSubmission(models.Model):
    """Manuscrit déposé par un auteur pour étude avant finalisation éditoriale."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    VERSION_CHOICES = [
        ('brouillon', 'Brouillon'),
        ('finale', 'Version finale'),
    ]
    STATUS_CHOICES = [
        ('study_pending', "À l'étude"),
        ('catalog_preparation', 'En préparation catalogue'),
        ('accepted', 'Accepté'),
        ('rejected', 'Refusé'),
    ]
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='manuscript_submissions'
    )
    title = models.CharField(max_length=255)
    manuscript_file = models.FileField(upload_to='manuscripts/', blank=True, null=True)
    version_type = models.CharField(max_length=20, choices=VERSION_CHOICES, default='brouillon')
    suggested_summary = models.TextField(blank=True, default='')
    suggested_language = models.CharField(max_length=50, default='Français')
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default='study_pending')
    editorial_note = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

Générer la migration :
python manage.py makemigrations rights

### 2. Réécrire entièrement AuthorSubmissionsView dans apps/rights/views.py :

class AuthorSubmissionsView(APIView):
    """GET/POST /api/v1/rights/author/submissions/ - Gestion RÉELLE des manuscrits déposés."""
    permission_classes = [permissions.IsAuthenticated, IsAuthor]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        from .models import AuthorManuscriptSubmission

        subs = AuthorManuscriptSubmission.objects.filter(author=request.user)
        data = [{
            "id": str(s.id),
            "title": s.title,
            "manuscript_file_url": s.manuscript_file.url if s.manuscript_file else None,
            "submitted_at": s.created_at.date().isoformat(),
            "version_type": s.version_type,
            "status": s.status,
            "suggested_summary": s.suggested_summary,
            "suggested_language": s.suggested_language,
            "editorial_note": s.editorial_note,
        } for s in subs]
        return Response({"success": True, "data": data})

    def post(self, request):
        from .models import AuthorManuscriptSubmission

        title = request.data.get("title", "").strip()
        version_type = request.data.get("version_type", "brouillon")
        summary = request.data.get("summary", "")
        language = request.data.get("language", "Français")
        manuscript_file = request.FILES.get("manuscript_file")

        if not title:
            return Response({"success": False, "error": "Le titre du manuscrit est obligatoire."}, status=400)

        submission = AuthorManuscriptSubmission.objects.create(
            author=request.user,
            title=title,
            manuscript_file=manuscript_file,
            version_type=version_type,
            suggested_summary=summary,
            suggested_language=language,
            status='study_pending',
        )

        return Response({
            "success": True,
            "message": "Manuscrit déposé avec succès auprès du comité éditorial LAHA Éditions.",
            "data": {
                "id": str(submission.id),
                "title": submission.title,
                "manuscript_file_url": submission.manuscript_file.url if submission.manuscript_file else None,
                "submitted_at": submission.created_at.date().isoformat(),
                "version_type": submission.version_type,
                "status": submission.status,
                "suggested_summary": submission.suggested_summary,
                "suggested_language": submission.suggested_language,
            }
        }, status=201)

Ajouter en haut du fichier, si absents :
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
```

---

## FICHE I6 — Retirer les planchers fictifs de LegalKpisView

### Fichier concerne
- lahatheque-backend/apps/rights/views.py (LegalKpisView)

### Prompt Antigravity

```
CONTEXTE :
LegalKpisView (apps/rights/views.py) utilise des planchers fictifs (or 48, or 3, or 6, or 14)
qui masquent un vrai zéro, plus une valeur codée en dur (clients_in_debt_count = 5).

CE QU'IL FAUT FAIRE — EXACTEMENT :

Dans apps/rights/views.py, méthode LegalKpisView.get, TROUVER :

        contracts_count = ContratLegal.objects.count() or 48
        pending_ai_count = AIRoyaltySuggestion.objects.filter(is_validated=False).count() or 3
        active_pre_editions_count = PreEditionDossier.objects.filter(status='en_attente_depot').count() or 6
        reminders_sent_count = RelanceEmailJournal.objects.count() or 14
        clients_in_debt_count = 5

REMPLACER par :

        from apps.commerce.models import Order

        contracts_count = ContratLegal.objects.count()
        pending_ai_count = AIRoyaltySuggestion.objects.filter(is_validated=False).count()
        active_pre_editions_count = PreEditionDossier.objects.filter(status='en_attente_depot').count()
        reminders_sent_count = RelanceEmailJournal.objects.count()
        clients_in_debt_count = Order.objects.filter(
            statut_paiement='pending'
        ).values('user').distinct().count()

TROUVER ensuite le bloc timeline et LE REMPLACER par un calcul base sur les vraies dates :

        timeline = []
        date_field = 'date_signature' if hasattr(ContratLegal, 'date_signature') else 'created_at'
        for week_start, week_end in [
            (w1_start, w2_start), (w2_start, w3_start),
            (w3_start, w4_start), (w4_start, now)
        ]:
            filter_kwargs = {f'{date_field}__gte': week_start, f'{date_field}__lt': week_end}
            week_count = ContratLegal.objects.filter(**filter_kwargs).count()
            timeline.append({"date": format_date_label(week_start), "value": week_count})

Vérifier le nom exact du champ de date sur ContratLegal avant application.
```

---

## FICHE I7 — Frontend : email optionnel sur le formulaire de pre-edition (Juriste)

### Fichier concerne
- lahatheque-frontend/app/(dashboard)/legal-reviewer/pre-editions/new/page.tsx (ou modale equivalente)
- lahatheque-frontend/lib/services/legal.ts

### Prompt Antigravity

```
CONTEXTE :
Ajouter un champ optionnel "Email du compte auteur (optionnel)" au formulaire de création de
dossier de pré-édition, transmis via createPreEditionContract().

CE QU'IL FAUT FAIRE :

Dans lib/services/legal.ts, fonction createPreEditionContract, AJOUTER author_email :

export async function createPreEditionContract(data: {
  provisional_title: string;
  author_name: string;
  author_email?: string;
  university?: string;
  faculty?: string;
  expected_delivery_date?: string;
  notes?: string;
}): Promise<PreEditionContract | null> {
  const res = await fetch(`${API_BASE}/pre-editions/`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || null;
}

Dans le formulaire de création, ajouter un champ texte optionnel à côté du nom de l'auteur,
avec le texte d'aide : "Si l'auteur a un compte LAHAThèque, son email permet de lier
automatiquement ses futures statistiques de vente à ce dossier. Facultatif."
```

---

## FICHE I8 — Frontend : rattachement optionnel + email auteur au depot Maquettiste

### Fichier concerne
- lahatheque-frontend/app/(dashboard)/layout-artist/deposits/new/page.tsx
- lahatheque-frontend/lib/services/layout-artist.ts

### Prompt Antigravity

```
CONTEXTE :
Ajouter au wizard de dépôt du Maquettiste : un champ de recherche optionnel pour rattacher le
dépôt à un dossier de pré-édition existant (Fiche I4), et un champ email optionnel par auteur
si aucun dossier n'est sélectionné. Aucun des deux champs n'est obligatoire.

CE QU'IL FAUT FAIRE :

### 1. Ajouter dans lib/services/layout-artist.ts :

export interface PreEditionSearchResult {
  id: string;
  code_dossier: string;
  titre_previsionnel: string;
  auteur_nom: string;
  universite_nom: string;
  faculte_nom: string;
}

export async function searchPreEditions(query: string): Promise<PreEditionSearchResult[]> {
  const res = await fetch(`/api/bff/catalog/pre-editions/search/?q=${encodeURIComponent(query)}`, {
    credentials: "include",
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.data || [];
}

Modifier createDepositWithFiles pour accepter et transmettre deux nouveaux champs optionnels
dans le FormData : pre_edition_dossier_id et authors_emails.

### 2. Dans le wizard de dépôt (deposits/new/page.tsx), à l'étape de saisie des métadonnées :

Ajouter un champ de recherche optionnel "Rattacher à un dossier de pré-édition (facultatif)" —
un input texte avec debounce qui appelle searchPreEditions(query) et affiche une liste
déroulante de résultats. Quand un dossier est sélectionné, pré-remplir automatiquement les
champs titre/auteur/université/faculté (modifiables ensuite), et stocker son id dans un état
local preEditionDossierId.

Si aucun dossier n'est sélectionné, afficher normalement le champ "Email de l'auteur
(optionnel)" à côté du champ nom d'auteur existant.

Transmettre preEditionDossierId et authorsEmailsStr dans l'appel à createDepositWithFiles(...).
```

---

# RESUME — ORDRE D'EXECUTION

| Ordre | Fiche | Contenu |
|---|---|---|
| 1 | I1 | Rendre le module Pre-edition Juriste reellement persistant (etait 100% mock) |
| 2 | I2 | Email optionnel sur la pre-edition, liaison automatique non bloquante |
| 3 | I3 | Liaison optionnelle Ouvrage vers Dossier de pre-edition au depot |
| 4 | I4 | Endpoint de recherche des dossiers pour le Maquettiste |
| 5 | I5 | Depot de manuscrit Auteur reellement persistant |
| 6 | I6 | Retrait des planchers fictifs des KPIs Juriste |
| 7 | I7 | Frontend — email optionnel au formulaire de pre-edition |
| 8 | I8 | Frontend — rattachement optionnel + email optionnel au depot Maquettiste |

Principe directeur conserve partout : aucune liaison a un compte auteur n'est jamais obligatoire, ni cote Juriste (pre-edition), ni cote Maquettiste (depot direct). Le systeme essaie d'etablir le lien quand l'information est disponible (email connu, dossier de pre-edition existant), mais un livre peut toujours etre publie avec un simple nom d'auteur, sans aucun compte associe.
