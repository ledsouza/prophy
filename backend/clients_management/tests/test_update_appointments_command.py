from __future__ import annotations

from datetime import timedelta

import pytest
from django.core.management import call_command
from django.utils import timezone

from clients_management.models import Appointment
from tests.factories import AppointmentFactory


@pytest.mark.django_db
def test_update_appointments__updates_overdue_pending_confirmed_rescheduled() -> None:
    now = timezone.now()
    yesterday = now - timedelta(days=1)
    tomorrow = now + timedelta(days=1)

    overdue_pending = AppointmentFactory(
        date=yesterday,
        status=Appointment.Status.PENDING,
    )
    overdue_confirmed = AppointmentFactory(
        date=yesterday,
        status=Appointment.Status.CONFIRMED,
    )
    overdue_rescheduled = AppointmentFactory(
        date=yesterday,
        status=Appointment.Status.RESCHEDULED,
    )
    not_overdue_pending = AppointmentFactory(
        date=tomorrow,
        status=Appointment.Status.PENDING,
    )
    already_fulfilled = AppointmentFactory(
        date=yesterday,
        status=Appointment.Status.FULFILLED,
    )

    call_command("update_appointments")

    overdue_pending.refresh_from_db()
    overdue_confirmed.refresh_from_db()
    overdue_rescheduled.refresh_from_db()
    not_overdue_pending.refresh_from_db()
    already_fulfilled.refresh_from_db()

    assert overdue_pending.status == Appointment.Status.UNFULFILLED
    assert overdue_confirmed.status == Appointment.Status.UNFULFILLED
    assert overdue_rescheduled.status == Appointment.Status.UNFULFILLED
    assert not_overdue_pending.status == Appointment.Status.PENDING
    assert already_fulfilled.status == Appointment.Status.FULFILLED
