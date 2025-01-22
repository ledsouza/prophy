# Generated by Django 5.0.11 on 2025-01-22 14:29

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('clients_management', '0008_alter_equipment_equipment_photo'),
    ]

    operations = [
        migrations.AlterField(
            model_name='equipment',
            name='maintenance_responsable',
            field=models.CharField(blank=True, max_length=50, null=True, verbose_name='Responsável pela manutenção'),
        ),
        migrations.AlterField(
            model_name='proposal',
            name='city',
            field=models.CharField(max_length=50, verbose_name='Cidade da instituição'),
        ),
        migrations.AlterField(
            model_name='proposal',
            name='contact_name',
            field=models.CharField(max_length=50, verbose_name='Nome do contato'),
        ),
    ]
