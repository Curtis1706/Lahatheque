# FICHES DE CORRECTION — Politique Tarifaire Reelle par Profil Acheteur

**6 fiches — Un seul systeme de configuration reel, calcul de prix centralise, plus de taux domicilies dans plusieurs fichiers**

---

## Diagnostic confirme dans le code reel

L'analyse recue est exacte, verifiee ligne par ligne dans le depot :

1. wholesaler_views.py calcule le prix de gros a trois endroits differents, chacun avec ses propres taux codes en dur (0.75/0.70) — jamais lus depuis une configuration.
2. ConfigurationPlateformeGlobale (le seul modele de configuration reel du projet) n'a aucun champ de remise par role.
3. Le bouton "Appliquer Tout" de /admin/catalog/pricing fait un setTimeout fictif — rien n'est jamais sauvegarde.
4. Le catalogue Auteur affiche price_digital/price_paper bruts, sans remise de 40%/25% appliquee nulle part.
5. Les commandes papier Universite calculent sur price_paper plein tarif, sans remise de 25%.

## Principe de correction retenu

Un seul point de calcul de prix par role, cote backend, reutilise par les quatre vues concernees (Grossiste, Auteur, Universite, matrice Admin) — pour ne plus jamais avoir a synchroniser des taux a la main a plusieurs endroits.

---

## FICHE S1 — Backend : champs de remise reels sur la configuration globale

### Fichier concerne
- lahatheque-backend/apps/reporting/models.py

### Prompt Antigravity

```
CONTEXTE :
ConfigurationPlateformeGlobale (apps/reporting/models.py) gère déjà la cascade tarifaire par
défaut mais n'a aucun champ de remise par profil acheteur. Ajouter les six taux visibles dans
l'interface Admin : Auteur papier/numérique, Grossiste papier/numérique, Campus papier/numérique.

CE QU'IL FAUT FAIRE — EXACTEMENT :

Dans apps/reporting/models.py, classe ConfigurationPlateformeGlobale, AJOUTER après les
champs de cascade tarifaire existants (prix_pass_annuel_xof) :

    remise_auteur_papier_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("40.00"),
        help_text="Remise papier accordée aux Auteurs (%)"
    )
    remise_auteur_numerique_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("25.00"),
        help_text="Remise numérique accordée aux Auteurs (%)"
    )
    remise_grossiste_papier_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("32.00"),
        help_text="Remise papier accordée aux Grossistes B2B (%)"
    )
    remise_grossiste_numerique_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("25.00"),
        help_text="Remise numérique accordée aux Grossistes B2B (%)"
    )
    remise_campus_papier_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("25.00"),
        help_text="Remise papier accordée aux Universités/Campus (%)"
    )
    remise_campus_numerique_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal("35.00"),
        help_text="Remise numérique accordée aux Universités/Campus (%)"
    )

Générer la migration :
python manage.py makemigrations reporting
```

---

## FICHE S2 — Backend : fonction de calcul de prix centralisee

### Fichier concerne
- lahatheque-backend/apps/reporting/pricing_service.py (nouveau)

### Prompt Antigravity

```
CONTEXTE :
Créer un point de calcul UNIQUE des prix par profil acheteur, appelé par toutes les vues
concernées au lieu de dupliquer des taux codés en dur à plusieurs endroits.

CE QU'IL FAUT FAIRE — EXACTEMENT :

Créer apps/reporting/pricing_service.py :

"""Calcul centralisé des prix par profil acheteur — source unique de vérité tarifaire."""
from decimal import Decimal
from django.core.cache import cache


def get_platform_config():
    from .models import ConfigurationPlateformeGlobale

    config = cache.get("platform_config_singleton")
    if config is None:
        config = ConfigurationPlateformeGlobale.objects.first()
        if not config:
            config = ConfigurationPlateformeGlobale.objects.create()
        cache.set("platform_config_singleton", config, timeout=60)
    return config


def invalidate_platform_config_cache():
    cache.delete("platform_config_singleton")


def compute_role_price(ouvrage, role: str) -> dict:
    """
    Calcule le prix net numérique et papier pour un ouvrage, selon le profil acheteur.
    role : 'wholesaler' | 'author' | 'university' | 'public'
    """
    config = get_platform_config()

    public_digital = float(ouvrage.price_digital or 0)
    public_paper = float(ouvrage.price_paper or 0)

    rate_map = {
        "wholesaler": (
            float(config.remise_grossiste_numerique_pct),
            float(config.remise_grossiste_papier_pct),
        ),
        "author": (
            float(config.remise_auteur_numerique_pct),
            float(config.remise_auteur_papier_pct),
        ),
        "university": (
            float(config.remise_campus_numerique_pct),
            float(config.remise_campus_papier_pct),
        ),
        "public": (0.0, 0.0),
    }

    digital_pct, paper_pct = rate_map.get(role, (0.0, 0.0))

    digital_price = round(public_digital * (1 - digital_pct / 100), 2)
    paper_price = round(public_paper * (1 - paper_pct / 100), 2)

    return {
        "digital_price": digital_price,
        "paper_price": paper_price,
        "digital_discount_pct": digital_pct,
        "paper_discount_pct": paper_pct,
        "public_digital_price": public_digital,
        "public_paper_price": public_paper,
    }
```

---

## FICHE S3 — Backend : le formulaire Admin persiste reellement les remises

### Fichier concerne
- lahatheque-backend/apps/reporting/admin_views.py (AdminCatalogPricingViewSet)

### Prompt Antigravity

```
CONTEXTE :
AdminCatalogPricingViewSet gère déjà la cascade tarifaire mais n'expose aucun endpoint pour
les remises par profil acheteur (Fiche S1). Le bouton "Appliquer Tout" du frontend n'a
actuellement aucune route à appeler.

CE QU'IL FAUT FAIRE — EXACTEMENT :

Ajouter à la fin de apps/reporting/admin_views.py :

class AdminRoleDiscountsView(APIView):
    """GET/PATCH /api/v1/admin/catalog/pricing/role-discounts/ - Remises par profil acheteur."""
    permission_classes = [permissions.IsAuthenticated, IsAdminOrSuperAdmin]

    def get(self, request):
        from .models import ConfigurationPlateformeGlobale

        config = ConfigurationPlateformeGlobale.objects.first()
        if not config:
            config = ConfigurationPlateformeGlobale.objects.create()

        return Response({
            "success": True,
            "data": {
                "author": {
                    "paper_pct": float(config.remise_auteur_papier_pct),
                    "digital_pct": float(config.remise_auteur_numerique_pct),
                },
                "wholesaler": {
                    "paper_pct": float(config.remise_grossiste_papier_pct),
                    "digital_pct": float(config.remise_grossiste_numerique_pct),
                },
                "university": {
                    "paper_pct": float(config.remise_campus_papier_pct),
                    "digital_pct": float(config.remise_campus_numerique_pct),
                },
            }
        })

    def patch(self, request):
        from .models import ConfigurationPlateformeGlobale
        from .pricing_service import invalidate_platform_config_cache
        from decimal import Decimal

        config = ConfigurationPlateformeGlobale.objects.first()
        if not config:
            config = ConfigurationPlateformeGlobale.objects.create()

        data = request.data
        field_map = {
            ("author", "paper_pct"): "remise_auteur_papier_pct",
            ("author", "digital_pct"): "remise_auteur_numerique_pct",
            ("wholesaler", "paper_pct"): "remise_grossiste_papier_pct",
            ("wholesaler", "digital_pct"): "remise_grossiste_numerique_pct",
            ("university", "paper_pct"): "remise_campus_papier_pct",
            ("university", "digital_pct"): "remise_campus_numerique_pct",
        }

        updated_fields = []
        for role_key in ("author", "wholesaler", "university"):
            role_data = data.get(role_key, {})
            for sub_key in ("paper_pct", "digital_pct"):
                if sub_key in role_data:
                    model_field = field_map[(role_key, sub_key)]
                    try:
                        setattr(config, model_field, Decimal(str(role_data[sub_key])))
                        updated_fields.append(model_field)
                    except (ValueError, TypeError):
                        pass

        if updated_fields:
            config.save(update_fields=updated_fields)
            invalidate_platform_config_cache()

        return Response({
            "success": True,
            "message": "Politique tarifaire mise à jour et appliquée sur toute la plateforme.",
        })

Ajouter la route dans le fichier urls.py contenant déjà les routes admin/catalog/pricing :

    path('catalog/pricing/role-discounts/', AdminRoleDiscountsView.as_view(), name='admin-pricing-role-discounts'),

Et l'import correspondant depuis admin_views.py.
```

---

## FICHE S4 — Backend : le catalogue Grossiste utilise la vraie configuration

### Fichier concerne
- lahatheque-backend/apps/commerce/wholesaler_views.py

### Prompt Antigravity

```
CONTEXTE :
WholesalerCatalogListView, WholesalerCatalogDetailView et WholesalerOrdersListView calculent
chacun le prix de gros avec des taux codés en dur différents. Il faut qu'ils utilisent tous
compute_role_price(ouvrage, "wholesaler") (Fiche S2).

CE QU'IL FAUT FAIRE — EXACTEMENT :

Ajouter l'import en haut du fichier :
from apps.reporting.pricing_service import compute_role_price

### 1. Dans WholesalerCatalogListView et WholesalerCatalogDetailView, TROUVER (chaque
occurrence) :

            dig_p = float(getattr(o, "prix_gros_numerique", None) or int(public_digital * 0.75))
            prt_p = float(getattr(o, "prix_gros_papier", None) or int(public_paper * 0.70))

REMPLACER (dans CHAQUE occurrence) par :

            pricing = compute_role_price(o, "wholesaler")
            dig_p = pricing["digital_price"]
            prt_p = pricing["paper_price"]
            digital_discount_pct = pricing["digital_discount_pct"]
            paper_discount_pct = pricing["paper_discount_pct"]

Dans le dictionnaire de résultat construit juste après, AJOUTER :

                "digital_discount_pct": digital_discount_pct,
                "paper_discount_pct": paper_discount_pct,

### 2. Dans WholesalerOrdersListView.post, TROUVER :

            dig_price = getattr(book, "prix_gros_numerique", None) or (base_dig * Decimal("0.75"))
            prt_price = getattr(book, "prix_gros_papier", None) or (base_prt * Decimal("0.70"))

REMPLACER par :

            pricing = compute_role_price(book, "wholesaler")
            dig_price = Decimal(str(pricing["digital_price"]))
            prt_price = Decimal(str(pricing["paper_price"]))

NE PAS MODIFIER le reste des méthodes (paliers de remise par quantité, vérification de
stock — cette logique reste inchangée et s'applique EN PLUS de la remise de base ici).
```

---

## FICHE S5 — Backend : catalogue Auteur et commandes Universite utilisent la vraie configuration

### Fichiers concernes
- lahatheque-backend/apps/student/serializers.py (OuvrageBasicSerializer)
- lahatheque-backend/apps/partners/university_views.py (UniversityPaperOrdersView)

### Prompt Antigravity

```
CONTEXTE :
Le catalogue Auteur affiche price_digital/price_paper bruts sans remise. Les commandes papier
Université calculent sur price_paper plein tarif. Les deux doivent utiliser
compute_role_price() (Fiche S2).

CE QU'IL FAUT FAIRE — EXACTEMENT :

### 1. Dans apps/student/serializers.py, classe OuvrageBasicSerializer, AJOUTER :

    author_discounted_digital_price = serializers.SerializerMethodField()
    author_discounted_paper_price = serializers.SerializerMethodField()

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

Ajouter 'author_discounted_digital_price', 'author_discounted_paper_price' à la liste fields
de Meta de OuvrageBasicSerializer.

Vérifier que la vue qui utilise ce serializer pour /author/catalog passe bien
context={'request': request} lors de l'instanciation — sinon l'ajouter.

### 2. Dans apps/partners/university_views.py, méthode UniversityPaperOrdersView.post,
TROUVER :

            unit_price = book.price_paper or Decimal("0.00")

REMPLACER par :

            from apps.reporting.pricing_service import compute_role_price
            pricing = compute_role_price(book, "university")
            unit_price = Decimal(str(pricing["paper_price"]))

NE PAS MODIFIER le reste des deux fichiers.
```

---

## FICHE S6 — Frontend : formulaire Admin reel + affichage des vraies remises

### Fichiers concernes
- lahatheque-frontend/app/(dashboard)/admin/catalog/pricing/page.tsx
- lahatheque-frontend/app/(dashboard)/wholesaler/catalog/page.tsx
- lahatheque-frontend/lib/services/admin.ts
- lahatheque-frontend/lib/services/wholesaler.ts

### Prompt Antigravity

```
CONTEXTE :
Le bouton "Appliquer Tout" de /admin/catalog/pricing fait un setTimeout fictif. Le catalogue
Grossiste affiche des badges "(-25%)" / "(-30%)" codés en dur au lieu de la vraie remise
renvoyée par le backend (Fiche S4).

CE QU'IL FAUT FAIRE :

### 1. Dans lib/services/admin.ts, AJOUTER :

export interface RoleDiscounts {
  author: { paper_pct: number; digital_pct: number };
  wholesaler: { paper_pct: number; digital_pct: number };
  university: { paper_pct: number; digital_pct: number };
}

export async function getRoleDiscounts(): Promise<RoleDiscounts | null> {
  const res = await fetch("/api/bff/admin/catalog/pricing/role-discounts/", {
    credentials: "include", cache: "no-store",
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.data || null;
}

export async function updateRoleDiscounts(data: RoleDiscounts): Promise<boolean> {
  const res = await fetch("/api/bff/admin/catalog/pricing/role-discounts/", {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.ok;
}

### 2. Dans app/(dashboard)/admin/catalog/pricing/page.tsx

Localiser le bloc setTimeout(() => { ... }, 450) déclenché par le bouton "Appliquer Tout" et
le REMPLACER par un appel réel à updateRoleDiscounts() avec les valeurs actuelles des champs
de saisie, suivi d'un toast de succès ou d'erreur. Au montage de la page, appeler
getRoleDiscounts() pour pré-remplir les champs avec les vraies valeurs en base au lieu de
valeurs par défaut codées en dur dans le composant.

### 3. Dans lib/services/wholesaler.ts, adapter le type WholesalerBookItem pour inclure
digital_discount_pct et paper_discount_pct renvoyés par le backend (Fiche S4).

### 4. Dans app/(dashboard)/wholesaler/catalog/page.tsx, TROUVER :

<span className="font-bold">Licence Numérique (-25%) :</span>
...
<span className="font-bold">Exemplaire Papier (-30%) :</span>

REMPLACER par :

<span className="font-bold">Licence Numérique (-{book.digital_discount_pct}%) :</span>
...
<span className="font-bold">Exemplaire Papier (-{book.paper_discount_pct}%) :</span>

Adapter la syntaxe exacte selon la structure JSX réelle avant application.
```

---

# RESUME — ORDRE D'EXECUTION

| Ordre | Fiche | Contenu |
|---|---|---|
| 1 | S1 | Champs de remise reels sur ConfigurationPlateformeGlobale |
| 2 | S2 | Fonction de calcul de prix centralisee (source unique) |
| 3 | S3 | Le formulaire Admin persiste reellement les remises |
| 4 | S4 | Le catalogue et les commandes Grossiste utilisent la vraie configuration |
| 5 | S5 | Le catalogue Auteur et les commandes papier Universite utilisent la vraie configuration |
| 6 | S6 | Frontend — formulaire Admin reel, badges de remise dynamiques cote Grossiste |

Apres application : changer un taux de remise dans /admin/catalog/pricing se repercute immediatement et partout — Grossiste, Auteur, Universite — puisque les quatre vues appellent desormais la meme fonction compute_role_price(), alimentee par la meme configuration en base.
