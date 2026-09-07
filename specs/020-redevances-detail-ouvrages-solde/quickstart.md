# Quickstart: Validation & Déroulement des Tests

Ce guide décrit les scénarios d'exécution permettant de valider de bout en bout l'affichage détaillé par livre dans la DataTable, la déduction des retraits du solde et la génération du bordereau PDF.

---

## Prérequis

1. Backend Django démarré sur `http://localhost:8000` (ou port actif).
2. Frontend Next.js démarré sur `http://localhost:3000`.
3. Compte utilisateur Auteur de test : `hervic114@gmail.com` (Harry Loko).

---

## Scénario 1 : Vérification de l'API Relevés avec Détail des Livres

Exécuter la requête sur l'endpoint des relevés de l'auteur :

```bash
# Vérification via script Python ou curl authentifié
python -c "
import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()
from apps.accounts.models import User
from apps.rights.views import AuthorRoyaltiesStatementsView
from rest_framework.test import APIRequestFactory, force_authenticate

user = User.objects.get(email='hervic114@gmail.com')
factory = APIRequestFactory()
req = factory.get('/api/v1/rights/author/royalties/?quarter=3&year=2026')
force_authenticate(req, user=user)
resp = AuthorRoyaltiesStatementsView.as_view()(req)
print('Statut:', resp.status_code)
stmts = resp.data.get('data', [])
for s in stmts:
    print('Trimestre:', s['period'])
    print('Ouvrages associés (books):', len(s.get('books', [])))
    for b in s.get('books', []):
        print('  -', b['title'], '-> Net:', b['net_royalty'], 'XOF')
"
```

**Résultat attendu** :
- Le relevé du 3ème trimestre 2026 inclut une clé `books` non vide.
- L'ouvrage "Aplicação de Agentes Remineralizantes" est présent avec sa redevance de 500 XOF.
- L'ouvrage "Agile : Les Fondamentaux" est présent avec sa redevance de 1 050 XOF.

---

## Scénario 2 : Vérification du Dépliement / Repliement dans la DataTable Frontend

1. Se connecter en tant qu'auteur (`hervic114@gmail.com`).
2. Naviguer vers `/author/royalties`.
3. Dans l'onglet "Relevés Trimestriels" :
   - Constater la présence d'une icône chevron sur la ligne du "3ème Trimestre 2026".
   - Cliquer sur le chevron : la ligne se déplie avec animation fluide.
   - Constater l'affichage de la sous-table intégrée contenant :
     - Les miniatures de couverture de chaque livre.
     - Les titres des ouvrages en typographie Serif élégante.
     - Les badges de format et quantités vendues (papier / numérique).
     - Le CA brut généré et la part nette de redevance par livre.
   - Cliquer à nouveau sur le chevron : la sous-table se replie.
4. Réduire la fenêtre du navigateur sous 1024px (mode mobile) :
   - Constater que la carte de trimestre intègre le même bouton accordéon dépliable sans dépassement horizontal.

---

## Scénario 3 : Déduction Stricte des Retraits dans le Solde Disponible

1. Constater le solde total acquis (ex: 1 550 XOF).
2. Cliquer sur "Demander un Versement" :
   - Montant maximal affiché = 1 550 XOF.
   - Saisir 1 000 XOF et valider la demande (statut `pending`).
3. Recharger / observer le solde disponible :
   - Le solde retirable disponible passe immédiatement à `550 XOF` (1 550 - 1 000).
4. Ouvrir à nouveau "Demander un Versement" :
   - Le formulaire plafonne rigoureusement la saisie à `550 XOF`.
   - Tenter de forcer 600 XOF : le système refuse la soumission.

---

## Scénario 4 : Export Bordereau PDF avec Tableau des Ouvrages

1. Sur la ligne du 3ème trimestre 2026, cliquer sur "Relevé Trimestriel".
2. Ouvrir le fichier PDF téléchargé :
   - Vérifier la présence du tableau officiel listant chaque ouvrage nominativement avec son titre, formats, volume d'exemplaires, CA brut, taux et redevance nette.
   - Vérifier la ligne de synthèse consolidée et les mentions légales LAHAThèque.
