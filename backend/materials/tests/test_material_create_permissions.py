from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status

from users.models import UserAccount
from materials.models import InstitutionalMaterial


class MaterialCreatePermissionsTest(TestCase):
    def setUp(self):
        self.client = APIClient()

        self.prophy_manager = UserAccount.objects.create_user(
            cpf="12345678901",
            email="manager@prophy.com",
            password="testpass123",
            name="Prophy Manager",
            phone="11999999991",
            role=UserAccount.Role.PROPHY_MANAGER,
        )

        self.internal_mp = UserAccount.objects.create_user(
            cpf="12345678902",
            email="internal@prophy.com",
            password="testpass123",
            name="Internal Medical Physicist",
            phone="11999999992",
            role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST,
        )

        self.external_mp = UserAccount.objects.create_user(
            cpf="12345678903",
            email="external@prophy.com",
            password="testpass123",
            name="External Medical Physicist",
            phone="11999999993",
            role=UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST,
        )

        self.client_manager = UserAccount.objects.create_user(
            cpf="12345678904",
            email="client@company.com",
            password="testpass123",
            name="Client Manager",
            phone="11999999994",
            role=UserAccount.Role.CLIENT_GENERAL_MANAGER,
        )

        self.test_file = SimpleUploadedFile(
            "test_material.pdf",
            b"file_content",
            content_type="application/pdf",
        )

    def test_external_mp_cannot_create_public_material(self):
        """
        External Medical Physicist should not be able to create
        public materials.
        """
        self.client.force_authenticate(user=self.external_mp)

        data = {
            "title": "Test Public Material",
            "description": "Test description",
            "visibility": InstitutionalMaterial.Visibility.PUBLIC,
            "category": InstitutionalMaterial.PublicCategory.SIGNS,
            "file": self.test_file,
        }

        response = self.client.post("/api/materials/", data, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_external_mp_cannot_create_internal_material(self):
        """
        External Medical Physicist should not be able to create
        internal materials.
        """
        self.client.force_authenticate(user=self.external_mp)

        data = {
            "title": "Test Internal Material",
            "description": "Test description",
            "visibility": InstitutionalMaterial.Visibility.INTERNAL,
            "category": InstitutionalMaterial.InternalCategory.REPORT_TEMPLATES,
            "file": self.test_file,
        }

        response = self.client.post("/api/materials/", data, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_internal_mp_can_create_public_material(self):
        """
        Internal Medical Physicist should be able to create
        public materials.
        """
        self.client.force_authenticate(user=self.internal_mp)

        data = {
            "title": "Test Public Material",
            "description": "Test description",
            "visibility": InstitutionalMaterial.Visibility.PUBLIC,
            "category": InstitutionalMaterial.PublicCategory.SIGNS,
            "file": self.test_file,
        }

        response = self.client.post("/api/materials/", data, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Test Public Material")
        self.assertEqual(
            response.data["visibility"],
            InstitutionalMaterial.Visibility.PUBLIC,
        )

    def test_internal_mp_cannot_create_internal_material(self):
        """
        Internal Medical Physicist should not be able to create
        internal materials.
        """
        self.client.force_authenticate(user=self.internal_mp)

        data = {
            "title": "Test Internal Material",
            "description": "Test description",
            "visibility": InstitutionalMaterial.Visibility.INTERNAL,
            "category": InstitutionalMaterial.InternalCategory.REPORT_TEMPLATES,
            "file": self.test_file,
        }

        response = self.client.post("/api/materials/", data, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("public", response.data["detail"].lower())

    def test_prophy_manager_can_create_public_material(self):
        """
        Prophy Manager should be able to create public materials.
        """
        self.client.force_authenticate(user=self.prophy_manager)

        data = {
            "title": "Test Public Material",
            "description": "Test description",
            "visibility": InstitutionalMaterial.Visibility.PUBLIC,
            "category": InstitutionalMaterial.PublicCategory.SIGNS,
            "file": self.test_file,
        }

        response = self.client.post("/api/materials/", data, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Test Public Material")

    def test_prophy_manager_can_create_internal_material(self):
        """
        Prophy Manager should be able to create internal materials.
        """
        self.client.force_authenticate(user=self.prophy_manager)

        data = {
            "title": "Test Internal Material",
            "description": "Test description",
            "visibility": InstitutionalMaterial.Visibility.INTERNAL,
            "category": InstitutionalMaterial.InternalCategory.REPORT_TEMPLATES,
            "file": self.test_file,
        }

        response = self.client.post("/api/materials/", data, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["title"], "Test Internal Material")
        self.assertEqual(
            response.data["visibility"],
            InstitutionalMaterial.Visibility.INTERNAL,
        )

    def test_client_manager_cannot_create_material(self):
        """
        Client Manager should not be able to create materials.
        """
        self.client.force_authenticate(user=self.client_manager)

        data = {
            "title": "Test Material",
            "description": "Test description",
            "visibility": InstitutionalMaterial.Visibility.PUBLIC,
            "category": InstitutionalMaterial.PublicCategory.SIGNS,
            "file": self.test_file,
        }

        response = self.client.post("/api/materials/", data, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
