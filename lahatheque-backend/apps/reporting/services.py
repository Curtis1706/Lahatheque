"""
notifications/services.py — Logique de notification asynchrone / synchronisée.
"""
from django.db import transaction
from .models import Notification, NotificationPreference


def notify_user(
    user, 
    notification_type: str, 
    title: str, 
    message: str, 
    action_url: str = "",
    resource_id: str = ""
):
    """
    Envoie une notification selon les préférences de l'utilisateur.
    """
    # 1. Récupérer ou initialiser les préférences
    prefs, _ = NotificationPreference.objects.get_or_create(user=user)
    
    # 2. Vérifier si on doit notifier pour cette catégorie
    should_notify = False
    
    if notification_type == Notification.NotificationType.MESSAGE and prefs.notify_on_messages:
        should_notify = True
    elif notification_type in [Notification.NotificationType.BOOKING_CONFIRMED, Notification.NotificationType.BOOKING_REMINDER] and prefs.notify_on_bookings:
        should_notify = True
    elif notification_type in [Notification.NotificationType.COMMUNITY_REPLY, Notification.NotificationType.EXPERT_QUESTION, Notification.NotificationType.EXPERT_REPLY] and prefs.notify_on_community:
        should_notify = True
    elif notification_type in [
        Notification.NotificationType.SYSTEM,
        Notification.NotificationType.ASSIGNMENT_CREATED,
        Notification.NotificationType.ASSIGNMENT_GRADED,
        Notification.NotificationType.ASSIGNMENT_SUBMITTED,
        Notification.NotificationType.ASSIGNMENT_OVERDUE,
        Notification.NotificationType.PAYMENT_SUCCESS,
        Notification.NotificationType.PAYMENT_FAILED,
        Notification.NotificationType.ORDER_SHIPPED,
        Notification.NotificationType.ORDER_DELIVERED,
    ]:
        should_notify = True  # Alertes systèmes, commerciales et académiques toujours activées
    else:
        should_notify = True  # Par défaut, toute notification métier transmise est enregistrée

    if not should_notify:
        return None

    # 3. Canaux de distribution
    # A. In-App : On crée une instance en DB
    notif = None
    if prefs.in_app_enabled:
        notif = Notification.objects.create(
            user=user,
            title=title,
            message=message,
            notification_type=notification_type,
            action_url=action_url,
            resource_id=resource_id
        )

    # B. Email (Purement asynchrone non-bloquant via thread d'arrière-plan)
    if prefs.email_enabled and getattr(user, "email", None):
        import threading
        def _async_email_dispatch(recipient_email, notif_title, notif_msg):
            try:
                from .tasks import send_email_task
                send_email_task.apply_async(
                    kwargs={
                        'recipient_list': [recipient_email], 
                        'subject': notif_title, 
                        'html_content': f"<h3>{notif_title}</h3><p>{notif_msg}</p>"
                    },
                    retry=False,
                    expires=30,
                )
            except Exception as celery_err:
                import logging
                logging.getLogger(__name__).warning(f"[NOTIFY] Celery non disponible pour email direct: {celery_err}")

        # Lancement en thread daemon détaché pour un retour HTTP instantané (0ms)
        threading.Thread(
            target=_async_email_dispatch,
            args=(user.email, title, message),
            daemon=True
        ).start()

    # C. WhatsApp 
    if prefs.whatsapp_enabled and user.phone:
        # TODO Phase 15.5: Envoi WhatsApp via API Twilio/Infobip
        pass
        
    return notif


def mark_as_read(notification_id: str, user) -> bool:
    """Marque une alerte In-App comme lue."""
    notif = Notification.objects.filter(id=notification_id, user=user).first()
    if notif:
        notif.is_read = True
        notif.save(update_fields=['is_read', 'updated_at'])
        return True
    return False


def mark_all_as_read(user) -> int:
    """Marque tout comme lu pour l'utilisateur."""
    return Notification.objects.filter(user=user, is_read=False).update(is_read=True)


def update_preferences(user, data: dict) -> NotificationPreference:
    """Met à jour les réglages de notification."""
    prefs, _ = NotificationPreference.objects.get_or_create(user=user)
    
    for key, value in data.items():
        if key in (
            'email_enabled', 'whatsapp_enabled', 'in_app_enabled',
            'notify_on_messages', 'notify_on_bookings', 'notify_on_community', 'notify_on_marketing'
        ):
            setattr(prefs, key, value)
            
    prefs.save()
    return prefs
