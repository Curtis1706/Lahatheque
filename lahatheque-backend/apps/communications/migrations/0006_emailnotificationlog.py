# Generated manually for EmailNotificationLog
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('communications', '0005_guidecategory_guidearticle_delete_guideitem'),
    ]

    operations = [
        migrations.CreateModel(
            name='EmailNotificationLog',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('recipient_email', models.EmailField(db_index=True, max_length=254, verbose_name='Adresse email destinataire')),
                ('recipient_name', models.CharField(blank=True, default='', max_length=255, verbose_name='Nom du destinataire')),
                ('email_type', models.CharField(db_index=True, max_length=64, verbose_name='Type de notification / Template')),
                ('subject', models.CharField(max_length=255, verbose_name="Objet de l'email")),
                ('provider_used', models.CharField(choices=[('resend', 'Resend API REST'), ('smtp', 'SMTP Professionnel')], default='resend', max_length=16, verbose_name='Fournisseur employé')),
                ('provider_message_id', models.CharField(blank=True, default='', max_length=128, verbose_name='Identifiant message fournisseur')),
                ('status', models.CharField(choices=[('pending', 'En cours'), ('sent', 'Envoyé avec succès'), ('delivered', 'Délivré'), ('failed', "Échec d'envoi")], db_index=True, default='pending', max_length=20, verbose_name="Statut d'envoi")),
                ('has_attachment', models.BooleanField(default=False, verbose_name='Contient une ou plusieurs pièces jointes')),
                ('attachment_names', models.JSONField(blank=True, default=list, verbose_name='Liste des noms de pièces jointes (ex: factures PDF)')),
                ('error_message', models.TextField(blank=True, default='', verbose_name="Détail de l'erreur en cas d'échec")),
                ('retry_count', models.PositiveIntegerField(default=0, verbose_name="Nombre de tentatives d'envoi")),
                ('created_at', models.DateTimeField(auto_now_add=True, db_index=True, verbose_name='Date de création de la demande')),
                ('sent_at', models.DateTimeField(blank=True, null=True, verbose_name="Date effective d'envoi")),
            ],
            options={
                'verbose_name': 'Journal Email Notification',
                'verbose_name_plural': 'Journaux Emails & Notifications',
                'db_table': 'communications_email_notification_log',
                'ordering': ['-created_at'],
            },
        ),
    ]
