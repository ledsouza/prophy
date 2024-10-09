from django.test import TestCase
from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import FieldDoesNotExist
from django.utils.translation import gettext as _

from gestao_clientes.models import Cliente, Unidade, Equipamento, Proposta
from datetime import date

UserAccount = get_user_model()


class ModelFieldsTestCase(TestCase):
    def assert_field_type(self, model, field_name, expected_type):
        try:
            field = model._meta.get_field(field_name)
            self.assertIsInstance(field, expected_type)
        except FieldDoesNotExist:
            self.fail(f"Field {field_name} does not exist on {model.__name__}")

    def assert_field_attribute(self, model, field_name, attribute, expected_value):
        try:
            field = model._meta.get_field(field_name)
            self.assertEqual(getattr(field, attribute), expected_value)
        except FieldDoesNotExist:
            self.fail(f"Field {field_name} does not exist on {model.__name__}")


class ClienteModelTests(ModelFieldsTestCase):
    def setUp(self):
        self.user = UserAccount.objects.create_user(
            cpf='12345678901', email='test@example.com', password='testpass123', name='Test User')
        self.cliente = Cliente.objects.create(
            cnpj='12345678901234',
            nome_instituicao='Test Institution',
            nome_contato='John Doe',
            email_contato='john@example.com',
            email_instituicao='institution@example.com',
            telefone_instituicao='1234567890',
            endereco_instituicao='123 Test St',
            estado_instituicao='SP',
            cidade_instituicao='São Paulo',
        )

    def test_cliente_creation(self):
        self.assertIsInstance(self.cliente, Cliente)
        self.assertEqual(str(self.cliente), 'Test Institution')

    def test_cliente_users_relation(self):
        self.cliente.users.add(self.user)
        self.assertIn(self.user, self.cliente.users.all())

    def test_cliente_fields(self):
        fields = {
            'users': (models.ManyToManyField, {'_related_name': 'clientes', 'blank': True}),
            'cnpj': (models.CharField, {'max_length': 14, 'unique': True}),
            'nome_instituicao': (models.CharField, {'max_length': 50}),
            'nome_contato': (models.CharField, {'max_length': 50}),
            'email_contato': (models.EmailField, {}),
            'email_instituicao': (models.EmailField, {}),
            'telefone_instituicao': (models.CharField, {'max_length': 13}),
            'endereco_instituicao': (models.CharField, {'max_length': 100}),
            'estado_instituicao': (models.CharField, {'max_length': 2}),
            'cidade_instituicao': (models.CharField, {'max_length': 50}),
            'status': (models.CharField, {'max_length': 1, 'default': 'A'}),
        }

        for field_name, (field_type, attrs) in fields.items():
            self.assert_field_type(Cliente, field_name, field_type)
            for attr, value in attrs.items():
                self.assert_field_attribute(Cliente, field_name, attr, value)


class UnidadeModelTests(ModelFieldsTestCase):
    def setUp(self):
        self.cliente = Cliente.objects.create(
            cnpj='12345678901234',
            nome_instituicao='Test Institution',
            nome_contato='John Doe',
            email_contato='john@example.com',
            email_instituicao='institution@example.com',
            telefone_instituicao='1234567890',
            endereco_instituicao='123 Test St',
            estado_instituicao='SP',
            cidade_instituicao='São Paulo',
        )
        self.unidade = Unidade.objects.create(
            cliente=self.cliente,
            nome='Test Unit',
            cnpj='12345678901235',
            nome_contato='Jane Doe',
            email='jane@example.com',
            telefone='9876543210',
            endereco='456 Test Ave',
            estado='RJ',
            cidade='Rio de Janeiro',
        )

    def test_unidade_creation(self):
        self.assertIsInstance(self.unidade, Unidade)
        self.assertEqual(str(self.unidade), 'Test Unit - Test Institution')

    def test_unidade_cliente_relation(self):
        self.assertEqual(self.unidade.cliente, self.cliente)

    def test_unidade_fields(self):
        fields = {
            'user': (models.ForeignKey, {'_related_name': 'users', 'blank': True, 'null': True}),
            'cliente': (models.ForeignKey, {'_related_name': 'unidades', 'blank': True, 'null': True}),
            'nome': (models.CharField, {'max_length': 50}),
            'cnpj': (models.CharField, {'max_length': 14}),
            'nome_contato': (models.CharField, {'max_length': 50}),
            'email': (models.EmailField, {}),
            'telefone': (models.CharField, {'max_length': 13}),
            'endereco': (models.CharField, {'max_length': 100}),
            'estado': (models.CharField, {'max_length': 2, 'blank': True}),
            'cidade': (models.CharField, {'max_length': 50, 'blank': True}),
        }

        for field_name, (field_type, attrs) in fields.items():
            self.assert_field_type(Unidade, field_name, field_type)
            for attr, value in attrs.items():
                self.assert_field_attribute(Unidade, field_name, attr, value)


class EquipamentoModelTests(ModelFieldsTestCase):
    def setUp(self):
        self.cliente = Cliente.objects.create(
            cnpj='12345678901234',
            nome_instituicao='Test Institution',
            nome_contato='John Doe',
            email_contato='john@example.com',
            email_instituicao='institution@example.com',
            telefone_instituicao='1234567890',
            endereco_instituicao='123 Test St',
            estado_instituicao='SP',
            cidade_instituicao='São Paulo',
        )
        self.unidade = Unidade.objects.create(
            cliente=self.cliente,
            nome='Test Unit',
            cnpj='12345678901235',
            nome_contato='Jane Doe',
            email='jane@example.com',
            telefone='9876543210',
            endereco='456 Test Ave',
            estado='RJ',
            cidade='Rio de Janeiro',
        )
        self.equipamento = Equipamento.objects.create(
            unidade=self.unidade,
            modalidade='Test Modality',
            fabricante='Test Manufacturer',
            modelo='Test Model',
            numero_serie='123456',
            registro_anvisa='ANVISA123',
            foto_equipamento='path/to/photo.jpg',
            responsavel_manutencao='John Smith',
            email_responsavel='john.smith@example.com',
            telefone_responsavel='1122334455',
        )

    def test_equipamento_creation(self):
        self.assertIsInstance(self.equipamento, Equipamento)
        self.assertEqual(str(self.equipamento),
                         'Test Manufacturer - Test Model (Test Unit)')

    def test_equipamento_unidade_relation(self):
        self.assertEqual(self.equipamento.unidade, self.unidade)

    def test_equipamento_cliente_method(self):
        self.assertEqual(self.equipamento.cliente(), self.cliente)

    def test_equipamento_fields(self):
        fields = {
            'unidade': (models.ForeignKey, {'_related_name': 'equipamentos', 'blank': True, 'null': True}),
            'modalidade': (models.CharField, {'max_length': 50}),
            'fabricante': (models.CharField, {'max_length': 30}),
            'modelo': (models.CharField, {'max_length': 30}),
            'numero_serie': (models.CharField, {'max_length': 30, 'blank': True, 'null': True}),
            'registro_anvisa': (models.CharField, {'max_length': 15, 'blank': True, 'null': True}),
            'foto_equipamento': (models.ImageField, {}),
            'foto_etiqueta': (models.ImageField, {'blank': True, 'null': True}),
            'responsavel_manutencao': (models.CharField, {'max_length': 50, 'blank': True, 'null': True}),
            'email_responsavel': (models.EmailField, {'blank': True, 'null': True}),
            'telefone_responsavel': (models.CharField, {'max_length': 13, 'blank': True, 'null': True}),
        }

        for field_name, (field_type, attrs) in fields.items():
            self.assert_field_type(Equipamento, field_name, field_type)
            for attr, value in attrs.items():
                self.assert_field_attribute(
                    Equipamento, field_name, attr, value)


class PropostaModelTests(ModelFieldsTestCase):
    def setUp(self):
        self.proposta = Proposta.objects.create(
            cnpj='12345678901234',
            cidade='Test City',
            estado='SP',
            nome='John Doe',
            telefone='1234567890',
            email='john@example.com',
            valor=1000.00,
            tipo_contrato='A',
        )

    def test_proposta_creation(self):
        self.assertIsInstance(self.proposta, Proposta)
        self.assertEqual(str(self.proposta),
                         'Proposta 12345678901234 - John Doe')

    def test_proposta_approved_client_method(self):
        self.assertFalse(self.proposta.approved_client())
        self.proposta.status = 'A'
        self.proposta.save()
        self.assertTrue(self.proposta.approved_client())

    def test_proposta_proposal_month_method(self):
        today = date.today()
        self.assertEqual(self.proposta.proposal_month(),
                         _(today.strftime('%B')))

    def test_proposta_fields(self):
        fields = {
            'cnpj': (models.CharField, {'max_length': 14}),
            'cidade': (models.CharField, {'max_length': 50}),
            'estado': (models.CharField, {'max_length': 2}),
            'nome': (models.CharField, {'max_length': 50}),
            'telefone': (models.CharField, {'max_length': 13}),
            'email': (models.EmailField, {}),
            'data_proposta': (models.DateField, {}),
            'valor': (models.DecimalField, {'max_digits': 10, 'decimal_places': 2}),
            'tipo_contrato': (models.CharField, {'max_length': 1}),
            'status': (models.CharField, {'max_length': 1, 'default': 'P'}),
        }

        for field_name, (field_type, attrs) in fields.items():
            self.assert_field_type(Proposta, field_name, field_type)
            for attr, value in attrs.items():
                self.assert_field_attribute(Proposta, field_name, attr, value)
