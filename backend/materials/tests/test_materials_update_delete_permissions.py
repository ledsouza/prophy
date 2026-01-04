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
def test_prophy_manager_can_update_material(api_client, prophy_manager, pdf_file):
    api_client.force_authenticate(user=prophy_manager)
    material = InstitutionalMaterialFactory(
        visibility=InstitutionalMaterial.Visibility.PUBLIC,
        category=InstitutionalMaterial.PublicCategory.SIGNS,
    )

    payload = {
        "title": "Updated",
        "description": "Updated description",
        "visibility": InstitutionalMaterial.Visibility.PUBLIC,
        "category": InstitutionalMaterial.PublicCategory.SIGNS,
        "file": pdf_file,
    }
    response = api_client.put(
        f"/api/materials/{material.id}/",
        payload,
        format="multipart",
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["title"] == "Updated"


@pytest.mark.django_db
@pytest.mark.parametrize(
    "role",
    [
        UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST,
        UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST,
        UserAccount.Role.CLIENT_GENERAL_MANAGER,
        UserAccount.Role.UNIT_MANAGER,
    ],
)
def test_non_prophy_manager_cannot_update_material(api_client, role, pdf_file):
    user = UserFactory(role=role)
    api_client.force_authenticate(user=user)

    material = InstitutionalMaterialFactory(
        visibility=InstitutionalMaterial.Visibility.PUBLIC,
        category=InstitutionalMaterial.PublicCategory.SIGNS,
    )

    payload = {
        "title": "Updated",
        "description": "Updated description",
        "visibility": InstitutionalMaterial.Visibility.PUBLIC,
        "category": InstitutionalMaterial.PublicCategory.SIGNS,
        "file": pdf_file,
    }
    response = api_client.put(
        f"/api/materials/{material.id}/",
        payload,
        format="multipart",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_prophy_manager_can_delete_material(api_client, prophy_manager):
    api_client.force_authenticate(user=prophy_manager)

    material = InstitutionalMaterialFactory(
        visibility=InstitutionalMaterial.Visibility.PUBLIC,
        category=InstitutionalMaterial.PublicCategory.SIGNS,
    )

    response = api_client.delete(f"/api/materials/{material.id}/")

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not InstitutionalMaterial.objects.filter(id=material.id).exists()


@pytest.mark.django_db
@pytest.mark.parametrize(
    "role",
    [
        UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST,
        UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST,
        UserAccount.Role.CLIENT_GENERAL_MANAGER,
        UserAccount.Role.UNIT_MANAGER,
    ],
)
def test_non_prophy_manager_cannot_delete_material(api_client, role):
    user = UserFactory(role=role)
    api_client.force_authenticate(user=user)

    material = InstitutionalMaterialFactory(
        visibility=InstitutionalMaterial.Visibility.PUBLIC,
        category=InstitutionalMaterial.PublicCategory.SIGNS,
    )

    response = api_client.delete(f"/api/materials/{material.id}/")

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert InstitutionalMaterial.objects.filter(id=material.id).exists()
