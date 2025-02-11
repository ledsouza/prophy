from datetime import date
from django.db import models
from django.contrib import admin
from django.db.models import TextChoices
from django.utils.translation import gettext as _
from django.utils.html import format_html

from users.models import UserAccount
from clients_management.validators import CNPJValidator

from localflavor.br.br_states import STATE_CHOICES
import calendar


def get_status(operation):
    if operation.operation_status == "A":
        return operation.get_operation_status_display()
    if operation.operation_type == "A":
        return format_html(f"<div style='width: 90px'><b>{operation.get_operation_status_display()}:</b><br>Requisição para adicionar</div>")
    if operation.operation_type == "E":
        return format_html(f"<div style='width: 90px'><b>{operation.get_operation_status_display()}:</b><br>Requisição para editar</div>")
    if operation.operation_type == "D":
        return format_html(f"<div style='width: 90px'><b>{operation.get_operation_status_display()}:</b><br>Requisição para deletar</div>")


class BaseEquipment(models.Model):
    manufacturer = models.CharField("Fabricante", max_length=30)
    model = models.CharField("Modelo", max_length=30)
    series_number = models.CharField(
        "Número de Série", max_length=30, blank=True, null=True)
    equipment_photo = models.ImageField(
        "Foto do equipamento", upload_to="equipments/photos")
    label_photo = models.ImageField(
        "Foto da etiqueta", upload_to="equipments/labels")

    class Meta:
        abstract = True


class Client(models.Model):
    """
    Model representing a client.
    """
    users = models.ManyToManyField(
        UserAccount, related_name="clients", blank=True, verbose_name="Responsáveis")
    cnpj = models.CharField("CNPJ", max_length=14,
                            validators=[CNPJValidator()])
    name = models.CharField("Nome da instituição", max_length=50)
    email = models.EmailField("E-mail da instituição")
    phone = models.CharField(
        "Telefone da instituição", max_length=13)
    address = models.CharField(
        "Endereço da instituição", max_length=150)
    state = models.CharField(
        "Estado da instituição", max_length=2, choices=STATE_CHOICES)
    city = models.CharField(
        "Cidade da instituição", max_length=50)
    active = models.BooleanField("Ativo", default=False)

    @admin.display(description="Responsáveis")
    def responsables(self):
        associated_users = self.users.all()
        associated_users = [f"<strong>{user.get_role_display()}:</strong> {
            user.name}" for user in associated_users]
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
    Model representing a unit of a client.
    """
    user = models.ForeignKey(UserAccount, on_delete=models.SET_NULL,
                             related_name="unit", blank=True, null=True, verbose_name="Gerente de Unidade")
    client = models.ForeignKey(
        Client, on_delete=models.SET_NULL, related_name="units", blank=True, null=True, verbose_name="Cliente")
    name = models.CharField("Nome", max_length=50)
    cnpj = models.CharField("CNPJ", max_length=14,
                            validators=[CNPJValidator()])
    email = models.EmailField("E-mail")
    phone = models.CharField("Telefone", max_length=13)
    address = models.CharField("Endereço", max_length=150)
    state = models.CharField(
        "Estado", max_length=2, choices=STATE_CHOICES, blank=True)
    city = models.CharField("Cidade", max_length=50,
                            blank=True)

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
        DETECTOR = "D", "Detector",
        COIL = "C", "Bobina",
        TRANSDUCER = "T", "Transdutor"
        NONE = "N", "Não se aplica"

    name = models.CharField("Nome", max_length=50)
    accessory_type = models.CharField(
        "Tipo de acessório", max_length=1, choices=AccessoryType.choices, default=AccessoryType.NONE)

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
        modality (str): Equipment modality/type
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

    unit = models.ForeignKey(
        Unit, on_delete=models.CASCADE, related_name="equipments")
    modality = models.ForeignKey(
        Modality, on_delete=models.CASCADE, related_name="equipments")
    anvisa_registry = models.CharField(
        "Registro na ANVISA", max_length=30, blank=True, null=True)
    modality = models.CharField("Modalidade", max_length=50)
    channels = models.CharField("Canais", max_length=10, blank=True, null=True)
    official_max_load = models.IntegerField(
        "Carga máxima oficial", blank=True, null=True)
    usual_max_load = models.IntegerField(
        "Carga máxima usual", blank=True, null=True)
    purchase_installation_date = models.DateField(
        "Data de instalação da compra", blank=True, null=True)
    maintenance_responsable = models.CharField(
        "Responsável pela manutenção", max_length=50, blank=True, null=True)
    email_maintenance_responsable = models.EmailField(
        "E-mail do responsável pela manutenção", blank=True, null=True)
    phone_maintenance_responsable = models.CharField(
        "Telefone do responsável pela manutenção", max_length=13, blank=True, null=True)

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
    equipment = models.ForeignKey(
        Equipment, on_delete=models.CASCADE, related_name="accessories")
    category = models.CharField(
        "Categoria", max_length=1, choices=Modality.AccessoryType.choices)

    class Meta:
        verbose_name = "Acessório"
        verbose_name_plural = "Acessórios"


class Proposal(models.Model):
    """
    This class manages proposals for contracts, tracking client information, contact details,
    and proposal status through its lifecycle.

    Attributes:
        cnpj (str): Brazilian company registration number (14 digits)
        state (str): State where the institution is located (2-letter code)
        city (str): City where the institution is located
        contact_name (str): Name of the primary contact person
        contact_phone (str): Contact person's phone number
        email (str): Contact person's email address
        date (date): Date when the proposal was created (defaults to current date)
        value (decimal): Proposed contract value with 2 decimal places
        contract_type (str): Type of contract ('A' for Annual, 'M' for Monthly)
        status (str): Current status of the proposal ('A' for Accepted, 'R' for Rejected, 'P' for Pending)

    Methods:
        approved_client(): Returns True if the proposal status is 'Accepted', False otherwise
        proposal_month(): Returns the month name of the proposal date in the current locale

    Meta:
        ordering: Ordered by date in descending order
        verbose_name: "Proposta"
        verbose_name_plural: "Propostas"
    """
    STATUS = (
        ("A", "Aceito"),
        ("R", "Rejeitado"),
        ("P", "Pendente"),
    )

    CONTRACT_TYPE = (
        ("A", "Anual"),
        ("M", "Mensal"),
    )

    cnpj = models.CharField("CNPJ", max_length=14, validators=[
                            CNPJValidator()])
    state = models.CharField("Estado da instituição",
                             max_length=2, choices=STATE_CHOICES)
    city = models.CharField("Cidade da instituição",
                            max_length=50)
    contact_name = models.CharField(
        "Nome do contato", max_length=50)
    contact_phone = models.CharField("Telefone do contato", max_length=13)
    email = models.EmailField("E-mail do contato")
    date = models.DateField("Data da proposta", default=date.today)
    value = models.DecimalField(
        "Valor proposto", max_digits=10, decimal_places=2)
    contract_type = models.CharField(
        "Tipo de contrato", max_length=1, choices=CONTRACT_TYPE)
    status = models.CharField(
        max_length=1, choices=STATUS, blank=False, null=False, default="P")

    def approved_client(self):
        if self.status == "A":
            return True
        return False

    @admin.display(description='Mês da Proposta')
    def proposal_month(self):
        month_num = self.date.month
        return _(calendar.month_name[month_num])

    class Meta:
        ordering = ["-date"]
        verbose_name = "Proposta"
        verbose_name_plural = "Propostas"

    def __str__(self) -> str:
        return f"Proposta {self.cnpj} - {self.contact_name}"
