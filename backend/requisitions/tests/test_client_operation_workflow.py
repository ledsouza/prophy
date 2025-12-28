import pytest
from django.core.exceptions import ValidationError
from tests.factories import ClientFactory, ClientOperationFactory, UserFactory
from validate_docbr import CNPJ

from requisitions.models import ClientOperation


@pytest.mark.django_db
def test_client_operation_accept_edit_updates_original_client_fields():
    original_cnpj = CNPJ().generate()
    original = ClientFactory(
        name="Original Name",
        email="original@example.com",
        phone="11911111111",
        address="Old address",
        state="SP",
        city="São Paulo",
        cnpj=original_cnpj,
        is_active=True,
    )

    staged = ClientOperationFactory(
        operation_type=ClientOperation.OperationType.EDIT,
        operation_status=ClientOperation.OperationStatus.REVIEW,
        original_client=original,
        name="New Name",
        email="new@example.com",
        phone="11922222222",
        address="New address",
        state="RJ",
        city="Rio de Janeiro",
        cnpj=CNPJ().generate(),
    )

    staged.operation_status = ClientOperation.OperationStatus.ACCEPTED
    staged.save()

    original.refresh_from_db()
    assert original.name == "New Name"
    assert original.email == "new@example.com"
    assert original.phone == "11922222222"
    assert original.address == "New address"
    assert original.state == "RJ"
    assert original.city == "Rio de Janeiro"
    assert original.cnpj == staged.cnpj


@pytest.mark.django_db
def test_client_operation_accept_delete_marks_original_client_inactive():
    original = ClientFactory(
        cnpj=CNPJ().generate(),
        is_active=True,
    )

    staged = ClientOperationFactory(
        operation_type=ClientOperation.OperationType.DELETE,
        operation_status=ClientOperation.OperationStatus.REVIEW,
        original_client=original,
        cnpj=original.cnpj,
    )

    staged.operation_status = ClientOperation.OperationStatus.ACCEPTED
    staged.save()

    original.refresh_from_db()
    assert original.is_active is False


@pytest.mark.django_db
def test_client_operation_accept_edit_without_original_raises_validation_error():
    staged = ClientOperationFactory(
        operation_type=ClientOperation.OperationType.EDIT,
        operation_status=ClientOperation.OperationStatus.REVIEW,
        original_client=None,
    )

    staged.operation_status = ClientOperation.OperationStatus.ACCEPTED
    with pytest.raises(ValidationError, match="cliente associado"):
        staged.save()


@pytest.mark.django_db
def test_client_operation_accept_delete_without_original_raises_validation_error():
    staged = ClientOperationFactory(
        operation_type=ClientOperation.OperationType.DELETE,
        operation_status=ClientOperation.OperationStatus.REVIEW,
        original_client=None,
    )

    staged.operation_status = ClientOperation.OperationStatus.ACCEPTED
    with pytest.raises(ValidationError, match="cliente associado"):
        staged.save()


@pytest.mark.django_db
def test_client_operation_accept_add_marks_staged_client_active_and_closes_operation_type():
    staged = ClientOperationFactory(
        operation_type=ClientOperation.OperationType.ADD,
        operation_status=ClientOperation.OperationStatus.REVIEW,
        is_active=True,
    )
    assert staged.is_active is False

    staged.operation_status = ClientOperation.OperationStatus.ACCEPTED
    staged.save()

    staged.refresh_from_db()
    assert staged.is_active is True
    assert staged.operation_type == ClientOperation.OperationType.CLOSED


@pytest.mark.django_db
def test_client_operation_factory_users_post_generation_sets_m2m():
    u1 = UserFactory()
    u2 = UserFactory()

    op = ClientOperationFactory(users=[u1, u2])

    assert op.users.count() == 2
    assert op.users.filter(pk=u1.pk).exists()
    assert op.users.filter(pk=u2.pk).exists()


@pytest.mark.django_db
def test_client_operation_review_add_is_inactive():
    user = UserFactory()
    op = ClientOperation.objects.create(
        operation_type=ClientOperation.OperationType.ADD,
        operation_status=ClientOperation.OperationStatus.REVIEW,
        created_by=user,
        cnpj=CNPJ().generate(),
        name="Client",
        email="client@example.com",
        phone="11999999999",
        address="Address",
        state="SP",
        city="São Paulo",
    )

    assert op.is_active is False
