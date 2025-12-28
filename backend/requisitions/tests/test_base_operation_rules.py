import pytest
from django.core.exceptions import ValidationError
from validate_docbr import CNPJ

from requisitions.models import ClientOperation

from tests.factories import ClientOperationFactory


@pytest.mark.django_db
def test_only_one_review_operation_per_entity_is_allowed():
    cnpj = CNPJ().generate()
    ClientOperationFactory(
        operation_status=ClientOperation.OperationStatus.REVIEW,
        operation_type=ClientOperation.OperationType.ADD,
        cnpj=cnpj,
    )

    with pytest.raises(ValidationError, match="Já existe uma operação em análise"):
        ClientOperationFactory(
            operation_status=ClientOperation.OperationStatus.REVIEW,
            operation_type=ClientOperation.OperationType.EDIT,
            cnpj=cnpj,
        )


@pytest.mark.django_db
def test_accepted_add_operation_is_closed_instead_of_remaining_add():
    op = ClientOperationFactory(
        operation_status=ClientOperation.OperationStatus.ACCEPTED,
        operation_type=ClientOperation.OperationType.ADD,
    )

    op.refresh_from_db()
    assert op.operation_type == ClientOperation.OperationType.CLOSED


@pytest.mark.django_db
def test_accepted_edit_operation_is_deleted():
    original = ClientOperationFactory(
        operation_status=ClientOperation.OperationStatus.ACCEPTED,
        operation_type=ClientOperation.OperationType.ADD,
    )
    op = ClientOperationFactory(
        operation_status=ClientOperation.OperationStatus.REVIEW,
        operation_type=ClientOperation.OperationType.EDIT,
        original_client=original,
    )
    op_id = op.pk

    op.operation_status = ClientOperation.OperationStatus.ACCEPTED
    op.save()

    assert not ClientOperation.objects.filter(pk=op_id).exists()


@pytest.mark.django_db
def test_accepted_delete_operation_is_deleted():
    original = ClientOperationFactory(
        operation_status=ClientOperation.OperationStatus.ACCEPTED,
        operation_type=ClientOperation.OperationType.ADD,
    )
    op = ClientOperationFactory(
        operation_status=ClientOperation.OperationStatus.REVIEW,
        operation_type=ClientOperation.OperationType.DELETE,
        original_client=original,
        cnpj=original.cnpj,
    )
    op_id = op.pk

    op.operation_status = ClientOperation.OperationStatus.ACCEPTED
    op.save()

    assert not ClientOperation.objects.filter(pk=op_id).exists()
