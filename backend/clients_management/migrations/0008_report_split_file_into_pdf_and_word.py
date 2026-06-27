from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("clients_management", "0007_add_memorial_cdi_us_rm_report_types"),
    ]

    operations = [
        migrations.RenameField(
            model_name="report",
            old_name="file",
            new_name="pdf_file",
        ),
        migrations.AlterField(
            model_name="report",
            name="pdf_file",
            field=models.FileField(
                upload_to="reports/pdfs/",
                verbose_name="Arquivo PDF",
            ),
        ),
        migrations.AddField(
            model_name="report",
            name="word_file",
            field=models.FileField(
                blank=True,
                upload_to="reports/words/",
                verbose_name="Arquivo Word",
            ),
        ),
    ]
