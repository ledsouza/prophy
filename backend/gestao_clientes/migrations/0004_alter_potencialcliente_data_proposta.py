# Generated by Django 5.0.7 on 2024-08-23 19:32

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gestao_clientes', '0003_potencialcliente'),
    ]

    operations = [
        migrations.AlterField(
            model_name='potencialcliente',
            name='data_proposta',
            field=models.DateField(blank=True, verbose_name='Data da proposta'),
        ),
    ]
