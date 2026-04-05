import pytest
from rest_framework import status
from rest_framework.test import APIClient

from tests.factories import UserFactory
from users.models import UserAccount


@pytest.mark.django_db
def test_user_can_retrieve_own_profile():
    client = APIClient()
    user = UserFactory()
    client.force_authenticate(user=user)

    response = client.get("/api/users/me/")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["id"] == user.id
    assert response.data["cpf"] == user.cpf


@pytest.mark.django_db
def test_user_can_patch_own_profile_fields():
    client = APIClient()
    user = UserFactory()
    client.force_authenticate(user=user)

    payload = {
        "name": "Novo Nome",
        "email": "novo-email@example.com",
        "phone": "11999999999",
    }

    response = client.patch("/api/users/me/", payload, format="json")
    user.refresh_from_db()

    assert response.status_code == status.HTTP_200_OK
    assert user.name == payload["name"]
    assert user.email == payload["email"]
    assert user.phone == payload["phone"]


@pytest.mark.django_db
def test_user_cannot_patch_forbidden_profile_fields():
    client = APIClient()
    user = UserFactory(role=UserAccount.Role.CLIENT_GENERAL_MANAGER)
    client.force_authenticate(user=user)

    response = client.patch(
        "/api/users/me/",
        {
            "cpf": "99999999999",
            "role": "GP",
            "is_staff": True,
        },
        format="json",
    )
    user.refresh_from_db()

    assert response.status_code == status.HTTP_200_OK
    assert user.cpf != "99999999999"
    assert user.role == UserAccount.Role.CLIENT_GENERAL_MANAGER
    assert user.is_staff is False


@pytest.mark.django_db
def test_user_can_change_password_with_current_password():
    client = APIClient()
    user = UserFactory()
    client.force_authenticate(user=user)

    response = client.post(
        "/api/users/set_password/",
        {
            "current_password": "testpass123",
            "new_password": "NovaSenhaSegura123!",
            "re_new_password": "NovaSenhaSegura123!",
        },
        format="json",
    )
    user.refresh_from_db()

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert user.check_password("NovaSenhaSegura123!") is True


@pytest.mark.django_db
def test_user_cannot_change_password_with_wrong_current_password():
    client = APIClient()
    user = UserFactory()
    client.force_authenticate(user=user)

    response = client.post(
        "/api/users/set_password/",
        {
            "current_password": "senha-errada",
            "new_password": "NovaSenhaSegura123!",
            "re_new_password": "NovaSenhaSegura123!",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert user.check_password("testpass123") is True