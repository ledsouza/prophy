from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ValidationError
from datetime import date
from decimal import Decimal
import calendar
from django.utils.translation import gettext as _
from clients_management.models import Client, Unit, Modality, Equipment, Proposal
from users.models import UserAccount


class ClientTest(TestCase):
    def setUp(self):
        self.user = UserAccount.objects.create(
            cpf="12345678901",
            email="test@test.com",
            name="Test User",
            phone="11999999999",
            role=UserAccount.Role.CLIENT_GENERAL_MANAGER,
            password="testpass123"
        )
        self.client = Client.objects.create(
            cnpj="12345678901234",
            name="Test Client",
            email="client@test.com",
            phone="1234567890",
            address="Test Address",
            state="SP",
            city="Test City"
        )
        self.client.users.add(self.user)

    def test_client_creation(self):
        self.assertEqual(self.client.name, "Test Client")
        self.assertEqual(self.client.users.first(), self.user)
        self.assertFalse(self.client.active)

    def test_client_str(self):
        self.assertEqual(str(self.client), "Test Client")


class UnitTest(TestCase):
    def setUp(self):
        self.client = Client.objects.create(
            cnpj="12345678901234",
            name="Test Client",
            email="client@test.com",
            phone="1234567890",
            address="Test Address",
            state="SP",
            city="Test City"
        )
        self.unit = Unit.objects.create(
            client=self.client,
            name="Test Unit",
            cnpj="12345678901234",
            email="unit@test.com",
            phone="1234567890",
            address="Test Address",
            state="SP",
            city="Test City"
        )

    def test_unit_creation(self):
        self.assertEqual(self.unit.name, "Test Unit")
        self.assertEqual(self.unit.client, self.client)

    def test_unit_str(self):
        self.assertEqual(str(self.unit), "Test Unit")


class ModalityTest(TestCase):
    def setUp(self):
        self.modality = Modality.objects.create(
            name="Test Modality",
            accessory_type="D"
        )

    def test_modality_creation(self):
        self.assertEqual(self.modality.name, "Test Modality")
        self.assertEqual(self.modality.accessory_type, "D")


class EquipmentTest(TestCase):
    def setUp(self):
        self.client = Client.objects.create(
            cnpj="12345678901234",
            name="Test Client",
            email="client@test.com",
            phone="1234567890",
            address="Test Address",
            state="SP",
            city="Test City"
        )
        self.unit = Unit.objects.create(
            client=self.client,
            name="Test Unit",
            cnpj="12345678901234",
            email="unit@test.com",
            phone="1234567890",
            address="Test Address",
            state="SP",
            city="Test City"
        )
        self.modality = Modality.objects.create(
            name="Test Modality",
            accessory_type="D"
        )

        image = SimpleUploadedFile(
            "test.jpg", b"file_content", content_type="image/jpeg")

        self.equipment = Equipment.objects.create(
            unit=self.unit,
            modality=self.modality,
            manufacturer="Test Manufacturer",
            model="Test Model",
            series_number="123456",
            equipment_photo=image,
            label_photo=image
        )

    def test_equipment_creation(self):
        self.assertEqual(self.equipment.manufacturer, "Test Manufacturer")
        self.assertEqual(self.equipment.unit, self.unit)
        self.assertEqual(self.equipment.modality, self.modality)

    def test_equipment_str(self):
        self.assertEqual(str(self.equipment), "Test Manufacturer - Test Model")

    def test_client_method(self):
        self.assertEqual(self.equipment.client(), self.client)


class ProposalTest(TestCase):
    def setUp(self):
        self.proposal = Proposal.objects.create(
            cnpj="12345678901234",
            state="SP",
            city="Test City",
            contact_name="Test Contact",
            contact_phone="1234567890",
            email="contact@test.com",
            value=Decimal("1000.00"),
            contract_type="A",
            status="P"
        )

    def test_proposal_creation(self):
        self.assertEqual(self.proposal.contact_name, "Test Contact")
        self.assertEqual(self.proposal.status, "P")
        self.assertEqual(self.proposal.contract_type, "A")

    def test_approved_client(self):
        self.assertFalse(self.proposal.approved_client())
        self.proposal.status = "A"
        self.proposal.save()
        self.assertTrue(self.proposal.approved_client())

    def test_proposal_str(self):
        expected = f"Proposta {self.proposal.cnpj} - {self.proposal.contact_name}"
        self.assertEqual(str(self.proposal), expected)

    def test_proposal_month(self):
        self.assertEqual(self.proposal.proposal_month(), _(
            calendar.month_name[date.today().month]))
