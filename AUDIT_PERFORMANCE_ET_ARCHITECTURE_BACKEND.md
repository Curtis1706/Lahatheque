# AUDIT FACTUEL — PERFORMANCE, ARCHITECTURE ET OPTIMISATION BACKEND (DJANGO)

> Audit realise a des fins de diagnostic et de documentation prealable. Aucune modification de code n'est appliquee. Ce document sert de base a la redaction de fiches de correction ciblees.

---

## SECTION 1 — Requetes N+1 (requetes base de donnees dans des boucles)

Audit realise sur l'ensemble des 8 applications specifiees : `rights`, `catalog`, `commerce`, `reporting`, `protection`, `audio`, `publishers_portal`, `partners`.

---

### 1. Inventaire des boucles contenant des requetes ORM par application

#### Application : rights (57 occurrences detectees)

1. **apps/rights/views.py (lignes 63-66)**
   - Methode : `compute_author_royalties_summary`
   - Ligne de boucle : 63 (`for b in books:`)
   - Requete interne : ligne 64 (`RepartitionDroits.objects.filter(ouvrage=b, user=user).first()`)
   - Modele interroge : `RepartitionDroits`
   - Iterations typiques : 1 a 20 ouvrages par auteur

2. **apps/rights/views.py (lignes 139-148)**
   - Methode : `get_author_quarter_books`
   - Ligne de boucle : 139 (`for b in books:`)
   - Requete interne : ligne 146 (`RepartitionDroits.objects.filter(ouvrage=b, user=user).first()`)
   - Modele interroge : `RepartitionDroits`
   - Iterations typiques : 1 a 20 ouvrages par auteur

3. **apps/rights/views.py (lignes 364-421)**
   - Methode : `AuthorDashboardView.get`
   - Ligne de boucle : 364 (`for b in ouvrages:`) (itrant sur `Ouvrage.objects.filter(...)[:10]`)
   - Requetes internes executees pour chaque livre :
     - Ligne 365 : `LigneCommande.objects.filter(ouvrage=b, commande__statut_paiement='completed')`
     - Ligne 369 : `WholesaleOrderItem.objects.filter(ouvrage=b, order__status='completed')`
     - Ligne 374 : `TraceAcces.objects.filter(ouvrage=b, access_type='read_online')`
     - Ligne 381 : `TraceAcces.objects.filter(ouvrage=b, bouquet_subscription__isnull=False)`
     - Ligne 388 : `RepartitionDroits.objects.filter(ouvrage=b, user=user).first()`
     - Ligne 398 : `StockOuvrage.objects.filter(ouvrage=b).first()`
     - Ligne 402 : `MouvementStock.objects.filter(ouvrage=b)`
   - Modeles interroges : `LigneCommande`, `WholesaleOrderItem`, `TraceAcces`, `RepartitionDroits`, `StockOuvrage`, `MouvementStock`
   - Iterations typiques : 5 a 10 ouvrages (declenche 70 a 140 requetes SQL sequentielles a chaque consultation de la page)

4. **apps/rights/views.py (lignes 2148-2165)**
   - Methode : `LegalContractBulkApproveView.post`
   - Ligne de boucle : 2148 (`for contract_id in contract_ids:`)
   - Requete interne : ligne 2149 (`ContratLegal.objects.get(id=contract_id)`)
   - Modele interroge : `ContratLegal`
   - Iterations typiques : 5 a 50 contrats

5. **apps/rights/views.py (lignes 2559-2625)**
   - Methode : `AdminRoyaltiesConsolidatedReportView.get`
   - Ligne de boucle : 2559 (`for b in books:`)
   - Requetes internes :
     - Ligne 2561 : `LigneCommande.objects.filter(ouvrage=b, ...)`
     - Ligne 2570 : `WholesaleOrderItem.objects.filter(ouvrage=b, ...)`
     - Ligne 2580 : `RepartitionDroits.objects.filter(ouvrage=b)`
     - Ligne 2595 : `RoyaltyPayoutLine.objects.filter(ouvrage=b)`
     - Ligne 2610 : `RelanceEmailJournal.objects.filter(ouvrage=b)`
   - Modeles interroges : `LigneCommande`, `WholesaleOrderItem`, `RepartitionDroits`, `RoyaltyPayoutLine`, `RelanceEmailJournal`
   - Iterations typiques : 50 a 500 ouvrages du catalogue

6. **apps/rights/views.py (lignes 3010-3029)**
   - Methode : `AdminCreatePayoutBatchView.post`
   - Ligne de boucle : 3010 (`for author in authors:`)
   - Requetes internes :
     - Ligne 3012 : `AuthorRight.objects.filter(author=author)`
     - Ligne 3018 : `RepartitionDroits.objects.filter(user=author)`
     - Ligne 3025 : `RoyaltyRate.objects.filter(author=author)`
   - Modeles interroges : `AuthorRight`, `RepartitionDroits`, `RoyaltyRate`
   - Iterations typiques : 20 a 200 auteurs

7. **apps/rights/views.py (lignes 3968-4046)**
   - Methode : `AdminManuscriptsConsolidatedView.get`
   - Ligne de boucle : 3968 (`for item in leads:`)
   - Requete interne : ligne 3975 (`PublicManuscriptLead.objects.filter(...)`) et ligne 4012 (`ManuscriptPublicSubmission.objects.filter(...)`)
   - Modeles interroges : `PublicManuscriptLead`, `ManuscriptPublicSubmission`
   - Iterations typiques : 10 a 50 elements

8. **apps/rights/services/reconciliation_service.py (lignes 25-95)**
   - Methode : `reconcile_author_rights_for_ouvrage`
   - Ligne de boucle : 25 (`for author in authors:`)
   - Requetes internes :
     - Ligne 27 : `AuthorRight.objects.filter(ouvrage=ouvrage, author=author).first()`
     - Ligne 45 : `User.objects.filter(email=author.email).first()`
     - Ligne 82 : `AuthorRight.objects.filter(ouvrage=ouvrage)`
   - Modeles interroges : `AuthorRight`, `User`
   - Iterations typiques : 1 a 5 auteurs par livre

---

#### Application : reporting (53 occurrences detectees)

1. **apps/reporting/tasks.py (lignes 368-558)**
   - Methode : `task_calculate_monthly_royalties`
   - Ligne de boucle : 368 (`for ouvrage in active_ouvrages:`)
   - Requetes internes executees pour chaque ouvrage :
     - Ligne 372 : `RepartitionDroits.objects.filter(ouvrage=ouvrage)`
     - Ligne 390 : `LigneCommande.objects.filter(ouvrage=ouvrage, commande__statut_paiement='completed', ...)`
     - Ligne 410 : `RoyaltyRate.objects.filter(ouvrage=ouvrage).first()`
     - Ligne 435 : `ContratLegal.objects.filter(ouvrage=ouvrage, statut='actif').first()`
     - Ligne 480 : `RoyaltyPayoutLine.objects.filter(ouvrage=ouvrage, ...)`
     - Ligne 512 : `UniversityRoyaltyStatement.objects.filter(ouvrage=ouvrage, ...)`
     - Ligne 530 : `AuthorRight.objects.filter(ouvrage=ouvrage)`
   - Modeles interroges : `RepartitionDroits`, `LigneCommande`, `RoyaltyRate`, `ContratLegal`, `RoyaltyPayoutLine`, `UniversityRoyaltyStatement`, `AuthorRight`
   - Iterations typiques : 100 a 2 000 ouvrages (genere 700 a 14 000 requetes ORM)

2. **apps/reporting/admin_views.py (lignes 2774-2894)**
   - Methode : `AuthorPayoutDetailAdminView.get`
   - Ligne de boucle : 2774 (`for item in calculation_lines:`)
   - Requetes internes :
     - Ligne 2796 : `RepartitionDroits.objects.filter(id=item.repartition_id).first()`
     - Ligne 2810 : `LigneCommande.objects.filter(ouvrage_id=item.ouvrage_id, ...)`
     - Ligne 2845 : `RoyaltyPayoutLine.objects.filter(repartition_id=item.repartition_id)`
   - Modeles interroges : `RepartitionDroits`, `LigneCommande`, `RoyaltyPayoutLine`
   - Iterations typiques : 10 a 100 lignes

3. **apps/reporting/admin_views.py (lignes 2964-3020)**
   - Methode : `_reconcile_author_rights_for_user`
   - Ligne de boucle : 2964 (`for r in repartitions:`)
   - Requete interne : ligne 2973 (`AuthorRight.objects.filter(user=user, ouvrage=r.ouvrage).first()`)
   - Modele interroge : `AuthorRight`
   - Iterations typiques : 5 a 50 repartitions

4. **apps/reporting/admin_views.py (lignes 3044-3155)**
   - Methode : `PartnerPayoutDetailAdminView.get`
   - Ligne de boucle : 3044 (`for order in paper_orders:`)
   - Requetes internes :
     - Ligne 3052 : `UniversityPaperOrder.objects.filter(id=order.id)`
     - Ligne 3070 : `WholesaleOrderItem.objects.filter(...)`
     - Ligne 3110 : `PayoutRequest.objects.filter(...)`
   - Modeles interroges : `UniversityPaperOrder`, `WholesaleOrderItem`, `PayoutRequest`
   - Iterations typiques : 10 a 50 commandes papier

5. **apps/reporting/admin_views.py (lignes 3545-3567)**
   - Methode : `compute_bouquet_distribution_payload`
   - Ligne de boucle : 3545 (`for b in bouquet_books:`)
   - Requetes internes :
     - Ligne 3547 : `Institution.objects.get(id=inst_id)`
     - Ligne 3555 : `ReaderSession.objects.filter(ouvrage=b, institution_id=inst_id)`
     - Ligne 3567 : `TraceAcces.objects.filter(ouvrage=b, institution_id=inst_id)`
   - Modeles interroges : `Institution`, `ReaderSession`, `TraceAcces`
   - Iterations typiques : 20 a 200 livres par bouquet

6. **apps/reporting/tasks.py (lignes 69-113, 155-200, 242-287)**
   - Methodes : `task_scan_and_send_deposit_reminders`, `task_scan_and_send_unpaid_reminders`, `task_scan_and_send_subscription_expiry_reminders`
   - Lignes de boucle : 69, 155, 242
   - Requetes internes : lignes 113, 200, 287 (`RelanceAutomatiqueLog.objects.filter(destinataire_email=..., reference_id=...).exists()`)
   - Modele interroge : `RelanceAutomatiqueLog`
   - Iterations typiques : 10 a 200 elements a relancer

7. **apps/reporting/tasks.py (lignes 618-619, 710-785)**
   - Methodes : `check_and_generate_stock_notifications`, `check_and_generate_legal_notifications`
   - Lignes de boucle : 618, 710
   - Requetes internes : lignes 619, 711, 745, 785 (`Notification.objects.filter(...)`)
   - Modele interroge : `Notification`
   - Iterations typiques : 20 a 500 stocks ou contrats

8. **apps/reporting/tasks.py (lignes 837-876)**
   - Methode : `task_distribute_bouquet_revenue`
   - Ligne de boucle : 837 (`for sub in subscriptions:`)
   - Requetes internes :
     - Ligne 838 : `UniversityBouquetSubscription.objects.get(id=sub.id)`
     - Ligne 845 : `TraceAcces.objects.filter(bouquet_subscription=sub)`
     - Ligne 876 : `UniversityRoyaltyStatement.objects.filter(bouquet_subscription=sub)`
   - Modeles interroges : `UniversityBouquetSubscription`, `TraceAcces`, `UniversityRoyaltyStatement`
   - Iterations typiques : 5 a 30 universites abonnees

---

#### Application : commerce (27 occurrences detectees)

1. **apps/commerce/views.py (lignes 76-202)**
   - Methode : `CreateOrderView.post`
   - Ligne de boucle : 76 (`for item in items_data:`)
   - Requetes internes executees :
     - Ligne 78 : `Ouvrage.objects.get(id=item.get('ouvrage'))`
     - Ligne 82 : `AccessService.check_user_book_access(user, ouvrage)` (executant `BouquetOffering.objects.get(...)`)
     - Ligne 95 : `OuvrageLanguageVersion.objects.filter(ouvrage=ouvrage, language=lang).first()`
     - Ligne 145 : `StockOuvrage.objects.filter(ouvrage=ouvrage).first()`
     - Ligne 190 : `LigneCommande.objects.filter(commande=order, ouvrage=ouvrage)`
   - Modeles interroges : `Ouvrage`, `BouquetOffering`, `OuvrageLanguageVersion`, `StockOuvrage`, `LigneCommande`
   - Iterations typiques : 1 a 10 articles par panier

2. **apps/commerce/views.py (ligne 481)**
   - Methode : `ClientBouquetListView.get`
   - Ligne de boucle : 481 (`for bouquet in bouquets:`)
   - Requete interne : ligne 481 (`BouquetOffering.objects.filter(bouquet=bouquet)`)
   - Modele interroge : `BouquetOffering`
   - Iterations typiques : 2 a 10 bouquets

3. **apps/commerce/wholesaler_views.py (lignes 83-93)**
   - Methode : `WholesaleDashboardView.get`
   - Ligne de boucle : 83 (`for item in recent_items:`)
   - Requetes internes :
     - Ligne 86 : `StockOuvrage.objects.filter(ouvrage_id=item.ouvrage_id).first()`
     - Ligne 93 : `WholesaleOrderItem.objects.filter(order_id=item.order_id)`
   - Modeles interroges : `StockOuvrage`, `WholesaleOrderItem`
   - Iterations typiques : 10 a 50 elements recents

4. **apps/commerce/wholesaler_views.py (lignes 284-575)**
   - Methode : `WholesaleOrderCreateView.post`
   - Ligne de boucle : 284 (`for line in lines:`)
   - Requetes internes :
     - Ligne 287 : `Ouvrage.objects.get(id=line.get('ouvrage_id'))`
     - Ligne 295 : `WholesaleDiscountTier.objects.filter(profile=profile, ...)`
     - Ligne 320 : `StockOuvrage.objects.filter(ouvrage=ouvrage).first()`
     - Ligne 345 : `MouvementStock.objects.filter(ouvrage=ouvrage)`
   - Modeles interroges : `Ouvrage`, `WholesaleDiscountTier`, `StockOuvrage`, `MouvementStock`
   - Iterations typiques : 5 a 50 lignes par commande grossiste

5. **apps/commerce/manager_views.py (lignes 69-72, 857-864, 1211-1275)**
   - Methodes : `StockManagerDashboardView.get`, `StockManagerUpdateStockView.patch`, `StockManagerInventoryAuditView.get`
   - Lignes de boucle : 69, 857, 1211
   - Requetes internes :
     - Ligne 72 : `MouvementStock.objects.filter(ouvrage=item.ouvrage).first()`
     - Ligne 858 : `StockOuvrage.objects.get(id=entry.get('stock_id'))`
     - Ligne 864 : `MouvementStock.objects.filter(stock_id=entry.get('stock_id'))`
     - Ligne 1240 : `WholesaleOrder.objects.filter(items__ouvrage_id=item.id)`
   - Modeles interroges : `MouvementStock`, `StockOuvrage`, `WholesaleOrder`
   - Iterations typiques : 20 a 200 entrees de stock

6. **apps/commerce/services.py (lignes 18-43)**
   - Methode : `_unlock_order_content`
   - Ligne de boucle : 18 (`for line in order.lignes.all():`)
   - Requetes internes :
     - Ligne 22 : `StockOuvrage.objects.filter(ouvrage=line.ouvrage).first()`
     - Ligne 28 : `MouvementStock.objects.filter(ouvrage=line.ouvrage)`
     - Ligne 43 : `ReadingProgress.objects.filter(user=order.user, ouvrage=line.ouvrage).first()`
   - Modeles interroges : `StockOuvrage`, `MouvementStock`, `ReadingProgress`
   - Iterations typiques : 1 a 10 lignes par commande

---

#### Application : partners (14 occurrences detectees)

1. **apps/partners/university_views.py (lignes 99-121)**
   - Methode : `UniversityKpisView.get`
   - Ligne de boucle : 99 (`for faculty in faculties:`)
   - Requetes internes :
     - Ligne 100 : `TraceAcces.objects.filter(user__affiliation__faculty=faculty)`
     - Ligne 115 : `ReaderSession.objects.filter(user__affiliation__faculty=faculty)`
   - Modeles interroges : `TraceAcces`, `ReaderSession`
   - Iterations typiques : 5 a 20 facultes par universite

2. **apps/partners/university_views.py (lignes 465-472, 525-533)**
   - Methode : `UniversityPaperOrdersView.post`
   - Lignes de boucle : 465, 525 (`for item in items:`)
   - Requetes internes :
     - Ligne 472 : `Ouvrage.objects.get(id=item.get('ouvrage_id'))`
     - Ligne 533 : `MouvementStock.objects.filter(ouvrage_id=item.get('ouvrage_id'))`
   - Modeles interroges : `Ouvrage`, `MouvementStock`
   - Iterations typiques : 5 a 50 lignes par commande universitaire

3. **apps/partners/university_views.py (lignes 693-709)**
   - Methode : `UniversityRoyaltiesView.get`
   - Ligne de boucle : 693 (`for statement in statements:`)
   - Requetes internes :
     - Ligne 695 : `BouquetOffering.objects.filter(bouquet=statement.bouquet).first()`
     - Ligne 701 : `TraceAcces.objects.filter(bouquet_subscription=statement.subscription, ...)`
     - Ligne 709 : `RoyaltyRate.objects.filter(...)`
   - Modeles interroges : `BouquetOffering`, `TraceAcces`, `RoyaltyRate`
   - Iterations typiques : 12 a 36 releves (sur 1 a 3 ans)

4. **apps/partners/views.py (lignes 210-218)**
   - Methode : `import_students_csv`
   - Ligne de boucle : 210 (`for row in reader:`)
   - Requete interne : ligne 218 (`EtudiantInscrit.objects.filter(matricule=row['matricule']).first()`)
   - Modele interroge : `EtudiantInscrit`
   - Iterations typiques : 100 a 5 000 etudiants par fichier CSV importe

---

#### Application : catalog (6 occurrences detectees)

1. **apps/catalog/views.py (lignes 812-819)**
   - Methode : `MaquettisteCatalogViewSet.update`
   - Ligne de boucle : 812 (`for author_data in authors_data:`)
   - Requete interne : ligne 819 (`BookAuthor.objects.get_or_create(full_name=author_name)`)
   - Modele interroge : `BookAuthor`
   - Iterations typiques : 1 a 5 auteurs par ouvrage

2. **apps/catalog/serializers.py (lignes 363-366, 620-630)**
   - Methodes : `OuvrageSerializer.create`, `MaquettisteOuvrageDetailSerializer.create`
   - Lignes de boucle : 363, 620 (`for discipline_id in disciplines_ids:`)
   - Requetes internes :
     - Ligne 364 : `Discipline.objects.get(id=discipline_id)`
     - Ligne 630 : `BookAuthor.objects.get_or_create(...)`
   - Modeles interroges : `Discipline`, `BookAuthor`
   - Iterations typiques : 1 a 5 disciplines ou auteurs

3. **apps/catalog/management/commands/import_r2_multilingual_books.py (lignes 423-427)**
   - Methode : `_process_single_book`
   - Ligne de boucle : 423 (`for author_name in authors_list:`)
   - Requete interne : ligne 427 (`BookAuthor.objects.get_or_create(full_name=author_name)`)
   - Modele interroge : `BookAuthor`
   - Iterations typiques : 1 a 4 auteurs par livre

---

#### Application : publishers_portal (5 occurrences detectees)

1. **apps/publishers_portal/publisher_views.py (lignes 237-244)**
   - Methode : `PublisherDashboardOverviewView.get`
   - Ligne de boucle : 237 (`for b in my_books:`)
   - Requetes internes :
     - Ligne 241 : `TraceAcces.objects.filter(ouvrage=b).count()`
     - Ligne 244 : `LigneCommande.objects.filter(ouvrage=b, commande__statut_paiement='completed').count()`
   - Modeles interroges : `TraceAcces`, `LigneCommande`
   - Iterations typiques : 10 a 200 livres par editeur

2. **apps/publishers_portal/publisher_views.py (lignes 702-710, 1358-1361)**
   - Methodes : `PublisherBulkContractCreateView.post`, `PublisherCatalogBatchActionView.post`
   - Lignes de boucle : 702, 1358 (`for author_entry in authors_list:`)
   - Requetes internes :
     - Ligne 710 : `BookAuthor.objects.get_or_create(...)`
     - Ligne 1361 : `PublisherBookDeposit.objects.get(id=deposit_id)`
   - Modeles interroges : `BookAuthor`, `PublisherBookDeposit`
   - Iterations typiques : 2 a 50 elements

---

#### Application : protection (2 occurrences detectees)

1. **apps/protection/access_service.py (lignes 28-32)**
   - Methode : `AccessService.check_bouquet_access`
   - Ligne de boucle : 28 (`for offering in bouquet_offerings:`)
   - Requete interne : ligne 32 (`BouquetOffering.objects.filter(bouquet=offering.bouquet, ouvrage=ouvrage).first()`)
   - Modele interroge : `BouquetOffering`
   - Iterations typiques : 1 a 5 abonnements actifs

2. **apps/protection/access_service.py (lignes 126-128)**
   - Methode : `AccessService.check_user_book_access`
   - Ligne de boucle : 126 (`for bouquet in user_bouquets:`)
   - Requete interne : ligne 128 (`BouquetOffering.objects.filter(bouquet=bouquet, ouvrage=ouvrage).exists()`)
   - Modele interroge : `BouquetOffering`
   - Iterations typiques : 1 a 5 abonnements actifs

---

#### Application : audio (2 occurrences detectees)

1. **apps/audio/views.py (lignes 771-798)**
   - Methode : `AudioTrackBatchReorderView.post`
   - Ligne de boucle : 771 (`for track_item in track_orders:`)
   - Requetes internes :
     - Ligne 776 : `AudioTrack.objects.get(id=track_item['id'])`
     - Ligne 798 : `AudioTrack.objects.filter(ouvrage=track.ouvrage)`
   - Modele interroge : `AudioTrack`
   - Iterations typiques : 5 a 60 pistes audio par ouvrage

---

### 2. Audit select_related / prefetch_related sur les vues a fort trafic

| Vue / Endpoint | Fichier et Ligne | Statut select_related / prefetch_related | Evaluation |
|---|---|---|---|
| **Catalogue Public (Liste)**<br>`OuvrageViewSet.list` | apps/catalog/views.py (lignes 38-55) | `select_related('publisher', 'discipline', 'institution')`<br>`prefetch_related('authors', 'language_versions', 'audio_tracks', 'disciplines')` | **Conforme** pour la liste paginee. |
| **Catalogue Public (Detail)**<br>`OuvrageViewSet.retrieve` | apps/catalog/views.py (lignes 221-250) | `select_related('publisher', 'discipline', 'institution')`<br>`prefetch_related('authors', 'disciplines')` | **Incomplet**. Absence de `language_versions` et `audio_tracks` dans le prefetch du detail, provoquant des requetes additionnelles a la serialisation. |
| **Tableau de bord Auteur**<br>`AuthorDashboardView.get` | apps/rights/views.py (lignes 364-421) | **Totalement depourvu**. Requete brute `Ouvrage.objects.filter(...)[:10]` sans aucun `select_related` ni `prefetch_related`. | **Critique**. 7 requetes ORM internes sont executees pour chaque livre dans une boucle Python. |
| **Liste des Commandes Client**<br>`OrderListView.get` | apps/commerce/views.py (lignes 333-339) | **Totalement depourvu**. `Order.objects.filter(user=request.user)`. | **Critique**. Le serialiseur `OrderSerializer` (apps/commerce/serializers.py, lignes 31-50) serialise `lignes` (avec `ouvrage.title`), `livraison`, et appelle `obj.lignes.filter(format_type='paper').exists()` deux fois par commande. Pour 20 commandes, cela declenche plus de 80 requetes SQL. Il manque `select_related('livraison')` et `prefetch_related('lignes', 'lignes__ouvrage')`. |
| **Catalogue Etudiant**<br>`StudentCatalogView.get` | apps/student/views.py (lignes 646-655) | `select_related('publisher', 'discipline')`<br>`prefetch_related('authors', 'language_versions')` | **Conforme**. |
| **Catalogue Partenaire**<br>`PartnerCatalogListView.get` | apps/reader/views.py (lignes 988-995) | `select_related('publisher', 'discipline')`<br>`prefetch_related('authors', 'language_versions')` | **Conforme**. |

---

## SECTION 2 — Appels externes synchrones dans les vues (requetes HTTP bloquantes)

Audit des appels vers des services tiers executes directement dans le cycle de vie synchrone d'une requete HTTP (`get`, `post`, `put`, `delete`).

### 1. Upload direct de fichiers audio vers Cloudflare Stream
- **Emplacement** : apps/audio/views.py (ligne 110) dans `AudioTrackUploadView.post`
- **Service externe** : API Cloudflare Stream (`requests.post(..., files={'file': ...})` via `CloudflareStreamClient.upload_file`)
- **Timeout defini** : **Explicite, `timeout=300` secondes (5 minutes)** dans apps/audio/stream_client.py (ligne 139)
- **Encapsulation try/except** : Oui (apps/audio/views.py, lignes 112-114).
- **Impact sur la reponse** : **Bloquant direct**. L'ensemble de la connexion HTTP client est maintenu ouvert pendant que le serveur Django televerse le fichier vers Cloudflare. Si l'envoi dure 40 secondes, un worker Gunicorn reste fige 40 secondes. En cas d'echec, l'utilisateur recoit une erreur HTTP 502.

### 2. Generation de tokens de streaming signes Cloudflare Stream a la lecture
- **Emplacement** : apps/audio/views.py (ligne 546) dans `AudioTrackStreamView.get` et apps/audio/views.py (ligne 388) dans `AudioStreamingTokenView.post`
- **Service externe** : API Cloudflare Stream (`requests.post(..., json={'exp': ...})` via `CloudflareStreamClient.generate_signed_token`)
- **Timeout defini** : **Explicite, `timeout=15` secondes** dans apps/audio/stream_client.py (ligne 49)
- **Encapsulation try/except** : Non dans `AudioTrackStreamView.get`.
- **Impact sur la reponse** : **Bloquant direct**. Chaque ecoute de piste audio declenche un appel HTTP externe vers Cloudflare. Si Cloudflare repond lentement ou echoue, la requete DRF echoue en 500 et la lecture est impossible.

### 3. Creation d'URL d'upload direct et suppression Cloudflare Stream
- **Emplacement** : apps/audio/views.py (ligne 90) (`AudioDirectUploadView.post`), apps/audio/views.py (ligne 194) (`AudioMediaDetailsView.get`), apps/audio/views.py (ligne 269) (`AudioMediaDeleteView.delete`)
- **Service externe** : API Cloudflare Stream (`requests.post`, `requests.get`, `requests.delete`)
- **Timeout defini** : **Explicite, `timeout=15` secondes**
- **Encapsulation try/except** : Oui dans `AudioDirectUploadView`, partiel dans les autres.
- **Impact sur la reponse** : Bloquant synchrone (attente de la reponse Cloudflare avant retour HTTP).

### 4. Initialisation des paiements Moneroo
- **Emplacement** : apps/commerce/views.py (ligne 245) dans `CreateOrderView.post` et apps/commerce/views.py (ligne 410) dans `SubscribeView.post`
- **Service externe** : Passerelle de paiement Moneroo (`MonerooClient.initialize_payment` -> `requests.post(..., timeout=10)`) dans apps/commerce/moneroo_client.py (ligne 69)
- **Timeout defini** : **Explicite, `timeout=10` secondes**
- **Encapsulation try/except** : Oui (apps/commerce/views.py, lignes 252-255)
- **Impact sur la reponse** : **Bloquant direct**. L'utilisateur attend la confirmation HTTP de Moneroo pour recevoir son URL de paiement. Si le service Moneroo a de la latence, la creation de commande prend jusqu'a 10 secondes. Si l'appel echoue, la commande est creee mais la reponse est une erreur HTTP 502 / 400.

### 5. Generation de quiz par Intelligence Artificielle (OpenAI)
- **Emplacement** : apps/reader/views.py (lignes 660-680) dans `BookQuizGenerateView.post` (methode `_generate_quiz_with_ai`)
- **Service externe** : OpenAI API (`client.chat.completions.create(model="gpt-4o-mini", ...)`)
- **Timeout defini** : **AUCUN timeout specifie** (utilise la valeur par defaut du SDK OpenAI, pouvant attendre plusieurs minutes).
- **Encapsulation try/except** : Oui (apps/reader/views.py, lignes 641-695).
- **Impact sur la reponse** : **Bloquant direct**. L'utilisateur attend la generation complete des questions par OpenAI pendant la requete HTTP POST. De surcroit, aux lignes 647-648, `file_bytes = ouvrage.file.read()` lit l'integralite du fichier de livre dans la RAM du serveur avant d'envoyer la requete a OpenAI.

### 6. Telechargement HTTP de contrats depuis Cloudflare R2 vers la memoire Django
- **Emplacement** : apps/rights/views.py (ligne 1580) (`LegalContractStreamView.get`) et apps/rights/views.py (ligne 1648) (`LegalContractDownloadView.get`)
- **Service externe** : Cloudflare R2 (`requests.get(file_url, timeout=15)` et `requests.get(file_url, timeout=20)`)
- **Timeout defini** : **Explicite, `timeout=15` et `timeout=20` secondes**
- **Encapsulation try/except** : Oui (apps/rights/views.py, lignes 1585, 1655)
- **Impact sur la reponse** : **Bloquant direct**. Django agit comme intermediaire en telechargeant le PDF depuis R2 dans sa propre memoire, applique le filigrane PyMuPDF, puis renvoie la reponse au client.

---

## SECTION 3 — Configuration Celery (Workers, Files, Priorites)

### 1. Configuration Celery actuelle

- **Fichier de configuration** : config/celery.py et config/settings/base.py (lignes 334-348)
- **Broker et Backend** : Redis (`REDIS_URL`, base Redis `db 1` en production via `CELERY_BROKER_URL=redis://redis:6379/1`).
- **Gestion des files et priorites** :
  - `CELERY_TASK_QUEUES` : **TOTALEMENT ABSENT**.
  - `CELERY_TASK_ROUTES` : **TOTALEMENT ABSENT**.
  - `CELERY_TASK_DEFAULT_QUEUE` : **ABSENT** (valeur par defaut implicite de Celery : file unique nommee `celery`).
  - **Constat** : Toutes les taches, qu'elles soient ultra-rapides et critiques (envoi d'e-mail de validation de commande ou reinitialisation de mot de passe) ou tres lourdes et longues (OCR de contrat de 50 pages, synchro R2, calculs mensuels des royalties), sont poussees sans distinction dans la meme et unique file Redis `celery`.

### 2. Parametres de concurrence et processus Workers en deploiement

- **Fichier** : docker-compose.yml (lignes 52-74)
- **Nombre de processus Worker distincts** : **1 seul conteneur worker** (`lahatheque_celery_worker`).
- **Parametre de concurrence reel** :
  ```yaml
  command: celery -A config worker -l info --concurrency=2
  ```
- **Concurrence** : `--concurrency=2` (seulement 2 slots d'execution simultanee).
- **Processus Planificateur (Beat)** : **1 seul conteneur beat** distinct (`lahatheque_celery_beat`), executant `celery -A config beat -l info`.
- **Risque d'architecture majeur** : Si 2 taches d'OCR de contrats ou 1 synchro R2 et 1 calcul mensuel de royalties sont en cours d'execution, **l'ensemble des 2 slots de concurrence est sature**. Toute notification par e-mail transactionnel (reinitialisation de mot de passe, confirmation d'achat) reste bloquee dans la file Redis jusqu'a la fin des traitements lourds.

### 3. Inventaire exhaustif des taches Celery et classification par priorite

| Nom de la Tache | Fichier et Ligne | Type / Priorite | Criticite Metier & Delai de reponse attendu |
|---|---|---|---|
| `task_send_transactional_email` | apps/communications/tasks.py (ligne 22) | **Critique / Transactionnelle** | **Ultra-prioritaire (< 5s)**. Mails de validation d'achat, recus, reinitialisation de mot de passe, alertes. |
| `send_email_task` | apps/reporting/tasks.py (ligne 21) | **Critique / Transactionnelle** | **Prioritaire (< 10s)**. Notifications administratives. |
| `dispatch_partner_webhook_task` | apps/reader/tasks.py (ligne 117) | **Critique / Evenementielle** | **Prioritaire (< 15s)**. Webhooks de synchronisation vers les universites/partenaires. |
| `process_contract_ocr_task` | apps/rights/tasks/ocr_tasks.py (ligne 14) | **Lourde / Differee** | **Non prioritaire (1 a 10 minutes)**. OCR Tesseract/PyMuPDF sur PDF jusqu'a 50 pages (consomme beaucoup de CPU et RAM). |
| `process_ai_suggestion_task_celery` | apps/rights/tasks/ai_tasks.py (ligne 61) | **Lourde / Differee** | **Non prioritaire (30s a 3 minutes)**. Analyse de contrat via OpenAI. |
| `task_sync_r2_multilingual_books` | apps/catalog/tasks.py (ligne 20) | **Lourde / Planifiee** | **Differee (toutes les 6h)**. Parcours et synchronisation de l'inventaire R2. |
| `task_calculate_monthly_royalties` | apps/reporting/tasks.py (ligne 331) | **Lourde / Planifiee** | **Differee (1er du mois)**. Traitement par lot massif de tous les auteurs et commandes. |
| `task_distribute_bouquet_revenue` | apps/reporting/tasks.py (ligne 807) | **Lourde / Planifiee** | **Differee (2 du mois)**. Calcul et ventilation des revenus de bouquets. |
| `task_scan_and_send_deposit_reminders` | apps/reporting/tasks.py (ligne 54) | **Moyenne / Planifiee** | **Differee (quotidienne)**. Relances de depots editeurs. |
| `task_scan_and_send_unpaid_reminders` | apps/reporting/tasks.py (ligne 139) | **Moyenne / Planifiee** | **Differee (quotidienne)**. Relances de factures impayees. |
| `task_scan_and_send_subscription_expiry_reminders` | apps/reporting/tasks.py (ligne 226) | **Moyenne / Planifiee** | **Differee (quotidienne)**. Relances fin d'abonnement. |
| `task_check_stock_alerts` | apps/reporting/tasks.py (ligne 668) | **Legere / Planifiee** | **Differee (toutes les 6h)**. Verification des seuils de stock. |
| `task_check_legal_alerts` | apps/reporting/tasks.py (ligne 800) | **Legere / Planifiee** | **Differee (quotidienne)**. Alertes echeances contrats. |
| `update_cdf_exchange_rate_task` | apps/commerce/tasks.py (ligne 4) | **Legere / Planifiee** | **Differee (quotidienne)**. Mise a jour du taux CDF. |

---

## SECTION 4 — Cache

### 1. Configuration actuelle du cache et utilisations existantes

- **Configuration de base** : config/settings/base.py (lignes 353-362)
  ```python
  CACHES = {
      'default': {
          'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
          'LOCATION': 'unique-snowflake',
      }
  }
  ```
  **Constat d'architecture critique** : Le cache utilise `LocMemCache` (memoire locale de chaque processus). Dans l'environnement Gunicorn (`3 workers x 2 threads`), **chaque worker possede son propre cache isole en memoire**. Une donnee mise en cache par le Worker 1 n'est pas accessible par les Workers 2 et 3. Tout redemarrage du conteneur ou recyclage de worker purge instantanement le cache. Redis est present dans la stack mais n'est pas utilise comme backend de cache Django.

- **Liste de toutes les utilisations du cache identifiees dans le code** :

1. **apps/catalog/views.py (lignes 207-216)**
   - Vue : `OuvrageViewSet.list` (Catalogue public)
   - Cle : `catalog_list_{md5_query_params}`
   - TTL : **300 secondes (5 minutes)** (defini par `CATALOG_CACHE_TTL = 300` a la ligne 27)

2. **apps/catalog/views.py (lignes 465-474)**
   - Vue : `MaquettisteCatalogViewSet.list` (Espace maquettiste)
   - Cle : `maquettiste_catalog_{user_id}_{page}_{page_size}_{search}`
   - TTL : **300 secondes (5 minutes)**

3. **apps/reader/views.py (lignes 981-1061)**
   - Vue : `PartnerCatalogListView.get` (Catalogue dedie aux partenaires)
   - Cle : `partner_catalog_{partner_id}_{query_hash}`
   - TTL : **900 secondes (15 minutes)** (defini par `PARTNER_CATALOG_CACHE_TTL = 900` a la ligne 975)

4. **apps/student/views.py (lignes 640-812)**
   - Vue : `StudentCatalogView.get` (Catalogue etudiant)
   - Cle : `student_catalog_{institution_id}_{query_hash}`
   - TTL : **120 secondes (2 minutes)**

5. **apps/reporting/admin_views.py (lignes 417-496)**
   - Vue : `AdminCatalogPricingViewSet.list` (Tarification catalogue admin)
   - Cle : `admin_catalog_pricing_{search}_{discipline}_{institution}_{page}`
   - TTL : **300 secondes (5 minutes)**

6. **apps/reporting/pricing_service.py (lignes 9-14)**
   - Methode : `get_platform_config` (Singleton de configuration plateforme)
   - Cle : `platform_config_singleton`
   - TTL : **60 secondes (1 minute)**

7. **apps/rights/services/search_service.py (lignes 51-103)**
   - Methode : `search_contracts_and_authors` (Indexation IDs pour recherche)
   - Cle : `search_ids_{query_hash}`
   - TTL : **60 secondes (1 minute)**

8. **apps/reader/throttling.py (lignes 19-25)**
   - Classe : `PartnerDailyRateThrottle` (Comptage des quotas de lecture partenaires)
   - Cle : `partner_throttle_{partner_id}_{date}`
   - TTL : **86400 secondes (24 heures)**

---

### 2. Vues a fort trafic ou a forte charge d'agregation SANS AUCUN CACHE

1. **apps/reporting/admin_views.py (lignes 44-120)**
   - Methode : `AdminPanoramicStatsAPIView.get`
   - Description : Tableau de bord panoramique Admin executant 15+ agregations SQL lourdes sans filtre indexe (`Order.objects.aggregate`, `WholesaleOrder.objects.aggregate`, `UniversityPaperOrder.objects.aggregate`, calculs de marges et de traces d'acces).
   - Statut : **Aucun cache**. Chaque rafraichissement d'ecran recalcule l'integralite de l'historique sur la base de donnees.

2. **apps/catalog/views.py (lignes 221-250)**
   - Methode : `OuvrageViewSet.retrieve`
   - Description : Consultation de la fiche detaillee d'un livre (appelee a chaque clic visiteur, etudiant ou partenaire).
   - Statut : **Aucun cache**. Chaque consultation touche directement la base de donnees avec plusieurs jointures.

3. **apps/partners/university_views.py (lignes 48-125)**
   - Methode : `UniversityKpisView.get`
   - Description : Statistiques et KPIs de consultation par faculte pour les universites (parcourt `TraceAcces` et `ReaderSession`).
   - Statut : **Aucun cache**.

4. **apps/partners/university_views.py (lignes 559-715)**
   - Methode : `UniversityRoyaltiesView.get`
   - Description : Releves de droits et statistiques des bouquets universitaires.
   - Statut : **Aucun cache**.

5. **apps/catalog/views.py (lignes 1020-1040, 1080-1100)**
   - Methodes : `DisciplineViewSet.list` et `InstitutionViewSet.list`
   - Description : Referentiels statiques des disciplines et institutions charges a repetition par les filtres du front-end.
   - Statut : **Aucun cache**.

6. **apps/commerce/views.py (lignes 466-490)**
   - Methode : `ClientBouquetListView.get`
   - Description : Liste des bouquets disponibles a la souscription pour les particuliers.
   - Statut : **Aucun cache**.

---

## SECTION 5 — Base de donnees : index et connexions

### 1. Modeles contenant des champs frequemment filtres ou tries SANS index

Audit verifie croisant les declarations de champs (`db_index=True`) et les index composes (`Meta.indexes`) :

#### Application `catalog` :
- **apps/catalog/models.py (ligne 75)** : `Ouvrage.status` (filtre dans quasi toutes les requetes : `status='published'`, `status='pending'`) -> **AUCUN index**.
- **apps/catalog/models.py (ligne 106)** : `Ouvrage.created_at` (utilise dans l'ordre par defaut `ordering = ['-created_at']` de tout le catalogue) -> **AUCUN index**.
- **apps/catalog/models.py (ligne 72)** : `Ouvrage.language` (filtre sur les langues FR/EN) -> **AUCUN index**.
- **apps/catalog/models.py (ligne 71)** : `Ouvrage.publication_date` (tri et filtre de nouveautes) -> **AUCUN index**.
- **apps/catalog/models.py (ligne 67)** : `Ouvrage.format_type` (filtre papier / numerique / audio) -> **AUCUN index**.
- **apps/catalog/models.py (ligne 309)** : `OuvrageLanguageVersion.created_at` -> **AUCUN index**.

#### Application `commerce` :
- **apps/commerce/models.py (ligne 84)** : `Order.statut_paiement` (filtre systematique : `statut_paiement='completed'`) -> **AUCUN index**.
- **apps/commerce/models.py (ligne 85)** : `Order.statut_commande` -> **AUCUN index**.
- **apps/commerce/models.py (ligne 101)** : `Order.created_at` (filtre de dates sur toutes les statistiques et les historiques de commandes) -> **AUCUN index**.
- **apps/commerce/models.py (ligne 117)** : `LigneCommande.format_type` (utilise dans `obj.lignes.filter(format_type='paper')`) -> **AUCUN index**.
- **apps/commerce/models.py (ligne 151)** : `PhysicalDelivery.statut` -> **AUCUN index**.
- **apps/commerce/models.py (ligne 242)** : `MouvementStock.created_at` -> **AUCUN index**.
- **apps/commerce/models.py (lignes 461, 468)** : `ClientBouquetSubscription.status` et `created_at` -> **AUCUN index**.

#### Application `partners` :
- **apps/partners/models.py (lignes 163, 166)** : `UniversityBouquetSubscription.status` et `created_at` -> **AUCUN index**.
- **apps/partners/models.py (lignes 182, 184)** : `UniversityPaperOrder.status` et `created_at` -> **AUCUN index**.
- **apps/partners/models.py (lignes 199, 201)** : `UniversityRoyaltyStatement.status` et `created_at` -> **AUCUN index**.
- **apps/partners/models.py (ligne 104)** : `StudentAffiliation.status` -> **AUCUN index**.

#### Application `rights` :
- **apps/rights/models.py (lignes 79, 85)** : `PayoutRequest.status` et `created_at` -> **AUCUN index**.
- **apps/rights/models.py (ligne 174)** : `ContratLegal.created_at` -> **AUCUN index**.
- **apps/rights/models.py (lignes 321, 323)** : `AuthorManuscriptSubmission.status` et `created_at` -> **AUCUN index**.
- **apps/rights/models.py (lignes 368, 369)** : `PublicManuscriptLead.status` et `created_at` -> **AUCUN index**.

#### Application `protection` :
- **apps/protection/models.py (lignes 96-98)** : `TraceAcces.bouquet_subscription` et `institution` -> Possedent un index ForeignKey simple par defaut, mais **AUCUN index compose avec `timestamp`** (`bouquet_subscription, timestamp` ou `institution, timestamp`). Or, les requetes de calcul de repartition filtrent sur ces couples de champs sur des millions de traces de lecture, provoquant des scans sequentiels.

---

### 2. Configuration de la base de donnees

- **Emplacement** : config/settings/base.py (lignes 97-105)
- **Moteur** : PostgreSQL (via `dj_database_url`, heberge sur Neon Serverless PostgreSQL en production).
- **Configuration exacte** :
  ```python
  DATABASES = {
      'default': dj_database_url.config(
          default=config('DATABASE_URL', default='sqlite:///' + str(BASE_DIR / 'db.sqlite3')),
          conn_max_age=0,
          conn_health_checks=True,
      )
  }
  DATABASES['default']['DISABLE_SERVER_SIDE_CURSORS'] = True
  ```
- **Pooling de connexions** :
  - `conn_max_age = 0` : **Aucun maintien de connexion**. Django ferme et detruit la connexion TCP/SSL a la fin de chaque requete HTTP.
  - **Impact a forte charge** : Sur un afflux de milliers de requetes simultanees, l'ouverture/fermeture d'une session SSL vers Neon a chaque requete ajoute une latence reseau incompressible (50 a 150 ms par handshake SSL) et risque de saturer prematurement les limites de connexions de la base PostgreSQL si aucun pooler transactionnel externe (PgBouncer/Neon Pooler) n'est cible par `DATABASE_URL`.
- **Nombre maximum de connexions configure** : **Non defini** dans les settings Django (aucune limite `OPTIONS: {'max_connections': ...}`).
- **Curseurs cote serveur** : `DISABLE_SERVER_SIDE_CURSORS = True` est correctement active (compatible avec le mode transaction PgBouncer).

---

## SECTION 6 — Chemins de fichiers volumineux (upload/telechargement)

### 1. Etat des lieux du flux de fichiers

Le stockage distant Cloudflare R2 est bien declare via `R2MediaStorage` (apps/catalog/storage.py, ligne 10) et Cloudflare Stream est integre via `CloudflareStreamClient`. Un mecanisme de generation d'URL d'upload direct signe (`generate_presigned_url`) existe pour les maquettistes dans apps/catalog/views.py (lignes 890-958).

Cependant, **le principe d'exclusion totale de la memoire/disque du serveur Django applicatif N'EST PAS respecte de maniere homogene**. De multiples flux font encore transiter des fichiers volumineux directement par le serveur Django.

---

### 2. Exceptions identifiees ou les fichiers volumineux transitent par Django

1. **Uploads directs de fichiers audio via Django vers Cloudflare Stream**
   - **Emplacements** :
     - apps/audio/views.py (lignes 94-110) (`AudioTrackUploadView.post`) : `audio_file = request.FILES.get("file")`, puis `client.upload_file(audio_file)`
     - apps/audio/views.py (lignes 730-760) (`AudioAlbumBatchUploadView.post`) : reception de pistes completes d'albums audio via `request.FILES.get("male_full_track")` et `request.FILES.get("female_full_track")`
   - **Mecanisme** : Les fichiers audio (souvent plusieurs dizaines ou centaines de megaoctets) sont recus dans `request.FILES` par Django (charges en RAM puis sur le disque temporaire du conteneur), puis Django les re-televerse en HTTP POST vers Cloudflare Stream. Le serveur applicatif supporte la charge I/O double.

2. **Proxy de streaming R2 direct a travers Django**
   - **Emplacement** : apps/catalog/views.py (lignes 959-1004) (`get_r2_media`)
   - **Mecanisme** : Django telecharge les morceaux du fichier depuis R2 (`s3_client.get_object`) et les re-emet en streaming vers le client via `StreamingHttpResponse(body_stream.iter_chunks(chunk_size=65536))`. Django agit comme un reverse proxy HTTP pour les medias de couverture et les livres, occupant des threads applicatifs.

3. **Generation de PDF filigranes DRM a la volee sur disque et memoire serveur**
   - **Emplacement** : apps/reader/views.py (lignes 789-855) (`ReaderProtectedStreamView`)
   - **Mecanisme** : Le lecteur protege genere des PDF derives filigranes et les stocke localement dans `DRM_DERIVED_CACHE_DIR = var/drm_cache` (config/settings/base.py, ligne 302), puis les sert en flux memoire/disque depuis Django via `FileResponse` ou `StreamingHttpResponse`.

4. **Lecture integrale d'ouvrages en memoire RAM pour l'IA**
   - **Emplacement** : apps/reader/views.py (lignes 644-650) (`_generate_quiz_with_ai`)
   - **Mecanisme** : `file_bytes = ouvrage.file.read()` charge l'integralite du binaire du livre (PDF/EPUB pouvant atteindre des centaines de Mo) directement dans la RAM du worker Django pour en extraire du texte.

5. **Telechargement et filigrane en memoire des contrats legaux**
   - **Emplacement** : apps/rights/views.py (lignes 1570-1582, 1636-1650)
   - **Mecanisme** : `requests.get(file_url, stream=True)` telecharge le PDF complet du contrat depuis R2 dans un buffer memoire Django (`io.BytesIO(resp.content)`), effectue les operations PyMuPDF en RAM, puis le renvoie au client.

6. **Depots de manuscrits et formulaires de depot direct sans URL pre-signee**
   - **Emplacements** :
     - apps/publishers_portal/publisher_views.py (lignes 419, 555, 620) (`PublisherBookDeposit`)
     - apps/rights/views.py (lignes 763, 1042) (`LegalContractUploadView`)
   - **Mecanisme** : Les formulaires standards envoient les fichiers en `multipart/form-data` directement sur l'endpoint Django. Bien que la couche stockage Django (`R2MediaStorage`) transfere ensuite le fichier sur R2, le fichier transite physiquement par la memoire vive et le disque temporaire du serveur Django (autorise jusqu'a 800 Mo via `DATA_UPLOAD_MAX_MEMORY_SIZE = 838860800` a config/settings/base.py, ligne 295).
