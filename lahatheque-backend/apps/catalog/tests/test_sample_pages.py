"""
Tests pour la règle de calcul sample_pages_count et l'endpoint BookSampleStreamView.
"""
from unittest import TestCase
from apps.catalog.models import Ouvrage


class SamplePagesCountFormulaTestCase(TestCase):
    """
    Validation unitaire de la formule révisée de sample_pages_count :
    - 0 page / inconnu -> 10
    - 1 page -> 1
    - 4 pages -> 3
    - 5 pages -> 4
    - 6 pages -> 5
    - 10 pages -> 8
    - 20 pages -> 8
    - 105 pages -> 13
    - 300 pages -> 30
    """

    def test_sample_pages_count_rules(self):
        cases = [
            (0, 10),
            (-1, 10),
            (1, 1),
            (2, 1),
            (4, 3),
            (5, 4),
            (6, 5),
            (8, 7),
            (10, 8),
            (20, 8),
            (105, 13),
            (300, 30),
            (500, 30),
        ]
        for page_count, expected in cases:
            ouv = Ouvrage(title="Livre Test", page_count=page_count)
            self.assertEqual(
                ouv.sample_pages_count, expected,
                f"Échec pour page_count={page_count} : attendu={expected}, obtenu={ouv.sample_pages_count}"
            )
