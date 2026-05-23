import json
import os
import re
import uuid
from pathlib import Path

from clients_management.models import Modality
from django.conf import settings
from django.contrib.auth.models import Group, Permission
from django.core.files.base import ContentFile
from django.db import connection
from users.models import UserAccount


CPF_ADMIN = "03446254005"
CPF_CLIENT_MANAGER = "82484874073"
CPF_UNIT_MANAGER = "51407390031"
CPF_COMERCIAL = "85866936003"
CPF_EXTERNAL_PHYSICIST = "50283042036"
CPF_INTERNAL_PHYSICIST = "91623042321"
PASSWORD = "passwordtest"

REJECTED_PROPOSAL_CNPJ = "09352176000187"
APPROVED_PROPOSAL_CNPJ = "26661570000116"

REGISTERED_CNPJ = "78187773000116"

PENDING_APPOINTMENT_CNPJ = "43388625948375"
COMPLIANT_APPOINTMENT_CNPJ = "15615131549217"

ELIGIBLE_REGISTRATION_CNPJ = APPROVED_PROPOSAL_CNPJ

NO_PROPOSAL_CNPJ = "21835755000186"

MODALITIES = [
    "Raio X Convencional",
    "Raio X Móvel",
    "Litotripsia",
    "Angiógrafo",
    "Arco C",
    "Telecomandada",
    "Mamografia",
    "Tomografia Computadorizada",
    "PET/CT",
    "SPECT/CT",
    "Raio X Extraoral",
    "Raio X Panorâmico",
    "Tomografia Cone Beam",
    "Raio X Intraoral",
    "Ultrassom",
    "Ressonância Magnética",
    "PET/RM",
    "Densitometria Óssea",
]

BASE_DIR = settings.BASE_DIR
EQUIPMENT_PHOTO_PATH = BASE_DIR / "static" / "mamografia.jpg"
EQUIPMENT_LABEL_PHOTO_PATH = BASE_DIR / "static" / "serial-number.jpg"
PROPOSAL_PDF_PATH = BASE_DIR / "static" / "placeholder.pdf"
PROPOSAL_WORD_PATH = BASE_DIR / "static" / "Placeholder.docx"

_current_dir = os.path.dirname(os.path.abspath(__file__))
_project_root = os.path.abspath(os.path.join(_current_dir, "..", "..", "..", ".."))
_cypress_fixture_path = os.getenv("CYPRESS_FIXTURE_PATH")
FIXTURE_PATH = (
    _cypress_fixture_path
    if _cypress_fixture_path
    else os.path.join(_project_root, "frontend", "cypress", "fixtures")
)

RANDOM_ID_FLOOR = 100_000


def get_accessory_type(modality: str) -> Modality.AccessoryType:
    modality_to_accessory_map = {
        "Raio X Convencional": Modality.AccessoryType.DETECTOR,
        "Raio X Móvel": Modality.AccessoryType.DETECTOR,
        "Mamografia": Modality.AccessoryType.DETECTOR,
        "Raio X Intraoral": Modality.AccessoryType.DETECTOR,
        "Ressonância Magnética": Modality.AccessoryType.COIL,
        "PET/RM": Modality.AccessoryType.COIL,
        "Ultrassom": Modality.AccessoryType.TRANSDUCER,
    }
    return modality_to_accessory_map.get(modality, Modality.AccessoryType.NONE)


def create_fixture_path(output_name: str) -> str:
    return os.path.join(FIXTURE_PATH, output_name)


def write_json_file(data: dict, file_path: str) -> None:
    parent_directory = os.path.dirname(file_path)
    if parent_directory:
        os.makedirs(parent_directory, exist_ok=True)
    with open(file_path, "w", encoding="utf-8") as json_file:
        json.dump(data, json_file, indent=2)


def safe_slug(s: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return slug[:50] or "entidade"


def make_report_file(report_type_code: str, entity_name: str) -> ContentFile:
    uid = uuid.uuid4().hex[:8]
    slug = safe_slug(entity_name)
    use_pdf = hash(entity_name) % 2 == 0
    if use_pdf:
        source_path = Path(settings.BASE_DIR) / "static" / "placeholder.pdf"
        extension = "pdf"
    else:
        source_path = Path(settings.BASE_DIR) / "static" / "Placeholder.docx"
        extension = "docx"
    filename = f"report-{report_type_code}-{slug}-{uid}.{extension}"
    with source_path.open(mode="rb") as f:
        file_content = f.read()
    return ContentFile(file_content, name=filename)


def raise_postgres_id_floor() -> None:
    """
    On Postgres, advance all PK sequences past RANDOM_ID_FLOOR so
    explicit-id seed rows (in the 1000-band) never sort after
    auto-incremented rows. No-op on SQLite.
    """
    if connection.vendor != "postgresql":
        return
    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT c.relname, a.attname
            FROM pg_index i
            JOIN pg_attribute a
                ON a.attrelid = i.indrelid
                AND a.attnum = ANY(i.indkey)
            JOIN pg_class c ON c.oid = i.indrelid
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE i.indisprimary
                AND n.nspname = 'public'
                AND a.attisdropped IS FALSE
                AND a.attnum > 0
            """
        )
        primary_keys = cursor.fetchall()
        for table_name, column_name in primary_keys:
            cursor.execute(
                "SELECT pg_get_serial_sequence(%s, %s)",
                [table_name, column_name],
            )
            sequence_name = cursor.fetchone()[0]
            if sequence_name is None:
                continue
            cursor.execute(
                "SELECT setval(%s, %s, false)",
                [sequence_name, RANDOM_ID_FLOOR],
            )


def create_groups() -> None:
    """Creates user groups and assigns permissions based on roles."""
    base_permissions = (
        Permission.objects.exclude(name__contains="add Cliente")
        .exclude(name__contains="add Unidade")
        .exclude(name__contains="add Equipamento")
    )
    perms_dict = {p.name: p for p in base_permissions}

    role_permissions_map = {
        UserAccount.Role.PROPHY_MANAGER: list(base_permissions),
        UserAccount.Role.CLIENT_GENERAL_MANAGER: [
            "view Cliente",
            "view Unidade",
            "change Operação de Unidade",
            "view Equipamento",
        ],
        UserAccount.Role.UNIT_MANAGER: ["view Unidade", "view Equipamento"],
        UserAccount.Role.COMMERCIAL: [
            "view Cliente",
            "view Proposta",
            "change Proposta",
            "add Proposta",
        ],
        UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST: [
            "view Cliente",
            "view Unidade",
            "view Equipamento",
        ],
        UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST: [
            "view Cliente",
            "view Unidade",
            "view Equipamento",
        ],
    }

    for role_value in UserAccount.Role.values:
        group, _ = Group.objects.get_or_create(name=role_value)

        if role_value == UserAccount.Role.PROPHY_MANAGER:
            group.permissions.set(list(base_permissions))
            continue

        permission_names = role_permissions_map.get(role_value, [])
        permissions_to_assign = []
        if permission_names:
            for name_substring in permission_names:
                matched_perm = next(
                    (p for name, p in perms_dict.items() if name_substring in name),
                    None,
                )
                if matched_perm:
                    permissions_to_assign.append(matched_perm)

        group.permissions.set(permissions_to_assign)


def populate_modalities() -> None:
    for modality in MODALITIES:
        accessory_type = get_accessory_type(modality)
        Modality.objects.create(name=modality, accessory_type=accessory_type)
