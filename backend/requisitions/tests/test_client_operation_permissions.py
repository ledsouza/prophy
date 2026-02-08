import pytest
from rest_framework import status
from django.urls import reverse
from validate_docbr import CNPJ

from requisitions.models import ClientOperation
from tests.factories import ClientOperationFactory


@pytest.mark.django_db
def test_non_gp_cannot_create_accepted_client_operation(
    api_client,
    internal_physicist,
):
    api_client.force_authenticate(user=internal_physicist)
    url = reverse("clients-operations-list")

    payload = {
        "cnpj": CNPJ().generate(),
        "name": "Client",
        "email": "client@example.com",
        "phone": "11999999999",
        "address": "Street",
        "state": "SP",
        "city": "São Paulo",
        "operation_type": ClientOperation.OperationType.ADD,
        "operation_status": ClientOperation.OperationStatus.ACCEPTED,
    }

    response = api_client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_add_operation_does_not_require_original_client(
    api_client,
    prophy_manager,
):
    api_client.force_authenticate(user=prophy_manager)
    url = reverse("clients-operations-list")

    payload = {
        "cnpj": CNPJ().generate(),
        "name": "Client",
        "email": "client@example.com",
        "phone": "11999999999",
        "address": "Street",
        "state": "SP",
        "city": "São Paulo",
        "operation_type": ClientOperation.OperationType.ADD,
        "operation_status": ClientOperation.OperationStatus.ACCEPTED,
    }

    response = api_client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
def test_add_operation_rejects_duplicate_cnpj(
    api_client,
    prophy_manager,
):
    api_client.force_authenticate(user=prophy_manager)
    url = reverse("clients-operations-list")

    existing = ClientOperationFactory(
        operation_type=ClientOperation.OperationType.ADD,
        operation_status=ClientOperation.OperationStatus.ACCEPTED,
    )

    payload = {
        "cnpj": existing.cnpj,
        "name": "Client",
        "email": "client@example.com",
        "phone": "11999999999",
        "address": "Street",
        "state": "SP",
        "city": "São Paulo",
        "operation_type": ClientOperation.OperationType.ADD,
        "operation_status": ClientOperation.OperationStatus.ACCEPTED,
    }

    response = api_client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "cnpj" in response.data


@pytest.mark.django_db
def test_edit_operation_requires_original_client(
    api_client,
    prophy_manager,
):
    api_client.force_authenticate(user=prophy_manager)
    url = reverse("clients-operations-list")

    payload = {
        "cnpj": CNPJ().generate(),
        "name": "Client",
        "email": "client@example.com",
        "phone": "11999999999",
        "address": "Street",
        "state": "SP",
        "city": "São Paulo",
        "operation_type": ClientOperation.OperationType.EDIT,
        "operation_status": ClientOperation.OperationStatus.REVIEW,
    }

    response = api_client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "original_client" in response.data


@pytest.mark.django_db
def test_edit_operation_copies_users_from_original_client(
    api_client,
    prophy_manager,
):
    api_client.force_authenticate(user=prophy_manager)
    url = reverse("clients-operations-list")

    original = ClientOperationFactory(
        operation_type=ClientOperation.OperationType.ADD,
        operation_status=ClientOperation.OperationStatus.ACCEPTED,
    )

    payload = {
        "cnpj": original.cnpj,
        "name": "Client",
        "email": "client@example.com",
        "phone": "11999999999",
        "address": "Street",
        "state": "SP",
        "city": "São Paulo",
        "operation_type": ClientOperation.OperationType.EDIT,
        "operation_status": ClientOperation.OperationStatus.REVIEW,
        "original_client": original.id,
    }

    response = api_client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_201_CREATED
