from django.contrib import admin
from .models import Institution, Faculty, Department, StudentAffiliation
admin.site.register(Institution)
admin.site.register(Faculty)
admin.site.register(Department)
admin.site.register(StudentAffiliation)
