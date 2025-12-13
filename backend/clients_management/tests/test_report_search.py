"""
Tests for Report search functionality with role-based access control.

This module tests:
- Report scope filtering based on user roles (GP, FMI, FME)
- Status derivation from due_date field
- Filtering by status, due_date range, client/unit names, CNPJ, city
- Responsibles field population
"""

import pytest
from datetime import date, timedelta
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from users.models import UserAccount
from clients_management.models import Client, Unit, Report


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
        role=UserAccount.Role.PROPHY_MANAGER,
    )


@pytest.fixture
def internal_physicist(db):
    """Create an Internal Medical Physicist user."""
    return UserAccount.objects.create_user(
        email="fmi@prophy.com",
        password="testpass123",
        name="Físico Médico Interno",
        role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST,
    )


@pytest.fixture
def external_physicist(db):
    """Create an External Medical Physicist user."""
    return UserAccount.objects.create_user(
        email="fme@prophy.com",
        password="testpass123",
        name="Físico Médico Externo",
        role=UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST,
    )


@pytest.fixture
def another_physicist(db):
    """Create another physicist not assigned to any client."""
    return UserAccount.objects.create_user(
        email="other@prophy.com",
        password="testpass123",
        name="Outro Físico",
        role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST,
    )


@pytest.fixture
def client_with_reports(
    db,
    internal_physicist,
    external_physicist,
):
    """
    Create a client with units and reports.

    The client has two physicists assigned.
    """
    client = Client.objects.create(
        name="Hospital Test",
        cnpj="12345678000190",
        is_active=True,
    )
    client.users.add(internal_physicist, external_physicist)

    unit = Unit.objects.create(
        name="Unidade Central",
        city="São Paulo",
        state="SP",
        client=client,
    )

    # Create reports with different due dates for status testing
    today = date.today()

    # Overdue report (due_date < today)
    Report.objects.create(
        unit=unit,
        due_date=today - timedelta(days=10),
        pdf_file="reports/overdue.pdf",
    )

    # Due soon report (today <= due_date <= today+30)
    Report.objects.create(
        unit=unit,
        due_date=today + timedelta(days=15),
        pdf_file="reports/due_soon.pdf",
    )

    # OK report (due_date > today+30)
    Report.objects.create(
        unit=unit,
        due_date=today + timedelta(days=60),
        pdf_file="reports/ok.pdf",
    )

    return client


@pytest.fixture
def another_client_with_reports(db, another_physicist):
    """
    Create another client with reports.

    This client has a different physicist assigned.
    """
    client = Client.objects.create(
        name="Clínica Test",
        cnpj="98765432000100",
        is_active=True,
    )
    client.users.add(another_physicist)

    unit = Unit.objects.create(
        name="Unidade Norte",
        city="Rio de Janeiro",
        state="RJ",
        client=client,
    )

    today = date.today()
    Report.objects.create(
        unit=unit,
        due_date=today + timedelta(days=5),
        pdf_file="reports/another.pdf",
    )

    return client


@pytest.mark.django_db
class TestReportSearchPermissions:
    """Test role-based access control for report search."""

    def test_prophy_manager_sees_all_reports(
        self,
        api_client,
        prophy_manager,
        client_with_reports,
        another_client_with_reports,
    ):
        """GP should see ALL reports regardless of assignment."""
        api_client.force_authenticate(user=prophy_manager)
        url = reverse("report-search")

        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 4

    def test_internal_physicist_sees_only_assigned_reports(
        self,
        api_client,
        internal_physicist,
        client_with_reports,
        another_client_with_reports,
    ):
        """
        FMI should see only reports where they are assigned.

        via client.users.
        """
        api_client.force_authenticate(user=internal_physicist)
        url = reverse("report-search")

        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 3

        # Verify all reports belong to the assigned client
        for report in response.data["results"]:
            assert report["client_name"] == "Hospital Test"

    def test_external_physicist_sees_only_assigned_reports(
        self,
        api_client,
        external_physicist,
        client_with_reports,
        another_client_with_reports,
    ):
        """
        FME should see only reports where they are assigned.

        via client.users.
        """
        api_client.force_authenticate(user=external_physicist)
        url = reverse("report-search")

        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 3

        # Verify all reports belong to the assigned client
        for report in response.data["results"]:
            assert report["client_name"] == "Hospital Test"

    def test_physicist_not_assigned_sees_no_reports(
        self,
        api_client,
        another_physicist,
        client_with_reports,
    ):
        """
        A physicist not assigned to any client should see.

        only their own client's reports.
        """
        api_client.force_authenticate(user=another_physicist)
        url = reverse("report-search")

        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        # Should see only the report from another_client_with_reports
        assert response.data["count"] == 1


@pytest.mark.django_db
class TestReportStatusDerivation:
    """Test status field derivation from due_date."""

    def test_status_overdue(
        self,
        api_client,
        prophy_manager,
        client_with_reports,
    ):
        """Reports with due_date < today should have status 'overdue'."""
        api_client.force_authenticate(user=prophy_manager)
        url = reverse("report-search")

        response = api_client.get(url, {"status": "overdue"})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["status"] == "overdue"

    def test_status_due_soon(
        self,
        api_client,
        prophy_manager,
        client_with_reports,
    ):
        """
        Reports with today <= due_date <= today+30.

        should have status 'due_soon'.
        """
        api_client.force_authenticate(user=prophy_manager)
        url = reverse("report-search")

        response = api_client.get(url, {"status": "due_soon"})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["status"] == "due_soon"

    def test_status_ok(
        self,
        api_client,
        prophy_manager,
        client_with_reports,
    ):
        """
        Reports with due_date > today+30 should have status 'ok'.
        """
        api_client.force_authenticate(user=prophy_manager)
        url = reverse("report-search")

        response = api_client.get(url, {"status": "ok"})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        assert response.data["results"][0]["status"] == "ok"


@pytest.mark.django_db
class TestReportFiltering:
    """Test various filtering options for report search."""

    def test_filter_by_due_date_range(
        self,
        api_client,
        prophy_manager,
        client_with_reports,
    ):
        """Filter reports by due_date range."""
        api_client.force_authenticate(user=prophy_manager)
        url = reverse("report-search")

        today = date.today()
        due_date_start = today - timedelta(days=5)
        due_date_end = today + timedelta(days=20)

        response = api_client.get(
            url,
            {
                "due_date_start": due_date_start.isoformat(),
                "due_date_end": due_date_end.isoformat(),
            },
        )

        assert response.status_code == status.HTTP_200_OK
        # Should include overdue and due_soon reports
        assert response.data["count"] == 2

    def test_filter_by_client_name(
        self,
        api_client,
        prophy_manager,
        client_with_reports,
        another_client_with_reports,
    ):
        """Filter reports by client name (case-insensitive)."""
        api_client.force_authenticate(user=prophy_manager)
        url = reverse("report-search")

        response = api_client.get(url, {"client_name": "hospital"})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 3
        for report in response.data["results"]:
            assert "hospital" in report["client_name"].lower()

    def test_filter_by_client_cnpj(
        self,
        api_client,
        prophy_manager,
        client_with_reports,
        another_client_with_reports,
    ):
        """Filter reports by client CNPJ."""
        api_client.force_authenticate(user=prophy_manager)
        url = reverse("report-search")

        response = api_client.get(url, {"client_cnpj": "12345678"})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 3

    def test_filter_by_unit_name(
        self,
        api_client,
        prophy_manager,
        client_with_reports,
        another_client_with_reports,
    ):
        """Filter reports by unit name (case-insensitive)."""
        api_client.force_authenticate(user=prophy_manager)
        url = reverse("report-search")

        response = api_client.get(url, {"unit_name": "central"})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 3
        for report in response.data["results"]:
            assert "central" in report["unit_name"].lower()

    def test_filter_by_unit_city(
        self,
        api_client,
        prophy_manager,
        client_with_reports,
        another_client_with_reports,
    ):
        """Filter reports by unit city (case-insensitive)."""
        api_client.force_authenticate(user=prophy_manager)
        url = reverse("report-search")

        response = api_client.get(url, {"unit_city": "são paulo"})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 3

    def test_combined_filters(
        self,
        api_client,
        prophy_manager,
        client_with_reports,
        another_client_with_reports,
    ):
        """Test combining multiple filters."""
        api_client.force_authenticate(user=prophy_manager)
        url = reverse("report-search")

        response = api_client.get(
            url,
            {
                "status": "due_soon",
                "client_name": "hospital",
                "unit_city": "são paulo",
            },
        )

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 1
        result = response.data["results"][0]
        assert result["status"] == "due_soon"
        assert "hospital" in result["client_name"].lower()


@pytest.mark.django_db
class TestReportResponsibles:
    """Test responsibles field population."""

    def test_responsibles_field_includes_all_physicists(
        self,
        api_client,
        prophy_manager,
        client_with_reports,
        internal_physicist,
        external_physicist,
    ):
        """
        Responsibles field should include all physicists.

        assigned to the client.
        """
        api_client.force_authenticate(user=prophy_manager)
        url = reverse("report-search")

        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK

        # Check first report's responsibles
        report = response.data["results"][0]
        assert "responsibles" in report
        assert len(report["responsibles"]) == 2

        # Verify physicist details are included
        responsible_ids = [r["id"] for r in report["responsibles"]]
        assert internal_physicist.id in responsible_ids
        assert external_physicist.id in responsible_ids

    def test_responsibles_display_format(
        self,
        api_client,
        prophy_manager,
        client_with_reports,
    ):
        """
        Test responsibles_display field formatting.
        """
        api_client.force_authenticate(user=prophy_manager)
        url = reverse("report-search")

        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK

        report = response.data["results"][0]
        assert "responsibles_display" in report
        # Should contain role abbreviations and names
        assert "FMI:" in report["responsibles_display"]
        assert "FME:" in report["responsibles_display"]


@pytest.mark.django_db
class TestReportSearchPagination:
    """Test pagination for report search."""

    def test_pagination_default_page_size(
        self,
        api_client,
        prophy_manager,
        client_with_reports,
    ):
        """Test default pagination behavior."""
        api_client.force_authenticate(user=prophy_manager)
        url = reverse("report-search")

        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert "count" in response.data
        assert "next" in response.data
        assert "previous" in response.data
        assert "results" in response.data

    def test_pagination_custom_page_size(
        self,
        api_client,
        prophy_manager,
        client_with_reports,
    ):
        """Test custom page size parameter."""
        api_client.force_authenticate(user=prophy_manager)
        url = reverse("report-search")

        response = api_client.get(url, {"page_size": 2})

        assert response.status_code == status.HTTP_200_OK
        assert len(response.data["results"]) <= 2
