from django.contrib import admin
from .models import Currency, SubscriptionPlan, Subscription, PaymentTransaction
admin.site.register(Currency)
admin.site.register(SubscriptionPlan)
admin.site.register(Subscription)
admin.site.register(PaymentTransaction)
