"""
Script de suppression des souscriptions bouquets pour l'institution.
Supprime les souscriptions spécifiées ainsi que leurs transactions de paiement associées,
puis nettoie le cache.
"""
from apps.partners.models import UniversityBouquetSubscription
from django.core.cache import cache

SUB_IDS = [
    '054ae294-9f93-49d6-b03f-5791d118d09d',  # Bouquet Gestion Demo (Économie)
    'b300b794-8ee5-4047-82a4-cbbc7551a04a',  # Bouquet Gestion Demo (Économie)
    '40f643e7-67e5-4004-8301-d165b7a24c9a',  # Test abonnement bouquet (Sciences tech)
]

print("Debut du nettoyage des souscriptions...")

for sub_id in SUB_IDS:
    try:
        sub = UniversityBouquetSubscription.objects.get(id=sub_id)
        tx = getattr(sub, 'payment_transaction', None)
        title = sub.title
        inst_name = sub.institution.nom if sub.institution else "Inconnue"
        
        # Suppression de la souscription
        sub.delete()
        print(f"[OK] Souscription supprimee : {sub_id} | Titre: '{title}' | Institution: {inst_name}")
        
        # Suppression de la transaction liee si presente
        if tx:
            tx_id = tx.id
            tx.delete()
            print(f"     Transaction associee supprimee : {tx_id}")
            
    except UniversityBouquetSubscription.DoesNotExist:
        print(f"[INFO] Souscription introuvable ou deja supprimee : {sub_id}")
    except Exception as e:
        print(f"[ERREUR] Erreur lors de la suppression de {sub_id} : {e}")

# Vider le cache pour actualiser immediatement les dashboards
try:
    cache.clear()
    print("[OK] Cache Redis vide avec succes.")
except Exception as e:
    print(f"[AVERTISSEMENT] Impossible de vider le cache : {e}")

print("Termine avec succes.")
