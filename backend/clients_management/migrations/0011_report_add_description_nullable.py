from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("clients_management", "0010_alter_accessory_equipment_photo_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="report",
            name="description",
            field=models.TextField(
                blank=True,
                null=True,
                verbose_name="Descrição",
            ),
        ),
    ]
