from clients_management.models import Visit
from django.core.management.base import BaseCommand
from django.utils import timezone


class Command(BaseCommand):
    """
    A Django management command to find and update overdue visits.

    This command identifies visits that are still in 'Pending', 'Confirmed'
    or 'Rescheduled' status but whose scheduled date has passed, and updates
    their status to 'Unfulfilled'.
    """

    help = "Updates the status of overdue visits to 'Unfulfilled'."

    def handle(self, *args, **options):
        today = timezone.now().date()
        self.stdout.write(
            f"[{timezone.now()}] Running update_visits command for dates before {today}..."
        )

        overdue_visits = Visit.objects.filter(
            date__date__lt=today,
            status__in=[
                Visit.Status.PENDING,
                Visit.Status.CONFIRMED,
                Visit.Status.RESCHEDULED,
            ],
        )

        count = overdue_visits.count()

        if count > 0:
            overdue_visits.update(status=Visit.Status.UNFULFILLED)
            self.stdout.write(
                self.style.SUCCESS(
                    f"Successfully updated {count} overdue visit(s) to 'Unfulfilled'."
                )
            )
        else:
            self.stdout.write(self.style.SUCCESS("No overdue visits found to update."))
