import pytest
from rest_framework import status
from rest_framework.test import APIClient

from clients_management.models import Appointment
from users.models import UserAccount
from tests.factories import (
    AppointmentFactory,
    ClientFactory,
    EquipmentFactory,
    ServiceOrderFactory,
    UnitFactory,
    UserFactory,
)


@pytest.mark.django_db
def test_service_order_create_requires_role_permission():
    client = APIClient()
    commercial = UserFactory(role=UserAccount.Role.COMMERCIAL)
    appointment = AppointmentFactory()

    client.force_authenticate(user=commercial)
    response = client.post(
        "/api/service-orders/",
        {
            "subject": "X",
            "description": "Y",
            "conclusion": "Z",
            "appointment": appointment.id,
        },
        format="json",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_service_order_create_requires_appointment_access_for_physicist():
    client = APIClient()
    internal = UserFactory(role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST)
    appointment = AppointmentFactory()

    client.force_authenticate(user=internal)
    response = client.post(
        "/api/service-orders/",
        {
            "subject": "X",
            "description": "Y",
            "conclusion": "Z",
            "appointment": appointment.id,
        },
        format="json",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_service_order_create_sets_appointment_service_order_and_status_fulfilled():
    client = APIClient()
    internal = UserFactory(role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST)

    client_model = ClientFactory()
    client_model.users.add(internal)
    unit = UnitFactory(client=client_model)
    appointment = AppointmentFactory(unit=unit, status=Appointment.Status.PENDING)

    client.force_authenticate(user=internal)
    response = client.post(
        "/api/service-orders/",
        {
            "subject": "X",
            "description": "Y",
            "conclusion": "Z",
            "appointment": appointment.id,
        },
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED

    appointment.refresh_from_db()
    assert appointment.service_order_id is not None
    assert appointment.status == Appointment.Status.FULFILLED


@pytest.mark.django_db
def test_service_order_create_rejects_missing_appointment():
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)

    client.force_authenticate(user=prophy_manager)
    response = client.post(
        "/api/service-orders/",
        {
            "subject": "X",
            "description": "Y",
            "conclusion": "Z",
            "appointment": 999999,
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert response.data["appointment"][0] == "Appointment not found."


@pytest.mark.django_db
def test_service_order_create_rejects_missing_required_appointment_field():
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)

    client.force_authenticate(user=prophy_manager)
    response = client.post(
        "/api/service-orders/",
        {
            "subject": "X",
            "description": "Y",
            "conclusion": "Z",
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "appointment" in response.data


@pytest.mark.django_db
def test_service_order_create_rejects_visit_payload_alias():
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    appointment = AppointmentFactory()

    client.force_authenticate(user=prophy_manager)
    response = client.post(
        "/api/service-orders/",
        {
            "subject": "X",
            "description": "Y",
            "conclusion": "Z",
            "visit": appointment.id,
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "appointment" in response.data


@pytest.mark.django_db
def test_service_order_create_rejects_duplicate_for_appointment():
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    appointment = AppointmentFactory()

    client.force_authenticate(user=prophy_manager)
    first = client.post(
        "/api/service-orders/",
        {
            "subject": "X",
            "description": "Y",
            "conclusion": "Z",
            "appointment": appointment.id,
        },
        format="json",
    )
    assert first.status_code == status.HTTP_201_CREATED

    second = client.post(
        "/api/service-orders/",
        {
            "subject": "X2",
            "description": "Y2",
            "conclusion": "Z2",
            "appointment": appointment.id,
        },
        format="json",
    )
    assert second.status_code == status.HTTP_400_BAD_REQUEST


@pytest.mark.django_db
def test_service_order_create_rejects_wrong_unit_equipments():
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)

    appointment_unit = UnitFactory()
    appointment = AppointmentFactory(unit=appointment_unit)
    wrong_equipment = EquipmentFactory()

    client.force_authenticate(user=prophy_manager)
    response = client.post(
        "/api/service-orders/",
        {
            "subject": "X",
            "description": "Y",
            "conclusion": "Z",
            "appointment": appointment.id,
            "equipments": [wrong_equipment.id],
        },
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "equipments" in response.data


@pytest.mark.django_db
def test_service_order_update_as_gp_validates_nonexistent_equipment_ids():
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)

    appointment = AppointmentFactory()
    order = ServiceOrderFactory()
    appointment.service_order = order
    appointment.save(update_fields=["service_order"])

    client.force_authenticate(user=prophy_manager)
    response = client.patch(
        f"/api/service-orders/{order.id}/",
        {"equipments": [999999]},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "equipments" in response.data


@pytest.mark.django_db
def test_service_order_update_as_gp_validates_wrong_unit_equipment_ids():
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)

    appointment_unit = UnitFactory()
    appointment = AppointmentFactory(unit=appointment_unit)
    order = ServiceOrderFactory()
    appointment.service_order = order
    appointment.save(update_fields=["service_order"])

    wrong_unit_equipment = EquipmentFactory()

    client.force_authenticate(user=prophy_manager)
    response = client.patch(
        f"/api/service-orders/{order.id}/",
        {"equipments": [wrong_unit_equipment.id]},
        format="json",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "equipments" in response.data


@pytest.mark.django_db
def test_service_order_update_as_physicist_allows_only_patch_updates_field():
    client = APIClient()
    internal = UserFactory(role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST)

    client_model = ClientFactory()
    client_model.users.add(internal)
    unit = UnitFactory(client=client_model)
    appointment = AppointmentFactory(unit=unit)
    order = ServiceOrderFactory()
    appointment.service_order = order
    appointment.save(update_fields=["service_order"])

    client.force_authenticate(user=internal)

    put_resp = client.put(
        f"/api/service-orders/{order.id}/",
        {"updates": "x"},
        format="json",
    )
    assert put_resp.status_code == status.HTTP_403_FORBIDDEN

    bad_patch = client.patch(
        f"/api/service-orders/{order.id}/",
        {"subject": "nope"},
        format="json",
    )
    assert bad_patch.status_code == status.HTTP_403_FORBIDDEN

    ok_patch = client.patch(
        f"/api/service-orders/{order.id}/",
        {"updates": "new"},
        format="json",
    )
    assert ok_patch.status_code == status.HTTP_200_OK
    assert ok_patch.data["updates"] == "new"


@pytest.mark.django_db
def test_service_order_update_as_physicist_requires_appointment_access():
    client = APIClient()
    internal = UserFactory(role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST)
    appointment = AppointmentFactory()

    order = ServiceOrderFactory()
    appointment.service_order = order
    appointment.save(update_fields=["service_order"])

    client.force_authenticate(user=internal)
    response = client.patch(
        f"/api/service-orders/{order.id}/",
        {"updates": "new"},
        format="json",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_service_order_pdf_download_access_matrix():
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    unit_manager = UserFactory(role=UserAccount.Role.UNIT_MANAGER)
    client_user = UserFactory(role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST)
    outsider = UserFactory(role=UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST)

    client_model = ClientFactory()
    client_model.users.add(client_user)
    unit = UnitFactory(client=client_model, user=unit_manager)
    appointment = AppointmentFactory(unit=unit)
    order = ServiceOrderFactory()
    appointment.service_order = order
    appointment.save(update_fields=["service_order"])

    url = f"/api/service-orders/{order.id}/pdf/"

    client.force_authenticate(user=prophy_manager)
    gp_resp = client.get(url)
    assert gp_resp.status_code == status.HTTP_200_OK
    assert gp_resp["Content-Type"].startswith("application/pdf")

    client.force_authenticate(user=unit_manager)
    um_resp = client.get(url)
    assert um_resp.status_code == status.HTTP_200_OK

    client.force_authenticate(user=client_user)
    cu_resp = client.get(url)
    assert cu_resp.status_code == status.HTTP_200_OK

    client.force_authenticate(user=outsider)
    denied = client.get(url)
    assert denied.status_code == status.HTTP_403_FORBIDDEN
