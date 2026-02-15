import pytest
from anymail.exceptions import AnymailError
from rest_framework import status
from rest_framework.test import APIClient
from validate_docbr import CPF

from users.models import UserAccount
from tests.factories import UserFactory


@pytest.mark.django_db
def test_list_manage_allows_commercial():
    client = APIClient()
    commercial = UserFactory(role=UserAccount.Role.COMMERCIAL)

    client.force_authenticate(user=commercial)
    response = client.get("/api/users/manage/")

    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_list_manage_allows_gp_and_supports_filters():
    client = APIClient()
    gp = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    UserFactory(role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST, name="Alice")
    UserFactory(role=UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST, name="Bob")

    client.force_authenticate(user=gp)
    response = client.get("/api/users/manage/?name=Alice")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1
    assert response.data["results"][0]["name"] == "Alice"


@pytest.mark.django_db
def test_commercial_list_manage_only_returns_allowed_roles():
    client = APIClient()
    commercial = UserFactory(role=UserAccount.Role.COMMERCIAL)
    UserFactory(role=UserAccount.Role.CLIENT_GENERAL_MANAGER, name="Client Manager")
    UserFactory(role=UserAccount.Role.UNIT_MANAGER, name="Unit Manager")
    UserFactory(role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST, name="FMI")

    client.force_authenticate(user=commercial)
    response = client.get("/api/users/manage/")

    assert response.status_code == status.HTTP_200_OK
    roles = {item["role"] for item in response.data["results"]}
    assert roles <= {
        UserAccount.Role.CLIENT_GENERAL_MANAGER,
        UserAccount.Role.UNIT_MANAGER,
    }


@pytest.mark.django_db
def test_create_managed_user_sends_reset_email_and_sets_unusable_password(mocker):
    client = APIClient()
    gp = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    send_mock = mocker.patch("users.management.ManagedUserPasswordResetEmail.send")

    client.force_authenticate(user=gp)
    response = client.post(
        "/api/users/manage/",
        {
            "cpf": CPF().generate(),
            "email": "newfmi@example.com",
            "name": "New FMI",
            "phone": "11999999999",
            "role": UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST,
        },
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    user = UserAccount.objects.get(id=response.data["id"])
    assert user.check_password("anything") is False
    assert user.has_usable_password() is False
    assert user.role == UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST
    send_mock.assert_called_once()


@pytest.mark.django_db
def test_commercial_can_create_allowed_roles(mocker):
    client = APIClient()
    commercial = UserFactory(role=UserAccount.Role.COMMERCIAL)
    send_mock = mocker.patch("users.management.ManagedUserPasswordResetEmail.send")

    client.force_authenticate(user=commercial)
    response = client.post(
        "/api/users/manage/",
        {
            "cpf": CPF().generate(),
            "email": "ggc@example.com",
            "name": "GGC User",
            "phone": "11999999999",
            "role": UserAccount.Role.CLIENT_GENERAL_MANAGER,
        },
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert response.data["role"] == UserAccount.Role.CLIENT_GENERAL_MANAGER
    send_mock.assert_called_once()


@pytest.mark.django_db
def test_commercial_cannot_create_disallowed_roles(mocker):
    client = APIClient()
    commercial = UserFactory(role=UserAccount.Role.COMMERCIAL)
    send_mock = mocker.patch("users.management.ManagedUserPasswordResetEmail.send")

    client.force_authenticate(user=commercial)
    response = client.post(
        "/api/users/manage/",
        {
            "cpf": CPF().generate(),
            "email": "gp@example.com",
            "name": "GP User",
            "phone": "11999999999",
            "role": UserAccount.Role.PROPHY_MANAGER,
        },
        format="json",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
    send_mock.assert_not_called()


@pytest.mark.django_db
def test_create_managed_user_rejects_service_account_role(mocker):
    client = APIClient()
    gp = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    send_mock = mocker.patch("users.management.ManagedUserPasswordResetEmail.send")

    client.force_authenticate(user=gp)
    response = client.post(
        "/api/users/manage/",
        {
            "cpf": CPF().generate(),
            "email": "sa@example.com",
            "name": "Service",
            "phone": "11999999999",
            "role": UserAccount.Role.SERVICE_ACCOUNT,
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    send_mock.assert_not_called()


@pytest.mark.django_db
def test_create_managed_user_rejects_duplicate_email(mocker):
    client = APIClient()
    gp = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    UserFactory(email="dup@example.com")
    send_mock = mocker.patch("users.management.ManagedUserPasswordResetEmail.send")

    client.force_authenticate(user=gp)
    response = client.post(
        "/api/users/manage/",
        {
            "cpf": CPF().generate(),
            "email": "dup@example.com",
            "name": "Duplicated Email",
            "phone": "11999999999",
            "role": UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST,
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "email" in response.data
    assert UserAccount.objects.filter(email="dup@example.com").count() == 1
    send_mock.assert_not_called()


@pytest.mark.django_db
def test_promote_user_to_gp_sets_is_staff_true_and_updates_groups():
    client = APIClient()
    gp = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    target = UserFactory(
        role=UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST, is_staff=False
    )

    client.force_authenticate(user=gp)
    response = client.patch(
        f"/api/users/manage/{target.id}/",
        {"role": UserAccount.Role.PROPHY_MANAGER},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK

    target.refresh_from_db()
    assert target.role == UserAccount.Role.PROPHY_MANAGER
    assert target.is_staff is True
    assert list(target.groups.values_list("name", flat=True)) == [
        UserAccount.Role.PROPHY_MANAGER
    ]


@pytest.mark.django_db
def test_commercial_cannot_update_managed_user():
    client = APIClient()
    commercial = UserFactory(role=UserAccount.Role.COMMERCIAL)
    target = UserFactory(role=UserAccount.Role.CLIENT_GENERAL_MANAGER)

    client.force_authenticate(user=commercial)
    response = client.patch(
        f"/api/users/manage/{target.id}/",
        {"name": "New Name"},
        format="json",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_create_managed_user_rolls_back_if_email_send_fails(mocker):
    client = APIClient()
    gp = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)

    send_mock = mocker.patch(
        "users.management.ManagedUserPasswordResetEmail.send",
        side_effect=AnymailError("mail failed"),
    )

    client.force_authenticate(user=gp)
    cpf = CPF().generate()
    response = client.post(
        "/api/users/manage/",
        {
            "cpf": cpf,
            "email": "valid@example.com",
            "name": "User With Email Failure",
            "phone": "11999999999",
            "role": UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST,
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "detail" in response.data
    assert not UserAccount.objects.filter(cpf=cpf).exists()
    send_mock.assert_called_once()
