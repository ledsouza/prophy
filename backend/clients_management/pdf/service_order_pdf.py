"""PDF generation utilities for Service Orders (Ordem de Serviço).

This module builds a printable PDF document for a given ServiceOrder using
ReportLab. It renders client, unit and visit metadata, the service subject,
equipment list, and rich-text sections such as description and conclusion.

Dependencies:
    - reportlab: Layout and PDF generation
    - phonenumbers: Phone number formatting (BR)
    - Django settings/timezone: Logo path and date localization

The main entry point is build_service_order_pdf().
"""

from __future__ import annotations

import os
from io import BytesIO
from typing import Sequence
from pydantic import BaseModel

import phonenumbers
from django.conf import settings
from django.utils import timezone
from reportlab.lib import colors, utils
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Image,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from clients_management.models import (
    Client,
    ServiceOrder,
    Unit,
    Visit,
)


class InfoItem(BaseModel):
    """Lightweight container for labeled information pairs used in PDF tables.

    This is a Pydantic BaseModel to provide validation and type safety.

    Attributes:
        label (str): The label displayed in the left column.
        value (str): The value text displayed in the right column.
    """

    label: str
    value: str


def _get_stylesheet():
    """Create and customize the ReportLab stylesheet used in the document.

    Returns:
        reportlab.lib.styles.StyleSheet1: Stylesheet containing base styles and
        custom styles such as Title, OrderID, Section, and Label.
    """
    styles = getSampleStyleSheet()

    styles["Title"].alignment = 1
    styles["Title"].fontName = "Helvetica-Bold"
    styles["Title"].fontSize = 18
    styles["Title"].spaceAfter = 10

    styles.add(
        ParagraphStyle(
            "OrderID",
            parent=styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=12,
            textColor=colors.HexColor("#1E90FF"),
            spaceAfter=8,
        ),
        "OrderID",
    )
    styles.add(
        ParagraphStyle(
            "Section",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=12,
            spaceBefore=8,
            spaceAfter=4,
        ),
        "Section",
    )
    styles.add(
        ParagraphStyle("Label", parent=styles["Normal"], fontName="Helvetica-Bold"),
        "Label",
    )
    return styles


def _image_with_width(path: str, width):
    """Create a ReportLab Image with fixed width preserving aspect ratio.

    Args:
        path (str): Filesystem path to the image file.
        width (float): Desired width in points (1/72 inch).

    Returns:
        reportlab.platypus.Image: Configured image flowable centered horizontally.

    Raises:
        OSError: If the image cannot be opened or read.
    """
    img = utils.ImageReader(path)
    iw, ih = img.getSize()
    aspect = ih / float(iw) if iw else 1.0
    return Image(path, width=width, height=width * aspect, hAlign="CENTER")


def _make_info_table(
    data: Sequence[InfoItem],
    styles,
    col1: float = 3.5 * cm,
    col2: float = 9 * cm,
) -> Table:
    """Build a two-column table for labeled information.

    Args:
        data (Sequence[InfoItem]): Items to render as rows (label, value).
        styles: ReportLab stylesheet with "Label" and "Normal" styles.
        col1 (float, optional): Width of the label column. Defaults to 3.5 cm.
        col2 (float, optional): Width of the value column. Defaults to 9 cm.

    Returns:
        Table: A configured ReportLab table with alignment and padding set.
    """
    rows = [
        [
            Paragraph(item.label, styles["Label"]),
            Paragraph(item.value, styles["Normal"]),
        ]
        for item in data
    ]
    table = Table(rows, colWidths=[col1, col2], hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
                ("ALIGN", (0, 0), (-1, -1), "LEFT"),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("WORDWRAP", (1, 0), (1, -1), "LTR"),
            ]
        )
    )
    return table


def build_service_order_pdf(order: ServiceOrder) -> bytes:
    """Build a Service Order PDF and return its bytes.

    Renders a document with header/logo, order identifier, client/unit details,
    visit information, equipment table, and rich-text sections for subject,
    description and conclusion.

    Args:
        order (ServiceOrder): The ServiceOrder instance to render.

    Returns:
        bytes: The generated PDF as a byte string suitable for file download
        or attachment.

    Notes:
        - If the logo is not found or cannot be loaded, the PDF is still built
          without the logo.
        - Dates are localized using Django timezone utilities.
    """
    visit: Visit = order.visit
    unit: Unit = visit.unit
    client: Client = unit.client

    styles = _get_stylesheet()

    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=1.5 * cm,
        bottomMargin=1.5 * cm,
    )
    story = []

    try:
        logo_path = os.path.join(settings.BASE_DIR, "static", "prophy-logo.png")
        if os.path.exists(logo_path):
            story.append(_image_with_width(logo_path, width=2 * cm))
            story.append(Spacer(1, 6))
    except Exception:
        pass

    # Title + Order ID + Client Name
    story.append(Paragraph("ORDEM DE SERVIÇO", styles["Title"]))
    story.append(Paragraph(f"#{order.id}", styles["OrderID"]))
    story.append(
        Paragraph(
            client.name,
            ParagraphStyle(
                "ClientName", parent=styles["Heading2"], fontName="Helvetica-Bold"
            ),
        )
    )
    story.append(Spacer(1, 6))

    # Info sections
    left_info: list[InfoItem] = [
        InfoItem(label="Unidade:", value=unit.name),
        InfoItem(label="Contato:", value=unit.user.name if unit.user else "-"),
        InfoItem(label="Endereço:", value=unit.address),
        InfoItem(label="Cidade:", value=f"{unit.city} / {unit.state}"),
    ]
    right_info: list[InfoItem] = [
        InfoItem(label="Atendente:", value=visit.contact_name),
        InfoItem(
            label="Atendimento:",
            value=(
                timezone.localtime(visit.date).strftime("%d/%m/%Y")
                if visit and visit.date
                else "-"
            ),
        ),
        InfoItem(label="Situação:", value=visit.get_status_display()),
        InfoItem(
            label="Telefone:",
            value=phonenumbers.format_number(
                phonenumbers.parse(unit.phone, "BR"),
                phonenumbers.PhoneNumberFormat.NATIONAL,
            ),
        ),
        InfoItem(label="Tipo OS:", value="Serviço"),
    ]

    left_table = _make_info_table(left_info, styles, 3.2 * cm, 6.3 * cm)
    right_table = _make_info_table(right_info, styles, 3.2 * cm, 4.3 * cm)

    two_col = Table([[left_table, right_table]], colWidths=[9.5 * cm, 7.5 * cm])
    two_col.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    story.append(two_col)
    story.append(Spacer(1, 10))

    # Subject
    story.append(Paragraph("Assunto", styles["Section"]))
    story.append(Paragraph(order.subject, styles["Normal"]))
    story.append(Spacer(1, 6))

    # Equipments
    story.append(Paragraph("Equipamentos", styles["Section"]))
    equip_rows = [["Equipamento", "Detalhamento"]]
    for eq in order.equipments.all():
        equip_name = f"{eq.manufacturer} / {eq.model}"
        details_lines = []
        if getattr(eq, "series_number", None):
            details_lines.append(f"SN: {eq.series_number}")
        if getattr(eq, "anvisa_registry", None):
            details_lines.append(f"ANVISA: {eq.anvisa_registry}")
        details = "<br/>".join(details_lines) if details_lines else "-"
        equip_rows.append(
            [
                Paragraph(equip_name, styles["Normal"]),
                Paragraph(details, styles["Normal"]),
            ]
        )
    if len(equip_rows) == 1:
        equip_rows.append(["-", "-"])
    equip_table = Table(equip_rows, colWidths=[8 * cm, 10 * cm], hAlign="LEFT")
    equip_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#EEEEEE")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("LINEBELOW", (0, 0), (-1, 0), 0.5, colors.gray),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                (
                    "ROWBACKGROUNDS",
                    (0, 1),
                    (-1, -1),
                    [colors.white, colors.HexColor("#F8F8F8")],
                ),
                ("LEFTPADDING", (0, 0), (-1, -1), 4),
                ("RIGHTPADDING", (0, 0), (-1, -1), 4),
                ("TOPPADDING", (0, 0), (-1, -1), 4),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]
        )
    )
    story.append(equip_table)
    story.append(Spacer(1, 10))

    # Description
    story.append(Paragraph("Descrição", styles["Section"]))
    story.append(Paragraph(order.description, styles["Normal"]))
    story.append(Spacer(1, 6))

    # Conclusion
    story.append(Paragraph("Conclusão", styles["Section"]))
    story.append(Paragraph(order.conclusion, styles["Normal"]))

    # Updates (optional)
    updates_text = (order.updates or "").strip()
    if updates_text:
        story.append(Spacer(1, 6))
        story.append(Paragraph("Atualizações", styles["Section"]))
        story.append(Paragraph(updates_text.replace("\n", "<br/>"), styles["Normal"]))

    doc.build(story)
    return buffer.getvalue()
