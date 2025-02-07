# Generated by Django 5.0.9 on 2024-12-07 14:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_alter_useraccount_role'),
    ]

    operations = [
        migrations.AlterField(
            model_name='useraccount',
            name='role',
            field=models.CharField(choices=[('FMI', 'Físico Médico Interno'), ('FME', 'Físico Médico Externo'), ('GP', 'Gerente Prophy'), ('GGC', 'Gerente Geral de Cliente'), ('GU', 'Gerente de Unidade'), ('C', 'Comercial')], default='GGC', max_length=30, verbose_name='Perfil'),
        ),
    ]
