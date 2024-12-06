# Generated by Django 5.0.9 on 2024-11-26 22:01

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('requisitions', '0005_alter_clientoperation_client_ptr_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='clientoperation',
            name='operation_type',
            field=models.CharField(choices=[('A', 'Adicionar'), ('E', 'Editar'), ('D', 'Deletar'), ('C', '-')], max_length=1, verbose_name='Tipo de Operação'),
        ),
        migrations.AlterField(
            model_name='equipmentoperation',
            name='operation_type',
            field=models.CharField(choices=[('A', 'Adicionar'), ('E', 'Editar'), ('D', 'Deletar'), ('C', '-')], max_length=1, verbose_name='Tipo de Operação'),
        ),
        migrations.AlterField(
            model_name='unitoperation',
            name='operation_type',
            field=models.CharField(choices=[('A', 'Adicionar'), ('E', 'Editar'), ('D', 'Deletar'), ('C', '-')], max_length=1, verbose_name='Tipo de Operação'),
        ),
    ]