import pytest
from rest_framework import status
from rest_framework.test import APIClient
from tests.factories import ReportFactory, UnitFactory, UserFactory
from users.models import UserAccount

from clients_management.models import Report


@pytest.mark.django_db
def test_report_partial_update_description_only_updates_description():
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    unit = UnitFactory()
    report = ReportFactory(
        unit=unit,
        report_type=Report.ReportType.MEMORIAL,
        description="Descrição original.",
    )

    client.force_authenticate(user=prophy_manager)
    response = client.patch(
        f"/api/reports/{report.id}/",
        {"description": "Descrição atualizada."},
        format="multipart",
    )

    assert response.status_code == status.HTTP_200_OK
    report.refresh_from_db()
    assert report.description == "Descrição atualizada."


@pytest.mark.django_db
def test_report_partial_update_description_rejects_blank_value():
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    unit = UnitFactory()
    report = ReportFactory(
        unit=unit,
        report_type=Report.ReportType.MEMORIAL,
        description="Descrição original.",
    )

    client.force_authenticate(user=prophy_manager)
    response = client.patch(
        f"/api/reports/{report.id}/",
        {"description": ""},
        format="multipart",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "description" in response.data


@pytest.mark.django_db
def test_report_partial_update_forbidden_for_unit_manager():
    client = APIClient()
    unit = UnitFactory()
    unit_manager = UserFactory(role=UserAccount.Role.UNIT_MANAGER)
    unit.user = unit_manager
    unit.save()
    report = ReportFactory(unit=unit, report_type=Report.ReportType.MEMORIAL)

    client.force_authenticate(user=unit_manager)
    response = client.patch(
        f"/api/reports/{report.id}/",
        {"description": "Tentativa não autorizada."},
        format="multipart",
    )

    assert response.status_code == status.HTTP_403_FORBIDDEN
