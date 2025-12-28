import pytest
from rest_framework.test import APIClient

from users.models import UserAccount


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def prophy_manager(db) -> UserAccount:
    return UserAccount.objects.create_user(
        cpf="12345678901",
        email="manager@prophy.com",
        password="testpass123",
        name="Gerente Prophy",
        phone="11999999991",
        role=UserAccount.Role.PROPHY_MANAGER,
    )


@pytest.fixture
def internal_physicist(db) -> UserAccount:
    return UserAccount.objects.create_user(
        cpf="12345678902",
        email="internal@prophy.com",
        password="testpass123",
        name="Físico Médico Interno",
        phone="11999999992",
        role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST,
    )


@pytest.fixture
def external_physicist(db) -> UserAccount:
    return UserAccount.objects.create_user(
        cpf="12345678903",
        email="external@prophy.com",
        password="testpass123",
        name="Físico Médico Externo",
        phone="11999999993",
        role=UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST,
    )


@pytest.fixture
def client_manager(db) -> UserAccount:
    return UserAccount.objects.create_user(
        cpf="12345678904",
        email="client@company.com",
        password="testpass123",
        name="Gerente Geral",
        phone="11999999994",
        role=UserAccount.Role.CLIENT_GENERAL_MANAGER,
    )
