import pytest
from clients_management.models import Client
from rest_framework import status
from rest_framework.test import APIClient
from tests.factories.clients_management import ClientFactory
from tests.factories.users import UserFactory

from users.models import UserAccount


@pytest.mark.django_db
def test_gp_can_assign_non_gu_user_to_client():
    api_client = APIClient()
    gp = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    user = UserFactory(role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST)
    client = ClientFactory()

    api_client.force_authenticate(user=gp)
    response = api_client.post(
        f"/api/clients/{client.id}/users/",
        {"user_id": user.id},
        format="json",
    )

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert Client.objects.filter(id=client.id, users=user).exists()


@pytest.mark.django_db
def test_gp_cannot_assign_gu_to_client():
    api_client = APIClient()
    gp = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    gu_user = UserFactory(role=UserAccount.Role.UNIT_MANAGER)
    client = ClientFactory()

    api_client.force_authenticate(user=gp)
    response = api_client.post(
        f"/api/clients/{client.id}/users/",
        {"user_id": gu_user.id},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert not Client.objects.filter(id=client.id, users=gu_user).exists()


@pytest.mark.django_db
def test_gp_can_remove_user_from_client():
    api_client = APIClient()
    gp = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    user = UserFactory(role=UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST)
    client = ClientFactory(users=[user])

    api_client.force_authenticate(user=gp)
    response = api_client.delete(
        f"/api/clients/{client.id}/users/{user.id}/",
    )

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert not Client.objects.filter(id=client.id, users=user).exists()


@pytest.mark.django_db
def test_commercial_can_manage_allowed_client_association():
    api_client = APIClient()
    commercial = UserFactory(role=UserAccount.Role.COMMERCIAL)
    user = UserFactory(role=UserAccount.Role.CLIENT_GENERAL_MANAGER)
    client = ClientFactory()

    api_client.force_authenticate(user=commercial)
    response = api_client.post(
        f"/api/clients/{client.id}/users/",
        {"user_id": user.id},
        format="json",
    )

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert Client.objects.filter(id=client.id, users=user).exists()


@pytest.mark.django_db
def test_commercial_cannot_manage_disallowed_client_association():
    api_client = APIClient()
    commercial = UserFactory(role=UserAccount.Role.COMMERCIAL)
    user = UserFactory(role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST)
    client = ClientFactory()

    api_client.force_authenticate(user=commercial)
    response = api_client.post(
        f"/api/clients/{client.id}/users/",
        {"user_id": user.id},
        format="json",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    assert not Client.objects.filter(id=client.id, users=user).exists()


@pytest.mark.django_db
def test_cannot_assign_second_client_general_manager():
    api_client = APIClient()
    gp = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    current_manager = UserFactory(role=UserAccount.Role.CLIENT_GENERAL_MANAGER)
    next_manager = UserFactory(role=UserAccount.Role.CLIENT_GENERAL_MANAGER)
    client = ClientFactory(users=[current_manager])

    api_client.force_authenticate(user=gp)
    response = api_client.post(
        f"/api/clients/{client.id}/users/",
        {"user_id": next_manager.id},
        format="json",
    )

    assert response.status_code == status.HTTP_409_CONFLICT
    assert response.data["current_client_general_manager"]["id"] == current_manager.id
    assert (
        response.data["current_client_general_manager"]["name"] == current_manager.name
    )
