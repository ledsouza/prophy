from io import BytesIO

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from PIL import Image
from rest_framework import status

from requisitions.models import EquipmentOperation
from tests.factories import ModalityFactory, UnitFactory

# Django's default FILE_UPLOAD_MAX_MEMORY_SIZE: above this, uploaded
# files are spooled to disk as TemporaryUploadedFile instead of kept
# in memory as InMemoryUploadedFile.
DJANGO_FILE_UPLOAD_MAX_MEMORY_SIZE = 2_621_440


def make_image_file(name: str, size_bytes: int) -> SimpleUploadedFile:
    buffer = BytesIO()
    Image.new("RGB", (10, 10), color="red").save(buffer, format="JPEG")
    valid_jpeg = buffer.getvalue()
    padding = b"\x00" * max(size_bytes - len(valid_jpeg), 0)
    return SimpleUploadedFile(
        name, valid_jpeg + padding, content_type="image/jpeg"
    )


def build_add_operation_payload(unit, modality, equipment_photo):
    return {
        "operation_type": EquipmentOperation.OperationType.ADD,
        "unit": unit.id,
        "modality": modality.id,
        "manufacturer": "Acme",
        "model": "X100",
        "equipment_photo": equipment_photo,
        "label_photo": make_image_file("label.jpg", 1024),
    }


@pytest.mark.django_db
def test_create_equipment_operation_with_image_above_memory_threshold_succeeds(
    api_client, prophy_manager
):
    api_client.force_authenticate(user=prophy_manager)
    unit = UnitFactory()
    modality = ModalityFactory()
    url = reverse("equipments-operations-list")

    large_image = make_image_file(
        "equipment.jpg", DJANGO_FILE_UPLOAD_MAX_MEMORY_SIZE + 1024
    )
    payload = build_add_operation_payload(unit, modality, large_image)

    response = api_client.post(url, payload, format="multipart")

    assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
def test_create_equipment_operation_rejects_oversized_image(
    api_client, prophy_manager
):
    api_client.force_authenticate(user=prophy_manager)
    unit = UnitFactory()
    modality = ModalityFactory()
    url = reverse("equipments-operations-list")

    oversized_image = make_image_file("equipment.jpg", 5 * 1024 * 1024 + 1024)
    payload = build_add_operation_payload(unit, modality, oversized_image)

    response = api_client.post(url, payload, format="multipart")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "equipment_photo" in response.data


@pytest.mark.django_db
def test_create_equipment_operation_does_not_allow_client_supplied_created_by(
    api_client, prophy_manager, internal_physicist
):
    api_client.force_authenticate(user=prophy_manager)
    unit = UnitFactory()
    modality = ModalityFactory()
    url = reverse("equipments-operations-list")

    payload = build_add_operation_payload(
        unit, modality, make_image_file("equipment.jpg", 1024)
    )
    payload["created_by"] = internal_physicist.id

    response = api_client.post(url, payload, format="multipart")

    assert response.status_code == status.HTTP_201_CREATED
    operation = EquipmentOperation.objects.get(id=response.data["id"])
    assert operation.created_by == prophy_manager
