# Generated by Django 5.0.9 on 2024-11-26 14:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_useraccount_phone'),
    ]

    operations = [
        migrations.AlterField(
            model_name='useraccount',
            name='role',
            field=models.CharField(choices=[('Físico Médico Interno', 'Físico Médico Interno'), ('Físico Médico Externo', 'Físico Médico Externo'), ('Gerente Prophy', 'Gerente Prophy'), ('Gerente Geral de Cliente', 'Gerente Geral de Cliente'), ('Gerente de Unidade', 'Gerente de Unidade'), ('Comercial', 'Comercial')], default='Gerente Geral de Cliente', max_length=30, verbose_name='Perfil'),
        ),
    ]