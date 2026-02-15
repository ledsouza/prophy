import pytest
from rest_framework import status
from rest_framework.test import APIClient
from tests.factories.clients_management import ClientFactory, UnitFactory
from tests.factories.users import UserFactory

from users.models import UserAccount


@pytest.mark.django_db
def test_summary_returns_clients_for_non_gu_user():
    api_client = APIClient()
    gp = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    user = UserFactory(role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST)
    client_a = ClientFactory(users=[user])
    client_b = ClientFactory(users=[user])

    api_client.force_authenticate(user=gp)
    response = api_client.get(f"/api/users/manage/{user.id}/associations/")

    assert response.status_code == status.HTTP_200_OK
    assert "clients" in response.data
    client_ids = {client["id"] for client in response.data["clients"]}
    assert client_ids == {client_a.id, client_b.id}


@pytest.mark.django_db
def test_summary_returns_units_for_gu_user():
    api_client = APIClient()
    gp = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    gu_user = UserFactory(role=UserAccount.Role.UNIT_MANAGER)
    unit_a = UnitFactory(user=gu_user)
    unit_b = UnitFactory(user=gu_user)

    api_client.force_authenticate(user=gp)
    response = api_client.get(f"/api/users/manage/{gu_user.id}/associations/")

    assert response.status_code == status.HTTP_200_OK
    assert "units" in response.data
    unit_ids = {unit["id"] for unit in response.data["units"]}
    assert unit_ids == {unit_a.id, unit_b.id}


@pytest.mark.django_db
def test_commercial_cannot_view_disallowed_user_associations():
    api_client = APIClient()
    commercial = UserFactory(role=UserAccount.Role.COMMERCIAL)
    user = UserFactory(role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST)

    api_client.force_authenticate(user=commercial)
    response = api_client.get(f"/api/users/manage/{user.id}/associations/")

    assert response.status_code == status.HTTP_403_FORBIDDEN
