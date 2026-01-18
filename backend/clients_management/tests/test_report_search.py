"""Report search tests."""

from datetime import date, timedelta

import pytest
from django.urls import reverse
from rest_framework import status
from users.models import UserAccount

from clients_management.models import Client, Report, Unit


@pytest.fixture
def another_physicist(db) -> UserAccount:
    return UserAccount.objects.create_user(
        cpf="12345678910",
        email="other@prophy.com",
        password="testpass123",
        name="Outro Físico",
        phone="11999999910",
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
        completion_date=today,
        report_type=Report.ReportType.MEMORIAL,
        file="reports/overdue.pdf",
        due_date=today - timedelta(days=10),
    )

    # Due soon report (today <= due_date <= today+30)
    Report.objects.create(
        unit=unit,
        completion_date=today,
        report_type=Report.ReportType.MEMORIAL,
        file="reports/due_soon.pdf",
        due_date=today + timedelta(days=15),
    )

    # OK report (due_date > today+30)
    Report.objects.create(
        unit=unit,
        completion_date=today,
        report_type=Report.ReportType.MEMORIAL,
        file="reports/ok.pdf",
        due_date=today + timedelta(days=60),
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
        completion_date=today,
        report_type=Report.ReportType.MEMORIAL,
        file="reports/another.pdf",
        due_date=today + timedelta(days=5),
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
        url = reverse("reports-list")

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
        url = reverse("reports-list")

        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 3

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
        url = reverse("reports-list")

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
        url = reverse("reports-list")

        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 0


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
        url = reverse("reports-list")

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
        url = reverse("reports-list")

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
        url = reverse("reports-list")

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
        url = reverse("reports-list")

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
        assert response.data["count"] == 1

    def test_filter_by_client_name(
        self,
        api_client,
        prophy_manager,
        client_with_reports,
        another_client_with_reports,
    ):
        """Filter reports by client name (case-insensitive)."""
        api_client.force_authenticate(user=prophy_manager)
        url = reverse("reports-list")

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
        url = reverse("reports-list")

        response = api_client.get(url, {"client_cnpj": "12345678000190"})

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
        url = reverse("reports-list")

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
        url = reverse("reports-list")

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
        url = reverse("reports-list")

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
class TestReportResponsibleCpfFiltering:
    def test_filter_by_responsible_cpf_returns_only_linked_reports(
        self,
        api_client,
        prophy_manager,
        internal_physicist,
        client_with_reports,
        another_client_with_reports,
    ):
        api_client.force_authenticate(user=prophy_manager)
        url = reverse("reports-list")

        response = api_client.get(url, {"responsible_cpf": internal_physicist.cpf})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 3
        for report in response.data["results"]:
            assert report["client_name"] == "Hospital Test"

    def test_filter_by_responsible_cpf_returns_empty_when_not_found(
        self,
        api_client,
        prophy_manager,
        client_with_reports,
    ):
        api_client.force_authenticate(user=prophy_manager)
        url = reverse("reports-list")

        response = api_client.get(url, {"responsible_cpf": "00000000000"})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 0

    def test_filter_by_responsible_cpf_returns_empty_when_user_exists_but_not_linked(
        self,
        api_client,
        prophy_manager,
        another_physicist,
        client_with_reports,
    ):
        api_client.force_authenticate(user=prophy_manager)
        url = reverse("reports-list")

        response = api_client.get(url, {"responsible_cpf": another_physicist.cpf})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 0


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
        url = reverse("reports-list")

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
        url = reverse("reports-list")

        response = api_client.get(url)

        assert response.status_code == status.HTTP_200_OK

        report = response.data["results"][0]
        assert "responsibles_display" in report
        assert "Físico Médico Interno" in report["responsibles_display"]
        assert "Físico Médico Externo" in report["responsibles_display"]


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
        url = reverse("reports-list")

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
        url = reverse("reports-list")

        response = api_client.get(url, {"page_size": 2})

        assert response.status_code == status.HTTP_200_OK
        assert response.data["count"] == 3
