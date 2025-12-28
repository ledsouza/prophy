import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from requisitions.models import ClientOperation, UnitOperation
from users.models import UserAccount
from tests.factories import (
    AppointmentFactory,
    ClientOperationFactory,
    ProposalFactory,
    UnitFactory,
    UnitOperationFactory,
    UserFactory,
)


@pytest.mark.django_db
def test_clients_list_as_prophy_manager_returns_all_client_operations():
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)

    ClientOperationFactory(
        operation_status=ClientOperation.OperationStatus.ACCEPTED,
        operation_type=ClientOperation.OperationType.CLOSED,
        is_active=True,
    )
    ClientOperationFactory(
        operation_status=ClientOperation.OperationStatus.REVIEW,
        operation_type=ClientOperation.OperationType.ADD,
        is_active=False,
    )

    client.force_authenticate(user=prophy_manager)
    response = client.get("/api/clients/")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == ClientOperation.objects.count()


@pytest.mark.django_db
def test_clients_list_as_unit_manager_returns_only_clients_of_managed_units():
    client = APIClient()
    unit_manager = UserFactory(role=UserAccount.Role.UNIT_MANAGER)

    managed_client_op = ClientOperationFactory(
        operation_status=ClientOperation.OperationStatus.ACCEPTED,
        operation_type=ClientOperation.OperationType.CLOSED,
        is_active=True,
    )
    other_client_op = ClientOperationFactory(
        operation_status=ClientOperation.OperationStatus.ACCEPTED,
        operation_type=ClientOperation.OperationType.CLOSED,
        is_active=True,
    )

    UnitOperationFactory(
        operation_status=UnitOperation.OperationStatus.ACCEPTED,
        operation_type=UnitOperation.OperationType.CLOSED,
        client=managed_client_op.client_ptr,
        user=unit_manager,
    )

    UnitOperationFactory(
        operation_status=UnitOperation.OperationStatus.ACCEPTED,
        operation_type=UnitOperation.OperationType.CLOSED,
        client=other_client_op.client_ptr,
    )

    client.force_authenticate(user=unit_manager)
    response = client.get("/api/clients/")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1
    assert response.data["results"][0]["cnpj"] == managed_client_op.cnpj


@pytest.mark.django_db
def test_clients_list_as_client_user_returns_only_clients_associated_to_user():
    client = APIClient()
    client_user = UserFactory(role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST)

    associated_client_op = ClientOperationFactory(
        operation_status=ClientOperation.OperationStatus.ACCEPTED,
        operation_type=ClientOperation.OperationType.CLOSED,
        is_active=True,
        users=[client_user],
    )
    ClientOperationFactory(
        operation_status=ClientOperation.OperationStatus.ACCEPTED,
        operation_type=ClientOperation.OperationType.CLOSED,
        is_active=True,
    )

    client.force_authenticate(user=client_user)
    response = client.get("/api/clients/")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1
    assert response.data["results"][0]["cnpj"] == associated_client_op.cnpj


@pytest.mark.django_db
def test_clients_list_filter_contract_type_uses_most_recent_accepted_proposal():
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)

    annual_client_op = ClientOperationFactory(
        operation_status=ClientOperation.OperationStatus.ACCEPTED,
        operation_type=ClientOperation.OperationType.CLOSED,
        is_active=True,
    )
    monthly_client_op = ClientOperationFactory(
        operation_status=ClientOperation.OperationStatus.ACCEPTED,
        operation_type=ClientOperation.OperationType.CLOSED,
        is_active=True,
    )

    ProposalFactory(
        cnpj=annual_client_op.cnpj,
        status="A",
        contract_type="A",
        date=timezone.now().date(),
    )
    ProposalFactory(
        cnpj=monthly_client_op.cnpj,
        status="A",
        contract_type="M",
        date=timezone.now().date(),
    )

    client.force_authenticate(user=prophy_manager)
    response = client.get("/api/clients/?contract_type=A")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1
    assert response.data["results"][0]["cnpj"] == annual_client_op.cnpj


@pytest.mark.django_db
def test_clients_list_filter_operation_status_pending_detects_review_ops_for_client_unit_or_equipment():
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)

    base_client_op = ClientOperationFactory(
        operation_status=ClientOperation.OperationStatus.ACCEPTED,
        operation_type=ClientOperation.OperationType.CLOSED,
        is_active=True,
    )

    pending_client = ClientOperationFactory(
        operation_status=ClientOperation.OperationStatus.ACCEPTED,
        operation_type=ClientOperation.OperationType.CLOSED,
        is_active=True,
    )

    ClientOperationFactory(
        cnpj=pending_client.cnpj,
        original_client=pending_client.client_ptr,
        operation_status=ClientOperation.OperationStatus.REVIEW,
        operation_type=ClientOperation.OperationType.EDIT,
    )

    client.force_authenticate(user=prophy_manager)
    response = client.get("/api/clients/?operation_status=pending")

    assert response.status_code == status.HTTP_200_OK
    cnpjs = {row["cnpj"] for row in response.data["results"]}
    assert pending_client.cnpj in cnpjs
    assert base_client_op.cnpj not in cnpjs


@pytest.mark.django_db
def test_clients_list_filter_is_active_false_filters_inactive_clients():
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)

    ClientOperationFactory(
        operation_status=ClientOperation.OperationStatus.ACCEPTED,
        operation_type=ClientOperation.OperationType.CLOSED,
        is_active=True,
    )
    inactive_client = ClientOperationFactory(
        operation_status=ClientOperation.OperationStatus.ACCEPTED,
        operation_type=ClientOperation.OperationType.CLOSED,
        is_active=False,
    )

    client.force_authenticate(user=prophy_manager)
    response = client.get(f"/api/clients/?cnpj={inactive_client.cnpj}")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1
    assert response.data["results"][0]["cnpj"] == inactive_client.cnpj


@pytest.mark.django_db
def test_clients_list_needs_appointment_true_when_annual_accepted_proposal_has_no_future_appointment():
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)

    client_op = ClientOperationFactory(
        operation_status=ClientOperation.OperationStatus.ACCEPTED,
        operation_type=ClientOperation.OperationType.CLOSED,
        is_active=True,
    )
    unit = UnitFactory(client=client_op.client_ptr)

    proposal_date = timezone.now().date()
    ProposalFactory(
        cnpj=client_op.cnpj,
        status="A",
        contract_type="A",
        date=proposal_date,
    )

    client.force_authenticate(user=prophy_manager)

    response_no_appointment = client.get(f"/api/clients/?cnpj={client_op.cnpj}")
    assert response_no_appointment.status_code == status.HTTP_200_OK
    assert response_no_appointment.data["count"] == 1
    assert response_no_appointment.data["results"][0]["needs_appointment"] is True

    AppointmentFactory(unit=unit, date=timezone.now() + timezone.timedelta(days=1))

    response_with_appointment = client.get(f"/api/clients/?cnpj={client_op.cnpj}")
    assert response_with_appointment.status_code == status.HTTP_200_OK
    assert response_with_appointment.data["count"] == 1
    assert response_with_appointment.data["results"][0]["needs_appointment"] is False
