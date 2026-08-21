# 🛠️ Fiches de Correction — Données Mockées Restantes (Dashboard Admin)

**Base** : `SCAN_MOCK_DASHBOARD_ADMIN.md` (21 août 2026)
**Règle générale** : lire les fichiers en entier avant modification, vérifier avec
`python manage.py check` / `npx tsc --noEmit` après chaque fiche, traiter un point à la fois.

---

## Sommaire

1. [Fiche 1 — 🔴 `AdminValidationViewSet` : champs erronés + erreurs avalées](#fiche-1)
2. [Fiche 2 — 🔴 `AdminContractViewSet` : mauvais nom de modèle + faux contrats](#fiche-2)
3. [Fiche 3 — 🟠 `AdminStockViewSet` : métriques de stock jamais calculées](#fiche-3)
4. [Fiche 4 — 🟡 `/admin/sales/details` : page 100% statique](#fiche-4)
5. [Fiche 5 — 🟡 `/admin/sales/subscriptions` : page 100% statique](#fiche-5)
6. [Fiche 6 — 🟢 `/admin/catalog/protection` orpheline + historique de prix](#fiche-6)

---

<a name="fiche-1"></a>
## 🔴 Fiche 1 — `AdminValidationViewSet` : champs erronés + erreurs avalées

### Contexte vérifié (vrais champs du modèle `Ouvrage`)
```python
# apps/catalog/models.py — champs réels
status = models.CharField(max_length=30, default='draft')   # PAS "statut"
file = models.FileField(upload_to='books/')                  # PAS "fichier_numerique"
page_count = models.IntegerField(default=0)                  # PAS hardcodé à 284
discipline = models.ForeignKey(Discipline, ...)               # discipline.name pour le texte
publisher = models.ForeignKey('publishers_portal.Publisher', ...)  # publisher.company_name

@property
def auteur(self) -> str:   # déjà présent, alias prêt à l'emploi
    if self.pk and self.authors.exists():
        return ", ".join([f"{a.first_name} {a.last_name}".strip() for a in self.authors.all()])
    return ""
```
Aucun champ `motif_rejet` n'existe sur `Ouvrage` — à créer si le rejet doit être tracé, ou à
retirer du payload en attendant.

### Prompt Antigravity

```
Contexte : backend Django 5.2, LAHAThèque v3.2, apps/reporting/admin_views.py::
AdminValidationViewSet. IMPORTANT : exécuter après la Fiche A (permissions) déjà appliquée —
ne pas y toucher.

Problème confirmé : list() utilise getattr(b, 'statut', ...), getattr(b, 'auteur_nom', ...),
getattr(b, 'editeur_nom', ...), getattr(b, 'fichier_numerique', ...), getattr(b, 'motif_rejet',
...) — AUCUN de ces noms de champs n'existe sur le modèle Ouvrage (les vrais noms sont status,
auteur (property), publisher.company_name, file, et aucun équivalent motif_rejet). En plus,
"version", "format", "submitted_by", "page_count", "lcp_compliant" sont des valeurs codées en
dur identiques pour chaque livre. Le bloc `except Exception as e: return Response({"success":
True, "data": [], "error": str(e)})` avale toute erreur réelle et affiche silencieusement une
file de validation vide à l'admin.

Étape 1 — Réécrire list() avec les vrais champs :

    def list(self, request):
        from apps.catalog.models import Ouvrage
        books = (
            Ouvrage.objects
            .select_related('publisher', 'discipline')
            .prefetch_related('authors')
            .filter(status__in=['pending_review', 'pending_admin_approval', 'draft', 'published', 'rejected'])
            .order_by('-created_at')[:50]
        )
        results = []
        for b in books:
            file_url = b.file.url if b.file else None
            results.append({
                "id": str(b.id),
                "title": b.titre,
                "author_name": b.auteur or "Auteur non renseigné",
                "publisher_name": b.publisher.company_name if b.publisher else "N/A",
                "discipline": b.discipline.name if b.discipline else "Non classé",
                "format": b.get_format_type_display() if hasattr(b, 'get_format_type_display') else b.format_type,
                "status": b.status,
                "submitted_at": b.created_at.isoformat() if b.created_at else None,
                "reviewed_at": b.updated_at.isoformat() if b.updated_at else None,
                "file_url": file_url,
                "page_count": b.page_count,
                "lcp_compliant": b.protection_type == 'lcp',
            })
        return Response({"success": True, "data": results, "error": None})

Ne PAS inventer de champ "reviewer_name"/"submitted_by"/"reviewed_by" tant qu'aucune relation
réelle (qui a soumis, qui a validé) n'existe sur le modèle Ouvrage ou un modèle lié — chercher
d'abord s'il existe un JournalAuditAdmin ou équivalent qui trace déjà l'action
"APPROVE_BAT_AND_PUBLISH" par livre (déjà utilisé dans process_validation plus bas dans ce même
fichier) ; si oui, l'utiliser pour retrouver le dernier validateur réel d'un livre donné (une
requête JournalAuditAdmin.objects.filter(ressource_type="Ouvrage", ressource_id=str(b.id),
action="APPROVE_BAT_AND_PUBLISH").order_by('-created_at').first()) ; sinon, omettre ces champs
du payload plutôt que d'inventer un nom.

Étape 2 — Remplacer le bloc except par une gestion d'erreur qui NE cache PAS le problème :

    def list(self, request):
        import logging
        logger = logging.getLogger(__name__)
        try:
            ... (code de l'étape 1)
            return Response({"success": True, "data": results, "error": None})
        except Exception as e:
            logger.error(f"[AdminValidationViewSet.list] Erreur : {e}", exc_info=True)
            return Response(
                {"success": False, "data": [], "error": "Erreur lors du chargement de la file de validation. Consultez les logs serveur."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

Ne jamais renvoyer "success": True quand une exception a été effectivement levée — c'est le
défaut le plus grave à corriger dans cette fiche.

Vérification :
1. `python manage.py check`.
2. Écrire un test qui crée un Ouvrage avec discipline et publisher réels, appelle GET
   /api/v1/admin/validation/ authentifié en admin, et vérifie : (a) statut 200, (b) que
   author_name/publisher_name/discipline contiennent des chaînes réelles correspondant aux
   objets créés (pas "Éditions LAHA" générique), (c) que page_count correspond à la vraie
   valeur du livre créé (pas 284 sauf coïncidence).
3. Écrire un second test qui force une exception (mock ou objet invalide) et vérifie que la
   réponse a bien success=False et un code 500 — pas success=True avec data=[].
4. Résumé final.
```

---

<a name="fiche-2"></a>
## 🔴 Fiche 2 — `AdminContractViewSet` : mauvais nom de modèle importé + faux contrats

### Contexte vérifié (découverte confirmée)
```python
# apps/reporting/admin_views.py — état actuel
from apps.rights.models import Contract   # ⚠️ CE MODÈLE N'EXISTE PAS
```
Le vrai modèle s'appelle **`ContratLegal`** (`apps/rights/models.py`), avec ces champs réels :
`numero_contrat`, `type_contrat`, `titre`, `contracting_party`, `parties_prenantes` (JSON),
`fichier_contrat_path`, `date_signature`, `date_expiration`, `status`, `notes`, `tags`. **Aucun
champ `royalty_rate` ni relation `author` directe** — ce ne sont pas des champs natifs de
`ContratLegal`.

Conséquence de l'import cassé : `from apps.rights.models import Contract` lève une
`ImportError` à chaque appel, donc le bloc `except Exception:` se déclenche **à chaque fois,
sans exception** — la branche "réelle" de cette vue n'a jamais pu s'exécuter une seule fois.
Tous les contrats affichés jusqu'ici sur `/admin/contracts` sont les `sample_contracts`
inventés, sans qu'aucune vraie donnée n'ait jamais pu transparaître.

### Prompt Antigravity

```
Contexte : backend Django 5.2, LAHAThèque v3.2, apps/reporting/admin_views.py::
AdminContractViewSet. IMPORTANT : exécuter après la Fiche A (permissions).

Problème confirmé : `from apps.rights.models import Contract` référence un modèle qui n'existe
pas (le vrai nom est ContratLegal). Cette ImportError déclenche systématiquement le bloc
except Exception, qui renvoie un tableau de contrats entièrement inventés
(sample_contracts) présenté avec "success": True — jamais de vraies données affichées, jamais
d'indication d'erreur visible.

Étape 1 — Corriger l'import et réécrire list() avec les vrais champs de ContratLegal :

    def list(self, request):
        import logging
        logger = logging.getLogger(__name__)
        try:
            from apps.rights.models import ContratLegal
            contracts = ContratLegal.objects.all().order_by('-created_at')[:50]
            results = []
            for c in contracts:
                results.append({
                    "id": str(c.id),
                    "contract_number": c.numero_contrat,
                    "type": c.type_contrat,
                    "title": c.titre,
                    "partner_name": c.contracting_party or "Non renseigné",
                    "parties": c.parties_prenantes,
                    "status": c.status,
                    "date_signature": c.date_signature.isoformat() if c.date_signature else None,
                    "date_expiration": c.date_expiration.isoformat() if c.date_expiration else None,
                    "file_url": c.fichier_contrat_path or None,
                    "notes": c.notes,
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                })
            return Response({"success": True, "data": results, "error": None})
        except Exception as e:
            logger.error(f"[AdminContractViewSet.list] Erreur : {e}", exc_info=True)
            return Response(
                {"success": False, "data": [], "error": "Erreur lors du chargement des contrats. Consultez les logs serveur."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

Ne PAS inclure "royalty_rate", "is_derogatory", "partner_email", "reviewed_by_juriste" dans le
payload — ces champs n'ont pas d'équivalent réel sur ContratLegal (royalty_rate vit sur un
modèle séparé RoyaltyRate lié à Ouvrage, pas à un contrat ; il n'y a pas de relation directe
contrat→auteur permettant de retrouver un email ni un juriste assigné). Si le frontend
app/(dashboard)/admin/contracts/page.tsx et contracts/[id]/page.tsx utilisent ces champs,
les lire d'abord et adapter l'affichage à ce qui existe réellement plutôt que de renvoyer des
champs vides trompeurs — signaler dans le résumé final si des champs de l'UI n'ont plus de
source de données et doivent être retirés de l'affichage.

Étape 2 — Vérifier également process_contract (l'action @action associée) : si elle référence
aussi `Contract` au lieu de `ContratLegal`, corriger de la même façon.

Vérification :
1. `python manage.py check`.
2. Écrire un test qui crée un ContratLegal réel en base, appelle GET /api/v1/admin/contracts/
   authentifié en admin, et vérifie que la réponse contient bien ce contrat avec son
   numero_contrat exact — PAS "CTR-2026-088" ni "Prof. Jean HOUNWANOU" (preuve que l'ancien
   chemin d'erreur silencieuse est éliminé).
3. Résumé final : confirmer explicitement que l'import Contract→ContratLegal était la cause
   racine du problème, et lister les champs UI frontend qui n'ont plus de source de données
   réelle si applicable.
```

---

<a name="fiche-3"></a>
## 🟠 Fiche 3 — `AdminStockViewSet` : métriques de stock jamais calculées

### Contexte vérifié
```python
# apps/commerce/models.py — modèle réel disponible, non utilisé dans AdminStockViewSet
class StockOuvrage(models.Model):
    ouvrage = models.ForeignKey('catalog.Ouvrage', related_name="stocks_entrepots")
    entrepot = models.ForeignKey(Entrepot, related_name="stocks_ouvrages")
    quantite_reelle = models.IntegerField(default=0)
    quantite_reservee = models.IntegerField(default=0)
    seuil_alerte = models.IntegerField(default=10)
```

### Prompt Antigravity

```
Contexte : backend Django 5.2, LAHAThèque v3.2, apps/reporting/admin_views.py::
AdminStockViewSet.list(). IMPORTANT : exécuter après la Fiche A.

Les identifiants d'entrepôt (nom, code, pays, ville, responsable_nom) sont déjà corrects et
réels. Seules les métriques numériques (total_items, critical_alerts par entrepôt,
totalPhysicalStock, totalStockValueXof, pendingLossAdjustments) sont codées en dur. Le modèle
StockOuvrage (apps/commerce/models.py) contient les vraies quantités par couple
ouvrage/entrepôt et existe déjà (déjà utilisé dans apps/commerce/manager_views.py).

Étape 1 — Réécrire list() pour agréger les vraies quantités :

    from django.db.models import Sum, Count, F, Q

    def list(self, request):
        from apps.commerce.models import Entrepot, StockOuvrage
        warehouses = Entrepot.objects.filter(is_active=True).annotate(
            total_items=Sum('stocks_ouvrages__quantite_reelle'),
            critical_alerts=Count(
                'stocks_ouvrages',
                filter=Q(stocks_ouvrages__quantite_reelle__lte=F('stocks_ouvrages__seuil_alerte'))
            ),
        )
        wh_results = []
        for w in warehouses:
            wh_results.append({
                "id": str(w.id),
                "name": w.nom,
                "code": w.code,
                "country": w.pays,
                "city": w.ville,
                "manager_name": w.responsable_nom or "Non assigné",
                "total_items": w.total_items or 0,
                "critical_alerts": w.critical_alerts or 0,
            })

        # Totaux globaux réels (pas de fallback fictif si vide — 0 est une vraie réponse)
        global_totals = StockOuvrage.objects.aggregate(
            total_physical=Sum('quantite_reelle'),
        )
        total_physical_stock = global_totals['total_physical'] or 0

        # Valeur totale du stock = quantité réelle * prix papier de chaque ouvrage
        from apps.catalog.models import Ouvrage
        stock_value = 0.0
        for s in StockOuvrage.objects.select_related('ouvrage').all():
            stock_value += float(s.ouvrage.price_paper) * s.quantite_reelle

        pending_loss_adjustments = StockOuvrage.objects.filter(
            quantite_reelle__lt=F('seuil_alerte')
        ).count()

        return Response({
            "success": True,
            "data": {
                "totalPhysicalStock": total_physical_stock,
                "totalStockValueXof": stock_value,
                "totalWarehouses": len(wh_results),
                "pendingLossAdjustments": pending_loss_adjustments,
                "warehouses": wh_results,
            },
            "error": None,
        })

Attention performance : la boucle sur StockOuvrage pour calculer stock_value fait une requête
par ligne à cause de select_related mal exploité si le nombre d'ouvrages en stock est élevé —
si des milliers de lignes StockOuvrage existent, remplacer par une agrégation ORM directe :
    from django.db.models import ExpressionWrapper, DecimalField
    stock_value = StockOuvrage.objects.aggregate(
        v=Sum(ExpressionWrapper(F('quantite_reelle') * F('ouvrage__price_paper'), output_field=DecimalField()))
    )['v'] or 0.0
Utiliser cette version optimisée directement plutôt que la boucle si le temps le permet.

Étape 2 — Retirer complètement le fallback `if not wh_results: wh_results = [...]` avec les
entrepôts fictifs (Gaston Sossou, Moussa Ndiaye, Kouamé Konan) — une liste vide légitime doit
rester vide, pas être remplacée par des données inventées.

Vérification :
1. `python manage.py check`.
2. Test avec un Entrepot + StockOuvrage de test créés en base : vérifier que total_items et
   critical_alerts reflètent exactement les quantités créées.
3. Résumé final.
```

---

<a name="fiche-4"></a>
## 🟡 Fiche 4 — `/admin/sales/details` : page 100% statique

### Prompt Antigravity

```
Contexte : backend + frontend, LAHAThèque v3.2. IMPORTANT : exécuter après la Fiche A.

app/(dashboard)/admin/sales/details/page.tsx affiche un tableau COUNTRY_SALES 100% codé en
dur, sans aucun appel API. Objectif : créer l'agrégation réelle par pays.

PARTIE BACKEND — apps/reporting/admin_views.py, nouvelle vue :

    class AdminSalesByCountryAPIView(APIView):
        """
        GET /api/v1/admin/sales/by-country/
        Ventilation géographique des ventes réelles (commandes payées).
        """
        permission_classes = [permissions.IsAuthenticated, IsAdminOrSuperAdmin]

        def get(self, request):
            from apps.commerce.models import LigneCommande
            from django.db.models import Sum, Count

            rows = (
                LigneCommande.objects
                .filter(commande__statut_paiement='paid')
                .values('commande__user__country')
                .annotate(
                    sales_count=Count('id'),
                    total_revenue=Sum(models.F('unit_price') * models.F('quantity')),
                )
                .order_by('-total_revenue')
            )

            country_names = {
                'BJ': "Bénin (BJ)", 'CI': "Côte d'Ivoire (CI)", 'SN': "Sénégal (SN)",
                'NE': "Niger (NE)", 'TG': "Togo (TG)", 'GA': "Gabon (GA)", 'CD': "RDC (CD)",
            }
            results = [
                {
                    "country": country_names.get(r['commande__user__country'], r['commande__user__country'] or "Non renseigné"),
                    "code": r['commande__user__country'] or "N/A",
                    "salesCount": r['sales_count'],
                    "totalRevenue": float(r['total_revenue'] or 0),
                }
                for r in rows
            ]
            return Response({"success": True, "data": results, "error": None})

Enregistrer la route dans apps/reporting/admin_urls.py :
    path('sales/by-country/', AdminSalesByCountryAPIView.as_view(), name='admin-sales-by-country'),

PARTIE FRONTEND — app/(dashboard)/admin/sales/details/page.tsx :
1. Ajouter dans lib/services/admin.ts :
    export interface CountrySales { country: string; code: string; salesCount: number; totalRevenue: number; }
    export async function getAdminSalesByCountry(): Promise<CountrySales[]> {
      try {
        const res = await fetch('/api/bff/admin/sales/by-country', { cache: 'no-store' });
        if (res.ok) {
          const json = await res.json();
          if (json && json.success && Array.isArray(json.data)) return json.data;
        }
        console.error(`[Admin Service] Réponse HTTP ${res.status} sur getAdminSalesByCountry.`);
      } catch (err) {
        console.error('[Admin Service] Erreur réseau sur getAdminSalesByCountry.', err);
      }
      return [];
    }
   (retourner [] en cas d'échec, PAS un tableau de pays inventés — cette page n'a pas de mock
   historique à préserver, contrairement à d'autres fonctions du fichier.)
2. Remplacer COUNTRY_SALES codé en dur par un chargement réel (useState + useEffect au montage
   du composant), avec un état de chargement et un état vide explicite ("Aucune vente
   enregistrée par pays pour le moment").

Vérification :
1. `python manage.py check`, `npx tsc --noEmit`.
2. Résumé final.
```

---

<a name="fiche-5"></a>
## 🟡 Fiche 5 — `/admin/sales/subscriptions` : page 100% statique

### Prompt Antigravity

```
Contexte : backend + frontend, LAHAThèque v3.2. IMPORTANT : exécuter après la Fiche A.

app/(dashboard)/admin/sales/subscriptions/page.tsx affiche MOCK_SUBSCRIPTIONS, un tableau
littéralement nommé "mock", jamais remplacé. apps/commerce/models.py::Subscription et
SubscriptionPlan existent déjà et sont réels (déjà utilisés dans la Fiche C pour les revenus).

PARTIE BACKEND — apps/reporting/admin_views.py, nouvelle vue :

    class AdminSubscriptionsListAPIView(APIView):
        """
        GET /api/v1/admin/subscriptions/
        Liste des abonnements et bouquets institutionnels actifs/expirés.
        """
        permission_classes = [permissions.IsAuthenticated, IsAdminOrSuperAdmin]

        def get(self, request):
            from apps.commerce.models import Subscription
            from django.utils import timezone

            subs = Subscription.objects.select_related('user', 'institution', 'plan').order_by('-starts_at')[:100]
            now = timezone.now()
            results = []
            for s in subs:
                if s.institution:
                    holder = s.institution.nom if hasattr(s.institution, 'nom') else str(s.institution)
                    sub_type = "institution_bouquet"
                elif s.user:
                    holder = f"{s.user.first_name} {s.user.last_name}".strip() or s.user.email
                    sub_type = "individuel"
                else:
                    holder = "N/A"
                    sub_type = "individuel"

                if not s.is_active or s.expires_at < now:
                    computed_status = "expired"
                elif (s.expires_at - now).days <= 30:
                    computed_status = "expiring_soon"
                else:
                    computed_status = "active"

                results.append({
                    "id": str(s.id),
                    "name": s.plan.name if s.plan else "N/A",
                    "type": sub_type,
                    "holder": holder,
                    "activeUsers": s.plan.max_concurrent_users if s.plan else 1,
                    "expiresAt": s.expires_at.isoformat() if s.expires_at else None,
                    "amount": float(s.plan.price_amount) if s.plan else 0.0,
                    "status": computed_status,
                })
            return Response({"success": True, "data": results, "error": None})

Vérifier le nom exact du champ d'affichage sur Institution (nom supposé — le confirmer dans
apps/partners/models.py avant d'écrire ce code, ne pas supposer sans vérification).

Enregistrer la route dans apps/reporting/admin_urls.py :
    path('subscriptions/', AdminSubscriptionsListAPIView.as_view(), name='admin-subscriptions-list'),

PARTIE FRONTEND :
1. Ajouter getAdminSubscriptions() dans lib/services/admin.ts sur le même modèle que
   getAdminSalesByCountry() de la Fiche 4 (retour [] en cas d'échec, pas de mock).
2. Dans app/(dashboard)/admin/sales/subscriptions/page.tsx, retirer MOCK_SUBSCRIPTIONS et
   charger les vraies données au montage.

Vérification :
1. `python manage.py check`, `npx tsc --noEmit`.
2. Résumé final.
```

---

<a name="fiche-6"></a>
## 🟢 Fiche 6 — `/admin/catalog/protection` orpheline + historique de prix

### Prompt Antigravity

```
Contexte : frontend Next.js 16, LAHAThèque v3.2.

Partie A — Page orpheline app/(dashboard)/admin/catalog/protection/page.tsx :
Cette page n'est plus référencée dans components/dashboard-sidebar.tsx (vérifier avec un grep
avant d'agir, au cas où un lien existerait ailleurs que la sidebar — chercher
"catalog/protection" dans tout app/ et components/). Elle fait doublon avec
app/(dashboard)/admin/settings/drm/page.tsx qui, elle, est correctement branchée sur
saveDrmGlobalSettings() (lib/services/protection.ts) et bien liée dans le menu.

Décision à documenter dans le résumé plutôt qu'à prendre seul si ambiguë : si aucune autre
référence n'existe et que le contenu de catalog/protection/page.tsx est bien un sous-ensemble
de ce que fait déjà settings/drm/page.tsx, supprimer le fichier
app/(dashboard)/admin/catalog/protection/page.tsx entièrement (et son dossier s'il devient
vide). Si le fichier contient une fonctionnalité absente de settings/drm (comparer les deux
formulaires champ par champ avant de trancher), ne pas le supprimer et à la place le rebrancher
sur saveDrmGlobalSettings() en réutilisant le même pattern que settings/drm/page.tsx, puis
ajouter un lien vers cette page dans la sidebar au bon endroit.

Partie B — app/(dashboard)/admin/catalog/pricing/history/page.tsx :
PRICE_HISTORY_LOGS est un tableau statique. Aucun modèle backend d'historique de prix
n'existe actuellement (à confirmer par recherche : grep "PriceHistory\|HistoriquePrix\|prix.*log"
dans apps/catalog/models.py et apps/reporting/models.py avant de conclure à son absence).

Si aucun modèle n'existe : ne PAS créer de nouveau modèle dans cette fiche (c'est un chantier
plus large, à traiter séparément avec une vraie réflexion sur ce qui doit être tracé et quand).
À la place :
1. Remplacer le contenu factice par un état "Fonctionnalité en cours de construction — la
   traçabilité des changements de prix sera disponible après implémentation du modèle
   d'historique côté backend", avec un lien de retour vers /admin/catalog/pricing.
2. Retirer les données PRICE_HISTORY_LOGS inventées (noms de personnes, montants, dates)
   complètement du code plutôt que de les laisser en dur même déconnectées de l'affichage
   principal.

Si un modèle équivalent existe déjà sous un autre nom : le signaler dans le résumé et proposer
de le brancher dans une fiche dédiée ultérieure plutôt que de le faire dans la foulée sans
validation.

Vérification :
1. `npx tsc --noEmit`.
2. Résumé final : décision prise sur catalog/protection (supprimée / rebranchée) et sur
   pricing/history (état "en construction" affiché / modèle trouvé et à traiter séparément).
```

---

## ✅ Checklist de fin de session

- [ ] `python manage.py check` et `npx tsc --noEmit` sans erreur sur chaque fiche
- [ ] Aucun `except Exception` (sans variable ni log) ne renvoie plus `"success": True` sur une
      vraie erreur
- [ ] Aucun nom de champ Django utilisé sans avoir été vérifié dans le modèle réel au préalable
- [ ] Aucune liste vide légitime n'est plus remplacée par un jeu de données inventé
