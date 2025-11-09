import logging
from datetime import date, timedelta

from anymail.message import AnymailMessage
from clients_management.models import Client, Report
from django.core.management.base import BaseCommand
from django.db.models.query import QuerySet
from django.template.loader import render_to_string
from django.utils.html import strip_tags

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

            subject = (
                f"Aviso de Vencimento de Relatório: {report.get_report_type_display()}"
            )

            try:
                context = {
                    "report_type": report.get_report_type_display(),
                    "related_entity": report.unit or report.equipment,
                    "client_name": client.name,
                    "due_date": report.due_date.strftime("%d/%m/%Y"),
                    "dashboard_url": "https://medphyshub.prophy.com/dashboard",
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
                    f"  - Sent notification for Report ID {report.id}",
                    " to {', '.join(recipient_emails)}",
                )
            except Exception as e:
                logger.error(
                    f"Failed to send email for Report ID {report.id}. Error: {e}"
                )

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
                f"Data Integrity Issue: Report ID {report.id}",
                " has no associated Client.",
            )
            return None

        all_associated_users = client.users.all()
        if not all_associated_users.exists():
            logger.error(
                f"Data Integrity Issue: Client '{client.name}' (ID: {client.id})",
                " has no associated users.",
            )
            return None

        recipient_emails = []
        for user in all_associated_users:
            if user.email:
                recipient_emails.append(user.email)
            else:
                logger.warning(
                    f"Data Quality Issue: User '{user.name}' (ID: {user.id})",
                    f" of Client '{client.name}' ",
                    f"was skipped for Report ID {report.id}",
                    " because they have no email address.",
                )

        return (client, recipient_emails) if recipient_emails else None
