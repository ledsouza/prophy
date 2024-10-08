# Generated by Django 5.0.8 on 2024-10-03 12:05

import core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('autenticacao', '0004_remove_useraccount_username_useraccount_cpf_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='useraccount',
            name='cpf',
            field=models.CharField(max_length=11, unique=True, validators=[
                                   core.validators.FixedLength(11)], verbose_name='CPF'),
        ),
    ]
