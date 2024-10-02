# Generated by Django 5.0.8 on 2024-10-02 17:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gestao_clientes', '0005_alter_cliente_telefone_instituicao_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='unidade',
            name='cidade',
            field=models.CharField(blank=True, max_length=50, verbose_name='Cidade'),
        ),
        migrations.AlterField(
            model_name='unidade',
            name='cnpj',
            field=models.CharField(max_length=14, verbose_name='CNPJ'),
        ),
        migrations.AlterField(
            model_name='unidade',
            name='email',
            field=models.EmailField(max_length=254, verbose_name='E-mail'),
        ),
        migrations.AlterField(
            model_name='unidade',
            name='endereco',
            field=models.CharField(max_length=100, verbose_name='Endereço'),
        ),
        migrations.AlterField(
            model_name='unidade',
            name='estado',
            field=models.CharField(blank=True, choices=[('AC', 'Acre'), ('AL', 'Alagoas'), ('AP', 'Amapá'), ('AM', 'Amazonas'), ('BA', 'Bahia'), ('CE', 'Ceará'), ('DF', 'Distrito Federal'), ('ES', 'Espírito Santo'), ('GO', 'Goiás'), ('MA', 'Maranhão'), ('MT', 'Mato Grosso'), ('MS', 'Mato Grosso do Sul'), ('MG', 'Minas Gerais'), ('PA', 'Pará'), ('PB', 'Paraíba'), ('PR', 'Paraná'), ('PE', 'Pernambuco'), ('PI', 'Piauí'), ('RJ', 'Rio de Janeiro'), ('RN', 'Rio Grande do Norte'), ('RS', 'Rio Grande do Sul'), ('RO', 'Rondônia'), ('RR', 'Roraima'), ('SC', 'Santa Catarina'), ('SP', 'São Paulo'), ('SE', 'Sergipe'), ('TO', 'Tocantins')], max_length=2, verbose_name='Estado'),
        ),
        migrations.AlterField(
            model_name='unidade',
            name='nome',
            field=models.CharField(max_length=50, verbose_name='Nome'),
        ),
        migrations.AlterField(
            model_name='unidade',
            name='telefone',
            field=models.CharField(max_length=13, verbose_name='Telefone'),
        ),
    ]
