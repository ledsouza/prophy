# Generated by Django 5.0.8 on 2024-10-02 17:55

import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gestao_clientes', '0006_alter_unidade_cidade_alter_unidade_cnpj_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='cliente',
            name='cnpj',
            field=models.CharField(max_length=14, unique=True, validators=[django.core.validators.MinLengthValidator(14)], verbose_name='CNPJ'),
        ),
        migrations.AlterField(
            model_name='proposta',
            name='cnpj',
            field=models.CharField(max_length=14, validators=[django.core.validators.MinLengthValidator(14)], verbose_name='CNPJ'),
        ),
        migrations.AlterField(
            model_name='unidade',
            name='cnpj',
            field=models.CharField(max_length=14, validators=[django.core.validators.MinLengthValidator(14)], verbose_name='CNPJ'),
        ),
    ]