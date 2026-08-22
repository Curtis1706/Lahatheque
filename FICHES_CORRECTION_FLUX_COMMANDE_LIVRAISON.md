# FICHES DE CORRECTION — Flux Commande → Livraison (sans Moneroo)

**3 fiches backend — Moneroo volontairement laissé de côté, à traiter séparément une fois le compte créé**

---

## FICHE C1 — Correction du bug de vérification de stock à la commande

### Le problème

Dans `CreateOrderView.post`, le code utilise `getattr(ouvrage, 'stock', None)` pour vérifier le stock disponible. Mais le `related_name` réel sur `StockOuvrage.ouvrage` est `stocks_entrepots` (pluriel, car un ouvrage peut avoir du stock dans plusieurs entrepôts) — l'attribut `.stock` n'existe pas. `stock_obj` vaut donc toujours `None`, et le contrôle `if stock_obj and ...` ne se déclenche jamais. N'importe quelle quantité peut être commandée en format papier, même si le stock réel est à zéro.

### Fichier concerné
- `lahatheque-backend/apps/commerce/views.py` (`CreateOrderView`)

### Prompt Antigravity

```
CONTEXTE :
Backend Django LAHAThèque. Dans `apps/commerce/views.py`, `CreateOrderView.post` vérifie le
stock disponible avant de créer une commande papier, mais utilise un attribut qui n'existe pas
(`ouvrage.stock`) au lieu du bon related_name (`ouvrage.stocks_entrepots`). Le contrôle est donc
inactif — aucune commande n'est jamais bloquée pour rupture de stock.

Le modèle StockOuvrage (apps/commerce/models.py) a :
  ouvrage = models.ForeignKey('catalog.Ouvrage', on_delete=models.CASCADE, related_name="stocks_entrepots")
  quantite_reelle, quantite_reservee (IntegerField)
  Property quantite_disponible = quantite_reelle - quantite_reservee (à vérifier dans le modèle)

Un ouvrage peut avoir du stock dans PLUSIEURS entrepôts — il faut sommer le disponible sur
tous les entrepôts, pas se limiter à un seul.

CE QU'IL FAUT FAIRE — EXACTEMENT :

Dans `apps/commerce/views.py`, méthode `CreateOrderView.post`, TROUVER :

```python
            # Correction 2.4 : Vérification du stock disponible pour le format papier
            if format_type == 'paper':
                has_paper = True
                stock_obj = getattr(ouvrage, 'stock', None)
                if stock_obj and stock_obj.stock_disponible < quantity:
                    return Response({
                        'error': f"Stock suffisant indisponible pour '{ouvrage.title}' en format Papier (stock: {stock_obj.stock_disponible})."
                    }, status=status.HTTP_400_BAD_REQUEST)
```

REMPLACER par :

```python
            # Vérification du stock disponible pour le format papier, agrégé sur tous les entrepôts
            if format_type == 'paper':
                has_paper = True
                from django.db.models import Sum, F

                total_disponible = ouvrage.stocks_entrepots.aggregate(
                    total=Sum(F('quantite_reelle') - F('quantite_reservee'))
                )['total'] or 0

                if total_disponible < quantity:
                    return Response({
                        'error': f"Stock insuffisant pour '{ouvrage.title}' en format Papier "
                                 f"(disponible : {total_disponible}, demandé : {quantity})."
                    }, status=status.HTTP_400_BAD_REQUEST)
```

NE PAS MODIFIER le reste de la vue (calcul du prix, création des lignes, etc.).

Après cette correction, vérifier que le modèle `StockOuvrage` a bien une agrégation cohérente :
si le champ s'appelle différemment (vérifier `quantite_reelle` et `quantite_reservee` existent
bien tels quels dans `apps/commerce/models.py`), adapter les noms de champs dans le code ci-dessus
en conséquence avant application.
```

---

## FICHE C2 — Exposer les données de livraison complètes (date, plage horaire, articles)

### Le problème

Trois informations existent en base mais ne sont jamais renvoyées par l'API :
1. `date_livraison_souhaitee`, `plage_horaire_debut`, `plage_horaire_fin` — absents de `PhysicalDeliverySerializer`, donc invisibles côté client ET côté gestionnaire.
2. Les articles de la commande (`items`) — `DeliveryDetailView.get` ne les renvoie pas, alors que le frontend gestionnaire (`app/manager/delivery/[id]/page.tsx`) les affiche déjà (`item.book_title`, `item.isbn`, `item.quantity`).
3. Le gestionnaire ne sait donc ni quand le client souhaite être livré, ni quels livres préparer.

### Fichiers concernés
- `lahatheque-backend/apps/commerce/serializers.py`
- `lahatheque-backend/apps/commerce/manager_views.py`

### Prompt Antigravity

```
CONTEXTE :
Backend Django LAHAThèque. Le PhysicalDeliverySerializer n'expose pas les champs
date_livraison_souhaitee / plage_horaire_debut / plage_horaire_fin (ajoutés en base récemment).
La vue DeliveryDetailView.get (apps/commerce/manager_views.py) ne renvoie pas non plus la liste
des articles de la commande, alors que le frontend gestionnaire les attend sous la clé "items".

CE QU'IL FAUT FAIRE — EXACTEMENT :

### 1. Dans `apps/commerce/serializers.py`, TROUVER :

```python
class PhysicalDeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = PhysicalDelivery
        fields = ['id', 'shipping_address', 'city', 'country', 'tracking_number', 'carrier_name', 'statut', 'updated_at']
```

REMPLACER par :

```python
class PhysicalDeliverySerializer(serializers.ModelSerializer):
    class Meta:
        model = PhysicalDelivery
        fields = [
            'id', 'shipping_address', 'city', 'country',
            'tracking_number', 'carrier_name', 'statut', 'updated_at',
            'date_livraison_souhaitee', 'plage_horaire_debut', 'plage_horaire_fin',
        ]
```

### 2. Dans `apps/commerce/manager_views.py`, méthode `DeliveryDetailView.get`, TROUVER :

```python
        data = {
            "id": str(d.id),
            "commande_id": str(d.commande_id),
            "client_nom": d.commande.user.get_full_name() if d.commande.user else "—",
            "client_email": d.commande.user.email if d.commande.user else "—",
            "shipping_address": d.shipping_address,
            "city": d.city,
            "country": d.country,
            "carrier_name": d.carrier_name,
            "tracking_number": d.tracking_number,
            "statut": d.statut,
            "created_at": d.created_at.isoformat(),
            "updated_at": d.updated_at.isoformat(),
        }
        return Response({"success": True, "data": data, "error": None})

    def patch(self, request, pk):
```

REMPLACER par :

```python
        lignes = d.commande.lignes.select_related('ouvrage').filter(format_type='paper')
        items = [
            {
                "id": str(l.id),
                "book_title": l.ouvrage.title,
                "isbn": l.ouvrage.isbn or "—",
                "quantity": l.quantity,
            }
            for l in lignes
        ]

        data = {
            "id": str(d.id),
            "commande_id": str(d.commande_id),
            "client_nom": d.commande.user.get_full_name() if d.commande.user else "—",
            "client_email": d.commande.user.email if d.commande.user else "—",
            "shipping_address": d.shipping_address,
            "city": d.city,
            "country": d.country,
            "carrier_name": d.carrier_name,
            "tracking_number": d.tracking_number,
            "statut": d.statut,
            "created_at": d.created_at.isoformat(),
            "updated_at": d.updated_at.isoformat(),
            "date_livraison_souhaitee": d.date_livraison_souhaitee.isoformat() if d.date_livraison_souhaitee else None,
            "plage_horaire_debut": d.plage_horaire_debut.strftime("%H:%M") if d.plage_horaire_debut else None,
            "plage_horaire_fin": d.plage_horaire_fin.strftime("%H:%M") if d.plage_horaire_fin else None,
            "items": items,
        }
        return Response({"success": True, "data": data, "error": None})

    def patch(self, request, pk):
```

NE PAS MODIFIER `DeliveriesListView` (la liste n'a pas besoin du détail des articles, seul le
détail en a besoin — évite de surcharger la liste avec des requêtes N+1).

NE PAS MODIFIER la logique de `patch` dans cette fiche — la Fiche C3 s'en charge.
```

---

## FICHE C3 — Notification réelle au client + clôture automatique du statut de commande

### Le problème

Deux manquements dans `DeliveryDetailView.patch` :
1. Aucune notification n'est envoyée au client quand le gestionnaire marque la livraison "Expédiée" ou "Livrée" — le panneau "Notifications envoyées" du frontend affiche toujours une liste vide car le backend ne renvoie jamais ce champ.
2. Le statut global de la commande (`Order.statut_commande`) ne passe jamais à `completed` quand la livraison est marquée `livre` — le client voit sa commande éternellement "en traitement".

### Fichiers concernés
- `lahatheque-backend/apps/reporting/models.py` (nouveaux types de notification)
- `lahatheque-backend/apps/commerce/manager_views.py` (`DeliveryDetailView.patch`)

### Prompt Antigravity

```
CONTEXTE :
Backend Django LAHAThèque. `DeliveryDetailView.patch` (apps/commerce/manager_views.py) met à
jour le statut d'une livraison (en_preparation → expedie → livre) mais :
1. N'envoie jamais de notification au client lors du changement de statut
2. Ne met jamais à jour Order.statut_commande en conséquence

Le service `notify_user(user, notification_type, title, message, action_url, resource_id)`
existe déjà dans `apps/reporting/services.py` et est déjà utilisé dans
`apps/commerce/services.py` (handle_payment_success).

Le modèle Notification (apps/reporting/models.py) a une classe NotificationType (TextChoices)
qui ne contient pas encore de types dédiés à la livraison — il faut les ajouter.

CE QU'IL FAUT FAIRE — EXACTEMENT :

### 1. Dans `apps/reporting/models.py`, TROUVER la classe `NotificationType` :

```python
    class NotificationType(models.TextChoices):
        SYSTEM = 'system', 'Système'
        MESSAGE = 'message', 'Message'
        BOOKING_CONFIRMED = 'booking_confirmed', 'Réservation Confirmée'
        BOOKING_REMINDER = 'booking_reminder', 'Rappel Réservation'
        COMMUNITY_REPLY = 'community_reply', 'Réponse Communauté'
        EXPERT_QUESTION = 'expert_question', 'Question Expert'
        EXPERT_REPLY = 'expert_reply', 'Réponse Expert'
        ASSIGNMENT_CREATED = 'assignment_created', 'Devoir Créé'
        ASSIGNMENT_GRADED = 'assignment_graded', 'Devoir Noté'
        ASSIGNMENT_SUBMITTED = 'assignment_submitted', 'Devoir Soumis'
        ASSIGNMENT_OVERDUE = 'assignment_overdue', 'Devoir En Retard'
```

REMPLACER par (ajout de 4 types) :

```python
    class NotificationType(models.TextChoices):
        SYSTEM = 'system', 'Système'
        MESSAGE = 'message', 'Message'
        BOOKING_CONFIRMED = 'booking_confirmed', 'Réservation Confirmée'
        BOOKING_REMINDER = 'booking_reminder', 'Rappel Réservation'
        COMMUNITY_REPLY = 'community_reply', 'Réponse Communauté'
        EXPERT_QUESTION = 'expert_question', 'Question Expert'
        EXPERT_REPLY = 'expert_reply', 'Réponse Expert'
        ASSIGNMENT_CREATED = 'assignment_created', 'Devoir Créé'
        ASSIGNMENT_GRADED = 'assignment_graded', 'Devoir Noté'
        ASSIGNMENT_SUBMITTED = 'assignment_submitted', 'Devoir Soumis'
        ASSIGNMENT_OVERDUE = 'assignment_overdue', 'Devoir En Retard'
        PAYMENT_SUCCESS = 'payment_success', 'Paiement Confirmé'
        PAYMENT_FAILED = 'payment_failed', 'Paiement Échoué'
        ORDER_SHIPPED = 'order_shipped', 'Commande Expédiée'
        ORDER_DELIVERED = 'order_delivered', 'Commande Livrée'
```

Générer la migration :
```bash
python manage.py makemigrations reporting
```

### 2. Dans `apps/commerce/manager_views.py`, méthode `DeliveryDetailView.patch`, TROUVER :

```python
    def patch(self, request, pk):
        """Mise à jour statut, transporteur et numéro de suivi."""
        if not _is_manager_or_admin(request.user):
            return Response({"success": False, "data": None, "error": "Accès refusé."}, status=403)
        try:
            d = PhysicalDelivery.objects.get(pk=pk)
        except PhysicalDelivery.DoesNotExist:
            return Response({"success": False, "data": None, "error": "Livraison introuvable."}, status=404)

        allowed = ["statut", "carrier_name", "tracking_number", "shipping_address", "city", "country"]
        for field in allowed:
            val = request.data.get(field)
            if val is not None:
                setattr(d, field, val)
        d.save()

        return Response({"success": True, "data": {"id": str(d.id), "statut": d.statut}, "error": None})
```

REMPLACER par :

```python
    def patch(self, request, pk):
        """Mise à jour statut, transporteur et numéro de suivi. Notifie le client et
        clôture automatiquement la commande à la livraison."""
        if not _is_manager_or_admin(request.user):
            return Response({"success": False, "data": None, "error": "Accès refusé."}, status=403)
        try:
            d = PhysicalDelivery.objects.select_related('commande__user').get(pk=pk)
        except PhysicalDelivery.DoesNotExist:
            return Response({"success": False, "data": None, "error": "Livraison introuvable."}, status=404)

        previous_statut = d.statut

        allowed = ["statut", "carrier_name", "tracking_number", "shipping_address", "city", "country"]
        for field in allowed:
            val = request.data.get(field)
            if val is not None:
                setattr(d, field, val)
        d.save()

        # Notification client + clôture de commande sur transition de statut réelle
        if d.statut != previous_statut and d.commande.user:
            from apps.reporting.services import notify_user
            from apps.reporting.models import Notification

            if d.statut == 'expedie':
                try:
                    notify_user(
                        user=d.commande.user,
                        notification_type=Notification.NotificationType.ORDER_SHIPPED,
                        title="Votre commande a été expédiée",
                        message=(
                            f"Votre commande #{str(d.commande_id)[:8]} a été expédiée"
                            + (f" via {d.carrier_name}" if d.carrier_name else "")
                            + (f" (suivi : {d.tracking_number})" if d.tracking_number else "")
                            + "."
                        ),
                        action_url="/student/orders",
                        resource_id=str(d.commande_id),
                    )
                except Exception:
                    pass

            elif d.statut == 'livre':
                d.commande.statut_commande = 'completed'
                d.commande.save(update_fields=['statut_commande'])
                try:
                    notify_user(
                        user=d.commande.user,
                        notification_type=Notification.NotificationType.ORDER_DELIVERED,
                        title="Votre commande a été livrée",
                        message=f"Votre commande #{str(d.commande_id)[:8]} a été livrée avec succès. Merci de votre confiance !",
                        action_url="/student/orders",
                        resource_id=str(d.commande_id),
                    )
                except Exception:
                    pass

        return Response({
            "success": True,
            "data": {
                "id": str(d.id),
                "statut": d.statut,
                "commande_statut": d.commande.statut_commande,
            },
            "error": None
        })
```

### 3. Ajouter l'historique des notifications dans `DeliveryDetailView.get` (issu de la Fiche C2)

Dans le même fichier, TROUVER le bloc `data = {...}` de `DeliveryDetailView.get` (après application
de la Fiche C2, il contient déjà `items`). AJOUTER juste avant `return Response(...)` :

```python
        notifications_list = []
        try:
            from apps.reporting.models import Notification
            notifs = Notification.objects.filter(
                user=d.commande.user,
                resource_id=str(d.commande_id),
                notification_type__in=['order_shipped', 'order_delivered']
            ).order_by('created_at')
            for n in notifs:
                notifications_list.append({
                    "id": str(n.id),
                    "type": "shipment" if n.notification_type == "order_shipped" else "delivery",
                    "sent_at": n.created_at.isoformat(),
                    "recipient_email": d.commande.user.email if d.commande.user else "",
                })
        except Exception:
            pass
        data["notifications"] = notifications_list
```

NE PAS MODIFIER `DeliveriesListView` dans cette fiche.
```

---

# RÉSUMÉ

| Ordre | Fiche | Résumé |
|---|---|---|
| 1 | C1 | Corrige le bug de vérification de stock (mauvais related_name → contrôle toujours inactif) |
| 2 | C2 | Expose date/plage horaire de livraison + liste des articles dans l'API |
| 3 | C3 | Notification réelle au client à l'expédition/livraison + clôture automatique de la commande |

**Moneroo (redirection de paiement) volontairement exclu de ce lot** — à traiter dès que le compte marchand Moneroo et les identifiants (clé API, clé de signature webhook) seront disponibles. Le code de redirection à corriger à ce moment-là : `OrderCreateForm.tsx` doit lire `result.checkout_url` (pas `result.payment_url`) à la racine de la réponse (pas sous `.data`), et `/checkout/page.tsx` doit faire de même au lieu d'afficher un écran de succès statique sans redirection.

Après application des 3 fiches : le stock est réellement contrôlé, le gestionnaire voit tout ce dont il a besoin pour préparer et livrer une commande, et le client est informé à chaque étape jusqu'à la clôture automatique de sa commande.
