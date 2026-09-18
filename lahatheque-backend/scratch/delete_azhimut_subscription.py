"""
Script pour supprimer la souscription bouquet du compte azhimut (devmatrice@gmail.com).
Prend en compte les abonnements particuliers (ClientBouquetSubscription)
et institutionnels (UniversityBouquetSubscription).
"""
from apps.commerce.models import ClientBouquetSubscription
from apps.partners.models import UniversityBouquetSubscription
from django.core.cache import cache

EMAIL = "devmatrice@gmail.com"
print(f"Recherche et suppression des souscriptions bouquets pour {EMAIL}...")

# 1. Abonnements particuliers (ClientBouquetSubscription)
client_subs = ClientBouquetSubscription.objects.filter(user__email__iexact=EMAIL)
c_count = client_subs.count()
print(f"Abonnements particuliers trouves : {c_count}")

for cs in client_subs:
    tx = cs.payment_transaction
    cs_id = cs.id
    title = cs.title
    status = cs.status
    cs.delete()
    print(f"[OK] ClientBouquetSubscription supprimee : {cs_id} | Titre: '{title}' | Statut: {status}")
    if tx:
        tx_id = tx.id
        tx.delete()
        print(f"     Transaction associee supprimee : {tx_id}")

# 2. Abonnements institutionnels (au cas où l'institution est rattachée à cet email)
univ_subs = (
    UniversityBouquetSubscription.objects.filter(institution__user__email__iexact=EMAIL) |
    UniversityBouquetSubscription.objects.filter(institution__contact_email__iexact=EMAIL)
)
u_count = univ_subs.count()
if u_count > 0:
    print(f"Abonnements universite trouves : {u_count}")
    for us in univ_subs:
        tx = us.payment_transaction
        us_id = us.id
        title = us.title
        us.delete()
        print(f"[OK] UniversityBouquetSubscription supprimee : {us_id} | Titre: '{title}'")
        if tx:
            tx_id = tx.id
            tx.delete()
            print(f"     Transaction associee supprimee : {tx_id}")

# Vider le cache
try:
    cache.clear()
    print("[OK] Cache vide avec succes.")
except Exception as e:
    print(f"Avertissement cache: {e}")

print("SUCCESS")
