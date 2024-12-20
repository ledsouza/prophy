# Generated by Django 5.0.9 on 2024-11-12 14:39

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('clients_management', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='client',
            name='users',
            field=models.ManyToManyField(blank=True, related_name='clients', to=settings.AUTH_USER_MODEL, verbose_name='Responsáveis'),
        ),
        migrations.AddField(
            model_name='unit',
            name='client',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='units', to='clients_management.client', verbose_name='Cliente'),
        ),
        migrations.AddField(
            model_name='unit',
            name='user',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='users', to=settings.AUTH_USER_MODEL, verbose_name='Responsável'),
        ),
        migrations.AddField(
            model_name='equipment',
            name='unit',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='equipments', to='clients_management.unit'),
        ),
    ]
