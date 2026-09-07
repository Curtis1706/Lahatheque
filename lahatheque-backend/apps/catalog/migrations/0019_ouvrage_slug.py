from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('catalog', '0018_ouvrage_audio_status_ouvrage_price_audio_eur'),
    ]

    operations = [
        migrations.AddField(
            model_name='ouvrage',
            name='slug',
            field=models.SlugField(blank=True, default='', max_length=280, db_index=True),
        ),
    ]
