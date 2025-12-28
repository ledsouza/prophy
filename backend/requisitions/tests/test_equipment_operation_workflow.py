import pytest
from django.core.exceptions import ValidationError

from requisitions.models import EquipmentOperation

from tests.factories import (
    AccessoryFactory,
    EquipmentFactory,
    EquipmentOperationFactory,
    ModalityFactory,
)


@pytest.mark.django_db
def test_equipment_operation_accept_edit_updates_original_equipment_fields_and_migrates_accessories():
    original = EquipmentFactory(
        manufacturer="OldManufacturer",
        model="OldModel",
        series_number="SN-OLD",
    )

    AccessoryFactory(equipment=original, series_number="A1")
    assert original.accessories.count() == 1

    staged_equipment = EquipmentFactory(
        unit=original.unit,
        modality=original.modality,
        manufacturer="NewManufacturer",
        model="NewModel",
        series_number="SN-NEW",
    )
    AccessoryFactory(equipment=staged_equipment, series_number="A2")
    AccessoryFactory(equipment=staged_equipment, series_number="A3")

    staged_op = EquipmentOperationFactory(
        operation_type=EquipmentOperation.OperationType.EDIT,
        operation_status=EquipmentOperation.OperationStatus.REVIEW,
        original_equipment=original,
        unit=staged_equipment.unit,
        modality=staged_equipment.modality,
        manufacturer=staged_equipment.manufacturer,
        model=staged_equipment.model,
        series_number=staged_equipment.series_number,
        equipment_photo=staged_equipment.equipment_photo,
        label_photo=staged_equipment.label_photo,
    )

    AccessoryFactory(equipment=staged_op, series_number="A2")
    AccessoryFactory(equipment=staged_op, series_number="A3")

    staged_op.operation_status = EquipmentOperation.OperationStatus.ACCEPTED
    staged_op.save()

    original.refresh_from_db()
    assert original.manufacturer == "NewManufacturer"
    assert original.model == "NewModel"
    assert original.series_number == "SN-NEW"

    accessory_series = list(
        original.accessories.values_list("series_number", flat=True)
    )
    assert sorted(accessory_series) == ["A2", "A3"]


@pytest.mark.django_db
def test_equipment_operation_accept_delete_deletes_original_equipment():
    original = EquipmentFactory(series_number="SN-DEL")
    original_id = original.pk

    staged = EquipmentOperationFactory(
        operation_type=EquipmentOperation.OperationType.DELETE,
        operation_status=EquipmentOperation.OperationStatus.REVIEW,
        original_equipment=original,
        unit=original.unit,
        modality=original.modality,
        manufacturer=original.manufacturer,
        model=original.model,
        series_number=original.series_number,
        equipment_photo=original.equipment_photo,
        label_photo=original.label_photo,
    )

    staged.operation_status = EquipmentOperation.OperationStatus.ACCEPTED
    staged.save()

    assert not original.__class__.objects.filter(pk=original_id).exists()


@pytest.mark.django_db
def test_equipment_operation_accept_edit_without_original_raises_validation_error():
    staged = EquipmentOperationFactory(
        operation_type=EquipmentOperation.OperationType.EDIT,
        operation_status=EquipmentOperation.OperationStatus.REVIEW,
        original_equipment=None,
        modality=ModalityFactory(),
    )

    staged.operation_status = EquipmentOperation.OperationStatus.ACCEPTED
    with pytest.raises(ValidationError, match="equipamento associado"):
        staged.save()
