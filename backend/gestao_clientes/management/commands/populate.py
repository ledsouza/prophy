from django.core.management.base import BaseCommand
from django.contrib.auth.models import Permission
from django.contrib.auth.models import Group
from django.conf import settings

from gestao_clientes.models import Cliente, Unidade, Equipamento, Proposta
from autenticacao.models import UserAccount

import json
import os
from faker import Faker
from random import choice, randint
from localflavor.br.br_states import STATE_CHOICES

fake = Faker("pt_BR")


def fake_phone_number():
    return fake.msisdn()[2:]


def fake_cnpj():
    return fake.cnpj().replace(
        ".", "").replace("/", "").replace("-", "")


def fake_cpf():
    return fake.cpf().replace(".", "").replace("-", "")


CPF_ADMIN = "03446254005"
CPF_GERENTE_CLIENTE = "82484874073"
PASSWORD = "passwordtest"

REJECTED_PROPOSTA_CNPJ = "09352176000187"
APPROVED_PROPOSTA_CNPJ = "26661570000116"

REGISTERED_CNPJ = "78187773000116"


class Command(BaseCommand):
    help = "Populate the database with fake data."

    def handle(self, *args, **options):
        self.create_groups()
        admin_user, client_user = self.populate_users()
        self.populate_clientes()
        self.populate_unidades()
        self.populate_equipamentos()
        approved_cnpjs = self.populate_propostas()
        self.create_json_fixture(approved_cnpjs, admin_user, client_user)
        self.stdout.write(self.style.SUCCESS(
            'Database populated and fixture created successfully!'))

    def create_groups(self):
        permissions = Permission.objects.all()

        for role in settings.ROLES:
            group, _ = Group.objects.get_or_create(name=role)

            if role == "Gerente Prophy":
                group.permissions.set(permissions)

            if role == "Gerente Geral do Cliente":
                group.permissions.set([permissions.get(name__contains="view cliente"), permissions.get(
                    name__contains="view unidade"), permissions.get(name__contains="view equipamento")])

    def populate_users(self, num_users=10):
        """Populates the User model with example data."""

        # Default users for automated testing
        admin_user = UserAccount.objects.create_superuser(
            cpf=CPF_ADMIN,
            email=fake.email(),
            password=PASSWORD,
            name="Admin"
        )

        client_user = UserAccount.objects.create_user(
            cpf=CPF_GERENTE_CLIENTE,
            email=fake.email(),
            password=PASSWORD,
            name="cliente",
            role="Gerente Geral do Cliente",
            id=999
        )

        # Random users for automated testing
        for _ in range(num_users):
            UserAccount.objects.create_user(
                cpf=fake_cpf(),
                email=fake.email(),
                password=PASSWORD,
                name=fake.name()
            )

        return admin_user, client_user

    def populate_clientes(self, num_clientes=10):
        """Populates the Cliente model with example data."""
        users = UserAccount.objects.all()

        # Default clients for automated testing
        cliente1 = Cliente.objects.create(
            cnpj=REGISTERED_CNPJ,
            nome_instituicao=fake.company(),
            nome_contato=fake.name(),
            email_contato=fake.email(),
            email_instituicao=fake.company_email(),
            telefone_instituicao=fake_phone_number(),
            endereco_instituicao=fake.address(),
            estado_instituicao=choice(STATE_CHOICES)[0],
            cidade_instituicao=fake.city(),
            status=choice(['A', 'I']),
            id=1000
        )
        cliente1.users.add(users.get(cpf=CPF_GERENTE_CLIENTE))

        cliente2 = Cliente.objects.create(
            cnpj="90217758000179",
            nome_instituicao=fake.company(),
            nome_contato=fake.name(),
            email_contato=fake.email(),
            email_instituicao=fake.company_email(),
            telefone_instituicao=fake_phone_number(),
            endereco_instituicao=fake.address(),
            estado_instituicao=choice(STATE_CHOICES)[0],
            cidade_instituicao=fake.city(),
            status=choice(['A', 'I']),
            id=1001
        )
        cliente2.users.add(users.get(cpf=CPF_GERENTE_CLIENTE))

        # Random clients for automated testing
        for _ in range(num_clientes):
            cliente = Cliente.objects.create(
                cnpj=fake_cnpj(),
                nome_instituicao=fake.company(),
                nome_contato=fake.name(),
                email_contato=fake.email(),
                email_instituicao=fake.company_email(),
                telefone_instituicao=fake_phone_number(),
                endereco_instituicao=fake.address(),
                estado_instituicao=choice(STATE_CHOICES)[0],
                cidade_instituicao=fake.city(),
                status=choice(['A', 'I'])
            )
            cliente.users.add(choice(users.exclude(cpf=CPF_GERENTE_CLIENTE)))
            cliente.users.add(users.get(cpf=CPF_ADMIN))

    def populate_unidades(self, num_unidades_per_cliente=2):
        """Populates the Unidade model with example data."""
        all_users = UserAccount.objects.all()
        user_client = UserAccount.objects.get(cpf=CPF_GERENTE_CLIENTE)
        clients = Cliente.objects.filter(users=user_client)

        # Default units for automated testing
        Unidade.objects.create(
            user=user_client,
            cliente=clients[0],
            nome=fake.company_suffix() + " " + fake.company(),
            cnpj=fake_cnpj(),
            nome_contato=fake.name(),
            email=fake.email(),
            telefone=fake_phone_number(),
            endereco=fake.address(),
            estado=clients[0].estado_instituicao,
            cidade=clients[0].cidade_instituicao,
            id=1000
        )
        Unidade.objects.create(
            user=user_client,
            cliente=clients[1],
            nome=fake.company_suffix() + " " + fake.company(),
            cnpj=fake_cnpj(),
            nome_contato=fake.name(),
            email=fake.email(),
            telefone=fake_phone_number(),
            endereco=fake.address(),
            estado=clients[1].estado_instituicao,
            cidade=clients[1].cidade_instituicao,
            id=1001
        )

        # Random units for automated testing
        for cliente in Cliente.objects.all().exclude(users=user_client):
            for _ in range(num_unidades_per_cliente):
                Unidade.objects.create(
                    user=choice(all_users),
                    cliente=cliente,
                    nome=fake.company_suffix() + " " + fake.company(),
                    cnpj=fake_cnpj(),
                    nome_contato=fake.name(),
                    email=fake.email(),
                    telefone=fake_phone_number(),
                    endereco=fake.address(),
                    estado=cliente.estado_instituicao,
                    cidade=cliente.cidade_instituicao
                )

    def populate_equipamentos(self, num_equipamentos_per_unidade=3):
        """Populates the Equipamento model with example data."""
        modalidades = ['Tomógrafo', 'Raio-X',
                       'Ultrassom', 'Ressonância Magnética']
        fabricantes = ['GE', 'Philips', 'Siemens', 'Toshiba']

        user_client = UserAccount.objects.get(cpf=CPF_GERENTE_CLIENTE)

        # Default equipments for automated testing
        Equipamento.objects.create(
            unidade=Unidade.objects.filter(cliente__users=user_client)[0],
            modalidade=choice(modalidades),
            fabricante=choice(fabricantes),
            modelo=fake.word().upper() + "-" + str(randint(100, 999)),
            numero_serie=fake.bothify(text='????-######'),
            registro_anvisa=fake.bothify(text='?????????????'),
            foto_equipamento='./petct.jpg'
        )
        Equipamento.objects.create(
            unidade=Unidade.objects.filter(cliente__users=user_client)[1],
            modalidade=choice(modalidades),
            fabricante=choice(fabricantes),
            modelo=fake.word().upper() + "-" + str(randint(100, 999)),
            numero_serie=fake.bothify(text='????-######'),
            registro_anvisa=fake.bothify(text='?????????????'),
            foto_equipamento='./petct.jpg'
        )

        # Random equipments for automated testing
        for unidade in Unidade.objects.all().exclude(cliente__users=user_client):
            for _ in range(num_equipamentos_per_unidade):
                Equipamento.objects.create(
                    unidade=unidade,
                    modalidade=choice(modalidades),
                    fabricante=choice(fabricantes),
                    modelo=fake.word().upper() + "-" + str(randint(100, 999)),
                    numero_serie=fake.bothify(text='????-######'),
                    registro_anvisa=fake.bothify(text='?????????????'),
                    foto_equipamento='./petct.jpg'
                )

    def populate_propostas(self, num_propostas=300):
        """Populates the Proposta model with example data."""
        tipos_contrato = ['A', 'M']
        status_choices = ['A', 'R', 'P']
        approved_cnpjs = []

        # Defaults Proposta for automated testing
        Proposta.objects.create(
            cnpj=REJECTED_PROPOSTA_CNPJ,
            cidade=fake.city(),
            estado=choice(STATE_CHOICES)[0],
            nome=fake.name(),
            telefone=fake_phone_number(),
            email=fake.email(),
            data_proposta=fake.date(),
            valor=fake.pydecimal(
                left_digits=5, right_digits=2, positive=True),
            tipo_contrato=choice(tipos_contrato),
            status="R"
        )

        Proposta.objects.create(
            cnpj=APPROVED_PROPOSTA_CNPJ,
            cidade=fake.city(),
            estado=choice(STATE_CHOICES)[0],
            nome=fake.name(),
            telefone=fake_phone_number(),
            email=fake.email(),
            data_proposta=fake.date(),
            valor=fake.pydecimal(
                left_digits=5, right_digits=2, positive=True),
            tipo_contrato=choice(tipos_contrato),
            status="A"
        )

        for _ in range(num_propostas):
            cnpj = fake_cnpj()

            Proposta.objects.create(
                cnpj=cnpj,
                cidade=fake.city(),
                estado=choice(STATE_CHOICES)[0],
                nome=fake.name(),
                telefone=fake_phone_number(),
                email=fake.email(),
                data_proposta=fake.date(),
                valor=fake.pydecimal(
                    left_digits=5, right_digits=2, positive=True),
                tipo_contrato=choice(tipos_contrato),
                status="A"
            )
            approved_cnpjs.append(cnpj)

            Proposta.objects.create(
                cnpj=fake_cnpj(),
                cidade=fake.city(),
                estado=choice(STATE_CHOICES)[0],
                nome=fake.name(),
                telefone=fake_phone_number(),
                email=fake.email(),
                data_proposta=fake.date(),
                valor=fake.pydecimal(
                    left_digits=5, right_digits=2, positive=True),
                tipo_contrato=choice(tipos_contrato),
                status=choice(status_choices)
            )

        return approved_cnpjs

    def create_json_fixture(self, approved_cnpjs, admin_user, client_user):
        fixture_proposta = {
            "approved_cnpjs": approved_cnpjs,
            "rejected_cnpj": REJECTED_PROPOSTA_CNPJ
        }
        fixture_users = {"admin_user": {
            "cpf": admin_user.cpf,
            "password": PASSWORD
        },
            "client_user": {
                "cpf": client_user.cpf,
                "password": PASSWORD
        }}
        fixture_cliente = {
            "registered_cnpj": REGISTERED_CNPJ
        }

        # Construct the correct path for the fixture files
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(
            os.path.join(current_dir, '..', '..', '..', '..'))
        fixture_path = os.path.join(
            project_root, 'frontend', 'cypress', 'fixtures')
        fixture_path_proposta = os.path.join(
            fixture_path, 'propostas.json')
        fixture_path_users = os.path.join(fixture_path, 'users.json')
        fixture_path_cliente = os.path.join(fixture_path, 'clientes.json')

        # Ensure the directory exists
        os.makedirs(os.path.dirname(fixture_path), exist_ok=True)

        with open(fixture_path_proposta, 'w') as json_file:
            json.dump(fixture_proposta, json_file, indent=2)

        with open(fixture_path_users, 'w') as json_file:
            json.dump(fixture_users, json_file, indent=2)

        with open(fixture_path_cliente, 'w') as json_file:
            json.dump(fixture_cliente, json_file, indent=2)

        self.stdout.write(self.style.SUCCESS(
            f'Created propostas.json'))

        self.stdout.write(self.style.SUCCESS(
            f'Created users.json'))

        self.stdout.write(self.style.SUCCESS(
            f'Created clientes.json'))
