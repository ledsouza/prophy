import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from users.models import UserAccount

from materials.models import InstitutionalMaterial


@pytest.fixture
def pdf_file() -> SimpleUploadedFile:
    return SimpleUploadedFile(
        "test_material.pdf",
        b"file_content",
        content_type="application/pdf",
    )


@pytest.mark.django_db
def test_external_mp_cannot_create_public_material(
    api_client, external_physicist, pdf_file
):
    api_client.force_authenticate(user=external_physicist)

    data = {
        "title": "Test Public Material",
        "description": "Test description",
        "visibility": InstitutionalMaterial.Visibility.PUBLIC,
        "category": InstitutionalMaterial.PublicCategory.SIGNS,
        "file": pdf_file,
    }

    response = api_client.post("/api/materials/", data, format="multipart")

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_external_mp_cannot_create_internal_material(
    api_client, external_physicist, pdf_file
):
    api_client.force_authenticate(user=external_physicist)

    data = {
        "title": "Test Internal Material",
        "description": "Test description",
        "visibility": InstitutionalMaterial.Visibility.INTERNAL,
        "category": InstitutionalMaterial.InternalCategory.REPORT_TEMPLATES,
        "file": pdf_file,
    }

    response = api_client.post("/api/materials/", data, format="multipart")

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_internal_mp_can_create_public_material(
    api_client, internal_physicist, pdf_file
):
    api_client.force_authenticate(user=internal_physicist)

    data = {
        "title": "Test Public Material",
        "description": "Test description",
        "visibility": InstitutionalMaterial.Visibility.PUBLIC,
        "category": InstitutionalMaterial.PublicCategory.SIGNS,
        "file": pdf_file,
    }

    response = api_client.post("/api/materials/", data, format="multipart")

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["title"] == "Test Public Material"
    assert response.data["visibility"] == InstitutionalMaterial.Visibility.PUBLIC


@pytest.mark.django_db
def test_internal_mp_cannot_create_internal_material(
    api_client, internal_physicist, pdf_file
):
    api_client.force_authenticate(user=internal_physicist)

    data = {
        "title": "Test Internal Material",
        "description": "Test description",
        "visibility": InstitutionalMaterial.Visibility.INTERNAL,
        "category": InstitutionalMaterial.InternalCategory.REPORT_TEMPLATES,
        "file": pdf_file,
    }

    response = api_client.post("/api/materials/", data, format="multipart")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "public" in response.data["detail"].lower()


@pytest.mark.django_db
def test_prophy_manager_can_create_public_material(
    api_client, prophy_manager, pdf_file
):
    api_client.force_authenticate(user=prophy_manager)

    data = {
        "title": "Test Public Material",
        "description": "Test description",
        "visibility": InstitutionalMaterial.Visibility.PUBLIC,
        "category": InstitutionalMaterial.PublicCategory.SIGNS,
        "file": pdf_file,
    }

    response = api_client.post("/api/materials/", data, format="multipart")

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["title"] == "Test Public Material"


@pytest.mark.django_db
def test_prophy_manager_can_create_internal_material(
    api_client, prophy_manager, pdf_file
):
    api_client.force_authenticate(user=prophy_manager)

    data = {
        "title": "Test Internal Material",
        "description": "Test description",
        "visibility": InstitutionalMaterial.Visibility.INTERNAL,
        "category": InstitutionalMaterial.InternalCategory.REPORT_TEMPLATES,
        "file": pdf_file,
    }

    response = api_client.post("/api/materials/", data, format="multipart")

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["title"] == "Test Internal Material"
    assert response.data["visibility"] == InstitutionalMaterial.Visibility.INTERNAL


@pytest.mark.django_db
def test_client_manager_cannot_create_material(api_client, client_manager, pdf_file):
    api_client.force_authenticate(user=client_manager)

    data = {
        "title": "Test Material",
        "description": "Test description",
        "visibility": InstitutionalMaterial.Visibility.PUBLIC,
        "category": InstitutionalMaterial.PublicCategory.SIGNS,
        "file": pdf_file,
    }

    response = api_client.post("/api/materials/", data, format="multipart")

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_anonymous_cannot_create_material(api_client, pdf_file):
    data = {
        "title": "Test Material",
        "description": "Test description",
        "visibility": InstitutionalMaterial.Visibility.PUBLIC,
        "category": InstitutionalMaterial.PublicCategory.SIGNS,
        "file": pdf_file,
    }

    response = api_client.post("/api/materials/", data, format="multipart")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_internal_material_cannot_set_allowed_external_users(db):
    material = InstitutionalMaterial(
        title="Public",
        visibility=InstitutionalMaterial.Visibility.PUBLIC,
        category=InstitutionalMaterial.PublicCategory.SIGNS,
        file=SimpleUploadedFile(
            "test_material.pdf",
            b"file_content",
            content_type="application/pdf",
        ),
    )
    material.full_clean()
    material.save()

    external = UserAccount.objects.create_user(
        cpf="12345678999",
        email="external2@prophy.com",
        password="testpass123",
        name="External",
        phone="11999999999",
        role=UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST,
    )

    material.allowed_external_users.add(external)

    with pytest.raises(Exception):
        material.full_clean()
