# Generated by Django 5.0.7 on 2024-08-23 19:30

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gestao_clientes', '0002_rename_client_unidade_cliente'),
    ]

    operations = [
        migrations.CreateModel(
            name='PotencialCliente',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cnpj', models.CharField(max_length=14, unique=True, verbose_name='CNPJ')),
                ('nome', models.CharField(max_length=50, verbose_name='Nome do contato')),
                ('telefone', models.CharField(max_length=11, verbose_name='Telefone do contato')),
                ('email', models.EmailField(max_length=254, verbose_name='E-mail')),
                ('data_proposta', models.DateField(default=datetime.date.today, verbose_name='Data da proposta')),
                ('valor', models.DecimalField(decimal_places=2, max_digits=10, verbose_name='Valor proposto')),
                ('status', models.CharField(choices=[('A', 'Aceito'), ('R', 'Rejeitado'), ('P', 'Pendente')], default='P', max_length=1)),
            ],
        ),
    ]
