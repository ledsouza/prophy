# Generated by Django 5.0.9 on 2024-12-11 13:00

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('clients_management', '0005_alter_client_address_alter_unit_address'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='ClientOperation',
            fields=[
                ('operation_type', models.CharField(choices=[('A', 'Adicionar'), ('E', 'Editar'), ('D', 'Deletar'), ('C', '-')], max_length=1, verbose_name='Tipo de Operação')),
                ('operation_status', models.CharField(choices=[('REV', 'Em Análise'), ('A', 'Aceito'), ('R', 'Rejeitado')], default='REV', max_length=3, verbose_name='Status da Operação')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('comments', models.TextField(blank=True, help_text='Feedback do Gerente Prophy e Físico Médico Interno.', null=True, verbose_name='Comentários')),
                ('client_ptr', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, related_name='operation', serialize=False, to='clients_management.client')),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_operations', to=settings.AUTH_USER_MODEL, verbose_name='Criado por')),
                ('original_client', models.ForeignKey(blank=True, help_text='Cliente original associado à operação.', null=True, on_delete=django.db.models.deletion.DO_NOTHING, related_name='new_operations', to='clients_management.client', verbose_name='Cliente')),
            ],
            options={
                'verbose_name': 'Operação de Cliente',
                'verbose_name_plural': 'Operações de Clientes',
            },
            bases=('clients_management.client', models.Model),
        ),
        migrations.CreateModel(
            name='EquipmentOperation',
            fields=[
                ('operation_type', models.CharField(choices=[('A', 'Adicionar'), ('E', 'Editar'), ('D', 'Deletar'), ('C', '-')], max_length=1, verbose_name='Tipo de Operação')),
                ('operation_status', models.CharField(choices=[('REV', 'Em Análise'), ('A', 'Aceito'), ('R', 'Rejeitado')], default='REV', max_length=3, verbose_name='Status da Operação')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('comments', models.TextField(blank=True, help_text='Feedback do Gerente Prophy e Físico Médico Interno.', null=True, verbose_name='Comentários')),
                ('equipment_ptr', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, related_name='operation', serialize=False, to='clients_management.equipment')),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_operations', to=settings.AUTH_USER_MODEL, verbose_name='Criado por')),
                ('original_equipment', models.ForeignKey(blank=True, help_text='Equipamento original associado à operação.', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='new_operations', to='clients_management.equipment', verbose_name='Equipamento')),
            ],
            options={
                'verbose_name': 'Operação de Equipamento',
                'verbose_name_plural': 'Operações de Equipamentos',
            },
            bases=('clients_management.equipment', models.Model),
        ),
        migrations.CreateModel(
            name='UnitOperation',
            fields=[
                ('operation_type', models.CharField(choices=[('A', 'Adicionar'), ('E', 'Editar'), ('D', 'Deletar'), ('C', '-')], max_length=1, verbose_name='Tipo de Operação')),
                ('operation_status', models.CharField(choices=[('REV', 'Em Análise'), ('A', 'Aceito'), ('R', 'Rejeitado')], default='REV', max_length=3, verbose_name='Status da Operação')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('comments', models.TextField(blank=True, help_text='Feedback do Gerente Prophy e Físico Médico Interno.', null=True, verbose_name='Comentários')),
                ('unit_ptr', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, parent_link=True, primary_key=True, related_name='operation', serialize=False, to='clients_management.unit')),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='%(class)s_operations', to=settings.AUTH_USER_MODEL, verbose_name='Criado por')),
                ('original_unit', models.ForeignKey(blank=True, help_text='Unidade original associada à operação.', null=True, on_delete=django.db.models.deletion.CASCADE, related_name='new_operations', to='clients_management.unit', verbose_name='Unidade')),
            ],
            options={
                'verbose_name': 'Operação de Unidade',
                'verbose_name_plural': 'Operações de Unidades',
            },
            bases=('clients_management.unit', models.Model),
        ),
    ]
