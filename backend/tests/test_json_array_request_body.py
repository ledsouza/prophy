import pytest
from django.urls import reverse
from rest_framework import status

from tests.factories.clients_management import (
    EquipmentFactory,
    ReportFactory,
    ServiceOrderFactory,
)


@pytest.mark.django_db
def test_material_create_rejects_json_array(api_client, internal_physicist):
    # ARRANGE
    api_client.force_authenticate(user=internal_physicist)

    # ACT
    response = api_client.post(
        reverse("materials-list"), [{"visibility": "PUB"}], format="json"
    )

    # ASSERT
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_appointment_create_rejects_json_array(api_client, prophy_manager):
    # ARRANGE
    api_client.force_authenticate(user=prophy_manager)

    # ACT
    response = api_client.post(
        reverse("appointments-list"), [{"unit": 1}], format="json"
    )

    # ASSERT
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_service_order_patch_rejects_json_array(
    api_client, internal_physicist
):
    # ARRANGE
    order = ServiceOrderFactory()
    api_client.force_authenticate(user=internal_physicist)

    # ACT
    response = api_client.patch(
        reverse("service-orders-detail", args=[order.pk]),
        [{"updates": "Troca de tubo"}],
        format="json",
    )

    # ASSERT
    assert response.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_report_delete_rejects_json_array(api_client, prophy_manager):
    # ARRANGE
    report = ReportFactory(unit=None, equipment=EquipmentFactory())
    api_client.force_authenticate(user=prophy_manager)

    # ACT
    response = api_client.delete(
        reverse("reports-detail", args=[report.pk]),
        [{"hard": "true"}],
        format="json",
    )

    # ASSERT
    assert response.status_code == status.HTTP_400_BAD_REQUEST
