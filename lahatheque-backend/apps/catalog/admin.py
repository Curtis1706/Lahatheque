from django.contrib import admin
from .models import Ouvrage, BookAuthor, Discipline, Domain, MetadataONIX
admin.site.register(Ouvrage)
admin.site.register(BookAuthor)
admin.site.register(Discipline)
admin.site.register(Domain)
admin.site.register(MetadataONIX)
