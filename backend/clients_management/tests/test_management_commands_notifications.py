from __future__ import annotations

from datetime import timedelta

import pytest
from dateutil.relativedelta import relativedelta
from django.core.management import call_command
from django.utils import timezone

from clients_management.models import Proposal, Report
from tests.factories import (
    ClientFactory,
    EquipmentFactory,
    ProposalFactory,
    ReportFactory,
)
from tests.factories.users import UserFactory
from users.models import UserAccount


@pytest.mark.django_db
def test_send_due_report_notifications__sends_to_eligible_client_users(
    settings,
    mocker,
) -> None:
    settings.DEBUG = True
    settings.NOTIFICATION_OVERRIDE_RECIPIENTS = None

    render_spy = mocker.patch(
        "clients_management.management.commands.send_due_report_notifications.render_to_string",
        return_value="<html>ok</html>",
    )

    message_instance = mocker.Mock()
    message_instance.attach_alternative = mocker.Mock()
    message_instance.send = mocker.Mock()
    anymail_message = mocker.patch(
        "clients_management.management.commands.send_due_report_notifications.AnymailMessage",
        return_value=message_instance,
    )

    internal = UserFactory(
        role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST,
        email="internal@example.com",
    )
    external = UserFactory(
        role=UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST,
        email="external@example.com",
    )
    manager = UserFactory(
        role=UserAccount.Role.PROPHY_MANAGER,
        email="gp@example.com",
    )
    client_general_manager = UserFactory(
        role=UserAccount.Role.CLIENT_GENERAL_MANAGER,
        email="ggc@example.com",
    )
    unit_manager = UserFactory(
        role=UserAccount.Role.UNIT_MANAGER,
        email="gu@example.com",
    )

    equipment = EquipmentFactory(
        unit__client__users=[
            internal,
            external,
            manager,
            client_general_manager,
            unit_manager,
        ]
    )

    ProposalFactory(
        cnpj=equipment.unit.client.cnpj,
        contract_type=Proposal.ContractType.ANNUAL,
        status=Proposal.Status.ACCEPTED,
        date=timezone.now().date(),
    )
    report = ReportFactory(
        equipment=equipment,
        unit=None,
        report_type=Report.ReportType.QUALITY_CONTROL,
        completion_date=timezone.now().date(),
    )
    report.due_date = timezone.now().date() + timedelta(days=30)
    report.save(update_fields=["due_date"])

    call_command("send_due_report_notifications")

    assert render_spy.call_args.args[0] == "emails/report_due_notification.html"
    anymail_message.assert_called_once()
    assert anymail_message.call_args.kwargs["to"] == [
        "internal@example.com",
        "external@example.com",
        "gp@example.com",
        "ggc@example.com",
        "gu@example.com",
    ]
    message_instance.send.assert_called_once()


@pytest.mark.django_db
def test_send_due_report_notifications__excludes_managers_when_latest_contract_is_not_annual(
    settings,
    mocker,
) -> None:
    settings.DEBUG = True
    settings.NOTIFICATION_OVERRIDE_RECIPIENTS = None

    message_instance = mocker.Mock()
    message_instance.attach_alternative = mocker.Mock()
    message_instance.send = mocker.Mock()
    anymail_message = mocker.patch(
        "clients_management.management.commands.send_due_report_notifications.AnymailMessage",
        return_value=message_instance,
    )

    internal = UserFactory(
        role=UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST,
        email="internal@example.com",
    )
    external = UserFactory(
        role=UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST,
        email="external@example.com",
    )
    prophy_manager = UserFactory(
        role=UserAccount.Role.PROPHY_MANAGER,
        email="gp@example.com",
    )
    client_general_manager = UserFactory(
        role=UserAccount.Role.CLIENT_GENERAL_MANAGER,
        email="ggc@example.com",
    )
    unit_manager = UserFactory(
        role=UserAccount.Role.UNIT_MANAGER,
        email="gu@example.com",
    )

    equipment = EquipmentFactory(
        unit__client__users=[
            internal,
            external,
            prophy_manager,
            client_general_manager,
            unit_manager,
        ]
    )

    ProposalFactory(
        cnpj=equipment.unit.client.cnpj,
        contract_type=Proposal.ContractType.MONTHLY,
        status=Proposal.Status.ACCEPTED,
        date=timezone.now().date(),
    )

    report = ReportFactory(
        equipment=equipment,
        unit=None,
        report_type=Report.ReportType.QUALITY_CONTROL,
        completion_date=timezone.now().date(),
    )
    report.due_date = timezone.now().date() + timedelta(days=30)
    report.save(update_fields=["due_date"])

    call_command("send_due_report_notifications")

    anymail_message.assert_called_once()
    assert anymail_message.call_args.kwargs["to"] == [
        "internal@example.com",
        "external@example.com",
        "gp@example.com",
    ]
    message_instance.send.assert_called_once()


@pytest.mark.django_db
def test_send_contract_notifications__renewal_sends_to_gp_commercial_and_client_manager(
    settings,
    mocker,
) -> None:
    settings.DEBUG = True
    settings.NOTIFICATION_OVERRIDE_RECIPIENTS = None

    render_spy = mocker.patch(
        "clients_management.management.commands.send_contract_notifications.render_to_string",
        return_value="<html>ok</html>",
    )

    message_instance = mocker.Mock()
    message_instance.attach_alternative = mocker.Mock()
    message_instance.send = mocker.Mock()
    anymail_message = mocker.patch(
        "clients_management.management.commands.send_contract_notifications.AnymailMessage",
        return_value=message_instance,
    )

    threshold_date = timezone.now().date() - relativedelta(months=11)
    cnpj = "12345678000190"

    gp = UserFactory(role=UserAccount.Role.PROPHY_MANAGER, email="gp@example.com")
    commercial = UserFactory(
        role=UserAccount.Role.COMMERCIAL,
        email="commercial@example.com",
    )
    client_manager = UserFactory(
        role=UserAccount.Role.CLIENT_GENERAL_MANAGER,
        email="manager@example.com",
    )

    client = ClientFactory(cnpj=cnpj, users=[gp, commercial, client_manager])
    _ = client

    proposal = ProposalFactory(
        cnpj=cnpj,
        contract_type=Proposal.ContractType.ANNUAL,
        status=Proposal.Status.ACCEPTED,
        date=threshold_date,
        value=1000,
    )

    # ensure this is the latest annual accepted per cnpj
    ProposalFactory(
        cnpj=cnpj,
        contract_type=Proposal.ContractType.ANNUAL,
        status=Proposal.Status.ACCEPTED,
        date=threshold_date - timedelta(days=1),
    )

    call_command("send_contract_notifications")

    assert render_spy.call_args.args[0] == "emails/contract_renewal_notification.html"
    anymail_message.assert_called_once()
    assert sorted(anymail_message.call_args.kwargs["to"]) == sorted(
        [
            "gp@example.com",
            "commercial@example.com",
            "manager@example.com",
        ]
    )
    message_instance.send.assert_called_once()
    assert proposal.id is not None


@pytest.mark.django_db
def test_send_contract_notifications__winback_sends_only_to_commercial(
    settings,
    mocker,
) -> None:
    settings.DEBUG = True
    settings.NOTIFICATION_OVERRIDE_RECIPIENTS = None

    render_spy = mocker.patch(
        "clients_management.management.commands.send_contract_notifications.render_to_string",
        return_value="<html>ok</html>",
    )

    message_instance = mocker.Mock()
    message_instance.attach_alternative = mocker.Mock()
    message_instance.send = mocker.Mock()
    anymail_message = mocker.patch(
        "clients_management.management.commands.send_contract_notifications.AnymailMessage",
        return_value=message_instance,
    )

    threshold_date = timezone.now().date() - relativedelta(months=11)
    cnpj = "98765432000198"

    commercial = UserFactory(
        role=UserAccount.Role.COMMERCIAL,
        email="commercial@example.com",
    )

    _ = ClientFactory(cnpj=cnpj, users=[commercial])
    _ = ProposalFactory(
        cnpj=cnpj,
        status=Proposal.Status.REJECTED,
        date=threshold_date,
    )

    call_command("send_contract_notifications")

    assert render_spy.call_args.args[0] == "emails/proposal_winback_notification.html"
    anymail_message.assert_called_once()
    assert anymail_message.call_args.kwargs["to"] == ["commercial@example.com"]
    message_instance.send.assert_called_once()


@pytest.mark.django_db
def test_send_contract_notifications__winback_skips_if_there_is_later_active_proposal(
    settings,
    mocker,
) -> None:
    settings.DEBUG = True
    settings.NOTIFICATION_OVERRIDE_RECIPIENTS = None

    send_spy = mocker.patch(
        "clients_management.management.commands.send_contract_notifications.AnymailMessage.send"
    )

    threshold_date = timezone.now().date() - relativedelta(months=11)
    cnpj = "11111111000191"

    commercial = UserFactory(
        role=UserAccount.Role.COMMERCIAL,
        email="commercial@example.com",
    )
    _ = ClientFactory(cnpj=cnpj, users=[commercial])

    rejected = ProposalFactory(
        cnpj=cnpj,
        status=Proposal.Status.REJECTED,
        date=threshold_date,
    )
    _ = ProposalFactory(
        cnpj=cnpj,
        status=Proposal.Status.ACCEPTED,
        date=rejected.date + timedelta(days=1),
    )

    call_command("send_contract_notifications")

    send_spy.assert_not_called()
