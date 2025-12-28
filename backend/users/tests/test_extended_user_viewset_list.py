import pytest
from rest_framework import status
from rest_framework.test import APIClient

from users.models import UserAccount
from tests.factories import UserFactory


@pytest.mark.django_db
def test_list_as_prophy_manager_returns_all_users():
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER, is_staff=True)
    UserFactory(role=UserAccount.Role.UNIT_MANAGER)
    UserFactory(role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST)

    client.force_authenticate(user=prophy_manager)
    response = client.get("/api/users/")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == UserAccount.objects.count()


@pytest.mark.django_db
def test_list_as_client_general_manager_returns_only_unit_managers():
    client = APIClient()
    client_manager = UserFactory(role=UserAccount.Role.CLIENT_GENERAL_MANAGER)
    UserFactory(role=UserAccount.Role.UNIT_MANAGER)
    UserFactory(role=UserAccount.Role.UNIT_MANAGER)
    UserFactory(role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST)
    UserFactory(role=UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST)

    client.force_authenticate(user=client_manager)
    response = client.get("/api/users/")

    assert response.status_code == status.HTTP_200_OK
    assert (
        response.data["count"]
        == UserAccount.objects.filter(role=UserAccount.Role.UNIT_MANAGER).count()
    )
    assert all(
        item["role"] == UserAccount.Role.UNIT_MANAGER
        for item in response.data["results"]
    )


@pytest.mark.django_db
def test_list_as_non_manager_returns_only_self():
    client = APIClient()
    physicist = UserFactory(role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST)
    UserFactory(role=UserAccount.Role.UNIT_MANAGER)
    UserFactory(role=UserAccount.Role.CLIENT_GENERAL_MANAGER)

    client.force_authenticate(user=physicist)
    response = client.get("/api/users/")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1
    assert response.data["results"][0]["id"] == physicist.id
