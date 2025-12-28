import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from clients_management.models import Appointment
from users.models import UserAccount
from tests.factories import AppointmentFactory, ClientFactory, UnitFactory, UserFactory


def _appointment_payload(*, unit_id: int) -> dict:
    return {
        "unit": unit_id,
        "date": (timezone.now() + timezone.timedelta(days=1)).isoformat(),
        "type": Appointment.Type.IN_PERSON,
        "status": Appointment.Status.PENDING,
        "contact_phone": "11999999999",
        "contact_name": "Contact",
    }


@pytest.mark.django_db
def test_appointments_list_as_prophy_manager_returns_all():
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)

    AppointmentFactory()
    AppointmentFactory()

    client.force_authenticate(user=prophy_manager)
    response = client.get("/api/appointments/")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == Appointment.objects.count()


@pytest.mark.django_db
def test_appointments_list_as_commercial_returns_all():
    client = APIClient()
    commercial = UserFactory(role=UserAccount.Role.COMMERCIAL)

    AppointmentFactory()
    AppointmentFactory()

    client.force_authenticate(user=commercial)
    response = client.get("/api/appointments/")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == Appointment.objects.count()


@pytest.mark.django_db
def test_appointments_list_as_unit_manager_returns_only_managed_unit():
    client = APIClient()
    unit_manager = UserFactory(role=UserAccount.Role.UNIT_MANAGER)

    managed_unit = UnitFactory(user=unit_manager)
    other_unit = UnitFactory()

    managed_appointment = AppointmentFactory(unit=managed_unit)
    AppointmentFactory(unit=other_unit)

    client.force_authenticate(user=unit_manager)
    response = client.get("/api/appointments/")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1
    assert response.data["results"][0]["id"] == managed_appointment.id


@pytest.mark.django_db
def test_appointments_list_as_client_user_returns_only_client_appointments():
    client = APIClient()
    client_user = UserFactory(role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST)

    allowed_client = ClientFactory()
    allowed_client.users.add(client_user)
    allowed_unit = UnitFactory(client=allowed_client)

    denied_unit = UnitFactory()

    allowed_appointment = AppointmentFactory(unit=allowed_unit)
    AppointmentFactory(unit=denied_unit)

    client.force_authenticate(user=client_user)
    response = client.get("/api/appointments/")

    assert response.status_code == status.HTTP_200_OK
    assert response.data["count"] == 1
    assert response.data["results"][0]["id"] == allowed_appointment.id


@pytest.mark.django_db
def test_appointments_create_as_internal_physicist_requires_client_access():
    client = APIClient()
    internal = UserFactory(role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST)

    allowed_client = ClientFactory()
    allowed_client.users.add(internal)
    allowed_unit = UnitFactory(client=allowed_client)

    denied_unit = UnitFactory()

    client.force_authenticate(user=internal)

    ok_response = client.post(
        "/api/appointments/",
        _appointment_payload(unit_id=allowed_unit.id),
        format="json",
    )
    assert ok_response.status_code == status.HTTP_201_CREATED

    forbidden_response = client.post(
        "/api/appointments/",
        _appointment_payload(unit_id=denied_unit.id),
        format="json",
    )
    assert forbidden_response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_appointments_create_as_commercial_is_global():
    client = APIClient()
    commercial = UserFactory(role=UserAccount.Role.COMMERCIAL)
    any_unit = UnitFactory()

    client.force_authenticate(user=commercial)
    response = client.post(
        "/api/appointments/",
        _appointment_payload(unit_id=any_unit.id),
        format="json",
    )

    assert response.status_code == status.HTTP_201_CREATED


@pytest.mark.django_db
def test_appointments_update_as_internal_physicist_denied_when_not_client_user():
    client = APIClient()
    internal = UserFactory(role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST)

    denied_unit = UnitFactory()
    appointment = AppointmentFactory(unit=denied_unit)

    client.force_authenticate(user=internal)
    response = client.patch(
        f"/api/appointments/{appointment.id}/",
        {"contact_name": "New"},
        format="json",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_appointments_update_as_internal_physicist_allowed_when_client_user():
    client = APIClient()
    internal = UserFactory(role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST)

    allowed_client = ClientFactory()
    allowed_client.users.add(internal)
    allowed_unit = UnitFactory(client=allowed_client)
    appointment = AppointmentFactory(unit=allowed_unit)

    client.force_authenticate(user=internal)
    response = client.patch(
        f"/api/appointments/{appointment.id}/",
        {"contact_name": "New"},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["contact_name"] == "New"


@pytest.mark.django_db
def test_appointments_delete_only_prophy_manager():
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    commercial = UserFactory(role=UserAccount.Role.COMMERCIAL)
    appointment = AppointmentFactory()

    client.force_authenticate(user=commercial)
    forbidden = client.delete(f"/api/appointments/{appointment.id}/")
    assert forbidden.status_code == status.HTTP_403_FORBIDDEN

    client.force_authenticate(user=prophy_manager)
    ok = client.delete(f"/api/appointments/{appointment.id}/")
    assert ok.status_code == status.HTTP_204_NO_CONTENT
