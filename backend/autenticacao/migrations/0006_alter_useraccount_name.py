# Generated by Django 5.0.8 on 2024-10-03 12:44

import core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('autenticacao', '0005_alter_useraccount_cpf'),
    ]

    operations = [
        migrations.AlterField(
            model_name='useraccount',
            name='name',
            field=models.CharField(max_length=255, validators=[core.validators.AlphaOnly()], verbose_name='Nome'),
        ),
    ]
