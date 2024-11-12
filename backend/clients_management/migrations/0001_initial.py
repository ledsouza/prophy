# Generated by Django 5.0.9 on 2024-11-12 14:39

import clients_management.validators
import core.validators
import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Client',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cnpj', models.CharField(max_length=14, unique=True, validators=[clients_management.validators.CNPJValidator()], verbose_name='CNPJ')),
                ('name', models.CharField(max_length=50, verbose_name='Nome da instituição')),
                ('email', models.EmailField(max_length=254, verbose_name='E-mail da instituição')),
                ('phone', models.CharField(max_length=13, verbose_name='Telefone da instituição')),
                ('address', models.CharField(max_length=100, verbose_name='Endereço da instituição')),
                ('state', models.CharField(choices=[('AC', 'Acre'), ('AL', 'Alagoas'), ('AP', 'Amapá'), ('AM', 'Amazonas'), ('BA', 'Bahia'), ('CE', 'Ceará'), ('DF', 'Distrito Federal'), ('ES', 'Espírito Santo'), ('GO', 'Goiás'), ('MA', 'Maranhão'), ('MT', 'Mato Grosso'), ('MS', 'Mato Grosso do Sul'), ('MG', 'Minas Gerais'), ('PA', 'Pará'), ('PB', 'Paraíba'), ('PR', 'Paraná'), ('PE', 'Pernambuco'), ('PI', 'Piauí'), ('RJ', 'Rio de Janeiro'), ('RN', 'Rio Grande do Norte'), ('RS', 'Rio Grande do Sul'), ('RO', 'Rondônia'), ('RR', 'Roraima'), ('SC', 'Santa Catarina'), ('SP', 'São Paulo'), ('SE', 'Sergipe'), ('TO', 'Tocantins')], max_length=2, verbose_name='Estado da instituição')),
                ('city', models.CharField(max_length=50, verbose_name='Cidade da instituição')),
                ('status', models.CharField(choices=[('A', 'Ativo'), ('I', 'Inativo')], default='A', max_length=1, verbose_name='Status')),
            ],
            options={
                'verbose_name': 'Cliente',
                'verbose_name_plural': 'Clientes',
            },
        ),
        migrations.CreateModel(
            name='Equipment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('modality', models.CharField(max_length=50, verbose_name='Modalidade')),
                ('manufacturer', models.CharField(max_length=30, verbose_name='Fabricante')),
                ('model', models.CharField(max_length=30, verbose_name='Modelo')),
                ('series_number', models.CharField(blank=True, max_length=30, null=True, verbose_name='Número de Série')),
                ('anvisa_registry', models.CharField(blank=True, max_length=15, null=True, verbose_name='Registro na ANVISA')),
                ('equipment_photo', models.ImageField(upload_to='equipamentos/fotos', verbose_name='Foto do equipamento')),
                ('label_photo', models.ImageField(blank=True, null=True, upload_to='equipamentos/etiquetas', verbose_name='Foto da etiqueta')),
                ('maintenance_responsable', models.CharField(blank=True, max_length=50, null=True, validators=[core.validators.AlphaOnly()], verbose_name='Responsável pela manutenção')),
                ('email_maintenance_responsable', models.EmailField(blank=True, max_length=254, null=True, verbose_name='E-mail do responsável pela manutenção')),
                ('phone_maintenance_responsable', models.CharField(blank=True, max_length=13, null=True, verbose_name='Telefone do responsável pela manutenção')),
            ],
            options={
                'verbose_name': 'Equipamento',
                'verbose_name_plural': 'Equipamentos',
            },
        ),
        migrations.CreateModel(
            name='Proposal',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('cnpj', models.CharField(max_length=14, validators=[clients_management.validators.CNPJValidator()], verbose_name='CNPJ')),
                ('state', models.CharField(choices=[('AC', 'Acre'), ('AL', 'Alagoas'), ('AP', 'Amapá'), ('AM', 'Amazonas'), ('BA', 'Bahia'), ('CE', 'Ceará'), ('DF', 'Distrito Federal'), ('ES', 'Espírito Santo'), ('GO', 'Goiás'), ('MA', 'Maranhão'), ('MT', 'Mato Grosso'), ('MS', 'Mato Grosso do Sul'), ('MG', 'Minas Gerais'), ('PA', 'Pará'), ('PB', 'Paraíba'), ('PR', 'Paraná'), ('PE', 'Pernambuco'), ('PI', 'Piauí'), ('RJ', 'Rio de Janeiro'), ('RN', 'Rio Grande do Norte'), ('RS', 'Rio Grande do Sul'), ('RO', 'Rondônia'), ('RR', 'Roraima'), ('SC', 'Santa Catarina'), ('SP', 'São Paulo'), ('SE', 'Sergipe'), ('TO', 'Tocantins')], max_length=2, verbose_name='Estado da instituição')),
                ('city', models.CharField(max_length=50, validators=[core.validators.AlphaOnly()], verbose_name='Cidade da instituição')),
                ('contact_name', models.CharField(max_length=50, validators=[core.validators.AlphaOnly()], verbose_name='Nome do contato')),
                ('contact_phone', models.CharField(max_length=13, verbose_name='Telefone do contato')),
                ('email', models.EmailField(max_length=254, verbose_name='E-mail do contato')),
                ('date', models.DateField(default=datetime.date.today, verbose_name='Data da proposta')),
                ('value', models.DecimalField(decimal_places=2, max_digits=10, verbose_name='Valor proposto')),
                ('contract_type', models.CharField(choices=[('A', 'Anual'), ('M', 'Mensal')], max_length=1, verbose_name='Tipo de contrato')),
                ('status', models.CharField(choices=[('A', 'Aceito'), ('R', 'Rejeitado'), ('P', 'Pendente')], default='P', max_length=1)),
            ],
            options={
                'verbose_name': 'Proposta',
                'verbose_name_plural': 'Propostas',
                'ordering': ['-date'],
            },
        ),
        migrations.CreateModel(
            name='Unit',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=50, verbose_name='Nome')),
                ('cnpj', models.CharField(max_length=14, validators=[clients_management.validators.CNPJValidator()], verbose_name='CNPJ')),
                ('email', models.EmailField(max_length=254, verbose_name='E-mail')),
                ('phone', models.CharField(max_length=13, verbose_name='Telefone')),
                ('address', models.CharField(max_length=100, verbose_name='Endereço')),
                ('state', models.CharField(blank=True, choices=[('AC', 'Acre'), ('AL', 'Alagoas'), ('AP', 'Amapá'), ('AM', 'Amazonas'), ('BA', 'Bahia'), ('CE', 'Ceará'), ('DF', 'Distrito Federal'), ('ES', 'Espírito Santo'), ('GO', 'Goiás'), ('MA', 'Maranhão'), ('MT', 'Mato Grosso'), ('MS', 'Mato Grosso do Sul'), ('MG', 'Minas Gerais'), ('PA', 'Pará'), ('PB', 'Paraíba'), ('PR', 'Paraná'), ('PE', 'Pernambuco'), ('PI', 'Piauí'), ('RJ', 'Rio de Janeiro'), ('RN', 'Rio Grande do Norte'), ('RS', 'Rio Grande do Sul'), ('RO', 'Rondônia'), ('RR', 'Roraima'), ('SC', 'Santa Catarina'), ('SP', 'São Paulo'), ('SE', 'Sergipe'), ('TO', 'Tocantins')], max_length=2, verbose_name='Estado')),
                ('city', models.CharField(blank=True, max_length=50, validators=[core.validators.AlphaOnly()], verbose_name='Cidade')),
            ],
            options={
                'verbose_name': 'Unidade',
                'verbose_name_plural': 'Unidades',
            },
        ),
    ]
