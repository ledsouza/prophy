from __future__ import annotations

from django.db.models import OuterRef, QuerySet, Subquery

from clients_management.models import Proposal


def annotate_latest_annual_accepted_proposal_date(
    queryset: QuerySet, cnpj_field: str = "cnpj"
) -> QuerySet:
    """
    Annotate a queryset with the date of the latest accepted annual proposal per CNPJ.

    The queryset must contain a field identified by ``cnpj_field`` that stores the
    client's CNPJ. The annotation will be added under the name
    ``latest_annual_accepted_proposal_date``.

    This is intended to be reused wherever we need to reason about the most
    recent annual contract per client, such as:
      - determining if a client needs a new appointment
      - identifying proposals close to renewal windows
    """
    latest_annual_proposals = Proposal.objects.filter(
        **{
            cnpj_field: OuterRef(cnpj_field),
            "status": Proposal.Status.ACCEPTED,
            "contract_type": Proposal.ContractType.ANNUAL,
        }
    ).order_by("-date")

    return queryset.annotate(
        latest_annual_accepted_proposal_date=Subquery(
            latest_annual_proposals.values("date")[:1]
        )
    )
