"""
Tests for Report soft delete functionality.

This module tests:
- Soft delete behavior for different user roles
- Hard delete (permanent) restricted to PROPHY_MANAGER
- Visibility of soft-deleted reports (GP sees all, others don't)
- Download permissions for soft-deleted reports
- Audit trail (deleted_by field)
- Report restoration
- Manager and QuerySet behavior
"""

from datetime import date

import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from users.models import UserAccount

from clients_management.models import Client, Equipment, Modality, Report, Unit


@pytest.fixture
def api_client():
    """Fixture to provide an API client instance."""
    return APIClient()


@pytest.fixture
def prophy_manager(db):
    """Create a Prophy Manager user."""
    return UserAccount.objects.create_user(
        email="gp@prophy.com",
        password="testpass123",
        name="Gerente Prophy",
        cpf="12345678901",
        phone="11999999999",
        role=UserAccount.Role.PROPHY_MANAGER,
    )


@pytest.fixture
def internal_physicist(db):
    """Create an Internal Medical Physicist user."""
    return UserAccount.objects.create_user(
        email="fmi@prophy.com",
        password="testpass123",
        name="Físico Médico Interno",
        cpf="12345678902",
        phone="11999999998",
        role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST,
    )


@pytest.fixture
def external_physicist(db):
    """Create an External Medical Physicist user."""
    return UserAccount.objects.create_user(
        email="fme@prophy.com",
        password="testpass123",
        name="Físico Médico Externo",
        cpf="12345678903",
        phone="11999999997",
        role=UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST,
    )


@pytest.fixture
def client_with_unit_and_equipment(db, internal_physicist):
    """Create a client with unit and equipment for testing."""
    client = Client.objects.create(
        name="Hospital Test",
        cnpj="12345678000190",
        email="hospital@test.com",
        phone="1199999999",
        address="Test Address",
        state="SP",
        city="São Paulo",
        is_active=True,
    )
    client.users.add(internal_physicist)

    unit = Unit.objects.create(
        name="Unidade Central",
        cnpj="12345678000191",
        email="unit@test.com",
        phone="1199999998",
        address="Unit Address",
        city="São Paulo",
        state="SP",
        client=client,
    )

    modality = Modality.objects.create(
        name="Raio-X",
        accessory_type=Modality.AccessoryType.DETECTOR,
    )

    image = SimpleUploadedFile(
        "test.jpg",
        b"file_content",
        content_type="image/jpeg",
    )

    equipment = Equipment.objects.create(
        unit=unit,
        modality=modality,
        manufacturer="Test Manufacturer",
        model="Test Model",
        series_number="123456",
        equipment_photo=image,
        label_photo=image,
    )

    return {"client": client, "unit": unit, "equipment": equipment}


@pytest.fixture
def report_for_unit(client_with_unit_and_equipment):
    """Create a report associated with a unit."""
    unit = client_with_unit_and_equipment["unit"]

    report_file = SimpleUploadedFile(
        "report.pdf",
        b"PDF content",
        content_type="application/pdf",
    )

    return Report.objects.create(
        unit=unit,
        report_type=Report.ReportType.MEMORIAL,
        completion_date=date.today(),
        file=report_file,
    )


@pytest.fixture
def report_for_equipment(client_with_unit_and_equipment):
    """Create a report associated with an equipment."""
    equipment = client_with_unit_and_equipment["equipment"]

    report_file = SimpleUploadedFile(
        "report.pdf",
        b"PDF content",
        content_type="application/pdf",
    )

    return Report.objects.create(
        equipment=equipment,
        report_type=Report.ReportType.QUALITY_CONTROL,
        completion_date=date.today(),
        file=report_file,
    )


@pytest.mark.django_db
class TestReportSoftDeleteModel:
    """Test soft delete functionality at the model level."""

    def test_soft_delete_sets_deleted_at(self, report_for_unit, prophy_manager):
        """Soft deleting a report should set deleted_at timestamp."""
        assert report_for_unit.deleted_at is None
        assert not report_for_unit.is_deleted

        report_for_unit.soft_delete(deleted_by=prophy_manager)

        assert report_for_unit.deleted_at is not None
        assert report_for_unit.is_deleted
        assert report_for_unit.deleted_by == prophy_manager

    def test_soft_delete_requires_deleted_by(self, report_for_unit):
        """Soft delete requires deleted_by parameter."""
        with pytest.raises(ValueError, match="deleted_by is required"):
            report_for_unit.soft_delete(deleted_by=None)

    def test_restore_clears_deleted_at(self, report_for_unit, prophy_manager):
        """Restoring a soft-deleted report should clear deleted_at."""
        report_for_unit.soft_delete(deleted_by=prophy_manager)
        assert report_for_unit.is_deleted

        report_for_unit.restore()

        assert report_for_unit.deleted_at is None
        assert not report_for_unit.is_deleted
        assert report_for_unit.deleted_by is None

    def test_default_manager_excludes_deleted(
        self,
        report_for_unit,
        prophy_manager,
    ):
        """Default manager (objects) should exclude soft-deleted reports."""
        report_id = report_for_unit.id

        assert Report.objects.filter(id=report_id).exists()

        report_for_unit.soft_delete(deleted_by=prophy_manager)
        assert not Report.objects.filter(id=report_id).exists()
        assert Report.all_objects.filter(id=report_id).exists()

    def test_all_objects_manager_includes_deleted(
        self,
        report_for_unit,
        prophy_manager,
    ):
        """all_objects manager should include soft-deleted reports."""
        report_id = report_for_unit.id

        assert Report.objects.filter(id=report_id).exists()
        assert Report.all_objects.filter(id=report_id).exists()

        report_for_unit.soft_delete(deleted_by=prophy_manager)
        assert not Report.objects.filter(id=report_id).exists()
        assert Report.all_objects.filter(id=report_id).exists()

    def test_queryset_active_method(self, report_for_unit, prophy_manager):
        """QuerySet active() method should filter out deleted reports."""
        report_id = report_for_unit.id

        assert Report.all_objects.active().filter(id=report_id).exists()

        report_for_unit.soft_delete(deleted_by=prophy_manager)
        assert not Report.all_objects.active().filter(id=report_id).exists()

    def test_queryset_deleted_method(self, report_for_unit, prophy_manager):
        """QuerySet deleted() method should return only deleted reports."""
        report_id = report_for_unit.id

        assert not Report.all_objects.deleted().filter(id=report_id).exists()

        report_for_unit.soft_delete(deleted_by=prophy_manager)
        assert Report.all_objects.deleted().filter(id=report_id).exists()

    def test_queryset_soft_delete_bulk(
        self,
        report_for_unit,
        report_for_equipment,
        prophy_manager,
    ):
        """QuerySet soft_delete() should soft delete multiple reports."""
        assert Report.objects.count() == 2

        Report.objects.all().soft_delete(deleted_by=prophy_manager)
        assert Report.objects.count() == 0
        assert Report.all_objects.count() == 2

        for report in Report.all_objects.all():
            assert report.is_deleted
            assert report.deleted_by == prophy_manager


@pytest.mark.django_db
class TestReportSoftDeleteAPI:
    """Test soft delete via API endpoints."""

    def test_non_gp_user_cannot_soft_delete(
        self,
        api_client,
        internal_physicist,
        report_for_unit,
    ):
        """Non-GP users cannot delete (archive) reports."""
        api_client.force_authenticate(user=internal_physicist)
        url = reverse("reports-detail", kwargs={"pk": report_for_unit.id})

        response = api_client.delete(url)

        assert response.status_code == status.HTTP_403_FORBIDDEN

        report_for_unit.refresh_from_db()
        assert report_for_unit.is_deleted is False

    def test_gp_can_soft_delete(
        self,
        api_client,
        prophy_manager,
        report_for_unit,
    ):
        """GP can soft delete reports."""
        api_client.force_authenticate(user=prophy_manager)
        url = reverse("reports-detail", kwargs={"pk": report_for_unit.id})

        response = api_client.delete(url)

        assert response.status_code == status.HTTP_204_NO_CONTENT

        report_for_unit.refresh_from_db()
        assert report_for_unit.is_deleted
        assert report_for_unit.deleted_by == prophy_manager

    def test_gp_can_hard_delete(
        self,
        api_client,
        prophy_manager,
        report_for_unit,
    ):
        """GP can permanently delete reports with ?hard=true."""
        api_client.force_authenticate(user=prophy_manager)
        report_id = report_for_unit.id
        url = reverse("reports-detail", kwargs={"pk": report_id})

        response = api_client.delete(url, {"hard": "true"})

        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert Report.all_objects.filter(id=report_id).exists()

        api_client.delete(url)
        response = api_client.delete(url, {"hard": "true"})
        assert response.status_code == status.HTTP_204_NO_CONTENT
        assert not Report.all_objects.filter(id=report_id).exists()

    def test_non_gp_cannot_hard_delete(
        self,
        api_client,
        internal_physicist,
        report_for_unit,
    ):
        """Non-GP users cannot permanently delete reports."""
        api_client.force_authenticate(user=internal_physicist)
        report_id = report_for_unit.id
        url = reverse("reports-detail", kwargs={"pk": report_id})

        response = api_client.delete(url, {"hard": "true"})

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert Report.all_objects.filter(id=report_id).exists()

    def test_hard_delete_invalid_boolean(
        self,
        api_client,
        prophy_manager,
        report_for_unit,
    ):
        """Invalid hard parameter values should be treated as false."""
        api_client.force_authenticate(user=prophy_manager)
        report_id = report_for_unit.id
        url = reverse("reports-detail", kwargs={"pk": report_id})

        response = api_client.delete(url, {"hard": "invalid"})

        assert response.status_code == status.HTTP_204_NO_CONTENT

        report_for_unit.refresh_from_db()
        assert report_for_unit.is_deleted
        assert Report.all_objects.filter(id=report_id).exists()


@pytest.mark.django_db
class TestReportSoftDeleteVisibility:
    """Test visibility of soft-deleted reports for different roles."""

    def test_gp_sees_soft_deleted_reports_in_list(
        self,
        api_client,
        prophy_manager,
        report_for_unit,
        internal_physicist,
    ):
        """GP should see soft-deleted reports in list view."""
        report_for_unit.soft_delete(deleted_by=internal_physicist)

        api_client.force_authenticate(user=prophy_manager)
        url = reverse("reports-list")

        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1

        report_data = response.data["results"][0]
        assert report_data["is_deleted"] is True

    def test_gp_can_retrieve_soft_deleted_report(
        self,
        api_client,
        prophy_manager,
        report_for_unit,
    ):
        """GP can retrieve a soft-deleted report by ID."""
        report_for_unit.soft_delete(deleted_by=prophy_manager)

        api_client.force_authenticate(user=prophy_manager)
        url = reverse("reports-detail", kwargs={"pk": report_for_unit.id})

        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_deleted"] is True

    def test_gp_sees_is_deleted_false_for_active_reports(
        self,
        api_client,
        prophy_manager,
        report_for_unit,
    ):
        """GP should see is_deleted=false for active reports."""
        api_client.force_authenticate(user=prophy_manager)
        url = reverse("reports-detail", kwargs={"pk": report_for_unit.id})

        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_deleted"] is False


@pytest.mark.django_db
class TestReportSoftDeleteDownload:
    """Test download permissions for soft-deleted reports."""

    def test_gp_can_download_soft_deleted_report(
        self,
        api_client,
        prophy_manager,
        report_for_unit,
    ):
        """GP can download soft-deleted reports."""
        report_for_unit.soft_delete(deleted_by=prophy_manager)

        api_client.force_authenticate(user=prophy_manager)
        url = reverse("report-file-download", kwargs={"report_id": report_for_unit.id})

        response = api_client.get(url)
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_302_FOUND,
        ]

    def test_unit_manager_cannot_download_soft_deleted_report(
        self,
        api_client,
        report_for_unit,
        prophy_manager,
    ):
        """Unit Manager cannot download soft-deleted reports."""
        unit_manager = UserAccount.objects.create_user(
            email="unit_manager@prophy.com",
            password="testpass123",
            name="Gerente de Unidade",
            cpf="12345678920",
            phone="11999999920",
            role=UserAccount.Role.UNIT_MANAGER,
        )

        report_for_unit.soft_delete(deleted_by=prophy_manager)

        api_client.force_authenticate(user=unit_manager)
        url = reverse("report-file-download", kwargs={"report_id": report_for_unit.id})

        response = api_client.get(url)
        assert response.status_code == status.HTTP_404_NOT_FOUND


@pytest.mark.django_db
class TestReportSoftDeleteVisibilityPhysicists:
    def test_physicist_sees_soft_deleted_reports_in_list(
        self,
        api_client,
        internal_physicist,
        report_for_unit,
        prophy_manager,
    ):
        report_for_unit.soft_delete(deleted_by=prophy_manager)

        api_client.force_authenticate(user=internal_physicist)
        url = reverse("reports-list")

        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["is_deleted"] is True

    def test_physicist_can_retrieve_soft_deleted_report(
        self,
        api_client,
        internal_physicist,
        report_for_unit,
        prophy_manager,
    ):
        report_for_unit.soft_delete(deleted_by=prophy_manager)

        api_client.force_authenticate(user=internal_physicist)
        url = reverse("reports-detail", kwargs={"pk": report_for_unit.id})

        response = api_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert response.data["is_deleted"] is True

    def test_physicist_can_download_soft_deleted_report(
        self,
        api_client,
        internal_physicist,
        report_for_unit,
        prophy_manager,
    ):
        report_for_unit.soft_delete(deleted_by=prophy_manager)

        api_client.force_authenticate(user=internal_physicist)
        url = reverse("report-file-download", kwargs={"report_id": report_for_unit.id})

        response = api_client.get(url)
        assert response.status_code in [
            status.HTTP_200_OK,
            status.HTTP_302_FOUND,
        ]


@pytest.mark.django_db
class TestReportSoftDeleteAuditTrail:
    """Test audit trail functionality for soft delete."""

    def test_deleted_by_field_is_set(
        self,
        api_client,
        report_for_unit,
    ):
        """deleted_by field should be set when soft deleting via API."""
        prophy_manager = UserAccount.objects.create_user(
            email="gp2@prophy.com",
            password="testpass123",
            name="Gerente Prophy 2",
            cpf="12345678921",
            phone="11999999921",
            role=UserAccount.Role.PROPHY_MANAGER,
        )

        api_client.force_authenticate(user=prophy_manager)
        url = reverse("reports-detail", kwargs={"pk": report_for_unit.id})

        api_client.delete(url)

        report_for_unit.refresh_from_db()
        assert report_for_unit.deleted_by == prophy_manager

    def test_deleted_by_preserved_on_hard_delete_attempt_by_non_gp(
        self,
        api_client,
        internal_physicist,
        report_for_unit,
    ):
        """
        When non-GP tries hard delete and fails.
        the report should remain soft-deleted with original deleted_by.
        """
        prophy_manager = UserAccount.objects.create_user(
            email="gp3@prophy.com",
            password="testpass123",
            name="Gerente Prophy 3",
            cpf="12345678922",
            phone="11999999922",
            role=UserAccount.Role.PROPHY_MANAGER,
        )

        url = reverse("reports-detail", kwargs={"pk": report_for_unit.id})

        api_client.force_authenticate(user=prophy_manager)
        api_client.delete(url)

        report_for_unit.refresh_from_db()
        original_deleted_by = report_for_unit.deleted_by
        original_deleted_at = report_for_unit.deleted_at

        api_client.force_authenticate(user=internal_physicist)
        response = api_client.delete(url, {"hard": "true"})
        assert response.status_code == status.HTTP_403_FORBIDDEN

        report_for_unit.refresh_from_db()
        assert report_for_unit.deleted_by == original_deleted_by
        assert report_for_unit.deleted_at == original_deleted_at


@pytest.mark.django_db
class TestReportSoftDeleteEdgeCases:
    """Test edge cases for soft delete functionality."""

    def test_soft_delete_already_deleted_report(
        self,
        api_client,
        prophy_manager,
        report_for_unit,
    ):
        """Soft deleting an already soft-deleted report should succeed."""
        report_for_unit.soft_delete(deleted_by=prophy_manager)

        api_client.force_authenticate(user=prophy_manager)
        url = reverse("reports-detail", kwargs={"pk": report_for_unit.id})

        response = api_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT

    def test_hard_delete_nonexistent_report(
        self,
        api_client,
        prophy_manager,
    ):
        """Hard deleting a non-existent report should return 404."""
        api_client.force_authenticate(user=prophy_manager)
        url = reverse("reports-detail", kwargs={"pk": 99999})

        response = api_client.delete(url, {"hard": "true"})
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_soft_delete_nonexistent_report(
        self,
        api_client,
        internal_physicist,
    ):
        """Soft deleting a non-existent report should return 403 for non-GP."""
        api_client.force_authenticate(user=internal_physicist)
        url = reverse("reports-detail", kwargs={"pk": 99999})

        response = api_client.delete(url)
        assert response.status_code == status.HTTP_403_FORBIDDEN


@pytest.mark.django_db
class TestReportSoftDeleteOnParentRemoval:
    """Test soft delete behavior when Unit or Equipment is deleted."""

    def test_unit_delete_soft_deletes_reports(self, report_for_unit):
        unit = report_for_unit.unit
        report_id = report_for_unit.id

        unit.delete()

        report = Report.all_objects.get(id=report_id)
        assert report.is_deleted is True
        assert report.deleted_by is None
        assert report.unit is None

    def test_equipment_delete_soft_deletes_reports(self, report_for_equipment):
        equipment = report_for_equipment.equipment
        report_id = report_for_equipment.id

        equipment.delete()

        report = Report.all_objects.get(id=report_id)
        assert report.is_deleted is True
        assert report.deleted_by is None
        assert report.equipment is None
