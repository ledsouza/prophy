# Generated by Django 5.0.8 on 2024-10-05 12:04

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gestao_clientes', '0011_alter_unidade_nome'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='unidade',
            name='user',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='users', to=settings.AUTH_USER_MODEL, verbose_name='Responsável'),
        ),
        migrations.AlterField(
            model_name='cliente',
            name='users',
            field=models.ManyToManyField(blank=True, related_name='clientes', to=settings.AUTH_USER_MODEL, verbose_name='Responsáveis'),
        ),
    ]
