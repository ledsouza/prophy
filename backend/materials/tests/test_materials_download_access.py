import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status

from materials.models import InstitutionalMaterial
from tests.factories import InstitutionalMaterialFactory, UserFactory
from users.models import UserAccount


@pytest.fixture
def pdf_file() -> SimpleUploadedFile:
    return SimpleUploadedFile(
        "test_material.pdf",
        b"file_content",
        content_type="application/pdf",
    )


@pytest.mark.django_db
@pytest.mark.parametrize(
    "role",
    [
        UserAccount.Role.PROPHY_MANAGER,
        UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST,
        UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST,
        UserAccount.Role.CLIENT_GENERAL_MANAGER,
        UserAccount.Role.UNIT_MANAGER,
    ],
)
def test_any_authenticated_user_can_download_public_material(api_client, role):
    user = UserFactory(role=role)
    api_client.force_authenticate(user=user)

    material = InstitutionalMaterialFactory(
        visibility=InstitutionalMaterial.Visibility.PUBLIC,
        category=InstitutionalMaterial.PublicCategory.SIGNS,
    )

    response = api_client.get(f"/api/materials/{material.id}/download/")

    assert response.status_code == status.HTTP_200_OK
    assert response["Content-Type"] == "application/octet-stream"
    assert "Content-Disposition" in response
    assert "material_" in response["Content-Disposition"]
    assert response["Content-Disposition"].endswith('.pdf"')


@pytest.mark.django_db
def test_prophy_manager_can_download_internal_material(api_client, prophy_manager):
    api_client.force_authenticate(user=prophy_manager)

    material = InstitutionalMaterialFactory(
        visibility=InstitutionalMaterial.Visibility.INTERNAL,
        category=InstitutionalMaterial.InternalCategory.REPORT_TEMPLATES,
    )

    response = api_client.get(f"/api/materials/{material.id}/download/")

    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_internal_physicist_can_download_internal_material(
    api_client,
    internal_physicist,
):
    api_client.force_authenticate(user=internal_physicist)

    material = InstitutionalMaterialFactory(
        visibility=InstitutionalMaterial.Visibility.INTERNAL,
        category=InstitutionalMaterial.InternalCategory.REPORT_TEMPLATES,
    )

    response = api_client.get(f"/api/materials/{material.id}/download/")

    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_external_physicist_can_download_allowed_internal_material(
    api_client,
    external_physicist,
):
    api_client.force_authenticate(user=external_physicist)

    material = InstitutionalMaterialFactory(
        visibility=InstitutionalMaterial.Visibility.INTERNAL,
        category=InstitutionalMaterial.InternalCategory.REPORT_TEMPLATES,
        allowed_external_users=[external_physicist],
    )

    response = api_client.get(f"/api/materials/{material.id}/download/")

    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_external_physicist_cannot_download_non_allowed_internal_material(
    api_client,
    external_physicist,
):
    api_client.force_authenticate(user=external_physicist)

    material = InstitutionalMaterialFactory(
        visibility=InstitutionalMaterial.Visibility.INTERNAL,
        category=InstitutionalMaterial.InternalCategory.REPORT_TEMPLATES,
    )

    response = api_client.get(f"/api/materials/{material.id}/download/")

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
@pytest.mark.parametrize(
    "role",
    [
        UserAccount.Role.CLIENT_GENERAL_MANAGER,
        UserAccount.Role.UNIT_MANAGER,
    ],
)
def test_client_and_unit_manager_cannot_download_internal_material(
    api_client,
    role,
):
    user = UserFactory(role=role)
    api_client.force_authenticate(user=user)

    material = InstitutionalMaterialFactory(
        visibility=InstitutionalMaterial.Visibility.INTERNAL,
        category=InstitutionalMaterial.InternalCategory.REPORT_TEMPLATES,
    )

    response = api_client.get(f"/api/materials/{material.id}/download/")

    assert response.status_code == status.HTTP_403_FORBIDDEN
