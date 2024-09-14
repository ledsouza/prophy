from django.core.management.base import BaseCommand
from gestao_clientes.models import Cliente, Unidade, Equipamento, Proposta
from django.contrib.auth.models import User

import json
import os
from faker import Faker
from random import choice, randint
from localflavor.br.br_states import STATE_CHOICES

fake = Faker('pt_BR')


def fake_phone_number():
    return fake.phone_number().replace(
        '(', '').replace(')', '').replace('-', '').replace(' ', '').replace("+", "")


def fake_cnpj():
    return fake.cnpj().replace(
        '.', '').replace('/', '').replace('-', '')


class Command(BaseCommand):
    help = "Populate the database with fake data."

    def handle(self, *args, **options):
        self.populate_users()
        self.populate_clientes()
        self.populate_unidades()
        self.populate_equipamentos()
        approved_cnpjs = self.populate_propostas()
        self.create_json_fixture(approved_cnpjs)
        self.stdout.write(self.style.SUCCESS(
            'Database populated and fixture created successfully!'))

    def populate_users(self, num_users=10):
        """Populates the User model with example data."""

        # Default user for automated testing
        User.objects.create_superuser(
            username="admin",
            email=fake.email(),
            password='password123'
        )

        for _ in range(num_users):
            User.objects.create_user(
                username=fake.user_name(),
                email=fake.email(),
                password='password123'
            )

    def populate_clientes(self, num_clientes=10):
        """Populates the Cliente model with example data."""
        users = User.objects.all()

        for _ in range(num_clientes):
            Cliente.objects.create(
                user=choice(users),
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

    def populate_unidades(self, num_unidades_per_cliente=2):
        """Populates the Unidade model with example data."""
        for cliente in Cliente.objects.all():
            for _ in range(num_unidades_per_cliente):
                Unidade.objects.create(
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
        for unidade in Unidade.objects.all():
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

    def populate_propostas(self, num_propostas=100):
        """Populates the Proposta model with example data."""
        tipos_contrato = ['A', 'M']
        status_choices = ['A', 'R', 'P']
        approved_cnpjs = []

        # Defaults Proposta for automated testing
        Proposta.objects.create(
            cnpj="26661570000116",
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

    def create_json_fixture(self, approved_cnpjs):
        fixture_data = {"approved_cnpjs": approved_cnpjs}

        # Construct the correct path for the fixture file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(
            os.path.join(current_dir, '..', '..', '..', '..'))
        fixture_path = os.path.join(
            project_root, 'frontend', 'cypress', 'fixtures', 'propostas-aprovadas.json')

        # Ensure the directory exists
        os.makedirs(os.path.dirname(fixture_path), exist_ok=True)

        with open(fixture_path, 'w') as json_file:
            json.dump(fixture_data, json_file, indent=2)

        self.stdout.write(self.style.SUCCESS(
            f'Created propostas-aprovadas.json with {len(approved_cnpjs)} CNPJs'))
