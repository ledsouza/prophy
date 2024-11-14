from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission
from django.contrib.auth.models import Group
from django.conf import settings

from clients_management.models import Client, Unit, Equipment, Proposal
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
CPF_GERENTE_CLIENTE = "82484874073"
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
        admin_user, client_user = self.populate_users()
        default_clients = self.populate_clients()
        default_units = self.populate_units()
        self.populate_equipaments()
        approved_cnpjs = self.populate_proposals()
        self.create_json_fixture(
            approved_cnpjs, admin_user, client_user, default_clients, default_units)
        self.stdout.write(self.style.SUCCESS(
            'Database populated and fixture created successfully!'))

    def create_groups(self):
        permissions = Permission.objects.all()

        for role in settings.ROLES:
            group, _ = Group.objects.get_or_create(name=role)

            if role == "Gerente Prophy":
                group.permissions.set(permissions)

            if role == "Gerente Geral do Client":
                group.permissions.set([permissions.get(name__contains="view client"), permissions.get(
                    name__contains="view unit"), permissions.get(name__contains="view equipment")])

    def populate_users(self, num_users=20):
        """Populates the User model with example data."""

        # Default users for automated testing
        admin_user = UserAccount.objects.create_superuser(
            cpf=CPF_ADMIN,
            email="leandro.souza.159@gmail.com",
            phone=fake_phone_number(),
            password=PASSWORD,
            name="Alexandre Ferret"
        )

        client_user = UserAccount.objects.create_user(
            cpf=CPF_GERENTE_CLIENTE,
            email=fake.email(),
            phone=fake_phone_number(),
            password=PASSWORD,
            name="Cliente",
            role="Gerente Geral do Cliente",
            id=999
        )

        # Random users for automated testing
        for _ in range(num_users):
            UserAccount.objects.create_user(
                cpf=fake_cpf(),
                email=fake.email(),
                phone=fake_phone_number(),
                password=PASSWORD,
                name=fake.name()
            )

        return admin_user, client_user

    def populate_clients(self, num_clients=20):
        """Populates the Client model with example data."""
        users = UserAccount.objects.all()

        # Default clients for automated testing
        client1 = Client.objects.create(
            cnpj=REGISTERED_CNPJ,
            name="Hospital de Clínicas de Porto Alegre",
            email="secretariageral@hcpa.edu.br",
            phone="5133596100",
            address="Rua Ramiro Barcelos, 2350 Bloco A, Av. Protásio Alves, 211 - Bloco B e C - Santa Cecília, Porto Alegre - RS, 90035-903",
            state="RS",
            city="Porto Alegre",
            status=choice(['A', 'I']),
            id=1000
        )
        client1.users.add(users.get(cpf=CPF_GERENTE_CLIENTE))
        client1.users.add(users.get(cpf=CPF_ADMIN))

        client2 = Client.objects.create(
            cnpj="90217758000179",
            name="Santa Casa de Porto Alegre",
            email="ouvidoria@santacasa.tche.br",
            phone="5132148000",
            address="Rua Professor Annes Dias, 295 - Centro Histórico, Porto Alegre - RS, 90020-090",
            state="RS",
            city="Porto Alegre",
            status=choice(['A', 'I']),
            id=1001
        )
        client2.users.add(users.get(cpf=CPF_GERENTE_CLIENTE))
        client2.users.add(users.get(cpf=CPF_ADMIN))

        client_empty = Client.objects.create(
            cnpj="57428412000144",
            name="Hospital Cristo Redentor",
            email="ouvidoria@ghc.br",
            phone="5133574100",
            address="Rua Domingos Rubbo, 20 - Cristo Redentor, Porto Alegre - RS, 91040-000",
            state="RS",
            city="Porto Alegre",
            status=choice(['A', 'I']),
            id=1002
        )
        client_empty.users.add(users.get(cpf=CPF_GERENTE_CLIENTE))

        # Random clients for automated testing
        for _ in range(num_clients + randint(0, 4)):
            client = Client.objects.create(
                cnpj=fake_cnpj(),
                name=fake.company(),
                email=fake.company_email(),
                phone=fake_phone_number(),
                address=fake.address(),
                state=choice(STATE_CHOICES)[0],
                city=fake.city(),
                status=choice(['A', 'I'])
            )
            client.users.add(choice(users.exclude(cpf=CPF_GERENTE_CLIENTE)))
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
                "status": client1.status,
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
                "status": client2.status,
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
                "status": client_empty.status,
                "id": client_empty.id
            }
        }
        return default_clients

    def populate_units(self, num_units_per_client=4):
        """Populates the Units model with example data."""
        all_users = UserAccount.objects.all()
        user_client = UserAccount.objects.get(cpf=CPF_GERENTE_CLIENTE)
        clients = Client.objects.filter(users=user_client)

        # Default units for automated testing
        unit1 = Unit.objects.create(
            user=user_client,
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
        unit2 = Unit.objects.create(
            user=user_client,
            client=clients[1],
            name="Santa Rita",
            cnpj=fake_cnpj(),
            email=fake.email(),
            phone=fake_phone_number(),
            address=fake.address(),
            state=clients[1].state,
            city=clients[1].city,
            id=1001
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
                "user": unit2.user.id,
                "client": unit2.client.id,
                "name": unit2.name,
                "cnpj": unit2.cnpj,
                "email": unit2.email,
                "phone": unit2.phone,
                "address": unit2.address,
                "state": unit2.state,
                "city": unit2.city,
                "id": unit2.id
            }
        }

        # Random units for automated testing
        for client in Client.objects.all().exclude(users=user_client):
            for _ in range(num_units_per_client + randint(0, 4)):
                Unit.objects.create(
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

        user_client = UserAccount.objects.get(cpf=CPF_GERENTE_CLIENTE)

        # Default equipments for automated testing
        Equipment.objects.create(
            unit=Unit.objects.filter(client__users=user_client)[0],
            modality=choice(modalities),
            manufacturer=choice(manufactures),
            model=fake.word().upper() + "-" + str(randint(100, 999)),
            series_number=fake.bothify(text='????-######'),
            anvisa_registry=fake.bothify(text='?????????????'),
            equipment_photo='./petct.jpg'
        )
        Equipment.objects.create(
            unit=Unit.objects.filter(client__users=user_client)[1],
            modality=choice(modalities),
            manufacturer=choice(manufactures),
            model=fake.word().upper() + "-" + str(randint(100, 999)),
            series_number=fake.bothify(text='????-######'),
            anvisa_registry=fake.bothify(text='?????????????'),
            equipment_photo='./petct.jpg'
        )

        # Random equipments for automated testing
        for units in Unit.objects.all().exclude(client__users=user_client):
            for _ in range(num_equipments_per_units + randint(0, 4)):
                Equipment.objects.create(
                    unit=units,
                    modality=choice(modalities),
                    manufacturer=choice(manufactures),
                    model=fake.word().upper() + "-" + str(randint(100, 999)),
                    series_number=fake.bothify(text='????-######'),
                    anvisa_registry=fake.bothify(text='?????????????'),
                    equipment_photo='./petct.jpg'
                )

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

    def create_json_fixture(self, approved_cnpjs, admin_user, client_user, default_clients, default_units):
        fixture_proposals = {
            "approved_cnpjs": approved_cnpjs,
            "rejected_cnpj": REJECTED_PROPOSAL_CNPJ
        }
        fixture_users = {"admin_user": {
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
        }}
        fixture_registered_client = {
            "registered_cnpj": REGISTERED_CNPJ
        }
        fixture_default_clients = default_clients
        fixture_default_units = default_units

        # Construct the correct path for the fixture files
        fixture_path_proposal = create_fixture_path("proposals.json")
        fixture_path_users = create_fixture_path("users.json")
        fixture_registered_client_path = create_fixture_path(
            "registered-client.json")
        fixture_default_clients_path = create_fixture_path(
            "default-clients.json")
        fixture_default_units_path = create_fixture_path(
            "default-units.json")

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
