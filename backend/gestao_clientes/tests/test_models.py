from django.test import TestCase
from django.db import models
from django.contrib.auth import get_user_model
from django.core.exceptions import FieldDoesNotExist
from django.utils.translation import gettext as _

from gestao_clientes.models import Client, Unit, Equipment, Proposal
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


class ClientModelTests(ModelFieldsTestCase):
    def setUp(self):
        self.user = UserAccount.objects.create_user(
            cpf='12345678901', email='test@example.com', password='testpass123', name='Test User')
        self.client = Client.objects.create(
            cnpj='12345678901234',
            name='Test Institution',
            name_contato='John Doe',
            email_contato='john@example.com',
            email='institution@example.com',
            phone='1234567890',
            address='123 Test St',
            state='SP',
            city='São Paulo',
        )

    def test_client_creation(self):
        self.assertIsInstance(self.client, Client)
        self.assertEqual(str(self.client), 'Test Institution')

    def test_client_users_relation(self):
        self.client.users.add(self.user)
        self.assertIn(self.user, self.client.users.all())

    def test_client_fields(self):
        fields = {
            'users': (models.ManyToManyField, {'_related_name': 'clients', 'blank': True}),
            'cnpj': (models.CharField, {'max_length': 14, 'unique': True}),
            'name': (models.CharField, {'max_length': 50}),
            'email': (models.EmailField, {}),
            'phone': (models.CharField, {'max_length': 13}),
            'address': (models.CharField, {'max_length': 100}),
            'state': (models.CharField, {'max_length': 2}),
            'city': (models.CharField, {'max_length': 50}),
            'status': (models.CharField, {'max_length': 1, 'default': 'A'}),
        }

        for field_name, (field_type, attrs) in fields.items():
            self.assert_field_type(Client, field_name, field_type)
            for attr, value in attrs.items():
                self.assert_field_attribute(Client, field_name, attr, value)


class UnitModelTests(ModelFieldsTestCase):
    def setUp(self):
        self.client = Client.objects.create(
            cnpj='12345678901234',
            name='Test Institution',
            email='institution@example.com',
            phone='1234567890',
            address='123 Test St',
            state='SP',
            city='São Paulo',
        )
        self.unit = Unit.objects.create(
            client=self.client,
            name='Test Unit',
            cnpj='12345678901235',
            email='jane@example.com',
            phone='9876543210',
            address='456 Test Ave',
            state='RJ',
            city='Rio de Janeiro',
        )

    def test_units_creation(self):
        self.assertIsInstance(self.unit, Unit)
        self.assertEqual(str(self.unit), 'Test Unit - Test Institution')

    def test_units_client_relation(self):
        self.assertEqual(self.unit.client, self.client)

    def test_units_fields(self):
        fields = {
            'user': (models.ForeignKey, {'_related_name': 'users', 'blank': True, 'null': True}),
            'client': (models.ForeignKey, {'_related_name': 'units', 'blank': True, 'null': True}),
            'name': (models.CharField, {'max_length': 50}),
            'cnpj': (models.CharField, {'max_length': 14}),
            'email': (models.EmailField, {}),
            'phone': (models.CharField, {'max_length': 13}),
            'address': (models.CharField, {'max_length': 100}),
            'state': (models.CharField, {'max_length': 2, 'blank': True}),
            'city': (models.CharField, {'max_length': 50, 'blank': True}),
        }

        for field_name, (field_type, attrs) in fields.items():
            self.assert_field_type(Unit, field_name, field_type)
            for attr, value in attrs.items():
                self.assert_field_attribute(Unit, field_name, attr, value)


class EquipmentModelTests(ModelFieldsTestCase):
    def setUp(self):
        self.client = Client.objects.create(
            cnpj='12345678901234',
            name='Test Institution',
            email='institution@example.com',
            phone='1234567890',
            address='123 Test St',
            state='SP',
            city='São Paulo',
        )
        self.unit = Unit.objects.create(
            client=self.client,
            name='Test Unit',
            cnpj='12345678901235',
            email='jane@example.com',
            phone='9876543210',
            address='456 Test Ave',
            state='RJ',
            city='Rio de Janeiro',
        )
        self.equipment = Equipment.objects.create(
            unit=self.unit,
            modality='Test Modality',
            manufacter='Test Manufacturer',
            model='Test Model',
            series_number='123456',
            anvisa_registry='ANVISA123',
            equipment_photo='path/to/photo.jpg',
            maintenance_responsable='John Smith',
            email_maintenance_responsable='john.smith@example.com',
            phone_maintenance_responsable='1122334455',
        )

    def test_equipment_creation(self):
        self.assertIsInstance(self.equipment, Equipment)
        self.assertEqual(str(self.equipment),
                         'Test Manufacturer - Test Model (Test Unit)')

    def test_equipment_unit_relation(self):
        self.assertEqual(self.equipment.unit, self.unit)

    def test_equipment_client_method(self):
        self.assertEqual(self.equipment.client(), self.client)

    def test_equipment_fields(self):
        fields = {
            'unit': (models.ForeignKey, {'_related_name': 'equipments', 'blank': True, 'null': True}),
            'modality': (models.CharField, {'max_length': 50}),
            'manufacter': (models.CharField, {'max_length': 30}),
            'model': (models.CharField, {'max_length': 30}),
            'series_number': (models.CharField, {'max_length': 30, 'blank': True, 'null': True}),
            'anvisa_registry': (models.CharField, {'max_length': 15, 'blank': True, 'null': True}),
            'equipment_photo': (models.ImageField, {}),
            'label_photo': (models.ImageField, {'blank': True, 'null': True}),
            'maintenance_responsable': (models.CharField, {'max_length': 50, 'blank': True, 'null': True}),
            'email_maintenance_responsable': (models.EmailField, {'blank': True, 'null': True}),
            'phone_maintenance_responsable': (models.CharField, {'max_length': 13, 'blank': True, 'null': True}),
        }

        for field_name, (field_type, attrs) in fields.items():
            self.assert_field_type(Equipment, field_name, field_type)
            for attr, value in attrs.items():
                self.assert_field_attribute(
                    Equipment, field_name, attr, value)


class ProposalModelTests(ModelFieldsTestCase):
    def setUp(self):
        self.proposal = Proposal.objects.create(
            cnpj='12345678901234',
            city='Test City',
            state='SP',
            name='John Doe',
            phone='1234567890',
            email='john@example.com',
            valor=1000.00,
            contract_type='A',
        )

    def test_proposal_creation(self):
        self.assertIsInstance(self.proposal, Proposal)
        self.assertEqual(str(self.proposal),
                         'Proposal 12345678901234 - John Doe')

    def test_proposal_approved_client_method(self):
        self.assertFalse(self.proposal.approved_client())
        self.proposal.status = 'A'
        self.proposal.save()
        self.assertTrue(self.proposal.approved_client())

    def test_proposal_proposal_month_method(self):
        today = date.today()
        self.assertEqual(self.proposal.proposal_month(),
                         _(today.strftime('%B')))

    def test_proposal_fields(self):
        fields = {
            'cnpj': (models.CharField, {'max_length': 14}),
            'city': (models.CharField, {'max_length': 50}),
            'state': (models.CharField, {'max_length': 2}),
            'name': (models.CharField, {'max_length': 50}),
            'phone': (models.CharField, {'max_length': 13}),
            'email': (models.EmailField, {}),
            'date': (models.DateField, {}),
            'valor': (models.DecimalField, {'max_digits': 10, 'decimal_places': 2}),
            'contract_type': (models.CharField, {'max_length': 1}),
            'status': (models.CharField, {'max_length': 1, 'default': 'P'}),
        }

        for field_name, (field_type, attrs) in fields.items():
            self.assert_field_type(Proposal, field_name, field_type)
            for attr, value in attrs.items():
                self.assert_field_attribute(Proposal, field_name, attr, value)
