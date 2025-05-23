# Generated by Django 5.0.11 on 2025-02-23 17:51

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('clients_management', '0002_initial'),
        ('requisitions', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='clientoperation',
            name='created_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_operations', to=settings.AUTH_USER_MODEL, verbose_name='Criado por'),
        ),
        migrations.AddField(
            model_name='clientoperation',
            name='original_client',
            field=models.ForeignKey(blank=True, help_text='Cliente original associado à operação.', null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='new_operations', to='clients_management.client', verbose_name='Cliente'),
        ),
        migrations.AddField(
            model_name='equipmentoperation',
            name='created_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_operations', to=settings.AUTH_USER_MODEL, verbose_name='Criado por'),
        ),
        migrations.AddField(
            model_name='equipmentoperation',
            name='original_equipment',
            field=models.ForeignKey(blank=True, help_text='Equipamento original associado à operação.', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='new_operations', to='clients_management.equipment', verbose_name='Equipamento'),
        ),
        migrations.AddField(
            model_name='unitoperation',
            name='created_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_operations', to=settings.AUTH_USER_MODEL, verbose_name='Criado por'),
        ),
        migrations.AddField(
            model_name='unitoperation',
            name='original_unit',
            field=models.ForeignKey(blank=True, help_text='Unidade original associada à operação.', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='new_operations', to='clients_management.unit', verbose_name='Unidade'),
        ),
    ]
