# Generated by Django 5.0.10 on 2025-01-11 11:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('clients_management', '0006_alter_client_city_alter_unit_city'),
    ]

    operations = [
        migrations.AlterField(
            model_name='equipment',
            name='equipment_photo',
            field=models.ImageField(upload_to='equipments/photos', verbose_name='Foto do equipamento'),
        ),
        migrations.AlterField(
            model_name='equipment',
            name='label_photo',
            field=models.ImageField(blank=True, null=True, upload_to='equipments/labels', verbose_name='Foto da etiqueta'),
        ),
    ]
