import pytest
from rest_framework import status

from materials.models import InstitutionalMaterial
from tests.factories import InstitutionalMaterialFactory, UserFactory
from users.models import UserAccount


@pytest.mark.django_db
def test_non_prophy_manager_cannot_set_permissions(api_client, internal_physicist):
    api_client.force_authenticate(user=internal_physicist)

    material = InstitutionalMaterialFactory(
        visibility=InstitutionalMaterial.Visibility.INTERNAL,
        category=InstitutionalMaterial.InternalCategory.REPORT_TEMPLATES,
    )

    response = api_client.post(
        f"/api/materials/{material.id}/set_permissions/",
        {"allowed_external_user_ids": []},
        format="json",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_set_permissions_only_allowed_for_internal_material(
    api_client,
    prophy_manager,
):
    api_client.force_authenticate(user=prophy_manager)

    material = InstitutionalMaterialFactory(
        visibility=InstitutionalMaterial.Visibility.PUBLIC,
        category=InstitutionalMaterial.PublicCategory.SIGNS,
    )

    response = api_client.post(
        f"/api/materials/{material.id}/set_permissions/",
        {"allowed_external_user_ids": []},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_prophy_manager_can_set_permissions_and_clear_them(
    api_client,
    prophy_manager,
):
    api_client.force_authenticate(user=prophy_manager)

    ext_1 = UserFactory(role=UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST)
    ext_2 = UserFactory(role=UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST)

    material = InstitutionalMaterialFactory(
        visibility=InstitutionalMaterial.Visibility.INTERNAL,
        category=InstitutionalMaterial.InternalCategory.REPORT_TEMPLATES,
    )

    response = api_client.post(
        f"/api/materials/{material.id}/set_permissions/",
        {"allowed_external_user_ids": [ext_1.id, ext_2.id]},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    material.refresh_from_db()
    assert set(material.allowed_external_users.values_list("id", flat=True)) == {
        ext_1.id,
        ext_2.id,
    }

    response = api_client.post(
        f"/api/materials/{material.id}/set_permissions/",
        {"allowed_external_user_ids": []},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    material.refresh_from_db()
    assert material.allowed_external_users.count() == 0


@pytest.mark.django_db
def test_set_permissions_ignores_non_external_users(api_client, prophy_manager):
    api_client.force_authenticate(user=prophy_manager)

    external = UserFactory(role=UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST)
    client_manager = UserFactory(role=UserAccount.Role.CLIENT_GENERAL_MANAGER)

    material = InstitutionalMaterialFactory(
        visibility=InstitutionalMaterial.Visibility.INTERNAL,
        category=InstitutionalMaterial.InternalCategory.REPORT_TEMPLATES,
    )

    response = api_client.post(
        f"/api/materials/{material.id}/set_permissions/",
        {"allowed_external_user_ids": [external.id, client_manager.id]},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    material.refresh_from_db()
    assert list(material.allowed_external_users.values_list("id", flat=True)) == [
        external.id
    ]
