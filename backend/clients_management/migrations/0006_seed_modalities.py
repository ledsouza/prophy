from django.db import migrations

MODALITIES = [
    ("Raio X Convencional", "D"),
    ("Raio X Móvel", "D"),
    ("Litotripsia", "N"),
    ("Angiógrafo", "N"),
    ("Arco C", "N"),
    ("Telecomandada", "N"),
    ("Mamografia", "D"),
    ("Tomografia Computadorizada", "N"),
    ("PET/CT", "N"),
    ("SPECT/CT", "N"),
    ("Raio X Extraoral", "N"),
    ("Raio X Panorâmico", "N"),
    ("Tomografia Cone Beam", "N"),
    ("Raio X Intraoral", "D"),
    ("Ultrassom", "T"),
    ("Ressonância Magnética", "C"),
    ("PET/RM", "C"),
    ("Densitometria Óssea", "N"),
]


def seed_modalities(apps, schema_editor):
    Modality = apps.get_model("clients_management", "Modality")
    for name, accessory_type in MODALITIES:
        Modality.objects.get_or_create(
            name=name,
            defaults={"accessory_type": accessory_type},
        )


def unseed_modalities(apps, schema_editor):
    Modality = apps.get_model("clients_management", "Modality")
    names = [name for name, _ in MODALITIES]
    Modality.objects.filter(name__in=names).delete()


class Migration(migrations.Migration):
    dependencies = [
        (
            "clients_management",
            "0005_add_responsible_prophy_to_service_order",
        ),
    ]

    operations = [
        migrations.RunPython(seed_modalities, unseed_modalities),
    ]
