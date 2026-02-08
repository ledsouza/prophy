import pytest
from django.urls import reverse
from requisitions.models import ClientOperation, EquipmentOperation, UnitOperation
from rest_framework import status
from rest_framework.test import APIClient
from tests.factories import (
    ClientFactory,
    ClientOperationFactory,
    EquipmentOperationFactory,
    UnitFactory,
    UnitOperationFactory,
    UserFactory,
)


@pytest.mark.django_db
def test_deactivating_client_deletes_pending_operations():
    client = APIClient()
    user = UserFactory(role="GP")
    client.force_authenticate(user=user)

    base_client = ClientFactory(is_active=True)

    pending_client_op = ClientOperationFactory(
        cnpj=base_client.cnpj,
        operation_status=ClientOperation.OperationStatus.REVIEW,
    )
    pending_client_op_rejected = ClientOperationFactory(
        cnpj=base_client.cnpj,
        operation_status=ClientOperation.OperationStatus.REJECTED,
    )
    accepted_client_op = ClientOperationFactory(
        cnpj=base_client.cnpj,
        operation_status=ClientOperation.OperationStatus.ACCEPTED,
        operation_type=ClientOperation.OperationType.CLOSED,
    )

    unit = UnitFactory(client=base_client)
    pending_unit_op = UnitOperationFactory(
        client=base_client,
        operation_status=UnitOperation.OperationStatus.REVIEW,
    )
    pending_unit_op.original_unit = unit
    pending_unit_op.save()

    accepted_unit_op = UnitOperationFactory(
        client=base_client,
        operation_status=UnitOperation.OperationStatus.ACCEPTED,
        operation_type=UnitOperation.OperationType.CLOSED,
    )

    pending_equipment_op = EquipmentOperationFactory(
        unit=unit,
        operation_status=EquipmentOperation.OperationStatus.REVIEW,
    )
    pending_equipment_op.original_equipment = pending_equipment_op.equipment_ptr
    pending_equipment_op.save()

    accepted_equipment_op = EquipmentOperationFactory(
        unit=unit,
        operation_status=EquipmentOperation.OperationStatus.ACCEPTED,
        operation_type=EquipmentOperation.OperationType.CLOSED,
    )

    response = client.patch(
        reverse("clients-detail", args=[base_client.id]),
        {"is_active": False},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    base_client.refresh_from_db()
    assert base_client.is_active is False

    assert not ClientOperation.objects.filter(pk=pending_client_op.pk).exists()
    assert not ClientOperation.objects.filter(pk=pending_client_op_rejected.pk).exists()
    assert ClientOperation.objects.filter(pk=accepted_client_op.pk).exists()

    assert not UnitOperation.objects.filter(pk=pending_unit_op.pk).exists()
    assert UnitOperation.objects.filter(pk=accepted_unit_op.pk).exists()

    assert not EquipmentOperation.objects.filter(pk=pending_equipment_op.pk).exists()
    assert EquipmentOperation.objects.filter(pk=accepted_equipment_op.pk).exists()
