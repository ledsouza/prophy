from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission
from django.contrib.auth.models import Group
from django.core.files import File
from django.conf import settings

from clients_management.models import Client, Unit, Modality, Accessory, Proposal
from requisitions.models import ClientOperation, UnitOperation, EquipmentOperation
from users.models import UserAccount

import json
import os
from faker import Faker
from random import choice, randint
from localflavor.br.br_states import STATE_CHOICES


fake = Faker("pt_BR")

BASE_DIR = settings.BASE_DIR
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(
    os.path.join(current_dir, "..", "..", "..", ".."))


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


class Command(BaseCommand):
    help = "Populate the database with fake data."

    def handle(self, *args, **options):
        self.create_groups()
        users = self.populate_users()
        default_clients = self.populate_clients()
        default_units = self.populate_units()
        self.populate_modalities()
        default_equipments = self.populate_equipments()
        self.populate_accessories()
        approved_cnpjs = self.populate_proposals()
        self.create_json_fixture(
            approved_cnpjs, users, default_clients, default_units, default_equipments
        )
        self.stdout.write(
            self.style.SUCCESS(
                "Database populated and fixture created successfully!")
        )

    def create_groups(self):
        """Creates user groups and assigns permissions based on roles."""
        base_permissions = (
            Permission.objects.exclude(name__contains="add Cliente")
            .exclude(name__contains="add Unidade")
            .exclude(name__contains="add Equipamento")
        )

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

            # PROPHY_MANAGER gets all base_permissions directly
            if role_value == UserAccount.Role.PROPHY_MANAGER:
                group.permissions.set(
                    role_permissions_map[UserAccount.Role.PROPHY_MANAGER]
                )
                continue

            # For other roles, get permissions based on the map
            permission_names = role_permissions_map.get(role_value, [])
            permissions_to_assign = []
            if permission_names:  # Ensure permission_names is not empty nor None
                for name_substring in permission_names:
                    try:
                        # Using base_permissions queryset to find specific permissions
                        perm = base_permissions.get(
                            name__contains=name_substring)
                        permissions_to_assign.append(perm)
                    except Permission.DoesNotExist:
                        self.stdout.write(
                            self.style.WARNING(
                                f"Permission containing '{name_substring}' not found for role '{role_value}'."
                            )
                        )
                    except Permission.MultipleObjectsReturned:
                        self.stdout.write(
                            self.style.WARNING(
                                f"Multiple permissions found containing '{name_substring}' for role '{role_value}'. Please make the substring more specific."
                            )
                        )

            if permissions_to_assign:
                group.permissions.set(permissions_to_assign)
            elif (
                role_value != UserAccount.Role.PROPHY_MANAGER
            ):  # Avoid clearing for prophy manager if map was empty
                # Clear permissions if no specific ones are defined and it's not prophy_manager
                group.permissions.clear()

    def populate_users(self, num_users=10):
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
            email="leandro.souza.159@gmail.com",
            phone=fake_phone_number(),
            password=PASSWORD,
            name="Alexandre Ferret",
            role=UserAccount.Role.PROPHY_MANAGER,
            is_staff=True,
            id=1000,
        )

        client_user = UserAccount.objects.create_user(
            cpf=CPF_CLIENT_MANAGER,
            email=fake.email(),
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
        for _ in range(num_users):
            UserAccount.objects.create_user(
                cpf=fake_cpf(),
                email=fake.email(),
                phone=fake_phone_number(),
                password=PASSWORD,
                name=fake.name(),
            )

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
                "active": client_obj.active,
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
            active=True,
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
            active=True,
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
            active=True,
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
            active=True,
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
                active=True,
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
            Modality.objects.create(
                name=modality, accessory_type=accessory_type)

    def populate_equipments(self, num_equipments_per_units=3):
        """Populates the Equipment model with example data."""

        manufactures = ["GE", "Philips", "Siemens", "Toshiba"]

        user_client = UserAccount.objects.get(cpf=CPF_CLIENT_MANAGER)
        modalities = Modality.objects.all()

        with EQUIPMENT_PHOTO_PATH.open(mode="rb") as f:
            with EQUIPMENT_LABEL_PHOTO_PATH.open(mode="rb") as f_label:
                photo_file = File(f, name=EQUIPMENT_PHOTO_PATH.name)
                label_file = File(
                    f_label, name=EQUIPMENT_LABEL_PHOTO_PATH.name)

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
                            eq_obj.equipment_photo.url
                            if eq_obj.equipment_photo
                            else None
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
        with EQUIPMENT_PHOTO_PATH.open(mode="rb") as f:
            with EQUIPMENT_LABEL_PHOTO_PATH.open(mode="rb") as f_label:
                photo_file = File(f, name=EQUIPMENT_PHOTO_PATH.name)
                label_file = File(
                    f_label, name=EQUIPMENT_LABEL_PHOTO_PATH.name)

                equipments = EquipmentOperation.objects.all()
                for equipment in equipments:
                    modality = equipment.modality
                    if modality.accessory_type == Modality.AccessoryType.NONE:
                        continue
                    Accessory.objects.create(
                        equipment=equipment,
                        category=get_accessory_type(modality),
                        manufacturer=equipment.manufacturer,
                        model=fake.word().upper() + "-" + str(randint(100, 999)),
                        series_number=fake.bothify(text="????-######"),
                        equipment_photo=photo_file,
                        label_photo=label_file,
                    )

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
        )

        for _ in range(num_proposals):
            cnpj = fake_cnpj()

            Proposal.objects.create(
                cnpj=cnpj,
                city=fake.city(),
                state=choice(STATE_CHOICES)[0],
                contact_name=fake.name(),
                contact_phone=fake_phone_number(),
                email=fake.email(),
                date=fake.date(),
                value=fake.pydecimal(
                    left_digits=5, right_digits=2, positive=True),
                contract_type=choice(contract_type_choices),
                status=Proposal.Status.ACCEPTED,
            )
            approved_cnpjs.append(cnpj)

            Proposal.objects.create(
                cnpj=fake_cnpj(),
                city=fake.city(),
                state=choice(STATE_CHOICES)[0],
                contact_name=fake.name(),
                contact_phone=fake_phone_number(),
                email=fake.email(),
                date=fake.date(),
                value=fake.pydecimal(
                    left_digits=5, right_digits=2, positive=True),
                contract_type=choice(contract_type_choices),
                status=choice(status_choices_all),
            )

        return approved_cnpjs

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
            (default_clients, "default-clients.json"),
            (default_units, "default-units.json"),
            (default_equipments, "default-equipments.json"),
        ]

        # Ensure the main fixture directory exists
        # The write_json_file function will handle subdirectories if file_path includes them.
        os.makedirs(FIXTURE_PATH, exist_ok=True)

        for data, filename in fixture_data_map:
            file_path = create_fixture_path(filename)
            write_json_file(data=data, file_path=file_path)
            self.stdout.write(self.style.SUCCESS(f"Created {file_path}"))
