"""Modèles du catalogue (Ouvrage, BookAuthor, Discipline, Domain, MetadataONIX)."""
import uuid
from django.db import models
from django.conf import settings

class BookAuthor(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.EmailField(blank=True, null=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    biography = models.TextField(blank=True)

class Discipline(models.Model):
    name = models.CharField(max_length=255)
    code_dewey = models.CharField(max_length=50, blank=True)

class Domain(models.Model):
    discipline = models.ForeignKey(Discipline, on_delete=models.CASCADE, related_name='domains')
    name = models.CharField(max_length=255)

class Ouvrage(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    isbn = models.CharField(max_length=17, unique=True)
    title = models.CharField(max_length=255)
    subtitle = models.CharField(max_length=255, blank=True)
    publisher = models.ForeignKey('publishers_portal.Publisher', on_delete=models.PROTECT, related_name='ouvrages')
    authors = models.ManyToManyField(BookAuthor, related_name='ouvrages', blank=True)
    discipline = models.ForeignKey(Discipline, null=True, blank=True, on_delete=models.SET_NULL, related_name='ouvrages')
    institution = models.ForeignKey('partners.Institution', null=True, blank=True, on_delete=models.SET_NULL, related_name='ouvrages')
    country = models.CharField(max_length=2, default='BJ')
    format_type = models.CharField(max_length=20, choices=[('pdf', 'PDF'), ('epub', 'EPUB'), ('audio', 'Audio')])
    file = models.FileField(upload_to='books/')
    file_size_bytes = models.BigIntegerField(default=0)
    page_count = models.IntegerField(default=0)
    publication_date = models.DateField()
    language = models.CharField(max_length=10, default='fr')
    summary = models.TextField(blank=True)
    table_of_contents = models.JSONField(default=dict, blank=True)
    status = models.CharField(max_length=30, default='draft')
    protection_type = models.CharField(max_length=30, default='lcp')
    price_digital = models.DecimalField(max_digits=10, decimal_places=2, default=5000.00)
    price_paper = models.DecimalField(max_digits=10, decimal_places=2, default=7500.00)

    @property
    def price(self):
        return self.price_digital


class MetadataONIX(models.Model):
    ouvrage = models.OneToOneField(Ouvrage, on_delete=models.CASCADE, related_name='onix_metadata')
    onix_xml = models.TextField()
    onix_version = models.CharField(max_length=10, default='3.0')
    last_imported_at = models.DateTimeField(auto_now=True)
