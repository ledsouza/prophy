from datetime import date

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APIClient
from tests.factories import UnitFactory, UserFactory
from users.models import UserAccount

from clients_management.models import Report


def _pdf_file_payload() -> SimpleUploadedFile:
    return SimpleUploadedFile(
        "report.pdf",
        b"%PDF-1.4\ncontent",
        content_type="application/pdf",
    )


@pytest.mark.django_db
def test_report_create_auto_archives_existing_active_report_for_same_unit_and_type():
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    unit = UnitFactory()

    report_a = Report.objects.create(
        unit=unit,
        report_type=Report.ReportType.MEMORIAL,
        completion_date=date(2020, 1, 1),
        file=_pdf_file_payload(),
    )
    assert report_a.is_deleted is False

    client.force_authenticate(user=prophy_manager)
    response = client.post(
        "/api/reports/",
        {
            "completion_date": date(2021, 1, 1).isoformat(),
            "report_type": Report.ReportType.MEMORIAL,
            "unit": unit.id,
            "file": _pdf_file_payload(),
        },
        format="multipart",
    )

    assert response.status_code == status.HTTP_201_CREATED

    report_a.refresh_from_db()
    assert report_a.is_deleted is True
    assert report_a.deleted_by == prophy_manager

    report_b = Report.objects.get(pk=response.data["id"])
    assert report_b.is_deleted is False


@pytest.mark.django_db
def test_report_create_auto_archives_only_matching_entity_and_type():
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    unit_a = UnitFactory()
    unit_b = UnitFactory()

    report_a = Report.objects.create(
        unit=unit_a,
        report_type=Report.ReportType.MEMORIAL,
        completion_date=date(2020, 1, 1),
        file=_pdf_file_payload(),
    )
    report_other_unit = Report.objects.create(
        unit=unit_b,
        report_type=Report.ReportType.MEMORIAL,
        completion_date=date(2020, 1, 1),
        file=_pdf_file_payload(),
    )

    client.force_authenticate(user=prophy_manager)
    response = client.post(
        "/api/reports/",
        {
            "completion_date": date(2021, 1, 1).isoformat(),
            "report_type": Report.ReportType.MEMORIAL,
            "unit": unit_a.id,
            "file": _pdf_file_payload(),
        },
        format="multipart",
    )

    assert response.status_code == status.HTTP_201_CREATED

    report_a.refresh_from_db()
    assert report_a.is_deleted is True

    report_other_unit.refresh_from_db()
    assert report_other_unit.is_deleted is False
