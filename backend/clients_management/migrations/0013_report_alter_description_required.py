from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("clients_management", "0012_report_backfill_description"),
    ]

    operations = [
        migrations.AlterField(
            model_name="report",
            name="description",
            field=models.TextField(verbose_name="Descrição"),
        ),
    ]
