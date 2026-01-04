import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status

from materials.models import InstitutionalMaterial


@pytest.fixture
def pdf_file() -> SimpleUploadedFile:
    return SimpleUploadedFile(
        "test_material.pdf",
        b"file_content",
        content_type="application/pdf",
    )


@pytest.mark.django_db
def test_public_material_rejects_internal_category(
    api_client, prophy_manager, pdf_file
):
    api_client.force_authenticate(user=prophy_manager)

    response = api_client.post(
        "/api/materials/",
        {
            "title": "Public",
            "description": "desc",
            "visibility": InstitutionalMaterial.Visibility.PUBLIC,
            "category": InstitutionalMaterial.InternalCategory.REPORT_TEMPLATES,
            "file": pdf_file,
        },
        format="multipart",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "category" in response.data


@pytest.mark.django_db
def test_internal_material_rejects_public_category(
    api_client,
    prophy_manager,
    pdf_file,
):
    api_client.force_authenticate(user=prophy_manager)

    response = api_client.post(
        "/api/materials/",
        {
            "title": "Internal",
            "description": "desc",
            "visibility": InstitutionalMaterial.Visibility.INTERNAL,
            "category": InstitutionalMaterial.PublicCategory.SIGNS,
            "file": pdf_file,
        },
        format="multipart",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "category" in response.data


@pytest.mark.django_db
def test_public_material_rejects_allowed_external_users(
    api_client,
    prophy_manager,
    external_physicist,
    pdf_file,
):
    api_client.force_authenticate(user=prophy_manager)

    response = api_client.post(
        "/api/materials/",
        {
            "title": "Public",
            "description": "desc",
            "visibility": InstitutionalMaterial.Visibility.PUBLIC,
            "category": InstitutionalMaterial.PublicCategory.SIGNS,
            "file": pdf_file,
            "allowed_external_users": [external_physicist.id],
        },
        format="multipart",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "allowed_external_users" in response.data
