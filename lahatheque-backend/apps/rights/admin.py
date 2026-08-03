from django.contrib import admin
from .models import AuthorRight, RightTerritory, RoyaltyRate, RoyaltyCalculation, RoyaltyPayoutLine
admin.site.register(AuthorRight)
admin.site.register(RightTerritory)
admin.site.register(RoyaltyRate)
admin.site.register(RoyaltyCalculation)
admin.site.register(RoyaltyPayoutLine)
