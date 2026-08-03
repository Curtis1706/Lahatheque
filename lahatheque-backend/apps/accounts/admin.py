from django.contrib import admin
from .models import User, MFAConfig, OTP
admin.site.register(User)
admin.site.register(MFAConfig)
admin.site.register(OTP)
