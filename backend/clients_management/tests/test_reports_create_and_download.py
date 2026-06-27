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


# ── Create ────────────────────────────────────────────────────────────────────


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
            "pdf_file": _pdf_file_payload(),
            "word_file": _docx_file_payload(),
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
def test_report_create_rejects_missing_word_file():
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    unit = UnitFactory()
    equipment = EquipmentFactory(unit=unit)

    client.force_authenticate(user=prophy_manager)
    response = client.post(
        "/api/reports/",
        {
            "completion_date": date.today().isoformat(),
            "report_type": Report.ReportType.RADIOMETRIC_SURVEY,
            "equipment": equipment.id,
            "pdf_file": _pdf_file_payload(),
        },
        format="multipart",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "word_file" in response.data


@pytest.mark.django_db
def test_report_create_rejects_missing_pdf_file():
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    unit = UnitFactory()

    client.force_authenticate(user=prophy_manager)
    response = client.post(
        "/api/reports/",
        {
            "completion_date": date.today().isoformat(),
            "report_type": Report.ReportType.MEMORIAL,
            "unit": unit.id,
            "word_file": _docx_file_payload(),
        },
        format="multipart",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "pdf_file" in response.data


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
            "pdf_file": _pdf_file_payload(),
            "word_file": _docx_file_payload(),
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
            "pdf_file": _pdf_file_payload(),
            "word_file": _docx_file_payload(),
        },
        format="multipart",
    )

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "unit" in response.data


# ── PDF download ───────────────────────────────────────────────────────────────


@pytest.mark.django_db
def test_report_pdf_download_sets_content_type_and_filename():
    client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    unit = UnitFactory()

    report = Report.objects.create(
        unit=unit,
        completion_date=date(2020, 1, 1),
        report_type=Report.ReportType.MEMORIAL,
        pdf_file=_pdf_file_payload(),
    )

    client.force_authenticate(user=prophy_manager)
    response = client.get(f"/api/reports/{report.id}/download/pdf/")

    assert response.status_code == status.HTTP_200_OK
    assert response["Content-Type"].startswith("application/pdf")
    assert "filename=" in response["Content-Disposition"]
    assert response["Content-Disposition"].endswith('.pdf"')


@pytest.mark.django_db
def test_report_pdf_download_accessible_to_unit_manager():
    client = APIClient()
    unit = UnitFactory()
    unit_manager = UserFactory(role=UserAccount.Role.UNIT_MANAGER)
    unit.user = unit_manager
    unit.save()

    report = Report.objects.create(
        unit=unit,
        completion_date=date(2020, 1, 1),
        report_type=Report.ReportType.MEMORIAL,
        pdf_file=_pdf_file_payload(),
    )

    client.force_authenticate(user=unit_manager)
    response = client.get(f"/api/reports/{report.id}/download/pdf/")

    assert response.status_code == status.HTTP_200_OK


@pytest.mark.django_db
def test_report_pdf_download_accessible_to_client_general_manager():
    client_api = APIClient()
    unit = UnitFactory()
    ggc = UserFactory(role=UserAccount.Role.CLIENT_GENERAL_MANAGER)
    unit.client.users.add(ggc)

    report = Report.objects.create(
        unit=unit,
        completion_date=date(2020, 1, 1),
        report_type=Report.ReportType.MEMORIAL,
        pdf_file=_pdf_file_payload(),
    )

    client_api.force_authenticate(user=ggc)
    response = client_api.get(f"/api/reports/{report.id}/download/pdf/")

    assert response.status_code == status.HTTP_200_OK


# ── Word download ──────────────────────────────────────────────────────────────


@pytest.mark.django_db
@pytest.mark.parametrize(
    "role",
    [
        UserAccount.Role.PROPHY_MANAGER,
        UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST,
        UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST,
        UserAccount.Role.COMMERCIAL,
    ],
)
def test_report_word_download_allowed_for_privileged_roles(role):
    api_client = APIClient()
    unit = UnitFactory()
    user = UserFactory(role=role)
    unit.client.users.add(user)

    report = Report.objects.create(
        unit=unit,
        completion_date=date(2020, 1, 1),
        report_type=Report.ReportType.MEMORIAL,
        pdf_file=_pdf_file_payload(),
        word_file=_docx_file_payload(),
    )

    api_client.force_authenticate(user=user)
    response = api_client.get(f"/api/reports/{report.id}/download/word/")

    assert response.status_code == status.HTTP_200_OK
    assert response["Content-Type"].startswith(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
    assert response["Content-Disposition"].endswith('.docx"')


@pytest.mark.django_db
@pytest.mark.parametrize(
    "role",
    [
        UserAccount.Role.CLIENT_GENERAL_MANAGER,
        UserAccount.Role.UNIT_MANAGER,
    ],
)
def test_report_word_download_forbidden_for_client_roles(role):
    api_client = APIClient()
    unit = UnitFactory()
    user = UserFactory(role=role)
    if role == UserAccount.Role.UNIT_MANAGER:
        unit.user = user
        unit.save()
    else:
        unit.client.users.add(user)

    report = Report.objects.create(
        unit=unit,
        completion_date=date(2020, 1, 1),
        report_type=Report.ReportType.MEMORIAL,
        pdf_file=_pdf_file_payload(),
        word_file=_docx_file_payload(),
    )

    api_client.force_authenticate(user=user)
    response = api_client.get(f"/api/reports/{report.id}/download/word/")

    assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
def test_report_download_returns_404_for_missing_word_file():
    api_client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    unit = UnitFactory()

    report = Report.objects.create(
        unit=unit,
        completion_date=date(2020, 1, 1),
        report_type=Report.ReportType.MEMORIAL,
        pdf_file=_pdf_file_payload(),
    )

    api_client.force_authenticate(user=prophy_manager)
    response = api_client.get(f"/api/reports/{report.id}/download/word/")

    assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
def test_report_download_returns_400_for_invalid_file_type():
    api_client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    unit = UnitFactory()

    report = Report.objects.create(
        unit=unit,
        completion_date=date(2020, 1, 1),
        report_type=Report.ReportType.MEMORIAL,
        pdf_file=_pdf_file_payload(),
    )

    api_client.force_authenticate(user=prophy_manager)
    response = api_client.get(f"/api/reports/{report.id}/download/excel/")

    assert response.status_code == status.HTTP_400_BAD_REQUEST


# ── Serializer word_file visibility ───────────────────────────────────────────


@pytest.mark.django_db
def test_report_serializer_hides_word_file_for_client_roles():
    api_client = APIClient()
    unit = UnitFactory()
    ggc = UserFactory(role=UserAccount.Role.CLIENT_GENERAL_MANAGER)
    unit.client.users.add(ggc)

    report = Report.objects.create(
        unit=unit,
        completion_date=date(2020, 1, 1),
        report_type=Report.ReportType.MEMORIAL,
        pdf_file=_pdf_file_payload(),
        word_file=_docx_file_payload(),
    )

    api_client.force_authenticate(user=ggc)
    response = api_client.get(f"/api/reports/{report.id}/")

    assert response.status_code == status.HTTP_200_OK
    assert "word_file" not in response.data


@pytest.mark.django_db
def test_report_serializer_exposes_word_file_for_prophy_manager():
    api_client = APIClient()
    prophy_manager = UserFactory(role=UserAccount.Role.PROPHY_MANAGER)
    unit = UnitFactory()

    report = Report.objects.create(
        unit=unit,
        completion_date=date(2020, 1, 1),
        report_type=Report.ReportType.MEMORIAL,
        pdf_file=_pdf_file_payload(),
        word_file=_docx_file_payload(),
    )

    api_client.force_authenticate(user=prophy_manager)
    response = api_client.get(f"/api/reports/{report.id}/")

    assert response.status_code == status.HTTP_200_OK
    assert "word_file" in response.data
