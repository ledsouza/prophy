from datetime import date, timedelta

import pytest
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile

from clients_management.models import Report
from tests.factories import EquipmentFactory, UnitFactory


def _pdf_file(name: str = "report.pdf") -> SimpleUploadedFile:
    return SimpleUploadedFile(
        name,
        b"PDF content",
        content_type="application/pdf",
    )


@pytest.mark.django_db
def test_report_clean_equipment_only_requires_equipment_and_forbids_unit():
    unit = UnitFactory()
    equipment = EquipmentFactory(unit=unit)

    report_missing_equipment = Report(
        unit=unit,
        completion_date=date.today(),
        report_type=Report.ReportType.QUALITY_CONTROL,
        file=_pdf_file(),
    )

    with pytest.raises(ValidationError):
        report_missing_equipment.full_clean()

    report_with_unit_and_equipment = Report(
        unit=unit,
        equipment=equipment,
        completion_date=date.today(),
        report_type=Report.ReportType.QUALITY_CONTROL,
        file=_pdf_file(),
    )

    with pytest.raises(ValidationError):
        report_with_unit_and_equipment.full_clean()


@pytest.mark.django_db
def test_report_clean_unit_only_requires_unit_and_forbids_equipment():
    unit = UnitFactory()
    equipment = EquipmentFactory(unit=unit)

    report_missing_unit = Report(
        equipment=equipment,
        completion_date=date.today(),
        report_type=Report.ReportType.MEMORIAL,
        file=_pdf_file(),
    )

    with pytest.raises(ValidationError):
        report_missing_unit.full_clean()

    report_with_unit_and_equipment = Report(
        unit=unit,
        equipment=equipment,
        completion_date=date.today(),
        report_type=Report.ReportType.MEMORIAL,
        file=_pdf_file(),
    )

    with pytest.raises(ValidationError):
        report_with_unit_and_equipment.full_clean()


@pytest.mark.django_db
def test_report_save_due_date_is_4_years_for_radiometric_survey():
    unit = UnitFactory()
    equipment = EquipmentFactory(unit=unit)
    completion_date = date(2020, 1, 1)

    report = Report.objects.create(
        equipment=equipment,
        completion_date=completion_date,
        report_type=Report.ReportType.RADIOMETRIC_SURVEY,
        file=_pdf_file(),
    )

    assert report.due_date == completion_date + timedelta(days=4 * 365)


@pytest.mark.django_db
def test_report_save_due_date_is_1_year_for_other_types():
    unit = UnitFactory()
    completion_date = date(2020, 1, 1)

    report = Report.objects.create(
        unit=unit,
        completion_date=completion_date,
        report_type=Report.ReportType.MEMORIAL,
        file=_pdf_file(),
    )

    assert report.due_date == completion_date + timedelta(days=365)
