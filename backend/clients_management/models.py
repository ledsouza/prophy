from __future__ import annotations
from typing import TYPE_CHECKING

from datetime import date, timedelta
from django.db import models
from django.contrib import admin
from django.db.models import TextChoices
from django.utils.translation import gettext as _
from django.utils.html import format_html
from django.core.exceptions import ValidationError

from users.models import UserAccount
from clients_management.validators import CNPJValidator

from localflavor.br.br_states import STATE_CHOICES
import calendar

if TYPE_CHECKING:
    from requisitions.models import ClientOperation, UnitOperation, EquipmentOperation


def get_status(
    operation: ClientOperation | UnitOperation | EquipmentOperation,
) -> str | format_html:
    """
    Returns the formatted status of a client, unit, or equipment operation.

    This function takes an operation object and returns either a plain string status
    or an HTML-formatted status message depending on the operation's type and status.

    Args:
        operation (ClientOperation | UnitOperation | EquipmentOperation):
            The operation object to get status for. Can be any of the operation types.

    Returns:
        str | format_html: Either a plain string status for approved operations,
        or an HTML-formatted status message for pending add/edit/delete operations.
        The HTML includes the status and type of request in a fixed-width div.
    """
    if operation.operation_status == "A":
        return operation.get_operation_status_display()
    if operation.operation_type == "A":
        return format_html(
            f"<div style='width: 90px'><b>{operation.get_operation_status_display()}:</b><br>Requisição para adicionar</div>"
        )
    if operation.operation_type == "E":
        return format_html(
            f"<div style='width: 90px'><b>{operation.get_operation_status_display()}:</b><br>Requisição para editar</div>"
        )
    if operation.operation_type == "D":
        return format_html(
            f"<div style='width: 90px'><b>{operation.get_operation_status_display()}:</b><br>Requisição para deletar</div>"
        )


class BaseEquipment(models.Model):
    """
    A base abstract model representing common equipment attributes.

    This model serves as a base class for various equipment types, providing standard
    fields for tracking equipment information such as manufacturer, model, series number,
    and associated photos.

    Attributes:
        manufacturer (CharField): The equipment manufacturer name (max 30 characters)
        model (CharField): The equipment model name (max 30 characters)
        series_number (CharField): Optional equipment serial number (max 30 characters)
        equipment_photo (ImageField): Photo of the equipment, stored in 'equipments/photos'
        label_photo (ImageField): Photo of the equipment label, stored in 'equipments/labels'

    Note:
        This is an abstract base class and cannot be instantiated directly.
        It should be inherited by concrete equipment models.
    """

    manufacturer = models.CharField("Fabricante", max_length=30)
    model = models.CharField("Modelo", max_length=30)
    series_number = models.CharField(
        "Número de Série", max_length=30, blank=True, null=True
    )
    equipment_photo = models.ImageField(
        "Foto do equipamento", upload_to="equipments/photos"
    )
    label_photo = models.ImageField("Foto da etiqueta", upload_to="equipments/labels")

    class Meta:
        abstract = True


class Client(models.Model):
    """
    A Django model class representing a client in the system.

    This model stores essential information about clients, including their identification,
    contact details, location, and associated users.

    Attributes:
        users (ManyToManyField): Multiple UserAccount objects linked to this client as responsibles
        cnpj (CharField): Brazilian company registration number (14 digits)
        name (CharField): Institution/company name (max 50 characters)
        email (EmailField): Institution's contact email
        phone (CharField): Institution's contact phone number (max 13 characters)
        address (CharField): Institution's physical address (max 150 characters)
        state (CharField): Institution's state, using 2-letter codes from STATE_CHOICES
        city (CharField): Institution's city (max 50 characters)
        active (BooleanField): Flag indicating if the client is currently active

    Methods:
        responsables(): Returns formatted HTML string of associated users and their roles
        status(): Returns the operational status of the client
        __str__(): Returns string representation of the client (name)

    Meta:
        verbose_name: "Cliente"
        verbose_name_plural: "Clientes"
    """

    users = models.ManyToManyField(
        UserAccount, related_name="clients", blank=True, verbose_name="Responsáveis"
    )
    cnpj = models.CharField("CNPJ", max_length=14, validators=[CNPJValidator()])
    name = models.CharField("Nome da instituição", max_length=50)
    email = models.EmailField("E-mail da instituição")
    phone = models.CharField("Telefone da instituição", max_length=13)
    address = models.CharField("Endereço da instituição", max_length=150)
    state = models.CharField(
        "Estado da instituição", max_length=2, choices=STATE_CHOICES
    )
    city = models.CharField("Cidade da instituição", max_length=50)
    is_active = models.BooleanField("Ativo", default=False)

    @admin.display(description="Responsáveis")
    def responsables(self):
        associated_users = self.users.all()
        associated_users = [
            f"<strong>{user.get_role_display()}:</strong> {user.name}"
            for user in associated_users
        ]
        return format_html("<br>".join(associated_users))

    @admin.display(description="Status")
    def status(self):
        operation = self.operation
        return get_status(operation)

    def __str__(self) -> str:
        return self.name

    class Meta:
        verbose_name = "Cliente"
        verbose_name_plural = "Clientes"


class Unit(models.Model):
    """
    This class represents a business unit belonging to a client in the system. It stores
    information about the unit's management, location, and contact details.

    Attributes:
        user (UserAccount): The unit manager, can be null.
        client (Client): The client this unit belongs to.
        name (str): Name of the unit, max 50 characters.
        cnpj (str): Brazilian company registration number (CNPJ), must be 14 digits.
        email (str): Contact email address for the unit.
        phone (str): Contact phone number, max 13 characters.
        address (str): Physical address of the unit, max 150 characters.
        state (str): Two-letter state code, chosen from STATE_CHOICES.
        city (str): City name, max 50 characters.

    Methods:
        status(): Returns the operational status of the unit.
        __str__(): Returns the unit name as string representation.

    Meta:
        verbose_name: "Unidade"
        verbose_name_plural: "Unidades"
    """

    user = models.ForeignKey(
        UserAccount,
        on_delete=models.SET_NULL,
        related_name="unit",
        blank=True,
        null=True,
        verbose_name="Gerente de Unidade",
    )
    client = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name="units",
        blank=True,
        null=True,
        verbose_name="Cliente",
    )
    name = models.CharField("Nome", max_length=50)
    cnpj = models.CharField("CNPJ", max_length=14, validators=[CNPJValidator()])
    email = models.EmailField("E-mail")
    phone = models.CharField("Telefone", max_length=13)
    address = models.CharField("Endereço", max_length=150)
    state = models.CharField("Estado", max_length=2, choices=STATE_CHOICES, blank=True)
    city = models.CharField("Cidade", max_length=50, blank=True)

    @admin.display(description="Status")
    def status(self):
        operation = self.operation
        return get_status(operation)

    def __str__(self) -> str:
        return f"{self.name}"

    class Meta:
        verbose_name = "Unidade"
        verbose_name_plural = "Unidades"


class Modality(models.Model):
    """
    A Django model representing different imaging modalities in medical equipment.

    This class defines various imaging modalities and their associated accessories
    commonly used in medical diagnostics and treatments.

    Attributes:
        name (CharField): The name of the modality, limited to 50 characters.
        accessory (CharField): The type of accessory used with the modality.
            Can be one of the following:
            - D: Detector
            - C: Coil (Bobina)
            - T: Transducer (Transdutor)
            - N: Not applicable (Não se aplica)

        Accessory (TextChoices): An inner class defining the available accessory types
            as choices for the accessory field.
    """

    class AccessoryType(TextChoices):
        DETECTOR = (
            "D",
            "Detector",
        )
        COIL = (
            "C",
            "Bobina",
        )
        TRANSDUCER = "T", "Transdutor"
        NONE = "N", "Não se aplica"

    name = models.CharField("Nome", max_length=50)
    accessory_type = models.CharField(
        "Tipo de acessório",
        max_length=1,
        choices=AccessoryType.choices,
        default=AccessoryType.NONE,
    )

    class Meta:
        verbose_name = "Modalidade"
        verbose_name_plural = "Modalidades"


class Equipment(BaseEquipment, models.Model):
    """
    A Django model representing medical equipment.
    This class models medical equipment with various attributes including manufacturer details,
    technical specifications, installation information, and maintenance contact details.
    Attributes:
        unit (ForeignKey): Reference to the Unit where the equipment is located
        manufacturer (str): Equipment manufacturer name
        model (str): Equipment model name
        series_number (str): Equipment serial number
        anvisa_registry (str): ANVISA (Brazilian Health Regulatory Agency) registration number
        modality (ForeignKey): Reference to the Modality of the equipment
        channels (str): Number of channels
        official_max_load (int): Official maximum load capacity
        usual_max_load (int): Usual maximum load capacity
        purchase_installation_date (Date): Date when equipment was purchased/installed
        equipment_photo (ImageField): Photo of the equipment
        label_photo (ImageField): Photo of the equipment label
        maintenance_responsable (str): Name of maintenance responsible person
        email_maintenance_responsable (EmailField): Email of maintenance contact
        phone_maintenance_responsable (str): Phone number of maintenance contact
    Methods:
        client(): Returns the client associated with the equipment's unit
        __str__(): Returns string representation of equipment (manufacturer - model)
    Meta:
        verbose_name (str): Human-readable singular name for the model
        verbose_name_plural (str): Human-readable plural name for the model
    """

    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name="equipments")
    modality = models.ForeignKey(
        Modality, on_delete=models.CASCADE, related_name="equipments"
    )
    anvisa_registry = models.CharField(
        "Registro na ANVISA", max_length=30, blank=True, null=True
    )
    channels = models.CharField("Canais", max_length=10, blank=True, null=True)
    official_max_load = models.IntegerField(
        "Carga máxima oficial", blank=True, null=True
    )
    usual_max_load = models.IntegerField("Carga máxima usual", blank=True, null=True)
    purchase_installation_date = models.DateField(
        "Data de instalação da compra", blank=True, null=True
    )
    maintenance_responsable = models.CharField(
        "Responsável pela manutenção", max_length=50, blank=True, null=True
    )
    email_maintenance_responsable = models.EmailField(
        "E-mail do responsável pela manutenção", blank=True, null=True
    )
    phone_maintenance_responsable = models.CharField(
        "Telefone do responsável pela manutenção", max_length=13, blank=True, null=True
    )

    @admin.display(description="Cliente")
    def client(self):
        try:
            client_display = self.unit.client
        except AttributeError:
            client_display = "-"
        return client_display

    def __str__(self) -> str:
        return f"{self.manufacturer} - {self.model}"

    class Meta:
        verbose_name = "Equipamento"
        verbose_name_plural = "Equipamentos"


class Accessory(BaseEquipment, models.Model):
    """
    A class representing an accessory equipment that can be attached to a main equipment.
    This model inherits from BaseEquipment and represents additional accessories or attachments
    that can be associated with a main equipment piece. Each accessory has a category and is
    linked to a specific equipment.
    Attributes:
        equipment (ForeignKey): Reference to the main Equipment this accessory belongs to
        category (CharField): Category of the accessory, chosen from Modality.AccessoryType choices
    Meta:
        verbose_name (str): Display name for a single instance ("Acessório")
        verbose_name_plural (str): Display name for multiple instances ("Acessórios")
    """

    equipment = models.ForeignKey(
        Equipment, on_delete=models.CASCADE, related_name="accessories"
    )
    category = models.CharField(
        "Categoria", max_length=1, choices=Modality.AccessoryType.choices
    )

    class Meta:
        verbose_name = "Acessório"
        verbose_name_plural = "Acessórios"


class Proposal(models.Model):
    """
    A model representing client proposals in the system.
    This model stores information about business proposals including client details,
    contact information, financial terms, and proposal status.
    Attributes:
        cnpj (CharField): Brazilian company registration number (14 digits)
        state (CharField): State where the institution is located
        city (CharField): City where the institution is located
        contact_name (CharField): Name of the contact person
        contact_phone (CharField): Contact person's phone number
        email (EmailField): Contact person's email address
        date (DateField): Date when the proposal was created
        value (DecimalField): Proposed contract value
        contract_type (CharField): Type of contract
        status (CharField): Current status of the proposal
    Methods:
        approved_client(): Returns True if proposal status is Accepted, False otherwise
        proposal_month(): Returns the month name when proposal was created
    Meta:
        ordering: Orders by date in descending order
        verbose_name: "Proposta"
        verbose_name_plural: "Propostas"
    """

    class Status(TextChoices):
        ACCEPTED = (
            "A",
            "Aceito",
        )
        REJECTED = (
            "R",
            "Rejeitado",
        )
        PENDING = "P", "Pendente"

    class ContractType(TextChoices):
        ANNUAL = (
            "A",
            "Anual",
        )
        MONTHLY = (
            "M",
            "Mensal",
        )
        WEEKLY = "W", "Semanal"

    cnpj = models.CharField("CNPJ", max_length=14, validators=[CNPJValidator()])
    state = models.CharField(
        "Estado da instituição", max_length=2, choices=STATE_CHOICES
    )
    city = models.CharField("Cidade da instituição", max_length=50)
    contact_name = models.CharField("Nome do contato", max_length=50)
    contact_phone = models.CharField("Telefone do contato", max_length=13)
    email = models.EmailField("E-mail do contato")
    date = models.DateField("Data da proposta", default=date.today)
    value = models.DecimalField("Valor proposto", max_digits=10, decimal_places=2)
    contract_type = models.CharField(
        "Tipo de contrato", max_length=1, choices=ContractType.choices
    )
    status = models.CharField(
        max_length=1,
        choices=Status.choices,
        blank=False,
        null=False,
        default=Status.PENDING,
    )

    def approved_client(self):
        if self.status == "A":
            return True
        return False

    @admin.display(description="Mês da Proposta")
    def proposal_month(self):
        month_num = self.date.month
        return _(calendar.month_name[month_num])

    class Meta:
        ordering = ["-date"]
        verbose_name = "Proposta"
        verbose_name_plural = "Propostas"

    def __str__(self) -> str:
        return f"Proposta {self.cnpj} - {self.contact_name}"


class ServiceOrder(models.Model):
    """
    A Django model representing a service order issued for a client's unit.

    Stores the scope to be executed during an on-site visit, including the
    subject, detailed description of the requested work, the involved
    equipments, and the final conclusion.

    Attributes:
        subject (CharField): Short, clear summary of the service order's purpose.
        equipments (ManyToManyField): Equipments related to this order.
        description (TextField): Detailed description of the requested work.
        conclusion (TextField): Summary of the work performed and resolution.
        updates (TextField): A running log of updates and notes for the service order.
    """

    subject = models.CharField(
        "Assunto",
        max_length=50,
    )
    equipments = models.ManyToManyField(
        Equipment,
        related_name="service_orders",
    )
    description = models.TextField(
        "Descrição",
    )
    conclusion = models.TextField(
        "Conclusão",
    )
    updates = models.TextField(
        "Atualização",
        blank=True,
        null=True,
    )

    def __str__(self):
        return self.subject


class Appointment(models.Model):
    """
    A Django model representing an appointment that generates a ServiceOrder.

    Records scheduling and execution details for a specific client unit, including
    status, type (in-person or online), and contact information. Each Appointment
    is linked one-to-one with a ServiceOrder.

    Attributes:
        date (DateTimeField): Scheduled datetime of the appointment.
        type (CharField): Appointment type. One of I (Presencial), O (Online).
        status (CharField): Appointment status. One of P (Pendente), C (Confirmado),
            F (Realizado), U (Não realizado), R (Reagendada).
        justification (TextField): Optional justification for status changes.
        contact_phone (CharField): Contact phone for the attendant at the unit.
        contact_name (CharField): Contact name for the attendant at the unit.
        service_order (OneToOneField): The associated ServiceOrder to be generated.
        unit (ForeignKey): The client Unit where the appointment will occur.

    Properties:
        periodicity (str | None): Contract periodicity derived from the most recent
            approved Proposal for the associated Client. Returns one of the values from
            Proposal.ContractType or None if unavailable.
    """

    class Type(TextChoices):
        IN_PERSON = (
            "I",
            "Presencial",
        )
        ONLINE = (
            "O",
            "Online",
        )

    class Status(TextChoices):
        PENDING = (
            "P",
            "Pendente",
        )
        CONFIRMED = (
            "C",
            "Confirmado",
        )
        FULFILLED = (
            "F",
            "Realizado",
        )
        UNFULFILLED = (
            "U",
            "Não realizado",
        )
        RESCHEDULED = (
            "R",
            "Reagendada",
        )

    date = models.DateTimeField("Data")
    type = models.CharField(
        "Tipo",
        max_length=1,
        choices=Type.choices,
        default=Type.IN_PERSON,
    )
    status = models.CharField(
        "Status",
        max_length=1,
        choices=Status.choices,
        default=Status.PENDING,
    )
    justification = models.TextField(
        "Justificativa",
        blank=True,
        null=True,
    )
    contact_phone = models.CharField(
        "Telefone do contato",
        max_length=13,
    )
    contact_name = models.CharField(
        "Nome do contato",
        max_length=50,
    )
    service_order = models.OneToOneField(
        ServiceOrder,
        on_delete=models.CASCADE,
        related_name="appointment",
        verbose_name="Ordem de Serviço",
        blank=True,
        null=True,
    )
    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        related_name="appointments",
        blank=True,
        null=True,
        verbose_name="Unidade",
    )

    @property
    def periodicity(self) -> str | None:
        """
        Calculates the contract periodicity for this appointment.

        It finds the most recent, approved proposal for the client
        associated with this appointment's unit and returns its contract type.
        Returns None if no such proposal or client is found.
        """
        try:
            client_cnpj = self.unit.client.cnpj
        except AttributeError:
            return None

        latest_approved_proposal = (
            Proposal.objects.filter(cnpj=client_cnpj, status=Proposal.Status.ACCEPTED)
            .order_by("-date")
            .first()
        )

        if latest_approved_proposal:
            return latest_approved_proposal.contract_type

        return None

    class Meta:
        verbose_name = "Agendamento"
        verbose_name_plural = "Agendamentos"

    def __str__(self) -> str:
        return f"Agendamento {self.unit.client.name if self.unit and self.unit.client else 'N/A'} - {self.date.day}"


class Report(models.Model):
    """
    A Django model representing reports in the system.

    This model stores information about various types of reports including quality control,
    training, and safety reports. Each report has specific validation rules based on its type
    and automatic due date calculation.

    Attributes:
        completion_date (DateField): Date when the report was completed
        due_date (DateField): Due date calculated based on report type and completion date
        file (FileField): The report document file
        unit (ForeignKey): Reference to Unit (optional, depends on report type)
        equipment (ForeignKey): Reference to Equipment (optional, depends on report type)
        report_type (CharField): Type of report, chosen from ReportType choices
    """

    class ReportType(TextChoices):
        QUALITY_CONTROL = "CQ", "Controle de Qualidade"
        MONITOR_QUALITY_CONTROL = "CQM", "Controle de Qualidade de Monitores"
        EPI_TEST = "TE", "Teste de EPI"
        RADIOMETRIC_SURVEY = "LR", "Levantamento Radiométrico e Fuga de Cabeçote"
        MEMORIAL = "M", "Memorial"
        RADIOPROTECTION_TRAINING = "TR", "Treinamento de Radioproteção"
        MRI_SAFETY_TRAINING = "TSR", "Treinamento de Segurança em Ressonância Magnética"
        DESIGNATION_ACT = "AD", "Ato de designação"
        DOSE_INVESTIGATION = "ID", "Investigação de dose"
        POP = "POP", "POP"
        OTHERS = "O", "Outros"

    EQUIPMENT_ONLY_TYPES = [
        ReportType.QUALITY_CONTROL,
        ReportType.EPI_TEST,
        ReportType.RADIOMETRIC_SURVEY,
    ]

    UNIT_ONLY_TYPES = [
        ReportType.MONITOR_QUALITY_CONTROL,
        ReportType.MEMORIAL,
        ReportType.RADIOPROTECTION_TRAINING,
        ReportType.MRI_SAFETY_TRAINING,
        ReportType.DESIGNATION_ACT,
        ReportType.DOSE_INVESTIGATION,
        ReportType.POP,
        ReportType.OTHERS,
    ]

    completion_date = models.DateField("Data realizado")
    due_date = models.DateField("Data de vencimento", blank=True, null=True)
    file = models.FileField("Arquivo", upload_to="reports/")
    unit = models.ForeignKey(
        Unit,
        on_delete=models.CASCADE,
        related_name="reports",
        blank=True,
        null=True,
        verbose_name="Unidade",
    )
    equipment = models.ForeignKey(
        Equipment,
        on_delete=models.CASCADE,
        related_name="reports",
        blank=True,
        null=True,
        verbose_name="Equipamento",
    )
    report_type = models.CharField(
        "Tipo",
        max_length=3,
        choices=ReportType.choices,
    )

    def clean(self):
        """
        Validates the Unit/Equipment association based on report type.

        Raises:
            ValidationError: If the wrong association is provided for the report type
        """
        super().clean()

        if self.report_type in self.EQUIPMENT_ONLY_TYPES:
            if not self.equipment:
                raise ValidationError(
                    {
                        "equipment": f'Relatórios do tipo "{
                            self.get_report_type_display()
                        }" devem ter um equipamento associado.'
                    }
                )
            if self.unit:
                raise ValidationError(
                    {
                        "unit": f'Relatórios do tipo "{
                            self.get_report_type_display()
                        }" não devem ter uma unidade associada.'
                    }
                )

        elif self.report_type in self.UNIT_ONLY_TYPES:
            if not self.unit:
                raise ValidationError(
                    {
                        "unit": f'Relatórios do tipo "{
                            self.get_report_type_display()
                        }" devem ter uma unidade associada.'
                    }
                )
            if self.equipment:
                raise ValidationError(
                    {
                        "equipment": f'Relatórios do tipo "{
                            self.get_report_type_display()
                        }" não devem ter um equipamento associado.'
                    }
                )

    def save(self, *args, **kwargs):
        """
        Calculates the due date automatically before saving based on completion date
        and report type.
        """
        if self.completion_date and not self.due_date:
            if self.report_type == self.ReportType.RADIOMETRIC_SURVEY:
                # 4 years validity for Radiometric Survey
                self.due_date = self.completion_date + timedelta(days=4 * 365)
            else:
                # 1 year validity for all other types
                self.due_date = self.completion_date + timedelta(days=365)

        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        entity_name = ""
        if self.unit:
            entity_name = f" - {self.unit.name}"
        elif self.equipment:
            entity_name = f" - {self.equipment}"

        return f"{self.get_report_type_display()}{entity_name} ({self.completion_date})"

    class Meta:
        verbose_name = "Relatório"
        verbose_name_plural = "Relatórios"
        ordering = ["-completion_date"]
