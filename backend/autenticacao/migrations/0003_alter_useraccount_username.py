# Generated by Django 5.0.7 on 2024-09-23 22:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('autenticacao', '0002_alter_useraccount_options_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='useraccount',
            name='username',
            field=models.CharField(max_length=255, unique=True, verbose_name='Nome de Usuário'),
        ),
    ]
