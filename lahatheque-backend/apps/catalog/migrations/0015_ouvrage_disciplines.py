# Generated manually for LAHAThèque - Multi-disciplines support on Ouvrage

from django.db import migrations, models


def sync_existing_disciplines(apps, schema_editor):
    Ouvrage = apps.get_model('catalog', 'Ouvrage')
    for ouvrage in Ouvrage.objects.filter(discipline__isnull=False):
        ouvrage.disciplines.add(ouvrage.discipline)


def reverse_sync(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0014_country'),
    ]

    operations = [
        migrations.AddField(
            model_name='ouvrage',
            name='disciplines',
            field=models.ManyToManyField(blank=True, related_name='ouvrages_multi', to='catalog.discipline'),
        ),
        migrations.RunPython(sync_existing_disciplines, reverse_sync),
    ]
