"""URL Routing Racine pour LAHAThèque v3.2 API (reloaded orders)."""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('apps.accounts.urls')),
    path('api/v1/oauth2/', include('apps.accounts.oauth2.urls')),
    path('api/v1/partners/', include('apps.partners.urls')),
    path('api/v1/sso/', include('apps.partners.sso.urls')),
    path('api/v1/catalog/', include('apps.catalog.urls')),
    path('api/v1/protection/', include('apps.protection.urls')),
    path('api/v1/publishers/', include('apps.publishers_portal.urls')),
    path('api/v1/rights/', include('apps.rights.urls')),
    path('api/v1/commerce/', include('apps.commerce.urls')),
    path('api/v1/ai/', include('apps.ai_engine.urls')),
    path('api/v1/audio/', include('apps.audio.urls')),
    path('api/v1/reporting/', include('apps.reporting.urls')),
    path('api/v1/admin/', include('apps.reporting.admin_urls')),
    path('api/v1/reader/', include('apps.reader.urls')),
    path('api/v1/partner/', include('apps.reader.partner_urls')),
    path('api/v1/student/', include('apps.student.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

