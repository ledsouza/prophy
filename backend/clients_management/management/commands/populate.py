from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission
from django.contrib.auth.models import Group

from clients_management.models import Client, Unit, Proposal
from requisitions.models import ClientOperation, UnitOperation, EquipmentOperation
from users.models import UserAccount

import json
import os
from faker import Faker
from random import choice, randint
from localflavor.br.br_states import STATE_CHOICES

fake = Faker("pt_BR")
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(
    os.path.join(current_dir, '..', '..', '..', '..'))


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

FIXTURE_PATH = os.path.join(
    project_root, 'frontend', 'cypress', 'fixtures')


def fake_phone_number():
    return fake.msisdn()[2:]


def fake_cnpj():
    return fake.cnpj().replace(
        ".", "").replace("/", "").replace("-", "")


def fake_cpf():
    return fake.cpf().replace(".", "").replace("-", "")


def create_fixture_path(output_name: str) -> str:
    return os.path.join(
        FIXTURE_PATH, output_name)


def write_json_file(data: dict, file_path: str) -> None:
    """
    Writes data to a JSON file with indentation.

    Args:
        data: A dictionary to be converted to JSON.
        file_path (str): The path to the file where the JSON data will be saved.
    """
    with open(file_path, 'w', encoding="utf-8") as json_file:
        json.dump(data, json_file, indent=2)


class Command(BaseCommand):
    help = "Populate the database with fake data."

    def handle(self, *args, **options):
        self.create_groups()
        users = self.populate_users()
        default_clients = self.populate_clients()
        default_units = self.populate_units()
        default_equipments = self.populate_equipaments()
        approved_cnpjs = self.populate_proposals()
        self.create_json_fixture(
            approved_cnpjs, users, default_clients, default_units, default_equipments)
        self.stdout.write(self.style.SUCCESS(
            'Database populated and fixture created successfully!'))

    def create_groups(self):
        permissions = Permission.objects.all()
        permissions = permissions.exclude(name__contains="add Cliente")
        permissions = permissions.exclude(name__contains="add Unidade")
        permissions = permissions.exclude(name__contains="add Equipamento")

        for role in UserAccount.Role.values:
            group, _ = Group.objects.get_or_create(name=role)

            if role == UserAccount.Role.PROPHY_MANAGER:
                group.permissions.set(permissions)

            if role == UserAccount.Role.CLIENT_GENERAL_MANAGER:
                group.permissions.set([permissions.get(name__contains="view Cliente"), permissions.get(
                    name__contains="view Unidade"), permissions.get(name__contains="view Equipamento")])

            if role == UserAccount.Role.UNIT_MANAGER:
                group.permissions.set([permissions.get(
                    name__contains="view Unidade"), permissions.get(name__contains="view Equipamento")])

            if role == UserAccount.Role.COMMERCIAL:
                group.permissions.set([permissions.get(
                    name__contains="view Cliente"), permissions.get(name__contains="view Proposta"),
                    permissions.get(name__contains="change Proposta"), permissions.get(name__contains="add Proposta")])

            if role == UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST:
                group.permissions.set([permissions.get(name__contains="view Cliente"), permissions.get(
                    name__contains="view Unidade"), permissions.get(name__contains="view Equipamento")])

            if role == UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST:
                group.permissions.set([permissions.get(name__contains="view Cliente"), permissions.get(
                    name__contains="view Unidade"), permissions.get(name__contains="view Equipamento")])

    def populate_users(self, num_users=20):
        """Populates the User model with example data."""

        # Default users for automated testing
        admin_user = UserAccount.objects.create_user(
            cpf=CPF_ADMIN,
            email="leandro.souza.159@gmail.com",
            phone=fake_phone_number(),
            password=PASSWORD,
            name="Alexandre Ferret",
            role=UserAccount.Role.PROPHY_MANAGER,
            is_staff=True,
            id=1000
        )

        client_user = UserAccount.objects.create_user(
            cpf=CPF_CLIENT_MANAGER,
            email=fake.email(),
            phone=fake_phone_number(),
            password=PASSWORD,
            name="Leandro Souza",
            role=UserAccount.Role.CLIENT_GENERAL_MANAGER,
            id=1001
        )

        unit_manager_user = UserAccount.objects.create_user(
            cpf=CPF_UNIT_MANAGER,
            email=fake.email(),
            phone=fake_phone_number(),
            password=PASSWORD,
            name="Fabricio Fernandes",
            role=UserAccount.Role.UNIT_MANAGER,
            id=1002
        )

        comercial_user = UserAccount.objects.create_user(
            cpf=CPF_COMERCIAL,
            email=fake.email(),
            phone=fake_phone_number(),
            password=PASSWORD,
            name="Brenda Candeia",
            role=UserAccount.Role.COMMERCIAL,
            id=1003
        )

        external_physicist_user = UserAccount.objects.create_user(
            cpf=CPF_EXTERNAL_PHYSICIST,
            email=fake.email(),
            phone=fake_phone_number(),
            password=PASSWORD,
            name="Gato Comunista",
            role=UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST,
            id=1004
        )

        internal_physicist_user = UserAccount.objects.create_user(
            cpf=CPF_INTERNAL_PHYSICIST,
            email=fake.email(),
            phone=fake_phone_number(),
            password=PASSWORD,
            name="Paulo Capitalista",
            role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST,
            id=1005
        )

        users = {
            "admin_user": {
                "cpf": admin_user.cpf,
                "password": PASSWORD,
                "name": admin_user.name,
                "email": admin_user.email,
                "phone": admin_user.phone
            },
            "client_user": {
                "cpf": client_user.cpf,
                "password": PASSWORD,
                "name": client_user.name,
                "email": client_user.email,
                "phone": client_user.phone
            },
            "unit_manager_user": {
                "cpf": unit_manager_user.cpf,
                "password": PASSWORD,
                "name": unit_manager_user.name,
                "email": unit_manager_user.email,
                "phone": unit_manager_user.phone
            },
            "comercial_user": {
                "cpf": comercial_user.cpf,
                "password": PASSWORD,
                "name": comercial_user.name,
                "email": comercial_user.email,
                "phone": comercial_user.phone
            },
            "external_physicist_user": {
                "cpf": external_physicist_user.cpf,
                "password": PASSWORD,
                "name": external_physicist_user.name,
                "email": external_physicist_user.email,
                "phone": external_physicist_user.phone
            },
            "internal_physicist_user": {
                "cpf": internal_physicist_user.cpf,
                "password": PASSWORD,
                "name": internal_physicist_user.name,
                "email": internal_physicist_user.email,
                "phone": internal_physicist_user.phone
            }
        }

        # Random users for automated testing
        for _ in range(num_users):
            UserAccount.objects.create_user(
                cpf=fake_cpf(),
                email=fake.email(),
                phone=fake_phone_number(),
                password=PASSWORD,
                name=fake.name()
            )

        return users

    def populate_clients(self, num_clients=20):
        """Populates the Client model with example data."""
        users = UserAccount.objects.all()

        # Default clients for automated testing
        client1 = ClientOperation.objects.create(
            operation_type="C",
            operation_status="A",
            created_by=users.get(cpf=CPF_ADMIN),
            cnpj=REGISTERED_CNPJ,
            name="Hospital de Clínicas de Porto Alegre",
            email="secretariageral@hcpa.edu.br",
            phone="5133596100",
            address="Rua Ramiro Barcelos, 2350 Bloco A, Av. Protásio Alves, 211 - Bloco B e C - Santa Cecília, Porto Alegre - RS, 90035-903",
            state="RS",
            city="Porto Alegre",
            active=True,
            id=1000
        )
        client1.users.add(users.get(cpf=CPF_CLIENT_MANAGER))
        client1.users.add(users.get(cpf=CPF_ADMIN))

        client2 = ClientOperation.objects.create(
            operation_type="C",
            operation_status="A",
            created_by=users.get(cpf=CPF_ADMIN),
            cnpj="90217758000179",
            name="Santa Casa de Porto Alegre",
            email="ouvidoria@santacasa.tche.br",
            phone="5132148000",
            address="Rua Professor Annes Dias, 295 - Centro Histórico, Porto Alegre - RS, 90020-090",
            state="RS",
            city="Porto Alegre",
            active=True,
            id=1001
        )
        client2.users.add(users.get(cpf=CPF_CLIENT_MANAGER))
        client2.users.add(users.get(cpf=CPF_ADMIN))
        client2.users.add(users.get(cpf=CPF_COMERCIAL))
        client2.users.add(users.get(cpf=CPF_EXTERNAL_PHYSICIST))

        client_empty = ClientOperation.objects.create(
            operation_type="C",
            operation_status="A",
            created_by=users.get(cpf=CPF_ADMIN),
            cnpj="57428412000144",
            name="Hospital Cristo Redentor",
            email="ouvidoria@ghc.br",
            phone="5133574100",
            address="Rua Domingos Rubbo, 20 - Cristo Redentor, Porto Alegre - RS, 91040-000",
            state="RS",
            city="Porto Alegre",
            active=True,
            id=1002
        )
        client_empty.users.add(users.get(cpf=CPF_CLIENT_MANAGER))

        # Random clients for automated testing
        for _ in range(num_clients + randint(0, 4)):
            client = ClientOperation.objects.create(
                operation_type="C",
                operation_status="A",
                created_by=choice(users.exclude(cpf=CPF_CLIENT_MANAGER)),
                cnpj=fake_cnpj(),
                name=fake.company(),
                email=fake.company_email(),
                phone=fake_phone_number(),
                address=fake.address(),
                state=choice(STATE_CHOICES)[0],
                city=fake.city(),
                active=True
            )
            client.users.add(choice(users.exclude(cpf=CPF_CLIENT_MANAGER)))
            client.users.add(users.get(cpf=CPF_ADMIN))

        default_clients = {
            "client1": {
                "cnpj": client1.cnpj,
                "name": client1.name,
                "email": client1.email,
                "phone": client1.phone,
                "address": client1.address,
                "state": client1.state,
                "city": client1.city,
                "active": client1.active,
                "id": client1.id
            },
            "client2": {
                "cnpj": client2.cnpj,
                "name": client2.name,
                "email": client2.email,
                "phone": client2.phone,
                "address": client2.address,
                "state": client2.state,
                "city": client2.city,
                "active": client2.active,
                "id": client2.id
            },
            "client_empty": {
                "cnpj": client_empty.cnpj,
                "name": client_empty.name,
                "email": client_empty.email,
                "phone": client_empty.phone,
                "address": client_empty.address,
                "state": client_empty.state,
                "city": client_empty.city,
                "active": client_empty.active,
                "id": client_empty.id
            }
        }
        return default_clients

    def populate_units(self, num_units_per_client=4):
        """Populates the Units model with example data."""
        all_users = UserAccount.objects.all()
        user_client = UserAccount.objects.get(cpf=CPF_CLIENT_MANAGER)
        user_unit_manager = UserAccount.objects.get(cpf=CPF_UNIT_MANAGER)
        clients = Client.objects.filter(users=user_client)

        # Default units for automated testing
        unit1 = UnitOperation.objects.create(
            operation_type="C",
            operation_status="A",
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
            id=1000
        )
        unit2 = UnitOperation.objects.create(
            operation_type="C",
            operation_status="A",
            created_by=all_users.get(cpf=CPF_ADMIN),
            client=clients[0],
            name="Radiologia",
            cnpj=fake_cnpj(),
            email=fake.email(),
            phone=fake_phone_number(),
            address=fake.address(),
            state=clients[1].state,
            city=clients[1].city,
            id=1001
        )
        unit3 = UnitOperation.objects.create(
            operation_type="C",
            operation_status="A",
            created_by=all_users.get(cpf=CPF_ADMIN),
            client=clients[0],
            name="Hemodinâmica",
            cnpj=fake_cnpj(),
            email=fake.email(),
            phone=fake_phone_number(),
            address=fake.address(),
            state=clients[1].state,
            city=clients[1].city,
            id=1002
        )
        unit4 = UnitOperation.objects.create(
            operation_type="C",
            operation_status="A",
            created_by=all_users.get(cpf=CPF_ADMIN),
            client=clients[1],
            name="Santa Rita",
            cnpj=fake_cnpj(),
            email=fake.email(),
            phone=fake_phone_number(),
            address=fake.address(),
            state=clients[1].state,
            city=clients[1].city,
            id=1003
        )

        default_units = {
            "unit1": {
                "user": unit1.user.id,
                "client": unit1.client.id,
                "name": unit1.name,
                "cnpj": unit1.cnpj,
                "email": unit1.email,
                "phone": unit1.phone,
                "address": unit1.address,
                "state": unit1.state,
                "city": unit1.city,
                "id": unit1.id
            },
            "unit2": {
                "user": None,
                "client": unit2.client.id,
                "name": unit2.name,
                "cnpj": unit2.cnpj,
                "email": unit2.email,
                "phone": unit2.phone,
                "address": unit2.address,
                "state": unit2.state,
                "city": unit2.city,
                "id": unit2.id
            },
            "unit3": {
                "user": None,
                "client": unit3.client.id,
                "name": unit3.name,
                "cnpj": unit3.cnpj,
                "email": unit3.email,
                "phone": unit3.phone,
                "address": unit3.address,
                "state": unit3.state,
                "city": unit3.city,
                "id": unit3.id
            },
            "unit4": {
                "user": None,
                "client": unit4.client.id,
                "name": unit4.name,
                "cnpj": unit4.cnpj,
                "email": unit4.email,
                "phone": unit4.phone,
                "address": unit4.address,
                "state": unit4.state,
                "city": unit4.city,
                "id": unit4.id
            }
        }

        # Random units for automated testing
        for client in Client.objects.all().exclude(users=user_client):
            for _ in range(num_units_per_client + randint(0, 4)):
                UnitOperation.objects.create(
                    operation_type="C",
                    operation_status="A",
                    created_by=all_users.get(cpf=CPF_ADMIN),
                    user=choice(all_users),
                    client=client,
                    name=fake.company_suffix() + " " + fake.company(),
                    cnpj=fake_cnpj(),
                    email=fake.email(),
                    phone=fake_phone_number(),
                    address=fake.address(),
                    state=client.state,
                    city=client.city
                )

        return default_units

    def populate_equipaments(self, num_equipments_per_units=3):
        """Populates the Equipment model with example data."""
        modalities = ['Tomógrafo', 'Raio-X',
                      'Ultrassom', 'Ressonância Magnética']
        manufactures = ['GE', 'Philips', 'Siemens', 'Toshiba']

        user_client = UserAccount.objects.get(cpf=CPF_CLIENT_MANAGER)

        # Default equipments for automated testing
        equipment1 = EquipmentOperation.objects.create(
            operation_type="C",
            operation_status="A",
            created_by=user_client,
            unit=Unit.objects.filter(client__users=user_client)[0],
            modality=choice(modalities),
            manufacturer=choice(manufactures),
            model=fake.word().upper() + "-" + str(randint(100, 999)),
            series_number=fake.bothify(text='????-######'),
            anvisa_registry=fake.bothify(text='?????????????'),
            equipment_photo='./petct.jpg'
        )
        equipment2 = EquipmentOperation.objects.create(
            operation_type="C",
            operation_status="A",
            created_by=user_client,
            unit=Unit.objects.filter(client__users=user_client)[0],
            modality=choice(modalities),
            manufacturer=choice(manufactures),
            model=fake.word().upper() + "-" + str(randint(100, 999)),
            series_number=fake.bothify(text='????-######'),
            anvisa_registry=fake.bothify(text='?????????????'),
            equipment_photo='./petct.jpg'
        )

        equipments = {
            "equipment1": {
                "unit": equipment1.unit.id,
                "modality": equipment1.modality,
                "manufacturer": equipment1.manufacturer,
                "model": equipment1.model,
                "series_number": equipment1.series_number,
                "anvisa_registry": equipment1.anvisa_registry,
                "id": equipment1.id
            },
            "equipment2": {
                "unit": equipment2.unit.id,
                "modality": equipment2.modality,
                "manufacturer": equipment2.manufacturer,
                "model": equipment2.model,
                "series_number": equipment2.series_number,
                "anvisa_registry": equipment2.anvisa_registry,
                "id": equipment2.id
            }
        }

        # Random equipments for automated testing
        for units in Unit.objects.all().exclude(client__users=user_client):
            for _ in range(num_equipments_per_units + randint(0, 4)):
                EquipmentOperation.objects.create(
                    operation_type="C",
                    operation_status="A",
                    created_by=user_client,
                    unit=units,
                    modality=choice(modalities),
                    manufacturer=choice(manufactures),
                    model=fake.word().upper() + "-" + str(randint(100, 999)),
                    series_number=fake.bothify(text='????-######'),
                    anvisa_registry=fake.bothify(text='?????????????'),
                    equipment_photo='./petct.jpg'
                )

        return equipments

    def populate_proposals(self, num_proposals=150):
        """Populates the Proposal model with example data."""
        contract_types = ['A', 'M']
        status_choices = ['A', 'R', 'P']
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
            value=fake.pydecimal(
                left_digits=5, right_digits=2, positive=True),
            contract_type=choice(contract_types),
            status="R"
        )

        Proposal.objects.create(
            cnpj=APPROVED_PROPOSAL_CNPJ,
            city=fake.city(),
            state=choice(STATE_CHOICES)[0],
            contact_name=fake.name(),
            contact_phone=fake_phone_number(),
            email=fake.email(),
            date=fake.date(),
            value=fake.pydecimal(
                left_digits=5, right_digits=2, positive=True),
            contract_type=choice(contract_types),
            status="A"
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
                contract_type=choice(contract_types),
                status="A"
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
                contract_type=choice(contract_types),
                status=choice(status_choices)
            )

        return approved_cnpjs

    def create_json_fixture(self, approved_cnpjs, users, default_clients, default_units, default_equipments):
        fixture_proposals = {
            "approved_cnpjs": approved_cnpjs,
            "rejected_cnpj": REJECTED_PROPOSAL_CNPJ
        }
        fixture_users = users
        fixture_registered_client = {
            "registered_cnpj": REGISTERED_CNPJ
        }
        fixture_default_clients = default_clients
        fixture_default_units = default_units
        fixture_default_equipments = default_equipments

        # Construct the correct path for the fixture files
        fixture_path_proposal = create_fixture_path("proposals.json")
        fixture_path_users = create_fixture_path("users.json")
        fixture_registered_client_path = create_fixture_path(
            "registered-client.json")
        fixture_default_clients_path = create_fixture_path(
            "default-clients.json")
        fixture_default_units_path = create_fixture_path(
            "default-units.json")
        fixture_default_equipments_path = create_fixture_path(
            "default-equipments.json")

        # Ensure the directory exists
        os.makedirs(os.path.dirname(FIXTURE_PATH), exist_ok=True)

        write_json_file(data=fixture_proposals,
                        file_path=fixture_path_proposal)
        write_json_file(data=fixture_users, file_path=fixture_path_users)
        write_json_file(data=fixture_registered_client,
                        file_path=fixture_registered_client_path)
        write_json_file(data=fixture_default_clients,
                        file_path=fixture_default_clients_path)
        write_json_file(data=fixture_default_units,
                        file_path=fixture_default_units_path)
        write_json_file(data=fixture_default_equipments,
                        file_path=fixture_default_equipments_path)

        self.stdout.write(self.style.SUCCESS(
            f'Created {fixture_path_proposal}'))

        self.stdout.write(self.style.SUCCESS(
            f'Created {fixture_path_users}'))

        self.stdout.write(self.style.SUCCESS(
            f'Created {fixture_registered_client_path}'))

        self.stdout.write(self.style.SUCCESS(
            f'Created {fixture_default_clients_path}'))

        self.stdout.write(self.style.SUCCESS(
            f'Created {fixture_default_units_path}'))

        self.stdout.write(self.style.SUCCESS(
            f'Created {fixture_default_equipments_path}'))
