import json
import os
from random import choice, randint
import uuid
import re
from datetime import date, timedelta

from dateutil.relativedelta import relativedelta

from clients_management.models import (
    Accessory,
    Appointment,
    Client,
    Modality,
    Proposal,
    Unit,
    Equipment,
    Report,
    ServiceOrder,
)
from django.conf import settings
from django.contrib.auth.models import Group, Permission
from django.core.files import File
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction, IntegrityError
from django.utils import timezone
from faker import Faker
from localflavor.br.br_states import STATE_CHOICES
from requisitions.models import ClientOperation, EquipmentOperation, UnitOperation
from users.models import UserAccount
from materials.models import InstitutionalMaterial

fake = Faker("pt_BR")

BASE_DIR = settings.BASE_DIR
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "..", "..", "..", ".."))


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

# Deterministic CNPJs used by Cypress E2E tests for the
# "Pending Appointment" feature.
PENDING_APPOINTMENT_CNPJ = "43388625948375"
COMPLIANT_APPOINTMENT_CNPJ = "15615131549217"


# E2E registration requires a CNPJ whose latest proposal is ACCEPTED
# but it is not yet registered as a Client.
ELIGIBLE_REGISTRATION_CNPJ = APPROVED_PROPOSAL_CNPJ

# Deterministic CNPJ that will never have proposals created by this seed.
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

EQUIPMENT_PHOTO_PATH = BASE_DIR / "static" / "mamografia.jpg"
EQUIPMENT_LABEL_PHOTO_PATH = BASE_DIR / "static" / "serial-number.jpg"
PROPOSAL_PDF_PATH = BASE_DIR / "static" / "placeholder.pdf"
PROPOSAL_WORD_PATH = BASE_DIR / "static" / "Placeholder.docx"

FIXTURE_PATH = os.path.join(project_root, "frontend", "cypress", "fixtures")


def fake_phone_number():
    return fake.msisdn()[2:]


def fake_cnpj():
    return fake.cnpj().replace(".", "").replace("/", "").replace("-", "")


def fake_cpf():
    return fake.cpf().replace(".", "").replace("-", "")


def get_accessory_type(modality: str) -> Modality.AccessoryType:
    """Returns the accessory type for a given modality."""
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
    """
    Writes data to a JSON file with indentation.

    Args:
        data: A dictionary to be converted to JSON.
        file_path (str): The path to the file where the JSON data will be saved.
    """
    # Ensure the parent directory exists before trying to open the file.
    parent_directory = os.path.dirname(file_path)
    if (
        parent_directory
        # Check if parent_directory is not an empty string (e.g., for files in cwd)
    ):
        os.makedirs(parent_directory, exist_ok=True)

    with open(file_path, "w", encoding="utf-8") as json_file:
        json.dump(data, json_file, indent=2)


# Helper functions for Report generation
def safe_slug(s: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    return slug[:50] or "entidade"


def random_completion_date(report_type_code: str) -> date:
    today = date.today()
    if report_type_code == Report.ReportType.RADIOMETRIC_SURVEY:
        validity_days = 4 * 365
    else:
        validity_days = 365

    roll = randint(1, 100)
    if roll <= 20:
        # Overdue: due_date in the past
        delta = validity_days + randint(1, 60)
        return today - timedelta(days=delta)
    elif roll <= 50:
        # Near due: due within ~30 days
        offset = max(0, validity_days - randint(0, 30))
        return today - timedelta(days=offset)
    else:
        # General case within validity window but not too close to edges
        low = 30
        high = max(low + 1, validity_days - 60)
        delta = randint(low, high)
        return today - timedelta(days=delta)


def make_report_file(report_type_code: str, entity_name: str) -> ContentFile:
    """
    Creates a report file by copying a placeholder PDF or DOCX file.
    Alternates between PDF and DOCX formats for variety in testing.
    """
    uid = uuid.uuid4().hex[:8]
    slug = safe_slug(entity_name)

    # Alternate between PDF and DOCX based on hash of entity_name
    use_pdf = hash(entity_name) % 2 == 0

    if use_pdf:
        source_path = BASE_DIR / "static" / "placeholder.pdf"
        extension = "pdf"
    else:
        source_path = BASE_DIR / "static" / "Placeholder.docx"
        extension = "docx"

    filename = f"report-{report_type_code}-{slug}-{uid}.{extension}"

    # Read the placeholder file and create a ContentFile with it
    with source_path.open(mode="rb") as f:
        file_content = f.read()

    return ContentFile(file_content, name=filename)


class Command(BaseCommand):
    help = "Populate the database with fake data."

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write(
            self.style.WARNING("Populating database... This may take a moment.")
        )
        self.create_groups()
        users = self.populate_users()
        default_clients = self.populate_clients()
        default_units = self.populate_units()
        self.populate_modalities()
        default_equipments = self.populate_equipments()
        self.populate_accessories()
        self.populate_service_orders()
        self.populate_reports()
        self.populate_materials()
        approved_cnpjs = self.populate_proposals()

        self.populate_pending_appointment_scenarios()

        self.create_json_fixture(
            approved_cnpjs, users, default_clients, default_units, default_equipments
        )
        self.stdout.write(
            self.style.SUCCESS("Database populated and fixture created successfully!")
        )

    def create_groups(self):
        """Creates user groups and assigns permissions based on roles."""
        base_permissions = (
            Permission.objects.exclude(name__contains="add Cliente")
            .exclude(name__contains="add Unidade")
            .exclude(name__contains="add Equipamento")
        )

        perms_dict = {p.name: p for p in base_permissions}

        # Define permissions for each role
        # Using permission name substrings for clarity and flexibility
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
                    # Find a permission in the dictionary where the key contains the substring
                    matched_perm = next(
                        (p for name, p in perms_dict.items() if name_substring in name),
                        None,
                    )
                    if matched_perm:
                        permissions_to_assign.append(matched_perm)
                    else:
                        self.stdout.write(
                            self.style.WARNING(
                                f"Permission containing '{name_substring}' not found for role '{role_value}'."
                            )
                        )

            group.permissions.set(permissions_to_assign)

    def populate_users(self, num_users=10, num_external_physicists=10):
        """Populates the User model with example data."""

        def _create_user_fixture_data(user_account):
            return {
                "cpf": user_account.cpf,
                "password": PASSWORD,
                "name": user_account.name,
                "email": user_account.email,
                "phone": user_account.phone,
            }

        # Default users for automated testing
        admin_user = UserAccount.objects.create_user(
            cpf=CPF_ADMIN,
            email="alexandre.ferret@email.com",
            phone=fake_phone_number(),
            password=PASSWORD,
            name="Alexandre Ferret",
            role=UserAccount.Role.PROPHY_MANAGER,
            is_staff=True,
            id=1000,
        )

        client_user = UserAccount.objects.create_user(
            cpf=CPF_CLIENT_MANAGER,
            email="leandro.souza.159@gmail.com",
            phone=fake_phone_number(),
            password=PASSWORD,
            name="Leandro Souza",
            role=UserAccount.Role.CLIENT_GENERAL_MANAGER,
            id=1001,
        )

        unit_manager_user = UserAccount.objects.create_user(
            cpf=CPF_UNIT_MANAGER,
            email=fake.email(),
            phone=fake_phone_number(),
            password=PASSWORD,
            name="Fabricio Fernandes",
            role=UserAccount.Role.UNIT_MANAGER,
            id=1002,
        )

        comercial_user = UserAccount.objects.create_user(
            cpf=CPF_COMERCIAL,
            email=fake.email(),
            phone=fake_phone_number(),
            password=PASSWORD,
            name="Brenda Candeia",
            role=UserAccount.Role.COMMERCIAL,
            id=1003,
        )

        external_physicist_user = UserAccount.objects.create_user(
            cpf=CPF_EXTERNAL_PHYSICIST,
            email=fake.email(),
            phone=fake_phone_number(),
            password=PASSWORD,
            name="Gato Comunista",
            role=UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST,
            id=1004,
        )

        internal_physicist_user = UserAccount.objects.create_user(
            cpf=CPF_INTERNAL_PHYSICIST,
            email=fake.email(),
            phone=fake_phone_number(),
            password=PASSWORD,
            name="Paulo Capitalista",
            role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST,
            id=1005,
        )

        # Create additional external medical physicists for testing
        extra_external_count = num_external_physicists
        if extra_external_count and extra_external_count > 0:
            created = 0
            while created < extra_external_count:
                try:
                    UserAccount.objects.create_user(
                        cpf=fake_cpf(),
                        email=fake.email(),
                        phone=fake_phone_number(),
                        password=PASSWORD,
                        name=fake.name(),
                        role=UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST,
                    )
                    created += 1
                except IntegrityError:
                    # Collision on unique fields; retry
                    continue

        users = {
            "admin_user": _create_user_fixture_data(admin_user),
            "client_user": _create_user_fixture_data(client_user),
            "unit_manager_user": _create_user_fixture_data(unit_manager_user),
            "comercial_user": _create_user_fixture_data(comercial_user),
            "external_physicist_user": _create_user_fixture_data(
                external_physicist_user
            ),
            "internal_physicist_user": _create_user_fixture_data(
                internal_physicist_user
            ),
        }

        # Random users for automated testing
        users_to_create = []
        for _ in range(num_users):
            user = UserAccount(
                cpf=fake_cpf(),
                email=fake.email(),
                phone=fake_phone_number(),
                name=fake.name(),
            )
            user.set_password(PASSWORD)
            users_to_create.append(user)
        UserAccount.objects.bulk_create(users_to_create)

        return users

    def populate_clients(self, num_clients=10):
        """Populates the Client model with example data."""
        users = UserAccount.objects.all()

        def _create_client_fixture_data(client_obj):
            """Helper function to create a dictionary for client fixture data."""
            return {
                "cnpj": client_obj.cnpj,
                "name": client_obj.name,
                "email": client_obj.email,
                "phone": client_obj.phone,
                "address": client_obj.address,
                "state": client_obj.state,
                "city": client_obj.city,
                "is_active": client_obj.is_active,
                "id": client_obj.id,
            }

        # Default clients for automated testing
        client1 = ClientOperation.objects.create(
            operation_type=ClientOperation.OperationType.CLOSED,
            operation_status=ClientOperation.OperationStatus.ACCEPTED,
            created_by=users.get(cpf=CPF_ADMIN),
            cnpj=REGISTERED_CNPJ,
            name="Hospital de Clínicas de Porto Alegre",
            email="secretariageral@hcpa.edu.br",
            phone="5133596100",
            address="Rua Ramiro Barcelos, 2350 Bloco A, Av. Protásio Alves, 211 - Bloco B e C - Santa Cecília",
            state="RS",
            city="Porto Alegre",
            is_active=True,
            id=1000,
        )
        client1.users.add(users.get(cpf=CPF_CLIENT_MANAGER))
        client1.users.add(users.get(cpf=CPF_INTERNAL_PHYSICIST))

        client2 = ClientOperation.objects.create(
            operation_type=ClientOperation.OperationType.CLOSED,
            operation_status=ClientOperation.OperationStatus.ACCEPTED,
            created_by=users.get(cpf=CPF_ADMIN),
            cnpj="90217758000179",
            name="Santa Casa de Porto Alegre",
            email="ouvidoria@santacasa.tche.br",
            phone="5132148000",
            address="Rua Professor Annes Dias, 295 - Centro Histórico",
            state="RS",
            city="Porto Alegre",
            is_active=True,
            id=1001,
        )
        client2.users.add(users.get(cpf=CPF_CLIENT_MANAGER))
        client2.users.add(users.get(cpf=CPF_ADMIN))
        client2.users.add(users.get(cpf=CPF_COMERCIAL))
        client2.users.add(users.get(cpf=CPF_EXTERNAL_PHYSICIST))

        client_empty = ClientOperation.objects.create(
            operation_type=ClientOperation.OperationType.CLOSED,
            operation_status=ClientOperation.OperationStatus.ACCEPTED,
            created_by=users.get(cpf=CPF_ADMIN),
            cnpj="57428412000144",
            name="Hospital Cristo Redentor",
            email="ouvidoria@ghc.br",
            phone="5133574100",
            address="Rua Domingos Rubbo, 20 - Cristo Redentor",
            state="RS",
            city="Porto Alegre",
            is_active=True,
            id=1002,
        )
        client_empty.users.add(users.get(cpf=CPF_CLIENT_MANAGER))

        client_with_comercial = ClientOperation.objects.create(
            operation_type=ClientOperation.OperationType.CLOSED,
            operation_status=ClientOperation.OperationStatus.ACCEPTED,
            created_by=users.get(cpf=CPF_ADMIN),
            cnpj=fake_cnpj(),
            name="Hospital São Lucas da PUCRS",
            email="ouvidoria@saolucas.br",
            phone=fake_phone_number(),
            address="Av. Ipiranga, 6690 - Partenon",
            state="RS",
            city="Porto Alegre",
            is_active=True,
            id=1003,
        )
        client_with_comercial.users.add(users.get(cpf=CPF_CLIENT_MANAGER))
        client_with_comercial.users.add(users.get(cpf=CPF_INTERNAL_PHYSICIST))
        client_with_comercial.users.add(users.get(cpf=CPF_COMERCIAL))

        # Random clients for automated testing
        for _ in range(num_clients + randint(0, 4)):
            client = ClientOperation.objects.create(
                operation_type=ClientOperation.OperationType.CLOSED,
                operation_status=ClientOperation.OperationStatus.ACCEPTED,
                created_by=choice(users.exclude(cpf=CPF_CLIENT_MANAGER)),
                cnpj=fake_cnpj(),
                name=fake.company(),
                email=fake.company_email(),
                phone=fake_phone_number(),
                address=fake.address(),
                state=choice(STATE_CHOICES)[0],
                city=fake.city(),
                is_active=True,
            )
            client.users.add(
                choice(
                    users.exclude(cpf=CPF_CLIENT_MANAGER).filter(
                        role=UserAccount.Role.CLIENT_GENERAL_MANAGER
                    )
                )
            )
            client.users.add(users.get(cpf=CPF_ADMIN))

        default_clients = {
            "client1": _create_client_fixture_data(client1),
            "client2": _create_client_fixture_data(client2),
            "client_empty": _create_client_fixture_data(client_empty),
            "client_with_comercial": _create_client_fixture_data(client_with_comercial),
        }
        return default_clients

    def populate_units(self, num_units_per_client=2):
        """Populates the Units model with example data."""
        all_users = UserAccount.objects.all()
        user_client = UserAccount.objects.get(cpf=CPF_CLIENT_MANAGER)
        user_unit_manager = UserAccount.objects.get(cpf=CPF_UNIT_MANAGER)
        clients = Client.objects.filter(users=user_client)

        def _create_unit_fixture_data(unit_obj):
            """Helper function to create a dictionary for unit fixture data."""
            return {
                "user": unit_obj.user.id if unit_obj.user else None,
                "client": unit_obj.client.id,
                "name": unit_obj.name,
                "cnpj": unit_obj.cnpj,
                "email": unit_obj.email,
                "phone": unit_obj.phone,
                "address": unit_obj.address,
                "state": unit_obj.state,
                "city": unit_obj.city,
                "id": unit_obj.id,
            }

        # Default units for automated testing
        unit1 = UnitOperation.objects.create(
            operation_type=UnitOperation.OperationType.CLOSED,
            operation_status=UnitOperation.OperationStatus.ACCEPTED,
            created_by=all_users.get(cpf=CPF_ADMIN),
            user=user_unit_manager,
            client=clients[0],
            name="Cardiologia",
            cnpj=fake_cnpj(),
            email=fake.email(),
            phone=fake_phone_number(),
            address=fake.address(),
            state=clients[0].state,
            city=clients[0].city,
            id=1000,
        )
        unit2 = UnitOperation.objects.create(
            operation_type=UnitOperation.OperationType.CLOSED,
            operation_status=UnitOperation.OperationStatus.ACCEPTED,
            created_by=all_users.get(cpf=CPF_ADMIN),
            client=clients[0],
            name="Radiologia",
            cnpj=fake_cnpj(),
            email=fake.email(),
            phone=fake_phone_number(),
            address=fake.address(),
            state=clients[1].state,
            city=clients[1].city,
            id=1001,
        )
        unit3 = UnitOperation.objects.create(
            operation_type=UnitOperation.OperationType.CLOSED,
            operation_status=UnitOperation.OperationStatus.ACCEPTED,
            created_by=all_users.get(cpf=CPF_ADMIN),
            client=clients[0],
            name="Hemodinâmica",
            cnpj=fake_cnpj(),
            email=fake.email(),
            phone=fake_phone_number(),
            address=fake.address(),
            state=clients[1].state,
            city=clients[1].city,
            id=1002,
        )
        unit4 = UnitOperation.objects.create(
            operation_type=UnitOperation.OperationType.CLOSED,
            operation_status=UnitOperation.OperationStatus.ACCEPTED,
            created_by=all_users.get(cpf=CPF_ADMIN),
            client=clients[1],
            name="Santa Rita",
            cnpj=fake_cnpj(),
            email=fake.email(),
            phone=fake_phone_number(),
            address=fake.address(),
            state=clients[1].state,
            city=clients[1].city,
            id=1003,
        )

        default_units = {
            "unit1": _create_unit_fixture_data(unit1),
            "unit2": _create_unit_fixture_data(unit2),
            "unit3": _create_unit_fixture_data(unit3),
            "unit4": _create_unit_fixture_data(unit4),
        }

        # Random units for automated testing
        for client in Client.objects.all().exclude(users=user_client):
            for _ in range(num_units_per_client + randint(0, 4)):
                UnitOperation.objects.create(
                    operation_type=UnitOperation.OperationType.CLOSED,
                    operation_status=UnitOperation.OperationStatus.ACCEPTED,
                    created_by=all_users.get(cpf=CPF_ADMIN),
                    user=choice(all_users),
                    client=client,
                    name=fake.company_suffix() + " " + fake.company(),
                    cnpj=fake_cnpj(),
                    email=fake.email(),
                    phone=fake_phone_number(),
                    address=fake.address(),
                    state=client.state,
                    city=client.city,
                )

        return default_units

    def populate_modalities(self):
        for modality in MODALITIES:
            accessory_type = get_accessory_type(modality)
            Modality.objects.create(name=modality, accessory_type=accessory_type)

    def populate_equipments(self, num_equipments_per_units=3):
        """Populates the Equipment model with example data."""

        manufactures = ["GE", "Philips", "Siemens", "Toshiba"]

        user_client = UserAccount.objects.get(cpf=CPF_CLIENT_MANAGER)
        modalities = Modality.objects.all()

        with EQUIPMENT_PHOTO_PATH.open(mode="rb") as f, EQUIPMENT_LABEL_PHOTO_PATH.open(
            mode="rb"
        ) as f_label:
            photo_file = File(f, name=EQUIPMENT_PHOTO_PATH.name)
            label_file = File(f_label, name=EQUIPMENT_LABEL_PHOTO_PATH.name)

            def _create_equipment_fixture_data(eq_obj):
                """Helper function to create a dictionary for equipment fixture data."""
                return {
                    "unit": eq_obj.unit.id,
                    "modality": eq_obj.modality.name,
                    "manufacturer": eq_obj.manufacturer,
                    "model": eq_obj.model,
                    "series_number": eq_obj.series_number,
                    "anvisa_registry": eq_obj.anvisa_registry,
                    "equipment_photo": (
                        eq_obj.equipment_photo.url if eq_obj.equipment_photo else None
                    ),
                    "label_photo": (
                        eq_obj.label_photo.url if eq_obj.label_photo else None
                    ),
                    "id": eq_obj.id,
                }

            # Default equipments for automated testing
            equipment1 = EquipmentOperation.objects.create(
                operation_type=EquipmentOperation.OperationType.CLOSED,
                operation_status=EquipmentOperation.OperationStatus.ACCEPTED,
                created_by=user_client,
                unit=Unit.objects.filter(client__users=user_client)[0],
                modality=modalities.get(name="Mamografia"),
                manufacturer=choice(manufactures),
                model=fake.word().upper() + "-" + str(randint(100, 999)),
                series_number=fake.bothify(text="????-######"),
                anvisa_registry=fake.bothify(text="?????????????"),
                equipment_photo=photo_file,
                label_photo=label_file,
                id=1000,
            )
            equipment2 = EquipmentOperation.objects.create(
                operation_type=EquipmentOperation.OperationType.CLOSED,
                operation_status=EquipmentOperation.OperationStatus.ACCEPTED,
                created_by=user_client,
                unit=Unit.objects.filter(client__users=user_client)[0],
                modality=modalities.get(name="Mamografia"),
                manufacturer=choice(manufactures),
                model=fake.word().upper() + "-" + str(randint(100, 999)),
                series_number=fake.bothify(text="????-######"),
                anvisa_registry=fake.bothify(text="?????????????"),
                equipment_photo=photo_file,
                label_photo=label_file,
                id=1001,
            )

            equipments = {
                "equipment1": _create_equipment_fixture_data(equipment1),
                "equipment2": _create_equipment_fixture_data(equipment2),
            }

            # Random equipments for automated testing
            for units in Unit.objects.all().exclude(client__users=user_client):
                for _ in range(num_equipments_per_units + randint(0, 4)):
                    EquipmentOperation.objects.create(
                        operation_type=EquipmentOperation.OperationType.CLOSED,
                        operation_status=EquipmentOperation.OperationStatus.ACCEPTED,
                        created_by=user_client,
                        unit=units,
                        modality=choice(modalities),
                        manufacturer=choice(manufactures),
                        model=fake.word().upper() + "-" + str(randint(100, 999)),
                        series_number=fake.bothify(text="????-######"),
                        anvisa_registry=fake.bothify(text="?????????????"),
                        equipment_photo=photo_file,
                        label_photo=label_file,
                    )

        return equipments

    def populate_accessories(self):
        accessories_to_create = []
        with EQUIPMENT_PHOTO_PATH.open(mode="rb") as f, EQUIPMENT_LABEL_PHOTO_PATH.open(
            mode="rb"
        ) as f_label:
            photo_file = File(f, name=EQUIPMENT_PHOTO_PATH.name)
            label_file = File(f_label, name=EQUIPMENT_LABEL_PHOTO_PATH.name)

            equipments = Equipment.objects.all()
            for equipment in equipments:
                modality = equipment.modality
                if modality.accessory_type == Modality.AccessoryType.NONE:
                    continue

                accessory = Accessory(
                    equipment=equipment,
                    category=get_accessory_type(modality.name),
                    manufacturer=equipment.manufacturer,
                    model=fake.word().upper() + "-" + str(randint(100, 999)),
                    series_number=fake.bothify(text="????-######"),
                    equipment_photo=photo_file,
                    label_photo=label_file,
                )
                accessories_to_create.append(accessory)

            if accessories_to_create:
                Accessory.objects.bulk_create(accessories_to_create)

    def populate_reports(self):
        """Populates the Report model with example data across all report types."""
        rtype = choice(Report.UNIT_ONLY_TYPES)
        Report.objects.create(
            completion_date=date(2027, 5, 10),
            file=make_report_file(rtype, "Unit 1000"),
            unit=Unit.objects.get(id=1000),
            report_type=rtype,
        )

        # Deterministic report for testing due-report notifications.
        #
        # The notification command (`send_due_report_notifications`) triggers when
        # due_date is 30-31 days from today. We explicitly set due_date so local
        # tests always have at least one match.
        due_report_type = choice(Report.UNIT_ONLY_TYPES)
        Report.objects.create(
            completion_date=date.today() - timedelta(days=365 - 30),
            due_date=date.today() + timedelta(days=30),
            file=make_report_file(due_report_type, "Unit 1000 - due soon"),
            unit=Unit.objects.get(id=1000),
            report_type=due_report_type,
        )

        # Equipment-only reports
        for equipment in Equipment.objects.all():
            for _ in range(randint(1, 3)):
                rtype = choice(Report.EQUIPMENT_ONLY_TYPES)
                completion = random_completion_date(rtype)
                report_file = make_report_file(
                    rtype, f"{equipment.manufacturer}-{equipment.model}"
                )
                Report.objects.create(
                    completion_date=completion,
                    file=report_file,
                    equipment=equipment,
                    report_type=rtype,
                )

        # Unit-only reports
        for unit in Unit.objects.all():
            for _ in range(randint(1, 4)):
                rtype = choice(Report.UNIT_ONLY_TYPES)
                completion = random_completion_date(rtype)
                report_file = make_report_file(rtype, unit.name)
                Report.objects.create(
                    completion_date=completion,
                    file=report_file,
                    unit=unit,
                    report_type=rtype,
                )

    def make_material_file(self, title: str) -> ContentFile:
        """Create a small text file for institutional material uploads."""
        uid = uuid.uuid4().hex[:8]
        filename = f"material-{safe_slug(title)}-{uid}.txt"
        content = (
            f"Material Institucional: {title}\n"
            f"Arquivo gerado automaticamente para testes.\n"
        )
        return ContentFile(content, name=filename)

    def populate_materials(self):
        """Create fake Institutional Materials (public and internal) for testing."""
        users = UserAccount.objects.all()
        external_users = list(
            users.filter(role=UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST)
        )

        # Public materials (no specific permissions)
        public_defs = [
            (
                InstitutionalMaterial.PublicCategory.SIGNS,
                "Sinalizações de Segurança – {city}",
            ),
            (
                InstitutionalMaterial.PublicCategory.TEAM_IO,
                "IOE – Procedimentos Gerais",
            ),
            (
                InstitutionalMaterial.PublicCategory.TERMS,
                "Termos de Consentimento – {state}",
            ),
            (InstitutionalMaterial.PublicCategory.POPS, "POP – Controle de Qualidade"),
            (InstitutionalMaterial.PublicCategory.LAW, "Legislação Vigente – {state}"),
            (
                InstitutionalMaterial.PublicCategory.GUIDES,
                "Guia de Atendimento – {city}",
            ),
            (
                InstitutionalMaterial.PublicCategory.MANUALS,
                "Manual do Colaborador – {city}",
            ),
            (
                InstitutionalMaterial.PublicCategory.OTHERS,
                "Orientações Gerais – {city}",
            ),
        ]

        for cat, title_tpl in public_defs:
            title = title_tpl.format(city=fake.city(), state=choice(STATE_CHOICES)[0])
            InstitutionalMaterial.objects.create(
                title=title,
                description=fake.sentence(nb_words=10),
                visibility=InstitutionalMaterial.Visibility.PUBLIC,
                category=cat,
                file=self.make_material_file(title),
            )

        # Internal materials (some with explicit permissions to external users)
        internal_defs = [
            (
                InstitutionalMaterial.InternalCategory.TEAM_IO,
                "IOE – Rotinas Internas – {city}",
            ),
            (
                InstitutionalMaterial.InternalCategory.POPS,
                "POP – Verificações Internas",
            ),
            (InstitutionalMaterial.InternalCategory.GUIDES, "Guia Interno – Operações"),
            (
                InstitutionalMaterial.InternalCategory.MANUALS,
                "Manual Interno – {state}",
            ),
            (
                InstitutionalMaterial.InternalCategory.REPORT_TEMPLATES,
                "Modelo de Relatório – {city}",
            ),
            (
                InstitutionalMaterial.InternalCategory.DOC_TEMPLATES,
                "Modelo de Documento – {state}",
            ),
            # Optionally add IDV/OUT more samples as needed
        ]

        for idx, (cat, title_tpl) in enumerate(internal_defs):
            title = title_tpl.format(city=fake.city(), state=choice(STATE_CHOICES)[0])
            mat = InstitutionalMaterial.objects.create(
                title=title,
                description=fake.sentence(nb_words=12),
                visibility=InstitutionalMaterial.Visibility.INTERNAL,
                category=cat,
                file=self.make_material_file(title),
            )
            # Assign to some externals to validate restricted access on frontend
            if external_users and idx % 2 == 0:
                # choose 1-2 external users deterministically
                assignees = [external_users[0]]
                if len(external_users) > 1 and randint(0, 1):
                    assignees.append(external_users[1])
                mat.allowed_external_users.set(assignees)

    def populate_service_orders(self, num_service_orders_per_unit=2):
        """Populates the ServiceOrder and Appointment models with example data."""
        # Common service order subjects for medical equipment
        service_subjects = [
            "Calibração de Mamógrafo",
            "Manutenção Preventiva",
            "Reparo de Detector",
            "Substituição de Peças",
            "Verificação de Segurança",
            "Atualização de Software",
            "Limpeza e Desinfecção",
            "Teste de Qualidade",
            "Reparo de Sistema",
            "Instalação de Acessório",
            "Correção de Falha",
            "Inspeção Técnica",
            "Ajuste de Parâmetros",
            "Troca de Filtros",
            "Reparo de Cabo",
        ]

        # Common problem descriptions
        problem_descriptions = [
            "Equipamento apresentando ruído excessivo durante operação",
            "Imagens com qualidade inferior ao padrão esperado",
            "Sistema não inicializa corretamente",
            "Detector apresentando pixels defeituosos",
            "Falha na comunicação entre componentes",
            "Temperatura do equipamento acima do normal",
            "Erro de calibração detectado no sistema",
            "Componente eletrônico com mau funcionamento",
            "Software apresentando travamentos frequentes",
            "Peça mecânica necessita substituição",
            "Sistema de refrigeração com problemas",
            "Falha na alimentação elétrica",
            "Sensor apresentando leituras inconsistentes",
            "Interface do usuário não responsiva",
            "Problema de conectividade de rede",
        ]

        # Common resolution conclusions
        conclusions = [
            "Equipamento calibrado e testado com sucesso. Funcionamento normal restabelecido.",
            "Peças defeituosas substituídas. Sistema operando dentro dos parâmetros normais.",
            "Software atualizado e configurações otimizadas. Problema resolvido.",
            "Limpeza completa realizada e componentes ajustados. Equipamento em perfeito estado.",
            "Reparo concluído com sucesso. Testes de qualidade aprovados.",
            "Manutenção preventiva executada conforme protocolo. Equipamento liberado para uso.",
            "Falha corrigida e sistema validado. Funcionamento estável confirmado.",
            "Instalação concluída e testes realizados. Equipamento operacional.",
            "Ajustes realizados e parâmetros otimizados. Performance melhorada.",
            "Substituição de componentes finalizada. Sistema funcionando adequadamente.",
            "Problema identificado e solucionado. Equipamento em condições normais de uso.",
            "Verificação de segurança aprovada. Equipamento liberado para operação.",
            "Correções aplicadas e sistema testado. Funcionamento conforme especificações.",
            "Manutenção corretiva executada. Equipamento restabelecido ao estado original.",
            "Inspeção técnica concluída. Todos os parâmetros dentro da normalidade.",
        ]

        units = list(Unit.objects.all())
        equipments_qs = Equipment.objects.all()

        if not equipments_qs.exists():
            self.stdout.write(
                self.style.WARNING(
                    "No equipments found. Skipping service orders creation."
                )
            )
            return {}

        def _create_service_order_fixture_data(service_order_obj):
            """Helper function to create a dictionary for service order fixture data."""
            return {
                "id": service_order_obj.id,
                "subject": service_order_obj.subject,
                "description": service_order_obj.description,
                "conclusion": service_order_obj.conclusion,
                "equipments": [eq.id for eq in service_order_obj.equipments.all()],
            }

        # Default service orders for automated testing (use the first two equipments deterministically)
        default_equipments = list(equipments_qs.order_by("id")[:2])

        service_order1 = ServiceOrder.objects.create(
            subject="Calibração de Mamógrafo",
            description=(
                "Equipamento apresentando imagens com qualidade inferior ao padrão esperado. "
                "Necessária calibração completa do sistema de aquisição de imagens."
            ),
            conclusion=(
                "Equipamento calibrado e testado com sucesso. Funcionamento normal restabelecido. "
                "Qualidade das imagens dentro dos parâmetros aceitáveis."
            ),
            id=1000,
        )
        if default_equipments:
            service_order1.equipments.add(default_equipments[0])

        # Create corresponding appointment for service_order1 (IN_PERSON)
        appointment_date = fake.date_time_between(
            start_date="-30d", end_date="+30d", tzinfo=timezone.get_current_timezone()
        )
        status1 = choice(
            [
                Appointment.Status.PENDING,
                Appointment.Status.CONFIRMED,
                Appointment.Status.FULFILLED,
            ]
        )
        Appointment.objects.create(
            date=appointment_date,
            status=status1,
            type=Appointment.Type.IN_PERSON,
            justification=None,
            contact_phone=fake_phone_number(),
            contact_name=fake.name(),
            service_order=(
                service_order1 if status1 == Appointment.Status.FULFILLED else None
            ),
            unit=(default_equipments[0].unit if default_equipments else choice(units)),
            id=1000,
        )

        service_order2 = ServiceOrder.objects.create(
            subject="Manutenção Preventiva",
            description=(
                "Manutenção preventiva programada conforme cronograma anual. "
                "Verificação geral dos componentes e limpeza do sistema."
            ),
            conclusion=(
                "Manutenção preventiva executada conforme protocolo. Equipamento liberado para uso. "
                "Próxima manutenção agendada para 6 meses."
            ),
            id=1001,
        )
        if len(default_equipments) > 1:
            service_order2.equipments.add(default_equipments[1])

        # Create corresponding appointment for service_order2 (ONLINE)
        appointment_date2 = fake.date_time_between(
            start_date="-60d", end_date="+60d", tzinfo=timezone.get_current_timezone()
        )
        status2 = choice(
            [
                Appointment.Status.PENDING,
                Appointment.Status.CONFIRMED,
                Appointment.Status.FULFILLED,
            ]
        )
        Appointment.objects.create(
            date=appointment_date2,
            status=status2,
            type=Appointment.Type.ONLINE,
            justification=None,
            contact_phone=fake_phone_number(),
            contact_name=fake.name(),
            service_order=(
                service_order2 if status2 == Appointment.Status.FULFILLED else None
            ),
            unit=(
                default_equipments[1].unit
                if len(default_equipments) > 1
                else choice(units)
            ),
            id=1001,
        )

        # Additional default pending appointments without associated service order
        # First one is IN_PERSON
        pending_appointment_date1 = fake.date_time_between(
            start_date="-15d", end_date="+45d", tzinfo=timezone.get_current_timezone()
        )
        Appointment.objects.create(
            date=pending_appointment_date1,
            status=Appointment.Status.PENDING,
            type=Appointment.Type.IN_PERSON,
            justification=None,
            contact_phone=fake_phone_number(),
            contact_name=fake.name(),
            service_order=None,
            unit=(default_equipments[0].unit if default_equipments else choice(units)),
            id=1002,
        )

        # Second one is ONLINE
        pending_appointment_date2 = fake.date_time_between(
            start_date="-10d", end_date="+60d", tzinfo=timezone.get_current_timezone()
        )
        Appointment.objects.create(
            date=pending_appointment_date2,
            status=Appointment.Status.PENDING,
            type=Appointment.Type.ONLINE,
            justification=None,
            contact_phone=fake_phone_number(),
            contact_name=fake.name(),
            service_order=None,
            unit=(
                default_equipments[1].unit
                if len(default_equipments) > 1
                else choice(units)
            ),
            id=1003,
        )

        # Deterministic past UNFULFILLED appointment for testing rescheduling guard (ONLINE)
        unfulfilled_past_date = timezone.now() - timedelta(days=7)
        Appointment.objects.create(
            date=unfulfilled_past_date,
            status=Appointment.Status.UNFULFILLED,
            type=Appointment.Type.ONLINE,
            justification="Visita não realizada no dia agendado.",
            contact_phone=fake_phone_number(),
            contact_name=fake.name(),
            service_order=None,
            unit=(default_equipments[0].unit if default_equipments else choice(units)),
            id=1004,
        )

        default_service_orders = {
            "service_order1": _create_service_order_fixture_data(service_order1),
            "service_order2": _create_service_order_fixture_data(service_order2),
        }

        # Random service orders for automated testing
        for unit in units:
            unit_equipments = list(equipments_qs.filter(unit=unit))
            if not unit_equipments:
                continue

            for _ in range(num_service_orders_per_unit + randint(0, 2)):
                subject = choice(service_subjects)
                description = choice(problem_descriptions)
                conclusion = choice(conclusions)

                service_order = ServiceOrder.objects.create(
                    subject=subject,
                    description=description,
                    conclusion=conclusion,
                )

                # Associate 1-3 equipments from the same unit
                num_equipments = min(randint(1, 3), len(unit_equipments))
                selected_equipments = fake.random_elements(
                    elements=unit_equipments, length=num_equipments, unique=True
                )
                service_order.equipments.set(selected_equipments)

                # Create corresponding appointment with random type (mix of IN_PERSON and ONLINE)
                appointment_date = fake.date_time_between(
                    start_date="-90d",
                    end_date="+90d",
                    tzinfo=timezone.get_current_timezone(),
                )
                status = choice(
                    [
                        Appointment.Status.PENDING,
                        Appointment.Status.CONFIRMED,
                        Appointment.Status.FULFILLED,
                        Appointment.Status.UNFULFILLED,
                        Appointment.Status.RESCHEDULED,
                    ]
                )
                justification = (
                    fake.sentence(nb_words=8)
                    if status
                    in [Appointment.Status.UNFULFILLED, Appointment.Status.RESCHEDULED]
                    else None
                )
                # Randomly assign type: 60% IN_PERSON, 40% ONLINE
                appointment_type = choice(
                    [
                        Appointment.Type.IN_PERSON,
                        Appointment.Type.IN_PERSON,
                        Appointment.Type.ONLINE,
                        Appointment.Type.ONLINE,
                    ]
                )
                Appointment.objects.create(
                    date=appointment_date,
                    status=status,
                    type=appointment_type,
                    justification=justification,
                    contact_phone=fake_phone_number(),
                    contact_name=fake.name(),
                    service_order=(
                        service_order
                        if status == Appointment.Status.FULFILLED
                        else None
                    ),
                    unit=unit,
                )

        return default_service_orders

    def populate_proposals(self, num_proposals=150):
        """Populates the Proposal model with example data."""
        contract_type_choices = [
            Proposal.ContractType.ANNUAL,
            Proposal.ContractType.MONTHLY,
        ]
        status_choices_all = [
            Proposal.Status.ACCEPTED,
            Proposal.Status.REJECTED,
            Proposal.Status.PENDING,
        ]

        approved_cnpjs = []

        with PROPOSAL_PDF_PATH.open(mode="rb") as pdf, PROPOSAL_WORD_PATH.open(
            mode="rb"
        ) as word:
            pdf_file = File(pdf, name=PROPOSAL_PDF_PATH.name)
            word_file = File(word, name=PROPOSAL_WORD_PATH.name)

            # Defaults Proposal for automated testing
            Proposal.objects.create(
                cnpj=REJECTED_PROPOSAL_CNPJ,
                city=fake.city(),
                state=choice(STATE_CHOICES)[0],
                contact_name=fake.name(),
                contact_phone=fake_phone_number(),
                email=fake.email(),
                date=fake.date(),
                value=fake.pydecimal(left_digits=5, right_digits=2, positive=True),
                contract_type=choice(contract_type_choices),
                status=Proposal.Status.REJECTED,
                pdf_version=pdf_file,
                word_version=word_file,
            )

            Proposal.objects.create(
                cnpj=APPROVED_PROPOSAL_CNPJ,
                city=fake.city(),
                state=choice(STATE_CHOICES)[0],
                contact_name=fake.name(),
                contact_phone=fake_phone_number(),
                email=fake.email(),
                date=fake.date(),
                value=fake.pydecimal(left_digits=5, right_digits=2, positive=True),
                contract_type=choice(contract_type_choices),
                status=Proposal.Status.ACCEPTED,
                pdf_version=pdf_file,
                word_version=word_file,
            )

            # Deterministic proposals for testing contract notifications
            threshold_date = date.today() - relativedelta(months=11)

            # 1) Renewal notification test: ACCEPTED + ANNUAL proposal exactly 11 months old
            # Use client2 (cnpj="90217758000179") which has GP, C, and GGC users
            renewal_test_cnpj = "90217758000179"
            Proposal.objects.create(
                cnpj=renewal_test_cnpj,
                city="Porto Alegre",
                state="RS",
                contact_name="Contato Renovação Teste",
                contact_phone=fake_phone_number(),
                email=fake.email(),
                date=threshold_date,
                value=50000.00,
                contract_type=Proposal.ContractType.ANNUAL,
                status=Proposal.Status.ACCEPTED,
                pdf_version=pdf_file,
                word_version=word_file,
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f"Created deterministic RENEWAL proposal for CNPJ {renewal_test_cnpj} "
                    f"with date={threshold_date}"
                )
            )

            # 2) Win-back notification test: REJECTED proposal exactly 11 months old
            # Use REJECTED_PROPOSAL_CNPJ and ensure client exists with COMMERCIAL user
            winback_test_cnpj = REJECTED_PROPOSAL_CNPJ
            try:
                winback_client = Client.objects.get(cnpj=winback_test_cnpj)
            except Client.DoesNotExist:
                # Create client if it doesn't exist
                winback_client = ClientOperation.objects.create(
                    operation_type=ClientOperation.OperationType.CLOSED,
                    operation_status=ClientOperation.OperationStatus.ACCEPTED,
                    created_by=UserAccount.objects.get(cpf=CPF_ADMIN),
                    cnpj=winback_test_cnpj,
                    name="Cliente Reconquista Teste",
                    email=fake.email(),
                    phone=fake_phone_number(),
                    address=fake.address(),
                    state="SP",
                    city="São Paulo",
                    is_active=True,
                )
                winback_client.users.add(UserAccount.objects.get(cpf=CPF_COMERCIAL))
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Created deterministic client for win-back test: {winback_test_cnpj}"
                    )
                )

            # Ensure COMMERCIAL user is associated
            if not winback_client.users.filter(cpf=CPF_COMERCIAL).exists():
                winback_client.users.add(UserAccount.objects.get(cpf=CPF_COMERCIAL))

            Proposal.objects.create(
                cnpj=winback_test_cnpj,
                city="São Paulo",
                state="SP",
                contact_name="Contato Reconquista Teste",
                contact_phone=fake_phone_number(),
                email=fake.email(),
                date=threshold_date,
                value=30000.00,
                contract_type=Proposal.ContractType.ANNUAL,
                status=Proposal.Status.REJECTED,
                pdf_version=pdf_file,
                word_version=word_file,
            )
            self.stdout.write(
                self.style.SUCCESS(
                    f"Created deterministic WIN-BACK proposal for CNPJ {winback_test_cnpj} "
                    f"with date={threshold_date}"
                )
            )

            # Create proposals for all existing clients to ensure each client has at least one proposal
            existing_clients = Client.objects.all()
            for i, client in enumerate(existing_clients):
                # Use different statuses for variety in testing
                status = status_choices_all[i % len(status_choices_all)]

                # First proposal with deterministic status
                Proposal.objects.create(
                    cnpj=client.cnpj,
                    city=client.city,
                    state=client.state,
                    contact_name=fake.name(),
                    contact_phone=fake_phone_number(),
                    email=fake.email(),
                    date=fake.date(),
                    value=fake.pydecimal(left_digits=5, right_digits=2, positive=True),
                    contract_type=choice(contract_type_choices),
                    status=status_choices_all[0],
                    pdf_version=pdf_file,
                    word_version=word_file,
                )

                # Second proposal
                Proposal.objects.create(
                    cnpj=client.cnpj,
                    city=client.city,
                    state=client.state,
                    contact_name=fake.name(),
                    contact_phone=fake_phone_number(),
                    email=fake.email(),
                    date=fake.date(),
                    value=fake.pydecimal(left_digits=5, right_digits=2, positive=True),
                    contract_type=choice(contract_type_choices),
                    status=status,
                    pdf_version=pdf_file,
                    word_version=word_file,
                )

                # Third proposal
                Proposal.objects.create(
                    cnpj=client.cnpj,
                    city=client.city,
                    state=client.state,
                    contact_name=fake.name(),
                    contact_phone=fake_phone_number(),
                    email=fake.email(),
                    date=fake.date(),
                    value=fake.pydecimal(left_digits=5, right_digits=2, positive=True),
                    contract_type=choice(contract_type_choices),
                    status=status,
                    pdf_version=pdf_file,
                    word_version=word_file,
                )

                # Track approved proposals for fixture generation
                if status == Proposal.Status.ACCEPTED:
                    approved_cnpjs.append(client.cnpj)

            # Continue with existing random proposal generation for additional test data
            for _ in range(num_proposals):
                cnpj = fake_cnpj()
                approved_cnpjs.append(cnpj)

                Proposal.objects.create(
                    cnpj=cnpj,
                    city=fake.city(),
                    state=choice(STATE_CHOICES)[0],
                    contact_name=fake.name(),
                    contact_phone=fake_phone_number(),
                    email=fake.email(),
                    date=fake.date(),
                    value=fake.pydecimal(left_digits=5, right_digits=2, positive=True),
                    contract_type=choice(contract_type_choices),
                    status=Proposal.Status.ACCEPTED,
                    pdf_version=pdf_file,
                    word_version=word_file,
                )

                Proposal.objects.create(
                    cnpj=fake_cnpj(),
                    city=fake.city(),
                    state=choice(STATE_CHOICES)[0],
                    contact_name=fake.name(),
                    contact_phone=fake_phone_number(),
                    email=fake.email(),
                    date=fake.date(),
                    value=fake.pydecimal(left_digits=5, right_digits=2, positive=True),
                    contract_type=choice(contract_type_choices),
                    status=choice(status_choices_all),
                    pdf_version=pdf_file,
                    word_version=word_file,
                )

        return approved_cnpjs

    def populate_pending_appointment_scenarios(self) -> None:
        """Create deterministic clients for Cypress E2E tests.

        The frontend highlights clients with `needs_appointment=true`.
        This value is computed from:
        - latest accepted annual proposal date
        - absence/presence of an appointment strictly after that date

        To keep Cypress tests stable, we seed two deterministic clients:
        - one pending (no appointment after annual proposal)
        - one compliant (has appointment after annual proposal)
        """

        admin_user = UserAccount.objects.get(cpf=CPF_ADMIN)
        proposal_date = date.today() - timedelta(days=30)

        def ensure_client_operation(
            *,
            cnpj: str,
            name: str,
            email: str,
            phone: str,
            address: str,
            state: str,
            city: str,
        ) -> ClientOperation:
            existing = ClientOperation.objects.filter(cnpj=cnpj).first()
            if existing:
                return existing

            return ClientOperation.objects.create(
                operation_type=ClientOperation.OperationType.CLOSED,
                operation_status=ClientOperation.OperationStatus.ACCEPTED,
                created_by=admin_user,
                cnpj=cnpj,
                name=name,
                email=email,
                phone=phone,
                address=address,
                state=state,
                city=city,
                is_active=True,
            )

        pending_client = ensure_client_operation(
            cnpj=PENDING_APPOINTMENT_CNPJ,
            name="Cliente E2E - Agendamento pendente",
            email="e2e-pending@example.com",
            phone=fake_phone_number(),
            address="Rua E2E, 100",
            state="RS",
            city="Porto Alegre",
        )

        compliant_client = ensure_client_operation(
            cnpj=COMPLIANT_APPOINTMENT_CNPJ,
            name="Cliente E2E - Agendamento em dia",
            email="e2e-compliant@example.com",
            phone=fake_phone_number(),
            address="Rua E2E, 200",
            state="RS",
            city="Porto Alegre",
        )

        pending_unit, _ = UnitOperation.objects.get_or_create(
            operation_type=UnitOperation.OperationType.CLOSED,
            operation_status=UnitOperation.OperationStatus.ACCEPTED,
            created_by=admin_user,
            client=pending_client.client_ptr,
            defaults={
                "name": "Unidade E2E - pendente",
                "cnpj": fake_cnpj(),
                "email": fake.email(),
                "phone": fake_phone_number(),
                "address": "Rua Unidade E2E, 10",
                "state": pending_client.state,
                "city": pending_client.city,
            },
        )

        compliant_unit, _ = UnitOperation.objects.get_or_create(
            operation_type=UnitOperation.OperationType.CLOSED,
            operation_status=UnitOperation.OperationStatus.ACCEPTED,
            created_by=admin_user,
            client=compliant_client.client_ptr,
            defaults={
                "name": "Unidade E2E - em dia",
                "cnpj": fake_cnpj(),
                "email": fake.email(),
                "phone": fake_phone_number(),
                "address": "Rua Unidade E2E, 20",
                "state": compliant_client.state,
                "city": compliant_client.city,
            },
        )

        Proposal.objects.update_or_create(
            cnpj=pending_client.cnpj,
            date=proposal_date,
            defaults={
                "city": pending_client.city,
                "state": pending_client.state,
                "contact_name": "Contato E2E",
                "contact_phone": fake_phone_number(),
                "email": fake.email(),
                "value": 10000.00,
                "contract_type": Proposal.ContractType.ANNUAL,
                "status": Proposal.Status.ACCEPTED,
            },
        )

        Proposal.objects.update_or_create(
            cnpj=compliant_client.cnpj,
            date=proposal_date,
            defaults={
                "city": compliant_client.city,
                "state": compliant_client.state,
                "contact_name": "Contato E2E",
                "contact_phone": fake_phone_number(),
                "email": fake.email(),
                "value": 10000.00,
                "contract_type": Proposal.ContractType.ANNUAL,
                "status": Proposal.Status.ACCEPTED,
            },
        )

        # Ensure compliant has at least one appointment strictly after the
        # accepted annual proposal date.
        compliant_appointment_date = timezone.now() + timedelta(days=7)
        Appointment.objects.get_or_create(
            unit=compliant_unit.unit_ptr,
            date=compliant_appointment_date,
            defaults={
                "status": Appointment.Status.CONFIRMED,
                "type": Appointment.Type.IN_PERSON,
                "justification": None,
                "contact_phone": fake_phone_number(),
                "contact_name": "Contato E2E",
                "service_order": None,
            },
        )

    def create_json_fixture(
        self, approved_cnpjs, users, default_clients, default_units, default_equipments
    ):
        """Creates JSON fixture files from the populated data."""
        fixture_data_map = [
            (
                {
                    "approved_cnpjs": approved_cnpjs,
                    "rejected_cnpj": REJECTED_PROPOSAL_CNPJ,
                },
                "proposals.json",
            ),
            (users, "users.json"),
            ({"registered_cnpj": REGISTERED_CNPJ}, "registered-client.json"),
            (
                {"eligible_registration_cnpj": ELIGIBLE_REGISTRATION_CNPJ},
                "eligible-registration.json",
            ),
            ({"no_proposal_cnpj": NO_PROPOSAL_CNPJ}, "no-proposal.json"),
            (default_clients, "default-clients.json"),
            (default_units, "default-units.json"),
            (default_equipments, "default-equipments.json"),
            (
                {
                    "pending_cnpj": PENDING_APPOINTMENT_CNPJ,
                    "compliant_cnpj": COMPLIANT_APPOINTMENT_CNPJ,
                },
                "pending-appointment.json",
            ),
        ]

        # Ensure the main fixture directory exists
        # The write_json_file function will handle subdirectories if file_path includes them.
        os.makedirs(FIXTURE_PATH, exist_ok=True)

        for data, filename in fixture_data_map:
            file_path = create_fixture_path(filename)
            write_json_file(data=data, file_path=file_path)
            self.stdout.write(self.style.SUCCESS(f"Created {file_path}"))
