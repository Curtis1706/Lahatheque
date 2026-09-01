from django.contrib import admin
from .models import User, MFAConfig, OTP, RevokedPartnerToken

admin.site.register(User)
admin.site.register(MFAConfig)
admin.site.register(OTP)


@admin.register(RevokedPartnerToken)
class RevokedPartnerTokenAdmin(admin.ModelAdmin):
    list_display = ('jti', 'partner_id', 'revoked_at', 'expires_at')
    search_fields = ('jti', 'partner_id')
    readonly_fields = ('revoked_at',)

