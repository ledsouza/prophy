import pytest
from validate_docbr import CPF
from rest_framework import status
from rest_framework.test import APIClient

from users.models import UserAccount
from tests.factories import ClientFactory, UnitFactory, UserFactory


@pytest.mark.django_db
def test_create_unit_manager_forbidden_for_non_manager_roles(mocker):
    client = APIClient()
    physicist = UserFactory(role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST)
    unit = UnitFactory()
    send_mock = mocker.patch("users.views.UnitManagerPasswordResetEmail.send")

    client.force_authenticate(user=physicist)
    response = client.post(
        "/api/users/create-unit-manager/",
        {
            "cpf": CPF().generate(),
            "email": "unitmanager@example.com",
            "name": "Unit Manager",
            "phone": "11999999999",
            "unit_id": unit.id,
        },
        format="json",
    )

    assert response.data

    assert response.status_code == status.HTTP_403_FORBIDDEN
    send_mock.assert_not_called()


@pytest.mark.django_db
def test_create_unit_manager_as_client_manager_creates_user_assigns_unit_and_sends_email(
    mocker,
):
    client = APIClient()
    client_manager = UserFactory(role=UserAccount.Role.CLIENT_GENERAL_MANAGER)
    unit = UnitFactory(client=ClientFactory())
    send_mock = mocker.patch("users.views.UnitManagerPasswordResetEmail.send")

    client.force_authenticate(user=client_manager)
    response = client.post(
        "/api/users/create-unit-manager/",
        {
            "cpf": CPF().generate(),
            "email": "unitmanager@example.com",
            "name": "Unit Manager",
            "phone": "11999999999",
            "unit_id": unit.id,
        },
        format="json",
    )

    assert response.data
    assert response.status_code == status.HTTP_201_CREATED, response.data
    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["email"] == "unitmanager@example.com"

    created_user = UserAccount.objects.get(id=response.data["user_id"])
    assert created_user.role == UserAccount.Role.UNIT_MANAGER
    assert created_user.email == "unitmanager@example.com"

    unit.refresh_from_db()
    assert unit.user_id == created_user.id

    send_mock.assert_called_once()
    assert send_mock.call_args.args[0] == [created_user.email]


@pytest.mark.django_db
def test_create_unit_manager_as_prophy_manager_creates_user_and_sends_email(mocker):
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    unit = UnitFactory()
    send_mock = mocker.patch("users.views.UnitManagerPasswordResetEmail.send")

    client.force_authenticate(user=prophy_manager)
    response = client.post(
        "/api/users/create-unit-manager/",
        {
            "cpf": CPF().generate(),
            "email": "unitmanager2@example.com",
            "name": "Unit Manager 2",
            "phone": "11999999998",
            "unit_id": unit.id,
        },
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED, response.data
    send_mock.assert_called_once()


@pytest.mark.django_db
def test_create_unit_manager_invalid_unit_id_returns_400_and_does_not_send_email(
    mocker,
):
    client = APIClient()
    client_manager = UserFactory(role=UserAccount.Role.CLIENT_GENERAL_MANAGER)
    send_mock = mocker.patch("users.views.UnitManagerPasswordResetEmail.send")

    client.force_authenticate(user=client_manager)
    response = client.post(
        "/api/users/create-unit-manager/",
        {
            "cpf": CPF().generate(),
            "email": "unitmanager@example.com",
            "name": "Unit Manager",
            "phone": "11999999999",
            "unit_id": 999999,
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    send_mock.assert_not_called()
