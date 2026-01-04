import pytest
from rest_framework import status

from materials.models import InstitutionalMaterial
from tests.factories import InstitutionalMaterialFactory, UserFactory
from users.models import UserAccount


@pytest.mark.django_db
def test_prophy_manager_sees_all_materials(api_client, prophy_manager):
    api_client.force_authenticate(user=prophy_manager)

    public_material = InstitutionalMaterialFactory(
        visibility=InstitutionalMaterial.Visibility.PUBLIC,
        category=InstitutionalMaterial.PublicCategory.SIGNS,
    )
    internal_material = InstitutionalMaterialFactory(
        visibility=InstitutionalMaterial.Visibility.INTERNAL,
        category=InstitutionalMaterial.InternalCategory.REPORT_TEMPLATES,
    )

    response = api_client.get("/api/materials/")

    assert response.status_code == status.HTTP_200_OK
    ids = {item["id"] for item in response.data["results"]}
    assert public_material.id in ids
    assert internal_material.id in ids


@pytest.mark.django_db
def test_internal_physicist_sees_all_materials(api_client, internal_physicist):
    api_client.force_authenticate(user=internal_physicist)

    public_material = InstitutionalMaterialFactory(
        visibility=InstitutionalMaterial.Visibility.PUBLIC,
        category=InstitutionalMaterial.PublicCategory.SIGNS,
    )
    internal_material = InstitutionalMaterialFactory(
        visibility=InstitutionalMaterial.Visibility.INTERNAL,
        category=InstitutionalMaterial.InternalCategory.REPORT_TEMPLATES,
    )

    response = api_client.get("/api/materials/")

    assert response.status_code == status.HTTP_200_OK
    ids = {item["id"] for item in response.data["results"]}
    assert public_material.id in ids
    assert internal_material.id in ids


@pytest.mark.django_db
def test_external_physicist_sees_public_and_allowed_internal_only(
    api_client,
    external_physicist,
):
    api_client.force_authenticate(user=external_physicist)

    public_material = InstitutionalMaterialFactory(
        visibility=InstitutionalMaterial.Visibility.PUBLIC,
        category=InstitutionalMaterial.PublicCategory.SIGNS,
    )
    allowed_internal = InstitutionalMaterialFactory(
        visibility=InstitutionalMaterial.Visibility.INTERNAL,
        category=InstitutionalMaterial.InternalCategory.REPORT_TEMPLATES,
        allowed_external_users=[external_physicist],
    )
    hidden_internal = InstitutionalMaterialFactory(
        visibility=InstitutionalMaterial.Visibility.INTERNAL,
        category=InstitutionalMaterial.InternalCategory.REPORT_TEMPLATES,
    )

    response = api_client.get("/api/materials/")

    assert response.status_code == status.HTTP_200_OK
    ids = {item["id"] for item in response.data["results"]}
    assert public_material.id in ids
    assert allowed_internal.id in ids
    assert hidden_internal.id not in ids


@pytest.mark.django_db
def test_client_general_manager_sees_public_only(api_client, client_manager):
    api_client.force_authenticate(user=client_manager)

    public_material = InstitutionalMaterialFactory(
        visibility=InstitutionalMaterial.Visibility.PUBLIC,
        category=InstitutionalMaterial.PublicCategory.SIGNS,
    )
    internal_material = InstitutionalMaterialFactory(
        visibility=InstitutionalMaterial.Visibility.INTERNAL,
        category=InstitutionalMaterial.InternalCategory.REPORT_TEMPLATES,
    )

    response = api_client.get("/api/materials/")

    assert response.status_code == status.HTTP_200_OK
    ids = {item["id"] for item in response.data["results"]}
    assert public_material.id in ids
    assert internal_material.id not in ids


@pytest.mark.django_db
def test_unit_manager_sees_public_only(api_client):
    unit_manager = UserFactory(role=UserAccount.Role.UNIT_MANAGER)
    api_client.force_authenticate(user=unit_manager)

    public_material = InstitutionalMaterialFactory(
        visibility=InstitutionalMaterial.Visibility.PUBLIC,
        category=InstitutionalMaterial.PublicCategory.SIGNS,
    )
    internal_material = InstitutionalMaterialFactory(
        visibility=InstitutionalMaterial.Visibility.INTERNAL,
        category=InstitutionalMaterial.InternalCategory.REPORT_TEMPLATES,
    )

    response = api_client.get("/api/materials/")

    assert response.status_code == status.HTTP_200_OK
    ids = {item["id"] for item in response.data["results"]}
    assert public_material.id in ids
    assert internal_material.id not in ids


@pytest.mark.django_db
def test_external_physicist_filter_visibility_internal_does_not_leak(
    api_client,
    external_physicist,
):
    api_client.force_authenticate(user=external_physicist)

    allowed_internal = InstitutionalMaterialFactory(
        visibility=InstitutionalMaterial.Visibility.INTERNAL,
        category=InstitutionalMaterial.InternalCategory.REPORT_TEMPLATES,
        allowed_external_users=[external_physicist],
    )
    hidden_internal = InstitutionalMaterialFactory(
        visibility=InstitutionalMaterial.Visibility.INTERNAL,
        category=InstitutionalMaterial.InternalCategory.REPORT_TEMPLATES,
    )

    response = api_client.get("/api/materials/?visibility=INT")

    assert response.status_code == status.HTTP_200_OK
    ids = {item["id"] for item in response.data["results"]}
    assert allowed_internal.id in ids
    assert hidden_internal.id not in ids
