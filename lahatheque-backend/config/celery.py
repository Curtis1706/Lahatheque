"""Configuration Celery pour les tâches asynchrones et Celery Beat."""
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')

from celery.schedules import crontab

app = Celery('lahatheque')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

app.conf.beat_schedule = {
    'monthly-royalties-calculation': {
        'task': 'apps.reporting.tasks.task_calculate_monthly_royalties',
        'schedule': crontab(day_of_month='1', hour='3', minute='0'),
    },
}

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
