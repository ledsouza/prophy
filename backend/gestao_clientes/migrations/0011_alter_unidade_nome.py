# Generated by Django 5.0.8 on 2024-10-03 14:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gestao_clientes', '0010_alter_cliente_cnpj_alter_proposta_cnpj_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='unidade',
            name='nome',
            field=models.CharField(max_length=50, verbose_name='Nome'),
        ),
    ]