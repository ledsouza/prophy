from django.db import migrations

REPORT_TYPE_LABELS = {
    "CQ": "Controle de Qualidade",
    "CQM": "Controle de Qualidade de Monitores",
    "TE": "Teste de EPI",
    "LR": "Levantamento Radiométrico e Fuga de Cabeçote",
    "M": "Memorial",
    "MCDI": "Memorial CDI",
    "MUS": "Memorial US",
    "MRM": "Memorial RM",
    "TR": "Treinamento de Radioproteção",
    "TSR": "Treinamento de Segurança em Ressonância Magnética",
    "AD": "Ato de designação",
    "ID": "Investigação de dose",
    "POP": "POP",
    "O": "Outros",
}


def backfill_description(apps, schema_editor):
    Report = apps.get_model("clients_management", "Report")
    for report in Report.objects.all().iterator():
        report.description = REPORT_TYPE_LABELS.get(
            report.report_type, report.report_type
        )
        report.save(update_fields=["description"])


class Migration(migrations.Migration):

    dependencies = [
        ("clients_management", "0011_report_add_description_nullable"),
    ]

    operations = [
        migrations.RunPython(backfill_description, migrations.RunPython.noop),
    ]
