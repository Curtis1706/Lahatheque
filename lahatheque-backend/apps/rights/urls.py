from django.urls import path
from .views import MyRoyaltyStatementsView

app_name = 'rights'

urlpatterns = [
    path('royalties/my-statements/', MyRoyaltyStatementsView.as_view(), name='my-royalty-statements'),
]

