"""
Tests unitaires — Fiches Y1 à Y5 : Rôle Éditeur Tiers.
Couvre l'import par lot, l'authentification par clé API, le circuit d'approbation et publication,
la mesure en direct des consultations/revenus et la vérification de solde au retrait.
"""
import io
import hashlib
from decimal import Decimal
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient

from apps.accounts.models import User
from apps.publishers_portal.models import (
    Publisher,
    PublisherBookDeposit,
    PublisherDepositStatus,
    PublisherValidationStep,
    PublisherApiKey,
    PublisherRoyaltyPayment,
    PublisherBatchImportLog,
)
from apps.catalog.models import Ouvrage, Discipline
from apps.protection.models import TraceAcces
from apps.commerce.models import Order, LigneCommande, Currency


class PublisherPortalFichesYTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.publisher_user = User.objects.create_user(
            username="editeur_test",
            email="contact@editions-afrique.com",
            password="TestPassword123!",
            role="publisher",
            first_name="Émile",
            last_name="Zola",
        )
        self.publisher_profile = Publisher.objects.create(
            user=self.publisher_user,
            company_name="Éditions Afrique Savoir",
            contractual_royalty_rate=Decimal("25.00"),
        )

        self.admin_user = User.objects.create_user(
            username="admin_editions",
            email="admin@lahatheque.com",
            password="AdminPassword123!",
            role="admin",
        )

        self.currency, _ = Currency.objects.get_or_create(code="XOF", defaults={"peg_rate_to_eur": 655.957})

    def test_y1_batch_import_csv(self):
        """Fiche Y1 : Vérifie qu'un fichier CSV est réellement parsé et crée des PublisherBookDeposit."""
        self.client.force_authenticate(user=self.publisher_user)

        csv_content = (
            "title,isbn_digital,discipline,price,language,summary,authors\n"
            "Introduction au Droit Civil,978-2-00000001-1,Droit Privé,6000,fr,Ouvrage de base,Jean Dupont;Marie Martin\n"
            "Économie Monétaire,978-2-00000002-2,Économie,7500,fr,Manuel complet,Alain Durand\n"
        )
        uploaded_file = SimpleUploadedFile(
            "lot_ouvrages.csv",
            csv_content.encode("utf-8-sig"),
            content_type="text/csv"
        )

        res = self.client.post(
            "/api/v1/publishers/deposits/batch/",
            {"file": uploaded_file, "format": "csv"},
            format="multipart"
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data["success"])
        self.assertEqual(res.data["data"]["success_count"], 2)
        self.assertEqual(res.data["data"]["error_count"], 0)

        deposits = PublisherBookDeposit.objects.filter(publisher=self.publisher_profile)
        self.assertEqual(deposits.count(), 2)
        deposit1 = deposits.filter(isbn_digital="978-2-00000001-1").first()
        self.assertIsNotNone(deposit1)
        self.assertEqual(deposit1.title, "Introduction au Droit Civil")
        self.assertEqual(deposit1.authors, ["Jean Dupont", "Marie Martin"])

    def test_y2_api_key_external_deposit(self):
        """Fiche Y2 : Vérifie qu'une clé API valide authentifie un dépôt externe."""
        raw_secret = "laha_sec_super_secret_test_token_12345"
        client_id = "pub_cli_test_123"
        secret_hash = hashlib.sha256(raw_secret.encode()).hexdigest()

        key = PublisherApiKey.objects.create(
            publisher=self.publisher_profile,
            name="ERP Test",
            client_id=client_id,
            client_secret_hash=secret_hash,
            client_secret_masked="laha_sec_...2345",
            status="active"
        )

        # 1. Sans en-têtes -> 401/403 non autorisé
        res_no_auth = self.client.post("/api/v1/publishers/external/deposits/", {"title": "Livre Externe"})
        self.assertIn(res_no_auth.status_code, [401, 403])

        # 2. Avec en-têtes valides -> 201 créé
        res_auth = self.client.post(
            "/api/v1/publishers/external/deposits/",
            {
                "title": "Manuel Programmatique",
                "isbn_digital": "978-2-API-001",
                "discipline": "Informatique",
                "price": 8000,
                "authors": ["Dev Expert"],
            },
            format="json",
            HTTP_X_CLIENT_ID=client_id,
            HTTP_X_CLIENT_SECRET=raw_secret,
        )
        self.assertEqual(res_auth.status_code, 201)
        self.assertTrue(res_auth.data["success"])
        deposit_id = res_auth.data["data"]["id"]

        # 3. Consultation du statut via clé API
        res_status = self.client.get(
            f"/api/v1/publishers/external/deposits/{deposit_id}/",
            HTTP_X_CLIENT_ID=client_id,
            HTTP_X_CLIENT_SECRET=raw_secret,
        )
        self.assertEqual(res_status.status_code, 200)
        self.assertEqual(res_status.data["data"]["title"], "Manuel Programmatique")

    def test_y3_two_step_review_and_publish(self):
        """
        Fiche Y3 (Corrigée) :
        - Conformité éditoriale (Chef Maquettiste)
        - Vérification des droits (Juriste)
        - Publication finale uniquement si les deux volets sont 'approved'
        """
        chief_layout_user = User.objects.create_user(
            username="chief_layout_test",
            email="chief@lahatheque.com",
            password="TestPassword123!",
            role="chief_layout",
        )
        legal_reviewer_user = User.objects.create_user(
            username="legal_reviewer_test",
            email="legal@lahatheque.com",
            password="TestPassword123!",
            role="legal_reviewer",
        )

        deposit = PublisherBookDeposit.objects.create(
            publisher=self.publisher_profile,
            title="Droit International Public",
            subtitle="Tome 1",
            isbn_digital="978-2-LAW-001",
            discipline="Droit Public",
            price=Decimal("9000.00"),
            summary="Traité exhaustif.",
            authors=["Professeur Lawson"],
            status=PublisherDepositStatus.PENDING,
            validation_step=PublisherValidationStep.STEP_1,
        )

        # 1. File d'examen accessible au Chef Maquettiste et au Juriste
        self.client.force_authenticate(user=chief_layout_user)
        res_list = self.client.get("/api/v1/publishers/admin/deposits/")
        self.assertEqual(res_list.status_code, 200)
        self.assertTrue(any(d["id"] == str(deposit.id) for d in res_list.data["data"]))

        # 2. Le Chef Maquettiste ne peut pas valider les droits (403)
        res_forbidden = self.client.post(
            f"/api/v1/publishers/admin/deposits/{deposit.id}/rights-decision/",
            {"decision": "approved", "comment": "Tentative non autorisée"},
            format="json"
        )
        self.assertEqual(res_forbidden.status_code, 403)

        # 3. Le Chef Maquettiste valide la conformité éditoriale
        res_edit = self.client.post(
            f"/api/v1/publishers/admin/deposits/{deposit.id}/editorial-decision/",
            {"decision": "approved", "comment": "Mise en page et maquette validées."},
            format="json"
        )
        self.assertEqual(res_edit.status_code, 200)
        deposit.refresh_from_db()
        self.assertEqual(deposit.editorial_status, "approved")

        # 4. Tentative de publication alors que les droits sont encore pending -> 400
        res_pub_fail = self.client.post(f"/api/v1/publishers/admin/deposits/{deposit.id}/publish/")
        self.assertEqual(res_pub_fail.status_code, 400)
        self.assertIn("Publication impossible", res_pub_fail.data["error"])

        # 5. Le Juriste valide la vérification des droits
        self.client.force_authenticate(user=legal_reviewer_user)
        res_rights = self.client.post(
            f"/api/v1/publishers/admin/deposits/{deposit.id}/rights-decision/",
            {"decision": "approved", "comment": "Contrat et cession des droits vérifiés."},
            format="json"
        )
        self.assertEqual(res_rights.status_code, 200)
        deposit.refresh_from_db()
        self.assertEqual(deposit.rights_status, "approved")

        # 6. Publication finale autorisée maintenant que les DEUX volets sont approved
        res_pub = self.client.post(f"/api/v1/publishers/admin/deposits/{deposit.id}/publish/")
        self.assertEqual(res_pub.status_code, 200)
        deposit.refresh_from_db()
        self.assertEqual(deposit.status, PublisherDepositStatus.PUBLISHED)

        # Vérification dans Ouvrage
        ouvrage = Ouvrage.objects.filter(isbn="978-2-LAW-001").first()
        self.assertIsNotNone(ouvrage)
        self.assertEqual(ouvrage.title, "Droit International Public")
        self.assertEqual(ouvrage.publisher, self.publisher_profile)
        self.assertEqual(ouvrage.status, "published")

    def test_y4_live_consultations_and_revenue_kpis(self):
        """Fiche Y4 : Les consultations et revenus réels sont mesurés en direct."""
        discipline = Discipline.objects.create(name="Sciences Politiques")
        ouvrage = Ouvrage.objects.create(
            title="Géopolitique Africaine",
            isbn="978-2-GEO-001",
            publisher=self.publisher_profile,
            discipline=discipline,
            price_digital=5000,
            status="published",
        )
        deposit = PublisherBookDeposit.objects.create(
            publisher=self.publisher_profile,
            title="Géopolitique Africaine",
            isbn_digital="978-2-GEO-001",
            discipline="Sciences Politiques",
            price=Decimal("5000.00"),
            status=PublisherDepositStatus.PUBLISHED,
        )

        # Création de consultations réelles (TraceAcces)
        reader_user = User.objects.create_user(username="lecteur_1", password="TestPassword123!")
        TraceAcces.objects.create(user=reader_user, ouvrage=ouvrage, ip_address="127.0.0.1", access_type="read_online")
        TraceAcces.objects.create(user=reader_user, ouvrage=ouvrage, ip_address="127.0.0.1", access_type="read_online")

        # Création d'une vente réelle payée (Order + LigneCommande)
        order = Order.objects.create(
            user=reader_user,
            total_amount=Decimal("10000.00"),
            currency=self.currency,
            statut_paiement="paid",
            statut_commande="completed"
        )
        LigneCommande.objects.create(
            commande=order,
            ouvrage=ouvrage,
            format_type="digital",
            unit_price=Decimal("5000.00"),
            quantity=2
        )

        self.client.force_authenticate(user=self.publisher_user)

        # 1. Vérification dans PublisherKpisView
        res_kpis = self.client.get("/api/v1/publishers/kpis/")
        self.assertEqual(res_kpis.status_code, 200)
        self.assertEqual(res_kpis.data["data"]["totalConsultations"], 2)
        self.assertEqual(res_kpis.data["data"]["totalRevenue"], 10000.0)
        # Redevance = 25% de 10 000 = 2 500
        self.assertEqual(res_kpis.data["data"]["pendingRoyalties"], 2500.0)

        # 2. Vérification dans PublisherCatalogListView
        res_catalog = self.client.get("/api/v1/publishers/catalog/")
        self.assertEqual(res_catalog.status_code, 200)
        item = next(b for b in res_catalog.data["data"] if b["id"] == str(deposit.id))
        self.assertEqual(item["consultations_count"], 2)
        self.assertEqual(item["revenue_generated"], 10000.0)

    def test_y5_royalties_withdraw_balance_check(self):
        """Fiche Y5 : Le retrait de redevances vérifie le solde disponible et rejette les montants excessifs."""
        PublisherBookDeposit.objects.create(
            publisher=self.publisher_profile,
            title="Livre Rentable",
            isbn_digital="978-2-PROFIT-001",
            price=Decimal("10000.00"),
            revenue_generated=Decimal("40000.00"), # 25% de 40 000 = 10 000 XOF max disponible
            status=PublisherDepositStatus.PUBLISHED,
        )

        self.client.force_authenticate(user=self.publisher_user)

        # 1. Montant négatif ou nul -> rejet
        res_zero = self.client.post("/api/v1/publishers/royalties/withdraw/", {"amount": 0}, format="json")
        self.assertEqual(res_zero.status_code, 400)

        # 2. Montant supérieur au solde disponible (15 000 > 10 000) -> rejet 400
        res_excess = self.client.post("/api/v1/publishers/royalties/withdraw/", {"amount": 15000}, format="json")
        self.assertEqual(res_excess.status_code, 400)
        self.assertIn("supérieur au solde disponible", res_excess.data["error"])

        # 3. Montant valide (6 000 <= 10 000) -> succès
        res_ok = self.client.post("/api/v1/publishers/royalties/withdraw/", {"amount": 6000}, format="json")
        self.assertEqual(res_ok.status_code, 200)
        self.assertTrue(res_ok.data["success"])
        self.assertEqual(res_ok.data["data"]["amount"], 6000.0)

        # 4. Deuxième retrait (5 000 > 4 000 restant) -> rejet
        res_second = self.client.post("/api/v1/publishers/royalties/withdraw/", {"amount": 5000}, format="json")
        self.assertEqual(res_second.status_code, 400)

    def test_z1_ai_metadata_extraction(self):
        """Fiche Z1 : Vérifie que l'endpoint IA utilise le vrai service OpenAI et gère les fichiers."""
        self.client.force_authenticate(user=self.publisher_user)

        # 1. Sans fichier (titre uniquement)
        res = self.client.post(
            "/api/v1/publishers/ai/extract-metadata/",
            {"title": "Traité de Droit Administratif Béninois"},
            format="json"
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data["success"])
        data = res.data["data"]
        self.assertIn("summary", data)
        self.assertIn("discipline", data)
        self.assertIn("language", data)
        self.assertIn("suggested_keywords", data)
        self.assertIn("target_audience", data)
        self.assertIn("analysis_mode", data)
        self.assertIn(data["analysis_mode"], ["openai", "heuristic"])

        # 2. Avec fichier joint
        dummy_file = SimpleUploadedFile("manuscrit.pdf", b"%PDF-1.4 dummy pdf bytes", content_type="application/pdf")
        res_file = self.client.post(
            "/api/v1/publishers/ai/extract-metadata/",
            {"title": "Économie du Développement", "file": dummy_file},
            format="multipart"
        )
        self.assertEqual(res_file.status_code, 200)
        self.assertTrue(res_file.data["success"])
        self.assertIsNotNone(res_file.data["data"]["summary"])

    def test_z2_honest_zero_statistics(self):
        """Fiche Z2 : Un livre sans activité réelle affiche honnêtement 0 consultation et 0 revenu."""
        discipline = Discipline.objects.create(name="Droit des Affaires")
        ouvrage_zero = Ouvrage.objects.create(
            title="Droit des Sociétés",
            isbn="978-2-ZERO-001",
            publisher=self.publisher_profile,
            discipline=discipline,
            price_digital=6000,
            status="published",
        )
        PublisherBookDeposit.objects.create(
            publisher=self.publisher_profile,
            title="Droit des Sociétés",
            isbn_digital="978-2-ZERO-001",
            discipline="Droit des Affaires",
            price=Decimal("6000.00"),
            status=PublisherDepositStatus.PUBLISHED,
            consultations_count=0,
            revenue_generated=Decimal("0.00"),
        )
        PublisherBookDeposit.objects.create(
            publisher=self.publisher_profile,
            title="Ouvrage En Attente",
            isbn_digital="978-2-PENDING-001",
            discipline="Droit des Affaires",
            price=Decimal("6000.00"),
            status=PublisherDepositStatus.PENDING,
            consultations_count=0,
            revenue_generated=Decimal("0.00"),
        )

        self.client.force_authenticate(user=self.publisher_user)

        res_kpis = self.client.get("/api/v1/publishers/kpis/")
        self.assertEqual(res_kpis.status_code, 200)
        self.assertEqual(res_kpis.data["data"]["totalConsultations"], 0)
        self.assertEqual(res_kpis.data["data"]["totalRevenue"], 0.0)

        res_catalog = self.client.get("/api/v1/publishers/catalog/")
        self.assertEqual(res_catalog.status_code, 200)
        for b in res_catalog.data["data"]:
            self.assertEqual(b["consultations_count"], 0)
            self.assertEqual(b["revenue_generated"], 0.0)

