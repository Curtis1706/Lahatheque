# 🛠️ Fiche — Page d'accueil Admin toujours mockée + Tarification Catalogue

**Contexte** : capture d'écran de `/admin` en conditions réelles révèle une incohérence
flagrante — "Chiffre d'affaires cumulé : 10 000 FCFA" en haut de page, mais "Progression des
Ventes & Revenus : 28 450 000 FCFA" plus bas, pour ce qui devrait être la même donnée. Enquête
menée : la Fiche C avait bien corrigé le **backend** (`AdminPanoramicStatsAPIView`), mais deux
composants de la page d'accueil admin (`app/(dashboard)/admin/page.tsx`) n'ont **jamais été
branchés** sur ces vraies données — ils utilisent des valeurs de démonstration codées en dur
directement dans le JSX/les props par défaut du composant.

**Règle générale** : lire les fichiers en entier avant modification, vérifier avec
`npx tsc --noEmit` / `python manage.py check` après chaque partie, traiter un point à la fois.

---

## Partie 1 — 🔴 `TotalSalesChart` entièrement décoratif, jamais connecté à l'API

### Contexte vérifié
```tsx
// app/(dashboard)/admin/page.tsx — ligne ~301
<TotalSalesChart onReportClick={() => (window.location.href = "/admin/reports")} />
// Aucune prop de données passée !

// components/ui/total-sales-chart.tsx — valeurs par défaut du composant
export function TotalSalesChart({
  totalAmountText = "28.450.000 FCFA",
  channels = [
    { name: "Ventes numériques unitaires", amount: 12400000, change: "+18.2%", isPositive: true },
    { name: "Bouquets Universités (B2B)", amount: 9800000, change: "+12.0%", isPositive: true },
    { name: "Abonnements Lecteur & Pass", amount: 4250000, change: "+8.5%", isPositive: true },
    { name: "Livres physiques (papier)", amount: 2000000, change: "-3.1%", isPositive: false },
  ],
  ...
```
La courbe elle-même (`generatePoints`) est une fonction qui génère des points **synthétiques
selon des tableaux codés en dur par période** (`1d`, `1w`, `1m`, `3m`, `1y`), jamais dérivée de
données réelles. `getRevenueCategoryBreakdown()` (déjà fonctionnelle côté service depuis la
Fiche C) n'est même pas importée dans `admin/page.tsx`.

### Prompt Antigravity

```
Contexte : frontend Next.js 16, LAHAThèque v3.2. IMPORTANT : le backend est déjà correct
(apps/reporting/admin_views.py::AdminPanoramicStatsAPIView calcule réellement salesCurve et
revenueBreakdown depuis LigneCommande/Subscription) — le problème est uniquement que le
composant TotalSalesChart n'est jamais alimenté avec ces données réelles.

Étape 1 — Dans app/(dashboard)/admin/page.tsx, importer et appeler getRevenueCategoryBreakdown
en plus des fonctions déjà chargées (getAdminKpis fournit déjà kpis.salesCurve et
kpis.totalRevenue/kpis.revenueTrend — vérifier dans lib/services/admin.ts::getAdminKpis()
lequel de ces deux appels (getAdminKpis vs getRevenueCategoryBreakdown) porte réellement
salesCurve, pour ne pas dupliquer un appel réseau inutile) :

    import { getAdminKpis, getRoleDistribution, getAdminSales, getAdminReminders, getRevenueCategoryBreakdown } from "@/lib/services/admin";
    import { RevenueCategoryBreakdown } from "@/lib/types/admin";

    const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueCategoryBreakdown[]>([]);
    // dans loadData(), ajouter à Promise.all :
    const [kpiData, rolesData, salesData, remindersData, revenueBreakdownData] = await Promise.all([
      getAdminKpis(),
      getRoleDistribution(),
      getAdminSales(),
      getAdminReminders(),
      getRevenueCategoryBreakdown(),
    ]);
    ...
    setRevenueBreakdown(revenueBreakdownData);

Étape 2 — Transformer les données réelles vers les props attendues par TotalSalesChart et les
passer explicitement (ne plus laisser le composant sur ses valeurs par défaut) :

    <TotalSalesChart
      totalAmountText={`${(kpis?.totalRevenue ?? 0).toLocaleString("fr-FR")} FCFA`}
      growthBadgeText={`${(kpis?.revenueTrend ?? 0) >= 0 ? "+" : ""}${kpis?.revenueTrend ?? 0}%`}
      channels={revenueBreakdown.map((c) => ({
        name: c.label,
        amount: c.amount,
        change: `${c.percentage >= 0 ? "+" : ""}${c.percentage}%`,
        isPositive: c.percentage >= 0,
      }))}
      onReportClick={() => (window.location.href = "/admin/reports")}
    />

Étape 3 — La courbe interne du graphique (generatePoints, fonction locale au composant) génère
des points synthétiques par période et n'a aucun moyen de recevoir de vraies données
actuellement (pas de prop `points` ou `curveData` dans TotalSalesChartProps). Deux options,
à choisir selon la complexité acceptable pour cette fiche :
(a) Étendre TotalSalesChartProps avec une prop optionnelle `curvePoints?: number[]` que le
    composant utilise à la place de generatePoints(selectedPeriod) quand elle est fournie,
    et alimenter cette prop depuis kpis.salesCurve (mapper les 6 points mensuels réels sur une
    échelle 0-100 comme le fait generatePoints) — uniquement pour la période "1m"/"3m" faute de
    données quotidiennes réelles disponibles côté backend actuellement ;
(b) Si (a) est jugé trop complexe pour cette fiche, a minima remplacer le sélecteur de période
    (1J/1S/1M/3M/1A) par un unique badge "6 derniers mois" et n'afficher que la courbe réelle
    calculée depuis kpis.salesCurve, en supprimant l'interactivité de changement de période
    plutôt que de la laisser générer de fausses courbes pour les périodes non couvertes par de
    vraies données.
Choisir l'option (a) si le temps le permet, sinon (b). Documenter le choix fait dans le résumé
final.

Étape 4 — Vérifier que RevenueCategoryBreakdown (lib/types/admin.ts) a bien les champs label,
amount, percentage utilisés ci-dessus — les lire avant d'écrire le mapping, adapter les noms
exacts si différents.

Vérification :
1. `npx tsc --noEmit`.
2. Test manuel : le montant total affiché en haut de "Progression des Ventes & Revenus" doit
   désormais être VISUELLEMENT IDENTIQUE (ou cohérent, mêmes ordres de grandeur) au "Chiffre
   d'Affaires Cumulé" affiché en haut de la même page — plus aucune divergence du type
   "10 000 FCFA" vs "28 450 000 FCFA" sur les mêmes données.
3. Résumé final : option (a) ou (b) choisie pour la courbe, et confirmation qu'aucune valeur
   par défaut du composant (28.450.000, 12400000, 9800000, 4250000, 2000000) n'apparaît plus
   dans le rendu réel de la page.
```

---

## Partie 2 — 🔴 Les 6 cartes KPI : mini-graphiques et deltas hardcodés dans le JSX

### Contexte vérifié
```tsx
// app/(dashboard)/admin/page.tsx — répété à l'identique sur les 6 cartes
<ProgressMetricCard
  title="Chiffre d'Affaires Cumulé"
  total={`${(kpis?.totalRevenue || 28450000).toLocaleString("fr-FR")} FCFA`}
  percent={`+${kpis?.revenueTrend || 14.5}%`}
  delta="+3.4M FCFA"
  deltaLabel="ce mois"
  data={[
    { value: 18000000, date: "01 Mar" },
    { value: 21500000, date: "08 Mar" },
    { value: 24800000, date: "15 Mar" },
    { value: 28450000, date: "22 Mar" }
  ]}
/>
```
Deux défauts distincts :
1. **`data={[...]}` est un tableau 100% statique**, jamais recalculé depuis `kpis` — c'est ce
   qui produit le mini-graphique "Peak: 28,4M · Avg: 23,2M" totalement déconnecté du vrai total
   affiché juste à côté.
2. **`delta`/`deltaLabel`** (`"+3.4M FCFA"`, `"+142 transactions"`, `"+380 comptes"`, `"-4
   dossiers traités"`, `"-3 relances réglées"`) sont des **chaînes de texte codées en dur**,
   affichées sur toutes les cartes indépendamment de l'activité réelle.
3. **Bug additionnel** : `kpis?.totalRevenue || 28450000` utilise `||`, pas `??` — si
   `totalRevenue` vaut légitimement `0` (base fraîchement vidée), `0` est falsy en JavaScript
   et affichera quand même `28450000` au lieu de `0`. Même défaut sur `salesTrend`,
   `usersTrend`, `revenueTrend`.

### Prompt Antigravity

```
Contexte : frontend Next.js 16, LAHAThèque v3.2, fichier app/(dashboard)/admin/page.tsx.
IMPORTANT : exécuter après la Partie 1 de cette même fiche.

Aucune donnée historique quotidienne/hebdomadaire fiable n'existe côté backend pour la plupart
de ces métriques (utilisateurs actifs, consultations, dépôts en attente, relances) — seule la
donnée de revenu (kpis.salesCurve, 6 points mensuels réels) existe. Il ne faut donc PAS
inventer de fausses séries temporelles pour les 5 autres cartes : les retirer plutôt que de les
remplacer par un nouvel ensemble de chiffres tout aussi fictifs.

Étape 1 — Corriger le bug ?? vs || sur les 6 cartes : remplacer chaque
`kpis?.xxx || <valeur par défaut>` par `kpis?.xxx ?? <valeur par défaut>` pour totalRevenue,
revenueTrend, totalSales, salesTrend, totalConsultations, activeUsers, usersTrend,
pendingSubmissions, pendingUnpaidInvoices — de sorte qu'une vraie valeur 0 s'affiche comme 0,
pas comme la valeur de démonstration.

Étape 2 — Carte "Chiffre d'Affaires Cumulé" (seule carte pour laquelle une vraie donnée
temporelle existe, via kpis.salesCurve) :
    data={
      (kpis?.salesCurve ?? []).map((point) => ({
        value: point.total,
        date: point.month,
      }))
    }
Si kpis?.salesCurve est vide (base sans historique), passer un tableau vide plutôt qu'une
donnée inventée — vérifier que ProgressMetricCard gère proprement un tableau `data` vide
(pas de crash) ; si le composant suppose au moins 2 points pour tracer une ligne, lire
components/ui/progress-metric-card.tsx pour voir comment il gère ce cas et, si besoin, afficher
un état "Historique insuffisant" plutôt qu'un graphique vide cassé.

Étape 3 — Pour les 5 autres cartes (Ventes Totales, Consultations d'Ouvrages, Utilisateurs
Actifs, Dépôts & Maquettes en Attente, Factures & Impayés en Retard) : retirer complètement la
prop `data={[...]}` (ne pas la remplacer par un tableau vide si cela casse visuellement la
carte — dans ce cas, lire progress-metric-card.tsx pour voir si `data` est une prop optionnelle
et si son absence bascule proprement vers un rendu sans mini-graphique).

Étape 4 — Retirer les props `delta` et `deltaLabel` codées en dur ("+3.4M FCFA", "+142
transactions", "+380 comptes", "-4 dossiers traités", "-3 relances réglées") sur ces 5 cartes,
sauf si une vraie donnée de comparaison période-précédente existe côté backend (vérifier dans
apps/reporting/admin_views.py::AdminPanoramicStatsAPIView si un champ équivalent a été ajouté
depuis — sinon, ne pas en inventer un dans cette fiche, se contenter de retirer l'affichage
trompeur).

Étape 5 — Vérification :
1. `npx tsc --noEmit`.
2. Test manuel : recharger /admin avec les vraies données actuelles de la base (16 utilisateurs
   selon l'export CSV vu précédemment) et confirmer qu'aucune carte n'affiche plus un delta ou
   un mini-graphique qui ne peut pas être justifié par une vraie donnée backend.
3. Résumé final : lister, carte par carte, ce qui a été retiré vs conservé, et pourquoi.
```

---

## Partie 3 — 🟠 `AdminCatalogPricingViewSet` : mauvais noms de champs + crash de sérialisation probable

### Contexte vérifié
```python
# apps/reporting/admin_views.py::AdminCatalogPricingViewSet.list() — état actuel
price_num = float(b.prix_numerique_xof) if getattr(b, 'prix_numerique_xof', None) is not None else def_num
price_pap = float(b.prix_papier_xof) if getattr(b, 'prix_papier_xof', None) is not None else def_pap
has_custom = getattr(b, 'a_prix_specifique', False)
...
"title": b.titre,                                          # OK — alias @property réel
"publisher_name": getattr(b, 'editeur_nom', 'Éditions LAHA'),  # champ inexistant, fallback systématique
"discipline": getattr(b, 'discipline', 'Droit'),            # champ RÉEL (FK) — retourne l'OBJET Discipline, pas son nom
"status": getattr(b, 'statut', 'published'),                # champ inexistant, fallback systématique
```
Champs réels du modèle `Ouvrage` (`apps/catalog/models.py`) : `title`, `isbn`, `publisher` (FK
vers `Publisher`), `discipline` (FK vers `Discipline`), `status`, `price_digital`,
`price_paper`. **Aucun champ `prix_numerique_xof`, `prix_papier_xof`, `a_prix_specifique`,
`editeur_nom`, `statut` n'existe.** Le champ `discipline` étant un vrai FK, `getattr(b,
'discipline', 'Droit')` retourne l'**instance du modèle** (pas une chaîne), ce qui provoque une
erreur de sérialisation JSON dès qu'un livre a une discipline non nulle.

### Prompt Antigravity

```
Contexte : backend Django 5.2, LAHAThèque v3.2, apps/reporting/admin_views.py::
AdminCatalogPricingViewSet.list(). IMPORTANT : exécuter après la Fiche A (permission déjà en
place, ne pas la retoucher).

Problème confirmé par lecture du modèle réel (apps/catalog/models.py::Ouvrage) : cette vue
utilise des noms de champs qui n'existent pas (prix_numerique_xof, prix_papier_xof,
a_prix_specifique, editeur_nom, statut, isbn en dur comme fallback), masqués par des getattr()
avec valeur de repli qui empêchent un crash mais faussent silencieusement toutes les données
affichées. Pire : "discipline": getattr(b, 'discipline', 'Droit') renvoie l'objet Discipline
complet (pas une chaîne) pour tout livre ayant une discipline assignée, ce qui provoque une
erreur de sérialisation JSON au niveau de Response() — CONFIRMER ce point en premier avant
correction en écrivant un test qui crée un Ouvrage avec une discipline non nulle et appelle
l'endpoint, pour vérifier si ça lève bien une exception avant correction (documenter le
comportement observé dans le résumé final).

Objectif : réécrire list() avec les vrais champs.

    def list(self, request):
        config = ConfigurationPlateformeGlobale.objects.first()
        def_num = float(config.prix_defaut_numerique_xof) if config else 3000.0
        def_pap = float(config.prix_defaut_papier_xof) if config else 5000.0

        books = (
            Ouvrage.objects
            .select_related('publisher', 'discipline')
            .all()
            .order_by('-created_at')[:100]
        )
        results = []
        for b in books:
            price_num = float(b.price_digital) if b.price_digital is not None else def_num
            price_pap = float(b.price_paper) if b.price_paper is not None else def_pap
            # "Prix spécifique" = le livre a un prix différent des valeurs par défaut de la plateforme
            has_custom = (
                b.price_digital is not None and float(b.price_digital) != def_num
            ) or (
                b.price_paper is not None and float(b.price_paper) != def_pap
            )

            results.append({
                "id": str(b.id),
                "isbn": b.isbn or "",
                "title": b.titre,
                "publisher_name": b.publisher.company_name if b.publisher else "N/A",
                "discipline": b.discipline.name if b.discipline else "Non classé",
                "price_digital": price_num,
                "price_paper": price_pap,
                "uses_default_pricing": not has_custom,
                "status": b.status,
            })

        return Response({"success": True, "data": results, "error": None})

Vérifier le nom exact du champ sur Publisher (company_name supposé ici — le confirmer en lisant
apps/publishers_portal/models.py avant d'écrire ce code) et sur Discipline (name supposé — le
confirmer dans apps/catalog/models.py::Discipline avant d'écrire ce code). Ne pas supposer ces
noms sans vérification, contrairement à ce qui a été fait la première fois.

Concernant sales_count et consultation_count (actuellement hardcodés à 48 et 520 pour chaque
livre, non traités par ce prompt) : les retirer de la réponse plutôt que de les laisser
trompeurs, SAUF si une agrégation réelle simple est possible en réutilisant LigneCommande et
TraceAcces (déjà utilisés ailleurs dans ce même fichier pour d'autres vues) — si le temps le
permet dans cette même fiche, les calculer réellement avec :
    from apps.commerce.models import LigneCommande
    from apps.protection.models import TraceAcces
    # pour chaque livre b :
    sales_count = LigneCommande.objects.filter(ouvrage=b, commande__statut_paiement='paid').aggregate(t=Sum('quantity'))['t'] or 0
    consultation_count = TraceAcces.objects.filter(ouvrage=b).count()
Attention à la performance : ne pas faire ces deux requêtes dans la boucle for sans
optimisation si le nombre de livres est important (risque de N+1 x2) — si le temps ne permet
pas d'optimiser proprement avec des annotate() globaux, retirer purement et simplement ces deux
champs de la réponse pour cette fiche plutôt que de réintroduire un problème de performance.

Vérification :
1. `python manage.py check`.
2. Écrire un test dans apps/reporting/tests/ qui crée un Ouvrage avec un Publisher et une
   Discipline réels, appelle GET /api/v1/admin/catalog/pricing/ authentifié en admin, et
   vérifie que la réponse est 200 (pas 500) et que publisher_name/discipline contiennent bien
   des chaînes de caractères (pas des objets).
3. Résumé final : confirmer si l'ancien code plantait réellement (preuve du test avant/après),
   et détailler le choix fait sur sales_count/consultation_count (calculés réellement ou
   retirés).
```

---

## ✅ Checklist de fin de session

- [ ] `python manage.py check` et `npx tsc --noEmit` sans erreur sur chaque partie
- [ ] Le montant affiché dans "Progression des Ventes & Revenus" correspond au vrai chiffre
      d'affaires, plus de divergence type "10 000 FCFA" vs "28 450 000 FCFA"
- [ ] Aucune carte KPI de `/admin` n'affiche de mini-graphique ou de delta non justifié par une
      vraie donnée backend
- [ ] `/admin/catalog/pricing` répond 200 avec de vraies données par livre, testé avec un livre
      ayant une discipline assignée
