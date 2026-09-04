from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

from apps.catalog.models import Ouvrage, Discipline
from apps.reporting.models import ConfigurationPlateformeGlobale
from apps.reporting.pricing_service import compute_role_price, invalidate_platform_config_cache
from apps.student.serializers import OuvrageBasicSerializer
from apps.commerce.models import StockOuvrage, Entrepot, WholesaleProfile
from apps.partners.models import Institution

User = get_user_model()


class RoleDiscountsTestCase(TestCase):
    def setUp(self):
        invalidate_platform_config_cache()
        self.client = APIClient()

        # Admin user
        self.admin = User.objects.create_user(
            username="admin.pricing@lahatheque.bj",
            email="admin.pricing@lahatheque.bj",
            password="Password123!",
            role="admin"
        )

        # Wholesaler user
        self.wholesaler = User.objects.create_user(
            username="grossiste.test@lahatheque.bj",
            email="grossiste.test@lahatheque.bj",
            password="Password123!",
            role="wholesaler"
        )
        self.wholesaler_profile = WholesaleProfile.objects.create(
            user=self.wholesaler,
            company_name="Librairie Centrale",
            warehouse_address="Cotonou",
            contact_phone="+229 97 00 11 22"
        )

        # Author user
        self.author = User.objects.create_user(
            username="auteur.test@lahatheque.bj",
            email="auteur.test@lahatheque.bj",
            password="Password123!",
            role="author"
        )

        # University user
        self.university_user = User.objects.create_user(
            username="univ.test@lahatheque.bj",
            email="univ.test@lahatheque.bj",
            password="Password123!",
            role="university"
        )
        self.institution = Institution.objects.create(
            user=self.university_user,
            name="Université d'Abomey-Calavi",
            code="UAC-TEST-ROLE-PRICING",
            country="BJ"
        )

        self.discipline = Discipline.objects.create(name="Sciences Juridiques")
        self.ouvrage = Ouvrage.objects.create(
            isbn="978-2-84129-100-1",
            title="Droit des Affaires OHADA",
            discipline=self.discipline,
            price_digital=Decimal("4000.00"),
            price_paper=Decimal("7500.00"),
            is_paper_available=True,
            status="published"
        )

        # Stock pour tests de commande
        self.entrepot = Entrepot.objects.create(
            nom="Entrepôt Principal",
            code="WAR-TEST-ROLE-01",
            pays="Bénin",
            ville="Cotonou",
            adresse="Cotonou"
        )
        self.stock = StockOuvrage.objects.create(
            ouvrage=self.ouvrage,
            entrepot=self.entrepot,
            quantite_reelle=100,
            quantite_reservee=0
        )

    def test_01_pricing_service_compute_role_price_defaults(self):
        """Vérifie le calcul par défaut de compute_role_price pour chaque rôle."""
        # Wholesaler: -25% digital (4000 * 0.75 = 3000), -32% paper (7500 * 0.68 = 5100)
        p_wholesaler = compute_role_price(self.ouvrage, "wholesaler")
        self.assertEqual(p_wholesaler["digital_price"], 3000.0)
        self.assertEqual(p_wholesaler["paper_price"], 5100.0)
        self.assertEqual(p_wholesaler["digital_discount_pct"], 25.0)
        self.assertEqual(p_wholesaler["paper_discount_pct"], 32.0)

        # Author: -25% digital (3000), -40% paper (7500 * 0.60 = 4500)
        p_author = compute_role_price(self.ouvrage, "author")
        self.assertEqual(p_author["digital_price"], 3000.0)
        self.assertEqual(p_author["paper_price"], 4500.0)

        # University: -35% digital (4000 * 0.65 = 2600), -25% paper (7500 * 0.75 = 5625)
        p_univ = compute_role_price(self.ouvrage, "university")
        self.assertEqual(p_univ["digital_price"], 2600.0)
        self.assertEqual(p_univ["paper_price"], 5625.0)

    def test_02_admin_role_discounts_api_get_and_patch(self):
        """Vérifie l'API GET et PATCH /api/v1/admin/catalog/pricing/role-discounts/."""
        self.client.force_authenticate(user=self.admin)

        # GET
        res_get = self.client.get("/api/v1/admin/catalog/pricing/role-discounts/")
        self.assertEqual(res_get.status_code, status.HTTP_200_OK)
        data = res_get.json()["data"]
        self.assertEqual(data["wholesaler"]["paper_pct"], 32.0)
        self.assertEqual(data["author"]["paper_pct"], 40.0)

        # PATCH - changement de remise grossiste papier à 35%
        res_patch = self.client.patch(
            "/api/v1/admin/catalog/pricing/role-discounts/",
            {
                "wholesaler": {"paper_pct": 35.0, "digital_pct": 30.0},
                "author": {"paper_pct": 45.0, "digital_pct": 25.0},
                "university": {"paper_pct": 30.0, "digital_pct": 40.0},
            },
            format="json"
        )
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)
        self.assertTrue(res_patch.json()["success"])

        # Vérification recalcul immédiat
        p_wholesaler = compute_role_price(self.ouvrage, "wholesaler")
        # 7500 * (1 - 0.35) = 4875.0
        self.assertEqual(p_wholesaler["paper_price"], 4875.0)
        # 4000 * (1 - 0.30) = 2800.0
        self.assertEqual(p_wholesaler["digital_price"], 2800.0)

    def test_03_wholesaler_catalog_api_dynamic_pricing(self):
        """Vérifie que /api/v1/commerce/wholesaler/catalog/ retourne les prix calculés dynamiquement."""
        self.client.force_authenticate(user=self.wholesaler)

        response = self.client.get("/api/v1/commerce/wholesaler/catalog/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        books = response.json()["data"]
        target = next(b for b in books if b["id"] == str(self.ouvrage.id))

        self.assertEqual(target["digital_wholesale_price"], 3000.0)
        self.assertEqual(target["print_wholesale_price"], 5100.0)
        self.assertEqual(target["digital_discount_pct"], 25.0)
        self.assertEqual(target["paper_discount_pct"], 32.0)

    def test_04_author_serializer_discounted_prices(self):
        """Vérifie que OuvrageBasicSerializer calcule les prix remisés pour un utilisateur auteur."""
        from rest_framework.test import APIRequestFactory
        factory = APIRequestFactory()
        request = factory.get("/")
        request.user = self.author

        serializer = OuvrageBasicSerializer(self.ouvrage, context={"request": request})
        data = serializer.data
        self.assertEqual(data["author_discounted_digital_price"], 3000.0)
        self.assertEqual(data["author_discounted_paper_price"], 4500.0)

    def test_05_university_paper_order_uses_role_discount(self):
        """Vérifie que la création d'une commande papier Université applique la remise campus (-25%)."""
        self.client.force_authenticate(user=self.university_user)

        # 7500 * (1 - 0.25) = 5625 XOF par unité. Pour 10 ex : 56 250 XOF.
        response = self.client.post(
            "/api/v1/partners/university/paper-orders/",
            {
                "items": [
                    {"book_id": str(self.ouvrage.id), "quantity": 10}
                ],
                "delivery_campus": "Campus Central UAC",
                "contact_person": "Directeur BU",
                "contact_phone": "+229 97 00 00 00"
            },
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # Vérification du total calculé côté serveur (10 x 5625 XOF = 56 250 XOF)
        self.assertEqual(response.json()["data"]["total_amount"], 56250.0)

    def test_06_wholesaler_profile_api_dynamic_pricing(self):
        """Vérifie que /api/v1/commerce/wholesaler/profile/ renvoie les remises dynamiques définies par l'admin."""
        self.client.force_authenticate(user=self.wholesaler)

        # 1. Vérification avec les taux par défaut (papier: 32%, digital: 25%)
        res = self.client.get("/api/v1/commerce/wholesaler/profile/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        tier = res.json()["data"]["tier"]
        self.assertEqual(tier["print_discount_percent"], 32.0)
        self.assertEqual(tier["digital_discount_percent"], 25.0)

        # 2. Modification par l'administrateur (papier: 38%, digital: 28%)
        self.client.force_authenticate(user=self.admin)
        patch_res = self.client.patch(
            "/api/v1/admin/catalog/pricing/role-discounts/",
            {
                "wholesaler": {"paper_pct": 38.0, "digital_pct": 28.0},
            },
            format="json"
        )
        self.assertEqual(patch_res.status_code, status.HTTP_200_OK)

        # 3. Vérification immédiate côté grossiste
        self.client.force_authenticate(user=self.wholesaler)
        res_updated = self.client.get("/api/v1/commerce/wholesaler/profile/")
        self.assertEqual(res_updated.status_code, status.HTTP_200_OK)
        tier_updated = res_updated.json()["data"]["tier"]
        self.assertEqual(tier_updated["print_discount_percent"], 38.0)
        self.assertEqual(tier_updated["digital_discount_percent"], 28.0)

