import logging
from datetime import date, timedelta

from anymail.message import AnymailMessage
from clients_management.models import Client, Report
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db.models.query import QuerySet
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from users.models import UserAccount

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Finds reports due in the next month and sends notification emails."

    def handle(self, *args, **options) -> None:
        self.stdout.write("Starting check for reports nearing due date...")

        # We want to notify exactly one month in advance.
        # Let's run this command daily and catch anything due in 30-31 days.
        today = date.today()
        target_date_start = today + timedelta(days=30)
        target_date_end = today + timedelta(days=31)

        reports_to_notify = self._query_due_reports(target_date_start, target_date_end)
        if not reports_to_notify:
            self.stdout.write(
                self.style.SUCCESS("No reports are due for notification today.")
            )
            return

        self.stdout.write(f"Found {reports_to_notify.count()} reports to notify.")

        sent_count = 0
        for report in reports_to_notify:
            if not (recipients := self._get_recipients(report)):
                self.stdout.write(
                    f"  - No valid email recipients for Report ID {report.id}, skipping."
                )
                continue
            client, recipient_emails = recipients

            override_recipients_raw = getattr(
                settings, "NOTIFICATION_OVERRIDE_RECIPIENTS", None
            )
            if settings.DEBUG and override_recipients_raw:
                override_emails = [
                    e.strip() for e in override_recipients_raw.split(",") if e.strip()
                ]
                if override_emails:
                    recipient_emails = override_emails

            subject = (
                f"Aviso de Vencimento de Relatório: {report.get_report_type_display()}"
            )

            try:
                dashboard_url = (
                    settings.FRONTEND_URL or "https://medphyshub.prophy.com/dashboard"
                )
                context = {
                    "report_type": report.get_report_type_display(),
                    "related_entity": report.unit or report.equipment,
                    "client_name": client.name,
                    "due_date": report.due_date.strftime("%d/%m/%Y"),
                    "dashboard_url": dashboard_url,
                    "current_year": date.today().year,
                }
                html_message = render_to_string(
                    "emails/report_due_notification.html", context
                )
                plain_message = strip_tags(html_message)

                message = AnymailMessage(
                    subject=subject, body=plain_message, to=recipient_emails
                )
                message.attach_alternative(html_message, "text/html")

                message.send()
                sent_count += 1
                self.stdout.write(
                    f"  - Sent notification for Report ID {report.id} to {', '.join(recipient_emails)}"
                )
            except Exception:
                logger.exception("Failed to send email for Report ID %s", report.id)

        self.stdout.write(
            self.style.SUCCESS(f"Finished. Sent {sent_count} notification(s).")
        )

    def _query_due_reports(
        self, target_date_start: date, target_date_end: date
    ) -> QuerySet[Report]:
        return Report.objects.filter(
            due_date__gte=target_date_start, due_date__lt=target_date_end
        ).prefetch_related("unit__client__users", "equipment__unit__client__users")

    def _get_recipients(self, report: Report) -> tuple[Client, list[str]] | None:
        client = None
        if report.unit:
            client = report.unit.client
        elif report.equipment:
            client = report.equipment.unit.client
        if not client:
            logger.error(
                "Data integrity issue: Report ID %s has no associated Client.",
                report.id,
            )
            return None

        eligible_users = client.users.filter(
            role__in=[
                UserAccount.Role.INTERNAL_MEDICAL_PHYSICIST,
                UserAccount.Role.EXTERNAL_MEDICAL_PHYSICIST,
                UserAccount.Role.PROPHY_MANAGER,
            ]
        )

        if not eligible_users.exists():
            logger.error(
                "No responsible physicist users found for Client '%s' (ID: %s).",
                client.name,
                client.id,
                extra={"report_id": report.id, "client_id": client.id},
            )
            return None

        recipient_emails = list(
            eligible_users.exclude(email__isnull=True)
            .exclude(email="")
            .values_list("email", flat=True)
        )

        if not recipient_emails:
            logger.error(
                "Responsible physicist users have no email addresses for Client '%s' (ID: %s).",
                client.name,
                client.id,
                extra={"report_id": report.id, "client_id": client.id},
            )
            return None

        return (client, recipient_emails)
