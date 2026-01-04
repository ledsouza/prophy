from __future__ import annotations

from io import StringIO
from typing import Any

import pytest
from rest_framework import status


def _mock_valid_oidc_claims(email: str) -> dict[str, Any]:
    return {
        "iss": "accounts.google.com",
        "email": email,
    }


@pytest.mark.django_db
def test_trigger_report_notifications__unauthenticated__401_and_does_not_call_command(
    api_client,
    mocker,
) -> None:
    call_command = mocker.patch("clients_management.views.call_command")

    response = api_client.post("/api/reports/tasks/run-report-notifications/")

    assert response.status_code == status.HTTP_403_FORBIDDEN
    call_command.assert_not_called()


@pytest.mark.django_db
def test_trigger_report_notifications__valid_oidc__calls_command(
    api_client,
    settings,
    mocker,
) -> None:
    settings.OIDC_AUDIENCE = "test-audience"
    mocker.patch(
        "users.authentication.id_token.verify_oauth2_token",
        return_value=_mock_valid_oidc_claims("scheduler@prophy.com"),
    )
    call_command = mocker.patch("clients_management.views.call_command")

    def _fake_call_command(
        name: str,
        *args: object,
        stdout: StringIO | None = None,
        **kwargs: object,
    ) -> None:
        if stdout is not None:
            stdout.write("OK")

    call_command.side_effect = _fake_call_command

    response = api_client.post(
        "/api/reports/tasks/run-report-notifications/",
        HTTP_AUTHORIZATION="Bearer fake",
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["status"] == "ok"
    call_command.assert_called_once()
    assert call_command.call_args.args[0] == "send_due_report_notifications"


@pytest.mark.django_db
def test_trigger_update_appointments__valid_oidc__calls_command(
    api_client,
    settings,
    mocker,
) -> None:
    settings.OIDC_AUDIENCE = "test-audience"
    mocker.patch(
        "users.authentication.id_token.verify_oauth2_token",
        return_value=_mock_valid_oidc_claims("scheduler@prophy.com"),
    )
    call_command = mocker.patch("clients_management.views.call_command")
    call_command.side_effect = lambda name, *args, stdout=None, **kwargs: stdout.write(
        "OK"  # type: ignore[union-attr]
    )

    response = api_client.post(
        "/api/appointments/tasks/update-overdue/",
        HTTP_AUTHORIZATION="Bearer fake",
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["status"] == "ok"
    call_command.assert_called_once()
    assert call_command.call_args.args[0] == "update_appointments"


@pytest.mark.django_db
def test_trigger_contract_notifications__valid_oidc__calls_command(
    api_client,
    settings,
    mocker,
) -> None:
    settings.OIDC_AUDIENCE = "test-audience"
    mocker.patch(
        "users.authentication.id_token.verify_oauth2_token",
        return_value=_mock_valid_oidc_claims("scheduler@prophy.com"),
    )
    call_command = mocker.patch("clients_management.views.call_command")
    call_command.side_effect = lambda name, *args, stdout=None, **kwargs: stdout.write(
        "OK"  # type: ignore[union-attr]
    )

    response = api_client.post(
        "/api/proposals/tasks/run-contract-notifications/",
        HTTP_AUTHORIZATION="Bearer fake",
    )

    assert response.status_code == status.HTTP_200_OK
    assert response.data["status"] == "ok"
    call_command.assert_called_once()
    assert call_command.call_args.args[0] == "send_contract_notifications"
