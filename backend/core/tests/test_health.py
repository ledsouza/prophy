import pytest
from django.db import DatabaseError
from django.urls import reverse
from rest_framework import status


@pytest.mark.django_db
def test_health_check_ok_unauthenticated(api_client):
    # ACT
    response = api_client.get(reverse("health-check"))

    # ASSERT
    assert response.status_code == status.HTTP_200_OK
    assert response.data == {"status": "ok"}


@pytest.mark.django_db
def test_health_check_db_unreachable_returns_500(api_client, mocker):
    # ARRANGE
    mocker.patch(
        "core.views.connection.cursor",
        side_effect=DatabaseError("connection refused"),
    )

    # ACT
    response = api_client.get(reverse("health-check"))

    # ASSERT
    assert response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR
    assert response.data["status"] == "error"
