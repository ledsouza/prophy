import pytest
from rest_framework import status
from rest_framework.test import APIClient

from tests.factories import UserFactory


@pytest.mark.django_db
def test_login_sets_access_and_refresh_cookies():
    client = APIClient()
    user = UserFactory(cpf="12345678901")

    response = client.post(
        "/api/jwt/create/",
        {"cpf": user.cpf, "password": "testpass123"},
        format="json",
    )

    assert response.status_code == status.HTTP_200_OK
    assert "access" in response.cookies
    assert "refresh" in response.cookies


@pytest.mark.django_db
def test_refresh_reads_refresh_cookie_and_sets_new_access_cookie():
    client = APIClient()
    user = UserFactory(cpf="12345678901")

    login = client.post(
        "/api/jwt/create/",
        {"cpf": user.cpf, "password": "testpass123"},
        format="json",
    )
    assert login.status_code == status.HTTP_200_OK
    refresh_cookie_value = login.cookies["refresh"].value

    client.cookies["refresh"] = refresh_cookie_value
    response = client.post("/api/jwt/refresh/", {}, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert "access" in response.cookies


@pytest.mark.django_db
def test_verify_reads_access_cookie_and_returns_valid_true():
    client = APIClient()
    user = UserFactory(cpf="12345678901")

    login = client.post(
        "/api/jwt/create/",
        {"cpf": user.cpf, "password": "testpass123"},
        format="json",
    )
    assert login.status_code == status.HTTP_200_OK
    access_cookie_value = login.cookies["access"].value

    client.cookies["access"] = access_cookie_value
    response = client.post("/api/jwt/verify/", {}, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert response.data == {"valid": True}


@pytest.mark.django_db
def test_logout_clears_access_and_refresh_cookies():
    client = APIClient()
    user = UserFactory(cpf="12345678901")

    login = client.post(
        "/api/jwt/create/",
        {"cpf": user.cpf, "password": "testpass123"},
        format="json",
    )
    assert login.status_code == status.HTTP_200_OK

    response = client.post("/api/logout/", {}, format="json")

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert "access" in response.cookies
    assert "refresh" in response.cookies
    assert response.cookies["access"].value == ""
    assert response.cookies["refresh"].value == ""
