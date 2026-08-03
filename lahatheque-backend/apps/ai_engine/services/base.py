from abc import ABC, abstractmethod

class ClassificationService(ABC):
    @abstractmethod
    def analyze_book(self, text_content):
        pass
