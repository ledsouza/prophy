import pytest
from rest_framework import status
from rest_framework.test import APIClient

from clients_management.serializers import AccessorySerializer, EquipmentSerializer
from tests.factories import AccessoryFactory, EquipmentFactory, UserFactory


@pytest.mark.django_db
def test_equipment_photo_redirects_when_authenticated():
    client = APIClient()
    user = UserFactory()
    equipment = EquipmentFactory()
    client.force_authenticate(user=user)

    response = client.get(f"/api/equipments/{equipment.pk}/photo/")

    assert response.status_code == status.HTTP_302_FOUND
    assert response["Location"]


@pytest.mark.django_db
def test_equipment_label_redirects_when_authenticated():
    client = APIClient()
    user = UserFactory()
    equipment = EquipmentFactory()
    client.force_authenticate(user=user)

    response = client.get(f"/api/equipments/{equipment.pk}/label/")

    assert response.status_code == status.HTTP_302_FOUND
    assert response["Location"]


@pytest.mark.django_db
def test_equipment_photo_requires_authentication():
    client = APIClient()
    equipment = EquipmentFactory()

    response = client.get(f"/api/equipments/{equipment.pk}/photo/")

    assert response.status_code == status.HTTP_401_UNAUTHORIZED


@pytest.mark.django_db
def test_equipment_photo_returns_404_for_unknown_pk():
    client = APIClient()
    user = UserFactory()
    client.force_authenticate(user=user)

    response = client.get("/api/equipments/99999/photo/")

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_accessory_photo_redirects_when_authenticated():
    client = APIClient()
    user = UserFactory()
    accessory = AccessoryFactory()
    client.force_authenticate(user=user)

    response = client.get(f"/api/accessories/{accessory.pk}/photo/")

    assert response.status_code == status.HTTP_302_FOUND
    assert response["Location"]


@pytest.mark.django_db
def test_accessory_label_redirects_when_authenticated():
    client = APIClient()
    user = UserFactory()
    accessory = AccessoryFactory()
    client.force_authenticate(user=user)

    response = client.get(f"/api/accessories/{accessory.pk}/label/")

    assert response.status_code == status.HTTP_302_FOUND


@pytest.mark.django_db
def test_equipment_serializer_returns_proxy_photo_urls():
    equipment = EquipmentFactory()

    data = EquipmentSerializer(equipment).data

    assert data["equipment_photo"] == (
        f"/api/equipments/{equipment.pk}/photo/"
    )
    assert data["label_photo"] == f"/api/equipments/{equipment.pk}/label/"


@pytest.mark.django_db
def test_accessory_serializer_returns_proxy_photo_urls():
    accessory = AccessoryFactory()

    data = AccessorySerializer(accessory).data

    assert data["equipment_photo"] == (
        f"/api/accessories/{accessory.pk}/photo/"
    )
    assert data["label_photo"] == (
        f"/api/accessories/{accessory.pk}/label/"
    )
