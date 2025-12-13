import logging
from datetime import date

from anymail.message import AnymailMessage
from clients_management.models import Client, Proposal
from dateutil.relativedelta import relativedelta
from django.conf import settings
from django.core.management.base import BaseCommand
from django.db.models import Max
from django.db.models.query import QuerySet
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from users.models import UserAccount

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = (
        "Sends renewal notifications for annual contracts nearing expiration "
        "and win-back notifications for rejected proposals after 11 months."
    )

    def handle(self, *args, **options) -> None:
        self.stdout.write(
            "Starting contract notification check (renewal + win-back)..."
        )

        today = date.today()
        threshold_date = today - relativedelta(months=11)

        renewal_count = self._send_renewal_notifications(threshold_date)
        winback_count = self._send_winback_notifications(threshold_date)

        self.stdout.write(
            self.style.SUCCESS(
                f"Finished. Sent {renewal_count} renewal "
                f"and {winback_count} win-back notification(s)."
            )
        )

    def _send_renewal_notifications(self, threshold_date: date) -> int:
        """
        Send renewal notifications for annual contracts accepted 11 months ago.
        """
        proposals_to_notify = self._query_renewal_proposals(threshold_date)

        if not proposals_to_notify:
            self.stdout.write("No annual contracts due for renewal today.")
            return 0

        self.stdout.write(
            f"Found {proposals_to_notify.count()} annual contracts for renewal."
        )

        sent_count = 0
        for proposal in proposals_to_notify:
            if not (recipients := self._get_renewal_recipients(proposal)):
                self.stdout.write(
                    f"  - No valid recipients for Proposal ID {proposal.id}, skipping."
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

            subject = f"Aviso de Renovação de Contrato: {client.name}"

            try:
                dashboard_url = (
                    settings.FRONTEND_URL or "https://medphyshub.prophy.com/dashboard"
                )
                context = {
                    "client_name": client.name,
                    "contract_type": proposal.get_contract_type_display(),
                    "proposal_date": proposal.date.strftime("%d/%m/%Y"),
                    "proposal_value": f"R$ {proposal.value:,.2f}",
                    "dashboard_url": dashboard_url,
                    "current_year": date.today().year,
                }
                html_message = render_to_string(
                    "emails/contract_renewal_notification.html", context
                )
                plain_message = strip_tags(html_message)

                message = AnymailMessage(
                    subject=subject, body=plain_message, to=recipient_emails
                )
                message.attach_alternative(html_message, "text/html")

                message.send()
                sent_count += 1
                self.stdout.write(
                    f"  - Sent renewal notification for Proposal ID {proposal.id} "
                    f"to {', '.join(recipient_emails)}"
                )
            except Exception:
                logger.exception(
                    "Failed to send renewal email for Proposal ID %s",
                    proposal.id,
                )

        return sent_count

    def _send_winback_notifications(self, threshold_date: date) -> int:
        """
        Send win-back notifications for rejected proposals after 11 months.
        """
        proposals_to_notify = self._query_winback_proposals(threshold_date)

        if not proposals_to_notify:
            self.stdout.write("No rejected proposals due for win-back today.")
            return 0

        self.stdout.write(
            f"Found {proposals_to_notify.count()} rejected proposals for win-back."
        )

        sent_count = 0
        for proposal in proposals_to_notify:
            if self._has_subsequent_active_proposal(proposal):
                self.stdout.write(
                    f"  - Proposal ID {proposal.id} has subsequent active/won proposal, skipping."
                )
                continue

            if not (recipients := self._get_winback_recipients(proposal)):
                self.stdout.write(
                    f"  - No commercial users for Proposal ID {proposal.id}, skipping."
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

            subject = f"Oportunidade de Reconquista: {client.name}"

            try:
                dashboard_url = (
                    settings.FRONTEND_URL or "https://medphyshub.prophy.com/dashboard"
                )
                context = {
                    "client_name": client.name,
                    "contact_name": proposal.contact_name,
                    "rejection_date": proposal.date.strftime("%d/%m/%Y"),
                    "months_since_rejection": 11,
                    "dashboard_url": dashboard_url,
                    "current_year": date.today().year,
                }
                html_message = render_to_string(
                    "emails/proposal_winback_notification.html", context
                )
                plain_message = strip_tags(html_message)

                message = AnymailMessage(
                    subject=subject, body=plain_message, to=recipient_emails
                )
                message.attach_alternative(html_message, "text/html")

                message.send()
                sent_count += 1
                self.stdout.write(
                    f"  - Sent win-back notification for Proposal ID {proposal.id} "
                    f"to {', '.join(recipient_emails)}"
                )
            except Exception:
                logger.exception(
                    "Failed to send win-back email for Proposal ID %s",
                    proposal.id,
                )

        return sent_count

    def _query_renewal_proposals(self, threshold_date: date) -> QuerySet[Proposal]:
        """
        Query annual accepted proposals with date exactly 11 months ago.
        Returns only the latest annual accepted proposal per CNPJ.
        """
        latest_annual_per_cnpj = (
            Proposal.objects.filter(
                status=Proposal.Status.ACCEPTED,
                contract_type=Proposal.ContractType.ANNUAL,
            )
            .values("cnpj")
            .annotate(latest_date=Max("date"))
        )

        cnpj_date_pairs = {
            item["cnpj"]: item["latest_date"] for item in latest_annual_per_cnpj
        }

        proposals = Proposal.objects.filter(
            status=Proposal.Status.ACCEPTED,
            contract_type=Proposal.ContractType.ANNUAL,
            date=threshold_date,
        )

        filtered_proposals = [
            p for p in proposals if cnpj_date_pairs.get(p.cnpj) == p.date
        ]

        return Proposal.objects.filter(
            id__in=[p.id for p in filtered_proposals]
        ).select_related()

    def _query_winback_proposals(self, threshold_date: date) -> QuerySet[Proposal]:
        """
        Query rejected proposals with date exactly 11 months ago.
        """
        return Proposal.objects.filter(
            status=Proposal.Status.REJECTED, date=threshold_date
        ).select_related()

    def _get_renewal_recipients(
        self, proposal: Proposal
    ) -> tuple[Client, list[str]] | None:
        """
        Get recipients for renewal notification:
        PROPHY_MANAGER, COMMERCIAL, and CLIENT_GENERAL_MANAGER.
        """
        try:
            client = Client.objects.get(cnpj=proposal.cnpj)
        except Client.DoesNotExist:
            logger.error(
                "No Client found with CNPJ %s for Proposal ID %s.",
                proposal.cnpj,
                proposal.id,
            )
            return None

        eligible_users = client.users.filter(
            role__in=[
                UserAccount.Role.PROPHY_MANAGER,
                UserAccount.Role.COMMERCIAL,
                UserAccount.Role.CLIENT_GENERAL_MANAGER,
            ]
        )

        if not eligible_users.exists():
            logger.error(
                "No eligible users (GP/C/GGC) found for Client '%s' (CNPJ: %s).",
                client.name,
                client.cnpj,
                extra={"proposal_id": proposal.id, "client_id": client.id},
            )
            return None

        recipient_emails = list(
            eligible_users.exclude(email__isnull=True)
            .exclude(email="")
            .values_list("email", flat=True)
        )

        if not recipient_emails:
            logger.error(
                "Eligible users have no email addresses for Client '%s' (CNPJ: %s).",
                client.name,
                client.cnpj,
                extra={"proposal_id": proposal.id, "client_id": client.id},
            )
            return None

        return (client, recipient_emails)

    def _get_winback_recipients(
        self, proposal: Proposal
    ) -> tuple[Client, list[str]] | None:
        """
        Get recipients for win-back notification: only COMMERCIAL users.
        """
        try:
            client = Client.objects.get(cnpj=proposal.cnpj)
        except Client.DoesNotExist:
            logger.error(
                "No Client found with CNPJ %s for Proposal ID %s.",
                proposal.cnpj,
                proposal.id,
            )
            return None

        commercial_users = client.users.filter(role=UserAccount.Role.COMMERCIAL)

        if not commercial_users.exists():
            logger.error(
                "No commercial users found for Client '%s' (CNPJ: %s).",
                client.name,
                client.cnpj,
                extra={"proposal_id": proposal.id, "client_id": client.id},
            )
            return None

        recipient_emails = list(
            commercial_users.exclude(email__isnull=True)
            .exclude(email="")
            .values_list("email", flat=True)
        )

        if not recipient_emails:
            logger.error(
                "Commercial users have no email addresses for Client '%s' (CNPJ: %s).",
                client.name,
                client.cnpj,
                extra={"proposal_id": proposal.id, "client_id": client.id},
            )
            return None

        return (client, recipient_emails)

    def _has_subsequent_active_proposal(self, rejected_proposal: Proposal) -> bool:
        """
        Check if there's any subsequent proposal (PENDING or ACCEPTED)
        for the same CNPJ after the rejection date.
        """
        return Proposal.objects.filter(
            cnpj=rejected_proposal.cnpj,
            date__gt=rejected_proposal.date,
            status__in=[Proposal.Status.PENDING, Proposal.Status.ACCEPTED],
        ).exists()
