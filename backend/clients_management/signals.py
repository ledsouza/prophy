from django.db.models.signals import pre_delete
from django.dispatch import receiver
from django.utils import timezone

from clients_management.models import Equipment, Report, Unit


def _soft_delete_reports(
    *,
    report_filter: dict[str, int],
    report_updates: dict[str, int | None],
) -> None:
    reports = Report.all_objects.filter(**report_filter)
    if not reports.exists():
        return

    reports.update(
        deleted_at=timezone.now(),
        deleted_by=None,
        **report_updates,
    )


@receiver(pre_delete, sender=Unit)
def soft_delete_reports_for_unit(
    sender: type[Unit],
    instance: Unit,
    **kwargs,
) -> None:
    _soft_delete_reports(
        report_filter={"unit_id": instance.id},
        report_updates={"unit": None},
    )


@receiver(pre_delete, sender=Equipment)
def soft_delete_reports_for_equipment(
    sender: type[Equipment],
    instance: Equipment,
    **kwargs,
) -> None:
    _soft_delete_reports(
        report_filter={"equipment_id": instance.id},
        report_updates={"equipment": None},
    )
