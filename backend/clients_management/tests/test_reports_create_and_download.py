from datetime import date, timedelta

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework import status
from rest_framework.test import APIClient

from clients_management.models import Report
from users.models import UserAccount
from tests.factories import EquipmentFactory, UnitFactory, UserFactory


def _pdf_file_payload() -> SimpleUploadedFile:
    return SimpleUploadedFile(
        "report.pdf",
        b"%PDF-1.4\ncontent",
        content_type="application/pdf",
    )


def _docx_file_payload() -> SimpleUploadedFile:
    return SimpleUploadedFile(
        "report.docx",
        b"docx content",
        content_type=(
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ),
    )


@pytest.mark.django_db
def test_report_create_enforces_equipment_only_and_sets_due_date():
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    unit = UnitFactory()
    equipment = EquipmentFactory(unit=unit)

    client.force_authenticate(user=prophy_manager)
    response = client.post(
        "/api/reports/",
        {
            "completion_date": date(2020, 1, 1).isoformat(),
            "report_type": Report.ReportType.RADIOMETRIC_SURVEY,
            "equipment": equipment.id,
            "file": _pdf_file_payload(),
        },
        format="multipart",
    )

    assert response.status_code == status.HTTP_201_CREATED
    assert (
        response.data["due_date"]
        == (date(2020, 1, 1) + timedelta(days=4 * 365)).isoformat()
    )

    report_id = response.data["id"]
    assert Report.objects.filter(id=report_id).exists()


@pytest.mark.django_db
def test_report_create_rejects_missing_equipment_for_equipment_only_type():
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)

    client.force_authenticate(user=prophy_manager)
    response = client.post(
        "/api/reports/",
        {
            "completion_date": date.today().isoformat(),
            "report_type": Report.ReportType.QUALITY_CONTROL,
            "file": _pdf_file_payload(),
        },
        format="multipart",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "equipment" in response.data


@pytest.mark.django_db
def test_report_create_rejects_missing_unit_for_unit_only_type():
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)

    client.force_authenticate(user=prophy_manager)
    response = client.post(
        "/api/reports/",
        {
            "completion_date": date.today().isoformat(),
            "report_type": Report.ReportType.MEMORIAL,
            "file": _pdf_file_payload(),
        },
        format="multipart",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "unit" in response.data


@pytest.mark.django_db
def test_report_file_download_sets_content_type_and_filename_for_pdf():
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    unit = UnitFactory()

    report = Report.objects.create(
        unit=unit,
        completion_date=date(2020, 1, 1),
        report_type=Report.ReportType.MEMORIAL,
        file=_pdf_file_payload(),
    )

    client.force_authenticate(user=prophy_manager)
    response = client.get(f"/api/reports/{report.id}/download/")

    assert response.status_code == status.HTTP_200_OK
    assert response["Content-Type"].startswith("application/pdf")
    assert "filename=" in response["Content-Disposition"]
    assert response["Content-Disposition"].endswith('.pdf"')


@pytest.mark.django_db
def test_report_file_download_sets_content_type_and_filename_for_docx():
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    unit = UnitFactory()

    report = Report.objects.create(
        unit=unit,
        completion_date=date(2020, 1, 1),
        report_type=Report.ReportType.MEMORIAL,
        file=_docx_file_payload(),
    )

    client.force_authenticate(user=prophy_manager)
    response = client.get(f"/api/reports/{report.id}/download/")

    assert response.status_code == status.HTTP_200_OK
    assert response["Content-Type"].startswith(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
    assert "filename=" in response["Content-Disposition"]
    assert response["Content-Disposition"].endswith('.docx"')
