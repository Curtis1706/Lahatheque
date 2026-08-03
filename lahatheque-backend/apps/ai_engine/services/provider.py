from .base import ClassificationService

class ConcreteAIProvider(ClassificationService):
    def analyze_book(self, text_content):
        # TODO: Implémenter l'appel au fournisseur IA retenu
        return {
            "summary": "Résumé généré par IA",
            "keywords": ["droit", "afrique"],
            "category": "Sciences Juridiques"
        }
