# Generated by Django 5.0.9 on 2024-11-23 17:05

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('clients_management', '0004_remove_client_status_client_active_alter_client_cnpj'),
    ]

    operations = [
        migrations.AlterField(
            model_name='client',
            name='address',
            field=models.CharField(max_length=150, verbose_name='Endereço da instituição'),
        ),
        migrations.AlterField(
            model_name='unit',
            name='address',
            field=models.CharField(max_length=150, verbose_name='Endereço'),
        ),
    ]
