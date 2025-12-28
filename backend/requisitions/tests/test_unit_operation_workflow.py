import pytest
from django.core.exceptions import ValidationError
from validate_docbr import CNPJ

from requisitions.models import UnitOperation

from tests.factories import ClientFactory, UnitFactory, UnitOperationFactory


@pytest.mark.django_db
def test_unit_operation_accept_edit_updates_original_unit_fields():
    original = UnitFactory(
        name="Original Unit",
        city="São Paulo",
        state="SP",
        cnpj=CNPJ().generate(),
    )

    staged = UnitOperationFactory(
        operation_type=UnitOperation.OperationType.EDIT,
        operation_status=UnitOperation.OperationStatus.REVIEW,
        original_unit=original,
        client=original.client,
        name="New Unit",
        city="Rio de Janeiro",
        state="RJ",
        cnpj=CNPJ().generate(),
    )

    staged.operation_status = UnitOperation.OperationStatus.ACCEPTED
    staged.save()

    original.refresh_from_db()
    assert original.name == "New Unit"
    assert original.city == "Rio de Janeiro"
    assert original.state == "RJ"
    assert original.cnpj == staged.cnpj


@pytest.mark.django_db
def test_unit_operation_accept_delete_deletes_original_unit():
    original = UnitFactory(cnpj=CNPJ().generate())
    original_id = original.pk

    staged = UnitOperationFactory(
        operation_type=UnitOperation.OperationType.DELETE,
        operation_status=UnitOperation.OperationStatus.REVIEW,
        original_unit=original,
        client=original.client,
        cnpj=original.cnpj,
    )

    staged.operation_status = UnitOperation.OperationStatus.ACCEPTED
    staged.save()

    assert not original.__class__.objects.filter(pk=original_id).exists()


@pytest.mark.django_db
def test_unit_operation_accept_edit_without_original_raises_validation_error():
    staged = UnitOperationFactory(
        operation_type=UnitOperation.OperationType.EDIT,
        operation_status=UnitOperation.OperationStatus.REVIEW,
        original_unit=None,
        client=ClientFactory(),
    )

    staged.operation_status = UnitOperation.OperationStatus.ACCEPTED
    with pytest.raises(ValidationError, match="unidade associada"):
        staged.save()
