# FICHES DE CORRECTION — Système de Notifications Complet

**5 fiches — Cloche universelle + page dédiée + déclencheurs manquants (stock, nouvelles commandes, dépôts)**

---

## Constat de départ

Le backend a un vrai système (`Notification`, `notify_user()`, route `/api/v1/reporting/notifications/`, protégée par authentification). Il est déjà utilisé pour paiement et livraison (Fiches C3/D3). Mais :

- **Aucune interface ne l'affiche**, sauf la page `/wholesaler/notifications` qui utilise en réalité un **second modèle séparé** (`WholesaleNotification`, dédié aux nouveautés/meilleures ventes du catalogue grossiste — un usage légitimement différent, pas un doublon à fusionner de force).
- L'icône `BellRing` est déjà importée dans `dashboard-sidebar.tsx` et `dashboard-header.tsx` mais **jamais reliée à une vraie liste de notifications** — `dashboard-header.tsx` n'est même utilisé nulle part dans l'app (composant mort).
- Aucun déclencheur pour : seuil de stock bas, nouvelle commande à préparer, nouveau dépôt à valider.

## Approche retenue

Un seul point d'injection universel : `app/(dashboard)/layout.tsx`, qui enveloppe déjà **toutes** les pages de **tous** les rôles. Une cloche ajoutée ici est visible partout, en une seule fiche, sans toucher à chaque page individuellement. La page `/notifications` est elle aussi unique et partagée : `NotificationViewSet` filtre déjà par `request.user`, donc la même page fonctionne pour n'importe quel rôle sans logique conditionnelle.

Le système `WholesaleNotification` du Grossiste est **laissé tel quel** — c'est le seul flux de notification qui fonctionne déjà dans le projet, inutile de prendre le risque de le casser pour une fusion cosmétique.

---

## FICHE G1 — Backend : endpoints de comptage et de lecture groupée

### Le problème
`NotificationViewSet` permet de lister/modifier une notification à la fois, mais il manque un endpoint pour le compteur "non lues" (nécessaire pour le badge de la cloche) et un endpoint "tout marquer comme lu".

### Fichier concerné
- `lahatheque-backend/apps/reporting/views.py`

### Prompt Antigravity

```
CONTEXTE :
Backend Django LAHAThèque. NotificationViewSet (apps/reporting/views.py) existe et fonctionne
(list/retrieve/update/delete, filtré par request.user). Il manque :
1. Un endpoint léger pour le compteur de notifications non lues (pour le badge de la cloche)
2. Une action pour tout marquer comme lu en un clic
Il manque aussi permission_classes explicite (actuellement absent, repose sur le défaut global).

CE QU'IL FAUT FAIRE — EXACTEMENT :

Réécrire entièrement la section notifications de `apps/reporting/views.py` par :

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.serializers import ModelSerializer
from .models import Notification


class NotificationSerializer(ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'


class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

    @action(detail=False, methods=['get'], url_path='unread-count')
    def unread_count(self, request):
        count = self.get_queryset().filter(is_read=False).count()
        return Response({"success": True, "data": {"unread_count": count}})

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        updated = self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({"success": True, "data": {"marked_count": updated}})

NE PAS MODIFIER apps/reporting/urls.py — le router DRF existant
(router.register(r'notifications', NotificationViewSet, ...)) prend automatiquement en charge
les nouvelles actions @action sans changement de routing. Les nouvelles routes seront
disponibles à /api/v1/reporting/notifications/unread-count/ et
/api/v1/reporting/notifications/mark-all-read/.
```

---

## FICHE G2 — Backend : alerte de stock bas au Gestionnaire (tâche périodique)

### Le problème
Le CDC exige des "alertes automatiques de rupture ou de seuil bas de stock". `seuil_alerte` existe en base mais rien ne le vérifie jamais automatiquement.

### Fichiers concernés
- `lahatheque-backend/apps/reporting/tasks.py`
- `lahatheque-backend/config/celery.py`

### Prompt Antigravity

```
CONTEXTE :
Backend Django LAHAThèque. Il faut une tâche Celery périodique qui vérifie tous les
StockOuvrage dont quantite_disponible passe sous seuil_alerte, et notifie les Gestionnaires
et Administrateurs — sans spammer (ne renotifie pas un article déjà signalé et non encore lu).

Le modèle StockOuvrage (apps/commerce/models.py) a : ouvrage (FK), entrepot (FK),
quantite_reelle, quantite_reservee, seuil_alerte, et une property quantite_disponible.

CE QU'IL FAUT FAIRE — EXACTEMENT :

Ajouter à la fin de apps/reporting/tasks.py :

@shared_task
def task_check_stock_alerts():
    """
    Vérifie les stocks sous le seuil d'alerte et notifie Gestionnaires + Administrateurs.
    Exécutée périodiquement (toutes les 6h).
    """
    from apps.commerce.models import StockOuvrage
    from apps.accounts.models import User
    from apps.reporting.models import Notification
    from apps.reporting.services import notify_user

    stocks = StockOuvrage.objects.select_related('ouvrage', 'entrepot').all()
    alert_stocks = [s for s in stocks if s.quantite_disponible <= s.seuil_alerte]

    if not alert_stocks:
        return {"alerts_sent": 0}

    recipients = User.objects.filter(role__in=['manager', 'admin', 'super_admin'], is_active=True)
    if not recipients.exists():
        return {"alerts_sent": 0, "warning": "Aucun gestionnaire/admin actif trouvé."}

    sent = 0
    for stock in alert_stocks:
        already_notified = Notification.objects.filter(
            notification_type='system',
            resource_id=str(stock.id),
            is_read=False,
        ).exists()
        if already_notified:
            continue

        for recipient in recipients:
            try:
                notify_user(
                    user=recipient,
                    notification_type=Notification.NotificationType.SYSTEM,
                    title="Alerte de stock bas" if stock.quantite_disponible > 0 else "Rupture de stock",
                    message=(
                        f"« {stock.ouvrage.title} » — {stock.quantite_disponible} exemplaire(s) "
                        f"disponible(s) a {stock.entrepot.nom} (seuil : {stock.seuil_alerte})."
                    ),
                    action_url="/manager/stock/alerts",
                    resource_id=str(stock.id),
                )
                sent += 1
            except Exception:
                pass

    return {"alerts_sent": sent, "articles_en_alerte": len(alert_stocks)}

Ajouter la planification dans config/celery.py, dans app.conf.beat_schedule :

    'stock-alerts-check': {
        'task': 'apps.reporting.tasks.task_check_stock_alerts',
        'schedule': crontab(minute='0', hour='*/6'),
    },
```

---

## FICHE G3 — Backend : notifier le Gestionnaire (nouvelle commande) et le Chef Maquettiste (nouveau dépôt)

### Fichiers concernés
- `lahatheque-backend/apps/commerce/views.py` (CreateOrderView)
- `lahatheque-backend/apps/catalog/views.py` (MaquettisteDepositViewSet.submit_for_validation)

### Prompt Antigravity

```
CONTEXTE :
Deux événements métier ne notifient jamais personne actuellement :
1. Une nouvelle commande papier est créée → le Gestionnaire doit être alerté qu'un article
   est à préparer.
2. Un maquettiste soumet un dépôt pour validation → le Chef Maquettiste doit être alerté.

CE QU'IL FAUT FAIRE — EXACTEMENT :

### 1. Dans apps/commerce/views.py, méthode CreateOrderView.post

Localiser la fin de la méthode, juste avant le Response(...) final de succès qui suit la
création de PhysicalDelivery (si has_paper est vrai). AJOUTER juste avant ce return :

            if has_paper:
                from apps.accounts.models import User
                from apps.reporting.services import notify_user
                from apps.reporting.models import Notification

                managers = User.objects.filter(role__in=['manager', 'admin'], is_active=True)
                for m in managers:
                    try:
                        notify_user(
                            user=m,
                            notification_type=Notification.NotificationType.SYSTEM,
                            title="Nouvelle commande papier a preparer",
                            message=f"Commande #{str(commande.id)[:8]} de {request.user.get_full_name() or request.user.email} - preparation requise.",
                            action_url="/manager/delivery",
                            resource_id=str(commande.id),
                        )
                    except Exception:
                        pass

Adapter le nom exact de la variable de commande (commande/order) au nom réellement utilisé
dans cette méthode — vérifier avant application.

### 2. Dans apps/catalog/views.py, méthode MaquettisteDepositViewSet.submit_for_validation

TROUVER :
        ouvrage.status = 'submitted'
        ouvrage.save(update_fields=['status'])
        return Response({
            "success": True,
            "message": f"L'ouvrage « {ouvrage.title} » a été soumis au Chef Maquettiste."
        })

REMPLACER par :
        ouvrage.status = 'submitted'
        ouvrage.save(update_fields=['status'])

        try:
            from apps.accounts.models import User
            from apps.reporting.services import notify_user
            from apps.reporting.models import Notification

            chiefs = User.objects.filter(role__in=['chief_layout', 'admin'], is_active=True)
            for chief in chiefs:
                notify_user(
                    user=chief,
                    notification_type=Notification.NotificationType.SYSTEM,
                    title="Nouveau dépôt à valider",
                    message=f"« {ouvrage.title} » a été soumis par {request.user.get_full_name() or request.user.email}.",
                    action_url="/chief-layout/validation",
                    resource_id=str(ouvrage.id),
                )
        except Exception:
            pass

        return Response({
            "success": True,
            "message": f"L'ouvrage « {ouvrage.title} » a été soumis au Chef Maquettiste."
        })

NE PAS MODIFIER les autres actions de ces deux fichiers.
```

---

## FICHE G4 — Frontend : service de notifications générique

### Fichier concerné
- `lahatheque-frontend/lib/services/notifications.ts` (nouveau)

### Prompt Antigravity

```
CONTEXTE :
Nouveau service frontend générique pour consommer /api/v1/reporting/notifications/ — valable
pour n'importe quel rôle connecté, le backend filtre déjà par request.user.

CE QU'IL FAUT FAIRE — EXACTEMENT :

Créer lib/services/notifications.ts :

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  notification_type: string;
  action_url: string;
  resource_id: string;
  is_read: boolean;
  created_at: string;
}

const BASE = "/api/bff/reporting/notifications";

export async function getNotifications(): Promise<AppNotification[]> {
  const res = await fetch(`${BASE}/`, { credentials: "include", cache: "no-store" });
  if (!res.ok) return [];
  const json = await res.json();
  return Array.isArray(json) ? json : json.results || json.data || [];
}

export async function getUnreadCount(): Promise<number> {
  try {
    const res = await fetch(`${BASE}/unread-count/`, { credentials: "include", cache: "no-store" });
    if (!res.ok) return 0;
    const json = await res.json();
    return json.data?.unread_count ?? 0;
  } catch {
    return 0;
  }
}

export async function markNotificationRead(id: string): Promise<void> {
  await fetch(`${BASE}/${id}/`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_read: true }),
  });
}

export async function markAllNotificationsRead(): Promise<void> {
  await fetch(`${BASE}/mark-all-read/`, { method: "POST", credentials: "include" });
}
```

---

## FICHE G5 — Frontend : cloche universelle + page /notifications partagée

### Fichiers concernés
- `lahatheque-frontend/components/ui/notification-bell.tsx` (nouveau)
- `lahatheque-frontend/app/(dashboard)/layout.tsx`
- `lahatheque-frontend/app/(dashboard)/notifications/page.tsx` (nouveau)

### Prompt Antigravity

```
CONTEXTE :
Ajouter une cloche de notifications visible sur TOUTES les pages de TOUS les rôles, en un seul
point d'injection : app/(dashboard)/layout.tsx. Ajouter aussi une page /notifications partagée
(le backend filtre déjà par utilisateur connecté, aucune logique par rôle nécessaire).

CE QU'IL FAUT FAIRE :

### 1. Créer components/ui/notification-bell.tsx

"use client";

import React, { useEffect, useRef, useState } from "react";
import { Bell, Check } from "lucide-react";
import Link from "next/link";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
} from "@/lib/services/notifications";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    async function poll() {
      const count = await getUnreadCount();
      if (mounted) setUnread(count);
    }
    poll();
    const interval = setInterval(poll, 60000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleOpen() {
    setOpen((v) => !v);
    if (!open) {
      setLoading(true);
      const data = await getNotifications();
      setItems(data.slice(0, 8));
      setLoading(false);
    }
  }

  async function handleItemClick(n: AppNotification) {
    if (!n.is_read) {
      await markNotificationRead(n.id);
      setUnread((c) => Math.max(0, c - 1));
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, is_read: true } : i)));
    }
    setOpen(false);
  }

  async function handleMarkAll() {
    await markAllNotificationsRead();
    setUnread(0);
    setItems((prev) => prev.map((i) => ({ ...i, is_read: true })));
  }

  return (
    <div ref={ref} className="fixed top-3 right-3 z-40 sm:top-4 sm:right-4">
      <button
        onClick={handleOpen}
        className="relative w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center shadow-lg hover:bg-navy-hover transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4.5 h-4.5" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-background border border-border rounded-2xl shadow-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-xs font-bold text-navy">Notifications</span>
            {unread > 0 && (
              <button onClick={handleMarkAll} className="text-[11px] text-gold font-semibold flex items-center gap-1 hover:underline">
                <Check className="w-3 h-3" />
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-border">
            {loading ? (
              <p className="p-4 text-center text-xs text-foreground-muted">Chargement...</p>
            ) : items.length === 0 ? (
              <p className="p-4 text-center text-xs text-foreground-muted">Aucune notification.</p>
            ) : (
              items.map((n) => (
                <Link
                  key={n.id}
                  href={n.action_url || "/notifications"}
                  onClick={() => handleItemClick(n)}
                  className={`block px-4 py-3 hover:bg-background-secondary transition-colors ${!n.is_read ? "bg-gold/5" : ""}`}
                >
                  <p className="text-xs font-semibold text-navy flex items-center gap-1.5">
                    {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-gold flex-shrink-0" />}
                    {n.title}
                  </p>
                  <p className="text-[11px] text-foreground-muted line-clamp-2 mt-0.5">{n.message}</p>
                </Link>
              ))
            )}
          </div>

          <Link
            href="/notifications"
            onClick={() => setOpen(false)}
            className="block text-center py-2.5 text-[11px] font-bold text-navy hover:bg-background-secondary transition-colors border-t border-border"
          >
            Voir toutes les notifications
          </Link>
        </div>
      )}
    </div>
  );
}

### 2. Injecter la cloche dans app/(dashboard)/layout.tsx

Ajouter l'import :
import { NotificationBell } from "@/components/ui/notification-bell";

TROUVER :
        <div className="min-h-screen bg-background flex flex-col md:flex-row w-full relative pb-20 md:pb-0">
          <DashboardSidebar />

REMPLACER par :
        <div className="min-h-screen bg-background flex flex-col md:flex-row w-full relative pb-20 md:pb-0">
          <NotificationBell />
          <DashboardSidebar />

### 3. Créer la page partagée app/(dashboard)/notifications/page.tsx

"use client";

import React, { useEffect, useState } from "react";
import { Bell, Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type AppNotification,
} from "@/lib/services/notifications";

export default function NotificationsPage() {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await getNotifications();
      setItems(data);
      setLoading(false);
    }
    load();
  }, []);

  async function handleClick(n: AppNotification) {
    if (!n.is_read) {
      await markNotificationRead(n.id);
      setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, is_read: true } : i)));
    }
  }

  async function handleMarkAll() {
    await markAllNotificationsRead();
    setItems((prev) => prev.map((i) => ({ ...i, is_read: true })));
  }

  const unreadCount = items.filter((i) => !i.is_read).length;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 rounded-xl hover:bg-background-secondary">
            <ArrowLeft className="w-4 h-4 text-navy" />
          </Link>
          <div>
            <h1 className="font-serif text-xl font-bold text-navy flex items-center gap-2">
              <Bell className="w-5 h-5 text-gold" />
              Notifications
            </h1>
            <p className="text-xs text-foreground-muted">
              {unreadCount > 0 ? `${unreadCount} non lue(s)` : "Tout est à jour"}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAll} className="text-xs font-bold text-navy border border-border rounded-xl px-3 py-2 hover:bg-background-secondary flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5" />
            Tout marquer lu
          </button>
        )}
      </div>

      <div className="bg-background border border-border rounded-2xl divide-y divide-border overflow-hidden">
        {loading ? (
          <p className="p-8 text-center text-xs text-foreground-muted">Chargement...</p>
        ) : items.length === 0 ? (
          <p className="p-8 text-center text-xs text-foreground-muted">Aucune notification pour le moment.</p>
        ) : (
          items.map((n) => (
            <Link
              key={n.id}
              href={n.action_url || "#"}
              onClick={() => handleClick(n)}
              className={`block p-4 hover:bg-background-secondary transition-colors ${!n.is_read ? "bg-gold/5" : ""}`}
            >
              <div className="flex items-start gap-2">
                {!n.is_read && <span className="w-2 h-2 rounded-full bg-gold mt-1.5 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy">{n.title}</p>
                  <p className="text-xs text-foreground-muted mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-foreground-muted mt-1">
                    {new Date(n.created_at).toLocaleString("fr-FR")}
                  </p>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

NE PAS MODIFIER DashboardSidebar ni MobileBottomNav dans cette fiche — la cloche est
positionnée en overlay fixe, indépendante de la barre latérale.
```

---

# RÉSUMÉ

| Ordre | Fiche | Contenu |
|---|---|---|
| 1 | G1 | Endpoints compteur non-lues + tout marquer lu |
| 2 | G2 | Tâche Celery périodique — alerte stock bas au Gestionnaire |
| 3 | G3 | Notification Gestionnaire (nouvelle commande) + Chef Maquettiste (nouveau dépôt) |
| 4 | G4 | Service frontend générique notifications.ts |
| 5 | G5 | Cloche universelle (tous rôles, un seul point d'injection) + page /notifications partagée |

**Choix assumé** : le système WholesaleNotification du Grossiste n'est pas touché — il continue de fonctionner indépendamment pour les nouveautés catalogue, pendant que la nouvelle cloche universelle couvre tous les autres cas (paiement, livraison, stock, commandes, dépôts) pour tous les rôles, Grossiste inclus (qui aura donc les deux : sa page dédiée nouveautés + la cloche générale).

**Après application** : chaque rôle voit en temps réel (rafraîchissement toutes les 60s) ses notifications pertinentes — le Gestionnaire est alerté du stock bas et des nouvelles commandes à préparer, le Chef Maquettiste des dépôts à valider, le Client de ses paiements et livraisons, sans qu'aucune page ne soit modifiée individuellement.
