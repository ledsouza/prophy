from clients_management.models import Appointment
from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    """
    A Django management command to find and update overdue appointments.

    This command identifies appointments that are still in 'Pending', 'Confirmed'
    or 'Rescheduled' status but whose scheduled date has passed, and updates
    their status to 'Unfulfilled'.
    """

    help = "Updates the status of overdue appointments to 'Unfulfilled'."

    def handle(self, *args, **options):
        today = timezone.now().date()
        self.stdout.write(
            f"[{timezone.now()}] Running update_appointments command for dates before {today}..."
        )

        overdue_appointments = Appointment.objects.filter(
            date__date__lt=today,
            status__in=[
                Appointment.Status.PENDING,
                Appointment.Status.CONFIRMED,
                Appointment.Status.RESCHEDULED,
            ],
        )

        count = overdue_appointments.count()

        if count > 0:
            overdue_appointments.update(status=Appointment.Status.UNFULFILLED)
            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully updated {count} overdue appointment(s) to 'Unfulfilled'."
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS("No overdue appointments found to update.")
            )
